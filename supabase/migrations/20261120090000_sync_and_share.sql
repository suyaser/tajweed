-- R3: one synced UserData document per user, and a revocable read-only teacher link.
-- Spec: docs/09-v2-spec.md §6. Every table has RLS; anon gets nothing but the shared_progress function.

create table public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  doc jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
revoke all on public.user_data from anon, authenticated;
grant select, insert, update, delete on public.user_data to authenticated;

create policy "user_data: owner reads" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_data: owner inserts" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_data: owner updates" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_data: owner deletes" on public.user_data for delete to authenticated using ((select auth.uid()) = user_id);

create table public.share_links (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index share_links_user_id_idx on public.share_links (user_id);
alter table public.share_links enable row level security;
revoke all on public.share_links from anon, authenticated;
grant select, insert, delete on public.share_links to authenticated;
grant update (revoked_at) on public.share_links to authenticated; -- revoke only; the token and owner never change

create policy "share_links: owner reads" on public.share_links for select to authenticated using ((select auth.uid()) = user_id);
create policy "share_links: owner inserts" on public.share_links for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "share_links: owner revokes" on public.share_links for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "share_links: owner deletes" on public.share_links for delete to authenticated using ((select auth.uid()) = user_id);

-- Read-only summary for a teacher. Never returns the whole doc: only the fields picked here.
create function public.shared_progress(p_token uuid) returns jsonb
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
        select (x ->> 'step')::int as step, x ->> 'state' as state
        from jsonb_array_elements(case jsonb_typeof(d -> 'items') when 'array' then d -> 'items' else '[]' end) x
        where x ->> 'kind' = 'lesson' and x ->> 'refId' = i ->> 'lessonId' and jsonb_typeof(x -> 'step') = 'number'
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
        where jsonb_typeof(x -> 'parts') = 'object' and exists (select 1 from jsonb_each(x -> 'parts') p where p.value <> 'null'::jsonb)
        union
        select a ->> 'on'
        from jsonb_array_elements(case jsonb_typeof(d -> 'attempts') when 'array' then d -> 'attempts' else '[]' end) a
        where jsonb_typeof(a) = 'object'
      ) s where day ~ '^\d{4}-\d{2}-\d{2}$' and day >= since
    ), '[]')
  );
end;
$$;
revoke execute on function public.shared_progress(uuid) from public;
grant execute on function public.shared_progress(uuid) to anon, authenticated;
