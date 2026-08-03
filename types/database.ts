// Minimal types based on the schema docs (File 02 & File 04).
// Recommendation: replace with the output of `supabase gen types typescript`
// once your final schema is stable, so it stays 1:1 in sync with the database.

export interface Nation {
  id: string
  user_id: string
  name: string
  continent_id: string
  cash_balance: number
  population: number
  approval_rating: number
  daily_gdp: number
  created_at: string
}

export interface Government {
  id: string
  nation_id: string
  ideology: string
  tax_rate: number
  last_ideology_change_tick: number
  political_stability: number
  updated_at: string
}

export interface NationStock {
  id: string
  nation_id: string
  resource_type: string
  amount: number
  max_capacity: number
}

export interface BuildingType {
  id: string
  name: string
  category: string
  tier: string
  build_time_ticks: number
  cost_cash: number
  cost_steel: number
  input_resources: Record<string, number> | null
  output_resources: Record<string, number> | null
  electricity_mw_delta: number
}

export interface NationBuilding {
  id: string
  nation_id: string
  building_type_id: string
  status: string
  completion_tick: number | null
  created_at: string
}

export type Ideology =
  | 'DEMOCRACY'
  | 'AUTOCRACY'
  | 'TECHNOCRACY'
  | 'COMMUNISM'
  | 'CAPITALIST_FREE_MARKET'

export const CONTINENTS = ['Borealis', 'Aequator', 'Zephyrus'] as const
export type ContinentId = (typeof CONTINENTS)[number]

export interface TechNode {
  id: string
  branch: string
  tier: number
  name: string
  rp_cost: number
  effect_description: string | null
  prerequisite_tech_id: string | null
}

export interface NationTechnology {
  id: string
  nation_id: string
  tech_id: string
  status: 'LOCKED' | 'UNLOCKED_IN_PROGRESS' | 'COMPLETED'
  current_progress_rp: number
  completed_at_tick: number | null
}

export interface ResearchQueueItem {
  id: string
  nation_id: string
  tech_id: string
  queue_position: number
  created_at: string
}

export const RESEARCH_BRANCH_LABELS: Record<string, string> = {
  INDUSTRIAL: 'Industrial & Extraction',
  MILITARY: 'Military Warfare',
  ECONOMIC: 'Economic & Commercial',
  ENERGY: 'Energy & Infrastructure',
}

export interface MilitaryUnitType {
  id: string
  name: string
  branch: 'LAND' | 'AIR' | 'NAVAL'
  required_tech_id: string | null
  cost_cash: number
  cost_population: number
  cost_resources: Record<string, number> | null
  upkeep_cash: number
  upkeep_resources: Record<string, number> | null
  attack: number
  defense: number
  special_stat: string | null
}

export interface NationMilitaryUnit {
  id: string
  nation_id: string
  unit_type: string
  amount: number
  morale_status: 'NORMAL' | 'MORALE_ZERO'
}

export interface ActiveWar {
  id: string
  attacker_id: string
  defender_id: string
  target_continent_id: string
  war_status: string
  declared_at_tick: number
}

export const MILITARY_BRANCH_LABELS: Record<string, string> = {
  LAND: 'Land Forces',
  AIR: 'Air Forces',
  NAVAL: 'Naval Forces',
}

export const BUILDING_CATEGORY_LABELS: Record<string, string> = {
  EXTRACTION: 'Extraction',
  PROCESSING: 'Processing & Manufacturing',
  HIGH_TECH: 'High-Tech Industries',
  ENERGY: 'Energy Generation',
  LOGISTICS: 'Logistics',
}

export interface P2PMarketOrder {
  id: string
  seller_nation_id: string
  resource_type: string
  unit_price_cash: number
  initial_quantity: number
  remaining_quantity: number
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED'
  created_at: string
}

export interface P2PTradeHistoryItem {
  id: string
  seller_nation_id: string
  buyer_nation_id: string
  resource_type: string
  unit_price_cash: number
  quantity: number
  gross_trade_value: number
  customs_duty_total: number
  is_fta_trade: boolean
  created_at: string
}

// All tradeable resource types across the game (File 02 §2), used to
// populate the "sell" resource dropdown.
export const ALL_RESOURCE_TYPES = [
  'Food',
  'Coal',
  'Iron Ore',
  'Crude Oil',
  'Rare Earths',
  'Fuel',
  'Steel',
  'Maintenance Kit',
  'Clothing',
  'Home Appliances',
  'Electronics',
  'Microchips',
  'Advanced Composites',
  'Weapons Grade Steel',
] as const

export interface Government {
  id: string
  nation_id: string
  ideology: string
  tax_rate: number
  last_ideology_change_tick: number
  last_ideology_change_at: string | null
  political_stability: number
  updated_at: string
}

export interface Alliance {
  id: string
  name: string
  tag: string
  leader_nation_id: string
  treasury_cash: number
  max_members: number
  created_at: string
}

export interface AllianceMember {
  id: string
  alliance_id: string
  nation_id: string
  role: 'LEADER' | 'MEMBER'
  joined_tick: number
}

export interface WorldBankLoan {
  id: string
  nation_id: string
  initial_principal: number
  remaining_principal: number
  daily_interest_rate: number
  duration_ticks: number
  remaining_ticks: number
  missed_ticks_count: number
  status: 'ACTIVE' | 'ARREARS' | 'DEFAULT' | 'CLEARED'
  created_at_tick: number
  created_at: string
}

export interface CreditStatus {
  credit_score: number
  credit_grade: string
  multiplier: number
  base_interest_rate: number
  max_borrow_cap: number
  total_active_debt: number
}