# ProcureBuddy — Multi-Tenant Procurement & Vendor Portal

ProcureBuddy is a modern, responsive, and secure B2B procurement platform. It streamlines the ordering lifecycle by connecting internal buying operations (staff) with external suppliers (vendors) through real-time dashboards and interactive self-service portals.

---

## 🏗️ Architecture & Flow Overview

ProcureBuddy uses a **dynamic database-per-tenant architecture** utilizing SQLite. Each client company (e.g., Crystal Engineering, SteelMax Industries) resides on its own physical SQLite file (e.g. `company_crystal.db`), providing absolute isolation and enterprise-grade data security.

### Dual-Portal System
* **Internal Staff Portal**: Used by the buyer's organization. Role-based privileges separate duties:
  * **Engineer**: Tracks stock levels and initiates Purchase Requisitions.
  * **Manager**: Approves Purchase Orders, starts RFQs, and monitors spend metrics.
  * **Finance**: Audits invoices, executes 3-way matching (PO vs. GRN vs. Invoice), and handles payments.
* **External Vendor Portal**: A secure portal accessed by external suppliers (e.g. Raj Metal Suppliers) to view pending Purchase Orders, submit bids/RFQs, track shipments, and upload invoices.

---

## 📖 Setup & Deployment Manuals

For step-by-step guides on getting the project running, refer to the dedicated guides:

* **Local Machine Setup**: Follow [README_LOCAL.md](file:///d:/New%20folder/procurement-kpi/docs/guides/README_LOCAL.md) to install dependencies, push database schemas, seed data, and run verification test cases on your local system.
* **GCP Compute VM (Recommended/Staging)**: Follow [README_GCP_VM.md](file:///d:/New%20folder/procurement-kpi/docs/guides/README_GCP_VM.md) to build locally, deploy to a VM, and run PM2 and sqlite migrations automatically.
* **cPanel Shared Hosting**: Follow [README_CPANEL.md](file:///d:/New%20folder/procurement-kpi/docs/guides/README_CPANEL.md) to host the application directly on your existing cPanel server with fully persistent SQLite databases.
* **Vercel + Turso Cloud (Alternative)**: Follow [README_PRODUCTION.md](file:///d:/New%20folder/procurement-kpi/docs/guides/README_PRODUCTION.md) to split the frontend (Vercel) and database layer (Turso cloud edge) using Git branches.

---

## ⚡ Quick Start (Local Run)

1. **Install Packages**:
   ```bash
   npm install
   ```
2. **Build and Seed Databases**:
   ```bash
   npm run db:setup
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   # On Windows PowerShell if policy issues arise:
   npm.cmd run dev
   ```
   Open your browser and navigate to **`http://localhost:3000`**
