-- ShoeScanner schema. Run this in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run.

-- ---------- profiles (mirrors auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  scan_credits int not null default 3,   -- free starter scans
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- scans ----------
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending',   -- pending | analyzing | priced | failed
  -- Shoe identification
  brand text,
  model text,
  colorway text,
  sku text,
  size text,
  -- Condition grading
  condition_grade text,                      -- DS | VNDS | USED | BEAT
  condition_score int,                       -- 0-100
  flaws jsonb,                               -- [{type, severity, location}]
  -- Storage paths (supabase storage bucket "shoe-photos")
  photo_left text,
  photo_right text,
  photo_top text,
  photo_sole text,
  -- Pricing results
  price_floor numeric(10,2),
  price_recommended numeric(10,2),
  price_ceiling numeric(10,2),
  net_profit_estimate jsonb,                 -- { stockx, goat, ebay, depop }
  days_to_sell int,
  demand_score int,                          -- 0-100
  comps jsonb,                               -- raw comps used
  best_platform text,
  -- Meta
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scans_user_id_idx on public.scans (user_id, created_at desc);

alter table public.scans enable row level security;

drop policy if exists "read own scans" on public.scans;
create policy "read own scans" on public.scans
  for select using (auth.uid() = user_id);

drop policy if exists "insert own scans" on public.scans;
create policy "insert own scans" on public.scans
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own scans" on public.scans;
create policy "update own scans" on public.scans
  for update using (auth.uid() = user_id);

-- ---------- storage bucket for photos ----------
-- Run the bucket creation in the Supabase dashboard (Storage → New bucket → "shoe-photos" → Private)
-- Then run these policies:

-- Allow authenticated users to upload into their own folder
drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'shoe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "read own photos" on storage.objects;
create policy "read own photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'shoe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own photos" on storage.objects;
create policy "delete own photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'shoe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
