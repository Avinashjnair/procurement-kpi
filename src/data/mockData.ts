// ============================================================
// Data Models & Types
// ============================================================

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

// ── Item category type now includes Services ──
export type ItemCategory =
  | 'Piping'
  | 'Valves'
  | 'Fittings'
  | 'Chemicals'
  | 'Electrical'
  | 'Instrumentation'
  | 'Services';

// ── Billing type for services ──
export type ServiceBillingType = 'Fixed Price' | 'Hourly Rate' | 'Milestone Based' | 'Lump Sum';

// ── Service milestone (used when billing = Milestone Based) ──
export interface ServiceMilestone {
  id: string;
  description: string;
  percentage: number;   // % of total value
  dueDate: string;
  completed: boolean;
}

// ── Service-specific fields (present only when category = 'Services') ──
export interface ServiceDetails {
  billingType: ServiceBillingType;
  scopeOfWork: string;
  duration: string;         // e.g. "3 months", "ongoing"
  slaTerms: string;         // e.g. "Response within 4h, resolution within 24h"
  milestones?: ServiceMilestone[];
}

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  unit: string;             // 'hour' | 'day' | 'month' | 'lump sum' | 'piece' | 'meter' etc.
  currentPrice: number;
  linkedSupplierIds: string[];
  priceHistory: PricePoint[];
  purchaseHistory: PurchaseRecord[];
  // Only populated when category === 'Services'
  serviceDetails?: ServiceDetails;
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
}

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  // Service-specific PO line fields
  isService?: boolean;
  serviceDetails?: ServicePOLineDetails;
}

// ── Service line details on a PO ──
export interface ServicePOLineDetails {
  billingType: ServiceBillingType;
  scopeOfWork: string;
  duration: string;
  slaTerms: string;
  milestones?: ServiceMilestone[];
}

// ── Document categories now include service doc types ──
export type DocumentCategory =
  | 'MTC'
  | 'COO'
  | 'BL/AWB'
  | 'Delivery Note'
  | 'Packing List'
  | 'Invoice'
  | 'Internal Inspection Report'
  | 'Work Completion Certificate'
  | 'Service Report'
  | 'Timesheet'
  | 'SLA Report';

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  poId: string;
  itemId: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
}

// ============================================================
// Company Info (Buyer)
// ============================================================

export const companyInfo = {
  name: 'ProcureIQ Industries LLC',
  address: 'P.O. Box 28436, Office 1204, Al Shafar Tower 1, Dubai Internet City, Dubai, UAE',
  email: 'procurement@procureiq.ae',
  phone: '+971 4 555 8800',
  taxRegNumber: 'TRN-100234567800003',
};

// ============================================================
// Mock Data — Suppliers
// ============================================================

export const suppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'SteelMax Industries',
    contactPerson: 'Ahmed Al-Rashid',
    email: 'ahmed@steelmax.com',
    phone: '+971 50 123 4567',
    location: 'Dubai, UAE',
    address: 'Plot 47, Jebel Ali Free Zone, Dubai, UAE',
    taxRegNumber: 'TRN-300198765400001',
    kpis: {
      priceVariation: 3.2,
      deliveryPerformance: 94,
      paymentTerms: 'Net 30',
      onTimePayment: 97,
      responseTime: 4,
      deliveryTerms: 'CIF',
      rejectionRate: 1.5,
    },
  },
  {
    id: 'SUP-002',
    name: 'GlobalPipe Solutions',
    contactPerson: 'Sarah Chen',
    email: 'chen@globalpipe.com',
    phone: '+86 21 5555 7890',
    location: 'Shanghai, China',
    address: '888 Pudong New Area, Waigaoqiao FTZ, Shanghai 200131, China',
    taxRegNumber: 'USCC-91310115MA1K4XQ95P',
    kpis: {
      priceVariation: 5.8,
      deliveryPerformance: 87,
      paymentTerms: 'Net 45',
      onTimePayment: 92,
      responseTime: 8,
      deliveryTerms: 'FOB',
      rejectionRate: 3.2,
    },
  },
  {
    id: 'SUP-003',
    name: 'EuroChem Supply Co.',
    contactPerson: 'Klaus Weber',
    email: 'weber@eurochem.de',
    phone: '+49 89 4444 5678',
    location: 'Munich, Germany',
    address: 'Industriestraße 22, 80939 Munich, Bavaria, Germany',
    taxRegNumber: 'DE-298745612',
    kpis: {
      priceVariation: 2.1,
      deliveryPerformance: 98,
      paymentTerms: 'Net 60',
      onTimePayment: 100,
      responseTime: 2,
      deliveryTerms: 'DDP',
      rejectionRate: 0.5,
    },
  },
  {
    id: 'SUP-004',
    name: 'IndoTech Materials',
    contactPerson: 'Ravi Patel',
    email: 'ravi@indotech.in',
    phone: '+91 22 6666 7890',
    location: 'Mumbai, India',
    address: 'Unit 5B, MIDC Andheri East, Mumbai 400093, Maharashtra, India',
    taxRegNumber: 'GSTIN-27AACCI4906R1ZP',
    kpis: {
      priceVariation: 7.4,
      deliveryPerformance: 81,
      paymentTerms: 'Net 30',
      onTimePayment: 85,
      responseTime: 12,
      deliveryTerms: 'EXW',
      rejectionRate: 4.8,
    },
  },
  {
    id: 'SUP-005',
    name: 'AmeriSteel Corp',
    contactPerson: 'Mike Johnson',
    email: 'mike@ameristeel.us',
    phone: '+1 713 555 9876',
    location: 'Houston, USA',
    address: '10200 W Sam Houston Pkwy S, Suite 400, Houston, TX 77099, USA',
    taxRegNumber: 'EIN-82-3456789',
    kpis: {
      priceVariation: 4.0,
      deliveryPerformance: 91,
      paymentTerms: 'Net 30',
      onTimePayment: 95,
      responseTime: 6,
      deliveryTerms: 'FCA',
      rejectionRate: 2.0,
    },
  },
  {
    id: 'SUP-006',
    name: 'NipponValve Ltd.',
    contactPerson: 'Yuki Tanaka',
    email: 'tanaka@nipponvalve.jp',
    phone: '+81 3 7777 1234',
    location: 'Tokyo, Japan',
    address: '3-1-2 Nihonbashi, Chuo-ku, Tokyo 103-0027, Japan',
    taxRegNumber: 'JP-T1234567890123',
    kpis: {
      priceVariation: 1.8,
      deliveryPerformance: 99,
      paymentTerms: 'Net 45',
      onTimePayment: 100,
      responseTime: 3,
      deliveryTerms: 'DAP',
      rejectionRate: 0.3,
    },
  },
  // ── Service suppliers ──
  {
    id: 'SUP-007',
    name: 'TechServ Engineering',
    contactPerson: 'Omar Hassan',
    email: 'omar@techserv.ae',
    phone: '+971 4 888 2200',
    location: 'Abu Dhabi, UAE',
    address: 'Office 302, Khalifa Business Park, Abu Dhabi, UAE',
    taxRegNumber: 'TRN-104567890100005',
    kpis: {
      priceVariation: 2.5,
      deliveryPerformance: 96,
      paymentTerms: 'Net 30',
      onTimePayment: 98,
      responseTime: 2,
      deliveryTerms: 'N/A',
      rejectionRate: 0.8,
    },
  },
  {
    id: 'SUP-008',
    name: 'InspectoPro Services',
    contactPerson: 'Linda Müller',
    email: 'lmuller@inspectopro.de',
    phone: '+49 211 333 4567',
    location: 'Düsseldorf, Germany',
    address: 'Kaistraße 18, 40221 Düsseldorf, Germany',
    taxRegNumber: 'DE-204983110',
    kpis: {
      priceVariation: 1.2,
      deliveryPerformance: 100,
      paymentTerms: 'Net 30',
      onTimePayment: 100,
      responseTime: 1,
      deliveryTerms: 'N/A',
      rejectionRate: 0.0,
    },
  },
];

// ============================================================
// Mock Data — Items (including Services)
// ============================================================

export const items: Item[] = [
  {
    id: 'ITM-001',
    name: 'Carbon Steel Pipe (6")',
    category: 'Piping',
    description: 'A106 Grade B seamless carbon steel pipe, 6-inch diameter, Schedule 40.',
    unit: 'meter',
    currentPrice: 85.50,
    linkedSupplierIds: ['SUP-001', 'SUP-002', 'SUP-005'],
    priceHistory: [
      { date: '2025-07', price: 78.00, supplierId: 'SUP-001' },
      { date: '2025-08', price: 79.50, supplierId: 'SUP-002' },
      { date: '2025-09', price: 80.00, supplierId: 'SUP-001' },
      { date: '2025-10', price: 82.00, supplierId: 'SUP-005' },
      { date: '2025-11', price: 83.50, supplierId: 'SUP-001' },
      { date: '2025-12', price: 84.00, supplierId: 'SUP-002' },
      { date: '2026-01', price: 84.50, supplierId: 'SUP-001' },
      { date: '2026-02', price: 85.00, supplierId: 'SUP-005' },
      { date: '2026-03', price: 85.50, supplierId: 'SUP-001' },
    ],
    purchaseHistory: [
      { date: '2026-03-15', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', quantity: 500, unitPrice: 85.50, totalAmount: 42750, poId: 'PO-001' },
      { date: '2026-02-10', supplierId: 'SUP-005', supplierName: 'AmeriSteel Corp', quantity: 300, unitPrice: 85.00, totalAmount: 25500, poId: 'PO-005' },
      { date: '2026-01-05', supplierId: 'SUP-002', supplierName: 'GlobalPipe Solutions', quantity: 800, unitPrice: 79.50, totalAmount: 63600, poId: 'PO-008' },
    ],
  },
  {
    id: 'ITM-002',
    name: 'Gate Valve (4")',
    category: 'Valves',
    description: 'API 600 gate valve, 4-inch, 150 LB, flanged ends.',
    unit: 'piece',
    currentPrice: 320.00,
    linkedSupplierIds: ['SUP-001', 'SUP-006'],
    priceHistory: [
      { date: '2025-07', price: 290.00, supplierId: 'SUP-006' },
      { date: '2025-08', price: 295.00, supplierId: 'SUP-001' },
      { date: '2025-09', price: 298.00, supplierId: 'SUP-006' },
      { date: '2025-10', price: 300.00, supplierId: 'SUP-001' },
      { date: '2025-11', price: 305.00, supplierId: 'SUP-006' },
      { date: '2025-12', price: 310.00, supplierId: 'SUP-001' },
      { date: '2026-01', price: 312.00, supplierId: 'SUP-006' },
      { date: '2026-02', price: 315.00, supplierId: 'SUP-001' },
      { date: '2026-03', price: 320.00, supplierId: 'SUP-006' },
    ],
    purchaseHistory: [
      { date: '2026-03-20', supplierId: 'SUP-006', supplierName: 'NipponValve Ltd.', quantity: 20, unitPrice: 320.00, totalAmount: 6400, poId: 'PO-002' },
      { date: '2026-01-15', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', quantity: 50, unitPrice: 312.00, totalAmount: 15600, poId: 'PO-006' },
    ],
  },
  {
    id: 'ITM-003',
    name: 'Sodium Hydroxide (NaOH)',
    category: 'Chemicals',
    description: 'Industrial grade caustic soda solution, 50% concentration.',
    unit: 'ton',
    currentPrice: 450.00,
    linkedSupplierIds: ['SUP-003', 'SUP-004'],
    priceHistory: [
      { date: '2025-07', price: 420.00, supplierId: 'SUP-003' },
      { date: '2025-08', price: 425.00, supplierId: 'SUP-004' },
      { date: '2025-09', price: 428.00, supplierId: 'SUP-003' },
      { date: '2025-10', price: 430.00, supplierId: 'SUP-004' },
      { date: '2025-11', price: 435.00, supplierId: 'SUP-003' },
      { date: '2025-12', price: 438.00, supplierId: 'SUP-004' },
      { date: '2026-01', price: 442.00, supplierId: 'SUP-003' },
      { date: '2026-02', price: 445.00, supplierId: 'SUP-004' },
      { date: '2026-03', price: 450.00, supplierId: 'SUP-003' },
    ],
    purchaseHistory: [
      { date: '2026-03-05', supplierId: 'SUP-003', supplierName: 'EuroChem Supply Co.', quantity: 25, unitPrice: 450.00, totalAmount: 11250, poId: 'PO-003' },
      { date: '2025-12-10', supplierId: 'SUP-004', supplierName: 'IndoTech Materials', quantity: 40, unitPrice: 438.00, totalAmount: 17520, poId: 'PO-009' },
    ],
  },
  {
    id: 'ITM-004',
    name: 'Stainless Steel Flange (8")',
    category: 'Fittings',
    description: '316L stainless steel weld neck flange, 8-inch, 300 LB.',
    unit: 'piece',
    currentPrice: 195.00,
    linkedSupplierIds: ['SUP-001', 'SUP-002', 'SUP-005'],
    priceHistory: [
      { date: '2025-07', price: 170.00, supplierId: 'SUP-001' },
      { date: '2025-08', price: 174.00, supplierId: 'SUP-002' },
      { date: '2025-09', price: 176.00, supplierId: 'SUP-001' },
      { date: '2025-10', price: 180.00, supplierId: 'SUP-005' },
      { date: '2025-11', price: 183.00, supplierId: 'SUP-001' },
      { date: '2025-12', price: 186.00, supplierId: 'SUP-002' },
      { date: '2026-01', price: 189.00, supplierId: 'SUP-001' },
      { date: '2026-02', price: 192.00, supplierId: 'SUP-005' },
      { date: '2026-03', price: 195.00, supplierId: 'SUP-001' },
    ],
    purchaseHistory: [
      { date: '2026-02-28', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', quantity: 100, unitPrice: 192.00, totalAmount: 19200, poId: 'PO-004' },
      { date: '2026-01-20', supplierId: 'SUP-005', supplierName: 'AmeriSteel Corp', quantity: 60, unitPrice: 189.00, totalAmount: 11340, poId: 'PO-007' },
    ],
  },
  {
    id: 'ITM-005',
    name: 'HDPE Pipe (12")',
    category: 'Piping',
    description: 'High-density polyethylene pipe, 12-inch, SDR 11, PE100.',
    unit: 'meter',
    currentPrice: 62.00,
    linkedSupplierIds: ['SUP-002', 'SUP-004'],
    priceHistory: [
      { date: '2025-07', price: 55.00, supplierId: 'SUP-002' },
      { date: '2025-08', price: 56.00, supplierId: 'SUP-004' },
      { date: '2025-09', price: 56.50, supplierId: 'SUP-002' },
      { date: '2025-10', price: 57.00, supplierId: 'SUP-004' },
      { date: '2025-11', price: 58.50, supplierId: 'SUP-002' },
      { date: '2025-12', price: 59.00, supplierId: 'SUP-004' },
      { date: '2026-01', price: 60.00, supplierId: 'SUP-002' },
      { date: '2026-02', price: 61.00, supplierId: 'SUP-004' },
      { date: '2026-03', price: 62.00, supplierId: 'SUP-002' },
    ],
    purchaseHistory: [
      { date: '2026-03-10', supplierId: 'SUP-002', supplierName: 'GlobalPipe Solutions', quantity: 1000, unitPrice: 62.00, totalAmount: 62000, poId: 'PO-010' },
    ],
  },
  {
    id: 'ITM-006',
    name: 'Ball Valve (2")',
    category: 'Valves',
    description: 'Full bore ball valve, 2-inch, 1000 WOG, threaded ends.',
    unit: 'piece',
    currentPrice: 45.00,
    linkedSupplierIds: ['SUP-001', 'SUP-004', 'SUP-006'],
    priceHistory: [
      { date: '2025-07', price: 38.00, supplierId: 'SUP-006' },
      { date: '2025-08', price: 39.00, supplierId: 'SUP-001' },
      { date: '2025-09', price: 39.50, supplierId: 'SUP-004' },
      { date: '2025-10', price: 40.00, supplierId: 'SUP-006' },
      { date: '2025-11', price: 41.00, supplierId: 'SUP-001' },
      { date: '2025-12', price: 42.00, supplierId: 'SUP-004' },
      { date: '2026-01', price: 43.00, supplierId: 'SUP-006' },
      { date: '2026-02', price: 44.00, supplierId: 'SUP-001' },
      { date: '2026-03', price: 45.00, supplierId: 'SUP-006' },
    ],
    purchaseHistory: [
      { date: '2026-03-18', supplierId: 'SUP-006', supplierName: 'NipponValve Ltd.', quantity: 200, unitPrice: 45.00, totalAmount: 9000, poId: 'PO-002' },
      { date: '2026-02-05', supplierId: 'SUP-001', supplierName: 'SteelMax Industries', quantity: 150, unitPrice: 44.00, totalAmount: 6600, poId: 'PO-011' },
    ],
  },

  // ── SERVICE ITEMS ──
  {
    id: 'ITM-007',
    name: 'Pipeline Inspection Service',
    category: 'Services',
    description: 'Third-party inspection of pipeline welds, fittings and flanges per ASME B31.3.',
    unit: 'day',
    currentPrice: 1200.00,
    linkedSupplierIds: ['SUP-007', 'SUP-008'],
    priceHistory: [
      { date: '2025-09', price: 1100.00, supplierId: 'SUP-007' },
      { date: '2025-12', price: 1150.00, supplierId: 'SUP-008' },
      { date: '2026-03', price: 1200.00, supplierId: 'SUP-007' },
    ],
    purchaseHistory: [
      { date: '2026-03-01', supplierId: 'SUP-007', supplierName: 'TechServ Engineering', quantity: 10, unitPrice: 1200.00, totalAmount: 12000, poId: 'PO-011' },
    ],
    serviceDetails: {
      billingType: 'Hourly Rate',
      scopeOfWork: 'Visual and dimensional inspection of all pipeline welds and connections per ASME B31.3. Issue daily inspection reports. Witness hydro-test.',
      duration: '10 working days',
      slaTerms: 'Inspector on-site within 24h of call-out. Reports issued within 4h of inspection completion.',
    },
  },
  {
    id: 'ITM-008',
    name: 'Annual Maintenance Contract — Valves',
    category: 'Services',
    description: 'Preventive and corrective maintenance of all plant valves, including actuators.',
    unit: 'month',
    currentPrice: 8500.00,
    linkedSupplierIds: ['SUP-007'],
    priceHistory: [
      { date: '2025-07', price: 8000.00, supplierId: 'SUP-007' },
      { date: '2026-01', price: 8500.00, supplierId: 'SUP-007' },
    ],
    purchaseHistory: [
      { date: '2026-01-01', supplierId: 'SUP-007', supplierName: 'TechServ Engineering', quantity: 12, unitPrice: 8500.00, totalAmount: 102000, poId: 'PO-012' },
    ],
    serviceDetails: {
      billingType: 'Fixed Price',
      scopeOfWork: 'Monthly preventive maintenance rounds on all gate, globe, and ball valves. Corrective maintenance on call-out basis. Actuator calibration twice per year.',
      duration: '12 months',
      slaTerms: 'Preventive visits: first Monday of each month. Corrective call-out response: 4h for critical, 24h for non-critical.',
      milestones: [
        { id: 'MS-001', description: 'Q1 Preventive Maintenance complete', percentage: 25, dueDate: '2026-03-31', completed: true },
        { id: 'MS-002', description: 'Q2 Preventive Maintenance complete', percentage: 25, dueDate: '2026-06-30', completed: false },
        { id: 'MS-003', description: 'Q3 Preventive Maintenance complete', percentage: 25, dueDate: '2026-09-30', completed: false },
        { id: 'MS-004', description: 'Q4 Preventive Maintenance + final report', percentage: 25, dueDate: '2026-12-31', completed: false },
      ],
    },
  },
  {
    id: 'ITM-009',
    name: 'Corrosion Coating Service',
    category: 'Services',
    description: 'Surface preparation and application of anti-corrosion coating on piping systems per NACE standards.',
    unit: 'lump sum',
    currentPrice: 45000.00,
    linkedSupplierIds: ['SUP-008'],
    priceHistory: [
      { date: '2025-10', price: 42000.00, supplierId: 'SUP-008' },
      { date: '2026-03', price: 45000.00, supplierId: 'SUP-008' },
    ],
    purchaseHistory: [],
    serviceDetails: {
      billingType: 'Milestone Based',
      scopeOfWork: 'Surface preparation (Sa 2.5 standard), application of epoxy primer + polyurethane topcoat on 2km of above-ground piping. DFT inspection included.',
      duration: '6 weeks',
      slaTerms: 'Work to proceed only after approval of surface prep. DFT readings within spec before topcoat application.',
      milestones: [
        { id: 'MS-010', description: 'Mobilisation & surface preparation approved', percentage: 20, dueDate: '2026-05-10', completed: false },
        { id: 'MS-011', description: 'Primer coat applied & DFT approved', percentage: 30, dueDate: '2026-05-25', completed: false },
        { id: 'MS-012', description: 'Topcoat applied & final inspection', percentage: 40, dueDate: '2026-06-10', completed: false },
        { id: 'MS-013', description: 'Completion certificate issued', percentage: 10, dueDate: '2026-06-15', completed: false },
      ],
    },
  },
];

// ============================================================
// Mock Data — Purchase Orders
// ============================================================

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-001',
    dateOfIssue: '2026-03-10',
    supplierId: 'SUP-001',
    supplierName: 'SteelMax Industries',
    items: [
      { itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 500, unitPrice: 85.50 },
    ],
    totalAmount: 42750,
    paymentTerms: 'Net 30',
    amountPaid: 42750,
    dateOfPayment: '2026-04-05',
    dueDate: '2026-04-10',
    deliveryStatus: 'Delivered',
    paymentStatus: 'Paid',
    eta: '2026-04-01',
    incoterms: 'CIF',
  },
  {
    id: 'PO-002',
    dateOfIssue: '2026-03-15',
    supplierId: 'SUP-006',
    supplierName: 'NipponValve Ltd.',
    items: [
      { itemId: 'ITM-002', itemName: 'Gate Valve (4")', quantity: 20, unitPrice: 320.00 },
      { itemId: 'ITM-006', itemName: 'Ball Valve (2")', quantity: 200, unitPrice: 45.00 },
    ],
    totalAmount: 15400,
    paymentTerms: 'Net 45',
    amountPaid: 7700,
    dateOfPayment: '2026-04-01',
    dueDate: '2026-04-30',
    deliveryStatus: 'Shipped',
    paymentStatus: 'Partial',
    eta: '2026-04-12',
    incoterms: 'DAP',
  },
  {
    id: 'PO-003',
    dateOfIssue: '2026-03-01',
    supplierId: 'SUP-003',
    supplierName: 'EuroChem Supply Co.',
    items: [
      { itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)', quantity: 25, unitPrice: 450.00 },
    ],
    totalAmount: 11250,
    paymentTerms: 'Net 60',
    amountPaid: 0,
    dateOfPayment: null,
    dueDate: '2026-05-01',
    deliveryStatus: 'Delivered',
    paymentStatus: 'Unpaid',
    eta: '2026-03-28',
    incoterms: 'DDP',
  },
  {
    id: 'PO-004',
    dateOfIssue: '2026-02-20',
    supplierId: 'SUP-001',
    supplierName: 'SteelMax Industries',
    items: [
      { itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', quantity: 100, unitPrice: 192.00 },
    ],
    totalAmount: 19200,
    paymentTerms: 'Net 30',
    amountPaid: 19200,
    dateOfPayment: '2026-03-18',
    dueDate: '2026-03-22',
    deliveryStatus: 'Delivered',
    paymentStatus: 'Paid',
    eta: '2026-03-10',
    incoterms: 'CIF',
  },
  {
    id: 'PO-005',
    dateOfIssue: '2026-02-01',
    supplierId: 'SUP-005',
    supplierName: 'AmeriSteel Corp',
    items: [
      { itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 300, unitPrice: 85.00 },
    ],
    totalAmount: 25500,
    paymentTerms: 'Net 30',
    amountPaid: 25500,
    dateOfPayment: '2026-02-28',
    dueDate: '2026-03-03',
    deliveryStatus: 'Delivered',
    paymentStatus: 'Paid',
    eta: '2026-02-25',
    incoterms: 'FCA',
  },
  {
    id: 'PO-006',
    dateOfIssue: '2026-04-01',
    supplierId: 'SUP-001',
    supplierName: 'SteelMax Industries',
    items: [
      { itemId: 'ITM-002', itemName: 'Gate Valve (4")', quantity: 50, unitPrice: 315.00 },
    ],
    totalAmount: 15750,
    paymentTerms: 'Net 30',
    amountPaid: 0,
    dateOfPayment: null,
    dueDate: '2026-05-01',
    deliveryStatus: 'Pending',
    paymentStatus: 'Unpaid',
    eta: '2026-04-20',
    incoterms: 'CIF',
  },
  {
    id: 'PO-007',
    dateOfIssue: '2026-04-05',
    supplierId: 'SUP-005',
    supplierName: 'AmeriSteel Corp',
    items: [
      { itemId: 'ITM-004', itemName: 'Stainless Steel Flange (8")', quantity: 60, unitPrice: 195.00 },
    ],
    totalAmount: 11700,
    paymentTerms: 'Net 30',
    amountPaid: 0,
    dateOfPayment: null,
    dueDate: '2026-05-05',
    deliveryStatus: 'Approved',
    paymentStatus: 'Unpaid',
    eta: '2026-04-25',
    incoterms: 'FCA',
  },
  {
    id: 'PO-008',
    dateOfIssue: '2026-04-08',
    supplierId: 'SUP-002',
    supplierName: 'GlobalPipe Solutions',
    items: [
      { itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', quantity: 800, unitPrice: 84.00 },
      { itemId: 'ITM-005', itemName: 'HDPE Pipe (12")', quantity: 500, unitPrice: 62.00 },
    ],
    totalAmount: 98200,
    paymentTerms: 'Net 45',
    amountPaid: 0,
    dateOfPayment: null,
    dueDate: '2026-05-23',
    deliveryStatus: 'Pending',
    paymentStatus: 'Unpaid',
    eta: '2026-05-05',
    incoterms: 'FOB',
  },
  {
    id: 'PO-009',
    dateOfIssue: '2026-03-25',
    supplierId: 'SUP-004',
    supplierName: 'IndoTech Materials',
    items: [
      { itemId: 'ITM-003', itemName: 'Sodium Hydroxide (NaOH)', quantity: 40, unitPrice: 445.00 },
    ],
    totalAmount: 17800,
    paymentTerms: 'Net 30',
    amountPaid: 0,
    dateOfPayment: null,
    dueDate: '2026-04-25',
    deliveryStatus: 'Shipped',
    paymentStatus: 'Unpaid',
    eta: '2026-04-15',
    incoterms: 'EXW',
  },
  {
    id: 'PO-010',
    dateOfIssue: '2026-03-08',
    supplierId: 'SUP-002',
    supplierName: 'GlobalPipe Solutions',
    items: [
      { itemId: 'ITM-005', itemName: 'HDPE Pipe (12")', quantity: 1000, unitPrice: 62.00 },
    ],
    totalAmount: 62000,
    paymentTerms: 'Net 45',
    amountPaid: 62000,
    dateOfPayment: '2026-04-08',
    dueDate: '2026-04-22',
    deliveryStatus: 'Delivered',
    paymentStatus: 'Paid',
    eta: '2026-04-05',
    incoterms: 'FOB',
  },
  // ── Service POs ──
  {
    id: 'PO-011',
    dateOfIssue: '2026-02-25',
    supplierId: 'SUP-007',
    supplierName: 'TechServ Engineering',
    items: [
      {
        itemId: 'ITM-007',
        itemName: 'Pipeline Inspection Service',
        quantity: 10,
        unitPrice: 1200.00,
        isService: true,
        serviceDetails: {
          billingType: 'Hourly Rate',
          scopeOfWork: 'Inspection of Phase-2 pipeline welding per ASME B31.3. Daily reports required.',
          duration: '10 working days',
          slaTerms: 'Reports issued within 4h of inspection.',
        },
      },
    ],
    totalAmount: 12000,
    paymentTerms: 'Net 30',
    amountPaid: 12000,
    dateOfPayment: '2026-03-28',
    dueDate: '2026-03-31',
    deliveryStatus: 'Delivered',
    paymentStatus: 'Paid',
    eta: '2026-03-15',
    incoterms: 'N/A',
    projectReference: 'PRJ-2026-0012',
    remarks: 'Final inspection report submitted and approved.',
  },
  {
    id: 'PO-012',
    dateOfIssue: '2026-01-01',
    supplierId: 'SUP-007',
    supplierName: 'TechServ Engineering',
    items: [
      {
        itemId: 'ITM-008',
        itemName: 'Annual Maintenance Contract — Valves',
        quantity: 12,
        unitPrice: 8500.00,
        isService: true,
        serviceDetails: {
          billingType: 'Fixed Price',
          scopeOfWork: 'Annual maintenance of all plant valves including actuators. Monthly visits + on-call corrective.',
          duration: '12 months',
          slaTerms: 'Corrective call-out: 4h critical, 24h non-critical.',
          milestones: [
            { id: 'MS-001', description: 'Q1 Preventive Maintenance complete', percentage: 25, dueDate: '2026-03-31', completed: true },
            { id: 'MS-002', description: 'Q2 Preventive Maintenance complete', percentage: 25, dueDate: '2026-06-30', completed: false },
            { id: 'MS-003', description: 'Q3 Preventive Maintenance complete', percentage: 25, dueDate: '2026-09-30', completed: false },
            { id: 'MS-004', description: 'Q4 Preventive Maintenance + final report', percentage: 25, dueDate: '2026-12-31', completed: false },
          ],
        },
      },
    ],
    totalAmount: 102000,
    paymentTerms: 'Milestone Based',
    amountPaid: 25500,
    dateOfPayment: '2026-04-03',
    dueDate: '2026-12-31',
    deliveryStatus: 'Approved',
    paymentStatus: 'Partial',
    eta: '2026-12-31',
    incoterms: 'N/A',
    projectReference: 'PRJ-2026-AMC-001',
    approvalAuthority: 'Mohammed Al-Farsi, Plant Manager',
  },
];

// ============================================================
// Mock Data — Documents (including service doc types)
// ============================================================

export const documents: Document[] = [
  { id: 'DOC-001', name: 'MTC_CarbonSteel_PO001.pdf', category: 'MTC', poId: 'PO-001', itemId: 'ITM-001', uploadDate: '2026-03-30', fileSize: '1.2 MB', fileType: 'PDF' },
  { id: 'DOC-002', name: 'COO_SteelMax_PO001.pdf', category: 'COO', poId: 'PO-001', itemId: 'ITM-001', uploadDate: '2026-03-30', fileSize: '0.8 MB', fileType: 'PDF' },
  { id: 'DOC-003', name: 'INV_SteelMax_PO001.pdf', category: 'Invoice', poId: 'PO-001', itemId: 'ITM-001', uploadDate: '2026-04-01', fileSize: '0.5 MB', fileType: 'PDF' },
  { id: 'DOC-004', name: 'BL_NipponValve_PO002.pdf', category: 'BL/AWB', poId: 'PO-002', itemId: 'ITM-002', uploadDate: '2026-03-28', fileSize: '0.9 MB', fileType: 'PDF' },
  { id: 'DOC-005', name: 'PackingList_PO002.pdf', category: 'Packing List', poId: 'PO-002', itemId: 'ITM-006', uploadDate: '2026-03-28', fileSize: '0.3 MB', fileType: 'PDF' },
  { id: 'DOC-006', name: 'INV_EuroChem_PO003.pdf', category: 'Invoice', poId: 'PO-003', itemId: 'ITM-003', uploadDate: '2026-03-15', fileSize: '0.6 MB', fileType: 'PDF' },
  { id: 'DOC-007', name: 'DeliveryNote_PO003.pdf', category: 'Delivery Note', poId: 'PO-003', itemId: 'ITM-003', uploadDate: '2026-03-28', fileSize: '0.4 MB', fileType: 'PDF' },
  { id: 'DOC-008', name: 'InspectionReport_PO004.pdf', category: 'Internal Inspection Report', poId: 'PO-004', itemId: 'ITM-004', uploadDate: '2026-03-12', fileSize: '2.1 MB', fileType: 'PDF' },
  { id: 'DOC-009', name: 'MTC_Flanges_PO004.pdf', category: 'MTC', poId: 'PO-004', itemId: 'ITM-004', uploadDate: '2026-03-10', fileSize: '1.5 MB', fileType: 'PDF' },
  { id: 'DOC-010', name: 'COO_AmeriSteel_PO005.pdf', category: 'COO', poId: 'PO-005', itemId: 'ITM-001', uploadDate: '2026-02-28', fileSize: '0.7 MB', fileType: 'PDF' },
  { id: 'DOC-011', name: 'INV_GlobalPipe_PO010.pdf', category: 'Invoice', poId: 'PO-010', itemId: 'ITM-005', uploadDate: '2026-04-06', fileSize: '0.5 MB', fileType: 'PDF' },
  { id: 'DOC-012', name: 'BL_GlobalPipe_PO010.pdf', category: 'BL/AWB', poId: 'PO-010', itemId: 'ITM-005', uploadDate: '2026-04-02', fileSize: '1.0 MB', fileType: 'PDF' },
  // ── Service documents ──
  { id: 'DOC-013', name: 'WCC_PipelineInspection_PO011.pdf', category: 'Work Completion Certificate', poId: 'PO-011', itemId: 'ITM-007', uploadDate: '2026-03-15', fileSize: '0.6 MB', fileType: 'PDF' },
  { id: 'DOC-014', name: 'ServiceReport_Day1-10_PO011.pdf', category: 'Service Report', poId: 'PO-011', itemId: 'ITM-007', uploadDate: '2026-03-16', fileSize: '3.2 MB', fileType: 'PDF' },
  { id: 'DOC-015', name: 'Timesheet_TechServ_Mar2026_PO011.pdf', category: 'Timesheet', poId: 'PO-011', itemId: 'ITM-007', uploadDate: '2026-03-17', fileSize: '0.4 MB', fileType: 'PDF' },
  { id: 'DOC-016', name: 'SLAReport_Q1_AMC_PO012.pdf', category: 'SLA Report', poId: 'PO-012', itemId: 'ITM-008', uploadDate: '2026-04-02', fileSize: '1.1 MB', fileType: 'PDF' },
  { id: 'DOC-017', name: 'INV_TechServ_Q1_PO012.pdf', category: 'Invoice', poId: 'PO-012', itemId: 'ITM-008', uploadDate: '2026-04-01', fileSize: '0.5 MB', fileType: 'PDF' },
];

// ============================================================
// Dashboard summary helpers
// ============================================================

export const dashboardMetrics = {
  totalSpend: purchaseOrders.reduce((s, po) => s + po.totalAmount, 0),
  totalPOs: purchaseOrders.length,
  pendingPOs: purchaseOrders.filter(po => po.deliveryStatus === 'Pending' || po.deliveryStatus === 'Approved' || po.deliveryStatus === 'Shipped').length,
  deliveredPOs: purchaseOrders.filter(po => po.deliveryStatus === 'Delivered').length,
  totalItems: items.length,
  totalSuppliers: suppliers.length,
  unpaidAmount: purchaseOrders.reduce((s, po) => s + (po.totalAmount - po.amountPaid), 0),
  avgDeliveryPerformance: Math.round(suppliers.reduce((s, sup) => s + sup.kpis.deliveryPerformance, 0) / suppliers.length),
  totalServiceItems: items.filter(i => i.category === 'Services').length,
  serviceSpend: purchaseOrders
    .filter(po => po.items.some(i => i.isService))
    .reduce((s, po) => s + po.totalAmount, 0),
};

export const spendByCategory = [
  { category: 'Piping', amount: 193450 },
  { category: 'Valves', amount: 37550 },
  { category: 'Chemicals', amount: 29050 },
  { category: 'Fittings', amount: 30900 },
  { category: 'Services', amount: 114000 },
];

export const monthlySpend = [
  { month: 'Oct 2025', amount: 28900 },
  { month: 'Nov 2025', amount: 42100 },
  { month: 'Dec 2025', amount: 55800 },
  { month: 'Jan 2026', amount: 165200 },
  { month: 'Feb 2026', amount: 56440 },
  { month: 'Mar 2026', amount: 149150 },
  { month: 'Apr 2026', amount: 125650 },
];
