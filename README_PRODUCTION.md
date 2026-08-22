# ProcureBuddy — Production Deployment Guide (PROD)

This guide details how to configure and deploy the **Production (PROD)** environment of ProcureBuddy using **Vercel** (linked to the `master`/`main` branch) and **Turso** (for cloud edge SQLite database replication).

---

## 🏗️ Production Architecture
* **Frontend**: Next.js hosted on **Vercel** (auto-deployed on commits or merges to the `master`/`main` branch).
* **Database**: Hosted on **Turso** (`procurebuddy-prod`).
* **Production URL**: `https://www.yourdomain.com`.

---

## 🛠️ Step-by-Step Setup

### Step 1: Create the Production Database in Turso
1. Log in to [Turso.tech](https://turso.tech/).
2. Create a new database for production:
   ```bash
   turso db create procurebuddy-prod
   ```
3. Get the connection string:
   ```bash
   turso db show procurebuddy-prod --schema
   # Output will be: libsql://procurebuddy-prod-yourusername.turso.io
   ```
4. Generate an authentication token for the production database:
   ```bash
   turso db tokens create procurebuddy-prod
   ```

### Step 2: Configure the Production Environment in Vercel
1. Log in to [Vercel](https://vercel.com/) and go to your project dashboard.
2. Go to **Settings** ➔ **Environment Variables**.
3. Add variables specifically for the **Production** environment:
   * `DATABASE_URL` = `libsql://procurebuddy-prod-yourusername.turso.io`
   * `DATABASE_AUTH_TOKEN` = `your_production_db_token`
   * `JWT_SECRET` = `a_very_secure_32_character_random_string`
   * `SEED_ONLY_LOGINS` = `true` (recommended for production so you start with clean transaction histories).

### Step 3: Configure your Custom Domain
1. In the Vercel project dashboard, go to **Settings** ➔ **Domains**.
2. Enter your custom domain (e.g. `yourdomain.com` or `www.yourdomain.com`).
3. Set up the DNS records at your domain registrar (GoDaddy, Namecheap, Google Domains) to point to Vercel:
   * Point the **A record** to: `76.76.21.21`
   * Point the **CNAME record** to: `cname.vercel-dns.com`
4. Vercel will automatically generate a free SSL certificate (HTTPS) once the DNS propagates.

### Step 4: Deploy to Production
1. Merge your approved changes from the `develop` branch to the `master`/`main` branch:
   ```bash
   git checkout master
   git merge develop
   git push origin master
   ```
2. Vercel will automatically detect the push to `master` and trigger a live production build.
