-- 0001_init.sql — Initial Schema

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Custom types
create type user_role as enum ('admin', 'client');
create type project_type as enum ('real_estate', 'boat', 'other');
create type project_status as enum ('draft', 'published', 'archived');
create type panorama_status as enum ('uploading', 'processing', 'ready', 'failed');
create type hotspot_type as enum ('link', 'info');

-- 1. PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  company_name text,
  avatar_url text,
  role user_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- 2. PROJECTS
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text,
  type project_type not null default 'real_estate',
  status project_status not null default 'draft',
  cover_url text,
  location text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index projects_owner_idx on public.projects(owner_id) where deleted_at is null;
create index projects_status_idx on public.projects(status) where deleted_at is null;
create index projects_type_idx on public.projects(type) where deleted_at is null;

-- 3. PANORAMAS
create table public.panoramas (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  position int not null default 0,
  storage_key text not null,
  thumbnail_key text,
  width int,
  height int,
  file_size bigint,
  status panorama_status not null default 'uploading',
  default_yaw double precision default 0,
  default_pitch double precision default 0,
  default_zoom int default 50,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index panoramas_project_idx on public.panoramas(project_id) where deleted_at is null;
create index panoramas_status_idx on public.panoramas(status);
create unique index panoramas_project_position_idx on public.panoramas(project_id, position) where deleted_at is null;

-- 4. HOTSPOTS
create table public.hotspots (
  id uuid primary key default uuid_generate_v4(),
  panorama_id uuid not null references public.panoramas(id) on delete cascade,
  type hotspot_type not null,
  yaw double precision not null,
  pitch double precision not null,
  target_panorama_id uuid references public.panoramas(id) on delete set null,
  title text,
  description text,
  image_url text,
  icon text default 'default',
  color text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hotspots_panorama_idx on public.hotspots(panorama_id);
create index hotspots_target_idx on public.hotspots(target_panorama_id);

alter table public.hotspots add constraint hotspots_link_has_target
  check (type != 'link' or target_panorama_id is not null);

-- 5. SHARES
create table public.shares (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique,
  password_hash text,
  expires_at timestamptz,
  view_count int not null default 0,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shares_token_idx on public.shares(token) where is_active = true;
create index shares_project_idx on public.shares(project_id);

-- 6. UPDATED_AT TRIGGER
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger panoramas_updated_at before update on public.panoramas
  for each row execute function public.set_updated_at();
create trigger hotspots_updated_at before update on public.hotspots
  for each row execute function public.set_updated_at();
create trigger shares_updated_at before update on public.shares
  for each row execute function public.set_updated_at();

-- 7. AUTH TRIGGER — yeni user oluşunca profile oluştur
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = current_setting('app.admin_email', true) then 'admin'::user_role
         else 'client'::user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
