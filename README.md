# NutriTrack

Mobile-first personal nutrition, measures, steps & weight tracker. Each signed-in user only sees their own data. Admins (configured by email) can open read-only patient reports.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Auth / data**
  - **Default (`DATA_MODE=local`):** JSON store with bcrypt password hashes + signed session cookies
  - **Optional (`DATA_MODE=supabase`):** Supabase Auth + Postgres tables with `user_id` RLS (`supabase/schema.sql`)

## Quick start (local mode — no cloud keys)

```powershell
cd d:\projects\nutritrack
copy .env.example .env.local
# Set AUTH_SECRET and optionally ADMIN_EMAILS in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Create an account on **Sign up** (name, email, password, **male/female**), **or** use a demo account below
2. Complete first-time setup: height + waist / hip / thigh (demo users are already set up)
3. Use bottom nav: **Today**, **Food**, **Weight**, **Measures** (body + steps), **Profile**

### Demo accounts (local JSON template)

On first boot (or when the active store is empty), the app seeds from `data/templates/demo-store.json`.

| Email | Password | Notes |
| --- | --- | --- |
| `demo@nutritrack.local` | `demo1234` | Sample patient with weight / food / measures / steps |
| `coach@nutritrack.local` | `coach1234` | Second sample user (add to `ADMIN_EMAILS` to try `/admin`) |

These are **demo-only** credentials (not real PII). Change or remove them before any real deployment with private data.

Local writable data lives in `data/store.json` (gitignored). On **Vercel**, writes go to `/tmp/nutritrack-store.json` (ephemeral per instance); if writing fails, the bundled template is still readable for demo login.

## Deploy on Vercel

1. Set env vars (Production):
   - `DATA_MODE=local` (recommended until Supabase is ready)
   - `AUTH_SECRET` — long random string (`openssl rand -base64 32`)
   - Optional: `ADMIN_EMAILS=coach@nutritrack.local`
2. Deploy. Do **not** set `DATA_MODE=supabase` until Supabase URL + anon key are ready.

```powershell
# Example: add AUTH_SECRET without echoing it back in chat logs
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
echo $secret | npx vercel env add AUTH_SECRET production
echo local | npx vercel env add DATA_MODE production
npx vercel --prod --yes
```

**Note:** Local JSON on Vercel is for demos/templates. Data in `/tmp` can reset between cold starts. Use Supabase (or another DB) for durable multi-user production.

## Admin patient reports

1. Put your account email in `.env.local` / Vercel env:

```env
ADMIN_EMAILS=you@example.com
```

2. Sign up / log in with that email (normal patient auth)
3. Open **Profile → Open admin patient reports**, or go to `/admin`

Admin reports are fully implemented for **local JSON mode**. In Supabase mode, RLS blocks cross-user reads; a service-role path is not wired yet (see `.env.example`).

## Supabase mode (optional)

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Put keys in `.env.local` / Vercel:

```env
DATA_MODE=supabase
AUTH_SECRET=your-long-random-secret
ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart `npm run dev` (or redeploy)

Supabase is used only when `DATA_MODE=supabase` **and** both URL and anon key are set. Leaving Supabase keys set while `DATA_MODE=local` keeps the JSON path.

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

- **Local mode (dev):** `data/uploads/meals/` → `/api/meal-photos/{filename}`
- **Local mode (Vercel):** `/tmp/nutritrack-uploads/meals/` (ephemeral). If write fails, the meal form shows an error instead of a 500 — log without a photo.
- **Supabase mode:** `meal-photos` storage bucket; see `supabase/schema.sql`

Large images are lightly compressed in the browser before upload (max ~3 MB).

## Notes

- Do not commit `.env.local`, `data/store.json`, or `data/uploads/`
- `data/templates/demo-store.json` is tracked (demo seed only)
- Local mode is for single-machine / demo MVP; switch to Supabase for multi-device durable hosting
- Existing local users without gender are prompted on `/onboarding` (login still works)
