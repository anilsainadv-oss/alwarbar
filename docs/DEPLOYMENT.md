# Production Deployment & Free-First Hosting Strategy

## 1. Free-First Hosting Architecture

The platform is designed to run entirely within sustainable free tiers:

| Tier Component | Recommended Provider | Free Tier Limits |
| :--- | :--- | :--- |
| **Frontend & API** | **Vercel** / **Render** | 100 GB bandwidth, unlimited deployments |
| **Database** | **Supabase** (PostgreSQL) | 500 MB DB storage, 2 active projects, 50k monthly active users |
| **Object Storage** | **Supabase Storage** | 1 GB storage for case docs & public PDF templates |
| **AI Inference** | **Google AI Studio** (Gemini) | 15 RPM free tier, generous token quotas |
| **Authentication** | **Supabase Auth** / Built-in | Unlimited email/password users |

---

## 2. Step-by-Step Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Alwar Advocates Portal"
   git remote add origin https://github.com/your-username/alwar-advocates.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and import the repository.
   - Framework preset: `Next.js`.
   - Root Directory: `./`.

3. **Configure Environment Variables in Vercel**:
   Add the variables listed in `.env.example`:
   - `AUTH_SECRET`
   - `SESSION_COOKIE_NAME`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER`
   - `AI_API_KEY`
   - `ADMIN_BOOTSTRAP_TOKEN`

4. **Deploy**:
   Click **Deploy**. Vercel will build the Next.js production bundle.

---

## 3. Database Migration Execution on Supabase
Open your Supabase SQL editor and execute:
1. `migrations/001_initial_schema.sql`
2. `migrations/002_rls_security_policies.sql`
3. `migrations/003_seed_verified_data.sql`
