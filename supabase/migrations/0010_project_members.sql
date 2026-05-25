-- 0010_project_members.sql
-- Adds project_members table and expands RLS policies so client-role users
-- can own/edit projects and admin can assign projects to other users.

-- ====== project_members ======

create table public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'editor'
                check (role in ('viewer', 'editor')),
  created_at  timestamptz not null default now(),
  unique (project_id, user_id)
);

create index project_members_project_idx on public.project_members(project_id);
create index project_members_user_idx    on public.project_members(user_id);

alter table public.project_members enable row level security;

-- Admin can do anything; members can read their own rows
create policy "pm_admin_all" on public.project_members
  for all using (public.is_admin()) with check (public.is_admin());

create policy "pm_self_read" on public.project_members
  for select using (user_id = auth.uid());

-- ====== PROJECTS: expand policies ======

-- Read: own + assigned + admin (non-deleted only)
drop policy "projects_owner_read" on public.projects;
create policy "projects_read" on public.projects
  for select using (
    deleted_at is null and (
      public.is_admin()
      or owner_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = id and pm.user_id = auth.uid()
      )
    )
  );

-- Insert: any authenticated user can create a project they own
drop policy "projects_admin_insert" on public.projects;
create policy "projects_insert" on public.projects
  for insert with check (
    auth.uid() is not null
    and (public.is_admin() or owner_id = auth.uid())
  );

-- Update: owner + editor member + admin
drop policy "projects_owner_update" on public.projects;
create policy "projects_update" on public.projects
  for update using (
    public.is_admin()
    or owner_id = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = id and pm.user_id = auth.uid() and pm.role = 'editor'
    )
  )
  with check (
    public.is_admin()
    or owner_id = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = id and pm.user_id = auth.uid() and pm.role = 'editor'
    )
  );

-- ====== PANORAMAS: expand policies ======

drop policy "panoramas_read"        on public.panoramas;
drop policy "panoramas_admin_write" on public.panoramas;

create policy "panoramas_read" on public.panoramas
  for select using (
    deleted_at is null and (
      public.is_admin()
      or exists (
        select 1 from public.projects p
        where p.id = panoramas.project_id and (
          p.owner_id = auth.uid()
          or exists (
            select 1 from public.project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
      )
    )
  );

create policy "panoramas_write" on public.panoramas
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = panoramas.project_id and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role = 'editor'
        )
      )
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = panoramas.project_id and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role = 'editor'
        )
      )
    )
  );

-- ====== HOTSPOTS: expand policies ======

drop policy "hotspots_read"        on public.hotspots;
drop policy "hotspots_admin_write" on public.hotspots;

create policy "hotspots_read" on public.hotspots
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.panoramas pn
      join public.projects p on p.id = pn.project_id
      where pn.id = hotspots.panorama_id and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
      )
    )
  );

create policy "hotspots_write" on public.hotspots
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.panoramas pn
      join public.projects p on p.id = pn.project_id
      where pn.id = hotspots.panorama_id and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role = 'editor'
        )
      )
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.panoramas pn
      join public.projects p on p.id = pn.project_id
      where pn.id = hotspots.panorama_id and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role = 'editor'
        )
      )
    )
  );
