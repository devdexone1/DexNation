-- =========================================================
-- DEXNATION — CREATE CORE TABLES
-- Run this BEFORE create_nation_rpc.sql
-- =========================================================

create extension if not exists pgcrypto;

-- 1) NATIONS (File 02 §8.1)
create table if not exists nations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar not null unique,
  continent_id varchar not null,
  cash_balance bigint not null default 500000 check (cash_balance >= 0),
  population bigint not null default 100000 check (population >= 0),
  approval_rating numeric(5,2) not null default 50.00 check (approval_rating between 0 and 100),
  daily_gdp bigint not null default 0,
  created_at timestamptz not null default now()
);

-- 2) GOVERNMENTS (File 04 §6.1)
create table if not exists governments (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid not null unique references nations(id) on delete cascade,
  ideology varchar not null default 'DEMOCRACY',
  tax_rate numeric(4,2) not null default 10.00 check (tax_rate between 0 and 30),
  last_ideology_change_tick int not null default 0 check (last_ideology_change_tick >= 0),
  political_stability numeric(5,2) not null default 100.00,
  updated_at timestamptz not null default now()
);

-- 3) BUILDING_TYPES (File 02 §8.3) — master catalogue, seeded below
create table if not exists building_types (
  id varchar primary key,
  name varchar not null,
  category varchar not null,
  tier varchar not null,
  build_time_ticks int not null default 1,
  cost_cash bigint not null default 0,
  cost_steel int not null default 0,
  input_resources jsonb,
  output_resources jsonb,
  electricity_mw_delta int not null default 0
);

-- 4) NATION_STOCKS (File 02 §8.2)
create table if not exists nation_stocks (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid not null references nations(id) on delete cascade,
  resource_type varchar not null,
  amount bigint not null default 0 check (amount >= 0),
  max_capacity bigint not null default 10000,
  unique (nation_id, resource_type)
);

-- 5) NATION_BUILDINGS (File 02 §8.4)
create table if not exists nation_buildings (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid not null references nations(id) on delete cascade,
  building_type_id varchar not null references building_types(id),
  status varchar not null default 'ACTIVE',
  completion_tick int,
  created_at timestamptz not null default now()
);

-- =========================================================
-- SEED building_types — REQUIRED, since the create_nation RPC
-- references these ids for the starter pack
-- =========================================================
insert into building_types (id, name, category, tier, cost_cash, cost_steel, output_resources)
values
  ('grain_farm', 'Grain Farm', 'EXTRACTION', 'Normal', 50000, 20, '{"Food": 500}'),
  ('coal_mine', 'Coal Mine', 'EXTRACTION', 'Normal', 75000, 40, '{"Coal": 300}'),
  ('iron_mine', 'Iron Mine', 'EXTRACTION', 'Normal', 80000, 50, '{"Iron Ore": 250}'),
  ('wind_turbine', 'Wind Turbine Array', 'ENERGY', 'Normal', 30000, 15, '{"Electricity": 30}'),
  ('starter_warehouse', 'Starter Warehouse', 'LOGISTICS', 'Normal', 0, 0, null)
on conflict (id) do nothing;

-- =========================================================
-- ROW LEVEL SECURITY (condensed, per File 07)
-- =========================================================
alter table nations enable row level security;
alter table governments enable row level security;
alter table nation_stocks enable row level security;
alter table nation_buildings enable row level security;
alter table building_types enable row level security;

create policy "nations read public" on nations for select using (true);
create policy "nations update own" on nations for update using (auth.uid() = user_id);

create policy "governments read own" on governments for select
  using (nation_id in (select id from nations where user_id = auth.uid()));

create policy "stocks read own" on nation_stocks for select
  using (nation_id in (select id from nations where user_id = auth.uid()));

create policy "buildings read own" on nation_buildings for select
  using (nation_id in (select id from nations where user_id = auth.uid()));

create policy "building_types read public" on building_types for select using (true);
