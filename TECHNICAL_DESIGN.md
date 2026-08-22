# TECHNICAL_DESIGN.md

# ProcureBuddy — Detailed Technical Specification

**Version:** 2.0
**Date:** 2026-06-23
**Audience:** Backend developers implementing the server-side layer for this application
* * *

## Table of Contents

1. [System Overview](http://#1-system-overview)
2. [Current Architecture](http://#2-current-architecture)
3. [Target Backend Architecture](http://#3-target-backend-architecture)
4. [Data Models](http://#4-data-models)
5. [Business Logic & Rules](http://#5-business-logic--rules)
6. [API Specification](http://#6-api-specification)
7. [Authentication & Authorization](http://#7-authentication--authorization)
8. [Workflow State Machines](http://#8-workflow-state-machines)
9. [Notification System](http://#9-notification-system)
10. [File & Document Management](http://#10-file--document-management)
11. [Currency & FX Handling](http://#11-currency--fx-handling)
12. [Audit Logging](http://#12-audit-logging)
13. [Frontend Integration Notes](http://#13-frontend-integration-notes)
14. [Deployment Notes](http://#14-deployment-notes)
* * *

## 1\. System Overview

ProcureBuddy is an end-to-end procurement management platform designed for industrial companies with complex procurement cycles. It manages the complete lifecycle from demand creation through to payment settlement, including supplier management, tendering, goods receipt, and financial reconciliation.

### Core Procurement Flow

```scss
Item Master → RFQ → Quotation → Purchase Order → GRN → Invoice → 3-Way Match → Payment
                                       ↑
                                Multi-Tier Approval
                                (Manager → Finance)
```

### Functional Modules

| Module | Purpose |
| ---| --- |
| Item Master | Materials and services catalogue with benchmarking |
| Supplier Management | Vendor database with KPI tracking |
| RFQ / Tendering | Competitive bidding with weighted evaluation |
| Purchase Orders | PO lifecycle with multi-tier approvals |
| Goods Receipt (GRN) | Acceptance/rejection of deliveries |
| Inventory | Stock levels, reorder tracking, adjustments |
| Invoice Matching | 3-way match (PO + GRN + Invoice) |
| Finance | Payment scheduling, aging analysis, approval |
| Budgets | Budget envelope management with utilisation tracking |
| Contracts | Framework agreements and renewal tracking |
| Blanket POs | Ceiling-based framework purchase orders |
| Assets | Fixed asset register with depreciation |
| Documents | Versioned document store with expiry tracking |
| Supplier Portal | Self-service portal for suppliers |
| Analytics | Spend intelligence and procurement KPIs |
| Notifications | Event-driven alert system |

* * *

## 2\. Current Architecture

The application is currently a fully client-side Next.js application with no backend. All state lives in a single React Context (`AppContext`), seeded from in-memory mock data files. There is no database, no API, and no persistence beyond a session token in `localStorage`.

```cs
src/
├── app/
│   ├── page.tsx              # Root router (activePage switch — 25 pages)
│   ├── globals.css           # CSS variables, layout, theme
│   ├── light-mode.css        # Light theme overrides
│   └── layout.tsx            # HTML shell
├── components/               # 29 page components
├── context/
│   └── AppContext.tsx        # ~1,800-line monolithic state store
├── data/
│   ├── mockData.ts           # Primary seed data
│   ├── extendedMockData.ts   # GRN, Asset, Stock seed data
│   └── roadmapMockData.ts    # Additional seed data
└── types/
    └── index.ts              # All TypeScript interfaces
```

**Key configuration:**
*   `next.config.ts` sets `output: 'export'` — the app builds to static HTML, no server
*   `@prisma/client` is installed but not wired up (no schema or migrations exist yet)
*   No `src/app/api/` directory exists

**What a backend developer must build:**
*   REST API layer (recommended: Next.js API Routes or standalone Express/Fastify)
*   Database schema matching the data models in Section 4
*   Auth service (JWT-based, dual user/supplier sessions)
*   File storage for documents and compliance files
*   Background job system for notifications and contract/expiry checks
* * *

## 3\. Target Backend Architecture

### Recommended Stack

| Layer | Recommendation | Notes |
| ---| ---| --- |
| Runtime | Node.js 20+ | Matches existing TypeScript codebase |
| Framework | Next.js API Routes | Simplest — no new repo needed |
| ORM | Prisma (already installed) | Schema file needs to be created |
| Database | PostgreSQL 15+ | Relational; JSONB for flexible/array fields |
| Auth | JWT (custom) or NextAuth.js | Dual user/supplier sessions required |
| File Storage | S3-compatible (AWS S3, Cloudflare R2, MinIO) | Documents, compliance certs |
| Background Jobs | BullMQ + Redis | Notification dispatch, daily expiry checks |
| Cache | Redis | FX rates, session store |

### Removing Static Export

`next.config.ts` must be changed before any API routes or server-side code can be used:

```typescript
// next.config.ts — remove output: 'export'
const nextConfig = {
  images: { unoptimized: true }
};
export default nextConfig;
```

* * *

## 4\. Data Models

All TypeScript interfaces live in `src/types/index.ts`. This section documents every entity with its complete field set.
* * *

### 4.1 User

```typescript
interface User {
  id: string;                    // Format: USR-001
  name: string;
  email: string;
  password: string;              // Store hashed (bcrypt)
  role: 'manager' | 'engineer' | 'finance';
  department?: string;
  avatar?: string;               // URL or initials fallback
  lastLogin?: string;            // ISO datetime
}
```

**7 seed users:**

| ID | Name | Role |
| ---| ---| --- |
| USR-001 | Aisha Al-Mansoori | manager |
| USR-002 | Mohammed Al-Farsi | manager |
| USR-003 | James Okafor | engineer |
| USR-004 | Priya Nair | engineer |
| USR-005 | Carlos Reyes | engineer |
| USR-006 | Fatima Al-Zaabi | finance |
| USR-007 | Rohan Mehta | finance |

* * *

### 4.2 Supplier

```typescript
interface Supplier {
  id: string;                    // Format: SUP-001
  name: string;
  category: string;              // e.g. 'Steel & Metals', 'Services'
  country: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  vatNumber?: string;
  isPreferred: boolean;
  status: 'Active' | 'Inactive' | 'Blacklisted';
  tags: string[];
  kpis: SupplierKPIs;
  contacts: SupplierContact[];
  notes: SupplierNote[];
  password?: string;             // Supplier portal login (store hashed)
}

interface SupplierKPIs {
  priceVariation: number;        // % deviation from benchmark
  deliveryPerformance: number;   // % on-time deliveries
  paymentTerms: string;          // e.g. 'Net 30', 'Net 60'
  onTimePayment: number;         // % paid by buyer on time
  responseTime: number;          // avg hours to respond to RFQ
  deliveryTerms: string;         // Incoterm: CIF, FOB, DDP, etc.
  rejectionRate: number;         // % of received goods rejected
}

interface SupplierContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface SupplierNote {
  id: string;
  content: string;
  createdBy: string;             // User name
  createdAt: string;             // ISO datetime
  type: 'general' | 'performance' | 'compliance' | 'commercial';
}
```

**8 seed suppliers:** SteelMax Industries (SUP-001), GlobalPipe Solutions (SUP-002), EuroChem Supply Co. (SUP-003), IndoTech Materials (SUP-004), AmeriSteel Corp (SUP-005), NipponValve Ltd. (SUP-006), TechServ Engineering (SUP-007), InspectoPro Services (SUP-008)
* * *

### 4.3 Item (Material / Service)

```typescript
interface Item {
  id: string;                    // Format: ITM-001
  name: string;
  category: ItemCategory;
  description: string;
  unit: string;                  // 'metre', 'piece', 'kg', 'lump sum', etc.
  currentPrice: number;          // Latest purchase price
  benchmarkPrice: number;        // Market reference price for savings calc
  linkedSupplierIds: string[];   // Approved supplier list
  priceHistory: PriceHistoryEntry[];
  purchaseHistory: PurchaseHistoryEntry[];
  serviceDetails?: ServiceDetails; // Only for service items
  archived: boolean;
}

type ItemCategory =
  'Piping' | 'Valves' | 'Fittings' | 'Chemicals' |
  'Electrical' | 'Instrumentation' | 'Services';

interface PriceHistoryEntry {
  date: string;                  // ISO date
  price: number;
  supplierId: string;
}

interface PurchaseHistoryEntry {
  date: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  poId: string;
}

interface ServiceDetails {
  billingType: 'Fixed Price' | 'Hourly Rate' | 'Milestone Based' | 'Lump Sum';
  scopeOfWork: string;
  duration: string;              // e.g. '12 months', '6 weeks'
  slaTerms: string;
  milestones?: ServiceMilestone[];
}

interface ServiceMilestone {
  id: string;
  name: string;
  percentage: number;            // % of total price for this milestone
  dueDate: string;
  completed: boolean;
}
```

**9 seed items:** 7 physical goods (Carbon Steel Pipe, Gate Valve, NaOH, SS Flange, HDPE Pipe, Ball Valve, Legacy Carbon Elbow) + 2 services (Pipeline Inspection Service, Annual Maintenance Contract - Valves)
* * *

### 4.4 Purchase Order

```typescript
interface PurchaseOrder {
  id: string;                    // Format: PO-2026-001
  dateOfIssue: string;           // ISO date
  supplierId: string;
  supplierName: string;
  items: POLineItem[];
  totalAmount: number;           // In transaction currency
  currency: string;              // Default: 'USD'
  fxRate: number;                // Rate to base currency (AED) at time of issue
  totalAmountBase: number;       // totalAmount × fxRate (AED)
  paymentTerms: string;          // e.g. 'Net 30'
  amountPaid: number;
  dateOfPayment?: string;
  dueDate?: string;
  deliveryStatus: POStatus;
  paymentStatus: PaymentStatus;
  eta?: string;                  // Estimated arrival date
  incoterms?: string;            // e.g. 'CIF Dubai'
  projectReference?: string;
  notes?: string;
  approvalSteps: ApprovalStep[];
  currentApprovalStep: number;   // Index into approvalSteps[]
  matchStatus?: MatchStatus;
  blanketPOId?: string;          // If released from a blanket PO
  contractId?: string;           // If linked to a contract
  budgetId?: string;             // If charged to a budget envelope
  savingsAmount?: number;        // Calculated savings vs benchmark
  paymentRecords?: PaymentRecord[];
  shipmentUpdates?: ShipmentUpdate[];
  amendments?: POAmendment[];
  acknowledgedBySupplier?: boolean;
  acknowledgedAt?: string;
}

type POStatus =
  'Draft' | 'Pending' | 'Approved' | 'Shipped' |
  'Partially Delivered' | 'Delivered' | 'Cancelled' | 'Awaiting Settlement';

type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

interface POLineItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  totalPrice: number;            // quantity × unitPrice
  deliveredQty?: number;         // Confirmed received via GRN
}

interface ApprovalStep {
  role: 'manager' | 'finance';
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;           // User name
  approvedAt?: string;           // ISO datetime
  comment?: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string;
  date: string;
  recordedBy: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
}

type PaymentMethod =
  'Bank Transfer' | 'Cheque' | 'Cash' | 'Letter of Credit' | 'Online Payment';

interface ShipmentUpdate {
  id: string;
  status: string;
  location: string;
  estimatedArrival: string;
  trackingNumber?: string;
  updatedAt: string;
  updatedBy: string;             // Supplier name or internal user name
}

interface POAmendment {
  id: string;
  requestedBy: string;           // 'supplier' or user name
  reason: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  resolvedAt?: string;
}

type MatchStatus =
  'Full Match' | 'Variance' | 'Missing GRN' | 'Missing PO' | 'Pending';
```

**13 seed POs** — statuses span the full lifecycle from Draft through Delivered and Cancelled.
* * *

### 4.5 RFQ (Request for Quotation)

```typescript
interface RFQ {
  id: string;                    // Format: RFQ-2026-001
  title: string;
  status: RFQStatus;
  tenderType: TenderType;
  evaluationWeights: Record<string, number>; // e.g. { price: 30, leadTime: 20, ... }
  bidDeadline: string;           // ISO datetime
  clarificationDeadline?: string;
  createdBy: string;             // User ID
  createdByName: string;
  dateCreated: string;
  dateSent?: string;
  deadlineDate: string;
  projectReference?: string;
  notes?: string;
  lineItems: RFQLineItem[];
  invitedSupplierIds: string[];  // Populated for selective tenders
  awardedQuotationId?: string;
  awardedSupplierId?: string;
  awardedSupplierName?: string;
}

type RFQStatus = 'Draft' | 'Sent' | 'Published' | 'Closed' | 'Awarded' | 'Cancelled';
type TenderType = 'open' | 'selective' | 'single-source' | 'framework';

interface RFQLineItem {
  id: string;
  itemId?: string;
  itemName: string;
  quantity: number;
  unit: string;
  specifications?: string;
  targetPrice?: number;
}
```

**Default evaluation weights (must sum to 100):**

| Criterion | Weight |
| ---| --- |
| price | 30 |
| leadTime | 20 |
| pastHistory | 15 |
| paymentTerms | 12 |
| serviceQuality | 12 |
| responsiveness | 6 |
| compliance | 5 |

* * *

### 4.6 Quotation

```typescript
interface Quotation {
  id: string;                    // Format: QUO-001
  rfqId: string;
  supplierId: string;
  supplierName: string;
  status: QuotationStatus;
  dateReceived: string;
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  currency: string;
  totalAmount: number;
  lineItems: QuotationLineItem[];
  evaluation?: QuotationEvaluation;
  feedback?: string;
  negotiationCount: number;
}

type QuotationStatus = 'Pending' | 'Received' | 'Evaluated' | 'Awarded' | 'Rejected';

interface QuotationLineItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  leadTimeDays: number;
  unit: string;
}

interface QuotationEvaluation {
  price: number;                 // Score 0–10
  paymentTerms: number;          // Score 0–10
  leadTime: number;              // Score 0–10
  pastHistory: number;           // Score 0–10
  serviceQuality: number;        // Score 0–10
  responsiveness: number;        // Score 0–10
  compliance: number;            // Score 0–10
  totalScore: number;            // Weighted composite (see formula below)
  evaluatedBy: string;
  evaluatedAt: string;
  recommendation?: string;
}
```

**Weighted score formula:**

```plain
totalScore = (
  price          × 0.30 +
  paymentTerms   × 0.12 +
  leadTime       × 0.20 +
  pastHistory    × 0.15 +
  serviceQuality × 0.12 +
  responsiveness × 0.06 +
  compliance     × 0.05
) × 10
```

Result is a percentage (0–100). This formula is defined in `src/types/index.ts` as `calcEvalScore()`.
* * *

### 4.7 GRN (Goods Receipt Note)

```typescript
interface GRN {
  id: string;                    // Format: GRN-001
  poId: string;
  supplierId: string;
  supplierName: string;
  status: GRNStatus;
  dateCreated: string;
  dateApproved?: string;
  createdBy: string;             // User name
  approvedBy?: string;
  deliveryNoteNumber?: string;
  vehicleNumber?: string;
  notes?: string;
  lineItems: GRNLineItem[];
  totalAccepted: number;         // Sum of (acceptedQty × unitPrice) across all lines
  totalRejected: number;
  stockUpdated: boolean;         // Set true once inventory has been adjusted
}

type GRNStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Partial';

interface GRNLineItem {
  poLineIndex: number;           // Index of the corresponding PO line item
  itemId: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitPrice: number;
  rejectionReason?: string;
}
```

**Stock update rule:** On GRN approval, for each accepted line `stockItem.currentStock += acceptedQty`, a `StockMovement` record is created, and `grn.stockUpdated = true`. If any line has `acceptedQty < orderedQty`, status becomes `'Partial'`.
* * *

### 4.8 Invoice

```typescript
interface Invoice {
  id: string;                    // Format: INV-001
  invoiceNumber: string;         // Supplier's own invoice number
  poId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  matchStatus: MatchStatus;
  notes?: string;
  expectedPaymentDate?: string;
  submittedBySupplier?: boolean;
}

type InvoiceStatus =
  'Pending' | 'Matched' | 'Variance' | 'Paid' | 'Cancelled' | 'Processing';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

**3-Way Match logic** (see Section 5.10 for full algorithm):
*   `Full Match` — quantities and prices align within 2% tolerance
*   `Variance` — price or quantity differs beyond tolerance
*   `Missing GRN` — no approved GRN exists for the linked PO
*   `Missing PO` — invoice references a non-existent PO
* * *

### 4.9 Stock / Inventory

```typescript
interface StockItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  currentStock: number;
  reservedStock: number;         // Committed to open/approved POs
  reorderPoint: number;          // Threshold that triggers a reorder alert
  maxStock: number;              // Warehouse capacity limit
  location: string;
  lastUpdated: string;
  lastGRNId?: string;
}

interface StockMovement {
  id: string;
  stockItemId: string;
  itemId: string;
  itemName: string;
  movementType: 'GRN' | 'Adjustment' | 'Issue' | 'Return';
  quantity: number;              // Positive = inbound, negative = outbound
  referenceId: string;           // ID of GRN, adjustment, etc.
  date: string;
  performedBy: string;
  notes?: string;
  balanceAfter: number;          // Stock level after this movement
}
```

* * *

### 4.10 Asset

```typescript
interface Asset {
  id: string;                    // Format: AST-001
  name: string;
  category: string;
  supplierId?: string;
  purchaseDate: string;
  purchaseValue: number;
  salvageValue: number;
  depreciationRate: number;      // Annual rate as decimal, e.g. 0.20 = 20%
  usefulLife: number;            // Years
  location: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  warrantyDetails?: string;
  maintenancePlan?: string;
  maintenanceHistory: MaintenanceRecord[];
  status: AssetStatus;
  description?: string;
  poId?: string;
}

type AssetStatus = 'Active' | 'Under Maintenance' | 'Disposed' | 'Sold';

interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;                  // e.g. 'Preventive', 'Corrective'
  description: string;
  cost: number;
  performedBy: string;
  nextDueDate?: string;
}
```

**Depreciation formula (straight-line):**

```python
yearsElapsed  = (today - purchaseDate) / 365.25
currentValue  = max(purchaseValue - ((purchaseValue - salvageValue) / usefulLife) × yearsElapsed, salvageValue)
```

* * *

### 4.11 Budget Envelope

```typescript
interface BudgetEnvelope {
  id: string;                    // Format: BGT-001
  name: string;
  department?: string;
  year: number;
  totalAmount: number;
  committedAmount: number;       // Sum of approved POs not yet paid
  spentAmount: number;           // Sum of paid PO amounts
  currency: string;
  status: 'Active' | 'Closed' | 'Over Budget';
  notes?: string;
}
```

**Computed (derive on read, not stored):**
*   `availableAmount = totalAmount - committedAmount - spentAmount`
*   `utilisationPct = (committedAmount + spentAmount) / totalAmount × 100`

**3 seed budgets:** Mechanical Maintenance 2026 (500k), IT Infrastructure Refresh, Chemical Supply Annual (over-budget)
* * *

### 4.12 Contract

```typescript
interface Contract {
  id: string;                    // Format: CON-001
  title: string;
  supplierId: string;
  supplierName: string;
  type: string;                  // 'Framework', 'Fixed Price', 'Call-Off', etc.
  status: ContractStatus;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  terms: string;
  linkedPOIds: string[];
  documents?: string[];          // Document IDs
  notes?: string;
}

type ContractStatus = 'Draft' | 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
```

**Auto-status rule:** A contract becomes `'Expiring Soon'` when `endDate` is within 30 days of today, and `'Expired'` when `endDate` has passed.

**2 seed contracts:** Precision Steel Framework Agreement (CON-001, SUP-001, 1.2M USD), Chemical Sourcing & Logistics (CON-002, SUP-003, 500k USD, Expiring)
* * *

### 4.13 Blanket PO

```typescript
interface BlanketPO {
  id: string;                    // Format: BPO-001
  supplierId: string;
  supplierName: string;
  status: BlanketStatus;
  totalCeiling: number;          // Maximum total spend allowed
  consumedAmount: number;        // Sum of all release PO amounts
  currency: string;
  startDate: string;
  endDate: string;
  terms?: string;
  linkedPOIds: string[];         // Release orders drawn against this blanket
}

type BlanketStatus = 'Draft' | 'Active' | 'Expired' | 'Closed';
```

**2 seed blankets:** BPO-001 SteelMax (1M ceiling, 250k consumed), BPO-002 EuroChem (500k ceiling, 11.25k consumed)
* * *

### 4.14 Notification

```typescript
interface AppNotification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  source: 'PO' | 'Payment' | 'Document' | 'Budget' | 'Contract' | 'GRN';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  entityId?: string;
  entityType?: string;
}

interface NotificationRule {
  id: string;
  eventType: string;             // e.g. 'po_overdue', 'contract_expiry'
  enabled: boolean;
  threshold?: number;            // e.g. 30 (days before expiry)
  channels: ('in-app' | 'email')[];
}
```

* * *

### 4.15 Document

```typescript
interface AppDocument {
  id: string;                    // Format: DOC-001
  name: string;
  category: DocumentCategory;
  poId?: string;
  itemId?: string;
  supplierId?: string;
  uploadDate: string;
  fileSize: string;              // e.g. '2.4 MB'
  fileType: string;              // e.g. 'PDF', 'XLSX'
  fileUrl?: string;              // Storage URL (S3)
  expiryDate?: string;
  version?: number;
  supersededBy?: string;         // ID of the newer version document
}

type DocumentCategory =
  'MTC' | 'COO' | 'BL/AWB' | 'Delivery Note' | 'Packing List' |
  'Invoice' | 'Internal Inspection Report' | 'Work Completion Certificate' |
  'Service Report' | 'Timesheet' | 'SLA Report' | 'Payment Receipt';
```

* * *

### 4.16 Compliance Document

```typescript
interface ComplianceDocument {
  id: string;
  supplierId: string;
  title: string;
  category: ComplianceCategory;
  expiryDate?: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  uploadedAt: string;
}

type ComplianceCategory =
  'Trade License' | 'VAT Certificate' | 'ISO Certification' |
  'Insurance' | 'Product Catalogue' | 'Product Certificate' |
  'Technical Datasheet' | 'Other';
```

* * *

### 4.17 Audit Log

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: string;
  action: string;                // e.g. 'PO_APPROVED', 'GRN_SUBMITTED'
  entityType: string;            // e.g. 'PurchaseOrder', 'GRN'
  entityId: string;
  details?: string;
  ipAddress?: string;
}
```

* * *

### 4.18 GRN Dispute

```typescript
interface GRNDispute {
  id: string;
  grnId: string;
  poId: string;
  supplierId: string;
  reason: string;
  raisedBy: string;              // 'supplier' or user ID
  raisedAt: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
  resolution?: string;
  resolvedAt?: string;
}
```

* * *

### 4.19 Negotiation Message

```typescript
interface NegotiationMessage {
  id: string;
  rfqId: string;
  quotationId?: string;
  from: string;                  // 'buyer' or supplierId
  fromName: string;
  message: string;
  timestamp: string;
  attachmentUrl?: string;
}
```

* * *

### 4.20 Product Library Item (Supplier Portal)

```typescript
interface ProductLibraryItem {
  id: string;                    // Format: PRD-1
  name: string;
  category: string;
  description: string;
  specifications: string;        // e.g. 'ASME B16.5, Class 300'
  unit: string;
  basePrice: number;
  supplierId: string;
  supplierName: string;
  imageUrl?: string;
  certifications: string[];
}
```

* * *

## 5\. Business Logic & Rules

### 5.1 PO Approval Flow

POs move through two sequential approval steps stored in `approvalSteps[]`. `currentApprovalStep` is an index (0 or 1).

```yaml
Step 0: role='manager'  → status: Pending → Approved / Rejected
Step 1: role='finance'  → status: Pending → Approved / Rejected (only runs if Step 0 is Approved)
```

**Rules:**
*   Only a user whose `role === approvalSteps[currentApprovalStep].role` may act
*   Approval sets step status to `'Approved'` and advances `currentApprovalStep`
*   Rejection sets step status to `'Rejected'`, resets all steps to `'Pending'`, and sets `deliveryStatus = 'Draft'`
*   Once all steps are `'Approved'`, `deliveryStatus` moves from `'Pending'` to `'Approved'`

### 5.2 Payment Status Calculation

`paymentStatus` is derived from `amountPaid` vs `totalAmount`:

```bash
amountPaid === 0                               → 'Unpaid'
amountPaid > 0 && amountPaid < totalAmount     → 'Partial'
amountPaid >= totalAmount                      → 'Paid'
```

Payment records require Finance role approval before `amountPaid` is incremented.

### 5.3 Savings Calculation

For each PO line item:

```plain
lineSavings = (item.benchmarkPrice - line.unitPrice) × line.quantity
```

`benchmarkPrice` comes from the linked `Item` record. If no benchmark exists, savings = 0.

```plain
savingsRate = totalSavings / totalMarketSpend × 100
```

where `totalMarketSpend = sum of (benchmarkPrice × quantity)` across all non-cancelled PO lines.

### 5.4 Budget Utilisation

On PO approval: `budget.committedAmount += po.totalAmount`
On PO payment (approved): `budget.committedAmount -= payment.amount; budget.spentAmount += payment.amount`
Budget status → `'Over Budget'` when `committedAmount + spentAmount > totalAmount`

### 5.5 Blanket PO Ceiling Check

Before creating a release PO against a Blanket PO:

```cs
if (blanket.consumedAmount + newPO.totalAmount > blanket.totalCeiling) → reject with error
```

On PO approval: `blanket.consumedAmount += po.totalAmount`

### 5.6 Stock Update on GRN Approval

When a GRN transitions from `'Submitted'` to `'Approved'`:
1. For each line: `stockItem.currentStock += line.acceptedQty`
2. Create a `StockMovement` record per line (`movementType = 'GRN'`, `balanceAfter = new currentStock`)
3. Set `grn.stockUpdated = true`
4. If any line has `acceptedQty < orderedQty` → GRN status = `'Partial'`; else `'Approved'`

### 5.7 Reorder Alert Trigger

After every stock update, for each affected `StockItem`:

```bash
if (currentStock - reservedStock <= reorderPoint) → create notification of type 'alert', source 'GRN'
```

### 5.8 Contract Status Auto-Update

A scheduled daily job:

```bash
for each contract:
  if endDate <= today           → status = 'Expired'
  elif endDate <= today + 30d   → status = 'Expiring Soon'
```

### 5.9 Compliance Document Expiry

Same daily job:

```bash
for each complianceDoc:
  if expiryDate <= today        → status = 'Expired'
  elif expiryDate <= today + 30d → status = 'Expiring Soon'
```

### 5.10 3-Way Invoice Match

```sql
MATCH_TOLERANCE = 0.02  (2%)

for each invoice:
  poLines    = fetch PO.items where po.id === invoice.poId
  approvedGRN = fetch GRNs where grnStatus === 'Approved' and poId === invoice.poId

  if no approvedGRN            → matchStatus = 'Missing GRN'; stop

  for each invoice.lineItem:
    grnLine = approvedGRN.lineItems[matching index]
    poLine  = poLines[matching index]

    priceDiff = |invoice.unitPrice - poLine.unitPrice| / poLine.unitPrice
    qtyMatch  = invoice.quantity === grnLine.acceptedQty

    if priceDiff > MATCH_TOLERANCE || !qtyMatch → matchStatus = 'Variance'; stop

  matchStatus = 'Full Match'
```

### 5.11 FX Rate Application

FX rates are applied at the time a PO is created and frozen on the record:

```perl
po.fxRate         = fxRates[po.currency]   (at creation time)
po.totalAmountBase = po.totalAmount × po.fxRate
```

FX rates must not be retroactively applied to existing POs.
* * *

## 6\. API Specification

All endpoints are prefixed `/api/v1`. All require a valid JWT in the `Authorization: Bearer <token>` header unless marked `[public]`.

### 6.1 Auth

| Method | Endpoint | Description |
| ---| ---| --- |
| POST | `/auth/login` | User login → returns JWT |
| POST | `/auth/supplier-login` | Supplier portal login → returns JWT |
| POST | `/auth/logout` | Invalidate / clear token |
| GET | `/auth/me` | Return current user/supplier from token |

**Login request:**

```json
{ "email": "string", "password": "string" }
```

**Login response:**

```json
{
  "token": "eyJ...",
  "user": { "id": "USR-001", "name": "Aisha Al-Mansoori", "role": "manager" },
  "expiresAt": "2026-06-24T00:00:00Z"
}
```

* * *

### 6.2 Users

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/users` | List all users (manager only) |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user (manager only) |
| PATCH | `/users/:id` | Update user profile |

* * *

### 6.3 Suppliers

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/suppliers` | List all suppliers |
| GET | `/suppliers/:id` | Get full supplier profile |
| POST | `/suppliers` | Create supplier |
| PATCH | `/suppliers/:id` | Update supplier |
| PATCH | `/suppliers/:id/kpis` | Update KPI values |
| POST | `/suppliers/:id/notes` | Add a note |
| POST | `/suppliers/:id/contacts` | Add a contact |
| PATCH | `/suppliers/:id/preferred` | Toggle preferred status |

**Query params:** `?status=Active&category=Steel&preferred=true`
* * *

### 6.4 Items

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/items` | List all items |
| GET | `/items/:id` | Get item with price and purchase history |
| POST | `/items` | Create item |
| PATCH | `/items/:id` | Update item |
| POST | `/items/:id/archive` | Archive item |
| POST | `/items/:id/unarchive` | Unarchive item |
| POST | `/items/:id/price-history` | Add price history entry |

* * *

### 6.5 Purchase Orders

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/purchase-orders` | List POs |
| GET | `/purchase-orders/:id` | Get PO detail |
| POST | `/purchase-orders` | Create PO |
| PATCH | `/purchase-orders/:id/status` | Update delivery status |
| POST | `/purchase-orders/:id/approve` | Approve current approval step |
| POST | `/purchase-orders/:id/reject` | Reject current approval step |
| POST | `/purchase-orders/:id/cancel` | Cancel PO |
| POST | `/purchase-orders/:id/duplicate` | Duplicate as new Draft |
| POST | `/purchase-orders/:id/payment` | Record a payment |
| POST | `/purchase-orders/:id/payment/:paymentId/approve` | Finance approves payment record |
| POST | `/purchase-orders/:id/acknowledge` | Supplier acknowledges PO |
| POST | `/purchase-orders/:id/shipment` | Supplier posts shipment update |
| POST | `/purchase-orders/:id/amendment` | Request amendment |

**Query params:** `?status=Approved&supplierId=SUP-001&dateFrom=2026-01-01&dateTo=2026-06-30`
* * *

### 6.6 RFQ

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/rfqs` | List RFQs |
| GET | `/rfqs/:id` | Get RFQ detail |
| POST | `/rfqs` | Create RFQ |
| PATCH | `/rfqs/:id` | Update RFQ |
| POST | `/rfqs/:id/send` | Send to invited suppliers |
| POST | `/rfqs/:id/publish` | Publish as open tender |
| POST | `/rfqs/:id/close` | Close bidding |
| POST | `/rfqs/:id/award` | Award to a quotation |
| GET | `/rfqs/:id/messages` | Get negotiation message thread |
| POST | `/rfqs/:id/messages` | Post a negotiation message |

* * *

### 6.7 Quotations

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/quotations` | List quotations |
| GET | `/quotations/:id` | Get quotation detail |
| POST | `/quotations` | Submit quotation (supplier or buyer) |
| PATCH | `/quotations/:id` | Update quotation |
| POST | `/quotations/:id/evaluate` | Submit evaluation scores |
| POST | `/quotations/:id/feedback` | Add buyer feedback |

* * *

### 6.8 GRN

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/grns` | List GRNs |
| GET | `/grns/:id` | Get GRN detail |
| POST | `/grns` | Create GRN |
| POST | `/grns/:id/submit` | Submit for approval |
| POST | `/grns/:id/approve` | Approve GRN (triggers stock update) |
| POST | `/grns/:id/reject` | Reject GRN |
| POST | `/grns/:id/dispute` | Raise a GRN dispute |

* * *

### 6.9 Inventory

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/inventory` | List all stock items |
| GET | `/inventory/:id` | Get stock item with current levels |
| GET | `/inventory/:id/movements` | Get movement history |
| POST | `/inventory/:id/adjust` | Manual adjustment |

**Adjustment body:**

```json
{
  "quantity": -10,
  "reason": "Damaged goods",
  "notes": "Batch 2026-05 contaminated"
}
```

* * *

### 6.10 Invoices

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id` | Get invoice detail |
| POST | `/invoices` | Create invoice |
| POST | `/invoices/:id/submit` | Submit invoice |
| POST | `/invoices/:id/match` | Trigger 3-way match |

* * *

### 6.11 Budgets

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/budgets` | List all budgets |
| GET | `/budgets/:id` | Get budget with utilisation |
| POST | `/budgets` | Create budget |
| PATCH | `/budgets/:id` | Update budget |

* * *

### 6.12 Contracts

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/contracts` | List contracts |
| GET | `/contracts/:id` | Get contract detail |
| POST | `/contracts` | Create contract |
| PATCH | `/contracts/:id` | Update contract |

* * *

### 6.13 Blanket POs

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/blanket-pos` | List blanket POs |
| GET | `/blanket-pos/:id` | Get blanket PO detail |
| POST | `/blanket-pos` | Create blanket PO |
| PATCH | `/blanket-pos/:id` | Update blanket PO |

* * *

### 6.14 Assets

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/assets` | List assets |
| GET | `/assets/:id` | Get asset with maintenance history |
| POST | `/assets` | Create asset |
| PATCH | `/assets/:id/status` | Update asset status |
| POST | `/assets/:id/maintenance` | Log maintenance record |
| GET | `/assets/categories` | List asset categories |
| POST | `/assets/categories` | Add asset category |

* * *

### 6.15 Documents

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/documents` | List documents (filter: `?poId=&supplierId=&category=`) |
| GET | `/documents/:id` | Get document metadata |
| POST | `/documents` | Upload new document (multipart/form-data) |
| POST | `/documents/:id/version` | Upload new version |
| GET | `/documents/:id/download` | Redirect to signed S3 URL |

* * *

### 6.16 Compliance Documents

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/compliance-docs` | List (filter: `?supplierId=`) |
| POST | `/compliance-docs` | Upload compliance document |
| PATCH | `/compliance-docs/:id` | Update metadata / status |

* * *

### 6.17 Notifications

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/notifications` | List notifications for current user |
| POST | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |
| GET | `/notification-rules` | List notification rules |
| PATCH | `/notification-rules/:id` | Toggle rule / update threshold |

* * *

### 6.18 Analytics

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/analytics/spend` | Monthly spend aggregation |
| GET | `/analytics/savings` | YTD savings vs. benchmark |
| GET | `/analytics/category-breakdown` | Spend by item category |
| GET | `/analytics/supplier-performance` | KPI scores per supplier |
| GET | `/analytics/po-cycle-times` | Avg days from RFQ to GRN |
| GET | `/analytics/export` | CSV flat-file export for Power BI |

* * *

### 6.19 Supplier Portal (scoped to authenticated supplier's ID)

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/portal/pos` | POs addressed to this supplier |
| POST | `/portal/pos/:id/acknowledge` | Acknowledge PO |
| POST | `/portal/pos/:id/shipment` | Post shipment update |
| POST | `/portal/pos/:id/amendment` | Request amendment |
| GET | `/portal/invoices` | Supplier's submitted invoices |
| POST | `/portal/invoices` | Submit new invoice |
| GET | `/portal/compliance` | Supplier's compliance documents |
| POST | `/portal/compliance` | Upload compliance document |
| POST | `/portal/grns/:id/dispute` | Raise GRN dispute |
| GET | `/portal/products` | Supplier's product library |
| POST | `/portal/products` | Add product to library |

* * *

### 6.20 FX Rates

| Method | Endpoint | Description |
| ---| ---| --- |
| GET | `/fx-rates` | Get current FX rates |
| PATCH | `/fx-rates` | Update rates (manager only) |

**Default rates (base: AED):**

```json
{ "USD": 3.67, "EUR": 3.95, "GBP": 4.65, "AED": 1 }
```

* * *

## 7\. Authentication & Authorization

### 7.1 JWT Claims

```json
{
  "sub": "USR-001",
  "name": "Aisha Al-Mansoori",
  "role": "manager",
  "type": "user",
  "supplierId": null,
  "iat": 1750000000,
  "exp": 1750028800
}
```

For supplier sessions: `"type": "supplier"`, `"supplierId": "SUP-001"`, `"role": null`.

The current app stores the serialised user object in `localStorage.procureiq_user` and `localStorage.procureiq_supplier`. Replace these with JWT storage when integrating.

### 7.2 Role Permissions Matrix

| Action | manager | engineer | finance |
| ---| ---| ---| --- |
| View dashboard | ✓ | ✓ | ✓ |
| Create / edit items | ✓ | — | — |
| Archive items | ✓ | — | — |
| View items | ✓ | ✓ | — |
| Create / edit suppliers | ✓ | — | — |
| View suppliers | ✓ | ✓ | ✓ |
| Create PO | ✓ | ✓ | — |
| Approve PO — manager step | ✓ | — | — |
| Approve PO — finance step | — | — | ✓ |
| Cancel PO | ✓ | — | — |
| Create RFQ | ✓ | ✓ | — |
| Close / Award RFQ | ✓ | — | — |
| Evaluate quotations | ✓ | — | — |
| View quotations | ✓ | ✓ | ✓ |
| Create / submit GRN | ✓ | ✓ | — |
| Approve GRN | ✓ | — | — |
| Adjust inventory | ✓ | — | — |
| View inventory | ✓ | ✓ | ✓ |
| Upload documents | ✓ | ✓ | ✓ |
| Manage assets | ✓ | ✓ | — |
| View assets | ✓ | ✓ | ✓ |
| Record payments | ✓ | — | ✓ |
| Approve payments | — | — | ✓ |
| View finance / reports | ✓ | — | ✓ |
| Manage budgets | ✓ | — | ✓ |
| Manage contracts | ✓ | — | — |
| Manage blanket POs | ✓ | — | — |
| Match invoices | — | — | ✓ |
| View notifications | ✓ | ✓ | ✓ |

### 7.3 Supplier Portal Scoping

Supplier sessions (`type: 'supplier'`) may only access `/portal/*` endpoints. All portal queries are automatically scoped by `supplierId` from the JWT — a supplier cannot read another supplier's data. Enforce this at the API middleware level, not in application logic.

### 7.4 Subscription Tier Gating

To support multi-tenant SaaS commercial packaging, features are gated by the tenant's subscription tier (`CompanyProfile.subscriptionTier` field, which stores `'essential' | 'professional' | 'enterprise'`). 

Feature access is checked hierarchically (Essential = 1, Professional = 2, Enterprise = 3):

1. **Essential Tier**:
   * Access to: Supplier Database, POs & Goods Receipt, 3-Way Invoice Matching, Basic Dashboard Metrics, Documents.
   * Locked: RFQs & Tendering, Budget Control, Inventory Management, Advanced Analytics, Contracts, Fixed Assets, Multi-Currency FX Rates, Audit Logs, Supplier Portal, Advanced Multi-Tier Approvals.
2. **Professional Tier**:
   * Adds: RFQs & Tendering, Budget Control, Inventory Management, Advanced Analytics (Spend trends, cycle time, savings).
   * Locked: Contracts, Fixed Assets, Multi-Currency FX Rates, Audit Logs, Supplier Portal, Advanced Multi-Tier Approvals.
3. **Enterprise Tier**:
   * Adds: Contracts, Fixed Assets, Multi-Currency FX Rates, Audit Logs, Supplier Portal, Advanced Multi-Tier Approvals.

Gating is enforced at two levels:
* **API Mutation Gate**: The server checks the client's tenant subscription tier inside `/api/data/mutate` and rejects higher-tier actions with `HTTP 403 Forbidden`.
* **Frontend Navigation & UI Gate**: The sidebar links and dashboard widgets are filtered dynamically based on the current tenant's active `subscriptionTier`.
* * *

## 8\. Workflow State Machines

### 8.1 Purchase Order

```css
Draft
  → [submit]            → Pending
Pending
  → [manager approves]  → Pending (step advances to finance)
  → [manager rejects]   → Draft
Pending (finance step)
  → [finance approves]  → Approved
  → [finance rejects]   → Draft
Approved
  → [supplier ships]    → Shipped
Shipped
  → [partial GRN]       → Partially Delivered
  → [full GRN]          → Delivered
Partially Delivered
  → [remaining GRN]     → Delivered
Delivered
  → [all paid]          → Awaiting Settlement
Awaiting Settlement
  → [settled]           → (closed / archived)
Pending / Approved
  → [cancel]            → Cancelled
```

### 8.2 RFQ

```css
Draft
  → [send to suppliers] → Sent
  → [publish]           → Published
Sent / Published
  → [close bidding]     → Closed
Closed
  → [award]             → Awarded
Any
  → [cancel]            → Cancelled
```

### 8.3 Quotation

```css
Pending
  → [supplier submits]  → Received
Received
  → [buyer evaluates]   → Evaluated
Evaluated
  → [RFQ awarded here]  → Awarded
  → [not selected]      → Rejected
```

### 8.4 GRN

```scss
Draft
  → [submit]            → Submitted
Submitted
  → [all accepted]      → Approved  (triggers stock update)
  → [partial accept]    → Partial   (triggers stock update for accepted lines)
  → [all rejected]      → Rejected
```

### 8.5 Invoice

```css
Pending
  → [submit]            → Processing
Processing
  → [3-way match OK]    → Matched
  → [match fails]       → Variance
Matched
  → [payment recorded]  → Paid
Variance
  → [manually resolved] → Matched
Processing / Pending
  → [cancel]            → Cancelled
```

* * *

## 9\. Notification System

### 9.1 Trigger Events

| Event key | Trigger condition | Default |
| ---| ---| --- |
| `po_awaiting_approval` | PO submitted | in-app + email |
| `po_approved` | PO fully approved | in-app |
| `po_rejected` | PO rejected at any step | in-app + email |
| `po_overdue_delivery` | ETA passed, status not Delivered | in-app, threshold: 0 days |
| `payment_due` | PO payment due date is within threshold | in-app, threshold: 3 days |
| `payment_approved` | Payment record approved by Finance | in-app |
| `contract_expiry` | Contract end date within threshold | in-app + email, threshold: 30 days |
| `compliance_expiry` | Compliance doc expiry within threshold | in-app + email, threshold: 30 days |
| `stock_reorder` | Stock level at or below reorder point | in-app |
| `grn_submitted` | GRN submitted for approval | in-app |
| `grn_disputed` | GRN dispute raised | in-app + email |
| `invoice_variance` | 3-way match produces Variance | in-app + email |
| `budget_overrun` | Budget utilisation exceeds threshold | in-app, threshold: 90% |

### 9.2 Delivery Channels

**In-app:** Insert a row into the `notifications` table. The frontend polls `GET /notifications` or subscribes via WebSocket / Server-Sent Events.

**Email:** Enqueue a job to the email provider (SendGrid / AWS SES) using the user's registered email address.
* * *

## 10\. File & Document Management

### 10.1 Upload Flow

```haskell
Client → POST /api/v1/documents  (multipart/form-data)
  → Validate: file type ∈ {PDF, XLSX, DOCX, JPG, PNG}, size ≤ 25 MB
  → Upload to S3/R2 → receive fileUrl
  → Insert Document record
  → Return document metadata JSON
```

### 10.2 Document Versioning

When `POST /documents/:id/version` is called:
1. Upload the new file and get a new `fileUrl`
2. Create a new Document record with the same `name`, incremented `version`, and new `fileUrl`
3. Set the old document's `supersededBy` to the new document's ID
4. Old document remains accessible by its original ID (immutable history)

### 10.3 Signed URL Access

Never return raw S3 URLs. Always generate a short-lived (15-minute) pre-signed URL via the storage provider SDK on `GET /documents/:id/download`. This ensures access control is enforced at the API layer.
* * *

## 11\. Currency & FX Handling

All monetary amounts are stored in the transaction currency alongside the `fxRate` frozen at the time of transaction creation. The base reporting currency is **AED**.

```plain
po.totalAmountBase = po.totalAmount × po.fxRate
```

**Rules:**
*   FX rates are applied at creation time and never updated retroactively on existing records
*   `fxRates` table holds current rates; fetch once per session
*   Default rates: `{ USD: 3.67, EUR: 3.95, GBP: 4.65, AED: 1.0 }`
*   All analytics aggregations convert to AED using the stored `fxRate` on each record
* * *

## 12\. Audit Logging

Every state-changing operation must write an `AuditLogEntry`. This is non-negotiable for procurement compliance.

**Mandatory audit events:**

| Action | entityType |
| ---| --- |
| PO created / approved / rejected / cancelled | `PurchaseOrder` |
| Payment recorded / approved / rejected | `PurchaseOrder` |
| GRN submitted / approved / rejected / disputed | `GRN` |
| Invoice submitted / matched / paid | `Invoice` |
| RFQ created / sent / closed / awarded | `RFQ` |
| Quotation evaluated / awarded / rejected | `Quotation` |
| Supplier preferred status toggled | `Supplier` |
| Item archived / unarchived / price updated | `Item` |
| Budget created / modified | `BudgetEnvelope` |
| Contract status changed | `Contract` |
| Inventory manually adjusted | `StockItem` |
| Asset status changed / maintenance logged | `Asset` |
| User login / logout | `User` |

The `details` field should capture a JSON diff of changed fields where relevant (before → after values).
* * *

## 13\. Frontend Integration Notes

### 13.1 Migrating AppContext

The entire `AppContext.tsx` is the data layer. When the backend is ready, each action function should be replaced with an `async` API call while keeping the function signatures identical. This minimises change in the 29 component files.

**Migration pattern:**

```typescript
// Before (in-memory)
const addPurchaseOrder = (po: PurchaseOrder) => {
  setPurchaseOrders(prev => [...prev, po]);
};

// After (API-backed)
const addPurchaseOrder = async (po: Omit<PurchaseOrder, 'id'>) => {
  const created = await fetch('/api/v1/purchase-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(po),
  }).then(r => r.json());
  setPurchaseOrders(prev => [...prev, created]);
  return created;
};
```

### 13.2 Session Storage

The current app stores sessions in `localStorage`:
*   `localStorage.procureiq_user` — serialised `User` object
*   `localStorage.procureiq_supplier` — serialised `Supplier` object

Replace these with a JWT. The `currentUser` and `currentSupplier` fields in context should be populated from `GET /auth/me` on app startup.

### 13.3 Page Navigation

Navigation is driven by `activePage` string in context — not `next/navigation` or URL routing. There are 25 pages accessible through this string switch. This is a frontend concern and does not affect the backend.

### 13.4 Search

`globalSearchQuery` drives a `SearchResultsPage` that queries across all entities in memory. On the backend, expose a `GET /search?q=` endpoint that queries items, suppliers, POs, RFQs, quotations, and invoices in a single call.
* * *

## 14\. Deployment Notes

### 14.1 Environment Variables

```plain
DATABASE_URL=postgresql://user:password@host:5432/procureiq
JWT_SECRET=<32+ char random string>
JWT_EXPIRY=28800                  # 8 hours in seconds

# File Storage
S3_BUCKET=procureiq-documents
S3_REGION=me-central-1
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_ENDPOINT=                      # Leave empty for AWS S3

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@procureiq.com

# Redis
REDIS_URL=redis://localhost:6379
```

### 14.2 Database Entity Relationships

```scss
User            (1) ──── (M) AuditLogEntry
User            (1) ──── (M) AppNotification
Supplier        (1) ──── (M) PurchaseOrder
Supplier        (1) ──── (M) Quotation
Supplier        (1) ──── (M) Contract
Supplier        (1) ──── (M) ComplianceDocument
Supplier        (1) ──── (M) ProductLibraryItem
Item            (1) ──── (1) StockItem
Item            (1) ──── (M) PriceHistoryEntry
RFQ             (1) ──── (M) Quotation
RFQ             (1) ──── (M) NegotiationMessage
PurchaseOrder   (1) ──── (M) GRN
PurchaseOrder   (1) ──── (M) Invoice
PurchaseOrder   (1) ──── (M) AppDocument
GRN             (1) ──── (M) StockMovement
GRN             (1) ──── (M) GRNDispute
BudgetEnvelope  (1) ──── (M) PurchaseOrder
Contract        (1) ──── (M) PurchaseOrder
BlanketPO       (1) ──── (M) PurchaseOrder
Asset           (1) ──── (M) MaintenanceRecord
```

### 14.3 Prisma Setup

Prisma is already installed (`@prisma/client ^7.7.0`, `prisma ^7.7.0`). Create `prisma/schema.prisma` with models matching the interfaces in Section 4 and run:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

The seed script should import the existing mock data from `src/data/mockData.ts`, `extendedMockData.ts`, and `roadmapMockData.ts`. All existing string IDs (e.g. `PO-2026-001`, `SUP-001`) should be preserved as the primary key values.

### 14.4 Background Jobs (Daily)

Schedule a daily job (cron: `0 6 * * *`) to:
1. Update contract statuses (Section 5.8)
2. Update compliance document statuses (Section 5.9)
3. Check PO overdue deliveries and fire `po_overdue_delivery` notifications
4. Check payment due dates and fire `payment_due` notifications
5. Refresh FX rates from an external provider (optional)
* * *

_For the complete TypeScript interface definitions, see_ _`src/types/index.ts`__._
_For all current business logic implementations, see_ _`src/context/AppContext.tsx`__._
_For all seed data, see_ _`src/data/mockData.ts`__,_ _`extendedMockData.ts`__, and_ _`roadmapMockData.ts`__._