-- 0002_rls_policies.sql — Row Level Security Policies

alter table public.profiles    enable row level security;
alter table public.projects    enable row level security;
alter table public.panoramas   enable row level security;
alter table public.hotspots    enable row level security;
alter table public.shares      enable row level security;

-- Helper: admin mi?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ====== PROFILES ======
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin())
  with check (public.is_admin());

-- ====== PROJECTS ======
create policy "projects_owner_read" on public.projects
  for select using ((owner_id = auth.uid() or public.is_admin()) and deleted_at is null);

create policy "projects_admin_insert" on public.projects
  for insert with check (public.is_admin());

create policy "projects_owner_update" on public.projects
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "projects_admin_delete" on public.projects
  for delete using (public.is_admin());

-- ====== PANORAMAS ======
create policy "panoramas_read" on public.panoramas
  for select using (
    deleted_at is null and (
      public.is_admin() or
      exists (select 1 from public.projects p where p.id = panoramas.project_id and p.owner_id = auth.uid())
    )
  );

create policy "panoramas_admin_write" on public.panoramas
  for all using (public.is_admin())
  with check (public.is_admin());

-- ====== HOTSPOTS ======
create policy "hotspots_read" on public.hotspots
  for select using (
    public.is_admin() or
    exists (
      select 1 from public.panoramas pn
      join public.projects p on p.id = pn.project_id
      where pn.id = hotspots.panorama_id and p.owner_id = auth.uid()
    )
  );

create policy "hotspots_admin_write" on public.hotspots
  for all using (public.is_admin())
  with check (public.is_admin());

-- ====== SHARES ======
create policy "shares_read" on public.shares
  for select using (
    public.is_admin() or
    exists (select 1 from public.projects p where p.id = shares.project_id and p.owner_id = auth.uid())
  );

create policy "shares_insert" on public.shares
  for insert with check (
    public.is_admin() or
    exists (select 1 from public.projects p where p.id = shares.project_id and p.owner_id = auth.uid())
  );

create policy "shares_update" on public.shares
  for update using (
    public.is_admin() or
    exists (select 1 from public.projects p where p.id = shares.project_id and p.owner_id = auth.uid())
  );
