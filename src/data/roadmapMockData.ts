import { BudgetEnvelope, Contract, Invoice, BlanketPO } from '@/types';

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
