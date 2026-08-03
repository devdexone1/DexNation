-- =============================================================================
-- DEXNATION — RPC: create_nation
-- Run this in the Supabase SQL Editor ONCE, AFTER create_core_tables.sql.
--
-- Why an RPC instead of direct inserts from the client?
-- File 07 (Security & RLS) states that `nation_stocks` and `nation_buildings`
-- may ONLY be written through a verified Stored Procedure / RPC — direct
-- client inserts are rejected entirely. This function wraps the whole
-- "create nation + starter pack" flow (File 02 §7) into a single atomic
-- server-side transaction, called from the Server Action
-- (app/create-nation/actions.ts).
--
-- Adjust table/column names below if your real schema differs slightly.
-- =============================================================================

create or replace function create_nation(
  nation_name text,
  chosen_ideology text,
  chosen_continent_id text
)
returns nations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_nation nations;
begin
  if exists (select 1 from nations where user_id = auth.uid()) then
    raise exception 'You already have a nation.';
  end if;

  insert into nations (user_id, name, continent_id, cash_balance, population, approval_rating, daily_gdp)
  values (auth.uid(), nation_name, chosen_continent_id, 500000, 100000, 50.00, 0)
  returning * into new_nation;

  insert into governments (nation_id, ideology, tax_rate, last_ideology_change_tick, political_stability)
  values (new_nation.id, chosen_ideology, 10.00, 0, 100.00);

  insert into nation_stocks (nation_id, resource_type, amount, max_capacity)
  values
    (new_nation.id, 'Food', 5000, 10000),
    (new_nation.id, 'Coal', 2000, 10000),
    (new_nation.id, 'Iron Ore', 2000, 10000),
    (new_nation.id, 'Crude Oil', 1000, 10000),
    (new_nation.id, 'Steel', 500, 10000),
    (new_nation.id, 'Fuel', 200, 10000),
    (new_nation.id, 'Maintenance Kit', 100, 10000),
    (new_nation.id, 'Clothing', 200, 10000),
    (new_nation.id, 'Home Appliances', 200, 10000),
    (new_nation.id, 'Electronics', 200, 10000);

  insert into nation_buildings (nation_id, building_type_id, status, completion_tick)
  values
    (new_nation.id, 'grain_farm', 'ACTIVE', 0),
    (new_nation.id, 'coal_mine', 'ACTIVE', 0),
    (new_nation.id, 'iron_mine', 'ACTIVE', 0),
    (new_nation.id, 'wind_turbine', 'ACTIVE', 0),
    (new_nation.id, 'starter_warehouse', 'ACTIVE', 0);

  return new_nation;
end;
$$;

grant execute on function create_nation(text, text, text) to authenticated;
