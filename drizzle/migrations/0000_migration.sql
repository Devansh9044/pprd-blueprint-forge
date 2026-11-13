create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, mobile_number text, language text not null default 'en',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null, unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid()=id or public.has_role(auth.uid(),'admin'));
create policy "own profile upd" on public.profiles for update to authenticated using (auth.uid()=id);
create policy "own profile ins" on public.profiles for insert to authenticated with check (auth.uid()=id);
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid()=user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, mobile_number) values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'mobile_number');
  insert into public.user_roles(user_id, role) values (new.id, 'user');
  if (select count(*) from auth.users) = 1 then insert into public.user_roles(user_id, role) values (new.id, 'admin'); end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  module text not null, brand text not null, name text not null, variant text,
  price numeric(12,2) not null, extra_per_day numeric(8,2) not null default 0,
  duration_days int not null default 365, display_daily numeric(10,2),
  pending boolean not null default false,
  image_url text, enabled boolean not null default true, sort int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "read enabled" on public.products for select to anon, authenticated using (enabled or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.app_config (key text primary key, value text not null, updated_at timestamptz not null default now());
grant select on public.app_config to anon;
grant select, insert, update on public.app_config to authenticated;
grant all on public.app_config to service_role;
alter table public.app_config enable row level security;
create policy "read cfg" on public.app_config for select to anon, authenticated using (true);
create policy "admin cfg" on public.app_config for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.saving_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, module text not null, product_id uuid,
  goal_name text not null, goal_amount numeric(12,2) not null, saved_amount numeric(12,2) not null default 0,
  daily_saving numeric(10,2) not null, meta jsonb not null default '{}',
  start_date date not null default current_date, end_date date,
  status text not null default 'active', created_at timestamptz not null default now()
);
create index on public.saving_goals(user_id);
grant select, update on public.saving_goals to authenticated;
grant all on public.saving_goals to service_role;
alter table public.saving_goals enable row level security;
create policy "own goals" on public.saving_goals for select to authenticated using (auth.uid()=user_id or public.has_role(auth.uid(),'admin'));
create policy "own goals pause" on public.saving_goals for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, goal_id uuid not null,
  provider_order_id text not null unique, provider_transaction_id text unique,
  payment_provider text not null default 'demo-upi',
  amount numeric(10,2) not null, payment_status text not null default 'pending',
  expires_at timestamptz not null default now() + interval '15 minutes',
  verified_at timestamptz, created_at timestamptz not null default now()
);
create index on public.transactions(user_id);
grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own tx" on public.transactions for select to authenticated using (auth.uid()=user_id or public.has_role(auth.uid(),'admin'));

create table public.streaks (user_id uuid primary key, current int not null default 0, best int not null default 0, last_date date);
grant select on public.streaks to authenticated;
grant all on public.streaks to service_role;
alter table public.streaks enable row level security;
create policy "own streak" on public.streaks for select to authenticated using (auth.uid()=user_id);

create table public.rewards (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  reward_type text not null, title text not null, reward_status text not null default 'unlocked',
  expiry_date date, redeemed_at timestamptz, created_at timestamptz not null default now()
);
grant select on public.rewards to authenticated;
grant all on public.rewards to service_role;
alter table public.rewards enable row level security;
create policy "own rewards" on public.rewards for select to authenticated using (auth.uid()=user_id);

-- Secure demo payment confirmation (idempotent)
create or replace function public.confirm_demo_payment(_order_id text)
returns json language plpgsql security definer set search_path = public as $$
declare t public.transactions; g public.saving_goals; s public.streaks; today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  select * into t from public.transactions where provider_order_id=_order_id for update;
  if t.id is null then raise exception 'Invalid order'; end if;
  if t.user_id <> auth.uid() then raise exception 'Not your order'; end if;
  if t.payment_status = 'verified' then return json_build_object('status','already_verified'); end if;
  if t.expires_at < now() then update public.transactions set payment_status='expired' where id=t.id; raise exception 'Order expired'; end if;
  select * into g from public.saving_goals where id=t.goal_id for update;
  if g.user_id <> auth.uid() then raise exception 'Not your goal'; end if;
  update public.transactions set payment_status='verified', verified_at=now(), provider_transaction_id='DEMO'||replace(gen_random_uuid()::text,'-','') where id=t.id;
  update public.saving_goals set saved_amount=saved_amount+t.amount,
    status = case when saved_amount+t.amount >= goal_amount then 'completed' else status end where id=g.id;
  select * into s from public.streaks where user_id=auth.uid();
  if s.user_id is null then insert into public.streaks(user_id,current,best,last_date) values (auth.uid(),1,1,today);
  elsif s.last_date = today then null;
  elsif s.last_date = today - 1 then update public.streaks set current=current+1, best=greatest(best,current+1), last_date=today where user_id=auth.uid();
  else update public.streaks set current=1, last_date=today where user_id=auth.uid(); end if;
  select * into s from public.streaks where user_id=auth.uid();
  if s.current in (7,30,100) and not exists (select 1 from public.rewards where user_id=auth.uid() and reward_type='streak_'||s.current) then
    insert into public.rewards(user_id,reward_type,title) values (auth.uid(),'streak_'||s.current, s.current||'-day saving streak badge');
  end if;
  return json_build_object('status','verified');
end $$;
grant execute on function public.confirm_demo_payment(text) to authenticated;

insert into public.app_config(key,value) values
 ('custom_min','10'),('custom_max','10000'),
 ('offer_text','First 1,000 downloads: 100 winners may receive their next recharge (28/56/84 days) free after current recharge expires, usable on own or eligible family number. Proposed promotional campaign — not a guaranteed recharge. Subject to final terms and legal review.');

insert into public.products(module,brand,name,variant,price,extra_per_day,duration_days,display_daily,pending,sort) values
 ('recharge','28 Days','1.5 GB/day','28',378,0,28,13.50,true,1),
 ('recharge','28 Days','2 GB/day','28',377.16,0,28,13.47,true,2),
 ('recharge','56 Days','1.5 GB/day','56',604.80,0,56,10.80,false,3),
 ('recharge','56 Days','2 GB/day','56',660.80,0,56,11.80,false,4),
 ('recharge','84 Days','1.5 GB/day','84',940.80,0,84,11.20,false,5),
 ('recharge','84 Days','2 GB/day','84',1008,0,84,12.00,false,6),
 ('android','Samsung','Galaxy S25 Ultra','256 GB',100000,0,365,280,false,1),
 ('android','Google Pixel','Pixel 10 Pro','256 GB',100000,0,365,280,false,2),
 ('android','OnePlus','OnePlus 13','256 GB',100000,0,365,280,false,3),
 ('android','Vivo','Vivo X200 Pro','256 GB',100000,0,365,280,false,4),
 ('android','Oppo','Find X8 Pro','256 GB',100000,0,365,280,false,5),
 ('iphone','Apple','iPhone 16','128 GB',69900,1,365,null,false,1),
 ('iphone','Apple','iPhone 16 Plus','128 GB',79900,1,365,null,false,2),
 ('iphone','Apple','iPhone 16 Pro','128 GB',119900,1,365,null,false,3),
 ('iphone','Apple','iPhone 16 Pro Max','256 GB',144900,1,365,null,false,4),
 ('iphone','Apple','iPhone 17','256 GB',82900,1,365,null,false,5),
 ('iphone','Apple','iPhone 17 Air','256 GB',119900,1,365,null,false,6),
 ('iphone','Apple','iPhone 17 Pro','256 GB',134900,1,365,null,false,7),
 ('iphone','Apple','iPhone 18 Pro','256 GB',139900,1,365,null,false,8),
 ('iphone','Apple','iPhone 18 Pro Max','256 GB',159900,1,365,null,false,9),
 ('laptop','MacBook','MacBook Air M3','8 GB / 256 GB',70000,1,365,null,false,1),
 ('laptop','HP','HP Pavilion 15','16 GB / 512 GB',62000,1,365,null,false,2),
 ('laptop','ASUS VivoBook','ASUS VivoBook 15','16 GB / 512 GB',55000,1,365,null,false,3),
 ('bike','Royal Enfield','Bullet 350','Ex-showroom',175000,0,365,null,false,1),
 ('bike','Hero','Splendor Plus','Ex-showroom',75000,0,365,null,false,2),
 ('bike','Bajaj','Platina 110','Ex-showroom',78000,0,365,null,false,3),
 ('bike','TVS','Apache RTR 160','Ex-showroom',125000,0,365,null,false,4),
 ('bike','Bajaj','Pulsar NS200','Ex-showroom',158000,0,365,null,false,5),
 ('college','College','Starter','₹49 + ₹1',49,1,365,null,false,1),
 ('college','College','Plus','₹100 + ₹1',100,1,365,null,false,2),
 ('college','College','Pro','₹199 + ₹1',199,1,365,null,false,3);