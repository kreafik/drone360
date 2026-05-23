do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'area'
      and enumtypid = 'hotspot_type'::regtype
  ) then
    alter type hotspot_type add value 'area';
  end if;
end $$;
