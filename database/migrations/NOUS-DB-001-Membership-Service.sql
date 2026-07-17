-- =====================================================
-- NOUS MEMBERSHIP SERVICE
-- =====================================================

create extension if not exists pgcrypto;


-- =====================================================
-- 1. MEMBERSHIP PLANS
-- Public catalogue of plans offered by Nous
-- =====================================================

create table if not exists public.membership_plans (
    id uuid primary key default gen_random_uuid(),

    code text not null unique,
    name text not null,
    description text,

    price_cents integer not null default 0,
    currency text not null default 'ZAR',

    billing_type text not null default 'once_off'
        check (
            billing_type in (
                'free',
                'once_off',
                'monthly',
                'yearly'
            )
        ),

    duration_days integer,

    is_active boolean not null default true,
    sort_order integer not null default 0,

    features jsonb not null default '[]'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =====================================================
-- 2. USER MEMBERSHIPS
-- One current membership record per user
-- =====================================================

create table if not exists public.memberships (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    plan_id uuid not null
        references public.membership_plans(id),

    status text not null default 'inactive'
        check (
            status in (
                'inactive',
                'pending',
                'active',
                'past_due',
                'cancelled',
                'expired'
            )
        ),

    provider text
        check (
            provider is null
            or provider in (
                'internal',
                'yoco',
                'apple',
                'google'
            )
        ),

    provider_customer_id text,
    provider_payment_id text,

    started_at timestamptz,
    expires_at timestamptz,
    cancelled_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =====================================================
-- 3. PAYMENT ATTEMPTS
-- Tracks every checkout that is created
-- =====================================================

create table if not exists public.payment_attempts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    plan_id uuid not null
        references public.membership_plans(id),

    provider text not null default 'yoco',

    provider_checkout_id text unique,
    provider_payment_id text unique,

    amount_cents integer not null,
    currency text not null default 'ZAR',

    status text not null default 'created'
        check (
            status in (
                'created',
                'pending',
                'succeeded',
                'failed',
                'cancelled',
                'refunded'
            )
        ),

    checkout_url text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz
);


-- =====================================================
-- 4. PAYMENT EVENTS
-- Stores webhook events for audit and duplicate protection
-- =====================================================

create table if not exists public.payment_events (
    id uuid primary key default gen_random_uuid(),

    provider text not null,
    provider_event_id text not null,

    event_type text,
    payload jsonb not null,

    processed boolean not null default false,
    processing_error text,

    received_at timestamptz not null default now(),
    processed_at timestamptz,

    unique (
        provider,
        provider_event_id
    )
);


-- =====================================================
-- INDEXES
-- =====================================================

create index if not exists memberships_user_id_idx
    on public.memberships(user_id);

create index if not exists memberships_status_idx
    on public.memberships(status);

create index if not exists payment_attempts_user_id_idx
    on public.payment_attempts(user_id);

create index if not exists payment_attempts_status_idx
    on public.payment_attempts(status);

create index if not exists payment_attempts_checkout_idx
    on public.payment_attempts(provider_checkout_id);

create index if not exists payment_events_processed_idx
    on public.payment_events(processed);


-- =====================================================
-- UPDATED_AT FUNCTION
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

drop trigger if exists membership_plans_set_updated_at
    on public.membership_plans;

create trigger membership_plans_set_updated_at
before update on public.membership_plans
for each row
execute function public.set_updated_at();


drop trigger if exists memberships_set_updated_at
    on public.memberships;

create trigger memberships_set_updated_at
before update on public.memberships
for each row
execute function public.set_updated_at();


drop trigger if exists payment_attempts_set_updated_at
    on public.payment_attempts;

create trigger payment_attempts_set_updated_at
before update on public.payment_attempts
for each row
execute function public.set_updated_at();


-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.membership_plans
enable row level security;

alter table public.memberships
enable row level security;

alter table public.payment_attempts
enable row level security;

alter table public.payment_events
enable row level security;


-- =====================================================
-- MEMBERSHIP PLAN POLICIES
-- Anyone may view active plans
-- =====================================================

drop policy if exists
"Anyone can view active membership plans"
on public.membership_plans;

create policy
"Anyone can view active membership plans"
on public.membership_plans
for select
to anon, authenticated
using (is_active = true);


-- =====================================================
-- MEMBERSHIP POLICIES
-- Users may only read their own membership
-- =====================================================

drop policy if exists
"Users can view their own membership"
on public.memberships;

create policy
"Users can view their own membership"
on public.memberships
for select
to authenticated
using (
    (select auth.uid()) = user_id
);


-- =====================================================
-- PAYMENT ATTEMPT POLICIES
-- Users may only view their own payment records
-- Insert and update will happen through Edge Functions
-- =====================================================

drop policy if exists
"Users can view their own payment attempts"
on public.payment_attempts;

create policy
"Users can view their own payment attempts"
on public.payment_attempts
for select
to authenticated
using (
    (select auth.uid()) = user_id
);


-- =====================================================
-- NO CLIENT ACCESS TO RAW PAYMENT EVENTS
-- Webhook Edge Function uses backend credentials
-- =====================================================

revoke all
on public.payment_events
from anon, authenticated;


-- =====================================================
-- DEFAULT MEMBERSHIP PLANS
-- Prices can be changed later
-- =====================================================

insert into public.membership_plans (
    code,
    name,
    description,
    price_cents,
    currency,
    billing_type,
    duration_days,
    sort_order,
    features
)
values
(
    'free',
    'Nous Free',
    'Essential access to the Nous platform.',
    0,
    'ZAR',
    'free',
    null,
    1,
    '[
        "Business workspace",
        "Education workspace",
        "Personal workspace",
        "Calendar",
        "Basic platform access"
    ]'::jsonb
),
(
    'companion_early_access',
    'Nous Companion Early Access',
    'Early access to Nous Companion intelligence features.',
    4900,
    'ZAR',
    'once_off',
    30,
    2,
    '[
        "Nous Companion access",
        "Education assistance",
        "Business assistance",
        "Calendar planning",
        "Early platform features"
    ]'::jsonb
),
(
    'companion_monthly',
    'Nous Companion',
    'Monthly access to Nous Companion and premium tools.',
    9900,
    'ZAR',
    'monthly',
    30,
    3,
    '[
        "Nous Companion access",
        "Education AI",
        "Business AI",
        "Calendar planning",
        "Premium platform tools"
    ]'::jsonb
),
(
    'business',
    'Nous Business',
    'Business intelligence and team operating tools.',
    24900,
    'ZAR',
    'monthly',
    30,
    4,
    '[
        "All Companion features",
        "Business intelligence",
        "Team workspaces",
        "Advanced planning",
        "Priority access"
    ]'::jsonb
)
on conflict (code)
do update set
    name = excluded.name,
    description = excluded.description,
    price_cents = excluded.price_cents,
    currency = excluded.currency,
    billing_type = excluded.billing_type,
    duration_days = excluded.duration_days,
    sort_order = excluded.sort_order,
    features = excluded.features,
    is_active = true,
    updated_at = now();
