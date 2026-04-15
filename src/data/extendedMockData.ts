// ============================================================
// ProcureIQ v2 — Extended Mock Data
// ============================================================
import type {
  User, RFQ, Quotation, StockItem, StockMovement, GRN, Asset,
} from '@/types';

// ── Users ────────────────────────────────────────────────────

export const users: User[] = [
  {
    id: 'USR-001', name: 'Aisha Al-Mansoori', email: 'aisha@procureiq.ae',
    passwordHash: 'manager123', role: 'manager',
    department: 'Procurement Management', avatarInitials: 'AA', active: true,
  },
  {
    id: 'USR-002', name: 'Mohammed Al-Farsi', email: 'mfarsi@procureiq.ae',
    passwordHash: 'manager123', role: 'manager',
    department: 'Supply Chain', avatarInitials: 'MF', active: true,
  },
  {
    id: 'USR-003', name: 'James Okafor', email: 'james@procureiq.ae',
    passwordHash: 'engineer123', role: 'engineer',
    department: 'Mechanical Engineering', avatarInitials: 'JO', active: true,
  },
  {
    id: 'USR-004', name: 'Priya Nair', email: 'priya@procureiq.ae',
    passwordHash: 'engineer123', role: 'engineer',
    department: 'Process Engineering', avatarInitials: 'PN', active: true,
  },
  {
    id: 'USR-005', name: 'Carlos Reyes', email: 'carlos@procureiq.ae',
    passwordHash: 'engineer123', role: 'engineer',
    department: 'Electrical Engineering', avatarInitials: 'CR', active: true,
  },
  // ── Finance & Accounts ──────────────────────────────────────
  {
    id: 'USR-006', name: 'Fatima Al-Zaabi', email: 'fatima@procureiq.ae',
    passwordHash: 'finance123', role: 'finance',
    department: 'Finance & Accounts', avatarInitials: 'FZ', active: true,
  },
  {
    id: 'USR-007', name: 'Rohan Mehta', email: 'rohan@procureiq.ae',
    passwordHash: 'finance123', role: 'finance',
    department: 'Finance & Accounts', avatarInitials: 'RM', active: true,
  },
];

// ── RFQs ─────────────────────────────────────────────────────

export const rfqs: RFQ[] = [
  {
    id: 'RFQ-001',
    title: 'Carbon Steel Pipes & Fittings — Phase 3',
    status: 'Awarded',
    createdBy: 'USR-003', createdByName: 'James Okafor',
    dateCreated: '2026-03-01', dateSent: '2026-03-02',
    deadlineDate: '2026-03-15',
    projectReference: 'PRJ-2026-0012',
    notes: 'Urgent requirement for Phase 3 pipeline. ASME B31.3 compliance mandatory.',
    lineItems: [
      { id: 'RLI-001', itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', description: 'A106 Grade B, Schedule 40, 6"', quantity: 500, unit: 'meter', category: 'Piping' },
      { id: 'RLI-002', itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', description: '316L weld neck flange, 300 LB', quantity: 80, unit: 'piece', category: 'Fittings' },
    ],
    invitedSupplierIds: ['SUP-001', 'SUP-002', 'SUP-005'],
    awardedQuotationId: 'QUO-001',
    awardedSupplierId: 'SUP-001',
    awardedSupplierName: 'SteelMax Industries',
  },
  {
    id: 'RFQ-002',
    title: 'Gate & Ball Valves — Instrument Air System',
    status: 'Closed',
    createdBy: 'USR-003', createdByName: 'James Okafor',
    dateCreated: '2026-03-10', dateSent: '2026-03-11',
    deadlineDate: '2026-03-25',
    notes: 'API 600 compliance required. Prefer preferred vendor list.',
    lineItems: [
      { id: 'RLI-003', itemId: 'ITM-002', itemName: 'Gate Valve (4")', description: 'API 600, 150 LB, flanged', quantity: 30, unit: 'piece', category: 'Valves' },
      { id: 'RLI-004', itemId: 'ITM-006', itemName: 'Ball Valve (2")', description: 'Full bore, 1000 WOG, threaded', quantity: 150, unit: 'piece', category: 'Valves' },
    ],
    invitedSupplierIds: ['SUP-001', 'SUP-006'],
  },
  {
    id: 'RFQ-003',
    title: 'Caustic Soda — Q2 2026 Requirement',
    status: 'Sent',
    createdBy: 'USR-004', createdByName: 'Priya Nair',
    dateCreated: '2026-04-01', dateSent: '2026-04-02',
    deadlineDate: '2026-04-20',
    projectReference: 'PRJ-2026-CHEM',
    lineItems: [
      { id: 'RLI-005', itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)', description: '50% concentration, industrial grade', quantity: 60, unit: 'ton', category: 'Chemicals' },
    ],
    invitedSupplierIds: ['SUP-003', 'SUP-004'],
  },
  {
    id: 'RFQ-004',
    title: 'HDPE Pipe Supply — Water Treatment Extension',
    status: 'Draft',
    createdBy: 'USR-005', createdByName: 'Carlos Reyes',
    dateCreated: '2026-04-10', dateSent: null,
    deadlineDate: '2026-04-30',
    lineItems: [
      { id: 'RLI-006', itemId: 'ITM-005', itemName: 'HDPE Pipe (12")', description: 'SDR 11, PE100, 12"', quantity: 2000, unit: 'meter', category: 'Piping' },
    ],
    invitedSupplierIds: ['SUP-002'],
  },
];

// ── Quotations ───────────────────────────────────────────────

export const quotations: Quotation[] = [
  {
    id: 'QUO-001', rfqId: 'RFQ-001', supplierId: 'SUP-001', supplierName: 'SteelMax Industries',
    status: 'Awarded', dateReceived: '2026-03-10', validUntil: '2026-04-10',
    paymentTerms: 'Net 30', deliveryTerms: 'CIF', currency: 'USD',
    totalAmount: 58350,
    lineItems: [
      { rfqLineItemId: 'RLI-001', itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 500, unit: 'meter', unitPrice: 85.50, totalPrice: 42750, leadTimeDays: 21 },
      { rfqLineItemId: 'RLI-002', itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', quantity: 80, unit: 'piece', unitPrice: 195.00, totalPrice: 15600, leadTimeDays: 14 },
    ],
    evaluation: { price: 8, paymentTerms: 8, leadTime: 8, pastHistory: 9, serviceQuality: 9, responsiveness: 8, compliance: 9, totalScore: 8.4, evaluatedBy: 'USR-001', evaluatedAt: '2026-03-16', recommendation: 'Best overall package. Strong past performance and compliance record. Recommended for award.' },
    notes: 'Preferred vendor. ASME certification attached.',
  },
  {
    id: 'QUO-002', rfqId: 'RFQ-001', supplierId: 'SUP-002', supplierName: 'GlobalPipe Solutions',
    status: 'Rejected', dateReceived: '2026-03-12', validUntil: '2026-04-12',
    paymentTerms: 'Net 45', deliveryTerms: 'FOB', currency: 'USD',
    totalAmount: 55200,
    lineItems: [
      { rfqLineItemId: 'RLI-001', itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 500, unit: 'meter', unitPrice: 82.00, totalPrice: 41000, leadTimeDays: 35 },
      { rfqLineItemId: 'RLI-002', itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', quantity: 80, unit: 'piece', unitPrice: 177.50, totalPrice: 14200, leadTimeDays: 28 },
    ],
    evaluation: { price: 9, paymentTerms: 6, leadTime: 4, pastHistory: 6, serviceQuality: 6, responsiveness: 5, compliance: 7, totalScore: 6.9, evaluatedBy: 'USR-001', evaluatedAt: '2026-03-16', recommendation: 'Cheaper but long lead times and below-average past delivery performance disqualify for this urgent requirement.' },
  },
  {
    id: 'QUO-003', rfqId: 'RFQ-001', supplierId: 'SUP-005', supplierName: 'AmeriSteel Corp',
    status: 'Evaluated', dateReceived: '2026-03-11', validUntil: '2026-04-11',
    paymentTerms: 'Net 30', deliveryTerms: 'FCA', currency: 'USD',
    totalAmount: 61200,
    lineItems: [
      { rfqLineItemId: 'RLI-001', itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 500, unit: 'meter', unitPrice: 88.00, totalPrice: 44000, leadTimeDays: 18 },
      { rfqLineItemId: 'RLI-002', itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', quantity: 80, unit: 'piece', unitPrice: 215.00, totalPrice: 17200, leadTimeDays: 21 },
    ],
    evaluation: { price: 6, paymentTerms: 8, leadTime: 9, pastHistory: 8, serviceQuality: 8, responsiveness: 8, compliance: 8, totalScore: 7.5, evaluatedBy: 'USR-001', evaluatedAt: '2026-03-16', recommendation: 'Good lead time and service quality. Pricing is higher than SteelMax.' },
  },
  {
    id: 'QUO-004', rfqId: 'RFQ-002', supplierId: 'SUP-001', supplierName: 'SteelMax Industries',
    status: 'Received', dateReceived: '2026-03-22', validUntil: '2026-04-22',
    paymentTerms: 'Net 30', deliveryTerms: 'CIF', currency: 'USD',
    totalAmount: 16350,
    lineItems: [
      { rfqLineItemId: 'RLI-003', itemId: 'ITM-002', itemName: 'Gate Valve (4")', quantity: 30, unit: 'piece', unitPrice: 310.00, totalPrice: 9300, leadTimeDays: 25 },
      { rfqLineItemId: 'RLI-004', itemId: 'ITM-006', itemName: 'Ball Valve (2")', quantity: 150, unit: 'piece', unitPrice: 47.00, totalPrice: 7050, leadTimeDays: 14 },
    ],
  },
  {
    id: 'QUO-005', rfqId: 'RFQ-002', supplierId: 'SUP-006', supplierName: 'NipponValve Ltd.',
    status: 'Received', dateReceived: '2026-03-21', validUntil: '2026-04-21',
    paymentTerms: 'Net 45', deliveryTerms: 'DAP', currency: 'USD',
    totalAmount: 15600,
    lineItems: [
      { rfqLineItemId: 'RLI-003', itemId: 'ITM-002', itemName: 'Gate Valve (4")', quantity: 30, unit: 'piece', unitPrice: 310.00, totalPrice: 9300, leadTimeDays: 20 },
      { rfqLineItemId: 'RLI-004', itemId: 'ITM-006', itemName: 'Ball Valve (2")', quantity: 150, unit: 'piece', unitPrice: 42.00, totalPrice: 6300, leadTimeDays: 18 },
    ],
  },
];

// ── Stock / Inventory ─────────────────────────────────────────

export const stockItems: StockItem[] = [
  { id: 'STK-001', itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")',        category: 'Piping',    unit: 'meter',  currentStock: 320,  reservedStock: 80,  reorderPoint: 200,  maxStock: 800,  location: 'WH-A / Bay 1',  lastUpdated: '2026-04-05', lastGRNId: 'GRN-001' },
  { id: 'STK-002', itemId: 'ITM-002', itemName: 'Gate Valve (4")',               category: 'Valves',    unit: 'piece',  currentStock: 45,   reservedStock: 20,  reorderPoint: 20,   maxStock: 100,  location: 'WH-B / Rack 3',  lastUpdated: '2026-04-01', lastGRNId: 'GRN-002' },
  { id: 'STK-003', itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)',       category: 'Chemicals', unit: 'ton',    currentStock: 12,   reservedStock: 5,   reorderPoint: 15,   maxStock: 50,   location: 'WH-C / Hazmat',  lastUpdated: '2026-03-28', lastGRNId: 'GRN-003' },
  { id: 'STK-004', itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")',   category: 'Fittings',  unit: 'piece',  currentStock: 88,   reservedStock: 30,  reorderPoint: 40,   maxStock: 200,  location: 'WH-B / Rack 7',  lastUpdated: '2026-03-18', lastGRNId: 'GRN-002' },
  { id: 'STK-005', itemId: 'ITM-005', itemName: 'HDPE Pipe (12")',               category: 'Piping',    unit: 'meter',  currentStock: 450,  reservedStock: 200, reorderPoint: 300,  maxStock: 1500, location: 'WH-A / Bay 4',  lastUpdated: '2026-04-08', lastGRNId: 'GRN-004' },
  { id: 'STK-006', itemId: 'ITM-006', itemName: 'Ball Valve (2")',               category: 'Valves',    unit: 'piece',  currentStock: 165,  reservedStock: 50,  reorderPoint: 80,   maxStock: 400,  location: 'WH-B / Rack 4',  lastUpdated: '2026-04-01', lastGRNId: 'GRN-002' },
];

export const stockMovements: StockMovement[] = [
  { id: 'MOV-001', stockItemId: 'STK-001', itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")',      movementType: 'GRN',        quantity: 500,  referenceId: 'GRN-001', date: '2026-04-05', performedBy: 'USR-001', balanceAfter: 500,  notes: 'GRN against PO-001' },
  { id: 'MOV-002', stockItemId: 'STK-001', itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")',      movementType: 'Issue',       quantity: -180, referenceId: 'PRJ-2026-0012', date: '2026-04-07', performedBy: 'USR-003', balanceAfter: 320, notes: 'Issued to Phase 3 pipeline' },
  { id: 'MOV-003', stockItemId: 'STK-002', itemId: 'ITM-002', itemName: 'Gate Valve (4")',             movementType: 'GRN',        quantity: 45,   referenceId: 'GRN-002', date: '2026-04-01', performedBy: 'USR-001', balanceAfter: 45 },
  { id: 'MOV-004', stockItemId: 'STK-003', itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)',     movementType: 'GRN',        quantity: 25,   referenceId: 'GRN-003', date: '2026-03-28', performedBy: 'USR-001', balanceAfter: 25 },
  { id: 'MOV-005', stockItemId: 'STK-003', itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)',     movementType: 'Issue',       quantity: -13,  referenceId: 'PRJ-2026-CHEM', date: '2026-04-02', performedBy: 'USR-004', balanceAfter: 12 },
  { id: 'MOV-006', stockItemId: 'STK-004', itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', movementType: 'GRN',        quantity: 100,  referenceId: 'GRN-002', date: '2026-03-18', performedBy: 'USR-001', balanceAfter: 100 },
  { id: 'MOV-007', stockItemId: 'STK-004', itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', movementType: 'Adjustment',  quantity: -12,  referenceId: 'ADJ-001', date: '2026-03-25', performedBy: 'USR-001', balanceAfter: 88, notes: 'Physical count adjustment' },
  { id: 'MOV-008', stockItemId: 'STK-005', itemId: 'ITM-005', itemName: 'HDPE Pipe (12")',             movementType: 'GRN',        quantity: 650,  referenceId: 'GRN-004', date: '2026-04-08', performedBy: 'USR-001', balanceAfter: 650 },
  { id: 'MOV-009', stockItemId: 'STK-005', itemId: 'ITM-005', itemName: 'HDPE Pipe (12")',             movementType: 'Issue',       quantity: -200, referenceId: 'PRJ-2026-WATER', date: '2026-04-09', performedBy: 'USR-003', balanceAfter: 450 },
  { id: 'MOV-010', stockItemId: 'STK-006', itemId: 'ITM-006', itemName: 'Ball Valve (2")',             movementType: 'GRN',        quantity: 200,  referenceId: 'GRN-002', date: '2026-04-01', performedBy: 'USR-001', balanceAfter: 200 },
  { id: 'MOV-011', stockItemId: 'STK-006', itemId: 'ITM-006', itemName: 'Ball Valve (2")',             movementType: 'Issue',       quantity: -35,  referenceId: 'PRJ-2026-IA', date: '2026-04-05', performedBy: 'USR-005', balanceAfter: 165 },
];

// ── GRNs ─────────────────────────────────────────────────────

export const grns: GRN[] = [
  {
    id: 'GRN-001', poId: 'PO-001', supplierId: 'SUP-001', supplierName: 'SteelMax Industries',
    status: 'Approved', dateCreated: '2026-04-04', dateApproved: '2026-04-05',
    createdBy: 'USR-003', approvedBy: 'USR-001',
    deliveryNoteNumber: 'DN-SM-20260404', vehicleNumber: 'DXB-T-12345',
    notes: 'All items received in good condition. MTC verified.',
    lineItems: [{ poLineIndex: 0, itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', orderedQty: 500, receivedQty: 500, acceptedQty: 500, rejectedQty: 0, unitPrice: 85.50 }],
    totalAccepted: 500, totalRejected: 0, stockUpdated: true,
  },
  {
    id: 'GRN-002', poId: 'PO-002', supplierId: 'SUP-006', supplierName: 'NipponValve Ltd.',
    status: 'Approved', dateCreated: '2026-03-31', dateApproved: '2026-04-01',
    createdBy: 'USR-003', approvedBy: 'USR-002',
    deliveryNoteNumber: 'DN-NV-20260331', vehicleNumber: 'SHJ-F-98765',
    notes: 'Partial rejection: 5 ball valves had thread damage. Supplier to replace.',
    lineItems: [
      { poLineIndex: 0, itemId: 'ITM-002', itemName: 'Gate Valve (4")', orderedQty: 20, receivedQty: 20, acceptedQty: 20, rejectedQty: 0, unitPrice: 320.00 },
      { poLineIndex: 1, itemId: 'ITM-006', itemName: 'Ball Valve (2")', orderedQty: 200, receivedQty: 200, acceptedQty: 195, rejectedQty: 5, unitPrice: 45.00, rejectionReason: 'Thread damage on 5 units' },
    ],
    totalAccepted: 215, totalRejected: 5, stockUpdated: true,
  },
  {
    id: 'GRN-003', poId: 'PO-003', supplierId: 'SUP-003', supplierName: 'EuroChem Supply Co.',
    status: 'Approved', dateCreated: '2026-03-28', dateApproved: '2026-03-28',
    createdBy: 'USR-004', approvedBy: 'USR-001',
    deliveryNoteNumber: 'DN-EC-20260328',
    lineItems: [{ poLineIndex: 0, itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)', orderedQty: 25, receivedQty: 25, acceptedQty: 25, rejectedQty: 0, unitPrice: 450.00 }],
    totalAccepted: 25, totalRejected: 0, stockUpdated: true,
  },
  {
    id: 'GRN-004', poId: 'PO-010', supplierId: 'SUP-002', supplierName: 'GlobalPipe Solutions',
    status: 'Approved', dateCreated: '2026-04-08', dateApproved: '2026-04-08',
    createdBy: 'USR-005', approvedBy: 'USR-002',
    deliveryNoteNumber: 'DN-GP-20260408', vehicleNumber: 'AJM-C-55432',
    lineItems: [{ poLineIndex: 0, itemId: 'ITM-005', itemName: 'HDPE Pipe (12")', orderedQty: 1000, receivedQty: 650, acceptedQty: 650, rejectedQty: 0, unitPrice: 62.00 }],
    totalAccepted: 650, totalRejected: 0, stockUpdated: true,
    notes: 'Partial shipment. Remaining 350 meters due 2026-04-20.',
  },
  {
    id: 'GRN-005', poId: 'PO-004', supplierId: 'SUP-001', supplierName: 'SteelMax Industries',
    status: 'Submitted', dateCreated: '2026-04-12', dateApproved: null,
    createdBy: 'USR-003', approvedBy: null,
    deliveryNoteNumber: 'DN-SM-20260412',
    lineItems: [{ poLineIndex: 0, itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', orderedQty: 100, receivedQty: 100, acceptedQty: 98, rejectedQty: 2, unitPrice: 192.00, rejectionReason: 'Dimensional non-conformance on 2 units' }],
    totalAccepted: 98, totalRejected: 2, stockUpdated: false,
  },
];

// ── Fixed Assets ─────────────────────────────────────────────

export const assetCategories: string[] = ['IT Infrastructure', 'Machinery', 'Vehicles', 'Office Furniture', 'HVAC & Facility'];

export const assets: Asset[] = [
  {
    id: 'AST-001',
    name: 'Industrial HVAC Unit — Tower A',
    category: 'HVAC & Facility',
    supplierId: 'SUP-002',
    poId: 'PO-010',
    purchaseDate: '2025-01-15',
    purchaseValue: 45000,
    salvageValue: 5000,
    depreciationRate: 0.15,
    usefulLife: 10,
    location: 'Tower A Roof',
    serialNumber: 'HVAC-2025-9981',
    warrantyExpiry: '2027-01-15',
    warrantyDetails: '2-year comprehensive parts and labor warranty.',
    maintenancePlan: 'Quarterly',
    status: 'Active',
    description: 'High-capacity cooling unit for main server room and lobby.',
    maintenanceHistory: [
      { id: 'MNT-001', date: '2025-04-15', activity: 'Quarterly Filter Replacement', performedBy: 'Internal Maintenance', cost: 150, notes: 'Filters were heavily clogged. Cleaned intake area.' },
      { id: 'MNT-002', date: '2025-07-20', activity: 'Coolant Level Check', performedBy: 'QuickService HVAC', cost: 450, notes: 'Minor leak detected and repaired.' },
      { id: 'MNT-003', date: '2025-10-15', activity: 'Standard Quarterly PM', performedBy: 'Internal Maintenance', cost: 150 },
      { id: 'MNT-004', date: '2026-01-20', activity: 'Annual System Audit', performedBy: 'External Audit Co', cost: 1200, notes: 'System efficiency at 92%.' },
    ],
  },
  {
    id: 'AST-002',
    name: 'Logistics Delivery Van',
    category: 'Vehicles',
    supplierId: 'SUP-005',
    poId: 'PO-005',
    purchaseDate: '2024-06-01',
    purchaseValue: 32000,
    salvageValue: 4000,
    depreciationRate: 0.25,
    usefulLife: 7,
    location: 'Main Garage',
    serialNumber: 'VAN-ABC-123',
    warrantyExpiry: '2026-06-01',
    maintenancePlan: 'Monthly',
    status: 'Active',
    maintenanceHistory: [
      { id: 'MNT-005', date: '2026-03-05', activity: 'Brake Pad Replacement', performedBy: 'QuickStop Garage', cost: 850 },
    ],
  },
  {
    id: 'AST-003',
    name: 'CNC Milling Machine',
    category: 'Machinery',
    supplierId: 'SUP-001',
    purchaseDate: '2026-01-10',
    purchaseValue: 85000,
    salvageValue: 12000,
    depreciationRate: 0.10,
    usefulLife: 15,
    location: 'Factory Floor — Section B',
    serialNumber: 'CNC-XM-770',
    warrantyExpiry: '2029-01-10',
    maintenancePlan: 'Bi-Annual',
    status: 'Under Maintenance',
    maintenanceHistory: [],
  },
  {
    id: 'AST-004',
    name: 'Core Server Cluster',
    category: 'IT Infrastructure',
    supplierId: 'SUP-006',
    purchaseDate: '2025-11-20',
    purchaseValue: 125000,
    salvageValue: 10000,
    depreciationRate: 0.33,
    usefulLife: 4,
    location: 'Data Center Tier 3',
    serialNumber: 'SRV-DL380-01',
    warrantyExpiry: '2028-11-20',
    maintenancePlan: 'Annual',
    status: 'Active',
    maintenanceHistory: [],
  },
];
