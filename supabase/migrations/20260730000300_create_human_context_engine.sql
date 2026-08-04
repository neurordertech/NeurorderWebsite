-- ============================================================
-- NOUS CORE 003
-- Human Context Engine
--
-- Purpose:
-- Store user-controlled context that helps NOUS understand
-- goals, projects, preferences, routines and life environments.
-- ============================================================


-- ------------------------------------------------------------
-- 1. CONTEXT RECORDS
--
-- A context record represents one meaningful part of the user's
-- life or working environment.
--
-- Examples:
-- - "Complete Mathematics assignment"
-- - "Building the NOUS Platform"
-- - "Prefers step-by-step explanations"
-- - "Usually attends lectures on weekday mornings"
-- ------------------------------------------------------------

create table public.nous_context_records (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    context_type text not null
        check (
            context_type in (
                'goal',
                'project',
                'preference',
                'routine',
                'interest',
                'environment',
                'education',
                'business',
                'personal',
                'research',
                'relationship',
                'responsibility',
                'constraint',
                'other'
            )
        ),

    title text not null,
    description text,

    context_data jsonb not null default '{}'::jsonb,

    status text not null default 'active'
        check (
            status in (
                'active',
                'paused',
                'completed',
                'archived'
            )
        ),

    importance text not null default 'normal'
        check (
            importance in (
                'low',
                'normal',
                'high',
                'critical'
            )
        ),

    valid_from timestamptz,
    valid_until timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.nous_context_records is
'User-controlled goals, projects, preferences, routines and other meaningful human context.';

comment on column public.nous_context_records.context_data is
'Structured supporting information for a context record without requiring a new database column for every context type.';


-- ------------------------------------------------------------
-- 2. CONTEXT CLAIMS
--
-- A claim is a specific statement associated with a context
-- record.
--
-- Examples:
-- - "The user prefers beginner-friendly explanations."
-- - "The NOUS Platform is targeted for mobile deployment."
--
-- Claims distinguish between:
-- - information directly provided by the user;
-- - system observations;
-- - AI-generated inferences.
-- ------------------------------------------------------------

create table public.nous_context_claims (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    context_record_id uuid
        references public.nous_context_records(id)
        on delete cascade,

    claim text not null,

    source_type text not null
        check (
            source_type in (
                'user',
                'system',
                'inference',
                'connected_service'
            )
        ),

    confidence numeric(5,4)
        check (
            confidence is null
            or (
                confidence >= 0
                and confidence <= 1
            )
        ),

    verification_status text not null default 'unverified'
        check (
            verification_status in (
                'unverified',
                'user_confirmed',
                'system_verified',
                'user_rejected'
            )
        ),

    is_sensitive boolean not null default false,
    is_active boolean not null default true,

    source_reference text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.nous_context_claims is
'Individual contextual statements with transparent source, confidence and verification status.';

comment on column public.nous_context_claims.confidence is
'Optional confidence score from 0 to 1. Intended primarily for inferred or system-observed claims.';

comment on column public.nous_context_claims.source_reference is
'Optional reference to the originating message, event, service or system record.';


-- ------------------------------------------------------------
-- 3. CONTEXT CONSENT
--
-- Controls whether a context record may be used by particular
-- areas of NOUS.
--
-- This prevents one area of a person's life from automatically
-- flowing into another.
-- ------------------------------------------------------------

create table public.nous_context_access (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    context_record_id uuid not null
        references public.nous_context_records(id)
        on delete cascade,

    purpose text not null
        check (
            purpose in (
                'companion',
                'calendar',
                'education',
                'business',
                'research',
                'personal',
                'notifications',
                'navigation',
                'aiot',
                'financial_infrastructure'
            )
        ),

    access_status text not null default 'denied'
        check (
            access_status in (
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
        context_record_id,
        purpose
    )
);

comment on table public.nous_context_access is
'Purpose-specific permission controlling where each context record may be used.';


-- ------------------------------------------------------------
-- 4. CONTEXT RELATIONSHIPS
--
-- Connects pieces of context without merging them.
--
-- Examples:
-- - A project supports a goal.
-- - A routine belongs to an education context.
-- - A constraint affects a project.
-- ------------------------------------------------------------

create table public.nous_context_relationships (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    source_context_id uuid not null
        references public.nous_context_records(id)
        on delete cascade,

    target_context_id uuid not null
        references public.nous_context_records(id)
        on delete cascade,

    relationship_type text not null
        check (
            relationship_type in (
                'supports',
                'depends_on',
                'belongs_to',
                'conflicts_with',
                'influences',
                'blocks',
                'related_to'
            )
        ),

    created_at timestamptz not null default now(),

    check (
        source_context_id <> target_context_id
    ),

    unique (
        source_context_id,
        target_context_id,
        relationship_type
    )
);

comment on table public.nous_context_relationships is
'Graph-like relationships between goals, projects, routines, constraints and other context records.';


-- ------------------------------------------------------------
-- 5. UPDATED-AT TRIGGERS
--
-- Reuses public.set_nous_updated_at() from NOUS Core 001.
-- ------------------------------------------------------------

create trigger set_nous_context_records_updated_at
before update on public.nous_context_records
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_context_claims_updated_at
before update on public.nous_context_claims
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_context_access_updated_at
before update on public.nous_context_access
for each row
execute function public.set_nous_updated_at();


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.nous_context_records enable row level security;
alter table public.nous_context_claims enable row level security;
alter table public.nous_context_access enable row level security;
alter table public.nous_context_relationships enable row level security;


-- ------------------------------------------------------------
-- 7. CONTEXT RECORD POLICIES
-- ------------------------------------------------------------

create policy "Users can read their own context records"
on public.nous_context_records
for select
to authenticated
using (
    (select auth.uid()) = user_id
);


create policy "Users can create their own context records"
on public.nous_context_records
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
);


create policy "Users can update their own context records"
on public.nous_context_records
for update
to authenticated
using (
    (select auth.uid()) = user_id
)
with check (
    (select auth.uid()) = user_id
);


create policy "Users can delete their own context records"
on public.nous_context_records
for delete
to authenticated
using (
    (select auth.uid()) = user_id
);


-- ------------------------------------------------------------
-- 8. CONTEXT CLAIM POLICIES
-- ------------------------------------------------------------

create policy "Users can read their own context claims"
on public.nous_context_claims
for select
to authenticated
using (
    (select auth.uid()) = user_id
);


create policy "Users can create claims for their own context"
on public.nous_context_claims
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
    and (
        context_record_id is null
        or exists (
            select 1
            from public.nous_context_records
            where nous_context_records.id = context_record_id
              and nous_context_records.user_id =
                  (select auth.uid())
        )
    )
);


create policy "Users can update their own context claims"
on public.nous_context_claims
for update
to authenticated
using (
    (select auth.uid()) = user_id
)
with check (
    (select auth.uid()) = user_id
);


create policy "Users can delete their own context claims"
on public.nous_context_claims
for delete
to authenticated
using (
    (select auth.uid()) = user_id
);


-- ------------------------------------------------------------
-- 9. CONTEXT ACCESS POLICIES
-- ------------------------------------------------------------

create policy "Users can read their own context access rules"
on public.nous_context_access
for select
to authenticated
using (
    (select auth.uid()) = user_id
);


create policy "Users can create access rules for their context"
on public.nous_context_access
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
    and exists (
        select 1
        from public.nous_context_records
        where nous_context_records.id = context_record_id
          and nous_context_records.user_id =
              (select auth.uid())
    )
);


create policy "Users can update their own context access rules"
on public.nous_context_access
for update
to authenticated
using (
    (select auth.uid()) = user_id
)
with check (
    (select auth.uid()) = user_id
);


create policy "Users can delete their own context access rules"
on public.nous_context_access
for delete
to authenticated
using (
    (select auth.uid()) = user_id
);


-- ------------------------------------------------------------
-- 10. CONTEXT RELATIONSHIP POLICIES
-- ------------------------------------------------------------

create policy "Users can read their own context relationships"
on public.nous_context_relationships
for select
to authenticated
using (
    (select auth.uid()) = user_id
);


create policy "Users can create relationships within their context"
on public.nous_context_relationships
for insert
to authenticated
with check (
    (select auth.uid()) = user_id

    and exists (
        select 1
        from public.nous_context_records
        where nous_context_records.id = source_context_id
          and nous_context_records.user_id =
              (select auth.uid())
    )

    and exists (
        select 1
        from public.nous_context_records
        where nous_context_records.id = target_context_id
          and nous_context_records.user_id =
              (select auth.uid())
    )
);


create policy "Users can delete their own context relationships"
on public.nous_context_relationships
for delete
to authenticated
using (
    (select auth.uid()) = user_id
);


-- ------------------------------------------------------------
-- 11. INDEXES
-- ------------------------------------------------------------

create index nous_context_records_user_id_idx
on public.nous_context_records(user_id);


create index nous_context_records_user_type_idx
on public.nous_context_records(
    user_id,
    context_type
);


create index nous_context_records_user_status_idx
on public.nous_context_records(
    user_id,
    status
);


create index nous_context_claims_user_id_idx
on public.nous_context_claims(user_id);


create index nous_context_claims_record_id_idx
on public.nous_context_claims(context_record_id);


create index nous_context_access_record_id_idx
on public.nous_context_access(context_record_id);


create index nous_context_access_user_purpose_idx
on public.nous_context_access(
    user_id,
    purpose
);


create index nous_context_relationships_source_idx
on public.nous_context_relationships(source_context_id);


create index nous_context_relationships_target_idx
on public.nous_context_relationships(target_context_id);