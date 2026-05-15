-- 0005_branding.sql — White-label branding fields for client profiles

alter table public.profiles
  add column if not exists brand_name text,
  add column if not exists brand_logo_url text,
  add column if not exists brand_primary_color text;

comment on column public.profiles.brand_name is 'Public viewer''de gösterilecek marka adı (boşsa company_name kullanılır)';
comment on column public.profiles.brand_logo_url is 'Public viewer sol üst köşesinde gösterilecek logo URL';
comment on column public.profiles.brand_primary_color is 'Marka ana rengi (CSS hex, ör: #ff5500)';
