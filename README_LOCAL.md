# ProcureIQ — Local Setup & Verification Guide

This guide is designed for developers setting up the ProcureIQ application on their local machine for the first time. Follow these steps to install dependencies, initialize the multi-tenant databases, and verify the backend functionality.

---

## Prerequisites
Ensure you have the following installed on your machine:
* **Node.js**: Version 18.x or higher
* **npm**: Version 9.x or higher

---

## Step 1: Install Dependencies
Open your terminal in the project root directory and install all required packages:
```bash
npm install
```
*Note: On Windows PowerShell, if you get execution policy warnings during npm actions, use `npm.cmd` explicitly (e.g., `npm.cmd install`).*

---

## Step 2: Initialize & Seed the Databases
Run the automated script to configure Prisma, generate the SQLite client adapter, create the database tables, and seed the default test tenants:
```bash
npm run db:setup
```
This script runs:
1. `prisma db push` — Reads the database models from `prisma/schema.prisma` and creates the relational tables in the local template database.
2. `npx tsx prisma/seed.ts` — Fills the database with staff demo accounts, sample items, purchase orders, blanket agreements, inventory, and supplier portal entries. It also sets up two test tenants: `steelmax` and `eurochem`.

### Verification of Databases:
Verify that the `databases/` folder has been generated in your project root with the following files:
* `company_default.db` (Template database)
* `company_steelmax.db` (Aisha Al-Mansoori / SteelMax Tenant)
* `company_eurochem.db` (EuroChem Tenant)

---

## Step 3: Run the Development Server
Start the Next.js local server:
```bash
npm run dev
```
*Note for Windows users: If you encounter script execution policy errors in PowerShell, run:*
```powershell
npm.cmd run dev
```
Open your browser and navigate to: **`http://localhost:3000`**

---

## Step 4: Verification & Testing Workflow

### Test 1: Internal User Authentication & Multi-Tenancy Isolation
1. Go to the login screen at `http://localhost:3000`.
2. Click **Manager — Full Access** to automatically fill credentials for Aisha Al-Mansoori (`aisha@procureiq.ae`). Log in.
3. You are resolved to the `steelmax` database. Go to **Materials & Services** and click **Add New Item** (top-right FAB button). Register an item (e.g., Name: `Testing Pipe`, Category: `Piping`, Price: `150`).
4. Click **Sign Out** in the sidebar.
5. Log in using the **Finance Analyst** demo credentials (`finance@eurochem.com`). This resolves you to the `eurochem` database tenant.
6. Navigate to **Materials & Services**. Verify that the item you created (`Testing Pipe`) **does not appear**, proving complete tenant database isolation.
7. Sign out, log back in as Aisha, and confirm the item exists, verifying data persistence.

### Test 2: 3-Way Match Verification
1. Log in as Aisha Al-Mansoori (`aisha@procureiq.ae`).
2. Go to **Invoices**. Note down an invoice status (e.g., `Pending`).
3. Create a new Invoice matching a Purchase Order's total, or approve the corresponding Goods Receipt Note (GRN) in the **Goods Receipt** module.
4. Refresh/visit the **Invoices** page. Notice that the match status updates automatically to `Full Match` or `Variance` in real-time, verifying that the database triggers automatic match calculations.

### Test 3: Purchase Order Duplication
1. Go to **Purchase Orders** and select any existing PO (e.g., `PO-001`).
2. Click **Duplicate PO** in the details view.
3. Verify that a new PO is generated with the status set to `Draft` and its ID incremented automatically by the database (e.g. `PO-005` or next sequential number), checking database integrity and collision prevention.
