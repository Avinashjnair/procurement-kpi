# ProcureBuddy — cPanel Deployment Guide

Since you are already paying for a cPanel hosting plan, **you can deploy ProcureBuddy directly to it!** 

One huge advantage of deploying on cPanel is that it uses a persistent local file system. This means **your SQLite databases will be fully persistent and safe out of the box** without needing Turso or any other cloud database.

---

## 📋 Prerequisites
1. Ensure you have the **Application Manager** tool visible in your cPanel under the "Software" section (your plan has this enabled).
2. SSH access to your cPanel or access to the **Terminal** tool in cPanel (for running database setup scripts).

---

## 🛠️ Step-by-Step Deployment

### Step 1: Build the Code Locally
Shared hosting servers on cPanel have CPU and RAM limits, meaning running a Next.js production build directly on the server will fail or get killed. You should build the app on your local machine first:
1. Run the production build command in your terminal:
   ```bash
   npm run build
   ```
2. This creates the production output directory named `.next`.

### Step 2: Upload the Files to cPanel
1. In cPanel, open **File Manager** and create a directory in your home directory (e.g., `/home/username/procurebuddy`).
2. Compress and upload the following files/folders from your local project root into that folder:
   * `.next/` (The compiled production build)
   * `databases/` (Contains the sqlite databases)
   * `prisma/` (Contains database migrations and schema)
   * `public/` (Static assets like logos)
   * `package.json` & `package-lock.json`
   * `server.js` (The custom entry point start script for cPanel)
   * `.env` (Create this file directly in cPanel using File Manager with your production credentials)

*Note: Do not upload `node_modules` or `.git` folders.*

### Step 3: Register the App in Application Manager
1. In cPanel, click **Application Manager** (under the **Software** section).
2. Click **Register Application** and fill out the details:
   * **Name**: `ProcureBuddy`
   * **Domain/URL**: Select your subdomain (e.g., `procure.veltrixlabs.in`).
   * **Application Path**: Enter the path where you uploaded files (e.g., `procurebuddy`).
   * **Deployment Status**: Select `Staging` initially, then change to `Production` when ready.
3. Under **Environmental Variables**, add variables if you didn't create a `.env` file:
   * `NODE_ENV` = `production`
   * `PORT` = `3000` (Passenger will bind this dynamically, but good to have)
   * `JWT_SECRET` = `a_secure_random_hash_key`
4. Click **Deploy**.

### Step 4: Install Dependencies & Run Database Setup
1. Open the **Terminal** tool in your cPanel dashboard.
2. Navigate to your application folder:
   ```bash
   cd ~/procurebuddy
   ```
3. Run package installations:
   ```bash
   npm install --production
   ```
4. Run Prisma client code generation:
   ```bash
   npx prisma generate
   ```

### Step 5: Start the Application
1. In cPanel's **Application Manager**, verify that the application is enabled.
2. Visit your subdomain URL (e.g., `https://procure.veltrixlabs.in`) in your browser to verify it is running!
