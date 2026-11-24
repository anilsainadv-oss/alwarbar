# ALWAR ADVOCATES PORTAL — PROJECT RULES & SECURITY GUARDRAILS

## Workspace Scope
- **Project**: Alwar Advocates Portal & My Case AI Legal Office (`alwarbar` / `alwar-advocates`)
- **Directory**: `C:\alwar-advocates`

---

## 1. Routine Development & Tool Permissions
- **File System Operations**: Full read, create, and edit permissions within the project workspace (`C:\alwar-advocates`). Modifying project configuration files (`package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`) is permitted for routine development.
- **Terminal Execution**: Auto-run safe development, build, test, and type-check commands (`npm test`, `npm run build`, `npm run lint`, `npx tsc --noEmit`, `git status`, `git diff`).
- **Code Analysis**: Code inspection and analysis tools are fully trusted and allowed to run autonomously.

---

## 2. Mandatory Security & Confirmation Rules (CRITICAL)

The agent MUST adhere to the following strict safety invariants under all circumstances:

1. **Secrets & Environment Variables**:
   - NEVER display, echo, log, or commit secret values from `.env`, `.env.local`, or configuration.
   - Specifically protect `AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_BOOTSTRAP_TOKEN`.
   - Never prefix server-only secrets with `NEXT_PUBLIC_`.

2. **File Deletion Protection**:
   - NEVER delete, wipe, or overwrite project files or folders (`rm`, `Remove-Item`, `git clean`, `git reset --hard`) without explicit, upfront user confirmation.

3. **Database Safety**:
   - NEVER drop, truncate, or alter database tables (`DROP TABLE`, `TRUNCATE`, `DROP DATABASE`) without explicit user confirmation.
   - NEVER run destructive production database migrations or alter existing schema without confirmation and backup verification.

4. **Deployment Safeguards**:
   - NEVER deploy to production environments (Vercel, Cloudflare, VPS, Docker) without explicit user confirmation.
   - Staging/local tests on `localhost:3000` / `localhost:3001` are permitted.

5. **Court Judgments & Public Legal Records**:
   - NEVER publish judgments, court orders, acts, or advocate profiles to public collections without verified Public Portal Admin approval (`/public-admin`).
