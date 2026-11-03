# NutriTrack

Mobile-first personal nutrition & weight tracker. Each signed-in user only sees their own profile, weight logs, and food logs.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Auth / data**
  - **Default:** local JSON store (`data/store.json`) with bcrypt password hashes + signed session cookies
  - **Optional:** Supabase Auth + Postgres tables with `user_id` RLS (`supabase/schema.sql`)

## Quick start (local mode — no cloud keys)

```powershell
cd d:\projects\nutritrack
copy .env.example .env.local
# Optionally set AUTH_SECRET in .env.local (a random string)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Create an account on **Sign up**
2. Set height / goals on **Profile**
3. Use bottom nav: **Today**, **Log Food**, **Weight**, **Profile**

Local data is written to `data/store.json` (gitignored). Multiple users on the same machine stay isolated by `user_id`.

## Supabase mode (optional)

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Put keys in `.env.local`:

```env
AUTH_SECRET=your-long-random-secret
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart `npm run dev`

When both Supabase URL and anon key are set, the app uses Supabase Auth + tables instead of the local JSON store.

## Pages

| Route | Purpose |
| --- | --- |
| `/login`, `/signup` | Auth |
| `/today` | Dashboard: today's weight, meals, calorie sum, BMI |
| `/food` | Log meals + recent list |
| `/weight` | Log daily weight + history |
| `/profile` | Name, height, goals, logout |
| `/history` | Recent weights + meals |

## Data model

- **profiles** — `id` (= user id), email, name, height_cm, starting_weight_kg, target_weight_kg, daily_calorie_goal
- **weight_logs** — user_id, logged_on (date), weight_kg (unique per user+date)
- **food_logs** — user_id, logged_on, meal_type (`breakfast` \| `lunch` \| `dinner` \| `snack`), food_name, calories?, notes?

## Scripts

```powershell
npm run dev    # development server
npm run build  # production build
npm run start  # run production build
```

## Notes

- Do not commit `.env.local` or `data/store.json`
- Local mode is for single-machine MVP; switch to Supabase for multi-device / shared hosting
