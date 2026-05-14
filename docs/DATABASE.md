# DATABASE.md — Supabase Schema

> Bu dosyadaki SQL bloklarını `supabase/migrations/` altına sırayla numaralı dosyalar olarak koy. Her birini `supabase db push` ile uygula.

---

## Genel İlkeler

1. Tüm tablolarda `id` UUID, `created_at` timestamptz default now(), `updated_at` timestamptz (trigger ile güncellenir).
2. **RLS her tabloda aktif.** Policy'siz tabloya kimse erişemez.
3. Soft delete: `deleted_at` kolonu (null değilse silinmiş). Default queryler `is null` ile filtreler.
4. Tüm foreign key'ler `on delete` davranışı tanımlı.

---

## Migration 0001 — Initial Schema

```sql
-- supabase/migrations/0001_init.sql

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Custom types
create type user_role as enum ('admin', 'client');
create type project_type as enum ('real_estate', 'boat', 'other');
create type project_status as enum ('draft', 'published', 'archived');
create type panorama_status as enum ('uploading', 'processing', 'ready', 'failed');
create type hotspot_type as enum ('link', 'info');

-- 1. PROFILES — auth.users'ı extend eder
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
  location text,                              -- "Bodrum, Yalıkavak"
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
  position int not null default 0,            -- sıralama
  storage_key text not null,                  -- R2 key: panoramas/{projectId}/{id}.jpg
  thumbnail_key text,                         -- thumbnails/{projectId}/{id}.webp
  width int,                                  -- equirectangular genişlik
  height int,
  file_size bigint,
  status panorama_status not null default 'uploading',
  -- Default kamera açısı (PSV format)
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
  -- Konum (PSV koordinatları)
  yaw double precision not null,
  pitch double precision not null,
  -- Link hotspot için
  target_panorama_id uuid references public.panoramas(id) on delete set null,
  -- Info hotspot için
  title text,
  description text,
  image_url text,
  -- Stil
  icon text default 'default',
  color text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hotspots_panorama_idx on public.hotspots(panorama_id);
create index hotspots_target_idx on public.hotspots(target_panorama_id);

-- Constraint: link tipinin target'ı olmalı
alter table public.hotspots add constraint hotspots_link_has_target
  check (type != 'link' or target_panorama_id is not null);

-- 5. SHARES — public paylaşım linkleri
create table public.shares (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique,                 -- /v/{token}
  password_hash text,                         -- opsiyonel, bcrypt
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

-- Admin email'i bir kez ayarla (env'den gelecek):
-- ALTER DATABASE postgres SET app.admin_email = 'tasarim@cihanduran.com';
```

> **Not:** Yukarıdaki son `ALTER DATABASE` komutu Supabase Studio SQL Editor'da bir kez çalıştırılır. Veya seed migrasyonunda yapılır.

---

## Migration 0002 — RLS Policies

```sql
-- supabase/migrations/0002_rls_policies.sql

-- Tüm tablolarda RLS aktif
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
-- Herkes kendi profilini görür, admin hepsini
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Kendi profilini güncelleyebilir
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
  -- Kullanıcı kendi rolünü değiştiremez!

-- Admin tüm profilleri yönetir
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin())
  with check (public.is_admin());

-- ====== PROJECTS ======
-- Owner ve admin görür
create policy "projects_owner_read" on public.projects
  for select using ((owner_id = auth.uid() or public.is_admin()) and deleted_at is null);

-- Sadece admin proje oluşturur
create policy "projects_admin_insert" on public.projects
  for insert with check (public.is_admin());

-- Owner kendi projesini güncelleyebilir (title/desc), admin hepsini
create policy "projects_owner_update" on public.projects
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- Sadece admin siler (soft delete update ile yapılır)
create policy "projects_admin_delete" on public.projects
  for delete using (public.is_admin());

-- ====== PANORAMAS ======
-- Project ownerı veya admin görür
create policy "panoramas_read" on public.panoramas
  for select using (
    deleted_at is null and (
      public.is_admin() or
      exists (select 1 from public.projects p where p.id = panoramas.project_id and p.owner_id = auth.uid())
    )
  );

-- Sadece admin oluşturur/günceller/siler
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
-- Project ownerı kendi share'lerini görür, admin hepsini
create policy "shares_read" on public.shares
  for select using (
    public.is_admin() or
    exists (select 1 from public.projects p where p.id = shares.project_id and p.owner_id = auth.uid())
  );

-- Owner kendi projeleri için share oluşturabilir, admin hepsi için
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
```

> **Önemli:** Public share viewer (`/v/{token}`) RLS'i bypass etmek için **server-side service role client** kullanır. Token doğrulamadan sonra service role ile project/panoramas çeker. Bu yüzden anon role'üne `shares` üzerinde select policy'si vermiyoruz — sadece authenticated kullanıcılar dashboard'dan görür.

---

## Migration 0003 — Analytics Tables

```sql
-- supabase/migrations/0003_analytics.sql

create type analytics_event_type as enum (
  'view_start',
  'view_end',
  'panorama_change',
  'hotspot_click',
  'fullscreen_enter',
  'vr_enter'
);

-- Raw event'ler (yüksek hacim)
create table public.analytics_events (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  panorama_id uuid references public.panoramas(id) on delete set null,
  hotspot_id uuid references public.hotspots(id) on delete set null,
  share_id uuid references public.shares(id) on delete set null,
  session_id text not null,                   -- anonim cookie
  event_type analytics_event_type not null,
  duration_ms int,                            -- view_end için
  country text,                               -- 2-harf ISO
  device_type text,                           -- mobile/tablet/desktop
  browser text,
  os text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_project_time_idx on public.analytics_events(project_id, created_at desc);
create index analytics_session_idx on public.analytics_events(session_id);
create index analytics_event_type_idx on public.analytics_events(event_type);
-- Time-based partitioning ileride eklenebilir (Phase 3, hacim yüksekse)

alter table public.analytics_events enable row level security;

-- Sadece project owner ve admin okuyabilir
create policy "analytics_read" on public.analytics_events
  for select using (
    public.is_admin() or
    exists (select 1 from public.projects p where p.id = analytics_events.project_id and p.owner_id = auth.uid())
  );

-- Insert sadece service role'den olur (API route'tan), client'lardan direkt insert yok
-- (Bu yüzden insert policy'si yok — RLS varsayılan deny)

-- ====== AGGREGATED VIEWS (materialized view alternatifi: normal view yeterli MVP'de) ======

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

-- View'lar RLS'i base table'dan miras alır
```

---

## Migration 0004 — Seed Admin

```sql
-- supabase/migrations/0004_seed_admin.sql

-- Bu migration sadece tek seferlik. Admin user Supabase Auth'tan elle oluşturulur,
-- handle_new_user() trigger'ı otomatik admin role atar (ADMIN_EMAIL eşleşince).

-- Eğer manuel atama gerekiyorsa:
-- update public.profiles set role = 'admin' where email = 'tasarim@cihanduran.com';
```

---

## TypeScript Tipler

Migration'lar uygulandıktan sonra:

```bash
npx supabase gen types typescript --linked > src/types/supabase.ts
```

Domain tipleri ayrıca elle yazılır:

```typescript
// src/types/domain.ts
export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  type: 'real_estate' | 'boat' | 'other';
  status: 'draft' | 'published' | 'archived';
  coverUrl: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Panorama {
  id: string;
  projectId: string;
  title: string;
  position: number;
  imageUrl: string;          // computed: R2_PUBLIC_URL + storage_key
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  defaultYaw: number;
  defaultPitch: number;
  defaultZoom: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  hotspots?: Hotspot[];
}

export interface Hotspot {
  id: string;
  panoramaId: string;
  type: 'link' | 'info';
  yaw: number;
  pitch: number;
  targetPanoramaId: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  icon: string;
  color: string | null;
}
```

---

## Test Verisi (Phase 1 sonu)

Migration'lar bittikten sonra Supabase Studio'da bir test client oluştur:
1. Auth → Users → Invite User → `test@example.com`
2. SQL Editor: `update profiles set full_name = 'Test Müşteri', company_name = 'Test Emlak' where email = 'test@example.com';`
3. Admin panelinden bu kullanıcıya bir proje ata.
