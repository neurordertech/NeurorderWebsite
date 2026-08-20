-- NOUS organisation identity and CHKI partner access layer
create extension if not exists pgcrypto;

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organisation_type text not null check (organisation_type in ('healthcare','library','technology','foundation','education','other')),
  status text not null default 'pending' check (status in ('pending','approved','suspended','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.organisation_domains (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  domain text not null unique,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  verified_at timestamptz,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  role text not null default 'partner_member',
  status text not null default 'pending' check (status in ('pending','active','suspended','revoked')),
  joined_at timestamptz not null default now(),
  unique(user_id, organisation_id)
);

create table if not exists public.programme_partner_access (
  id uuid primary key default gen_random_uuid(),
  programme_slug text not null,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  access_level text not null default 'partner' check (access_level in ('observer','partner','administrator')),
  status text not null default 'pending' check (status in ('pending','active','suspended','revoked')),
  approved_at timestamptz,
  unique(programme_slug, organisation_id)
);

alter table public.organisations enable row level security;
alter table public.organisation_domains enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.programme_partner_access enable row level security;

create policy "members read their organisations" on public.organisations for select to authenticated
using (exists(select 1 from public.organisation_memberships m where m.organisation_id=id and m.user_id=auth.uid() and m.status='active'));
create policy "members read own memberships" on public.organisation_memberships for select to authenticated using(user_id=auth.uid());
create policy "members read programme access" on public.programme_partner_access for select to authenticated
using(exists(select 1 from public.organisation_memberships m where m.organisation_id=programme_partner_access.organisation_id and m.user_id=auth.uid() and m.status='active'));

create or replace function public.get_my_programme_access(requested_programme text)
returns table(organisation_id uuid, organisation_name text, organisation_slug text, membership_role text, access_level text)
language sql security definer set search_path=public stable as $$
  select o.id,o.name,o.slug,m.role,p.access_level
  from public.organisation_memberships m
  join public.organisations o on o.id=m.organisation_id
  join public.programme_partner_access p on p.organisation_id=o.id
  where m.user_id=auth.uid() and m.status='active' and o.status='approved'
    and p.programme_slug=requested_programme and p.status='active';
$$;
revoke all on function public.get_my_programme_access(text) from public;
grant execute on function public.get_my_programme_access(text) to authenticated;

-- Seed proposal-stage organisations. Verify domains before adding them.
insert into public.organisations(name,slug,organisation_type,status) values
('NEURORDER (Pty) Ltd.','neurorder','technology','approved'),
('iNtsikelelo Foundation','intsikelelo-foundation','foundation','approved'),
('Cure Day Hospitals','cure-day-hospitals','healthcare','pending'),
('Nitefalls Medical','nitefalls-medical','healthcare','pending'),
('Observatory Library','observatory-library','library','pending')
on conflict(slug) do nothing;
