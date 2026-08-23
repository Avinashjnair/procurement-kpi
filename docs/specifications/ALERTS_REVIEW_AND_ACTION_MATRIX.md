# ProcureBuddy / Procurement KPI — Alerts Review & Action Matrix

> **Document Classification:** Enterprise Architecture & Standard Operating Procedures (SOP)  
> **Target Application:** ProcureBuddy / Procurement KPI Platform  
> **Version:** 1.0 (Production Release)  
> **Generated:** August 2026  

---

## 1. Executive Summary & Root Cause Findings

### 1.1 Problem Statement
In the application, although the Alert / Notification function was defined in the navigation and types schema, users were not receiving active alerts. 

### 1.2 Root Cause Analysis
A systematic code audit revealed four primary root causes:
1. **Missing Mutation Dispatches (`AppContext.tsx`):** While `addNotification` was implemented in the state context, standard lifecycle actions (such as PO approvals, GRN rejections, 3-way match variances, payment logging, and bid submissions) did not call `addNotification()`.
2. **Empty Database Seeding (`prisma/seed.ts`):** Database initialization routines purged the notification and rule tables (`prisma.appNotification.deleteMany({})` and `prisma.notificationRule.deleteMany({})`) but did not re-seed default business rules or demo alerts.
3. **Absence of Background Condition Evaluator:** Time-dependent and threshold-dependent conditions (overdue POs, expiring contracts, low stock levels, budget envelope overruns) lacked an automated scanner to evaluate thresholds dynamically.
4. **Supplier Portal Event Isolation:** Actions performed by vendors in the Supplier Self-Service Portal (acknowledgments, amendments, disputes, invoice submissions) were isolated from the buyer notification queue.

---

## 2. Complete Master Alert Catalog (23 Standard Events)

```
========================================================================================================================
#  | CODE   | MODULE              | ALERT EVENT                  | SEVERITY | TARGET ROLE  | TRIGGER CONDITION
========================================================================================================================
1  | PO-01  | Purchase Orders     | PO Approval Required         | Critical | Manager      | PO created in 'Pending' status
2  | PO-02  | Purchase Orders     | PO Overdue Delivery          | Warning  | Buyer/Ops    | Current date > PO ETA & status != Delivered
3  | PO-03  | Purchase Orders     | PO Ack with Exceptions       | Warning  | Buyer        | Vendor accepted PO with date/scope changes
4  | PO-04  | Purchase Orders     | PO Shipment Dispatched       | Info     | Warehouse    | Vendor entered carrier name & tracking #
5  | PO-05  | Purchase Orders     | PO Amendment Requested       | Critical | Buyer/Mgr    | Vendor requested quantity/date amendment
------------------------------------------------------------------------------------------------------------------------
6  | GRN-01 | GRN & Quality       | GRN Pending Approval         | Critical | Manager/QC   | Warehouse submitted physical receipt GRN
7  | GRN-02 | GRN & Quality       | Quality Rejection (QA Fail)  | Critical | Buyer/QA     | GRN logged with rejected line items (qty > 0)
8  | GRN-03 | GRN & Quality       | GRN Dispute by Supplier      | Critical | QA Manager   | Vendor disputed rejected goods with docs
------------------------------------------------------------------------------------------------------------------------
9  | INV-01 | Invoices & Matching | 3-Way Match Variance         | Critical | Finance      | Price or quantity mismatch (PO vs GRN vs Inv)
10 | INV-02 | Invoices & Matching | Invoice Without GRN          | Warning  | Warehouse    | Invoice uploaded before physical GRN approval
11 | INV-03 | Invoices & Matching | Early Payment Discount       | Info     | Treasury     | Vendor offered cash discount for early pay
------------------------------------------------------------------------------------------------------------------------
12 | STK-01 | Inventory           | Critical Stockout (Zero)     | Critical | Engineer     | currentStock == 0 for catalog item
13 | STK-02 | Inventory           | Stock Below Reorder Point    | Warning  | Buyer        | 0 < currentStock <= reorderPoint
------------------------------------------------------------------------------------------------------------------------
14 | BGT-01 | Budgets             | Budget Over-Budget (100%+)   | Critical | Dept Head    | (committed + spent) >= totalAmount
15 | BGT-02 | Budgets             | Budget Warning (>80%)        | Warning  | Manager      | 80% <= Utilization < 100%
------------------------------------------------------------------------------------------------------------------------
16 | CON-01 | Contracts & Blanket | Contract Expiring Soon       | Warning  | Procurement  | Days to endDate <= renewalWindowDays
17 | CON-02 | Contracts & Blanket | Blanket Ceiling (>85%)       | Warning  | Buyer        | consumedAmount / totalCeiling >= 0.85
------------------------------------------------------------------------------------------------------------------------
18 | SUP-01 | Suppliers           | Vendor Registration Pending  | Critical | Manager      | Prospective vendor submitted onboarding form
19 | SUP-02 | Suppliers           | Compliance Document Expired  | Critical | Compliance   | Trade license, VAT, or ISO certificate expired
------------------------------------------------------------------------------------------------------------------------
20 | RFQ-01 | RFQs & Quotations   | New Quotation/Bid Received   | Info     | Engineer     | Invited vendor submitted bid in portal
21 | RFQ-02 | RFQs & Quotations   | RFQ Evaluation Completed     | Critical | Manager      | Technical & commercial scoring submitted
------------------------------------------------------------------------------------------------------------------------
22 | FIN-01 | Finance & Payments  | Payment Approval Required    | Critical | Finance Mgr  | Payment record logged in 'Pending' status
23 | AST-01 | Assets & Equipment  | Maintenance Due              | Info     | Maintenance  | Scheduled maintenance date reached
========================================================================================================================
```

---

## 3. Detailed Alert Specification & Action Matrix

### 3.1 Purchase Orders Module (PO)

#### Alert PO-01: Purchase Order Approval Required
- **Severity:** Critical (Alert / Red)
- **Target Role:** Procurement Manager / Financial Approver
- **Trigger Rule:** Created PO with status `Pending` or awaiting multi-tier signoff.
- **Notification Text:** *"PO #PO-XXXX ($YY,YYY) from [Supplier] submitted for approval by [User]."*
- **Standard Operating Procedure (Action Required):**
  1. Navigate to **Purchase Orders** page -> Open PO `#PO-XXXX`.
  2. Audit line item quantities, specifications, delivery terms, and assigned budget envelope.
  3. Click **[Approve PO]** to disburse to supplier, or click **[Reject PO]** and state reasons.

#### Alert PO-02: Overdue Delivery (Promised ETA Missed)
- **Severity:** Warning (Amber)
- **Target Role:** Buyer / Procurement Operations
- **Trigger Rule:** `Current Date > PO ETA` AND `deliveryStatus != 'Delivered'` AND `deliveryStatus != 'Cancelled'`.
- **Notification Text:** *"PO #PO-XXXX is overdue by X days. Promised ETA was [Date]."*
- **Standard Operating Procedure (Action Required):**
  1. Open PO detail -> Review carrier tracking number.
  2. Send direct clarification message to supplier via PO Messaging tab.
  3. Update ETA if delay is authorized, or initiate supplier penalty/escalation.

#### Alert PO-03: PO Acknowledged with Exceptions
- **Severity:** Warning (Amber)
- **Target Role:** Buyer
- **Trigger Rule:** Supplier accepts PO in portal but modifies promised delivery date or enters notes.
- **Notification Text:** *"[Supplier] acknowledged PO #PO-XXXX with exceptions: [Notes]."*
- **Standard Operating Procedure (Action Required):**
  1. Review supplier's proposed schedule and exception notes.
  2. Accept revision or contact vendor to renegotiate delivery commitment.

#### Alert PO-04: Shipment Dispatched
- **Severity:** Info (Blue)
- **Target Role:** Warehouse Inward / Procurement Engineer
- **Trigger Rule:** Vendor inputs Carrier Name, Tracking Number, and Shipped Date in portal.
- **Notification Text:** *"[Supplier] dispatched shipment for PO #PO-XXXX via [Carrier] (Tracking: [Num])."*
- **Standard Operating Procedure (Action Required):**
  1. Alert warehouse dock to prepare for receipt and staging.
  2. Monitor carrier shipment tracking.

#### Alert PO-05: Purchase Order Amendment Requested
- **Severity:** Critical (Alert / Red)
- **Target Role:** Buyer / Procurement Manager
- **Trigger Rule:** Supplier requests quantity changes or price/scope revisions in portal.
- **Notification Text:** *"[Supplier] requested amendment on PO #PO-XXXX: [Reason]."*
- **Standard Operating Procedure (Action Required):**
  1. Open PO -> Review **Amendment Request** drawer.
  2. Click **[Approve Amendment]** (increments revision number) or **[Reject]**.

---

### 3.2 Goods Receipt Note (GRN) & Quality Control

#### Alert GRN-01: Goods Receipt Note Pending Approval
- **Severity:** Critical (Alert / Red)
- **Target Role:** Procurement Manager / QC Lead
- **Trigger Rule:** Warehouse logs physical delivery and submits GRN (`Submitted` status).
- **Notification Text:** *"GRN #GRN-XXXX against PO #PO-YYYY submitted for approval."*
- **Standard Operating Procedure (Action Required):**
  1. Open GRN record -> Verify physical delivery note, vehicle/AWB number, and line counts.
  2. Click **[Approve & Update Stock]** to post received goods into live Inventory.

#### Alert GRN-02: Quality Rejection / Goods QA Failure
- **Severity:** Critical (Alert / Red)
- **Target Role:** Buyer / QA Lead
- **Trigger Rule:** GRN logged with `rejectedQty > 0`.
- **Notification Text:** *"Quality Alert: [X] units rejected on GRN #GRN-XXXX for PO #PO-YYYY. Reason: [Reason]."*
- **Standard Operating Procedure (Action Required):**
  1. Review rejection report and non-conformance photo attachments.
  2. Issue a formal Return-to-Vendor (RTV) delivery note.
  3. Request immediate replacement or debit note against supplier.

#### Alert GRN-03: GRN Dispute Raised by Supplier
- **Severity:** Critical (Alert / Red)
- **Target Role:** QA Manager / Procurement Manager
- **Trigger Rule:** Vendor lodges dispute against rejected quantities via Supplier Portal.
- **Notification Text:** *"[Supplier] disputed rejection on GRN #GRN-XXXX: [Dispute Reason]."*
- **Standard Operating Procedure (Action Required):**
  1. Open GRN Disputes panel -> Review vendor lab analysis / Mill Test Certificates (MTC).
  2. Perform secondary joint inspection and mark dispute **[Resolved]** or **[Upheld]**.

---

### 3.3 Invoices & 3-Way Matching

#### Alert INV-01: 3-Way Match Variance Detected
- **Severity:** Critical (Alert / Red)
- **Target Role:** Finance Officer / Accounts Payable
- **Trigger Rule:** Invoice unit price != PO unit price OR billedQty > GRN acceptedQty.
- **Notification Text:** *"3-Way Match Failed: Price/Quantity variance on Invoice #[InvNum] for PO #PO-XXXX."*
- **Standard Operating Procedure (Action Required):**
  1. Open Invoices page -> Review side-by-side reconciliation table.
  2. Place invoice payment on hold.
  3. Contact supplier to provide Credit Note or corrected invoice.

#### Alert INV-02: Invoice Received Without GRN
- **Severity:** Warning (Amber)
- **Target Role:** Warehouse Lead / Finance Officer
- **Trigger Rule:** Supplier uploads invoice for a PO that has no approved GRN.
- **Notification Text:** *"Invoice #[InvNum] received for PO #PO-XXXX, but no approved GRN is recorded."*
- **Standard Operating Procedure (Action Required):**
  1. Notify warehouse inward dock to prioritize physical delivery inspection.
  2. Hold invoice disbursement until GRN approval is complete.

#### Alert INV-03: Early Payment Cash Discount Requested
- **Severity:** Info (Blue)
- **Target Role:** Finance Manager / Treasury Lead
- **Trigger Rule:** Vendor requests early settlement offering cash discount (e.g., 2% Net 10).
- **Notification Text:** *"[Supplier] requested early payment on Invoice #[InvNum] with [X]% discount."*
- **Standard Operating Procedure (Action Required):**
  1. Evaluate working capital cash flow.
  2. Accept request to capture early settlement savings, or decline to maintain standard payment terms.

---

### 3.4 Inventory & Warehouse Management

#### Alert STK-01: Critical Stockout (Zero Stock)
- **Severity:** Critical (Alert / Red)
- **Target Role:** Procurement Engineer / Buyer
- **Trigger Rule:** `currentStock == 0` for an active catalog item.
- **Notification Text:** *"CRITICAL: [Item Name] (SKU: [ID]) is OUT OF STOCK."*
- **Standard Operating Procedure (Action Required):**
  1. Click alert to view item and approved supplier mappings.
  2. Click **[Create PO]** or launch an emergency RFQ to prevent plant downtime.

#### Alert STK-02: Stock Below Reorder Point
- **Severity:** Warning (Amber)
- **Target Role:** Buyer / Inventory Controller
- **Trigger Rule:** `0 < currentStock <= reorderPoint`.
- **Notification Text:** *"Low Stock Warning: [Item Name] stock ([Current]) has fallen below reorder level ([Reorder])."*
- **Standard Operating Procedure (Action Required):**
  1. Verify if replenishment shipment is already in transit.
  2. If not in transit, create purchase order up to MaxStock capacity.

---

### 3.5 Budgets & Financial Envelopes

#### Alert BGT-01: Budget Envelope Over-Budget (100%+)
- **Severity:** Critical (Alert / Red)
- **Target Role:** Department Head / Finance Director
- **Trigger Rule:** `(committedAmount + spentAmount) >= totalAmount`.
- **Notification Text:** *"Budget Exceeded: Envelope '[Budget Name]' is at [Util%]% utilization."*
- **Standard Operating Procedure (Action Required):**
  1. Freeze new PO requisitions under this department/project envelope.
  2. Submit budget transfer request from surplus categories.

#### Alert BGT-02: Budget Utilization Warning (>80%)
- **Severity:** Warning (Amber)
- **Target Role:** Department Manager
- **Trigger Rule:** `80% <= Utilization < 100%`.
- **Notification Text:** *"Budget Alert: Envelope '[Budget Name]' has reached [Util%]% of allocated funds."*
- **Standard Operating Procedure (Action Required):**
  1. Audit upcoming procurement requisitions.
  2. Prioritize mission-critical spend for the remaining fiscal period.

---

### 3.6 Contracts & Framework Agreements

#### Alert CON-01: Contract Expiring Soon (Renewal Window)
- **Severity:** Warning (Amber)
- **Target Role:** Procurement Lead / Legal Counsel
- **Trigger Rule:** Days until `endDate <= renewalWindowDays` (e.g., within 30 or 60 days).
- **Notification Text:** *"Contract '[Title]' with [Supplier] expires in [X] days ([EndDate])."*
- **Standard Operating Procedure (Action Required):**
  1. Evaluate supplier annual performance scorecard.
  2. Initiate extension addendum or publish tender for new framework agreement.

#### Alert CON-02: Blanket PO Ceiling Warning (>85% Consumed)
- **Severity:** Warning (Amber)
- **Target Role:** Buyer / Operations Lead
- **Trigger Rule:** `consumedAmount / totalCeiling >= 0.85`.
- **Notification Text:** *"Blanket PO #[ID] ([Supplier]) has consumed [Util%]% of its $[Ceiling] ceiling."*
- **Standard Operating Procedure (Action Required):**
  1. Issue contract amendment to raise ceiling limit, or issue replacement Blanket agreement.

---

### 3.7 Suppliers, Onboarding & Compliance

#### Alert SUP-01: New Vendor Registration Pending Approval
- **Severity:** Critical (Alert / Red)
- **Target Role:** Procurement Manager
- **Trigger Rule:** Vendor completes public onboarding registration form.
- **Notification Text:** *"New Vendor Registration: '[Supplier Name]' submitted onboarding request."*
- **Standard Operating Procedure (Action Required):**
  1. Open supplier profile -> Audit trade license, VAT certificate, audited financials, and reference projects.
  2. Click **[Approve Supplier]** (creates vendor portal credentials) or **[Reject Registration]**.

#### Alert SUP-02: Compliance Document Expired / Expiring
- **Severity:** Critical (Alert / Red) or Warning (Amber)
- **Target Role:** Compliance Officer / Buyer
- **Trigger Rule:** Trade License, ISO Certificate, or Insurance reaches or nears expiry date (<30 days).
- **Notification Text:** *"Compliance Alert: '[Doc Title]' for [Supplier] EXPIRED on [Date]."*
- **Standard Operating Procedure (Action Required):**
  1. Restrict issuance of new POs to supplier.
  2. Request updated certificate upload via Supplier Self-Service Portal.

---

### 3.8 Tendering, RFQs & Quotations

#### Alert RFQ-01: New Quotation / Bid Received
- **Severity:** Info (Blue)
- **Target Role:** Procurement Engineer / Buyer
- **Trigger Rule:** Invited vendor submits commercial & technical quotation in portal.
- **Notification Text:** *"[Supplier] submitted a quotation of $[Amount] for RFQ #[ID]."*
- **Standard Operating Procedure (Action Required):**
  1. Open Quotations page -> Complete technical and commercial evaluation matrix.
  2. Submit scores for management review.

#### Alert RFQ-02: RFQ Evaluation Completed (Ready to Award)
- **Severity:** Critical (Alert / Red)
- **Target Role:** Procurement Manager
- **Trigger Rule:** Evaluator completes technical/commercial scoring.
- **Notification Text:** *"Evaluation completed for [Supplier]'s quote on RFQ #[ID] (Score: [Score]/100)."*
- **Standard Operating Procedure (Action Required):**
  1. Review final weighted scoring and pricing variance against benchmark.
  2. Click **[Award RFQ]** to convert winning quote into an official Purchase Order.

---

### 3.9 Finance & Equipment Maintenance

#### Alert FIN-01: Payment Record Approval Required
- **Severity:** Critical (Alert / Red)
- **Target Role:** Finance Manager
- **Trigger Rule:** Finance officer logs a payment record with status `Pending Approval`.
- **Notification Text:** *"Payment of $[Amount] for PO #PO-XXXX recorded by [User] requires approval."*
- **Standard Operating Procedure (Action Required):**
  1. Verify bank transaction reference and receipt attachment.
  2. Click **[Approve Payment]**.

#### Alert AST-01: Asset Maintenance Service Due
- **Severity:** Info (Blue)
- **Target Role:** Maintenance Engineer
- **Trigger Rule:** Scheduled maintenance plan date reached.
- **Notification Text:** *"Scheduled maintenance due for asset '[Asset Name]' ([Location])."*
- **Standard Operating Procedure (Action Required):**
  1. Execute maintenance routine.
  2. Open Asset profile -> Click **[Log Maintenance]** with activity notes and cost.

---

## 4. Role Responsibility Matrix

| User Role | Monitored Alerts | Key Daily Action Items |
|---|---|---|
| **Procurement Manager** | PO Approvals, Vendor Registrations, GRN Approvals, RFQ Awards, Budget Overruns | Authorize purchase orders, approve new suppliers, approve GRNs, award bids. |
| **Procurement Engineer / Buyer** | Low Stock, PO Overdue, Quote Evaluations, Shipment Tracking, Amendments | Issue POs, expedite delinquent deliveries, score supplier bids, reorder inventory. |
| **Finance Officer / Manager** | 3-Way Match Variances, Payment Approvals, Due Payments, Early Cash Discounts | Resolve billing discrepancies, execute bank payments, capture early payment discounts. |
| **Warehouse / QA Lead** | Pending GRNs, Rejected Goods, Missing GRN Invoices, Asset Maintenance | Inspect shipments, log QC rejections, maintain plant equipment. |
| **Supplier (Self-Service)** | POs Awaiting Confirmation, RFQ Invitations, Rejected Deliveries, Invoice Status | Confirm POs, submit bids, track shipments, upload invoices, dispute rejections. |

---
*End of Specification — ProcureBuddy Enterprise Procurement KPI Platform*
