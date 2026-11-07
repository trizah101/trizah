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

## 2. Supabase (PostgreSQL)
1. Create a Supabase project.
2. Copy the connection string (use the pooled connection for serverless).
3. Set DATABASE_URL in Vercel and locally (.env).

### Migrations
- Development: npx prisma db push
- Production: npx prisma migrate deploy (after creating migrations with npx prisma migrate dev)

Never run db push --force-reset or any destructive command against production.

### Backups
- Enable Supabase daily backups.
- Before risky migrations, take a manual backup (Supabase dashboard → Database → Backups).
- Restore procedure: Supabase dashboard → Backups → Restore, or use pg_restore with the connection string.

## 3. Vercel
1. Import the GitHub repository into Vercel.
2. Framework preset: Next.js.
3. Set environment variables:
   - DATABASE_URL
   - APP_PASSWORD (optional, enables login gate)
   - SESSION_SECRET (long random string)
   - NEXT_PUBLIC_APP_NAME
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
- APP_PASSWORD gates the entire app when set.
- Database credentials only in environment variables; never committed.
- .env is gitignored.
- Rotate SESSION_SECRET and APP_PASSWORD periodically.

## 6. Rollback
- Vercel → Deployments → select previous deployment → Promote to Production.
- Database rollback: restore from Supabase backup (does not affect app code).

## 7. Continuous updates
1. Develop locally (npm run dev).
2. Test.
3. git commit && git push origin main
4. Vercel builds and deploys automatically.
5. Check deployment status in Vercel dashboard.