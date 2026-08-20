-- ============================================================================
-- NOUS PLATFORM
-- Migration 006: O.R.U.L.E. Intelligence Layer
--
-- O.R.U.L.E.
-- Operational Reasoning Unified Logic Engine
--
-- Responsibilities:
--   1. Register NOUS capabilities
--   2. Register callable tools
--   3. Track reasoning sessions
--   4. Store execution plans
--   5. Store context snapshots
--   6. Audit tool executions
--   7. Record response metrics
--
-- Reasoning logic remains inside NOUS Edge Functions.
-- PostgreSQL stores configuration, state, audit history and metrics.
-- ============================================================================


-- ============================================================================
-- 1. CAPABILITY REGISTRY
-- ============================================================================

create table if not exists public.orule_capabilities (
    id uuid primary key default gen_random_uuid(),

    slug text not null unique,
    name text not null,
    description text,

    category text not null default 'general',

    system_instructions text,
    routing_keywords text[] not null default '{}',

    priority integer not null default 100
        check (priority >= 0),

    enabled boolean not null default true,
    requires_authentication boolean not null default true,

    required_consent_purposes text[] not null default '{}',

    configuration jsonb not null default '{}'::jsonb,
    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint orule_capabilities_slug_format
        check (slug ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),

    constraint orule_capabilities_category_not_empty
        check (length(trim(category)) > 0)
);

comment on table public.orule_capabilities is
'Registry of functional domains to which O.R.U.L.E. may route a user request.';

comment on column public.orule_capabilities.slug is
'Stable machine-readable capability identifier.';

comment on column public.orule_capabilities.required_consent_purposes is
'Consent-purpose slugs that must be granted before using this capability.';


-- ============================================================================
-- 2. TOOL REGISTRY
-- ============================================================================

create table if not exists public.orule_tool_registry (
    id uuid primary key default gen_random_uuid(),

    slug text not null unique,
    name text not null,
    description text,

    provider text not null default 'nous',
    tool_type text not null default 'internal'
        check (
            tool_type in (
                'internal',
                'database',
                'edge_function',
                'http_api',
                'mcp',
                'llm',
                'search',
                'calculation',
                'storage'
            )
        ),

    endpoint text,
    http_method text
        check (
            http_method is null
            or http_method in (
                'GET',
                'POST',
                'PUT',
                'PATCH',
                'DELETE'
            )
        ),

    input_schema jsonb not null default '{}'::jsonb,
    output_schema jsonb not null default '{}'::jsonb,

    enabled boolean not null default true,
    requires_authentication boolean not null default true,
    requires_user_confirmation boolean not null default false,

    required_consent_purposes text[] not null default '{}',
    allowed_capabilities text[] not null default '{}',

    timeout_ms integer not null default 30000
        check (timeout_ms between 100 and 300000),

    maximum_attempts integer not null default 1
        check (maximum_attempts between 1 and 10),

    configuration jsonb not null default '{}'::jsonb,
    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint orule_tool_registry_slug_format
        check (slug ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),

    constraint orule_tool_registry_provider_not_empty
        check (length(trim(provider)) > 0)
);

comment on table public.orule_tool_registry is
'Registry of tools and external capabilities that may be invoked by O.R.U.L.E.';

comment on column public.orule_tool_registry.requires_user_confirmation is
'Whether O.R.U.L.E. must obtain explicit confirmation before invoking the tool.';


-- ============================================================================
-- 3. REASONING SESSIONS
-- ============================================================================

create table if not exists public.orule_sessions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    conversation_id uuid,
    parent_session_id uuid
        references public.orule_sessions(id)
        on delete set null,

    correlation_id uuid not null default gen_random_uuid(),

    request_id text,
    source text not null default 'companion',

    workspace text not null default 'general',
    detected_intent text,
    user_request text,

    capability_id uuid
        references public.orule_capabilities(id)
        on delete set null,

    capability_slug text,

    status text not null default 'created'
        check (
            status in (
                'created',
                'context_loading',
                'planning',
                'awaiting_confirmation',
                'executing',
                'responding',
                'completed',
                'failed',
                'cancelled',
                'expired'
            )
        ),

    reasoning_mode text not null default 'standard'
        check (
            reasoning_mode in (
                'minimal',
                'standard',
                'deep',
                'multistep',
                'deterministic'
            )
        ),

    request_metadata jsonb not null default '{}'::jsonb,
    routing_metadata jsonb not null default '{}'::jsonb,

    error_code text,
    error_message text,

    started_at timestamptz not null default now(),
    completed_at timestamptz,
    expires_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint orule_sessions_completion_time
        check (
            completed_at is null
            or completed_at >= started_at
        ),

    constraint orule_sessions_expiry_time
        check (
            expires_at is null
            or expires_at >= started_at
        )
);

comment on table public.orule_sessions is
'One O.R.U.L.E. reasoning and orchestration lifecycle for a NOUS user request.';

comment on column public.orule_sessions.correlation_id is
'Identifier used to correlate the session with BUS events, logs and downstream operations.';

comment on column public.orule_sessions.user_request is
'Original user request supplied to O.R.U.L.E. Redaction should occur before storage when required.';


-- ============================================================================
-- 4. EXECUTION PLANS
-- ============================================================================

create table if not exists public.orule_execution_plans (
    id uuid primary key default gen_random_uuid(),

    session_id uuid not null
        references public.orule_sessions(id)
        on delete cascade,

    step_number integer not null
        check (step_number > 0),

    step_key text,
    step_type text not null
        check (
            step_type in (
                'context',
                'consent',
                'routing',
                'memory',
                'planning',
                'tool',
                'model',
                'validation',
                'response',
                'event',
                'storage',
                'custom'
            )
        ),

    title text not null,
    description text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'ready',
                'running',
                'waiting',
                'completed',
                'failed',
                'skipped',
                'cancelled'
            )
        ),

    depends_on_steps integer[] not null default '{}',

    input_data jsonb not null default '{}'::jsonb,
    output_data jsonb not null default '{}'::jsonb,

    error_code text,
    error_message text,

    started_at timestamptz,
    completed_at timestamptz,
    duration_ms integer
        check (duration_ms is null or duration_ms >= 0),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint orule_execution_plans_session_step_unique
        unique (session_id, step_number),

    constraint orule_execution_plans_step_key_unique
        unique (session_id, step_key),

    constraint orule_execution_plans_completion_time
        check (
            completed_at is null
            or started_at is null
            or completed_at >= started_at
        )
);

comment on table public.orule_execution_plans is
'Ordered execution steps generated by O.R.U.L.E. for a reasoning session.';


-- ============================================================================
-- 5. CONTEXT SNAPSHOTS
-- ============================================================================

create table if not exists public.orule_context_snapshots (
    id uuid primary key default gen_random_uuid(),

    session_id uuid not null
        references public.orule_sessions(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    snapshot_version integer not null default 1
        check (snapshot_version > 0),

    snapshot_type text not null default 'assembled'
        check (
            snapshot_type in (
                'identity',
                'presence',
                'human_context',
                'consent',
                'preferences',
                'memory',
                'workspace',
                'assembled',
                'response'
            )
        ),

    identity_context jsonb not null default '{}'::jsonb,
    presence_context jsonb not null default '{}'::jsonb,
    human_context jsonb not null default '{}'::jsonb,
    consent_context jsonb not null default '{}'::jsonb,
    preference_context jsonb not null default '{}'::jsonb,
    workspace_context jsonb not null default '{}'::jsonb,

    memory_references jsonb not null default '[]'::jsonb,
    connected_account_references jsonb not null default '[]'::jsonb,

    assembled_context jsonb not null default '{}'::jsonb,

    token_estimate integer
        check (token_estimate is null or token_estimate >= 0),

    redaction_applied boolean not null default false,
    redacted_fields text[] not null default '{}',

    context_hash text,
    metadata jsonb not null default '{}'::jsonb,

    retention_until timestamptz,
    created_at timestamptz not null default now(),

    constraint orule_context_snapshot_version_unique
        unique (session_id, snapshot_type, snapshot_version)
);

comment on table public.orule_context_snapshots is
'Point-in-time representation of the context assembled for an O.R.U.L.E. session.';

comment on column public.orule_context_snapshots.redaction_applied is
'Indicates whether sensitive or unnecessary values were removed before persistence.';


-- ============================================================================
-- 6. TOOL EXECUTIONS
-- ============================================================================

create table if not exists public.orule_tool_executions (
    id uuid primary key default gen_random_uuid(),

    session_id uuid not null
        references public.orule_sessions(id)
        on delete cascade,

    execution_plan_id uuid
        references public.orule_execution_plans(id)
        on delete set null,

    tool_id uuid
        references public.orule_tool_registry(id)
        on delete set null,

    tool_slug text not null,

    invocation_number integer not null default 1
        check (invocation_number > 0),

    status text not null default 'queued'
        check (
            status in (
                'queued',
                'awaiting_confirmation',
                'running',
                'succeeded',
                'failed',
                'timed_out',
                'cancelled',
                'rejected'
            )
        ),

    confirmation_required boolean not null default false,
    confirmed_by_user boolean,
    confirmed_at timestamptz,

    request_payload jsonb not null default '{}'::jsonb,
    response_payload jsonb not null default '{}'::jsonb,

    response_status integer,
    external_request_id text,

    error_code text,
    error_message text,

    started_at timestamptz,
    completed_at timestamptz,

    duration_ms integer
        check (duration_ms is null or duration_ms >= 0),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint orule_tool_execution_attempt_unique
        unique (
            session_id,
            execution_plan_id,
            tool_slug,
            invocation_number
        ),

    constraint orule_tool_execution_completion_time
        check (
            completed_at is null
            or started_at is null
            or completed_at >= started_at
        ),

    constraint orule_tool_confirmation_consistency
        check (
            confirmed_by_user is null
            or confirmation_required = true
        )
);

comment on table public.orule_tool_executions is
'Audit record for each tool invocation performed or attempted by O.R.U.L.E.';


-- ============================================================================
-- 7. RESPONSE METRICS
-- ============================================================================

create table if not exists public.orule_response_metrics (
    id uuid primary key default gen_random_uuid(),

    session_id uuid not null unique
        references public.orule_sessions(id)
        on delete cascade,

    provider text,
    model text,
    model_version text,

    response_status text not null default 'generated'
        check (
            response_status in (
                'generated',
                'delivered',
                'partially_delivered',
                'blocked',
                'failed',
                'cancelled'
            )
        ),

    confidence numeric(5,4)
        check (
            confidence is null
            or confidence between 0 and 1
        ),

    routing_confidence numeric(5,4)
        check (
            routing_confidence is null
            or routing_confidence between 0 and 1
        ),

    input_tokens integer
        check (input_tokens is null or input_tokens >= 0),

    output_tokens integer
        check (output_tokens is null or output_tokens >= 0),

    reasoning_tokens integer
        check (reasoning_tokens is null or reasoning_tokens >= 0),

    total_tokens integer
        check (total_tokens is null or total_tokens >= 0),

    context_items_count integer not null default 0
        check (context_items_count >= 0),

    memory_items_count integer not null default 0
        check (memory_items_count >= 0),

    tools_planned_count integer not null default 0
        check (tools_planned_count >= 0),

    tools_executed_count integer not null default 0
        check (tools_executed_count >= 0),

    tools_failed_count integer not null default 0
        check (tools_failed_count >= 0),

    bus_events_emitted integer not null default 0
        check (bus_events_emitted >= 0),

    context_build_ms integer
        check (context_build_ms is null or context_build_ms >= 0),

    planning_ms integer
        check (planning_ms is null or planning_ms >= 0),

    model_latency_ms integer
        check (model_latency_ms is null or model_latency_ms >= 0),

    tool_latency_ms integer
        check (tool_latency_ms is null or tool_latency_ms >= 0),

    total_latency_ms integer
        check (total_latency_ms is null or total_latency_ms >= 0),

    estimated_cost numeric(14,8)
        check (estimated_cost is null or estimated_cost >= 0),

    cost_currency text not null default 'USD',

    safety_metadata jsonb not null default '{}'::jsonb,
    quality_metadata jsonb not null default '{}'::jsonb,
    usage_metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint orule_response_metrics_token_total
        check (
            total_tokens is null
            or (
                total_tokens >= coalesce(input_tokens, 0)
                and total_tokens >= coalesce(output_tokens, 0)
            )
        )
);

comment on table public.orule_response_metrics is
'Operational, quality and usage measurements for an O.R.U.L.E. response.';


-- ============================================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================================

create or replace function public.set_orule_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_orule_capabilities_updated_at
on public.orule_capabilities;

create trigger set_orule_capabilities_updated_at
before update on public.orule_capabilities
for each row
execute function public.set_orule_updated_at();


drop trigger if exists set_orule_tool_registry_updated_at
on public.orule_tool_registry;

create trigger set_orule_tool_registry_updated_at
before update on public.orule_tool_registry
for each row
execute function public.set_orule_updated_at();


drop trigger if exists set_orule_sessions_updated_at
on public.orule_sessions;

create trigger set_orule_sessions_updated_at
before update on public.orule_sessions
for each row
execute function public.set_orule_updated_at();


drop trigger if exists set_orule_execution_plans_updated_at
on public.orule_execution_plans;

create trigger set_orule_execution_plans_updated_at
before update on public.orule_execution_plans
for each row
execute function public.set_orule_updated_at();


drop trigger if exists set_orule_tool_executions_updated_at
on public.orule_tool_executions;

create trigger set_orule_tool_executions_updated_at
before update on public.orule_tool_executions
for each row
execute function public.set_orule_updated_at();


drop trigger if exists set_orule_response_metrics_updated_at
on public.orule_response_metrics;

create trigger set_orule_response_metrics_updated_at
before update on public.orule_response_metrics
for each row
execute function public.set_orule_updated_at();


-- ============================================================================
-- 9. SESSION COMPLETION HELPER
-- ============================================================================

create or replace function public.complete_orule_session(
    p_session_id uuid,
    p_status text default 'completed',
    p_error_code text default null,
    p_error_message text default null
)
returns public.orule_sessions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    v_session public.orule_sessions;
begin
    if p_status not in (
        'completed',
        'failed',
        'cancelled',
        'expired'
    ) then
        raise exception
            'Invalid terminal O.R.U.L.E. session status: %',
            p_status;
    end if;

    update public.orule_sessions
    set
        status = p_status,
        error_code = p_error_code,
        error_message = p_error_message,
        completed_at = now()
    where id = p_session_id
      and user_id = auth.uid()
    returning * into v_session;

    if v_session.id is null then
        raise exception
            'O.R.U.L.E. session not found or access denied';
    end if;

    return v_session;
end;
$$;


-- ============================================================================
-- 10. INDEXES
-- ============================================================================

create index if not exists idx_orule_capabilities_enabled_priority
on public.orule_capabilities (enabled, priority, slug);

create index if not exists idx_orule_capabilities_routing_keywords
on public.orule_capabilities
using gin (routing_keywords);

create index if not exists idx_orule_tool_registry_enabled
on public.orule_tool_registry (enabled, tool_type, slug);

create index if not exists idx_orule_tool_registry_capabilities
on public.orule_tool_registry
using gin (allowed_capabilities);

create index if not exists idx_orule_sessions_user_created
on public.orule_sessions (user_id, created_at desc);

create index if not exists idx_orule_sessions_user_status
on public.orule_sessions (user_id, status, updated_at desc);

create index if not exists idx_orule_sessions_conversation
on public.orule_sessions (conversation_id, created_at desc)
where conversation_id is not null;

create index if not exists idx_orule_sessions_correlation
on public.orule_sessions (correlation_id);

create index if not exists idx_orule_sessions_capability
on public.orule_sessions (capability_id, created_at desc)
where capability_id is not null;

create index if not exists idx_orule_execution_plans_session
on public.orule_execution_plans (session_id, step_number);

create index if not exists idx_orule_execution_plans_status
on public.orule_execution_plans (session_id, status);

create index if not exists idx_orule_context_snapshots_session
on public.orule_context_snapshots (
    session_id,
    snapshot_type,
    snapshot_version desc
);

create index if not exists idx_orule_context_snapshots_user
on public.orule_context_snapshots (user_id, created_at desc);

create index if not exists idx_orule_context_snapshots_retention
on public.orule_context_snapshots (retention_until)
where retention_until is not null;

create index if not exists idx_orule_tool_executions_session
on public.orule_tool_executions (session_id, created_at);

create index if not exists idx_orule_tool_executions_tool
on public.orule_tool_executions (tool_slug, status, created_at desc);

create index if not exists idx_orule_tool_executions_failures
on public.orule_tool_executions (created_at desc)
where status in ('failed', 'timed_out');

create index if not exists idx_orule_response_metrics_model
on public.orule_response_metrics (provider, model, created_at desc);

create index if not exists idx_orule_response_metrics_latency
on public.orule_response_metrics (total_latency_ms)
where total_latency_ms is not null;


-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================

alter table public.orule_capabilities
enable row level security;

alter table public.orule_tool_registry
enable row level security;

alter table public.orule_sessions
enable row level security;

alter table public.orule_execution_plans
enable row level security;

alter table public.orule_context_snapshots
enable row level security;

alter table public.orule_tool_executions
enable row level security;

alter table public.orule_response_metrics
enable row level security;


-- --------------------------------------------------------------------------
-- Capability registry policies
-- --------------------------------------------------------------------------

drop policy if exists
"Authenticated users can view enabled ORULE capabilities"
on public.orule_capabilities;

create policy
"Authenticated users can view enabled ORULE capabilities"
on public.orule_capabilities
for select
to authenticated
using (enabled = true);


-- --------------------------------------------------------------------------
-- Tool registry policies
-- --------------------------------------------------------------------------

drop policy if exists
"Authenticated users can view enabled ORULE tools"
on public.orule_tool_registry;

create policy
"Authenticated users can view enabled ORULE tools"
on public.orule_tool_registry
for select
to authenticated
using (enabled = true);


-- --------------------------------------------------------------------------
-- Session policies
-- --------------------------------------------------------------------------

drop policy if exists
"Users can view their own ORULE sessions"
on public.orule_sessions;

create policy
"Users can view their own ORULE sessions"
on public.orule_sessions
for select
to authenticated
using (user_id = auth.uid());


drop policy if exists
"Users can create their own ORULE sessions"
on public.orule_sessions;

create policy
"Users can create their own ORULE sessions"
on public.orule_sessions
for insert
to authenticated
with check (user_id = auth.uid());


drop policy if exists
"Users can update their own ORULE sessions"
on public.orule_sessions;

create policy
"Users can update their own ORULE sessions"
on public.orule_sessions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


-- --------------------------------------------------------------------------
-- Execution plan policies
-- --------------------------------------------------------------------------

drop policy if exists
"Users can view plans for their own ORULE sessions"
on public.orule_execution_plans;

create policy
"Users can view plans for their own ORULE sessions"
on public.orule_execution_plans
for select
to authenticated
using (
    exists (
        select 1
        from public.orule_sessions session_record
        where session_record.id =
            orule_execution_plans.session_id
          and session_record.user_id = auth.uid()
    )
);


-- --------------------------------------------------------------------------
-- Context snapshot policies
-- --------------------------------------------------------------------------

drop policy if exists
"Users can view their own ORULE context snapshots"
on public.orule_context_snapshots;

create policy
"Users can view their own ORULE context snapshots"
on public.orule_context_snapshots
for select
to authenticated
using (user_id = auth.uid());


-- --------------------------------------------------------------------------
-- Tool execution policies
-- --------------------------------------------------------------------------

drop policy if exists
"Users can view tool executions for their own ORULE sessions"
on public.orule_tool_executions;

create policy
"Users can view tool executions for their own ORULE sessions"
on public.orule_tool_executions
for select
to authenticated
using (
    exists (
        select 1
        from public.orule_sessions session_record
        where session_record.id =
            orule_tool_executions.session_id
          and session_record.user_id = auth.uid()
    )
);


-- --------------------------------------------------------------------------
-- Response metric policies
-- --------------------------------------------------------------------------

drop policy if exists
"Users can view metrics for their own ORULE sessions"
on public.orule_response_metrics;

create policy
"Users can view metrics for their own ORULE sessions"
on public.orule_response_metrics
for select
to authenticated
using (
    exists (
        select 1
        from public.orule_sessions session_record
        where session_record.id =
            orule_response_metrics.session_id
          and session_record.user_id = auth.uid()
    )
);


-- ============================================================================
-- 12. PRIVILEGES
-- ============================================================================

revoke all on table public.orule_capabilities from anon;
revoke all on table public.orule_tool_registry from anon;
revoke all on table public.orule_sessions from anon;
revoke all on table public.orule_execution_plans from anon;
revoke all on table public.orule_context_snapshots from anon;
revoke all on table public.orule_tool_executions from anon;
revoke all on table public.orule_response_metrics from anon;

grant select
on table public.orule_capabilities
to authenticated;

grant select
on table public.orule_tool_registry
to authenticated;

grant select, insert, update
on table public.orule_sessions
to authenticated;

grant select
on table public.orule_execution_plans
to authenticated;

grant select
on table public.orule_context_snapshots
to authenticated;

grant select
on table public.orule_tool_executions
to authenticated;

grant select
on table public.orule_response_metrics
to authenticated;

grant execute
on function public.complete_orule_session(
    uuid,
    text,
    text,
    text
)
to authenticated;


-- ============================================================================
-- 13. INITIAL CAPABILITIES
-- ============================================================================

insert into public.orule_capabilities (
    slug,
    name,
    description,
    category,
    routing_keywords,
    priority,
    enabled
)
values
    (
        'general',
        'General Intelligence',
        'Handles general questions and requests that do not require a specialised workspace.',
        'general',
        array[
            'general',
            'question',
            'understand',
            'explain',
            'help'
        ],
        10,
        true
    ),
    (
        'business',
        'Business',
        'Supports operations, strategy, communication, productivity and organisational work.',
        'workspace',
        array[
            'business',
            'company',
            'operations',
            'strategy',
            'client',
            'proposal',
            'meeting'
        ],
        20,
        true
    ),
    (
        'education',
        'Education',
        'Supports learning, tutoring, study planning and educational development.',
        'workspace',
        array[
            'education',
            'study',
            'student',
            'school',
            'university',
            'assignment',
            'learn'
        ],
        20,
        true
    ),
    (
        'personal',
        'Personal',
        'Supports personal organisation, reflection, routines and daily planning.',
        'workspace',
        array[
            'personal',
            'routine',
            'daily',
            'organise',
            'plan',
            'reminder'
        ],
        20,
        true
    ),
    (
        'research',
        'Research',
        'Supports research design, evidence management, analysis and structured investigation.',
        'specialised',
        array[
            'research',
            'paper',
            'evidence',
            'methodology',
            'analysis',
            'study'
        ],
        30,
        true
    ),
    (
        'finance',
        'Finance',
        'Supports financial understanding, budgeting and authorised financial workflows.',
        'specialised',
        array[
            'finance',
            'budget',
            'money',
            'payment',
            'transaction',
            'cost'
        ],
        30,
        true
    ),
    (
        'foundation',
        'Foundation',
        'Supports programmes and operations of the iNtsikelelo Foundation.',
        'organisation',
        array[
            'foundation',
            'community',
            'donation',
            'programme',
            'charity',
            'partnership'
        ],
        30,
        true
    ),
    (
        'developer',
        'Developer',
        'Supports software engineering, technical operations and NOUS platform development.',
        'specialised',
        array[
            'developer',
            'code',
            'software',
            'database',
            'api',
            'debug',
            'deploy'
        ],
        30,
        true
    )
on conflict (slug)
do update set
    name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    routing_keywords = excluded.routing_keywords,
    priority = excluded.priority,
    enabled = excluded.enabled,
    updated_at = now();


-- ============================================================================
-- 14. INITIAL TOOL REGISTRY
-- ============================================================================

insert into public.orule_tool_registry (
    slug,
    name,
    description,
    provider,
    tool_type,
    requires_authentication,
    requires_user_confirmation,
    allowed_capabilities,
    timeout_ms,
    maximum_attempts
)
values
    (
        'nous.context',
        'NOUS Context Builder',
        'Retrieves authorised identity, presence, preference and human-context information.',
        'nous',
        'internal',
        true,
        false,
        array[
            'general',
            'business',
            'education',
            'personal',
            'research',
            'finance',
            'foundation',
            'developer'
        ],
        10000,
        2
    ),
    (
        'nous.consent',
        'NOUS Consent Service',
        'Checks and manages user consent before processing protected information.',
        'nous',
        'edge_function',
        true,
        false,
        array[
            'general',
            'business',
            'education',
            'personal',
            'research',
            'finance',
            'foundation',
            'developer'
        ],
        10000,
        2
    ),
    (
        'nous.bus',
        'NOUS BUS',
        'Publishes and receives events across the NOUS platform.',
        'nous',
        'edge_function',
        true,
        false,
        array[
            'general',
            'business',
            'education',
            'personal',
            'research',
            'finance',
            'foundation',
            'developer'
        ],
        10000,
        3
    ),
    (
        'nous.memory',
        'NOUS Memory Retrieval',
        'Retrieves relevant authorised memories and context references.',
        'nous',
        'database',
        true,
        false,
        array[
            'general',
            'business',
            'education',
            'personal',
            'research',
            'finance',
            'foundation',
            'developer'
        ],
        10000,
        2
    ),
    (
        'nous.model',
        'NOUS Language Model',
        'Produces a language response from the context and execution plan assembled by O.R.U.L.E.',
        'openai',
        'llm',
        true,
        false,
        array[
            'general',
            'business',
            'education',
            'personal',
            'research',
            'finance',
            'foundation',
            'developer'
        ],
        120000,
        2
    ),
    (
        'nous.calendar',
        'Neurorder Calendar',
        'Reads or manages authorised calendar information.',
        'neurorder',
        'internal',
        true,
        true,
        array[
            'business',
            'education',
            'personal',
            'foundation'
        ],
        30000,
        2
    ),
    (
        'nous.research',
        'NOUS Research Workspace',
        'Retrieves and processes authorised research workspace information.',
        'neurorder',
        'internal',
        true,
        false,
        array[
            'research',
            'education',
            'business',
            'developer'
        ],
        30000,
        2
    ),
    (
        'nous.credit_scoring',
        'Neurorder Credit Scoring',
        'Invokes authorised credit-scoring workflows and supporting infrastructure.',
        'neurorder',
        'internal',
        true,
        true,
        array[
            'finance',
            'business',
            'research'
        ],
        30000,
        2
    )
on conflict (slug)
do update set
    name = excluded.name,
    description = excluded.description,
    provider = excluded.provider,
    tool_type = excluded.tool_type,
    requires_authentication =
        excluded.requires_authentication,
    requires_user_confirmation =
        excluded.requires_user_confirmation,
    allowed_capabilities =
        excluded.allowed_capabilities,
    timeout_ms = excluded.timeout_ms,
    maximum_attempts = excluded.maximum_attempts,
    updated_at = now();


-- ============================================================================
-- MIGRATION 006 COMPLETE
-- ============================================================================