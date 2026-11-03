# NutriTrack

Mobile-first personal nutrition, measures, steps & weight tracker. Each signed-in user only sees their own data. Admins (configured by email) can open read-only patient reports.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Auth / data**
  - **Default:** local JSON store (`data/store.json`) with bcrypt password hashes + signed session cookies
  - **Optional:** Supabase Auth + Postgres tables with `user_id` RLS (`supabase/schema.sql`)

## Quick start (local mode — no cloud keys)

```powershell
cd d:\projects\nutritrack
copy .env.example .env.local
# Set AUTH_SECRET and optionally ADMIN_EMAILS in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Create an account on **Sign up** (name, email, password, **male/female**)
2. Complete first-time setup: height + waist / hip / thigh
3. Use bottom nav: **Today**, **Food**, **Weight**, **Measures** (body + steps), **Profile**

Local data is written to `data/store.json` (gitignored). Multiple users on the same machine stay isolated by `user_id`.

## Admin patient reports

1. Put your account email in `.env.local`:

```env
ADMIN_EMAILS=you@example.com
```

2. Sign up / log in with that email (normal patient auth)
3. Open **Profile → Open admin patient reports**, or go to `/admin`

**List (`/admin`):** all patients with name, email, gender, height, latest weight, latest waist/hip/thigh, latest steps, join date, last activity.

**Detail (`/admin/[userId]`):** profile + recent weight, measures, steps, and food (read-only).

Admin reports are fully implemented for **local JSON mode**. In Supabase mode, RLS blocks cross-user reads; a service-role path is not wired yet (see `.env.example`).

Admin is **not** in the patient bottom nav.

## Supabase mode (optional)

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Put keys in `.env.local`:

```env
AUTH_SECRET=your-long-random-secret
ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart `npm run dev`

When both Supabase URL and anon key are set, the app uses Supabase Auth + tables instead of the local JSON store.

## Pages

| Route | Purpose |
| --- | --- |
| `/login`, `/signup` | Auth (signup requires gender) |
| `/onboarding` | First-time gate: gender (if missing), height, waist/hip/thigh |
| `/today` | Day / week / month dashboard |
| `/food` | Log meals |
| `/weight` | Log daily weight |
| `/measures` | Waist / hip / thigh + daily steps |
| `/profile` | Name, gender, height, goals; admin link if allowed |
| `/history` | Recent logs |
| `/admin` | Admin: all patients report |
| `/admin/[userId]` | Admin: one patient detail |

## Data model

- **profiles** — id, email, name, gender (`male` \| `female`), height_cm, starting/target weight, calorie goal
- **weight_logs** — user_id, logged_on, weight_kg (unique per user+date)
- **body_logs** — user_id, logged_on, waist_in, hip_in, thigh_in (unique per user+date; thigh required on new logs)
- **step_logs** — user_id, logged_on, steps (unique per user+date)
- **food_logs** — user_id, logged_on, meal_type, food_name, calories?, notes?, photo_url?

## Scripts

```powershell
npm run dev    # development server
npm run build  # production build
npm run start  # run production build
```

## Meal photos

On **Food**, you can optionally attach a photo when logging a meal (camera on mobile via `capture`, or gallery pick). Photos are optional.

- **Local mode:** files are stored under `data/uploads/meals/` and served at `/api/meal-photos/{filename}` (signed-in owner or admin only). Uploads are gitignored.
- **Supabase mode:** files go to the `meal-photos` storage bucket; `food_logs.photo_url` stores the public URL. Run the storage notes/policies in `supabase/schema.sql` and create the bucket if needed.

Large images are lightly compressed in the browser before upload (max ~3 MB).

## Notes

- Do not commit `.env.local`, `data/store.json`, or `data/uploads/`
- Local mode is for single-machine MVP; switch to Supabase for multi-device / shared hosting
- Existing local users without gender are prompted on `/onboarding` (login still works)
