do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'text'
      and enumtypid = 'hotspot_type'::regtype
  ) then
    alter type hotspot_type add value 'text';
  end if;
end $$;
