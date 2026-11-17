alter table public.saving_goals add column if not exists fulfilled_at timestamptz;
alter table public.saving_goals add column if not exists fulfilled_ref text;
alter table public.saving_goals add column if not exists fulfilled_by uuid;

revoke update on public.saving_goals from authenticated;
grant update (status) on public.saving_goals to authenticated;
drop policy if exists "own goals pause" on public.saving_goals;
create policy "own goals pause" on public.saving_goals for update to authenticated
  using (auth.uid() = user_id and status in ('active','paused'))
  with check (auth.uid() = user_id and status in ('active','paused'));

create or replace function public.admin_mark_fulfilled(_goal_id uuid, _ref text)
returns void language plpgsql security definer set search_path = public as $$
declare g public.saving_goals;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  if coalesce(length(trim(_ref)), 0) < 4 then raise exception 'Enter the recharge reference number'; end if;
  select * into g from public.saving_goals where id = _goal_id for update;
  if g.id is null then raise exception 'Goal not found'; end if;
  if g.status <> 'completed' or g.saved_amount < g.goal_amount then raise exception 'This saving is not complete yet'; end if;
  if g.fulfilled_at is not null then raise exception 'Already marked as done'; end if;
  update public.saving_goals set fulfilled_at = now(), fulfilled_ref = left(trim(_ref), 60), fulfilled_by = auth.uid() where id = _goal_id;
end $$;
revoke all on function public.admin_mark_fulfilled(uuid, text) from public, anon;
grant execute on function public.admin_mark_fulfilled(uuid, text) to authenticated;