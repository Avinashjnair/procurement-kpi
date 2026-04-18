import { BudgetEnvelope, Contract, Invoice, BlanketPO, ComplianceDocument, GRNDispute } from '@/types';

export const initialBudgets: BudgetEnvelope[] = [
  {
    id: 'BGT-001',
    name: 'Mechanical Maintenance 2026',
    department: 'Maintenance',
    project: 'FAC-2026-MAIN',
    period: '2026',
    totalAmount: 500000,
    committedAmount: 120000,
    spentAmount: 85000,
    currency: 'AED',
    status: 'Active'
  },
  {
    id: 'BGT-002',
    name: 'IT Infrastructure Refresh',
    department: 'IT',
    project: 'IT-REFRESH-V3',
    period: '2026',
    totalAmount: 250000,
    committedAmount: 45000,
    spentAmount: 12000,
    currency: 'AED',
    status: 'Active'
  },
  {
    id: 'BGT-003',
    name: 'Chemical Supply Annual',
    department: 'Operations',
    period: '2026',
    totalAmount: 150000,
    committedAmount: 145000,
    spentAmount: 90000,
    currency: 'AED',
    status: 'Over-budget'
  }
];

export const initialContracts: Contract[] = [
  {
    id: 'CON-001',
    title: 'Precision Steel Framework Agreement',
    supplierId: 'SUP-001',
    supplierName: 'SteelMax Industries',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalValue: 1200000,
    currency: 'USD',
    status: 'Active',
    renewalWindowDays: 60,
    linkedPoIds: ['PO-001', 'PO-004']
  },
  {
    id: 'CON-002',
    title: 'Chemical Sourcing & Logistics',
    supplierId: 'SUP-003',
    supplierName: 'EuroChem Supply Co.',
    startDate: '2025-06-01',
    endDate: '2026-05-31',
    totalValue: 500000,
    currency: 'USD',
    status: 'Expiring',
    renewalWindowDays: 90,
    linkedPoIds: ['PO-003']
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-1001',
    invoiceNumber: 'STEEL-9921',
    poId: 'PO-001',
    supplierId: 'SUP-001',
    supplierName: 'SteelMax Industries',
    date: '2026-04-10',
    dueDate: '2026-05-10',
    totalAmount: 42750,
    currency: 'USD',
    status: 'Matched',
    matchStatus: 'Full Match',
    lineItems: [
      { poLineIndex: 0, itemId: 'ITM-001', itemName: 'Carbon Steel Pipe (6")', billedQty: 500, unitPrice: 85.50, totalPrice: 42750 }
    ]
  }
];

export const initialBlankets: BlanketPO[] = [
  {
    id: 'BPO-001',
    supplierId: 'SUP-001',
    supplierName: 'SteelMax Industries',
    totalCeiling: 1000000,
    consumedAmount: 250000,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    currency: 'USD',
    status: 'Active',
    releaseOrderIds: ['PO-001', 'PO-004'],
    category: 'Piping',
    department: 'Maintenance'
  },
  {
    id: 'BPO-002',
    supplierId: 'SUP-003',
    supplierName: 'EuroChem Supply Co.',
    totalCeiling: 500000,
    consumedAmount: 11250,
    validFrom: '2026-03-01',
    validTo: '2027-03-01',
    currency: 'USD',
    status: 'Active',
    releaseOrderIds: ['PO-003'],
    category: 'Chemicals'
  }
];

export const initialComplianceDocs: ComplianceDocument[] = [
  {
    id: 'CDOC-001',
    supplierId: 'SUP-001',
    title: 'Trade License 2026',
    category: 'Trade License',
    expiryDate: '2026-12-15',
    status: 'Active',
    fileName: 'Trade_License_SteelMax.pdf',
    fileSize: '1.2 MB',
    uploadedAt: '2026-01-05T10:00:00Z'
  },
  {
    id: 'CDOC-002',
    supplierId: 'SUP-001',
    title: 'VAT Registration Certificate',
    category: 'VAT Certificate',
    expiryDate: '2027-06-30',
    status: 'Active',
    fileName: 'VAT_Cert_SteelMax.pdf',
    fileSize: '0.8 MB',
    uploadedAt: '2026-01-05T10:05:00Z'
  },
  {
    id: 'CDOC-003',
    supplierId: 'SUP-001',
    title: 'ISO 9001:2015 Certification',
    category: 'ISO Certification',
    expiryDate: '2025-11-20',
    status: 'Expiring Soon',
    fileName: 'ISO9001_SteelMax_2025.pdf',
    fileSize: '2.4 MB',
    uploadedAt: '2023-11-20T14:30:00Z'
  }
];

export const initialDisputes: GRNDispute[] = [
  {
    id: 'DSP-001',
    grnId: 'GRN-002',
    poId: 'PO-002',
    supplierId: 'SUP-001',
    itemId: 'ITM-002',
    itemName: 'Flange Gaskets (4")',
    rejectedQty: 5,
    reason: 'Rejected due to minor surface scratches. These do not affect seal performance according to ASME B16.5 standards. Requesting re-inspection.',
    status: 'Open',
    timestamp: '2026-04-12T09:00:00Z'
  }
];
