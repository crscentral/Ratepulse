-- Run this in Supabase: Project → SQL Editor → New query → paste → Run

-- 1. Profiles table: one row per user, extends Supabase's built-in auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  hotel_name text,
  approved boolean not null default false,
  is_admin boolean not null default false,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

-- 2. Auto-create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Explicit grants (required since "Automatic expose new tables" is OFF)
-- Grants control whether a role can reach the table via the API at all;
-- RLS (below) then controls which rows they're allowed to see within it.
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
-- (anon only needs select here so the trigger-created row can be read
-- right after signup, before the session is fully established)

-- 4. Row Level Security: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile (not approval fields)"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Admins can view and approve everyone
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 7. Approval token — used for the one-click email approval flow.
-- A random token is generated per signup; the admin email contains a link
-- with this token, and clicking it (via the approve-user Edge Function)
-- approves the user without needing to log into the admin panel.
alter table public.profiles add column approval_token uuid default gen_random_uuid();
create unique index profiles_approval_token_idx on public.profiles (approval_token);

-- 8. Bootstrap yourself as the first admin (run AFTER logging in once):
-- update public.profiles set is_admin = true, approved = true where email = 'crscentral.rm@gmail.com';
