# ProcureBuddy — GCP Linux VM Deployment Guide

This guide details how to compile, package, and deploy ProcureBuddy to a Google Cloud Platform (GCP) Compute Engine Linux VM using local SQLite databases and PM2.

---

## 🏗️ Deployment Architecture
* **Frontend/Backend**: Next.js Node app served in production mode.
* **Process Manager**: **PM2** to manage execution, reload configs, and handle auto-starts on system reboots.
* **Database**: Local SQLite databases (`databases/company_default.db`, `databases/company_veltrix.db`, etc.) stored persistently.

---

## 🛠️ Step-by-Step Deployment

### Step 1: Build & Package Locally (Development Machine)
Since Next.js compilation is CPU/RAM intensive, we compile locally and ship the pre-built `.next` artifacts.

1. **Clean compile the application**:
   ```bash
   npm run build
   ```
2. **Compress the production bundle**:
   * For **Staging**: `npm run zip:stg` (generates `procurebuddy-stg.zip`)
   * For **Production**: `npm run zip:prod` (generates `procurebuddy-prod.zip`)

---

### Step 2: Upload Files to GCP VM
1. Open your terminal or SCP client.
2. Upload the generated `.zip` package (e.g. `procurebuddy-stg.zip`) directly to your VM user home directory (`/home/binoyr9/`).

---

### Step 3: Run the Automated Deployment Script
Connect to your VM via SSH and run:
```bash
# Execute the deployment script
./deploy-app.sh
```

**What the script does automatically:**
1. Stops the running PM2 process.
2. Backs up active tenant databases in `/tmp/` to prevent data loss.
3. Clears old source folders and extracts the new zip archive to `/var/www/procurebuddy/`.
4. Restores active tenant databases back to the `databases/` folder.
5. Installs npm package updates.
6. Regenerates the Prisma Client engines.
7. **Runs the automatic schema migration script** (`node scripts/migrate.js`) to apply column alterations non-destructively.
8. Restarts the PM2 process.

---

## 🚀 Setting up a Brand New VM (e.g. Production)
When you spin up a brand new VM in a few weeks, follow these configuration steps:

1. **Initial Setup**:
   Upload `setup-server.sh` and run it to install Node, PM2, configure firewalls, and prepare target directories:
   ```bash
   chmod +x setup-server.sh
   ./setup-server.sh
   ```
2. **Initial Database Creation**:
   Once code files are extracted in `/var/www/procurebuddy`, initialize the default sqlite schema template:
   ```bash
   cd /var/www/procurebuddy
   npx prisma db push
   ```
3. **Database Seeding**:
   Populate the initial default logins and credentials (useful to start clean for production):
   ```bash
   # Seed production logins only (skips mockup transactions)
   SEED_ONLY_LOGINS=true npm run db:setup
   ```
4. **Register App in PM2**:
   Launch the server process under PM2 for the first time:
   ```bash
   pm2 start server.js --name "procurebuddy" --env NODE_ENV=production
   pm2 save
   ```
