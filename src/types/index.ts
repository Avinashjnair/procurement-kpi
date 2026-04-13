// ============================================================
// ProcureIQ — Unified Types & Interfaces
// ============================================================

// ── Auth / User Roles ────────────────────────────────────────

export type UserRole = 'manager' | 'engineer';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;   // stored as plain text for demo (no real auth)
  role: UserRole;
  department: string;
  avatarInitials: string;
  active: boolean;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

// Role permissions map
export const PERMISSIONS: Record<UserRole, string[]> = {
  manager: [
    'view_dashboard',
    'view_items', 'create_item', 'edit_item', 'archive_item',
    'view_suppliers', 'create_supplier', 'edit_supplier',
    'view_pos', 'create_po', 'edit_po', 'approve_po', 'reject_po', 'cancel_po', 'duplicate_po',
    'view_rfqs', 'create_rfq', 'edit_rfq', 'close_rfq',
    'view_quotations', 'evaluate_quotation', 'award_quotation',
    'view_documents', 'upload_document',
    'view_inventory', 'adjust_inventory',
    'view_grn', 'create_grn', 'approve_grn',
  ],
  engineer: [
    'view_dashboard',
    'view_items',
    'view_suppliers',
    'view_pos', 'create_po',             // can create but NOT approve/reject
    'view_rfqs', 'create_rfq',
    'view_quotations',                    // view only, no award
    'view_documents', 'upload_document',
    'view_inventory',
    'view_grn', 'create_grn',             // can raise GRN but not approve
  ],
};

export function can(user: User | null, permission: string): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].includes(permission);
}

// ── Master Data ──────────────────────────────────────────────

export interface SupplierNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface SupplierKPIs {
  priceVariation: number;
  deliveryPerformance: number;
  paymentTerms: string;
  onTimePayment: number;
  responseTime: number;
  deliveryTerms: string;
  rejectionRate: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  taxRegNumber: string;
  kpis: SupplierKPIs;
  preferred?: boolean;
  notes?: SupplierNote[];
}

export type ItemCategory =
  | 'Piping' | 'Valves' | 'Fittings' | 'Chemicals'
  | 'Electrical' | 'Instrumentation' | 'Services';

export type ServiceBillingType = 'Fixed Price' | 'Hourly Rate' | 'Milestone Based' | 'Lump Sum';

export interface ServiceMilestone {
  id: string;
  description: string;
  percentage: number;
  dueDate: string;
  completed: boolean;
}

export interface ServiceDetails {
  billingType: ServiceBillingType;
  scopeOfWork: string;
  duration: string;
  slaTerms: string;
  milestones?: ServiceMilestone[];
}

export interface PricePoint {
  date: string;
  price: number;
  supplierId: string;
}

export interface PurchaseRecord {
  date: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  poId: string;
}

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  unit: string;
  currentPrice: number;
  linkedSupplierIds: string[];
  priceHistory: PricePoint[];
  purchaseHistory: PurchaseRecord[];
  serviceDetails?: ServiceDetails;
  archived?: boolean;
}

// ── Purchase Orders ──────────────────────────────────────────

export type POStatus = 'Draft' | 'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

export interface ServicePOLineDetails {
  billingType: ServiceBillingType;
  scopeOfWork: string;
  duration: string;
  slaTerms: string;
  milestones?: ServiceMilestone[];
}

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  isService?: boolean;
  serviceDetails?: ServicePOLineDetails;
}

export interface PurchaseOrder {
  id: string;
  dateOfIssue: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  totalAmount: number;
  paymentTerms: string;
  amountPaid: number;
  dateOfPayment: string | null;
  dueDate: string;
  deliveryStatus: POStatus;
  paymentStatus: PaymentStatus;
  eta: string;
  incoterms: string;
  remarks?: string;
  projectReference?: string;
  requestNumber?: string;
  approvalAuthority?: string;
  cancellationReason?: string;
  revisionNumber?: number;
  approvedBy?: string;
  approvedAt?: string;
}

// ── RFQ ─────────────────────────────────────────────────────

export type RFQStatus = 'Draft' | 'Sent' | 'Closed' | 'Awarded' | 'Cancelled';

export interface RFQLineItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface RFQ {
  id: string;
  title: string;
  status: RFQStatus;
  createdBy: string;         // user id
  createdByName: string;
  dateCreated: string;
  dateSent: string | null;
  deadlineDate: string;
  projectReference?: string;
  notes?: string;
  lineItems: RFQLineItem[];
  invitedSupplierIds: string[];
  awardedQuotationId?: string;
  awardedSupplierId?: string;
  awardedSupplierName?: string;
}

// ── Quotations ───────────────────────────────────────────────

export type QuotationStatus = 'Pending' | 'Received' | 'Evaluated' | 'Awarded' | 'Rejected';

export interface QuotationLineItem {
  rfqLineItemId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  leadTimeDays: number;
  notes?: string;
}

export interface QuotationEvaluation {
  price: number;          // 0–10
  paymentTerms: number;   // 0–10
  leadTime: number;       // 0–10
  pastHistory: number;    // 0–10
  serviceQuality: number; // 0–10
  responsiveness: number; // 0–10
  compliance: number;     // 0–10
  totalScore: number;     // weighted average (auto-calculated)
  evaluatedBy: string;
  evaluatedAt: string;
  recommendation?: string;
}

export interface Quotation {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  status: QuotationStatus;
  dateReceived: string | null;
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  currency: string;
  totalAmount: number;
  lineItems: QuotationLineItem[];
  evaluation?: QuotationEvaluation;
  notes?: string;
}

// Weights for total score calculation (must sum to 1)
export const EVAL_WEIGHTS = {
  price:          0.30,
  leadTime:       0.20,
  pastHistory:    0.15,
  paymentTerms:   0.12,
  serviceQuality: 0.12,
  responsiveness: 0.06,
  compliance:     0.05,
};

export function calcEvalScore(e: Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt'>): number {
  return Math.round((
    e.price          * EVAL_WEIGHTS.price          +
    e.leadTime       * EVAL_WEIGHTS.leadTime        +
    e.pastHistory    * EVAL_WEIGHTS.pastHistory     +
    e.paymentTerms   * EVAL_WEIGHTS.paymentTerms    +
    e.serviceQuality * EVAL_WEIGHTS.serviceQuality  +
    e.responsiveness * EVAL_WEIGHTS.responsiveness  +
    e.compliance     * EVAL_WEIGHTS.compliance
  ) * 10) / 10;
}

// ── Inventory ────────────────────────────────────────────────

export type StockMovementType = 'GRN' | 'Adjustment' | 'Issue' | 'Return';

export interface StockItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  currentStock: number;
  reservedStock: number;    // committed to POs / projects
  reorderPoint: number;
  maxStock: number;
  location: string;         // warehouse bin / shelf
  lastUpdated: string;
  lastGRNId?: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  itemId: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number;           // positive = in, negative = out
  referenceId: string;        // GRN id or PO id or adjustment id
  date: string;
  performedBy: string;
  notes?: string;
  balanceAfter: number;
}

// ── Goods Receipt Note ───────────────────────────────────────

export type GRNStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Partial';

export interface GRNLineItem {
  poLineIndex: number;
  itemId: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitPrice: number;
  rejectionReason?: string;
}

export interface GRN {
  id: string;
  poId: string;
  supplierId: string;
  supplierName: string;
  status: GRNStatus;
  dateCreated: string;
  dateApproved: string | null;
  createdBy: string;
  approvedBy: string | null;
  deliveryNoteNumber?: string;
  vehicleNumber?: string;
  notes?: string;
  lineItems: GRNLineItem[];
  totalAccepted: number;
  totalRejected: number;
  stockUpdated: boolean;   // true once inventory has been incremented
}

// ── Documents ────────────────────────────────────────────────

export type DocumentCategory =
  | 'MTC' | 'COO' | 'BL/AWB' | 'Delivery Note' | 'Packing List'
  | 'Invoice' | 'Internal Inspection Report'
  | 'Work Completion Certificate' | 'Service Report' | 'Timesheet' | 'SLA Report';

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  poId: string;
  itemId: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
  expiryDate?: string;
  version?: number;
  supersededBy?: string;
}
