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
  priceVariation: number;       // percentage, lower is better
  deliveryPerformance: number;  // percentage on-time
  paymentTerms: string;         // e.g., "Net 30"
  onTimePayment: number;        // percentage
  responseTime: number;         // hours
  deliveryTerms: string;        // Incoterm
  rejectionRate: number;        // percentage
}

export interface Item {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  currentPrice: number;
  linkedSupplierIds: string[];
  priceHistory: PricePoint[];
  purchaseHistory: PurchaseRecord[];
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

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export type DocumentCategory =
  | 'MTC'
  | 'COO'
  | 'BL/AWB'
  | 'Delivery Note'
  | 'Packing List'
  | 'Invoice'
  | 'Internal Inspection Report';

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
// Mock Data
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
];

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
];

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
];

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
};

export const spendByCategory = [
  { category: 'Piping', amount: 193450 },
  { category: 'Valves', amount: 37550 },
  { category: 'Chemicals', amount: 29050 },
  { category: 'Fittings', amount: 30900 },
];

export const monthlySpend = [
  { month: 'Oct 2025', amount: 28900 },
  { month: 'Nov 2025', amount: 42100 },
  { month: 'Dec 2025', amount: 55800 },
  { month: 'Jan 2026', amount: 63200 },
  { month: 'Feb 2026', amount: 56440 },
  { month: 'Mar 2026', amount: 149150 },
  { month: 'Apr 2026', amount: 125650 },
];
