create or replace function public.real_upi_enabled()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_config where key='upi_id' and value ~ '^[A-Za-z0-9_.-]{2,255}@[a-zA-Z][A-Za-z0-9_.-]{1,64}$' and value <> 'mba.demo@upi')
$$;