# ProcureIQ — Multi-Tenant Procurement & Vendor Portal

ProcureIQ is a modern, responsive, and secure B2B procurement platform. It streamlines the ordering lifecycle by connecting internal buying operations (staff) with external suppliers (vendors) through real-time dashboards and interactive self-service portals.

---

## 🏗️ Architecture & Flow Overview

ProcureIQ uses a **dynamic database-per-tenant architecture** utilizing SQLite. Each client company (e.g., Crystal Engineering, SteelMax Industries) resides on its own physical SQLite file (e.g. `company_crystal.db`), providing absolute isolation and enterprise-grade data security.

### Dual-Portal System
* **Internal Staff Portal**: Used by the buyer's organization. Role-based privileges separate duties:
  * **Engineer**: Tracks stock levels and initiates Purchase Requisitions.
  * **Manager**: Approves Purchase Orders, starts RFQs, and monitors spend metrics.
  * **Finance**: Audits invoices, executes 3-way matching (PO vs. GRN vs. Invoice), and handles payments.
* **External Vendor Portal**: A secure portal accessed by external suppliers (e.g. Raj Metal Suppliers) to view pending Purchase Orders, submit bids/RFQs, track shipments, and upload invoices.

---

## 📖 Setup & Deployment Manuals

For step-by-step guides on getting the project running, refer to the dedicated guides:

* **Local Machine Setup**: Follow [README_LOCAL.md](file:///d:/New%20folder/procurement-kpi/README_LOCAL.md) to install dependencies, push database schemas, seed data, and run verification test cases on your local system.
* **Production Cloud Deployment**: Follow [README_PRODUCTION.md](file:///d:/New%20folder/procurement-kpi/README_PRODUCTION.md) to configure self-hosted instances on Amazon Web Services (AWS EC2/ECS) or migrate schemas to serverless hosting (Vercel) using cloud relational databases (AWS RDS/Postgres).

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
