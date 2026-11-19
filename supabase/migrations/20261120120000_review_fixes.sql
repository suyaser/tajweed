-- Review fixes (docs/08-review-engineering.md): account deletion, invite codes, circle owner tools, tighter grants.

/* ---------- M2: delete my account. Every table references auth.users on delete cascade, so one delete removes all. ---------- */
create function public.delete_me() returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Not signed in.' using errcode = '42501'; end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke execute on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;

/* ---------- M3: invite codes of 60 bits (12 chars of a 32-letter alphabet; 256 % 32 = 0, so no bias) ---------- */
create function private.new_invite_code() returns text
language sql volatile set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(r.b, i) % 32 + 1, 1), '' order by i)
  from (select extensions.gen_random_bytes(12) as b) r, generate_series(0, 11) i
$$;
revoke execute on function private.new_invite_code() from public, anon, authenticated;
alter table public.circles alter column invite_code set default private.new_invite_code();
update public.circles set invite_code = private.new_invite_code(); -- old 8-hex codes (32 bits) stop working

-- Failed joins per user; join_circle refuses after 10 in an hour. Not exposed: no grants.
create table private.join_attempts (
  user_id uuid not null references auth.users on delete cascade,
  at timestamptz not null default now()
);
create index join_attempts_user_at_idx on private.join_attempts (user_id, at);
alter table private.join_attempts enable row level security;

-- Returns null on a wrong code (instead of raising) so the failed attempt row is kept; the client shows one generic message.
create or replace function public.join_circle(p_code text, p_name text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  cid uuid;
  nm text := btrim(coalesce(p_name, ''));
begin
  if me is null then raise exception 'Sign in to join a circle.' using errcode = '42501'; end if;
  if char_length(nm) not between 1 and 40 then raise exception 'Name must be 1 to 40 characters.' using errcode = '22023'; end if;
  delete from private.join_attempts where user_id = me and at < now() - interval '1 hour';
  if (select count(*) from private.join_attempts where user_id = me) >= 10 then
    raise exception 'Too many tries. Wait an hour, then try again.' using errcode = 'P0001';
  end if;
  select id into cid from public.circles where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if cid is null then
    insert into private.join_attempts (user_id) values (me);
    return null;
  end if;
  update public.circle_members set display_name = nm where circle_id = cid and user_id = me;
  if not found then
    insert into public.circle_members (circle_id, user_id, display_name) values (cid, me, nm);
  end if;
  return cid;
end;
$$;

/* ---------- Minor 4: create a circle and its owner's membership in one call ---------- */
create function public.create_circle(p_name text, p_display_name text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  cid uuid;
begin
  if me is null then raise exception 'Sign in to create a circle.' using errcode = '42501'; end if;
  insert into public.circles (name, owner) values (btrim(coalesce(p_name, '')), me) returning id into cid;
  insert into public.circle_members (circle_id, user_id, display_name) values (cid, me, btrim(coalesce(p_display_name, '')));
  return cid;
end;
$$;

/* ---------- M3: owner tools ---------- */
create function public.rotate_invite(p_circle uuid) returns text
language plpgsql security definer set search_path = ''
as $$
declare code text;
begin
  update public.circles set invite_code = private.new_invite_code()
  where id = p_circle and owner = (select auth.uid()) returning invite_code into code;
  if code is null then raise exception 'Only the circle''s owner can change the code.' using errcode = '42501'; end if;
  return code;
end;
$$;

create function public.remove_member(p_circle uuid, p_user uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_user = (select auth.uid()) then raise exception 'The owner cannot remove themselves; delete the circle instead.' using errcode = '22023'; end if;
  if not exists (select 1 from public.circles where id = p_circle and owner = (select auth.uid())) then
    raise exception 'Only the circle''s owner can remove members.' using errcode = '42501';
  end if;
  delete from public.circle_members where circle_id = p_circle and user_id = p_user;
end;
$$;

revoke execute on function public.create_circle(text, text), public.rotate_invite(uuid), public.remove_member(uuid, uuid) from public, anon;
grant execute on function public.create_circle(text, text), public.rotate_invite(uuid), public.remove_member(uuid, uuid) to authenticated;

-- circle_week also returns user_id (the owner needs it to remove a member; members can already read it in circle_members).
drop function public.circle_week(uuid);
create function public.circle_week(p_circle uuid)
returns table (user_id uuid, display_name text, is_me boolean, days date[])
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if not exists (select 1 from public.circle_members m where m.circle_id = p_circle and m.user_id = (select auth.uid())) then
    raise exception 'Not a member of this circle.' using errcode = '42501';
  end if;
  return query
    select m.user_id, m.display_name, m.user_id = (select auth.uid()),
      coalesce(array_agg(a.day order by a.day) filter (where a.day is not null), '{}')
    from public.circle_members m
    left join public.activity a on a.user_id = m.user_id and a.day >= current_date - 7
    where m.circle_id = p_circle
    group by m.user_id, m.display_name, m.joined_at
    order by m.joined_at;
end;
$$;
revoke execute on function public.circle_week(uuid) from public, anon;
grant execute on function public.circle_week(uuid) to authenticated;

/* ---------- Minor 1: circle-mates see only the last 8 days of activity ---------- */
drop policy "activity: own and circle-mates read" on public.activity;
create policy "activity: own and circle-mates read" on public.activity for select to authenticated
  using (user_id = (select auth.uid()) or (day >= current_date - 8 and (select private.shares_circle(user_id))));

/* ---------- Minor 2: insert/update grants on named columns only ---------- */
revoke insert, update on public.user_data from authenticated;
grant insert (user_id, doc, updated_at), update (doc, updated_at) on public.user_data to authenticated;
revoke insert on public.share_links from authenticated;
grant insert (user_id) on public.share_links to authenticated; -- token is always the default
revoke insert on public.activity from authenticated;
grant insert (user_id, day) on public.activity to authenticated;
-- Circles and memberships are created only through create_circle / join_circle now.
revoke insert on public.circles, public.circle_members from authenticated;
drop policy "circles: create own" on public.circles;
drop policy "circle_members: owner adds self" on public.circle_members;

/* ---------- Minor 7: a runaway document cannot fill the database ---------- */
alter table public.user_data add constraint user_data_doc_size check (pg_column_size(doc) < 2000000);

/* ---------- Minor 3: a non-integer step no longer makes shared_progress throw ---------- */
create or replace function public.shared_progress(p_token uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  d jsonb;
  since text := to_char(current_date - 30, 'YYYY-MM-DD');
begin
  select u.doc into d
  from public.share_links s join public.user_data u on u.user_id = s.user_id
  where s.token = p_token and s.revoked_at is null;
  if d is null then return null; end if;

  return jsonb_build_object(
    'teacherName', d #>> '{settings,teacherName}',
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object('lessonId', i ->> 'lessonId', 'on', i ->> 'on', 'step', it.step, 'state', it.state) order by i ->> 'on', i ->> 'at')
      from jsonb_array_elements(case jsonb_typeof(d -> 'introductions') when 'array' then d -> 'introductions' else '[]' end) i
      left join lateral (
        select case when x ->> 'step' ~ '^\d{1,6}$' then (x ->> 'step')::int end as step, x ->> 'state' as state
        from jsonb_array_elements(case jsonb_typeof(d -> 'items') when 'array' then d -> 'items' else '[]' end) x
        where jsonb_typeof(x) = 'object' and x ->> 'kind' = 'lesson' and x ->> 'refId' = i ->> 'lessonId'
        limit 1
      ) it on true
      where jsonb_typeof(i) = 'object'
    ), '[]'),
    'finales', coalesce((
      select jsonb_agg(jsonb_build_object('unitId', f ->> 'unitId', 'on', f ->> 'on') order by f ->> 'on')
      from jsonb_array_elements(case jsonb_typeof(d -> 'finales') when 'array' then d -> 'finales' else '[]' end) f
      where jsonb_typeof(f) = 'object' and f ->> 'unitId' is not null
    ), '[]'),
    'corrections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'verseKey', c ->> 'verseKey', 'word', left(c ->> 'word', 80), 'note', left(c ->> 'note', 500),
        'severity', c ->> 'severity', 'on', coalesce(c ->> 'on', left(c ->> 'createdAt', 10))
      ) order by c ->> 'createdAt')
      from jsonb_array_elements(case jsonb_typeof(d -> 'corrections') when 'array' then d -> 'corrections' else '[]' end) c
      where jsonb_typeof(c) = 'object' and c ->> 'status' = 'open' and c ->> 'deletedAt' is null
    ), '[]'),
    'days', coalesce((
      select jsonb_agg(day order by day) from (
        select x ->> 'id' as day
        from jsonb_array_elements(case jsonb_typeof(d -> 'days') when 'array' then d -> 'days' else '[]' end) x
        where jsonb_typeof(x) = 'object' and jsonb_typeof(x -> 'parts') = 'object' and exists (select 1 from jsonb_each(x -> 'parts') p where p.value <> 'null'::jsonb)
        union
        select a ->> 'on'
        from jsonb_array_elements(case jsonb_typeof(d -> 'attempts') when 'array' then d -> 'attempts' else '[]' end) a
        where jsonb_typeof(a) = 'object'
      ) s where day ~ '^\d{4}-\d{2}-\d{2}$' and day >= since
    ), '[]')
  );
end;
$$;
