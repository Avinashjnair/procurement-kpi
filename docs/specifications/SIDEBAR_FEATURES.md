# SIDEBAR_FEATURES.md

# ProcureBuddy / ProcureIQ — Complete Sidebar & Features Specification

This document provides a comprehensive breakdown of all functional modules, navigation links, subscription tier allocations, and role-based permissions available in the application.
* * *

## 📌 1. Navigation Overview & Architecture

The application utilizes a modular, multi-tenant sidebar with **22 functional modules** organized into logical business sections:

```plain
graph TD
    Nav[Sidebar Navigation]

    Nav --> Core[Core Operations]
    Nav --> Sourcing[Sourcing & Bidding]
    Nav --> Procurement[Procurement & Logistics]
    Nav --> Finance[Finance & Accounting]
    Nav --> Records[Records & Compliance]

    Core --> D1[Operational Dashboard]
    Core --> D2[Supplier Self-Service Portal]

    Sourcing --> S1[RFQ / PR]
    Sourcing --> S2[Quotations & Comparison]

    Procurement --> P1[Materials & Services]
    Procurement --> P2[Suppliers Register]
    Procurement --> P3[Purchase Orders]
    Procurement --> P4[Invoices & 3-Way Match]
    Procurement --> P5[Goods Receipt - GRN]
    Procurement --> P6[Inventory & Stock]
    Procurement --> P7[Blanket POs]
    Procurement --> P8[Fixed Assets]
    Procurement --> P9[Contracts Management]

    Finance --> F1[Budget Envelopes]
    Finance --> F2[Finance & Payments]
    Finance --> F3[Spend Analytics]
    Finance --> F4[Executive KPI Reports]
    Finance --> F5[Power BI / Excel Export Hub]

    Records --> R1[Documents Repository]
    Records --> R2[Alerts & Notification Rules]
    Records --> R3[Enterprise Audit Trail]
```

* * *

## 📑 2. Detailed Functional Breakdown by Section

### 🔷 A. Core Operations
1. **Operational Dashboard (****`dashboard`****)**
    *   **Purpose:** Executive real-time control center for procurement operations.
    *   **Key Capabilities:** Spend KPI metrics, pending PO counters, delivery performance percentages, savings trackers, emergency PO ratios, and spend under management graphs.
2. **Supplier Self-Service Portal (****`portal`****)**
    *   **Purpose:** Dedicated external vendor interface.
    *   **Key Capabilities:** Bidding on published RFQs, PO acknowledgements with delivery dates/exceptions, shipment tracking (carrier, tracking #, ETA), and invoice uploads.
* * *

### 🔶 B. Sourcing & Bidding
1. **RFQ / PR (****`rfq`****)**
    *   **Purpose:** Requisition creation, tendering, and request-for-quotation workflows.
    *   **Key Capabilities:** Scope of supply definition, item specification notes, quick inline catalogue item creation, supplier invitation list, bid closing countdowns, and weighted technical/commercial scoring.
2. **Quotations (****`quotations`****)**
    *   **Purpose:** Bid evaluation, comparison, and contract awarding.
    *   **Key Capabilities:** Multi-vendor side-by-side price comparison, quotation document attachments (📎), manual offline quotation entry, price variation analysis against catalog benchmarks, and 1-click PO generation upon award.
* * *

### 🔷 C. Procurement & Master Data
1. **Materials & Services Catalogue (****`items`****)**
    *   **Purpose:** Centralized master data register for stock and service items.
    *   **Key Capabilities:** Item code generation, category tagging with custom categories, benchmark unit pricing, approved supplier mapping, and historical price movement.
2. **Suppliers Directory (****`suppliers`****)**
    *   **Purpose:** Comprehensive vendor relationship management.
    *   **Key Capabilities:** Vendor contact directory, bank details, trade license compliance expiry tracking, KPI scorecards (price variation, delivery %, rejection rate), and pending vendor registration review/approval panels.
3. **Purchase Orders (****`purchase-orders`****)**
    *   **Purpose:** End-to-end PO lifecycle management.
    *   **Key Capabilities:** Multi-tier approval routing (Manager → Finance), per-line-item scope descriptions, automatic AED currency conversion, multi-currency support, PDF generator with pagination, and Excel export.
4. **Invoices (****`invoices`****)**
    *   **Purpose:** Supplier billing, verification, and automated 3-way matching.
    *   **Key Capabilities:** Specific GRN delivery linkage (`grnId`), automatic calculation of match status (`Full Match` vs `Variance`), document attachments, and line-item billed quantity audits.
5. **Goods Receipt — GRN (****`grn`****)**
    *   **Purpose:** Warehouse delivery inspection and acceptance.
    *   **Key Capabilities:** Accepted vs. rejected quantities recording, delivery note & vehicle tracking, rejection reason capture, and automatic stock level updates.
6. **Quick Mobile GRN (****`quick-grn`****)**
    *   **Purpose:** Touch-optimized mobile / tablet interface for dock workers.
    *   **Key Capabilities:** Barcode scanning and expedited delivery verification on the warehouse floor.
7. **Inventory & Stock (****`inventory`****)**
    *   **Purpose:** Real-time stock level monitoring.
    *   **Key Capabilities:** Stock on hand, reorder points, low stock alerts, valuation, and manual stock adjustment logs.
8. **Blanket POs (****`blanket-pos`****)**
    *   **Purpose:** Long-term framework purchase orders with financial ceilings.
    *   **Key Capabilities:** Total ceiling amount tracking, drawdown/consumed balance tracking, validity date ranges, and release order linkage.
9. **Fixed Assets (****`assets`****)**
    *   **Purpose:** Capital equipment register and asset tracking.
    *   **Key Capabilities:** Depreciation calculation (straight-line), salvage values, maintenance logs, warranty expiry alerts, and physical location assignments.
10. **Contracts Management (****`contracts`****)**
    *   **Purpose:** Formal legal agreements and framework contracts.
    *   **Key Capabilities:** Contract value, renewal notification windows, linked Blanket PO IDs, document attachments, and expiration monitors.
* * *

### 🔶 D. Finance & Analytics
1. **Budget Envelopes (****`budgets`****)**
    *   **Purpose:** Departmental and project-level financial controls.
    *   **Key Capabilities:** Allocated budget vs. committed amount (open POs) vs. spent amount (paid invoices), currency management, and over-budget warnings.
2. **Finance & Payments (****`finance`****)**
    *   **Purpose:** Payment scheduling and cash-flow management.
    *   **Key Capabilities:** Payment batching, payment due date tracking, aging analysis (0-30, 31-60, 60+ days), and payment receipt uploads.
3. **Spend Analytics (****`analytics`****)**
    *   **Purpose:** Strategic sourcing and intelligence visualizations.
    *   **Key Capabilities:** Spend by category, monthly expenditure trends, supplier concentration analysis, and price savings KPI tracking.
4. **Executive KPI Reports (****`reports`****)**
    *   **Purpose:** Visual charts and KPI scorecards for C-suite and leadership.
    *   **Key Capabilities:** High-density metric graphs, delivery performance, and historical benchmark variances.
5. **Power BI / Flat-Table Excel Export Hub (****`export-reports`****)**
    *   **Purpose:** Data extraction for enterprise Business Intelligence tools.
    *   **Key Capabilities:** Multi-sheet flat-table `.xlsx` exports formatted specifically for Power BI data models (Spend Analysis, Supplier Scorecard, Payment Aging, Open POs).
* * *

### 🔷 E. Records & System Security
1. **Documents Repository (****`documents`****)**
    *   **Purpose:** Centralized compliance and commercial document filing.
    *   **Key Capabilities:** Versioned document store, categorization (MTC, COO, BL/AWB, Invoices, Delivery Notes), expiry monitoring, and PO/Supplier tagging.
2. **Alerts & Notification Rules (****`notifications`****)**
    *   **Purpose:** Proactive event-driven alerting.
    *   **Key Capabilities:** Action-required notifications for pending approvals, registration requests, expiring contracts/licenses, and threshold-based rule configuration.
3. **Enterprise Audit Trail (****`audit-logs`****)**
    *   **Purpose:** Immutable compliance and activity logs.
    *   **Key Capabilities:** Full chronological timestamping of all creations, edits, approvals, deletions, and status transitions with before/after diffs and actor identification.
* * *

## 🎯 3. Master Feature Matrix

| # | Sidebar Label | Route ID | Underlying Component | Permission Required | Minimum Tier |
| ---| ---| ---| ---| ---| --- |
| 1 | Operational Dashboard | `dashboard` | `DashboardPage.tsx` | `view_dashboard` | Essential |
| 2 | Materials & Services | `items` | `ItemsPage.tsx` | `view_items` | Essential |
| 3 | Suppliers | `suppliers` | `SuppliersPage.tsx` | `view_suppliers` | Essential |
| 4 | Purchase Orders | `purchase-orders` | `PurchaseOrdersPage.tsx` | `view_pos` | Essential |
| 5 | Invoices | `invoices` | `InvoicesPage.tsx` | `view_pos` | Essential |
| 6 | Goods Receipt (GRN) | `grn` | `GRNPage.tsx` | `view_grn` | Essential |
| 7 | Documents Repository | `documents` | `DocumentsPage.tsx` | `view_documents` | Essential |
| 8 | RFQ / PR | `rfq` | `RFQPage.tsx` | `view_rfqs` | Professional |
| 9 | Quotations & Bids | `quotations` | `QuotationsPage.tsx` | `view_quotations` | Professional |
| 10 | Inventory Management | `inventory` | `InventoryPage.tsx` | `view_inventory` | Professional |
| 11 | Budget Envelopes | `budgets` | `BudgetsPage.tsx` | `view_dashboard` | Professional |
| 12 | Finance & Payments | `finance` | `FinancePage.tsx` | `view_payments` | Professional |
| 13 | Spend Analytics | `analytics` | `AnalyticsPage.tsx` | `view_dashboard` | Professional |
| 14 | Executive KPI Reports | `reports` | `ExecutiveReportsPage.tsx` | `view_finance_reports` | Professional |
| 15 | Power BI / Excel Hub | `export-reports` | `ReportsPage.tsx` | `view_finance_reports` | Professional |
| 16 | Supplier Self-Service | `portal` | `SupplierPortalPage.tsx` | `view_dashboard` | Enterprise |
| 17 | Blanket POs | `blanket-pos` | `BlanketsPage.tsx` | `view_pos` | Enterprise |
| 18 | Fixed Assets | `assets` | `AssetsPage.tsx` | `view_assets` | Enterprise |
| 19 | Contracts | `contracts` | `ContractsPage.tsx` | `view_suppliers` | Enterprise |
| 20 | Alerts & Rule Engine | `notifications` | `NotificationsPage.tsx` | `view_dashboard` | Enterprise |
| 21 | System Audit Trail | `audit-logs` | Embedded / Dedicated | `view_dashboard` | Enterprise |
| 22 | Quick Mobile GRN | `quick-grn` | `MobileGRNEntry.tsx` | `view_grn` | Essential |

* * *

## 👥 4. Role-Based Access Control (RBAC) Matrix

| Feature Module | 👔 Manager (Admin) | 👷 Engineer (Ops) | 💰 Finance (Audit) | 🏢 Supplier (Vendor) |
| ---| ---| ---| ---| --- |
| Operational Dashboard | Full Access | Full Access | Full Access | No Access |
| Materials & Services | View / Create / Edit | View Only | View Only | No Access |
| Suppliers Directory | View / Create / Approve | View Only | View / Edit Bank Info | Own Profile Only |
| Purchase Orders | Create / Approve / Reject | Create Drafts | Audit / Link Payments | View / Acknowledge |
| Goods Receipt (GRN) | Approve / Reject | Create / Inspect | View Receipts | Dispute Rejections |
| Invoices & 3-Way Match | View Summary | No Access | Record / Match / Pay | Submit Invoices |
| RFQ & Quotations | Create / Award | Create RFQ | View Quotes | Submit Bids |
| Inventory & Stock | Adjust / Reorder | View Levels | View Valuation | No Access |
| Finance & Payments | Full Access | No Access | Full Access | Request Early Pay |
| Contracts & Blanket POs | Full Access | View Linked | Full Access | View Awarded |
| Fixed Assets | Create / Depreciate | Log Maintenance | View Asset Books | No Access |
| Documents Store | Full Access | Upload MTC/COO | Upload Invoices | Upload Compliance |
| Supplier Portal | Switch Context | No Access | No Access | Primary Interface |

* * *

## 💰 5. Commercial Subscription Tier Distribution

```sql
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🥉 ESSENTIAL TIER (Core Operational Control)                                 │
│    • Item Master & Catalogue          • Standard Purchase Orders            │
│    • Suppliers Register               • Goods Receipt (GRN) & Mobile Entry  │
│    • Invoices & 2/3-Way Match         • Document Attachments & Basic Search │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🥈 PROFESSIONAL TIER (Growth & Sourcing Optimization)                       │
│    • Everything in Essential, PLUS:                                         │
│    • RFQ & Tendering Engine           • Multi-Vendor Quotation Comparison   │
│    • Inventory & Stock Tracking       • Departmental Budget Envelopes       │
│    • Finance & Payment Scheduling     • Spend Intelligence Analytics        │
│    • Executive KPI Reports            • Power BI / Flat-Table Excel Hub     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🥇 ENTERPRISE TIER (Full Governance, Scale & External Collaboration)        │
│    • Everything in Professional, PLUS:                                      │
│    • Dedicated Supplier Portal Access • Framework Contracts & Renewals      │
│    • Blanket PO Ceilings & Drawdowns  • Fixed Asset Lifecycle & Depreciation│
│    • Multi-Tenant Physical Isolation • Full Audit Trail & Compliance Logs   │
│    • Advanced Notification Rules      • Multi-Currency & FX Rate Engine     │
└─────────────────────────────────────────────────────────────────────────────┘
```