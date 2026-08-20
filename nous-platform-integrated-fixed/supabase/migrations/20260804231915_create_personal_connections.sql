create table if not exists public.nous_consent_grants (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  permission_code text not null,
  purpose text not null,

  status text not null default 'granted'
    check (
      status in (
        'granted',
        'denied',
        'revoked'
      )
    ),

  granted_at timestamptz,
  revoked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (
    user_id,
    permission_code
  )
);

create table if not exists public.nous_external_connections (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  provider_code text not null,
  connection_type text not null,
  account_label text,

  status text not null default 'connected'
    check (
      status in (
        'pending',
        'connected',
        'expired',
        'revoked',
        'error'
      )
    ),

  scopes text[] not null default '{}',
  token_reference text,

  connected_at timestamptz,
  last_synced_at timestamptz,
  revoked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (
    user_id,
    provider_code
  )
);

create table if not exists public.nous_device_registrations (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  device_name text,
  device_type text not null,
  platform text,
  app_version text,

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'revoked'
      )
    ),

  last_seen_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nous_personalisation_signals (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  signal_code text not null,
  signal_value jsonb not null default '{}'::jsonb,
  source text not null,

  confidence numeric(4, 3)
    check (
      confidence is null
      or confidence between 0 and 1
    ),

  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (
    user_id,
    signal_code,
    source
  )
);

alter table public.nous_consent_grants
enable row level security;

alter table public.nous_external_connections
enable row level security;

alter table public.nous_device_registrations
enable row level security;

alter table public.nous_personalisation_signals
enable row level security;

create policy "Users manage their consent grants"
on public.nous_consent_grants
for all
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Users view their external connections"
on public.nous_external_connections
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Users manage their device registrations"
on public.nous_device_registrations
for all
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Users view their personalisation signals"
on public.nous_personalisation_signals
for select
to authenticated
using (
  auth.uid() = user_id
);