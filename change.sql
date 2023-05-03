ALTER TABLE public.trims ALTER COLUMN power TYPE int4 USING power::int4;

# 03/05/2023

ALTER TABLE public.car_brands ADD description text NULL;
