-- 0004_seed_admin.sql
-- Admin email'i Supabase'e tanıt (handle_new_user trigger'ı bunu kullanır)
-- Bu migration çalıştıktan sonra Supabase Studio → Auth → Users → Invite User ile
-- tasarim@cihanduran.com invite edilmeli.

alter database postgres set app.admin_email = 'tasarim@cihanduran.com';
