-- NutriTrack schema for Supabase (Postgres + Auth + RLS)
-- Run in the Supabase SQL editor after creating a project.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  gender text check (gender is null or gender in ('male', 'female')),
  height_cm numeric(5, 1),
  height_unit text not null default 'cm' check (height_unit in ('cm', 'ft')),
  starting_weight_kg numeric(5, 1),
  target_weight_kg numeric(5, 1),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  daily_calorie_goal integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing projects: add gender / unit prefs if missing
alter table public.profiles
  add column if not exists gender text;

alter table public.profiles
  add column if not exists height_unit text;

alter table public.profiles
  add column if not exists weight_unit text;

update public.profiles set height_unit = 'cm' where height_unit is null;
update public.profiles set weight_unit = 'kg' where weight_unit is null;

alter table public.profiles
  alter column height_unit set default 'cm';

alter table public.profiles
  alter column weight_unit set default 'kg';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_gender_check'
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender is null or gender in ('male', 'female'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_height_unit_check'
  ) then
    alter table public.profiles
      add constraint profiles_height_unit_check
      check (height_unit in ('cm', 'ft'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_weight_unit_check'
  ) then
    alter table public.profiles
      add constraint profiles_weight_unit_check
      check (weight_unit in ('kg', 'lb'));
  end if;
end $$;

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null,
  weight_kg numeric(5, 1) not null,
  created_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null,
  calories integer,
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- Existing projects: add meal photo column if missing
alter table public.food_logs
  add column if not exists photo_url text;

-- Body circumference measurements (inches); one set per user per day
-- thigh_in is required for new installs. Existing DBs: backfill then
--   alter table public.body_logs alter column thigh_in set not null;
create table if not exists public.body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null,
  waist_in numeric(5, 1) not null,
  hip_in numeric(5, 1) not null,
  thigh_in numeric(5, 1) not null,
  created_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

create table if not exists public.step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null,
  steps integer not null check (steps >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

create index if not exists weight_logs_user_logged_on_idx
  on public.weight_logs (user_id, logged_on desc);

create index if not exists food_logs_user_logged_on_idx
  on public.food_logs (user_id, logged_on desc);

create index if not exists body_logs_user_logged_on_idx
  on public.body_logs (user_id, logged_on desc);

create index if not exists step_logs_user_logged_on_idx
  on public.step_logs (user_id, logged_on desc);

alter table public.profiles enable row level security;
alter table public.weight_logs enable row level security;
alter table public.food_logs enable row level security;
alter table public.body_logs enable row level security;
alter table public.step_logs enable row level security;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Weight logs policies
create policy "weight_logs_select_own"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "weight_logs_insert_own"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "weight_logs_update_own"
  on public.weight_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "weight_logs_delete_own"
  on public.weight_logs for delete
  using (auth.uid() = user_id);

-- Food logs policies
create policy "food_logs_select_own"
  on public.food_logs for select
  using (auth.uid() = user_id);

create policy "food_logs_insert_own"
  on public.food_logs for insert
  with check (auth.uid() = user_id);

create policy "food_logs_update_own"
  on public.food_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "food_logs_delete_own"
  on public.food_logs for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Meal photos (Supabase Storage bucket: meal-photos)
-- Create the bucket in Dashboard → Storage (public read) or run:
--
--   insert into storage.buckets (id, name, public)
--   values ('meal-photos', 'meal-photos', true)
--   on conflict (id) do nothing;
--
-- Object paths: `{user_id}/{uuid}.{ext}`
-- ---------------------------------------------------------------------------
create policy "meal_photos_select_own"
  on storage.objects for select
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "meal_photos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "meal_photos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "meal_photos_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Body logs policies
create policy "body_logs_select_own"
  on public.body_logs for select
  using (auth.uid() = user_id);

create policy "body_logs_insert_own"
  on public.body_logs for insert
  with check (auth.uid() = user_id);

create policy "body_logs_update_own"
  on public.body_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "body_logs_delete_own"
  on public.body_logs for delete
  using (auth.uid() = user_id);

-- Step logs policies
create policy "step_logs_select_own"
  on public.step_logs for select
  using (auth.uid() = user_id);

create policy "step_logs_insert_own"
  on public.step_logs for insert
  with check (auth.uid() = user_id);

create policy "step_logs_update_own"
  on public.step_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "step_logs_delete_own"
  on public.step_logs for delete
  using (auth.uid() = user_id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, gender)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'gender' in ('male', 'female')
        then new.raw_user_meta_data->>'gender'
      else null
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
