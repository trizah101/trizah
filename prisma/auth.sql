-- TRIZAH authentication schema hardening.
-- Run after `prisma db push`:
--   npx prisma db execute --file prisma/auth.sql --schema prisma/schema.prisma
--
-- This file is idempotent. It never touches business/financial tables.

-- ---------------------------------------------------------------------------
-- 1. Profiles table (Prisma also manages this model)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'viewer'
    check (role in ('super_admin', 'admin', 'accountant', 'operations', 'viewer')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prisma's @updatedAt is application-level only; give the trigger-safe default.
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);

-- Prisma does not model auth.users, so add the cascade FK explicitly.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The anon role must never read profiles.
revoke all on public.profiles from anon;

-- Authenticated users may read their own row (enforced by RLS) and change
-- only their display name. Role and status are intentionally not grantable.
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Keep updated_at fresh for SQL-level updates
-- ---------------------------------------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Create a profile for every new Supabase auth user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_super boolean;
begin
  -- Serialise the very first registration so two simultaneous signups cannot
  -- both become Super Admin.
  perform pg_advisory_xact_lock(hashtext('trizah.profiles.bootstrap'));

  select exists (select 1 from public.profiles where role = 'super_admin')
    into has_super;

  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when has_super then 'viewer' else 'super_admin' end,
    case when has_super then 'pending' else 'active' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. Backfill profiles for auth users that predate this migration
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, role, status)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'viewer',
  'pending'
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- Safe bootstrap: if the project has exactly one account and no Super Admin,
-- promote it. This covers an owner who registered before this migration ran.
do $$
declare
  total_profiles integer;
begin
  select count(*) into total_profiles from public.profiles;
  if total_profiles = 1 and not exists (
    select 1 from public.profiles where role = 'super_admin'
  ) then
    update public.profiles set role = 'super_admin', status = 'active';
  end if;
end;
$$;
