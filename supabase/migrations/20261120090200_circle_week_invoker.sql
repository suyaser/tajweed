-- Advisor 0029: circle_week needs no elevated rights; RLS already lets a member read the circle's members and their activity.
alter function public.circle_week(uuid) security invoker;
