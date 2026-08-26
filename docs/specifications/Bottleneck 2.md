# Detailed Implementation Plan: Procurement Workflows, Finance Payments, & Inventory Fixes

This implementation plan addresses the specific issues outlined regarding Partial Deliveries (GRNs), Finance Payment calculations, and Inventory Consumption visibility.

## User Review Required

> [!WARNING]
> **Finance Payment Logic Change**
> Changing the Accounts Payable logic to depend on **Invoices** means Finance will not be able to issue payments against a PO unless an Invoice is recorded and matched (or at least submitted). I will update the logic to calculate `outstanding` as `Total Matched Invoice Amount - Amount Paid`. Please confirm this aligns with your desired workflow.

## Proposed Changes

### 1. Split Delivery & GRN Ledger
Currently, approving a GRN sets the PO to `Delivered` unconditionally. We will fix this by turning the PO into a ledger that tracks `deliveredQty`.

#### [MODIFY] `src/app/api/data/mutate/route.ts`
- **`APPROVE_GRN`**: Update the logic to increment `deliveredQty` on the PO line items based on the GRN's `acceptedQty`. 
- Calculate if `Total Delivered < Total Ordered`. If so, set PO `deliveryStatus` to `Partially Delivered`, otherwise set to `Delivered`.

#### [MODIFY] `src/components/GRNPage.tsx`
- Ensure the "New GRN Modal" calculates the *remaining* quantity when generating a GRN for a partially delivered PO, preventing users from receiving more than the remaining balance.

---

### 2. Finance Payment Approvals based on Invoices
Currently, the Finance page calculates the outstanding amount based on the *entire PO value*.

#### [MODIFY] `src/components/FinancePage.tsx`
- Import `invoices` from `useApp()`.
- For each PO, calculate `totalInvoicedAmount` by summing the `totalAmount` of all invoices that are matched/approved for that PO.
- Update the `outstanding` calculation in the `RecordPaymentModal` and the AP Table from `po.totalAmount - po.amountPaid` to `totalInvoicedAmount - po.amountPaid`.
- The "Pay" button will be disabled if `outstanding <= 0`.

---

### 3. Inventory Consumption Visibility
Currently, stock adjustments are tracked, but formal "Consumption" or "Issue" is not distinctly supported.

#### [MODIFY] `src/app/api/data/mutate/route.ts`
- Add a new mutation `CONSUME_STOCK` (or update `ADJUST_STOCK` to accept a `movementType`). It will decrement the `currentStock` and record a `StockMovement` with `movementType: 'Issue'`.

#### [MODIFY] `src/context/AppContext.tsx`
- Add the `consumeStock` method to the context so it can be called from the frontend.

#### [MODIFY] `src/components/InventoryPage.tsx`
- Update the `AdjustModal` to include an "Issue / Consume" action type, or add a dedicated "Consume Stock" modal.
- This will log a distinct `Issue` stock movement (with a red down-arrow icon) that reduces stock properly and makes consumption explicitly visible in the history panel.

## Verification Plan

### Automated / Logic Verification
- **Partial Delivery**: Submit a GRN for 5 out of 10 items. The PO status should change to `Partially Delivered`.
- **Finance Payment**: For a $10,000 PO, create a single $4,000 invoice. The Finance page should show the outstanding balance as $4,000 (not $10,000).
- **Inventory**: Consume 10 units of stock. The history panel should show a red `Issue` movement, and the stock level should drop by 10.

### Manual Verification
- Deploy and create a PO, generate a partial GRN, submit an Invoice for that partial GRN, and then try paying it from the Finance page to verify the numbers.
