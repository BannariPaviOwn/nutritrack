export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type Profile = {
  id: string;
  email: string;
  name: string;
  height_cm: number | null;
  starting_weight_kg: number | null;
  target_weight_kg: number | null;
  daily_calorie_goal: number | null;
  created_at: string;
  updated_at: string;
};

export type WeightLog = {
  id: string;
  user_id: string;
  logged_on: string;
  weight_kg: number;
  created_at: string;
};

export type FoodLog = {
  id: string;
  user_id: string;
  logged_on: string;
  meal_type: MealType;
  food_name: string;
  calories: number | null;
  notes: string | null;
  created_at: string;
};

export type LocalUser = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

export type LocalStore = {
  users: LocalUser[];
  profiles: Profile[];
  weight_logs: WeightLog[];
  food_logs: FoodLog[];
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};
