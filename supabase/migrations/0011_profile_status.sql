-- 0011_profile_status.sql
-- Adds approval status to profiles so admin can manually approve new registrations.

alter table public.profiles
  add column status text not null default 'active'
  check (status in ('pending', 'active'));

-- Existing users are already active
update public.profiles set status = 'active';

-- New signups via the app register as pending (admin is always active)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role, status)
  values (
    new.id,
    new.email,
    case when new.email = current_setting('app.admin_email', true)
         then 'admin'::user_role else 'client'::user_role end,
    case when new.email = current_setting('app.admin_email', true)
         then 'active' else 'pending' end
  );
  return new;
end;
$$;
