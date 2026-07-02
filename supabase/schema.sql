-- SokaSafari Travel — Supabase schema (flights + buses booking)
-- Run in the Supabase SQL editor (or `supabase db reset` with this as a migration).
-- The app runs against an in-memory seed by default; configure NEXT_PUBLIC_SUPABASE_*
-- to switch the data driver to this schema.

create extension if not exists "pgcrypto";

-- Enums --------------------------------------------------------------------
do $$ begin
  create type travel_mode as enum ('flights', 'buses');
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_type as enum ('airport', 'bus_terminal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fare_class as enum ('economy','business','first','standard','vip');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending','confirmed','cancelled','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid','paid','refunded','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('customer','admin');
exception when duplicate_object then null; end $$;

-- Profiles (extends auth.users) --------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- Catalog ------------------------------------------------------------------
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  city text not null,
  country text not null,
  country_code text not null,
  type location_type not null
);

create table if not exists operators (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  mode travel_mode not null,
  logo_color text not null default '#3B9EFF',
  rating numeric(2,1) not null default 4.0
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  mode travel_mode not null,
  origin_id uuid not null references locations(id),
  destination_id uuid not null references locations(id),
  minutes int not null,
  base_price numeric(10,2) not null,
  stops int not null default 0
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  operator_id uuid not null references operators(id),
  mode travel_mode not null,
  depart_at timestamptz not null,
  arrive_at timestamptz not null,
  vehicle text not null,
  service_number text not null,
  stops int not null default 0,
  base_price numeric(10,2) not null,
  currency text not null default 'USD',
  total_seats int not null,
  seats_available int not null
);
create index if not exists trips_search_idx on trips (mode, depart_at);

create table if not exists fares (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  fare_class fare_class not null,
  label text not null,
  price numeric(10,2) not null,
  refundable boolean not null default false,
  baggage_kg int not null default 20,
  seats_available int not null
);

create table if not exists seats (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  number text not null,
  row int not null,
  col text not null,
  fare_class fare_class not null,
  status text not null default 'available',
  price_modifier numeric(10,2) not null default 0,
  unique (trip_id, number)
);

-- Bookings -----------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  pnr text unique not null,
  mode travel_mode not null,
  trip_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  contact_email text not null,
  contact_phone text not null,
  status booking_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  passenger_count int not null default 1,
  total_amount numeric(10,2) not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  document_type text not null default 'passport',
  document_number text not null,
  nationality text not null,
  seat_number text,
  fare_class fare_class not null default 'economy'
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  provider text not null default 'mock',
  status payment_status not null default 'unpaid',
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- RLS ----------------------------------------------------------------------
alter table profiles enable row level security;
alter table bookings enable row level security;
alter table passengers enable row level security;

-- Catalog tables are world-readable (public booking search).
alter table locations enable row level security;
alter table operators enable row level security;
alter table routes enable row level security;
alter table trips enable row level security;
alter table fares enable row level security;
alter table seats enable row level security;

do $$ begin
  create policy "catalog readable" on locations for select using (true);
  create policy "catalog readable" on operators for select using (true);
  create policy "catalog readable" on routes for select using (true);
  create policy "catalog readable" on trips for select using (true);
  create policy "catalog readable" on fares for select using (true);
  create policy "catalog readable" on seats for select using (true);
exception when duplicate_object then null; end $$;

-- A user sees their own profile + bookings; admins see all.
create or replace function is_admin() returns boolean language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

do $$ begin
  create policy "own profile" on profiles for select using (id = auth.uid() or is_admin());
  create policy "own bookings" on bookings for select using (user_id = auth.uid() or is_admin());
  create policy "insert bookings" on bookings for insert with check (true);
  create policy "admin update bookings" on bookings for update using (is_admin());
exception when duplicate_object then null; end $$;

-- Auto-create a profile row on signup.
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Migration: trip_id was uuid FK in an earlier schema version; trips are now
-- generated on-the-fly and never stored, so the column must be plain text.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'bookings' and column_name = 'trip_id' and data_type = 'uuid'
  ) then
    alter table bookings drop constraint if exists bookings_trip_id_fkey;
    alter table bookings alter column trip_id type text using trip_id::text;
  end if;
end $$;
