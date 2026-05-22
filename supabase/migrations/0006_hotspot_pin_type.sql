-- Add 'pin' value to hotspot_type enum
alter type public.hotspot_type add value if not exists 'pin';
