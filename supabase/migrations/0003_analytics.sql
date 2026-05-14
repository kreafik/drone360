-- 0003_analytics.sql — Analytics Tables

create type analytics_event_type as enum (
  'view_start',
  'view_end',
  'panorama_change',
  'hotspot_click',
  'fullscreen_enter',
  'vr_enter'
);

create table public.analytics_events (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  panorama_id uuid references public.panoramas(id) on delete set null,
  hotspot_id uuid references public.hotspots(id) on delete set null,
  share_id uuid references public.shares(id) on delete set null,
  session_id text not null,
  event_type analytics_event_type not null,
  duration_ms int,
  country text,
  device_type text,
  browser text,
  os text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_project_time_idx on public.analytics_events(project_id, created_at desc);
create index analytics_session_idx on public.analytics_events(session_id);
create index analytics_event_type_idx on public.analytics_events(event_type);

alter table public.analytics_events enable row level security;

create policy "analytics_read" on public.analytics_events
  for select using (
    public.is_admin() or
    exists (select 1 from public.projects p where p.id = analytics_events.project_id and p.owner_id = auth.uid())
  );

create or replace view public.project_stats as
select
  e.project_id,
  count(*) filter (where e.event_type = 'view_start') as total_views,
  count(distinct e.session_id) filter (where e.event_type = 'view_start') as unique_visitors,
  avg(e.duration_ms) filter (where e.event_type = 'view_end' and e.duration_ms is not null) as avg_duration_ms,
  count(*) filter (where e.event_type = 'hotspot_click') as hotspot_clicks,
  max(e.created_at) as last_view_at
from public.analytics_events e
group by e.project_id;
