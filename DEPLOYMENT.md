# TRIZAH Accounting – Deployment Guide

## Environments
- Local: http://localhost:3000 (SQLite or Postgres)
- Preview: Vercel preview URLs for non-production branches
- Production: https://app.trizah.com

The existing WordPress site on trizah.com is preserved. This app deploys to the subdomain `app.trizah.com`.

## 1. GitHub
1. Create a new GitHub repository (private recommended).
2. Add remote:
   git remote add origin https://github.com/<org>/trizah-accounting.git
3. Push:
   git push -u origin main

## 2. Supabase (PostgreSQL + Auth)
1. Use the existing Supabase project (`kastjlhpnkxdymxxdziz`). Do not create a duplicate project.
2. Copy the pooled connection string and set `DATABASE_URL` in Vercel and locally (`.env`).
3. Copy the project URL and **anon public** key from Supabase → Project Settings → API.
   Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> Never put the service-role key in `NEXT_PUBLIC_*` variables or in client code. This app does not
> need the service-role key at all: profiles and roles are managed server-side through Prisma.

### Database migrations
- Development: `npx prisma db push`
- Apply auth hardening (profiles, RLS, signup trigger):
  `npx prisma db execute --file prisma/auth.sql --schema prisma/schema.prisma`
- Production: run the same two commands against the production `DATABASE_URL`.

Never run `db push --force-reset` or any destructive command against production.

### First Super Admin
- The database trigger assigns **Super Admin / Active** to the very first account that registers.
- Every later registration defaults to **Viewer / Pending approval**.
- To force a specific owner account, set `SUPER_ADMIN_EMAILS="owner@example.com"` in Vercel. The
  server promotes that email to Super Admin on its next sign-in.
- Manual promotion (only if needed):
  `update public.profiles set role = 'super_admin', status = 'active' where email = 'owner@example.com';`

### Supabase Auth URL configuration
In Supabase → Authentication → URL Configuration:
- **Site URL:** `https://app.trizah.com`
- **Additional Redirect URLs:**
  - `https://app.trizah.com/**`
  - `http://localhost:3000/**`

### Email templates (recommended)
The app supports both the default confirmation URL and the cross-browser token-hash flow. For the
most reliable experience (links opened on a different device), update the email templates to:

Confirm signup:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/verify-email
```

Reset password:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```

If you keep the default `{{ .ConfirmationURL }}` templates, the app handles the PKCE `code` at
`/auth/callback` automatically.

### Backups
- Enable Supabase daily backups.
- Before risky migrations, take a manual backup (Supabase dashboard → Database → Backups).
- Restore procedure: Supabase dashboard → Backups → Restore, or use pg_restore with the connection string.

## 3. Vercel
1. Import the GitHub repository into Vercel.
2. Framework preset: Next.js. Build command: `npm run build` (runs `prisma generate` first).
3. Set environment variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://app.trizah.com`
   - `SUPER_ADMIN_EMAILS` (optional, comma-separated owner emails)
   - `NEXT_PUBLIC_APP_NAME`
4. Production branch: main
5. Enable automatic deployments on push to main.
6. Preview deployments enabled for other branches.

## 4. DNS (app.trizah.com)
Create a CNAME record:
- Host: app
- Value: cname.vercel-dns.com (or the value Vercel provides)
- TTL: 3600

Do not change existing trizah.com / www records. Wait for DNS propagation and Vercel domain verification before switching traffic.

## 5. Security
- All application routes are protected by Supabase Auth through `src/proxy.ts`.
- Roles: `super_admin`, `admin`, `accountant`, `operations`, `viewer`.
  - Only `super_admin` can assign roles or change account status.
  - `viewer` is read-only; all mutating APIs return 403 for viewers.
- The proxy fails closed if Supabase is not configured, so financial data is never exposed.
- `profiles` has Row Level Security enabled; authenticated users can read their own row and update
  only their display name. Role/status columns are not grantable.
- Database credentials only in environment variables; never committed. `.env` is gitignored.
- The service-role key is never used by the application.
- Rotate the Supabase anon key and database password if they are ever exposed.

## 6. Rollback
- Vercel → Deployments → select previous deployment → Promote to Production.
- Database rollback: restore from Supabase backup (does not affect app code).

## 7. Continuous updates
1. Develop locally (npm run dev).
2. Test.
3. git commit && git push origin main
4. Vercel builds and deploys automatically.
5. Check deployment status in Vercel dashboard.