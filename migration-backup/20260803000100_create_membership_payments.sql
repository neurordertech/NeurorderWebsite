create extension if not exists pgcrypto;

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'ZAR',
  billing_interval text not null default 'month' check (billing_interval in ('month','once')),
  active boolean not null default true,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade an existing membership_plans table created by an older NOUS build.
-- CREATE TABLE IF NOT EXISTS does not add columns to a table that already exists.
alter table public.membership_plans
  add column if not exists billing_interval text;

update public.membership_plans
set billing_interval = 'month'
where billing_interval is null;

alter table public.membership_plans
  alter column billing_interval set default 'month',
  alter column billing_interval set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.membership_plans'::regclass
      and conname = 'membership_plans_billing_interval_check'
  ) then
    alter table public.membership_plans
      add constraint membership_plans_billing_interval_check
      check (billing_interval in ('month', 'once'));
  end if;
end $$;

insert into public.membership_plans (code,name,price_cents,currency,billing_interval,features)
values
 ('free','Free',0,'ZAR','month','["NOUS Companion essentials","Personal environment","Limited usage"]'),
 ('student_beginner','Student & Beginner',3900,'ZAR','month','["Education and Personal","Higher usage limits","Learning support"]'),
 ('business_education','Business & Education',8900,'ZAR','month','["Business and Education","Expanded usage","Organisation tools"]'),
 ('nous_unlimited','NOUS Unlimited',16900,'ZAR','month','["All environments","Highest included usage","Priority features"]')
on conflict (code) do update set name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, billing_interval=excluded.billing_interval, features=excluded.features, active=true, updated_at=now();

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id),
  status text not null default 'pending' check (status in ('pending','active','past_due','cancelled','expired')),
  provider text not null default 'yoco',
  provider_reference text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists memberships_one_current_per_user on public.memberships(user_id) where status in ('pending','active','past_due');

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id),
  checkout_id text unique,
  amount_cents integer not null,
  currency text not null default 'ZAR',
  status text not null default 'created' check (status in ('created','pending','succeeded','failed','cancelled','refunded')),
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payment_attempts enable row level security;

drop policy if exists "plans are publicly readable" on public.membership_plans;
create policy "plans are publicly readable" on public.membership_plans for select using (active = true);
drop policy if exists "users read own membership" on public.memberships;
create policy "users read own membership" on public.memberships for select to authenticated using (auth.uid() = user_id);
drop policy if exists "users read own payments" on public.payment_attempts;
create policy "users read own payments" on public.payment_attempts for select to authenticated using (auth.uid() = user_id);

grant select on public.membership_plans to anon, authenticated;
grant select on public.memberships, public.payment_attempts to authenticated;
