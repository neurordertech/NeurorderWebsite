-- ============================================================
-- NOUS CORE 001
-- Identity, Profile and Permission Foundation
-- ============================================================

-- ------------------------------------------------------------
-- 1. NOUS USER PROFILE
-- Extends Supabase Auth with NOUS-specific identity information.
-- Passwords remain managed securely by Supabase Auth.
-- ------------------------------------------------------------

create table public.nous_profiles (
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    display_name text,
    preferred_name text,
    avatar_url text,

    current_space text not null default 'personal'
        check (
            current_space in (
                'personal',
                'education',
                'business',
                'research'
            )
        ),

    onboarding_completed boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.nous_profiles is
'The primary NOUS profile connected to a Supabase Auth user.';


-- ------------------------------------------------------------
-- 2. USER PERMISSIONS
-- Records what the user has explicitly allowed NOUS to access.
-- This prepares the platform for Calendar, Clock, Location,
-- Widgets, AIoT and other future integrations.
-- ------------------------------------------------------------

create table public.nous_permissions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    capability text not null
        check (
            capability in (
                'calendar',
                'clock',
                'notifications',
                'microphone',
                'location',
                'navigation',
                'contacts',
                'messages',
                'camera',
                'files',
                'wearables',
                'smart_home',
                'vehicle',
                'financial_data'
            )
        ),

    access_level text not null default 'none'
        check (
            access_level in (
                'none',
                'ask',
                'read',
                'write',
                'read_write'
            )
        ),

    consent_status text not null default 'not_requested'
        check (
            consent_status in (
                'not_requested',
                'granted',
                'denied',
                'revoked'
            )
        ),

    granted_at timestamptz,
    revoked_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id, capability)
);

comment on table public.nous_permissions is
'User-controlled permissions for NOUS features, services and connected devices.';


-- ------------------------------------------------------------
-- 3. UPDATED-AT FUNCTION
-- Automatically updates timestamps when records change.
-- ------------------------------------------------------------

create or replace function public.set_nous_updated_at()
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

create trigger set_nous_profiles_updated_at
before update on public.nous_profiles
for each row
execute function public.set_nous_updated_at();

create trigger set_nous_permissions_updated_at
before update on public.nous_permissions
for each row
execute function public.set_nous_updated_at();


-- ------------------------------------------------------------
-- 4. AUTOMATIC PROFILE CREATION
-- Creates a NOUS profile after a new Supabase Auth signup.
-- ------------------------------------------------------------

create or replace function public.create_nous_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.nous_profiles (
        id,
        display_name,
        preferred_name,
        avatar_url
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name'
        ),
        new.raw_user_meta_data ->> 'preferred_name',
        new.raw_user_meta_data ->> 'avatar_url'
    );

    return new;
end;
$$;

create trigger create_nous_profile_after_signup
after insert on auth.users
for each row
execute function public.create_nous_profile();


-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- Each authenticated user can access only their own data.
-- ------------------------------------------------------------

alter table public.nous_profiles enable row level security;
alter table public.nous_permissions enable row level security;


-- Profile policies

create policy "Users can read their own NOUS profile"
on public.nous_profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own NOUS profile"
on public.nous_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);


-- Permission policies

create policy "Users can read their own permissions"
on public.nous_permissions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own permissions"
on public.nous_permissions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own permissions"
on public.nous_permissions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own permissions"
on public.nous_permissions
for delete
to authenticated
using ((select auth.uid()) = user_id);


-- ------------------------------------------------------------
-- 6. INDEXES
-- Improve permission lookups for the Presence Layer and ROS.
-- ------------------------------------------------------------

create index nous_permissions_user_id_idx
on public.nous_permissions(user_id);

create index nous_permissions_user_capability_idx
on public.nous_permissions(user_id, capability);