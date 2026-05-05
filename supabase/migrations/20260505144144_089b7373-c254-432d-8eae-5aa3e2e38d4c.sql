create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slices integer not null check (slices > 0),
  max_uses integer,
  uses_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

create policy "Coupons: authenticated read active"
  on public.coupons for select
  to authenticated
  using (active = true);

create policy "Coupons: service role manages"
  on public.coupons for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create trigger trg_coupons_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null,
  slices_granted integer not null,
  created_at timestamptz not null default now(),
  unique (coupon_id, user_id)
);

create index idx_coupon_redemptions_user on public.coupon_redemptions(user_id);

alter table public.coupon_redemptions enable row level security;

create policy "Redemptions: owner select"
  on public.coupon_redemptions for select
  using (auth.uid() = user_id);

create policy "Redemptions: service role manages"
  on public.coupon_redemptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

insert into public.coupons (code, slices, max_uses, note)
values ('SWEET50', 50, 200, 'Influencer test code - 50 free slices');