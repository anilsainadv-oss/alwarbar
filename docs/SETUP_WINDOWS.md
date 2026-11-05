# Windows Setup & Local Development Guide

This guide is tailored specifically for developers and users running Windows 10/11 using PowerShell.

## 1. Prerequisites
- **Node.js**: v18+ (Verified working on v24.21.0)
- **PowerShell**: Windows PowerShell 5.1 or PowerShell 7+
- **Git for Windows** (Optional but recommended)

---

## 2. Quick Start (Zero-Configuration Local Mode)

The application includes a built-in, file-backed local database engine that allows you to run and test all features immediately without setting up external cloud accounts.

```powershell
# 1. Open PowerShell and navigate to the project directory
cd C:\alwar-advocates

# 2. Verify dependencies are installed
npm install

# 3. Create your local environment file (pre-configured defaults provided)
Copy-Item .env.example .env.local

# 4. Run automated test suite to verify security & functionality
npm test

# 5. Start the development server
npm run dev
```

Open your browser and visit:
- **Public Portal**: `http://localhost:3000`
- **My Case Advocate Workspace**: `http://localhost:3000/my-case`
- **Public Admin Panel**: `http://localhost:3000/public-admin/login`
- **Case Operations Admin**: `http://localhost:3000/case-admin/login`

---

## 3. Connecting to Supabase (Optional for Production / Cloud)

To connect the application to your free Supabase PostgreSQL cloud instance:

1. Create a free account at [https://supabase.com](https://supabase.com).
2. Create a new project (e.g. `alwar-advocates-portal`).
3. In the Supabase Project Dashboard, go to **Project Settings** > **API**.
4. Copy the **Project URL** and **anon / public key**.
5. Go to the **SQL Editor** in Supabase and run the migration files in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_rls_security_policies.sql`
   - `migrations/003_seed_verified_data.sql`
6. Update your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
7. Restart the development server:
   ```powershell
   npm run dev
   ```

---

## 4. Bootstrapping Your First Administrator

To prevent hardcoded default passwords in the repository:
1. Ensure `ADMIN_BOOTSTRAP_TOKEN` is set in your `.env.local` (e.g., `setup-alwar-admin-token-2026`).
2. Visit `http://localhost:3000/auth/bootstrap` in your browser.
3. Enter your email, desired password, and the bootstrap token.
4. Select your role (`Public Portal Administrator` or `My Case Service Administrator`).
5. Your administrator account is instantly created with cryptographic password hashing and role assignments.
