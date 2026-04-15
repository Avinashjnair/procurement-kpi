'use client';
/**
 * poExcelExport.ts
 * Place at: src/utils/poExcelExport.ts
 *
 * Exports a PO as a fully formatted .xlsx workbook with 3 sheets:
 *   1. PO Summary   — header info, parties, key fields
 *   2. Line Items   — itemized table with totals
 *   3. Payment Plan — installment schedule
 *
 * Uses SheetJS (xlsx) loaded via CDN.
 */

import type { PurchaseOrder } from '@/data/mockData';
import type { Supplier } from '@/data/mockData';
import { companyInfo } from '@/data/mockData';

async function getXLSX(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).XLSX) return (window as any).XLSX;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload  = () => resolve((window as any).XLSX);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function makeCellStyle(wb: any, opts: {
  bold?: boolean; bg?: string; fg?: string;
  align?: 'left' | 'center' | 'right';
  border?: boolean; wrap?: boolean; fontSize?: number; italic?: boolean;
}) {
  // SheetJS Community Edition does not support styles natively —
  // we build a style descriptor that SheetJS Pro / xlsxstyle would pick up.
  // For the free version, we return an object used for display hints only.
  return {
    font: {
      bold:   opts.bold   || false,
      italic: opts.italic || false,
      sz:     opts.fontSize || 10,
      color:  opts.fg ? { rgb: opts.fg.replace('#','') } : undefined,
    },
    fill: opts.bg ? { fgColor: { rgb: opts.bg.replace('#','') } } : undefined,
    alignment: { horizontal: opts.align || 'left', wrapText: opts.wrap || false },
    border: opts.border ? {
      top:    { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left:   { style: 'thin', color: { rgb: 'E2E8F0' } },
      right:  { style: 'thin', color: { rgb: 'E2E8F0' } },
    } : undefined,
  };
}

export async function exportPOAsExcel(
  po: PurchaseOrder,
  supplier: Supplier | undefined,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Loading Excel engine...');
  const XLSX: any = await getXLSX();
  if (!XLSX) { alert('Excel library could not be loaded.'); return; }

  onProgress?.('Building workbook...');
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: PO Summary ──────────────────────────────────────
  const summaryData: any[][] = [
    ['PURCHASE ORDER', '', '', '', po.id],
    [companyInfo.name],
    [''],
    // Buyer
    ['FROM (BUYER)', '', '', 'TO (SUPPLIER)'],
    [companyInfo.name, '', '', supplier?.name || po.supplierName],
    [companyInfo.address, '', '', supplier?.address || ''],
    [companyInfo.email, '', '', supplier?.email || ''],
    [companyInfo.phone, '', '', supplier?.phone || ''],
    [companyInfo.taxRegNumber ? `TRN: ${companyInfo.taxRegNumber}` : '', '', '', supplier?.taxRegNumber ? `TRN: ${supplier.taxRegNumber}` : ''],
    [''],
    ['KEY DETAILS'],
    ['Issue Date',      po.dateOfIssue,    '', 'Due Date',           po.dueDate],
    ['ETA / Complete',  po.eta,            '', 'Payment Terms',      po.paymentTerms],
    ['Incoterms',       po.incoterms,      '', 'Delivery Status',    po.deliveryStatus],
    ['Payment Status',  po.paymentStatus,  '', 'Total Amount',       `$${po.totalAmount.toLocaleString()}`],
    ['Amount Paid',     `$${po.amountPaid.toLocaleString()}`, '', 'Outstanding', `$${(po.totalAmount - po.amountPaid).toLocaleString()}`],
    po.projectReference ? ['Project Reference', po.projectReference] : [''],
    po.requestNumber    ? ['Request Number',    po.requestNumber]    : [''],
    po.approvalAuthority ? ['Approval Authority', po.approvalAuthority] : [''],
    [''],
    po.remarks ? ['REMARKS', po.remarks] : [''],
  ].filter(Boolean) as any[][];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 4 }, { wch: 22 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws1, '📋 PO Summary');

  // ── Sheet 2: Line Items ──────────────────────────────────────
  const headers = ['#', 'Item ID', 'Description', 'Type', 'Qty', 'Unit Price (USD)', 'Total (USD)', 'Notes'];
  const lineRows: any[][] = po.items.map((item: any, i: number) => [
    i + 1,
    item.itemId,
    item.itemName,
    item.isService ? 'Service' : item.isAsset ? 'Capital Asset' : 'Goods',
    item.quantity,
    item.unitPrice,
    item.quantity * item.unitPrice,
    item.serviceDetails?.scopeOfWork || '',
  ]);

  const subtotal = po.totalAmount;
  const vat      = subtotal * 0.05;
  const grand    = subtotal + vat;

  const itemsData: any[][] = [
    [`PURCHASE ORDER — ${po.id}  |  ${po.supplierName}  |  Issued: ${po.dateOfIssue}`],
    [''],
    headers,
    ...lineRows,
    [''],
    ['', '', '', '', '', 'Subtotal',     subtotal],
    ['', '', '', '', '', 'VAT (5%)',      vat],
    ['', '', '', '', '', 'GRAND TOTAL',   grand],
    ['', '', '', '', '', 'Amount Paid',   po.amountPaid],
    ['', '', '', '', '', 'OUTSTANDING',   grand - po.amountPaid],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(itemsData);
  ws2['!cols'] = [
    { wch: 4 }, { wch: 10 }, { wch: 36 }, { wch: 14 },
    { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '📦 Line Items');

  // ── Sheet 3: Payment Schedule ───────────────────────────────
  const paymentHeaders = ['Payment #', 'Due Date', 'Description', 'Amount (USD)', 'Status', 'Date Paid', 'Reference', 'Method'];

  // Build from paymentRecords if available, else derive from terms
  let paymentRows: any[][];
  const records = po.paymentRecords || [];

  if (records.length > 0) {
    paymentRows = records.map((r: any, i: number) => [
      i + 1,
      r.paymentDate,
      r.notes || `Payment ${i + 1}`,
      r.amount,
      r.status,
      r.paymentDate,
      r.referenceNumber,
      r.paymentMethod,
    ]);
  } else {
    // Derive schedule from payment terms
    const scheduleMap: Record<string, any[][]> = {
      'Net 30':  [['Final',             po.dueDate, 'Full payment', grand, po.paymentStatus === 'Paid' ? 'Paid' : 'Pending']],
      'Net 45':  [['Final',             po.dueDate, 'Full payment', grand, po.paymentStatus === 'Paid' ? 'Paid' : 'Pending']],
      'Net 60':  [['Final',             po.dueDate, 'Full payment', grand, po.paymentStatus === 'Paid' ? 'Paid' : 'Pending']],
      '50% Advance, 50% on Delivery': [
        ['Advance',   po.dateOfIssue, '50% advance payment',    grand * 0.5, po.amountPaid >= grand * 0.5 ? 'Paid' : 'Pending'],
        ['On Delivery', po.eta,       '50% on delivery',        grand * 0.5, po.paymentStatus === 'Paid' ? 'Paid' : 'Pending'],
      ],
    };
    paymentRows = scheduleMap[po.paymentTerms] ||
      [[1, po.dueDate, 'Full payment', grand, po.paymentStatus === 'Paid' ? 'Paid' : 'Pending']];
  }

  const paymentData: any[][] = [
    [`PAYMENT SCHEDULE — ${po.id}  |  Terms: ${po.paymentTerms}`],
    [''],
    paymentHeaders,
    ...paymentRows,
    [''],
    ['', '', 'Total PO Value', grand],
    ['', '', 'Paid to Date',   po.amountPaid],
    ['', '', 'OUTSTANDING',    grand - po.amountPaid],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(paymentData);
  ws3['!cols'] = [
    { wch: 10 }, { wch: 14 }, { wch: 28 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '💳 Payment Schedule');

  // ── Write file ───────────────────────────────────────────────
  const fileName = `PO_${po.id}_${po.supplierName.replace(/\s+/g, '_')}.xlsx`;
  
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    if (blob.size < 100) throw new Error('Generated Excel file is too small, likely corrupted.');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    onProgress?.('Done');
  } catch (err) {
    console.error('Excel Export Error:', err);
    alert('Failed to generate a valid Excel file. Please try again.');
  }
}
