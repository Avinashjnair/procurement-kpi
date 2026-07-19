# ProcureIQ — Staging Deployment Guide (STG)

This guide details how to configure and deploy the **Staging (STG)** environment of ProcureIQ using **Vercel** (linked to the `develop` branch) and **Turso** (for cloud edge SQLite database replication).

---

## 🏗️ Staging Architecture
* **Frontend**: Next.js hosted on **Vercel** (auto-deployed on commits to the `develop` branch).
* **Database**: Hosted on **Turso** (`procureiq-stg`).
* **Staging URL**: `https://staging.yourdomain.com` or a free Vercel subdomain `https://procureiq-stg.vercel.app`.

---

## 🛠️ Step-by-Step Setup

### Step 1: Create the Staging Database in Turso
1. Install the Turso CLI or log in on [Turso.tech](https://turso.tech/).
2. Create a new database for staging:
   ```bash
   turso db create procureiq-stg
   ```
3. Get the connection string:
   ```bash
   turso db show procureiq-stg --schema
   # Output will be: libsql://procureiq-stg-yourusername.turso.io
   ```
4. Generate an authentication token for the staging database:
   ```bash
   turso db tokens create procureiq-stg
   ```

### Step 2: Configure the Staging Environment in Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New** ➔ **Project**.
2. Import your ProcureIQ repository.
3. In **Project Settings**, go to **Git**:
   * Set your **Production Branch** to `master` (or `main`).
   * Add `develop` as your development/staging branch.
4. Go to **Environment Variables** and add variables specifically for the **Preview (Staging)** environment:
   * `DATABASE_URL` = `libsql://procureiq-stg-yourusername.turso.io`
   * `DATABASE_AUTH_TOKEN` = `your_staging_db_token`
   * `JWT_SECRET` = `a_secure_random_string_for_staging`
   * `SEED_ONLY_LOGINS` = `true` (if you want staging to start clean, or `false` if you want all sample transactions).

### Step 3: Deploy Staging
1. Push your latest code changes to the `develop` branch:
   ```bash
   git checkout develop
   git push origin develop
   ```
2. Vercel will automatically trigger a build and deploy your staging site to a preview URL (e.g. `procure-kpi-git-develop-username.vercel.app`).
3. (Optional) Assign a custom staging subdomain (like `staging.procureiq.com`) to point to the `develop` branch deployments in the Vercel Domains tab.
