export type Role = 'superadmin' | 'owner' | 'manager' | 'staff';
export type ProgramType = 'stamps' | 'points' | 'hybrid';
export type TransactionType = 'stamp' | 'points' | 'redeem' | 'adjustment';

export interface User {
  id: string;
  business_id: string | null;
  email: string;
  full_name: string;
  role: Role;
  active: boolean;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  program_type: ProgramType;
  reward_name: string;
  stamps_required: number;
  points_ratio: number;
  points_currency_symbol: string;
  primary_color: string;
  logo_url: string | null;
  welcome_message: string | null;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  card_code: string;
  public_token: string;
  stamp_balance: number;
  point_balance: number;
  total_visits: number;
  rewards_redeemed: number;
  last_visit_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  stamps_required: number | null;
  points_required: number | null;
  stock: number | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  created_at: string;
  actor_name: string | null;
  reward_name: string | null;
}

export interface CustomerDetail extends Customer {
  transactions: Transaction[];
}

export interface DashboardActivity {
  id: string;
  type: TransactionType;
  amount: number;
  created_at: string;
  customer_name: string;
  actor_name: string | null;
  note: string | null;
}

export interface DashboardData {
  business: Business;
  customers: number;
  active_cards: number;
  stamps_awarded: number;
  points_awarded: number;
  rewards_redeemed: number;
  new_customers_month: number;
  recent_activity: DashboardActivity[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PublicBusiness {
  name: string;
  slug: string;
  program_type: ProgramType;
  reward_name: string;
  stamps_required: number;
  points_ratio: number;
  points_currency_symbol: string;
  primary_color: string;
  logo_url: string | null;
  welcome_message: string | null;
}

export interface PublicCard {
  business: PublicBusiness;
  customer_name: string;
  stamp_balance: number;
  point_balance: number;
  total_visits: number;
  rewards_redeemed: number;
  card_code: string;
  updated_at: string;
}
