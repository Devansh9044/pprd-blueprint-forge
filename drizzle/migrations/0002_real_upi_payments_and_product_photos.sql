alter table public.transactions add column if not exists utr text;
alter table public.transactions add column if not exists submitted_at timestamptz;
alter table public.transactions add column if not exists reviewed_at timestamptz;
alter table public.transactions add column if not exists reviewed_by uuid;
create unique index if not exists transactions_utr_key on public.transactions(utr) where utr is not null;

-- Internal: credit a transaction to its goal + streak (no direct client access)
create or replace function public._credit_transaction(_tx_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare t public.transactions; s public.streaks; d date;
begin
  select * into t from public.transactions where id=_tx_id for update;
  if t.id is null then raise exception 'Invalid order'; end if;
  if t.payment_status = 'verified' then return; end if;
  d := (t.created_at at time zone 'Asia/Kolkata')::date;
  update public.transactions set payment_status='verified', verified_at=now(),
    provider_transaction_id = coalesce(t.utr, 'DEMO'||replace(gen_random_uuid()::text,'-','')) where id=t.id;
  update public.saving_goals set saved_amount=saved_amount+t.amount,
    status = case when saved_amount+t.amount >= goal_amount then 'completed' else status end where id=t.goal_id;
  select * into s from public.streaks where user_id=t.user_id;
  if s.user_id is null then insert into public.streaks(user_id,current,best,last_date) values (t.user_id,1,1,d);
  elsif s.last_date >= d then null;
  elsif s.last_date = d - 1 then update public.streaks set current=current+1, best=greatest(best,current+1), last_date=d where user_id=t.user_id;
  else update public.streaks set current=1, last_date=d where user_id=t.user_id; end if;
  select * into s from public.streaks where user_id=t.user_id;
  if s.current in (7,30,100) and not exists (select 1 from public.rewards where user_id=t.user_id and reward_type='streak_'||s.current) then
    insert into public.rewards(user_id,reward_type,title) values (t.user_id,'streak_'||s.current, s.current||'-day saving streak badge');
  end if;
end $$;
revoke all on function public._credit_transaction(uuid) from public, anon, authenticated;

create or replace function public.real_upi_enabled()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_config where key='upi_id' and value ~ '^[A-Za-z0-9_.-]{2,256}@[a-zA-Z][A-Za-z0-9_.-]{1,64}$' and value <> 'mba.demo@upi')
$$;

create or replace function public.confirm_demo_payment(_order_id text)
returns json language plpgsql security definer set search_path = public as $$
declare t public.transactions;
begin
  if public.real_upi_enabled() then raise exception 'Real payments are on. Enter your UPI reference number instead.'; end if;
  select * into t from public.transactions where provider_order_id=_order_id for update;
  if t.id is null then raise exception 'Invalid order'; end if;
  if t.user_id <> auth.uid() then raise exception 'Not your order'; end if;
  if t.payment_status = 'verified' then return json_build_object('status','already_verified'); end if;
  if t.expires_at < now() then update public.transactions set payment_status='expired' where id=t.id; raise exception 'Order expired'; end if;
  perform public._credit_transaction(t.id);
  return json_build_object('status','verified');
end $$;
grant execute on function public.confirm_demo_payment(text) to authenticated;

create or replace function public.submit_payment_utr(_order_id text, _utr text)
returns json language plpgsql security definer set search_path = public as $$
declare t public.transactions; u text := regexp_replace(coalesce(_utr,''), '\s', '', 'g');
begin
  if u !~ '^[0-9]{12}$' then raise exception 'Enter the 12-digit UPI reference number (UTR)'; end if;
  select * into t from public.transactions where provider_order_id=_order_id for update;
  if t.id is null then raise exception 'Invalid order'; end if;
  if t.user_id <> auth.uid() then raise exception 'Not your order'; end if;
  if t.payment_status not in ('pending','expired') then raise exception 'This payment was already sent for checking'; end if;
  if t.created_at < now() - interval '24 hours' then raise exception 'This order is too old. Start a new payment.'; end if;
  if exists (select 1 from public.transactions where utr=u) then raise exception 'This UPI reference number was already used'; end if;
  update public.transactions set utr=u, payment_status='submitted', submitted_at=now(), payment_provider='upi' where id=t.id;
  return json_build_object('status','submitted');
end $$;
grant execute on function public.submit_payment_utr(text, text) to authenticated;

create or replace function public.admin_review_payment(_tx_id uuid, _approve boolean)
returns json language plpgsql security definer set search_path = public as $$
declare t public.transactions;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  select * into t from public.transactions where id=_tx_id for update;
  if t.id is null then raise exception 'Payment not found'; end if;
  if t.payment_status <> 'submitted' then raise exception 'Only submitted payments can be reviewed'; end if;
  update public.transactions set reviewed_at=now(), reviewed_by=auth.uid() where id=t.id;
  if _approve then perform public._credit_transaction(t.id);
  else update public.transactions set payment_status='rejected' where id=t.id; end if;
  return json_build_object('status', case when _approve then 'verified' else 'rejected' end);
end $$;
grant execute on function public.admin_review_payment(uuid, boolean) to authenticated;

create policy "product images read" on storage.objects for select to authenticated using (bucket_id='product-images');
create policy "product images admin insert" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
create policy "product images admin update" on storage.objects for update to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
create policy "product images admin delete" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));