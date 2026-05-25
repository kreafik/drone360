-- 0012_fix_projects_rls.sql
-- Fix: inside EXISTS subquery, unqualified `id` was resolved to pm.id (alias)
-- instead of projects.id. Use projects.id explicitly.

drop policy "projects_read"   on public.projects;
drop policy "projects_update" on public.projects;

create policy "projects_read" on public.projects
  for select using (
    deleted_at is null and (
      public.is_admin()
      or owner_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = projects.id and pm.user_id = auth.uid()
      )
    )
  );

create policy "projects_update" on public.projects
  for update using (
    public.is_admin()
    or owner_id = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role = 'editor'
    )
  )
  with check (
    public.is_admin()
    or owner_id = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role = 'editor'
    )
  );
