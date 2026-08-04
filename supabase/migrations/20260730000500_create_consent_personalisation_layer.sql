-- ============================================================
-- NOUS CORE 005
-- Consent and Personalisation Layer
--
-- Authentication proves identity.
-- Consent defines permission.
-- Context creates understanding.
-- ============================================================


-- ------------------------------------------------------------
-- 1. CONSENT PURPOSE REGISTRY
-- ------------------------------------------------------------

create table public.nous_consent_purposes (
    id uuid primary key default gen_random_uuid(),

    purpose_key text not null unique,

    name text not null,
    description text not null,

    category text not null
        check (
            category in (
                'essential',
                'preferences',
                'personalisation',
                'analytics',
                'connected_services',
                'marketing',
                'advertising'
            )
        ),

    lawful_basis text
        check (
            lawful_basis is null
            or lawful_basis in (
                'consent',
                'contract',
                'legal_obligation',
                'legitimate_interest',
                'vital_interest',
                'public_task'
            )
        ),

    is_required boolean not null default false,

    can_be_withdrawn boolean not null default true,

    current_policy_version text not null default '1.0',

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2. CURRENT USER CONSENT
-- ------------------------------------------------------------

create table public.nous_user_consents (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    purpose_id uuid not null
        references public.nous_consent_purposes(id)
        on delete restrict,

    status text not null
        check (
            status in (
                'granted',
                'denied',
                'withdrawn',
                'expired'
            )
        ),

    policy_version text not null,

    collection_method text not null default 'consent_interface'
        check (
            collection_method in (
                'consent_interface',
                'account_setup',
                'connected_service',
                'administrator',
                'migration'
            )
        ),

    granted_at timestamptz,
    denied_at timestamptz,
    withdrawn_at timestamptz,
    expires_at timestamptz,

    evidence jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (
        user_id,
        purpose_id
    )
);


-- ------------------------------------------------------------
-- 3. IMMUTABLE CONSENT HISTORY
-- ------------------------------------------------------------

create table public.nous_consent_history (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    purpose_id uuid not null
        references public.nous_consent_purposes(id)
        on delete restrict,

    previous_status text,

    new_status text not null
        check (
            new_status in (
                'granted',
                'denied',
                'withdrawn',
                'expired'
            )
        ),

    policy_version text not null,

    reason text,

    evidence jsonb not null default '{}'::jsonb,

    occurred_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 4. CONNECTED ACCOUNTS
--
-- Stores connection metadata only.
-- OAuth secrets and access tokens must not be stored here.
-- ------------------------------------------------------------

create table public.nous_connected_accounts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    provider text not null
        check (
            provider in (
                'facebook',
                'instagram',
                'google',
                'apple',
                'microsoft',
                'github',
                'other'
            )
        ),

    provider_user_id text,

    display_name text,

    connection_status text not null default 'connected'
        check (
            connection_status in (
                'connected',
                'disconnected',
                'expired',
                'revoked',
                'error'
            )
        ),

    permissions_granted text[] not null default '{}',

    metadata jsonb not null default '{}'::jsonb,

    connected_at timestamptz not null default now(),
    disconnected_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (
        user_id,
        provider
    )
);


-- ------------------------------------------------------------
-- 5. PREFERENCE EVENTS
--
-- Records explicit or authorised behavioural signals.
-- ------------------------------------------------------------

create table public.nous_preference_events (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    bus_event_id uuid
        references public.nous_bus_events(id)
        on delete set null,

    source_service text not null,

    source_type text not null
        check (
            source_type in (
                'explicit_user_choice',
                'nous_interaction',
                'connected_service',
                'imported_data',
                'system_inference'
            )
        ),

    interaction_type text not null
        check (
            interaction_type in (
                'liked',
                'disliked',
                'saved',
                'opened',
                'viewed',
                'completed',
                'skipped',
                'dismissed',
                'searched',
                'followed',
                'unfollowed',
                'favourited',
                'unfavourited',
                'purchased',
                'rated'
            )
        ),

    subject_type text not null,

    subject_id text,

    subject_label text,

    signal_value numeric not null default 1,

    consent_purpose_key text not null,

    metadata jsonb not null default '{}'::jsonb,

    occurred_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 6. DERIVED USER PREFERENCES
-- ------------------------------------------------------------

create table public.nous_user_preferences (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    subject_type text not null,
    subject_key text not null,
    subject_label text,

    preference_direction text not null
        check (
            preference_direction in (
                'positive',
                'negative',
                'neutral',
                'unknown'
            )
        ),

    preference_strength numeric not null default 0
        check (
            preference_strength >= -1
            and preference_strength <= 1
        ),

    confidence numeric not null default 0
        check (
            confidence >= 0
            and confidence <= 1
        ),

    origin text not null
        check (
            origin in (
                'user_declared',
                'interaction_derived',
                'connected_service',
                'system_inference'
            )
        ),

    verification_status text not null default 'unverified'
        check (
            verification_status in (
                'unverified',
                'user_confirmed',
                'user_corrected',
                'disputed'
            )
        ),

    consent_purpose_key text not null,

    evidence_count integer not null default 0
        check (evidence_count >= 0),

    last_evidence_at timestamptz,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (
        user_id,
        subject_type,
        subject_key,
        consent_purpose_key
    )
);


-- ------------------------------------------------------------
-- 7. DATA PROCESSING LOG
-- ------------------------------------------------------------

create table public.nous_data_processing_log (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        references public.nous_profiles(id)
        on delete set null,

    service_name text not null,

    operation text not null,

    purpose_key text not null,

    data_categories text[] not null default '{}',

    outcome text not null
        check (
            outcome in (
                'allowed',
                'denied',
                'completed',
                'failed'
            )
        ),

    reason text,

    event_id uuid
        references public.nous_bus_events(id)
        on delete set null,

    metadata jsonb not null default '{}'::jsonb,

    processed_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 8. UPDATED-AT TRIGGERS
-- ------------------------------------------------------------

create trigger set_nous_consent_purposes_updated_at
before update on public.nous_consent_purposes
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_user_consents_updated_at
before update on public.nous_user_consents
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_connected_accounts_updated_at
before update on public.nous_connected_accounts
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_user_preferences_updated_at
before update on public.nous_user_preferences
for each row
execute function public.set_nous_updated_at();


-- ------------------------------------------------------------
-- 9. CONSENT HISTORY TRIGGER
-- ------------------------------------------------------------

create or replace function public.record_nous_consent_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.nous_consent_history (
        user_id,
        purpose_id,
        previous_status,
        new_status,
        policy_version,
        reason,
        evidence
    )
    values (
        new.user_id,
        new.purpose_id,
        case
            when tg_op = 'UPDATE' then old.status
            else null
        end,
        new.status,
        new.policy_version,
        case
            when tg_op = 'UPDATE'
            then 'Consent status updated'
            else 'Consent preference created'
        end,
        new.evidence
    );

    return new;
end;
$$;


create trigger record_nous_user_consent_history
after insert or update of status
on public.nous_user_consents
for each row
execute function public.record_nous_consent_history();


-- ------------------------------------------------------------
-- 10. CONSENT CHECK FUNCTION
-- ------------------------------------------------------------

create or replace function public.has_nous_consent(
    requested_user_id uuid,
    requested_purpose_key text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.nous_user_consents uc
        join public.nous_consent_purposes cp
          on cp.id = uc.purpose_id
        where uc.user_id = requested_user_id
          and cp.purpose_key = requested_purpose_key
          and cp.is_active = true
          and (
              cp.is_required = true
              or (
                  uc.status = 'granted'
                  and (
                      uc.expires_at is null
                      or uc.expires_at > now()
                  )
              )
          )
    );
$$;


-- ------------------------------------------------------------
-- 11. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.nous_consent_purposes enable row level security;
alter table public.nous_user_consents enable row level security;
alter table public.nous_consent_history enable row level security;
alter table public.nous_connected_accounts enable row level security;
alter table public.nous_preference_events enable row level security;
alter table public.nous_user_preferences enable row level security;
alter table public.nous_data_processing_log enable row level security;


create policy "Users can read consent purposes"
on public.nous_consent_purposes
for select
to authenticated
using (is_active = true);


create policy "Users can read their own consents"
on public.nous_user_consents
for select
to authenticated
using (user_id = (select auth.uid()));


create policy "Users can create their own consents"
on public.nous_user_consents
for insert
to authenticated
with check (user_id = (select auth.uid()));


create policy "Users can update their own consents"
on public.nous_user_consents
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));


create policy "Users can read their consent history"
on public.nous_consent_history
for select
to authenticated
using (user_id = (select auth.uid()));


create policy "Users can read their connected accounts"
on public.nous_connected_accounts
for select
to authenticated
using (user_id = (select auth.uid()));


create policy "Users can manage their connected accounts"
on public.nous_connected_accounts
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));


create policy "Users can read their preference events"
on public.nous_preference_events
for select
to authenticated
using (user_id = (select auth.uid()));


create policy "Users can create their preference events"
on public.nous_preference_events
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and public.has_nous_consent(
        user_id,
        consent_purpose_key
    )
);


create policy "Users can read their preferences"
on public.nous_user_preferences
for select
to authenticated
using (user_id = (select auth.uid()));


create policy "Users can update their preferences"
on public.nous_user_preferences
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));


create policy "Users can read their processing log"
on public.nous_data_processing_log
for select
to authenticated
using (user_id = (select auth.uid()));


-- ------------------------------------------------------------
-- 12. INDEXES
-- ------------------------------------------------------------

create index nous_user_consents_user_idx
on public.nous_user_consents(user_id);


create index nous_consent_history_user_idx
on public.nous_consent_history(user_id, occurred_at desc);


create index nous_connected_accounts_user_idx
on public.nous_connected_accounts(user_id);


create index nous_preference_events_user_time_idx
on public.nous_preference_events(user_id, occurred_at desc);


create index nous_preference_events_subject_idx
on public.nous_preference_events(subject_type, subject_id);


create index nous_user_preferences_user_idx
on public.nous_user_preferences(user_id);


create index nous_user_preferences_subject_idx
on public.nous_user_preferences(subject_type, subject_key);


create index nous_processing_log_user_time_idx
on public.nous_data_processing_log(user_id, processed_at desc);


-- ------------------------------------------------------------
-- 13. INITIAL CONSENT PURPOSES
-- ------------------------------------------------------------

insert into public.nous_consent_purposes (
    purpose_key,
    name,
    description,
    category,
    lawful_basis,
    is_required,
    can_be_withdrawn
)
values
    (
        'essential_account',
        'Essential account operation',
        'Allows NOUS to authenticate the user, secure the account and provide requested platform functionality.',
        'essential',
        'contract',
        true,
        false
    ),
    (
        'remember_preferences',
        'Remember explicit preferences',
        'Allows NOUS to remember preferences directly provided by the user.',
        'preferences',
        'consent',
        false,
        true
    ),
    (
        'content_personalisation',
        'Personalise NOUS content',
        'Allows NOUS to learn from authorised interactions inside the platform and personalise content.',
        'personalisation',
        'consent',
        false,
        true
    ),
    (
        'product_recommendations',
        'Personalise product recommendations',
        'Allows NOUS to use authorised preference signals to improve product recommendations.',
        'personalisation',
        'consent',
        false,
        true
    ),
    (
        'usage_analytics',
        'Platform analytics',
        'Allows aggregated analysis of how users interact with NOUS to improve the platform.',
        'analytics',
        'consent',
        false,
        true
    ),
    (
        'connected_service_data',
        'Connected-service information',
        'Allows NOUS to process information received from a service explicitly connected by the user.',
        'connected_services',
        'consent',
        false,
        true
    ),
    (
        'marketing_communications',
        'Marketing communications',
        'Allows NEURORDER to send optional product and service communications.',
        'marketing',
        'consent',
        false,
        true
    ),
    (
        'personalised_advertising',
        'Personalised advertising',
        'Allows authorised preference information to be used for advertising personalisation.',
        'advertising',
        'consent',
        false,
        true
    );


-- ------------------------------------------------------------
-- 14. NEW BUS EVENT TYPES
-- ------------------------------------------------------------

insert into public.nous_event_types (
    event_type,
    description,
    owning_service,
    sensitivity
)
values
    (
        'consent.preference.updated',
        'A user granted, denied or withdrew a consent purpose.',
        'consent',
        'sensitive'
    ),
    (
        'preference.signal.recorded',
        'An authorised user preference signal was recorded.',
        'personalisation',
        'personal'
    ),
    (
        'preference.profile.updated',
        'The derived preference profile was updated.',
        'personalisation',
        'personal'
    ),
    (
        'connected.account.created',
        'A user connected an external account.',
        'identity',
        'sensitive'
    ),
    (
        'connected.account.revoked',
        'A connected external account was revoked.',
        'identity',
        'sensitive'
    );