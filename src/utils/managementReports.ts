'use client';
/**
 * managementReports.ts
 * Place at: src/utils/managementReports.ts
 *
 * Generates 5 management-grade Excel reports (Power BI ready):
 *   1. Spend Analysis
 *   2. Supplier Scorecard
 *   3. Payment Aging
 *   4. Open POs & Pipeline
 *   5. Inventory Summary
 *   6. KPI Executive Summary
 *
 * Each report is a flat-table format so Power BI can consume directly.
 */

import type { PurchaseOrder } from '@/data/mockData';
import type { Supplier, SupplierKPIs } from '@/data/mockData';
import type { StockItem } from '@/types';
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

export type ReportType =
  | 'spend-analysis'
  | 'supplier-scorecard'
  | 'payment-aging'
  | 'open-pos'
  | 'inventory-summary'
  | 'kpi-executive';

export interface ReportParams {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  stockItems: StockItem[];
  dateFrom?: string;
  dateTo?: string;
}

function getAgingBucket(dueDate: string): string {
  const days = Math.ceil((new Date().getTime() - new Date(dueDate).getTime()) / 86400000);
  if (days < 0)  return 'Current';
  if (days <= 30) return '1-30 Days';
  if (days <= 60) return '31-60 Days';
  if (days <= 90) return '61-90 Days';
  return '90+ Days (Overdue)';
}

function riskLabel(kpis: SupplierKPIs): string {
  const deliveryRisk = Math.max(0, 100 - kpis.deliveryPerformance);
  const score = Math.round(deliveryRisk * 0.4 + Math.min(100, kpis.priceVariation * 8) * 0.25 + Math.min(100, kpis.rejectionRate * 12) * 0.25 + Math.min(100, kpis.responseTime * 5) * 0.1);
  return score <= 20 ? 'Low' : score <= 45 ? 'Medium' : 'High';
}

// ── 1. Spend Analysis ─────────────────────────────────────────
function buildSpendAnalysis(p: ReportParams): any[][] {
  const headers = [
    'PO ID', 'Date of Issue', 'Supplier', 'Supplier ID',
    'Item', 'Category', 'Quantity', 'Unit Price', 'Line Total',
    'PO Total', 'Payment Terms', 'Delivery Status', 'Payment Status',
    'Project Reference', 'Incoterms', 'Service PO', 'Month', 'Quarter', 'Year'
  ];

  const rows: any[][] = [];
  const filtered = p.purchaseOrders.filter((po: any) => {
    if (p.dateFrom && po.dateOfIssue < p.dateFrom) return false;
    if (p.dateTo   && po.dateOfIssue > p.dateTo)   return false;
    return true;
  });

  filtered.forEach((po: any) => {
    const d = new Date(po.dateOfIssue);
    const month = d.toLocaleString('en', { month: 'long', year: 'numeric' });
    const quarter = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
    const year = d.getFullYear();
    const isService = po.items.some((i: any) => i.isService);

    po.items.forEach((item: any) => {
      rows.push([
        po.id, po.dateOfIssue, po.supplierName, po.supplierId,
        item.itemName, isService ? 'Services' : 'Goods',
        item.quantity, item.unitPrice, item.quantity * item.unitPrice,
        po.totalAmount, po.paymentTerms, po.deliveryStatus, po.paymentStatus,
        po.projectReference || '', po.incoterms,
        isService ? 'Yes' : 'No', month, quarter, year
      ]);
    });
  });

  return [headers, ...rows];
}

// ── 2. Supplier Scorecard ────────────────────────────────────
function buildSupplierScorecard(p: ReportParams): any[][] {
  const headers = [
    'Supplier ID', 'Supplier Name', 'Location', 'Preferred',
    'Price Variation (%)', 'Delivery Performance (%)', 'Rejection Rate (%)',
    'Response Time (hrs)', 'On-Time Payment (%)', 'Payment Terms', 'Delivery Terms',
    'Risk Level', 'Total POs', 'Total Spend (USD)', 'Avg PO Value (USD)',
    'Paid POs', 'Pending POs', 'Cancelled POs'
  ];

  const rows = p.suppliers.map((sup: any) => {
    const pos = p.purchaseOrders.filter((po: any) => po.supplierId === sup.id);
    const totalSpend = pos.reduce((s: number, po: any) => s + po.totalAmount, 0);
    return [
      sup.id, sup.name, sup.location, sup.preferred ? 'Yes' : 'No',
      sup.kpis.priceVariation, sup.kpis.deliveryPerformance, sup.kpis.rejectionRate,
      sup.kpis.responseTime, sup.kpis.onTimePayment, sup.kpis.paymentTerms, sup.kpis.deliveryTerms,
      riskLabel(sup.kpis),
      pos.length, totalSpend, pos.length > 0 ? Math.round(totalSpend / pos.length) : 0,
      pos.filter(po => po.paymentStatus === 'Paid').length,
      pos.filter(po => ['Pending','Approved','Shipped'].includes(po.deliveryStatus)).length,
      pos.filter(po => po.deliveryStatus === 'Cancelled').length,
    ];
  });

  return [headers, ...rows];
}

// ── 3. Payment Aging ─────────────────────────────────────────
function buildPaymentAging(p: ReportParams): any[][] {
  const headers = [
    'PO ID', 'Supplier', 'PO Total (USD)', 'Amount Paid (USD)', 'Outstanding (USD)',
    'Due Date', 'Days Overdue', 'Aging Bucket', 'Payment Status', 'Payment Terms',
    'Delivery Status', 'Project Reference', 'Payment Records', 'Last Payment Date'
  ];

  const rows = p.purchaseOrders
    .filter((po: any) => po.deliveryStatus !== 'Draft' && po.deliveryStatus !== 'Cancelled')
    .map((po: any) => {
      const outstanding = po.totalAmount - po.amountPaid;
      const daysOverdue = Math.max(0, Math.ceil((new Date().getTime() - new Date(po.dueDate).getTime()) / 86400000));
      const lastPay = (po.paymentRecords || []).filter((r: any) => r.status === 'Approved').sort((a: any, b: any) => b.paymentDate.localeCompare(a.paymentDate))[0];
      return [
        po.id, po.supplierName, po.totalAmount, po.amountPaid, outstanding,
        po.dueDate, po.paymentStatus === 'Paid' ? 0 : daysOverdue,
        po.paymentStatus === 'Paid' ? 'Paid' : getAgingBucket(po.dueDate),
        po.paymentStatus, po.paymentTerms, po.deliveryStatus,
        po.projectReference || '',
        (po.paymentRecords || []).length,
        lastPay?.paymentDate || po.dateOfPayment || '',
      ];
    });

  return [headers, ...rows];
}

// ── 4. Open POs & Pipeline ────────────────────────────────────
function buildOpenPOs(p: ReportParams): any[][] {
  const headers = [
    'PO ID', 'Date of Issue', 'Supplier', 'Items', 'Item Count',
    'PO Value (USD)', 'Payment Terms', 'ETA', 'Due Date', 'Days to ETA',
    'Delivery Status', 'Payment Status', 'Outstanding (USD)',
    'Incoterms', 'Project Reference', 'Service PO'
  ];

  const rows = p.purchaseOrders
    .filter((po: any) => !['Delivered', 'Cancelled'].includes(po.deliveryStatus))
    .map((po: any) => {
      const daysToETA = Math.ceil((new Date(po.eta).getTime() - new Date().getTime()) / 86400000);
      return [
        po.id, po.dateOfIssue, po.supplierName,
        po.items.map((i: any) => i.itemName).join('; '),
        po.items.length, po.totalAmount, po.paymentTerms,
        po.eta, po.dueDate, daysToETA,
        po.deliveryStatus, po.paymentStatus,
        po.totalAmount - po.amountPaid,
        po.incoterms, po.projectReference || '',
        po.items.some((i: any) => i.isService) ? 'Yes' : 'No',
      ];
    });

  return [headers, ...rows];
}

// ── 5. Inventory Summary ──────────────────────────────────────
function buildInventorySummary(p: ReportParams): any[][] {
  const headers = [
    'Stock ID', 'Item ID', 'Item Name', 'Category', 'Unit',
    'Current Stock', 'Reserved Stock', 'Available Stock',
    'Reorder Point', 'Max Stock', 'Utilisation %',
    'Stock Status', 'Location', 'Last Updated', 'Last GRN'
  ];

  const rows = p.stockItems.map(s => {
    const available = s.currentStock - s.reservedStock;
    const utilisation = Math.round((s.currentStock / s.maxStock) * 100);
    const status = s.currentStock === 0 ? 'Out of Stock'
      : s.currentStock <= s.reorderPoint ? 'Low Stock'
      : s.currentStock >= s.maxStock * 0.85 ? 'At Max'
      : 'In Stock';
    return [
      s.id, s.itemId, s.itemName, s.category, s.unit,
      s.currentStock, s.reservedStock, available,
      s.reorderPoint, s.maxStock, utilisation,
      status, s.location, s.lastUpdated, s.lastGRNId || '',
    ];
  });

  return [headers, ...rows];
}

// ── 6. KPI Executive Summary ──────────────────────────────────
function buildKPISummary(p: ReportParams): any[][] {
  const total = p.purchaseOrders.reduce((s, po) => s + po.totalAmount, 0);
  const paid  = p.purchaseOrders.reduce((s, po) => s + po.amountPaid, 0);
  const outstanding = total - paid;
  const prefIds = new Set(p.suppliers.filter(s => s.preferred).map(s => s.id));
  const managedSpend = p.purchaseOrders.filter(po => prefIds.has(po.supplierId)).reduce((s, po) => s + po.totalAmount, 0);
  const avgDelivery  = Math.round(p.suppliers.reduce((s, sup) => s + sup.kpis.deliveryPerformance, 0) / p.suppliers.length);
  const avgCycle = (() => {
    const delivered = p.purchaseOrders.filter(po => po.deliveryStatus === 'Delivered');
    if (!delivered.length) return 0;
    return Math.round(delivered.reduce((s, po) => s + Math.max(0, (new Date(po.eta).getTime() - new Date(po.dateOfIssue).getTime()) / 86400000), 0) / delivered.length);
  })();
  const emergency = Math.round((p.purchaseOrders.filter(po => Math.max(0, (new Date(po.eta).getTime() - new Date(po.dateOfIssue).getTime()) / 86400000) < 7).length / p.purchaseOrders.length) * 100);
  const outOfStock = p.stockItems.filter(s => s.currentStock === 0).length;
  const lowStock   = p.stockItems.filter(s => s.currentStock > 0 && s.currentStock <= s.reorderPoint).length;

  return [
    ['KPI EXECUTIVE SUMMARY', '', companyInfo.name],
    ['Report Generated', new Date().toLocaleDateString('en-AE')],
    ['Period', `All Time`],
    [''],
    ['PROCUREMENT KPIs',            'Value',                 'Target',    'Status'],
    ['Total Procurement Spend',      `$${total.toLocaleString()}`,   '',        ''],
    ['Total Paid',                   `$${paid.toLocaleString()}`,    '',        ''],
    ['Outstanding Payables',         `$${outstanding.toLocaleString()}`, '',   outstanding > 50000 ? 'Action Required' : 'OK'],
    ['Avg Delivery Performance',     `${avgDelivery}%`,              '≥95%',   avgDelivery >= 95 ? 'On Target' : avgDelivery >= 88 ? 'Monitor' : 'Below Target'],
    ['Spend Under Management',       `${Math.round((managedSpend / total) * 100)}%`, '≥80%', (managedSpend/total) >= 0.8 ? 'On Target' : 'Below Target'],
    ['Avg PO Cycle Time',            `${avgCycle} days`,             '≤21d',   avgCycle <= 21 ? 'On Target' : 'Review'],
    ['Emergency PO Ratio',           `${emergency}%`,                '≤15%',   emergency <= 15 ? 'On Target' : 'Alert'],
    ['Active Suppliers',             p.suppliers.length,             '',        ''],
    ['Preferred Suppliers',          p.suppliers.filter(s => s.preferred).length, '', ''],
    ['High-Risk Suppliers',          p.suppliers.filter(s => riskLabel(s.kpis) === 'High').length, '0', p.suppliers.some(s => riskLabel(s.kpis) === 'High') ? 'Action Required' : 'OK'],
    [''],
    ['INVENTORY KPIs',              'Value', 'Target', 'Status'],
    ['Total SKUs',                   p.stockItems.length, '', ''],
    ['Out of Stock Items',           outOfStock, '0', outOfStock > 0 ? 'Action Required' : 'OK'],
    ['Low Stock Items',              lowStock, '0', lowStock > 0 ? 'Monitor' : 'OK'],
    ['Total Units in Stock',         p.stockItems.reduce((s: number, i: any) => s + i.currentStock, 0), '', ''],
  ];
}

// ── Master export function ─────────────────────────────────────
export async function exportManagementReport(
  type: ReportType,
  params: ReportParams,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Loading Excel engine...');
  const XLSX: any = await getXLSX();
  if (!XLSX) { alert('Excel library could not be loaded.'); return; }

  onProgress?.('Generating report...');
  const wb = XLSX.utils.book_new();
  const today = new Date().toISOString().split('T')[0];

  const reportMap: Record<ReportType, { fn: () => any[][]; sheetName: string; colWidths: number[] }> = {
    'spend-analysis': {
      fn: () => buildSpendAnalysis(params),
      sheetName: 'Spend Analysis',
      colWidths: [10, 14, 26, 10, 30, 12, 8, 12, 14, 14, 16, 16, 16, 18, 10, 10, 18, 12, 6],
    },
    'supplier-scorecard': {
      fn: () => buildSupplierScorecard(params),
      sheetName: 'Supplier Scorecard',
      colWidths: [10, 26, 18, 10, 14, 18, 14, 14, 14, 14, 14, 12, 10, 16, 14, 12, 12, 12],
    },
    'payment-aging': {
      fn: () => buildPaymentAging(params),
      sheetName: 'Payment Aging',
      colWidths: [10, 26, 16, 16, 16, 12, 12, 18, 14, 16, 16, 18, 16, 16],
    },
    'open-pos': {
      fn: () => buildOpenPOs(params),
      sheetName: 'Open POs',
      colWidths: [10, 14, 26, 40, 10, 14, 16, 12, 12, 12, 16, 16, 16, 10, 18, 10],
    },
    'inventory-summary': {
      fn: () => buildInventorySummary(params),
      sheetName: 'Inventory Summary',
      colWidths: [10, 10, 30, 14, 8, 14, 14, 16, 14, 12, 14, 14, 18, 14, 10],
    },
    'kpi-executive': {
      fn: () => buildKPISummary(params),
      sheetName: 'KPI Executive Summary',
      colWidths: [36, 24, 14, 20],
    },
  };

  const config = reportMap[type];
  const data = config.fn();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = config.colWidths.map(wch => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, config.sheetName);

  // Add metadata sheet
  const metaSheet = XLSX.utils.aoa_to_sheet([
    ['Report Type',       config.sheetName],
    ['Generated By',      'ProcureIQ Platform'],
    ['Company',           companyInfo.name],
    ['Generated At',      new Date().toLocaleString('en-AE')],
    ['Date Range',        `${params.dateFrom || 'All'} — ${params.dateTo || 'All'}`],
    ['Power BI Ready',    'Yes — use flat table import'],
    ['Rows',              data.length - 1],
  ]);
  XLSX.utils.book_append_sheet(wb, metaSheet, 'Metadata');

  const fileName = `ProcureIQ_${type.replace(/-/g, '_')}_${today}.xlsx`;
  XLSX.writeFile(wb, fileName);
  onProgress?.('Done');
}

// ── All-in-one full report ─────────────────────────────────────
export async function exportFullReport(
  params: ReportParams,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Loading Excel engine...');
  const XLSX: any = await getXLSX();
  if (!XLSX) { alert('Excel library could not be loaded.'); return; }

  const today = new Date().toISOString().split('T')[0];
  const wb = XLSX.utils.book_new();

  const sheets: { type: ReportType; name: string; colW: number[] }[] = [
    { type: 'kpi-executive',    name: '📊 KPI Summary',      colW: [36, 24, 14, 20] },
    { type: 'spend-analysis',   name: '💰 Spend Analysis',   colW: [10,14,26,10,30,12,8,12,14,14,16,16,16,18,10,10,18,12,6] },
    { type: 'supplier-scorecard', name: '⭐ Suppliers',       colW: [10,26,18,10,14,18,14,14,14,14,14,12,10,16,14,12,12,12] },
    { type: 'payment-aging',    name: '📅 Payment Aging',    colW: [10,26,16,16,16,12,12,18,14,16,16,18,16,16] },
    { type: 'open-pos',         name: '📋 Open POs',         colW: [10,14,26,40,10,14,16,12,12,12,16,16,16,10,18,10] },
    { type: 'inventory-summary', name: '📦 Inventory',       colW: [10,10,30,14,8,14,14,16,14,12,14,14,18,14,10] },
  ];

  const reportFns: Record<ReportType, () => any[][]> = {
    'kpi-executive':     () => buildKPISummary(params),
    'spend-analysis':    () => buildSpendAnalysis(params),
    'supplier-scorecard':() => buildSupplierScorecard(params),
    'payment-aging':     () => buildPaymentAging(params),
    'open-pos':          () => buildOpenPOs(params),
    'inventory-summary': () => buildInventorySummary(params),
  };

  sheets.forEach(({ type, name, colW }: any, i: number) => {
    onProgress?.(`Building sheet ${i + 1}/6: ${name}...`);
    const data = (reportFns as any)[type]();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = colW.map((wch: number) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, `ProcureIQ_Full_Report_${today}.xlsx`);
  onProgress?.('Done');
}
