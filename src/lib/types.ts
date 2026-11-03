export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type Gender = "male" | "female";

export type HeightUnit = "cm" | "ft";
export type WeightUnit = "kg" | "lb";

export type Profile = {
  id: string;
  email: string;
  name: string;
  gender: Gender | null;
  /** Canonical height in centimeters (always stored as cm). */
  height_cm: number | null;
  /** Display preference for height forms and labels. */
  height_unit: HeightUnit;
  /** Canonical starting weight in kilograms. */
  starting_weight_kg: number | null;
  /** Canonical target weight in kilograms. */
  target_weight_kg: number | null;
  /** Display preference for weight forms and labels. */
  weight_unit: WeightUnit;
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

/** Body circumference measurements in inches (one set per user per day). */
export type BodyLog = {
  id: string;
  user_id: string;
  logged_on: string;
  waist_in: number;
  hip_in: number;
  /** Required on new logs; may be null for older rows. */
  thigh_in: number | null;
  created_at: string;
};

/** Daily walking/running step count (one per user per day). */
export type StepLog = {
  id: string;
  user_id: string;
  logged_on: string;
  steps: number;
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
  /** Relative app URL or absolute Supabase storage URL; optional. */
  photo_url: string | null;
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
  body_logs: BodyLog[];
  step_logs: StepLog[];
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};
