
-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  is_pro boolean not null default false,
  pro_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles: owner select" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles: owner update" on public.profiles
  for update using (auth.uid() = id);
create policy "Profiles: owner insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Designs table
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled cake',
  data jsonb not null default '{}'::jsonb,
  preview_url text,
  is_unlocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index designs_user_id_idx on public.designs(user_id);

alter table public.designs enable row level security;

create policy "Designs: owner select" on public.designs
  for select using (auth.uid() = user_id);
create policy "Designs: owner insert" on public.designs
  for insert with check (auth.uid() = user_id);
create policy "Designs: owner update" on public.designs
  for update using (auth.uid() = user_id);
create policy "Designs: owner delete" on public.designs
  for delete using (auth.uid() = user_id);

create trigger designs_set_updated_at
  before update on public.designs
  for each row execute function public.set_updated_at();
