-- 0004_seed_admin.sql
-- handle_new_user fonksiyonunu admin email'i hardcode edecek şekilde güncelle.
-- (ALTER DATABASE Supabase cloud'da izin vermiyor, bu yüzden direkt embed ediyoruz.)

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = 'tasarim@cihanduran.com' then 'admin'::user_role
         else 'client'::user_role end
  );
  return new;
end;
$$;
