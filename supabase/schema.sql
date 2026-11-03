-- NutriTrack schema for Supabase (Postgres + Auth + RLS)
-- Run in the Supabase SQL editor after creating a project.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  height_cm numeric(5, 1),
  starting_weight_kg numeric(5, 1),
  target_weight_kg numeric(5, 1),
  daily_calorie_goal integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
);

create index if not exists weight_logs_user_logged_on_idx
  on public.weight_logs (user_id, logged_on desc);

create index if not exists food_logs_user_logged_on_idx
  on public.food_logs (user_id, logged_on desc);

alter table public.profiles enable row level security;
alter table public.weight_logs enable row level security;
alter table public.food_logs enable row level security;

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

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
