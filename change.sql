ALTER TABLE public.trims ALTER COLUMN power TYPE int4 USING power::int4;

# 03/05/2023

ALTER TABLE public.car_brands ADD description text NULL;

# 06/05/2023

update trims t set "fuelConsumption" = 0 where "fuelConsumption" = '';
ALTER TABLE public.trims ALTER COLUMN "fuelConsumption" TYPE float4 USING "fuelConsumption"::float4;

# 18/05/2023

ALTER TABLE public.car_brands ADD coverImage varchar(255) NULL;