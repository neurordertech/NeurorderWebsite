-- ============================================================
-- NOUS CORE 002
-- Presence Layer and Live Runtime
-- ============================================================

-- ------------------------------------------------------------
-- 1. USER DEVICES
-- Represents phones, tablets, computers, wearables and future
-- authorised environments through which NOUS may be present.
-- ------------------------------------------------------------

create table public.nous_devices (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    device_name text not null,

    device_type text not null
        check (
            device_type in (
                'phone',
                'tablet',
                'computer',
                'watch',
                'vehicle',
                'smart_home',
                'other'
            )
        ),

    platform text,
    app_version text,

    presence_enabled boolean not null default true,
    notifications_enabled boolean not null default false,
    wake_phrase_enabled boolean not null default false,

    last_seen_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.nous_devices is
'Authorised devices and environments through which NOUS may be present.';


-- ------------------------------------------------------------
-- 2. LIVE EVENTS
-- The event stream used by the NOUS Live Runtime.
-- Examples: calendar changes, reminders, user requests and
-- connected-device state changes.
-- ------------------------------------------------------------

create table public.nous_live_events (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    device_id uuid
        references public.nous_devices(id)
        on delete set null,

    event_type text not null,
    source text not null,

    payload jsonb not null default '{}'::jsonb,

    priority text not null default 'normal'
        check (
            priority in (
                'low',
                'normal',
                'high',
                'urgent'
            )
        ),

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'processing',
                'completed',
                'ignored',
                'failed'
            )
        ),

    occurred_at timestamptz not null default now(),
    processed_at timestamptz,
    created_at timestamptz not null default now()
);

comment on table public.nous_live_events is
'Authorised real-time events received by the NOUS Live Runtime.';


-- ------------------------------------------------------------
-- 3. PRESENCE SESSIONS
-- Records when a user actively opens or invokes NOUS.
-- This does not represent continuous microphone recording.
-- ------------------------------------------------------------

create table public.nous_presence_sessions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    device_id uuid
        references public.nous_devices(id)
        on delete set null,

    activation_method text not null
        check (
            activation_method in (
                'app',
                'widget',
                'notification',
                'wake_phrase',
                'shortcut',
                'system_integration'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'active',
                'completed',
                'cancelled',
                'failed'
            )
        ),

    started_at timestamptz not null default now(),
    ended_at timestamptz
);

comment on table public.nous_presence_sessions is
'User-initiated NOUS Presence sessions across authorised devices.';


-- ------------------------------------------------------------
-- 4. NOTIFICATION REQUESTS
-- Stores proposed notifications before they are delivered.
-- O.R.U.L.E. may decide to send, delay or suppress them.
-- ------------------------------------------------------------

create table public.nous_notification_requests (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.nous_profiles(id)
        on delete cascade,

    device_id uuid
        references public.nous_devices(id)
        on delete set null,

    live_event_id uuid
        references public.nous_live_events(id)
        on delete set null,

    title text not null,
    body text not null,

    status text not null default 'queued'
        check (
            status in (
                'queued',
                'sent',
                'delivered',
                'dismissed',
                'suppressed',
                'failed'
            )
        ),

    scheduled_for timestamptz,
    sent_at timestamptz,
    created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 5. UPDATED-AT TRIGGER
-- Reuses the function created by NOUS Core 001.
-- ------------------------------------------------------------

create trigger set_nous_devices_updated_at
before update on public.nous_devices
for each row
execute function public.set_nous_updated_at();


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.nous_devices enable row level security;
alter table public.nous_live_events enable row level security;
alter table public.nous_presence_sessions enable row level security;
alter table public.nous_notification_requests enable row level security;


-- Device policies

create policy "Users can read their own devices"
on public.nous_devices
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can register their own devices"
on public.nous_devices
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own devices"
on public.nous_devices
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own devices"
on public.nous_devices
for delete
to authenticated
using ((select auth.uid()) = user_id);


-- Live event policies

create policy "Users can read their own live events"
on public.nous_live_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own live events"
on public.nous_live_events
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
    and (
        device_id is null
        or exists (
            select 1
            from public.nous_devices
            where nous_devices.id = device_id
              and nous_devices.user_id = (select auth.uid())
        )
    )
);


-- Presence session policies

create policy "Users can read their own presence sessions"
on public.nous_presence_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own presence sessions"
on public.nous_presence_sessions
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
    and (
        device_id is null
        or exists (
            select 1
            from public.nous_devices
            where nous_devices.id = device_id
              and nous_devices.user_id = (select auth.uid())
        )
    )
);

create policy "Users can update their own presence sessions"
on public.nous_presence_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);


-- Notification policies

create policy "Users can read their own notification requests"
on public.nous_notification_requests
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own notification requests"
on public.nous_notification_requests
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own notification requests"
on public.nous_notification_requests
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);


-- ------------------------------------------------------------
-- 7. INDEXES
-- ------------------------------------------------------------

create index nous_devices_user_id_idx
on public.nous_devices(user_id);

create index nous_live_events_user_status_idx
on public.nous_live_events(user_id, status);

create index nous_live_events_occurred_at_idx
on public.nous_live_events(occurred_at desc);

create index nous_presence_sessions_user_id_idx
on public.nous_presence_sessions(user_id);

create index nous_notification_requests_user_status_idx
on public.nous_notification_requests(user_id, status);