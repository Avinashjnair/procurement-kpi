// ============================================================
// Data Models & Types
// ============================================================

export interface SupplierNote {
  id: string;
  text: string;
  date: string;
  author: string;
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

export interface SupplierKPIs {
  priceVariation: number;
  deliveryPerformance: number;
  paymentTerms: string;
  onTimePayment: number;
  responseTime: number;
  deliveryTerms: string;
  rejectionRate: number;
}

export function computeRiskScore(kpis: SupplierKPIs): { score: number; label: 'Low' | 'Medium' | 'High'; color: string } {
  const deliveryRisk  = Math.max(0, 100 - kpis.deliveryPerformance);
  const priceRisk     = Math.min(100, kpis.priceVariation * 8);
  const rejectionRisk = Math.min(100, kpis.rejectionRate * 12);
  const responseRisk  = Math.min(100, kpis.responseTime * 5);
  const score = Math.round(deliveryRisk * 0.4 + priceRisk * 0.25 + rejectionRisk * 0.25 + responseRisk * 0.1);
  if (score <= 20) return { score, label: 'Low',    color: '#10b981' };
  if (score <= 45) return { score, label: 'Medium', color: '#f59e0b' };
  return               { score, label: 'High',   color: '#f43f5e' };
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
  archived?: boolean;   // ← NEW: soft-delete / deactivate
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

export type POStatus = 'Draft' | 'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

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
  cancellationReason?: string;   // ← NEW
  revisionNumber?: number;       // ← NEW: amendment tracking
}

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  isService?: boolean;
  isAsset?: boolean; // ← NEW: classification
  serviceDetails?: ServicePOLineDetails;
}

export interface ServicePOLineDetails {
  billingType: ServiceBillingType;
  scopeOfWork: string;
  duration: string;
  slaTerms: string;
  milestones?: ServiceMilestone[];
}

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
  expiryDate?: string;       // ← NEW: expiry / renewal alerts
  version?: number;          // ← NEW: version control
  supersededBy?: string;     // ← NEW: id of newer version
}

// ============================================================
// Company Info
// ============================================================
export const companyInfo = {
  name: 'ProcureIQ Industries LLC',
  address: 'P.O. Box 28436, Office 1204, Al Shafar Tower 1, Dubai Internet City, Dubai, UAE',
  email: 'procurement@procureiq.ae',
  phone: '+971 4 555 8800',
  taxRegNumber: 'TRN-100234567800003',
};

// ============================================================
// Mock Suppliers
// ============================================================
export const suppliers: Supplier[] = [
  { id: 'SUP-001', name: 'SteelMax Industries', contactPerson: 'Ahmed Al-Rashid', email: 'ahmed@steelmax.com', phone: '+971 50 123 4567', location: 'Dubai, UAE', address: 'Plot 47, Jebel Ali Free Zone, Dubai, UAE', taxRegNumber: 'TRN-300198765400001', preferred: true, kpis: { priceVariation: 3.2, deliveryPerformance: 94, paymentTerms: 'Net 30', onTimePayment: 97, responseTime: 4, deliveryTerms: 'CIF', rejectionRate: 1.5 }, notes: [{ id: 'NOTE-001', text: 'Preferred vendor status awarded after Q4 2025 review.', date: '2026-01-10', author: 'Procurement Team' }] },
  { id: 'SUP-002', name: 'GlobalPipe Solutions', contactPerson: 'Sarah Chen', email: 'chen@globalpipe.com', phone: '+86 21 5555 7890', location: 'Shanghai, China', address: '888 Pudong New Area, Shanghai 200131, China', taxRegNumber: 'USCC-91310115MA1K4XQ95P', preferred: false, kpis: { priceVariation: 5.8, deliveryPerformance: 87, paymentTerms: 'Net 45', onTimePayment: 92, responseTime: 8, deliveryTerms: 'FOB', rejectionRate: 3.2 }, notes: [{ id: 'NOTE-003', text: 'Delivery performance dropped to 87% in H2 2025. Improvement plan requested.', date: '2026-01-05', author: 'Procurement Team' }] },
  { id: 'SUP-003', name: 'EuroChem Supply Co.', contactPerson: 'Klaus Weber', email: 'weber@eurochem.de', phone: '+49 89 4444 5678', location: 'Munich, Germany', address: 'Industriestraße 22, 80939 Munich, Germany', taxRegNumber: 'DE-298745612', preferred: true, kpis: { priceVariation: 2.1, deliveryPerformance: 98, paymentTerms: 'Net 60', onTimePayment: 100, responseTime: 2, deliveryTerms: 'DDP', rejectionRate: 0.5 }, notes: [] },
  { id: 'SUP-004', name: 'IndoTech Materials', contactPerson: 'Ravi Patel', email: 'ravi@indotech.in', phone: '+91 22 6666 7890', location: 'Mumbai, India', address: 'Unit 5B, MIDC Andheri East, Mumbai 400093, India', taxRegNumber: 'GSTIN-27AACCI4906R1ZP', preferred: false, kpis: { priceVariation: 7.4, deliveryPerformance: 81, paymentTerms: 'Net 30', onTimePayment: 85, responseTime: 12, deliveryTerms: 'EXW', rejectionRate: 4.8 }, notes: [{ id: 'NOTE-004', text: 'High rejection rate flagged. Corrective action requested.', date: '2026-02-14', author: 'QA Manager' }] },
  { id: 'SUP-005', name: 'AmeriSteel Corp', contactPerson: 'Mike Johnson', email: 'mike@ameristeel.us', phone: '+1 713 555 9876', location: 'Houston, USA', address: '10200 W Sam Houston Pkwy S, Houston, TX 77099, USA', taxRegNumber: 'EIN-82-3456789', preferred: true, kpis: { priceVariation: 4.0, deliveryPerformance: 91, paymentTerms: 'Net 30', onTimePayment: 95, responseTime: 6, deliveryTerms: 'FCA', rejectionRate: 2.0 }, notes: [] },
  { id: 'SUP-006', name: 'NipponValve Ltd.', contactPerson: 'Yuki Tanaka', email: 'tanaka@nipponvalve.jp', phone: '+81 3 7777 1234', location: 'Tokyo, Japan', address: '3-1-2 Nihonbashi, Chuo-ku, Tokyo 103-0027, Japan', taxRegNumber: 'JP-T1234567890123', preferred: true, kpis: { priceVariation: 1.8, deliveryPerformance: 99, paymentTerms: 'Net 45', onTimePayment: 100, responseTime: 3, deliveryTerms: 'DAP', rejectionRate: 0.3 }, notes: [{ id: 'NOTE-005', text: 'Exceptional 2025 performance. Nominated for Supplier of the Year.', date: '2026-01-20', author: 'Procurement Manager' }] },
  { id: 'SUP-007', name: 'TechServ Engineering', contactPerson: 'Omar Hassan', email: 'omar@techserv.ae', phone: '+971 4 888 2200', location: 'Abu Dhabi, UAE', address: 'Office 302, Khalifa Business Park, Abu Dhabi, UAE', taxRegNumber: 'TRN-104567890100005', preferred: true, kpis: { priceVariation: 2.5, deliveryPerformance: 96, paymentTerms: 'Net 30', onTimePayment: 98, responseTime: 2, deliveryTerms: 'N/A', rejectionRate: 0.8 }, notes: [] },
  { id: 'SUP-008', name: 'InspectoPro Services', contactPerson: 'Linda Müller', email: 'lmuller@inspectopro.de', phone: '+49 211 333 4567', location: 'Düsseldorf, Germany', address: 'Kaistraße 18, 40221 Düsseldorf, Germany', taxRegNumber: 'DE-204983110', preferred: false, kpis: { priceVariation: 1.2, deliveryPerformance: 100, paymentTerms: 'Net 30', onTimePayment: 100, responseTime: 1, deliveryTerms: 'N/A', rejectionRate: 0.0 }, notes: [] },
];

// ============================================================
// Mock Items  (archived flag added to one for demo)
// ============================================================
export const items: Item[] = [
  { id: 'ITM-001', name: 'Carbon Steel Pipe (6")', category: 'Piping', description: 'A106 Grade B seamless carbon steel pipe, 6-inch diameter, Schedule 40.', unit: 'meter', currentPrice: 85.50, linkedSupplierIds: ['SUP-001', 'SUP-002', 'SUP-005'], priceHistory: [{ date: '2025-07', price: 78.00, supplierId: 'SUP-001' }, { date: '2025-09', price: 80.00, supplierId: 'SUP-001' }, { date: '2025-11', price: 83.50, supplierId: 'SUP-001' }, { date: '2026-01', price: 84.50, supplierId: 'SUP-001' }, { date: '2026-03', price: 85.50, supplierId: 'SUP-001' }], purchaseHistory: [{ date: '2026-03-15', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', quantity: 500, unitPrice: 85.50, totalAmount: 42750, poId: 'PO-001' }, { date: '2026-02-10', supplierId: 'SUP-005', supplierName: 'AmeriSteel Corp', quantity: 300, unitPrice: 85.00, totalAmount: 25500, poId: 'PO-005' }] },
  { id: 'ITM-002', name: 'Gate Valve (4")', category: 'Valves', description: 'API 600 gate valve, 4-inch, 150 LB, flanged ends.', unit: 'piece', currentPrice: 320.00, linkedSupplierIds: ['SUP-001', 'SUP-006'], priceHistory: [{ date: '2025-07', price: 290.00, supplierId: 'SUP-006' }, { date: '2025-11', price: 305.00, supplierId: 'SUP-006' }, { date: '2026-03', price: 320.00, supplierId: 'SUP-006' }], purchaseHistory: [{ date: '2026-03-20', supplierId: 'SUP-006', supplierName: 'NipponValve Ltd.', quantity: 20, unitPrice: 320.00, totalAmount: 6400, poId: 'PO-002' }] },
  { id: 'ITM-003', name: 'Sodium Hydroxide (NaOH)', category: 'Chemicals', description: 'Industrial grade caustic soda solution, 50% concentration.', unit: 'ton', currentPrice: 450.00, linkedSupplierIds: ['SUP-003', 'SUP-004'], priceHistory: [{ date: '2025-07', price: 420.00, supplierId: 'SUP-003' }, { date: '2025-11', price: 435.00, supplierId: 'SUP-003' }, { date: '2026-03', price: 450.00, supplierId: 'SUP-003' }], purchaseHistory: [{ date: '2026-03-05', supplierId: 'SUP-003', supplierName: 'EuroChem Supply Co.', quantity: 25, unitPrice: 450.00, totalAmount: 11250, poId: 'PO-003' }] },
  { id: 'ITM-004', name: 'Stainless Steel Flange (8")', category: 'Fittings', description: '316L stainless steel weld neck flange, 8-inch, 300 LB.', unit: 'piece', currentPrice: 195.00, linkedSupplierIds: ['SUP-001', 'SUP-002', 'SUP-005'], priceHistory: [{ date: '2025-07', price: 170.00, supplierId: 'SUP-001' }, { date: '2025-11', price: 183.00, supplierId: 'SUP-001' }, { date: '2026-03', price: 195.00, supplierId: 'SUP-001' }], purchaseHistory: [{ date: '2026-02-28', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', quantity: 100, unitPrice: 192.00, totalAmount: 19200, poId: 'PO-004' }] },
  { id: 'ITM-005', name: 'HDPE Pipe (12")', category: 'Piping', description: 'High-density polyethylene pipe, 12-inch, SDR 11, PE100.', unit: 'meter', currentPrice: 62.00, linkedSupplierIds: ['SUP-002', 'SUP-004'], priceHistory: [{ date: '2025-07', price: 55.00, supplierId: 'SUP-002' }, { date: '2025-11', price: 58.50, supplierId: 'SUP-002' }, { date: '2026-03', price: 62.00, supplierId: 'SUP-002' }], purchaseHistory: [{ date: '2026-03-10', supplierId: 'SUP-002', supplierName: 'GlobalPipe Solutions', quantity: 1000, unitPrice: 62.00, totalAmount: 62000, poId: 'PO-010' }] },
  { id: 'ITM-006', name: 'Ball Valve (2")', category: 'Valves', description: 'Full bore ball valve, 2-inch, 1000 WOG, threaded ends.', unit: 'piece', currentPrice: 45.00, linkedSupplierIds: ['SUP-001', 'SUP-004', 'SUP-006'], priceHistory: [{ date: '2025-07', price: 38.00, supplierId: 'SUP-006' }, { date: '2025-11', price: 41.00, supplierId: 'SUP-001' }, { date: '2026-03', price: 45.00, supplierId: 'SUP-006' }], purchaseHistory: [{ date: '2026-03-18', supplierId: 'SUP-006', supplierName: 'NipponValve Ltd.', quantity: 200, unitPrice: 45.00, totalAmount: 9000, poId: 'PO-002' }] },
  // archived demo item
  { id: 'ITM-007', name: 'Legacy Carbon Elbow (4")', category: 'Fittings', description: 'Discontinued — replaced by ITM-004 range.', unit: 'piece', currentPrice: 88.00, linkedSupplierIds: ['SUP-001'], priceHistory: [{ date: '2024-06', price: 80.00, supplierId: 'SUP-001' }, { date: '2024-12', price: 88.00, supplierId: 'SUP-001' }], purchaseHistory: [], archived: true },
  // service items
  { id: 'ITM-008', name: 'Pipeline Inspection Service', category: 'Services', description: 'Third-party inspection per ASME B31.3.', unit: 'day', currentPrice: 1200.00, linkedSupplierIds: ['SUP-007', 'SUP-008'], priceHistory: [{ date: '2025-09', price: 1100.00, supplierId: 'SUP-007' }, { date: '2026-03', price: 1200.00, supplierId: 'SUP-007' }], purchaseHistory: [{ date: '2026-03-01', supplierId: 'SUP-007', supplierName: 'TechServ Engineering', quantity: 10, unitPrice: 1200.00, totalAmount: 12000, poId: 'PO-011' }], serviceDetails: { billingType: 'Hourly Rate', scopeOfWork: 'Visual and dimensional inspection per ASME B31.3. Daily reports required.', duration: '10 working days', slaTerms: 'Reports issued within 4h of inspection.' } },
  { id: 'ITM-009', name: 'Annual Maintenance Contract — Valves', category: 'Services', description: 'Preventive and corrective maintenance of all plant valves.', unit: 'month', currentPrice: 8500.00, linkedSupplierIds: ['SUP-007'], priceHistory: [{ date: '2025-07', price: 8000.00, supplierId: 'SUP-007' }, { date: '2026-01', price: 8500.00, supplierId: 'SUP-007' }], purchaseHistory: [{ date: '2026-01-01', supplierId: 'SUP-007', supplierName: 'TechServ Engineering', quantity: 12, unitPrice: 8500.00, totalAmount: 102000, poId: 'PO-012' }], serviceDetails: { billingType: 'Fixed Price', scopeOfWork: 'Monthly PM rounds + corrective on-call.', duration: '12 months', slaTerms: 'Corrective: 4h critical, 24h non-critical.', milestones: [{ id: 'MS-001', description: 'Q1 complete', percentage: 25, dueDate: '2026-03-31', completed: true }, { id: 'MS-002', description: 'Q2 complete', percentage: 25, dueDate: '2026-06-30', completed: false }, { id: 'MS-003', description: 'Q3 complete', percentage: 25, dueDate: '2026-09-30', completed: false }, { id: 'MS-004', description: 'Q4 + report', percentage: 25, dueDate: '2026-12-31', completed: false }] } },
];

// ============================================================
// Mock POs
// ============================================================
export const purchaseOrders: PurchaseOrder[] = [
  { id: 'PO-001', dateOfIssue: '2026-03-10', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', items: [{ itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 500, unitPrice: 85.50, isAsset: true }], totalAmount: 42750, paymentTerms: 'Net 30', amountPaid: 42750, dateOfPayment: '2026-04-05', dueDate: '2026-04-10', deliveryStatus: 'Delivered', paymentStatus: 'Paid', eta: '2026-04-01', incoterms: 'CIF' },
  { id: 'PO-002', dateOfIssue: '2026-03-15', supplierId: 'SUP-006', supplierName: 'NipponValve Ltd.', items: [{ itemId: 'ITM-002', itemName: 'Gate Valve (4")', quantity: 20, unitPrice: 320.00 }, { itemId: 'ITM-006', itemName: 'Ball Valve (2")', quantity: 200, unitPrice: 45.00 }], totalAmount: 15400, paymentTerms: 'Net 45', amountPaid: 7700, dateOfPayment: '2026-04-01', dueDate: '2026-04-30', deliveryStatus: 'Shipped', paymentStatus: 'Partial', eta: '2026-04-12', incoterms: 'DAP' },
  { id: 'PO-003', dateOfIssue: '2026-03-01', supplierId: 'SUP-003', supplierName: 'EuroChem Supply Co.', items: [{ itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)', quantity: 25, unitPrice: 450.00 }], totalAmount: 11250, paymentTerms: 'Net 60', amountPaid: 0, dateOfPayment: null, dueDate: '2026-05-01', deliveryStatus: 'Delivered', paymentStatus: 'Unpaid', eta: '2026-03-28', incoterms: 'DDP' },
  { id: 'PO-004', dateOfIssue: '2026-02-20', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', items: [{ itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', quantity: 100, unitPrice: 192.00 }], totalAmount: 19200, paymentTerms: 'Net 30', amountPaid: 19200, dateOfPayment: '2026-03-18', dueDate: '2026-03-22', deliveryStatus: 'Delivered', paymentStatus: 'Paid', eta: '2026-03-10', incoterms: 'CIF' },
  { id: 'PO-005', dateOfIssue: '2026-02-01', supplierId: 'SUP-005', supplierName: 'AmeriSteel Corp', items: [{ itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 300, unitPrice: 85.00 }], totalAmount: 25500, paymentTerms: 'Net 30', amountPaid: 25500, dateOfPayment: '2026-02-28', dueDate: '2026-03-03', deliveryStatus: 'Delivered', paymentStatus: 'Paid', eta: '2026-02-25', incoterms: 'FCA' },
  { id: 'PO-006', dateOfIssue: '2026-04-01', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', items: [{ itemId: 'ITM-002', itemName: 'Gate Valve (4")', quantity: 50, unitPrice: 315.00 }], totalAmount: 15750, paymentTerms: 'Net 30', amountPaid: 0, dateOfPayment: null, dueDate: '2026-05-01', deliveryStatus: 'Pending', paymentStatus: 'Unpaid', eta: '2026-04-20', incoterms: 'CIF' },
  { id: 'PO-007', dateOfIssue: '2026-04-05', supplierId: 'SUP-005', supplierName: 'AmeriSteel Corp', items: [{ itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', quantity: 60, unitPrice: 195.00 }], totalAmount: 11700, paymentTerms: 'Net 30', amountPaid: 0, dateOfPayment: null, dueDate: '2026-05-05', deliveryStatus: 'Approved', paymentStatus: 'Unpaid', eta: '2026-04-25', incoterms: 'FCA' },
  { id: 'PO-008', dateOfIssue: '2026-04-08', supplierId: 'SUP-002', supplierName: 'GlobalPipe Solutions', items: [{ itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 800, unitPrice: 84.00 }, { itemId: 'ITM-005', itemName: 'HDPE Pipe (12")', quantity: 500, unitPrice: 62.00 }], totalAmount: 98200, paymentTerms: 'Net 45', amountPaid: 0, dateOfPayment: null, dueDate: '2026-05-23', deliveryStatus: 'Pending', paymentStatus: 'Unpaid', eta: '2026-05-05', incoterms: 'FOB' },
  { id: 'PO-009', dateOfIssue: '2026-03-25', supplierId: 'SUP-004', supplierName: 'IndoTech Materials', items: [{ itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)', quantity: 40, unitPrice: 445.00 }], totalAmount: 17800, paymentTerms: 'Net 30', amountPaid: 0, dateOfPayment: null, dueDate: '2026-04-25', deliveryStatus: 'Shipped', paymentStatus: 'Unpaid', eta: '2026-04-15', incoterms: 'EXW' },
  { id: 'PO-010', dateOfIssue: '2026-03-08', supplierId: 'SUP-002', supplierName: 'GlobalPipe Solutions', items: [{ itemId: 'ITM-005', itemName: 'HDPE Pipe (12")', quantity: 1000, unitPrice: 62.00 }], totalAmount: 62000, paymentTerms: 'Net 45', amountPaid: 62000, dateOfPayment: '2026-04-08', dueDate: '2026-04-22', deliveryStatus: 'Delivered', paymentStatus: 'Paid', eta: '2026-04-05', incoterms: 'FOB' },
  { id: 'PO-011', dateOfIssue: '2026-02-25', supplierId: 'SUP-007', supplierName: 'TechServ Engineering', items: [{ itemId: 'ITM-008', itemName: 'Pipeline Inspection Service', quantity: 10, unitPrice: 1200.00, isService: true, serviceDetails: { billingType: 'Hourly Rate', scopeOfWork: 'Inspection of Phase-2 pipeline welding per ASME B31.3.', duration: '10 working days', slaTerms: 'Reports within 4h.' } }], totalAmount: 12000, paymentTerms: 'Net 30', amountPaid: 12000, dateOfPayment: '2026-03-28', dueDate: '2026-03-31', deliveryStatus: 'Delivered', paymentStatus: 'Paid', eta: '2026-03-15', incoterms: 'N/A', projectReference: 'PRJ-2026-0012' },
  { id: 'PO-012', dateOfIssue: '2026-01-01', supplierId: 'SUP-007', supplierName: 'TechServ Engineering', items: [{ itemId: 'ITM-009', itemName: 'Annual Maintenance Contract — Valves', quantity: 12, unitPrice: 8500.00, isService: true, serviceDetails: { billingType: 'Fixed Price', scopeOfWork: 'Annual valve maintenance.', duration: '12 months', slaTerms: '4h critical, 24h non-critical.' } }], totalAmount: 102000, paymentTerms: 'Milestone Based', amountPaid: 25500, dateOfPayment: '2026-04-03', dueDate: '2026-12-31', deliveryStatus: 'Approved', paymentStatus: 'Partial', eta: '2026-12-31', incoterms: 'N/A', projectReference: 'PRJ-2026-AMC-001' },
  // cancelled PO with reason (demo)
  { id: 'PO-013', dateOfIssue: '2026-03-20', supplierId: 'SUP-004', supplierName: 'IndoTech Materials', items: [{ itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)', quantity: 10, unitPrice: 450.00 }], totalAmount: 4500, paymentTerms: 'Net 30', amountPaid: 0, dateOfPayment: null, dueDate: '2026-04-20', deliveryStatus: 'Cancelled', paymentStatus: 'Unpaid', eta: '2026-04-10', incoterms: 'EXW', cancellationReason: 'Supplier could not meet quality specification. Order re-issued to SUP-003.' },
];

// ============================================================
// Mock Documents (with expiryDate and version)
// ============================================================
export const documents: Document[] = [
  { id: 'DOC-001', name: 'MTC_CarbonSteel_PO001.pdf',            category: 'MTC',                        poId: 'PO-001', itemId: 'ITM-001', uploadDate: '2026-03-30', fileSize: '1.2 MB', fileType: 'PDF' },
  { id: 'DOC-002', name: 'COO_SteelMax_PO001.pdf',               category: 'COO',                        poId: 'PO-001', itemId: 'ITM-001', uploadDate: '2026-03-30', fileSize: '0.8 MB', fileType: 'PDF' },
  { id: 'DOC-003', name: 'INV_SteelMax_PO001.pdf',               category: 'Invoice',                    poId: 'PO-001', itemId: 'ITM-001', uploadDate: '2026-04-01', fileSize: '0.5 MB', fileType: 'PDF' },
  { id: 'DOC-004', name: 'BL_NipponValve_PO002.pdf',             category: 'BL/AWB',                     poId: 'PO-002', itemId: 'ITM-002', uploadDate: '2026-03-28', fileSize: '0.9 MB', fileType: 'PDF' },
  { id: 'DOC-005', name: 'PackingList_PO002.pdf',                category: 'Packing List',               poId: 'PO-002', itemId: 'ITM-006', uploadDate: '2026-03-28', fileSize: '0.3 MB', fileType: 'PDF' },
  { id: 'DOC-006', name: 'INV_EuroChem_PO003.pdf',               category: 'Invoice',                    poId: 'PO-003', itemId: 'ITM-003', uploadDate: '2026-03-15', fileSize: '0.6 MB', fileType: 'PDF', expiryDate: '2026-05-01' },
  { id: 'DOC-007', name: 'DeliveryNote_PO003.pdf',               category: 'Delivery Note',              poId: 'PO-003', itemId: 'ITM-003', uploadDate: '2026-03-28', fileSize: '0.4 MB', fileType: 'PDF' },
  { id: 'DOC-008', name: 'InspectionReport_PO004.pdf',           category: 'Internal Inspection Report', poId: 'PO-004', itemId: 'ITM-004', uploadDate: '2026-03-12', fileSize: '2.1 MB', fileType: 'PDF' },
  { id: 'DOC-009', name: 'MTC_Flanges_PO004_v1.pdf',             category: 'MTC',                        poId: 'PO-004', itemId: 'ITM-004', uploadDate: '2026-03-10', fileSize: '1.5 MB', fileType: 'PDF', version: 1, supersededBy: 'DOC-014' },
  { id: 'DOC-010', name: 'COO_AmeriSteel_PO005.pdf',             category: 'COO',                        poId: 'PO-005', itemId: 'ITM-001', uploadDate: '2026-02-28', fileSize: '0.7 MB', fileType: 'PDF' },
  // service docs
  { id: 'DOC-011', name: 'WCC_PipelineInspection_PO011.pdf',     category: 'Work Completion Certificate',poId: 'PO-011', itemId: 'ITM-008', uploadDate: '2026-03-15', fileSize: '0.6 MB', fileType: 'PDF' },
  { id: 'DOC-012', name: 'SLAReport_Q1_AMC_PO012.pdf',           category: 'SLA Report',                 poId: 'PO-012', itemId: 'ITM-009', uploadDate: '2026-04-02', fileSize: '1.1 MB', fileType: 'PDF', expiryDate: '2026-04-30' },
  { id: 'DOC-013', name: 'INV_TechServ_Q1_PO012.pdf',            category: 'Invoice',                    poId: 'PO-012', itemId: 'ITM-009', uploadDate: '2026-04-01', fileSize: '0.5 MB', fileType: 'PDF', expiryDate: '2026-04-15' },
  // v2 of DOC-009
  { id: 'DOC-014', name: 'MTC_Flanges_PO004_v2.pdf',             category: 'MTC',                        poId: 'PO-004', itemId: 'ITM-004', uploadDate: '2026-04-05', fileSize: '1.6 MB', fileType: 'PDF', version: 2 },
];

// ============================================================
// Dashboard helpers
// ============================================================

// Cost reduction helper: compare latest price to earliest in history
function calcCostReduction(): number {
  return items.reduce((total, item) => {
    if (item.priceHistory.length < 2) return total;
    const first = item.priceHistory[0].price;
    const last  = item.priceHistory[item.priceHistory.length - 1].price;
    if (last >= first) return total;
    const saved = (first - last) * item.purchaseHistory.reduce((q, r) => q + r.quantity, 0);
    return total + saved;
  }, 0);
}

// PO cycle time: avg days from dateOfIssue to eta for delivered POs
function calcAvgCycleTime(): number {
  const delivered = purchaseOrders.filter(po => po.deliveryStatus === 'Delivered' && po.eta);
  if (!delivered.length) return 0;
  const totalDays = delivered.reduce((s, po) => {
    const issue    = new Date(po.dateOfIssue).getTime();
    const delivery = new Date(po.eta).getTime();
    return s + Math.max(0, (delivery - issue) / 86400000);
  }, 0);
  return Math.round(totalDays / delivered.length);
}

// Emergency PO ratio: POs where eta - dateOfIssue < 7 days
function calcEmergencyPORatio(): number {
  const total = purchaseOrders.length;
  if (!total) return 0;
  const emergency = purchaseOrders.filter(po => {
    const days = (new Date(po.eta).getTime() - new Date(po.dateOfIssue).getTime()) / 86400000;
    return days >= 0 && days < 7;
  }).length;
  return Math.round((emergency / total) * 100);
}

// Spend under management: % spend via preferred suppliers
function calcSpendUnderManagement(): number {
  const preferredIds = new Set(suppliers.filter(s => s.preferred).map(s => s.id));
  const totalSpend   = purchaseOrders.reduce((s, po) => s + po.totalAmount, 0);
  const managedSpend = purchaseOrders
    .filter(po => preferredIds.has(po.supplierId))
    .reduce((s, po) => s + po.totalAmount, 0);
  return totalSpend ? Math.round((managedSpend / totalSpend) * 100) : 0;
}

export const dashboardMetrics = {
  totalSpend:            purchaseOrders.reduce((s, po) => s + po.totalAmount, 0),
  totalPOs:              purchaseOrders.length,
  pendingPOs:            purchaseOrders.filter(po => ['Pending','Approved','Shipped'].includes(po.deliveryStatus)).length,
  deliveredPOs:          purchaseOrders.filter(po => po.deliveryStatus === 'Delivered').length,
  totalItems:            items.length,
  totalSuppliers:        suppliers.length,
  unpaidAmount:          purchaseOrders.reduce((s, po) => s + (po.totalAmount - po.amountPaid), 0),
  avgDeliveryPerformance:Math.round(suppliers.reduce((s, sup) => s + sup.kpis.deliveryPerformance, 0) / suppliers.length),
  preferredSuppliers:    suppliers.filter(s => s.preferred).length,
  serviceSpend:          purchaseOrders.filter(po => po.items.some(i => i.isService)).reduce((s, po) => s + po.totalAmount, 0),
  // new KPIs
  costReduction:         calcCostReduction(),
  avgPOCycleTime:        calcAvgCycleTime(),
  emergencyPORatio:      calcEmergencyPORatio(),
  spendUnderManagement:  calcSpendUnderManagement(),
};

export const spendByCategory = [
  { category: 'Piping',    amount: 193450 },
  { category: 'Valves',   amount:  37550 },
  { category: 'Chemicals',amount:  29050 },
  { category: 'Fittings', amount:  30900 },
  { category: 'Services', amount: 114000 },
];

export const monthlySpend = [
  { month: 'Oct 2025', amount:  28900 },
  { month: 'Nov 2025', amount:  42100 },
  { month: 'Dec 2025', amount:  55800 },
  { month: 'Jan 2026', amount: 165200 },
  { month: 'Feb 2026', amount:  56440 },
  { month: 'Mar 2026', amount: 149150 },
  { month: 'Apr 2026', amount: 125650 },
];

// PO cycle time per month for dashboard chart
export const poCycleData = [
  { month: 'Oct 2025', avgDays: 28 },
  { month: 'Nov 2025', avgDays: 24 },
  { month: 'Dec 2025', avgDays: 31 },
  { month: 'Jan 2026', avgDays: 22 },
  { month: 'Feb 2026', avgDays: 19 },
  { month: 'Mar 2026', avgDays: 17 },
  { month: 'Apr 2026', avgDays: 21 },
];
