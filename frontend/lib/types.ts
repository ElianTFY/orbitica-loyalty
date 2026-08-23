export type User = {
  id: string;
  business_id: string | null;
  email: string;
  full_name: string;
  role: "superadmin" | "owner" | "staff";
  active: boolean;
  created_at: string;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  reward_name: string;
  stamps_required: number;
  primary_color: string;
  active: boolean;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  card_code: string;
  public_token: string;
  stamp_balance: number;
  rewards_redeemed: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  type: "stamp" | "redeem" | "adjustment";
  amount: number;
  created_at: string;
  customer_name: string;
  actor_name: string | null;
};

export type Dashboard = {
  business: Business;
  customers: number;
  active_cards: number;
  stamps_awarded: number;
  rewards_redeemed: number;
  new_customers_month: number;
  recent_activity: Activity[];
};

export type PublicBusiness = {
  name: string;
  slug: string;
  reward_name: string;
  stamps_required: number;
  primary_color: string;
};

export type PublicCard = {
  business: PublicBusiness;
  customer_name: string;
  stamp_balance: number;
  rewards_redeemed: number;
  card_code: string;
  updated_at: string;
};
