-- Atomic view count increment for share links.
-- Called server-side (admin client) on each public viewer page load.
create or replace function increment_share_view_count(share_id uuid)
returns void
language sql
security definer
as $$
  update shares set view_count = view_count + 1 where id = share_id;
$$;
