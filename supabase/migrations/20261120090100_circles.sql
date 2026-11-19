-- R3: private circles (حلقة). Members see who studied which day this week. No scores, no ranks, no public listing.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);
create index circles_owner_idx on public.circles (owner);

create table public.circle_members (
  circle_id uuid not null references public.circles on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index circle_members_user_id_idx on public.circle_members (user_id);

create table public.activity (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null,
  primary key (user_id, day)
);

-- Membership check outside the exposed schema, so policies on circle_members do not recurse.
create function private.is_member(p_circle uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.circle_members where circle_id = p_circle and user_id = (select auth.uid())) $$;
create function private.shares_circle(p_user uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.circle_members a join public.circle_members b on a.circle_id = b.circle_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user
  )
$$;
revoke execute on all functions in schema private from public, anon;
grant execute on function private.is_member(uuid), private.shares_circle(uuid) to authenticated;

-- At most 20 members per circle. Locks the circle row so two joins cannot both take the last seat.
create function private.cap_circle() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.circles where id = new.circle_id for update;
  if (select count(*) from public.circle_members where circle_id = new.circle_id) >= 20 then
    raise exception 'This circle is full (20 members).' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function private.cap_circle() from public, anon, authenticated;
create trigger circle_members_cap before insert on public.circle_members for each row execute function private.cap_circle();

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.activity enable row level security;
revoke all on public.circles, public.circle_members, public.activity from anon, authenticated;
grant select, insert, delete on public.circles to authenticated;
grant update (name) on public.circles to authenticated; -- owner renames; owner and invite code never change
grant select, insert, delete on public.circle_members to authenticated;
grant update (display_name) on public.circle_members to authenticated;
grant select, insert, delete on public.activity to authenticated;

create policy "circles: members read" on public.circles for select to authenticated
  using (owner = (select auth.uid()) or (select private.is_member(id)));
create policy "circles: create own" on public.circles for insert to authenticated with check (owner = (select auth.uid()));
create policy "circles: owner renames" on public.circles for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "circles: owner deletes" on public.circles for delete to authenticated using (owner = (select auth.uid()));

create policy "circle_members: members read" on public.circle_members for select to authenticated
  using ((select private.is_member(circle_id)));
-- Others join only through join_circle (needs the code); a direct insert is allowed for the circle's owner only.
create policy "circle_members: owner adds self" on public.circle_members for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.circles c where c.id = circle_id and c.owner = (select auth.uid())));
create policy "circle_members: rename self" on public.circle_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "circle_members: leave" on public.circle_members for delete to authenticated using (user_id = (select auth.uid()));

create policy "activity: own and circle-mates read" on public.activity for select to authenticated
  using (user_id = (select auth.uid()) or (select private.shares_circle(user_id)));
-- Today only (±1 day for time zones): no back-filling a week of dots.
create policy "activity: record own" on public.activity for insert to authenticated
  with check (user_id = (select auth.uid()) and day between current_date - 1 and current_date + 1);
create policy "activity: delete own" on public.activity for delete to authenticated using (user_id = (select auth.uid()));

create function public.join_circle(p_code text, p_name text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  cid uuid;
  nm text := btrim(coalesce(p_name, ''));
begin
  if me is null then raise exception 'Sign in to join a circle.' using errcode = '42501'; end if;
  if char_length(nm) not between 1 and 40 then raise exception 'Name must be 1 to 40 characters.' using errcode = '22023'; end if;
  select id into cid from public.circles where invite_code = upper(btrim(coalesce(p_code, '')));
  if cid is null then raise exception 'No circle has this code.' using errcode = 'P0002'; end if;
  update public.circle_members set display_name = nm where circle_id = cid and user_id = me;
  if not found then
    insert into public.circle_members (circle_id, user_id, display_name) values (cid, me, nm);
  end if;
  return cid;
end;
$$;

-- Each member's studied days in the last 7 days (8 calendar days, so every time zone sees its own week).
create function public.circle_week(p_circle uuid)
returns table (display_name text, is_me boolean, days date[])
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.circle_members where circle_id = p_circle and user_id = (select auth.uid())) then
    raise exception 'Not a member of this circle.' using errcode = '42501';
  end if;
  return query
    select m.display_name, m.user_id = (select auth.uid()),
      coalesce(array_agg(a.day order by a.day) filter (where a.day is not null), '{}')
    from public.circle_members m
    left join public.activity a on a.user_id = m.user_id and a.day >= current_date - 7
    where m.circle_id = p_circle
    group by m.user_id, m.display_name, m.joined_at
    order by m.joined_at;
end;
$$;

revoke execute on function public.join_circle(text, text), public.circle_week(uuid) from public, anon;
grant execute on function public.join_circle(text, text), public.circle_week(uuid) to authenticated;
