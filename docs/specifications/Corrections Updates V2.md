# Corrections & Updates V2

**Project:** ProcureBuddy (Procurement Services — UAT Priority Fixes)  
**Date:** 2026-08-22  

---

## 1. Tender/RFQ Scope of Supply — Descriptions & Quick Add Item

* **Problem:** There was no option to write custom descriptions under each item line in the Scope of Supply during RFQ creation. Additionally, adding new catalogue items required exiting the RFQ wizard entirely.
* **Change:**
  * Added a secondary text description input under each item row inside the RFQ Scope of Supply creation table.
  * Integrated a `+ Quick Add New Item...` link inline within the item dropdown. Clicking it opens the Item Catalogue Creation modal, allowing new items to be added dynamically without losing progress.
* **Files Changed:**
  * `src/components/RFQPage.tsx`

---

## 2. Item Creation — Custom Category Support

* **Problem:** Users were restricted to selecting pre-configured categories from a static dropdown in the New Item creation modal.
* **Change:**
  * Added a `+ Add Custom Category...` option to the category selection dropdown.
  * Selecting this option dynamically swaps the static select field with a free-text input field, allowing users to enter custom categories on the fly.
* **Files Changed:**
  * `src/components/Modals.tsx`

---

## 3. Item, PO, and GRN Edit & Delete Operations

* **Problem:** There was no user interface to edit or delete existing catalogue items, PO metadata, or GRNs. An audit history of changes was also missing.
* **Change:**
  * Added backend database mutations: `DELETE_ITEM`, `UPDATE_PO`, `DELETE_PO`, `UPDATE_GRN`, and `DELETE_GRN`.
  * Added frontend edit forms and delete buttons to `ItemDetail`, `PODetail`, and `GRNDetail`.
  * Integrated the dynamic `Audit Trail & History` timeline component at the bottom of the Item, PO, and GRN detail views, rendering chronological actions from the `AuditLogEntry` table.
* **Files Changed:**
  * `src/app/api/data/mutate/route.ts`
  * `src/context/AppContext.tsx`
  * `src/components/ItemsPage.tsx`
  * `src/components/PurchaseOrdersPage.tsx`
  * `src/components/GRNPage.tsx`

---

## 4. GRN PO Reference Dropdown Display

* **Problem:** When trying to raise a GRN, the Purchase Order reference dropdown was empty or did not reflect active POs.
* **Change:**
  * Refactored the eligible PO search filter to be case-insensitive and support all active statuses (`approved`, `shipped`, `pending`, `delivered`). This ensures POs matching various case structures or in transitional states are populated correctly.
* **Files Changed:**
  * `src/components/GRNPage.tsx`

---

## 5. Blanket PO Agreement Description

* **Problem:** Creating a Blanket PO did not allow entering detailed terms or descriptions.
* **Change:**
  * Added a `description` field to the `BlanketPO` database schema and interface model.
  * Added a description textarea to `AddBlanketModal` to capture detailed agreement terms.
  * Rendered the saved agreement description text inside the "Agreement Details" card.
* **Files Changed:**
  * `prisma/schema.prisma`
  * `src/types/index.ts`
  * `src/components/Modals.tsx`
  * `src/components/BlanketsPage.tsx`

---

## 6. Contract Linkage with Blanket POs & Detailed Text

* **Problem:** The Contract Management module was basic and lacked linking capabilities to Blanket PO agreements or capturing detailed contract descriptions.
* **Change:**
  * Added `linkedBlanketPoId` and `description` fields to the `Contract` database schema and interface model.
  * Updated the Contract registration form to support linking with a Blanket PO and writing detailed terms.
  * Rendered the Blanket PO reference and description text block directly inside the contract cards list view.
* **Files Changed:**
  * `prisma/schema.prisma`
  * `src/types/index.ts`
  * `src/components/ContractsPage.tsx`

---

## 7. Light Mode Colors Contrast Fix

* **Problem:** In Light Mode, some tables (specifically the Invoices list table) rendered hardcoded light gray text on a white background, making table cells unreadable.
* **Change:**
  * Appended global overrides to the Light Mode stylesheet to target hardcoded light text styles (`#f1f5f9` / `rgb(241, 245, 249)`). Text is forced to `var(--text-primary)` (dark slate) when the Light Mode theme is active, ensuring complete contrast.
* **Files Changed:**
  * `src/app/light-mode.css`
