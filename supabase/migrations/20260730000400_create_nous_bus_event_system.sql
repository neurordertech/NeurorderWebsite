-- ============================================================
-- NOUS CORE 004
-- BUS Event System
--
-- Purpose:
-- Provide a shared nervous system through which NOUS services,
-- applications and connected environments exchange events.
-- ============================================================


-- ------------------------------------------------------------
-- 1. BUS EVENTS
--
-- Every meaningful occurrence inside NOUS is represented as an
-- event.
--
-- Examples:
-- calendar.event.started
-- education.assignment.created
-- membership.payment.completed
-- device.connected
-- companion.message.received
-- ------------------------------------------------------------

create table public.nous_bus_events (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        references public.nous_profiles(id)
        on delete cascade,

    event_type text not null,

    event_version integer not null default 1
        check (event_version > 0),

    source_service text not null,

    source_record_id text,

    space text
        check (
            space is null
            or space in (
                'system',
                'companion',
                'education',
                'business',
                'personal',
                'research',
                'calendar',
                'finance',
                'identity',
                'aiot'
            )
        ),

    priority text not null default 'normal'
        check (
            priority in (
                'low',
                'normal',
                'high',
                'critical'
            )
        ),

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled'
            )
        ),

    payload jsonb not null default '{}'::jsonb,

    metadata jsonb not null default '{}'::jsonb,

    correlation_id uuid,
    causation_id uuid
        references public.nous_bus_events(id)
        on delete set null,

    available_at timestamptz not null default now(),
    processing_started_at timestamptz,
    completed_at timestamptz,

    error_code text,
    error_message text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.nous_bus_events is
'Durable event stream used by the NOUS BUS runtime.';

comment on column public.nous_bus_events.event_type is
'Dot-separated event name such as calendar.event.started.';

comment on column public.nous_bus_events.correlation_id is
'Groups multiple events that belong to one workflow or request.';

comment on column public.nous_bus_events.causation_id is
'References the earlier event that caused this event.';


-- ------------------------------------------------------------
-- 2. BUS SUBSCRIPTIONS
--
-- Defines which NOUS service listens for which event.
--
-- Wildcards may be represented through:
-- calendar.*
-- education.assignment.*
-- *
-- ------------------------------------------------------------

create table public.nous_bus_subscriptions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        references public.nous_profiles(id)
        on delete cascade,

    subscriber_service text not null,
    event_pattern text not null,

    space text,

    is_active boolean not null default true,

    minimum_priority text not null default 'low'
        check (
            minimum_priority in (
                'low',
                'normal',
                'high',
                'critical'
            )
        ),

    delivery_mode text not null default 'async'
        check (
            delivery_mode in (
                'async',
                'sync'
            )
        ),

    configuration jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (
        user_id,
        subscriber_service,
        event_pattern
    )
);

comment on table public.nous_bus_subscriptions is
'Event subscriptions for internal NOUS services and user-specific integrations.';


-- ------------------------------------------------------------
-- 3. BUS DELIVERIES
--
-- One event can be delivered to several subscribers.
-- Each delivery is tracked independently.
-- ------------------------------------------------------------

create table public.nous_bus_deliveries (
    id uuid primary key default gen_random_uuid(),

    event_id uuid not null
        references public.nous_bus_events(id)
        on delete cascade,

    subscription_id uuid
        references public.nous_bus_subscriptions(id)
        on delete set null,

    subscriber_service text not null,

    status text not null default 'queued'
        check (
            status in (
                'queued',
                'delivering',
                'delivered',
                'failed',
                'dead_lettered',
                'cancelled'
            )
        ),

    attempt_count integer not null default 0
        check (attempt_count >= 0),

    max_attempts integer not null default 3
        check (max_attempts > 0),

    next_attempt_at timestamptz not null default now(),

    delivered_at timestamptz,
    failed_at timestamptz,

    response_data jsonb not null default '{}'::jsonb,

    error_code text,
    error_message text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (
        event_id,
        subscriber_service
    )
);

comment on table public.nous_bus_deliveries is
'Tracks delivery of a BUS event to each subscribed NOUS service.';


-- ------------------------------------------------------------
-- 4. BUS ACTIONS
--
-- O.R.U.L.E. and other services can create proposed actions in
-- response to events.
--
-- Actions are not automatically executed unless their approval
-- requirements permit execution.
-- ------------------------------------------------------------

create table public.nous_bus_actions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        references public.nous_profiles(id)
        on delete cascade,

    event_id uuid not null
        references public.nous_bus_events(id)
        on delete cascade,

    action_type text not null,

    target_service text not null,

    payload jsonb not null default '{}'::jsonb,

    approval_requirement text not null default 'none'
        check (
            approval_requirement in (
                'none',
                'user_confirmation',
                'administrator',
                'external_authorisation'
            )
        ),

    status text not null default 'proposed'
        check (
            status in (
                'proposed',
                'awaiting_approval',
                'approved',
                'executing',
                'completed',
                'rejected',
                'failed',
                'cancelled'
            )
        ),

    approved_at timestamptz,
    executed_at timestamptz,
    completed_at timestamptz,

    result_data jsonb not null default '{}'::jsonb,

    error_code text,
    error_message text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.nous_bus_actions is
'Actions proposed or executed in response to BUS events.';


-- ------------------------------------------------------------
-- 5. EVENT TYPE REGISTRY
--
-- Documents valid event types and their expected payload shape.
-- ------------------------------------------------------------

create table public.nous_event_types (
    id uuid primary key default gen_random_uuid(),

    event_type text not null unique,

    description text,

    owning_service text not null,

    current_version integer not null default 1
        check (current_version > 0),

    payload_schema jsonb not null default '{}'::jsonb,

    sensitivity text not null default 'standard'
        check (
            sensitivity in (
                'public',
                'standard',
                'personal',
                'sensitive',
                'restricted'
            )
        ),

    retention_days integer
        check (
            retention_days is null
            or retention_days > 0
        ),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.nous_event_types is
'Registry and schema documentation for recognised NOUS BUS event types.';


-- ------------------------------------------------------------
-- 6. UPDATED-AT TRIGGERS
-- ------------------------------------------------------------

create trigger set_nous_bus_events_updated_at
before update on public.nous_bus_events
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_bus_subscriptions_updated_at
before update on public.nous_bus_subscriptions
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_bus_deliveries_updated_at
before update on public.nous_bus_deliveries
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_bus_actions_updated_at
before update on public.nous_bus_actions
for each row
execute function public.set_nous_updated_at();


create trigger set_nous_event_types_updated_at
before update on public.nous_event_types
for each row
execute function public.set_nous_updated_at();


-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.nous_bus_events enable row level security;
alter table public.nous_bus_subscriptions enable row level security;
alter table public.nous_bus_deliveries enable row level security;
alter table public.nous_bus_actions enable row level security;
alter table public.nous_event_types enable row level security;


-- ------------------------------------------------------------
-- 8. EVENT POLICIES
-- ------------------------------------------------------------

create policy "Users can read their own BUS events"
on public.nous_bus_events
for select
to authenticated
using (
    user_id = (select auth.uid())
);


create policy "Users can publish their own BUS events"
on public.nous_bus_events
for insert
to authenticated
with check (
    user_id = (select auth.uid())
);


create policy "Users can update their own BUS events"
on public.nous_bus_events
for update
to authenticated
using (
    user_id = (select auth.uid())
)
with check (
    user_id = (select auth.uid())
);


-- ------------------------------------------------------------
-- 9. SUBSCRIPTION POLICIES
-- ------------------------------------------------------------

create policy "Users can read their own BUS subscriptions"
on public.nous_bus_subscriptions
for select
to authenticated
using (
    user_id = (select auth.uid())
);


create policy "Users can create their own BUS subscriptions"
on public.nous_bus_subscriptions
for insert
to authenticated
with check (
    user_id = (select auth.uid())
);


create policy "Users can update their own BUS subscriptions"
on public.nous_bus_subscriptions
for update
to authenticated
using (
    user_id = (select auth.uid())
)
with check (
    user_id = (select auth.uid())
);


create policy "Users can delete their own BUS subscriptions"
on public.nous_bus_subscriptions
for delete
to authenticated
using (
    user_id = (select auth.uid())
);


-- ------------------------------------------------------------
-- 10. DELIVERY POLICIES
-- ------------------------------------------------------------

create policy "Users can read deliveries for their own events"
on public.nous_bus_deliveries
for select
to authenticated
using (
    exists (
        select 1
        from public.nous_bus_events
        where nous_bus_events.id = event_id
          and nous_bus_events.user_id =
              (select auth.uid())
    )
);


-- ------------------------------------------------------------
-- 11. ACTION POLICIES
-- ------------------------------------------------------------

create policy "Users can read their own BUS actions"
on public.nous_bus_actions
for select
to authenticated
using (
    user_id = (select auth.uid())
);


create policy "Users can create their own BUS actions"
on public.nous_bus_actions
for insert
to authenticated
with check (
    user_id = (select auth.uid())
);


create policy "Users can update their own BUS actions"
on public.nous_bus_actions
for update
to authenticated
using (
    user_id = (select auth.uid())
)
with check (
    user_id = (select auth.uid())
);


-- ------------------------------------------------------------
-- 12. EVENT TYPE REGISTRY POLICIES
-- ------------------------------------------------------------

create policy "Authenticated users can read active event types"
on public.nous_event_types
for select
to authenticated
using (
    is_active = true
);


-- ------------------------------------------------------------
-- 13. INDEXES
-- ------------------------------------------------------------

create index nous_bus_events_user_id_idx
on public.nous_bus_events(user_id);


create index nous_bus_events_type_idx
on public.nous_bus_events(event_type);


create index nous_bus_events_status_available_idx
on public.nous_bus_events(
    status,
    available_at
);


create index nous_bus_events_correlation_idx
on public.nous_bus_events(correlation_id);


create index nous_bus_events_created_at_idx
on public.nous_bus_events(created_at desc);


create index nous_bus_subscriptions_user_idx
on public.nous_bus_subscriptions(user_id);


create index nous_bus_subscriptions_pattern_idx
on public.nous_bus_subscriptions(event_pattern);


create index nous_bus_deliveries_event_idx
on public.nous_bus_deliveries(event_id);


create index nous_bus_deliveries_status_attempt_idx
on public.nous_bus_deliveries(
    status,
    next_attempt_at
);


create index nous_bus_actions_event_idx
on public.nous_bus_actions(event_id);


create index nous_bus_actions_user_status_idx
on public.nous_bus_actions(
    user_id,
    status
);


create index nous_event_types_owner_idx
on public.nous_event_types(owning_service);


-- ------------------------------------------------------------
-- 14. INITIAL EVENT TYPES
-- ------------------------------------------------------------

insert into public.nous_event_types (
    event_type,
    description,
    owning_service,
    sensitivity
)
values
    (
        'system.runtime.started',
        'The NOUS runtime has started.',
        'runtime',
        'standard'
    ),
    (
        'companion.message.received',
        'A user message was received by the Companion.',
        'companion',
        'personal'
    ),
    (
        'calendar.event.created',
        'A calendar event was created.',
        'calendar',
        'personal'
    ),
    (
        'calendar.event.started',
        'A calendar event has reached its scheduled start time.',
        'calendar',
        'personal'
    ),
    (
        'education.assignment.created',
        'An education assignment was added.',
        'education',
        'personal'
    ),
    (
        'education.assignment.due',
        'An education assignment is approaching or has reached its due time.',
        'education',
        'personal'
    ),
    (
        'identity.profile.updated',
        'A NOUS identity profile was updated.',
        'identity',
        'sensitive'
    ),
    (
        'device.connected',
        'A device connected to the NOUS environment.',
        'presence',
        'sensitive'
    ),
    (
        'notification.requested',
        'A service requested that NOUS notify the user.',
        'notifications',
        'personal'
    ),
    (
        'action.user_confirmation.required',
        'A proposed action requires explicit user approval.',
        'runtime',
        'personal'
    );