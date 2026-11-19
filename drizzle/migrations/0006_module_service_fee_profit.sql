ALTER TABLE public.saving_goals ADD COLUMN IF NOT EXISTS fee_per_day numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.saving_goals ADD CONSTRAINT saving_goals_fee_nonneg CHECK (fee_per_day >= 0);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fee numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_fee_valid CHECK (fee >= 0 AND fee < amount);
COMMENT ON COLUMN public.saving_goals.fee_per_day IS 'Owner profit added on top of each daily payment; not credited to saved_amount';
COMMENT ON COLUMN public.transactions.fee IS 'Owner profit part of amount; saved_amount is credited amount - fee';
COMMENT ON COLUMN public.products.extra_per_day IS 'DEPRECATED: replaced by per-module fee_* keys in app_config (owner profit, not saved)';

CREATE OR REPLACE FUNCTION public._credit_transaction(_tx_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t public.transactions; s public.streaks; d date; saved numeric;
begin
  select * into t from public.transactions where id=_tx_id for update;
  if t.id is null then raise exception 'Invalid order'; end if;
  if t.payment_status = 'verified' then return; end if;
  d := (t.created_at at time zone 'Asia/Kolkata')::date;
  saved := t.amount - coalesce(t.fee, 0);
  update public.transactions set payment_status='verified', verified_at=now(),
    provider_transaction_id = coalesce(t.utr, 'DEMO'||replace(gen_random_uuid()::text,'-','')) where id=t.id;
  update public.saving_goals set saved_amount=saved_amount+saved,
    status = case when saved_amount+saved >= goal_amount then 'completed' else status end where id=t.goal_id;
  select * into s from public.streaks where user_id=t.user_id;
  if s.user_id is null then insert into public.streaks(user_id,current,best,last_date) values (t.user_id,1,1,d);
  elsif s.last_date >= d then null;
  elsif s.last_date = d - 1 then update public.streaks set current=current+1, best=greatest(best,current+1), last_date=d where user_id=t.user_id;
  else update public.streaks set current=1, last_date=d where user_id=t.user_id; end if;
  select * into s from public.streaks where user_id=t.user_id;
  if s.current in (7,30,100) and not exists (select 1 from public.rewards where user_id=t.user_id and reward_type='streak_'||s.current) then
    insert into public.rewards(user_id,reward_type,title) values (t.user_id,'streak_'||s.current, s.current||'-day saving streak badge');
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_profit_summary()
 RETURNS json
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  return (
    select json_build_object(
      'today', coalesce(sum(fee) filter (where (verified_at at time zone 'Asia/Kolkata')::date = today), 0),
      'month', coalesce(sum(fee) filter (where date_trunc('month', verified_at at time zone 'Asia/Kolkata') = date_trunc('month', today::timestamp)), 0),
      'total', coalesce(sum(fee), 0),
      'payments', count(*) filter (where fee > 0)
    ) from public.transactions where payment_status = 'verified'
  );
end $function$;
REVOKE ALL ON FUNCTION public.admin_profit_summary() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_profit_summary() TO authenticated;

DROP POLICY IF EXISTS "read member cfg" ON public.app_config;
CREATE POLICY "read member cfg" ON public.app_config FOR SELECT TO authenticated
  USING (key = ANY (ARRAY['offer_text','prices_checked_on','recharge_checked_on','custom_min','custom_max',
    'fee_recharge','fee_mobile','fee_laptop','fee_bike','fee_college','fee_custom']));