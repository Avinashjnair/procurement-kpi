// ============================================================
// ProcureIQ — Unified Types & Interfaces
// ============================================================

// ── Auth / User Roles ────────────────────────────────────────

export type UserRole = 'manager' | 'engineer' | 'finance';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
    'view_assets', 'create_asset', 'edit_asset', 'log_maintenance',
    // Finance permissions (managers can also access)
    'view_payments', 'record_payment', 'upload_payment_receipt',
    'view_finance_reports', 'approve_payment',
  ],
  engineer: [
    'view_dashboard',
    'view_items',
    'view_suppliers',
    'view_pos', 'create_po',
    'view_rfqs', 'create_rfq',
    'view_quotations',
    'view_documents', 'upload_document',
    'view_inventory',
    'view_grn', 'create_grn',
    'view_assets', 'log_maintenance',
  ],
  finance: [
    'view_dashboard',
    // Finance core — full payment access
    'view_payments', 'record_payment', 'upload_payment_receipt',
    'view_finance_reports', 'approve_payment',
    // Read-only access to procurement context
    'view_pos',
    'view_suppliers',
    'view_documents', 'upload_document',
    'view_grn',
    'view_inventory',
    'view_assets',
    // Finance can also view quotations for cost context
    'view_quotations',
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

// ── Payment Records (Finance Module) ────────────────────────

export interface PaymentRecord {
  id: string;
  poId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  referenceNumber: string;        // bank/transaction reference
  paymentMethod: PaymentMethod;
  recordedBy: string;             // user id
  recordedByName: string;
  receiptFileName?: string;
  receiptFileSize?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  status: PaymentRecordStatus;
}

export type PaymentMethod = 'Bank Transfer' | 'Cheque' | 'Cash' | 'Letter of Credit' | 'Online Payment';
export type PaymentRecordStatus = 'Pending Approval' | 'Approved' | 'Rejected';

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
  isAsset?: boolean;
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
  paymentRecords?: PaymentRecord[];  // ← full payment ledger
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
  createdBy: string;
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
  price: number;
  paymentTerms: number;
  leadTime: number;
  pastHistory: number;
  serviceQuality: number;
  responsiveness: number;
  compliance: number;
  totalScore: number;
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
  reservedStock: number;
  reorderPoint: number;
  maxStock: number;
  location: string;
  lastUpdated: string;
  lastGRNId?: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  itemId: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number;
  referenceId: string;
  date: string;
  performedBy: string;
  notes?: string;
  balanceAfter: number;
}

// ── GRN ─────────────────────────────────────────────────────

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
  stockUpdated: boolean;
}

// ── Documents ────────────────────────────────────────────────

export type DocumentCategory =
  | 'MTC' | 'COO' | 'BL/AWB' | 'Delivery Note' | 'Packing List'
  | 'Invoice' | 'Internal Inspection Report'
  | 'Work Completion Certificate' | 'Service Report' | 'Timesheet' | 'SLA Report'
  | 'Payment Receipt';   // ← NEW: finance uploads

export interface AppDocument {
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

// ── Fixed Assets ─────────────────────────────────────────────

export interface MaintenanceRecord {
  id: string;
  date: string;
  activity: string;
  performedBy: string;
  cost: number;
  notes?: string;
}

export type AssetStatus = 'Active' | 'Under Maintenance' | 'Disposed' | 'Sold';

export interface Asset {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  purchaseDate: string;
  purchaseValue: number;
  salvageValue: number;
  depreciationRate: number;
  usefulLife: number;
  location: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  warrantyDetails?: string;
  maintenancePlan: string;
  maintenanceHistory: MaintenanceRecord[];
  status: AssetStatus;
  description?: string;
  poId?: string;
}

// ── Budgets ──────────────────────────────────────────────────

export interface BudgetEnvelope {
  id: string;
  name: string;
  department: string;
  project?: string;
  period: string; // e.g., "2026", "2026-Q1"
  totalAmount: number;
  committedAmount: number; // approved POs
  spentAmount: number;      // paid POs
  currency: string;
  status: 'Active' | 'Closed' | 'Over-budget';
}

// ── Contracts & Blanket POs ───────────────────────────────────

export interface Contract {
  id: string;
  title: string;
  supplierId: string;
  supplierName: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  currency: string;
  status: 'Draft' | 'Active' | 'Expiring' | 'Expired' | 'Terminated';
  renewalWindowDays: number;
  linkedPoIds: string[];
  docId?: string;
}

export type BlanketStatus = 'Draft' | 'Active' | 'Expired' | 'Closed';

export interface BlanketPO {
  id: string;
  supplierId: string;
  supplierName: string;
  totalCeiling: number;
  consumedAmount: number;
  validFrom: string;
  validTo: string;
  currency: string;
  status: BlanketStatus;
  releaseOrderIds: string[];
  category?: ItemCategory;
  department?: string;
  project?: string;
}

// ── Invoices & Matching ──────────────────────────────────────

export type InvoiceStatus = 'Pending' | 'Matched' | 'Variance' | 'Paid' | 'Cancelled';
export type MatchStatus = 'Full Match' | 'Variance' | 'Missing GRN' | 'Missing PO' | 'Pending';

export interface InvoiceLineItem {
  poLineIndex: number;
  itemId: string;
  itemName: string;
  billedQty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
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
}

// ── Audit Trail ──────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  entityType: 'PO' | 'Supplier' | 'Item' | 'Budget' | 'Contract' | 'GRN' | 'Invoice';
  entityId: string;
  action: 'Create' | 'Update' | 'Delete' | 'Approve' | 'Reject' | 'Cancel' | 'StatusChange' | 'Payment';
  changeSet?: {
    field: string;
    before: any;
    after: any;
  }[];
  description?: string;
}

// ── Purchase Order Conversions ────────────────────────────────

export interface ApprovalStep {
  role: UserRole;
  userId?: string;
  userName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp?: string;
  comments?: string;
}

export interface PurchaseOrder {
  id: string;
  dateOfIssue: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  totalAmount: number;
  totalAmountBase: number;         // AED conversion
  currency: string;                // USD, EUR, etc.
  fxRate: number;                  // at time of PO
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
  paymentRecords?: PaymentRecord[];
  
  // Next Sprint extensions
  budgetId?: string;               // Link to budget envelope
  approvalSteps: ApprovalStep[];   // Multi-tier approval path
  currentApprovalStep: number;     // Index of steps
  matchStatus?: MatchStatus;       // Result of 3-way match
  savingsAmount?: number;          // (Benchmark - Actual) * Qty
  contractId?: string;             // Linked contract
  blanketPoId?: string;            // Link to framework agreement (Release Order)
}

// ── Notifications ────────────────────────────────────────────

export type NotificationType = 'alert' | 'success' | 'info' | 'warning';
export type NotificationSource = 'PO' | 'Payment' | 'Document' | 'Budget' | 'Contract' | 'GRN';

export interface AppNotification {
  id: string;
  type: NotificationType;
  source: NotificationSource;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  entityId: string;
  entityType: string;
}

export interface NotificationRule {
  id: string;
  eventType: string;
  enabled: boolean;
  threshold?: number;
  channels: ('in-app' | 'email')[];
}
