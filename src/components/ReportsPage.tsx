'use client';
/**
 * ReportsPage.tsx
 * Place at: src/components/ReportsPage.tsx
 *
 * Management reports hub — export PO PDFs, Excel workbooks, and Power BI reports.
 * Add to page.tsx: case 'reports': return <ReportsPage />;
 * Add to Sidebar navItems: { id: 'reports', label: 'Reports', icon: BarChart, permission: 'view_finance_reports', section: 'Finance' }
 */

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Download, FileText, BarChart2, Package, Users,
  DollarSign, Clock, Zap, CheckCircle2, Loader, ChevronRight,
  Table, Printer, PieChart,
} from 'lucide-react';
import { exportManagementReport, exportFullReport, type ReportType } from '@/utils/managementReports';

interface ReportDef {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  powerBI: boolean;
  rows: string;
}

const REPORTS: ReportDef[] = [
  {
    id: 'kpi-executive',
    title: 'KPI Executive Summary',
    description: 'One-page view of all critical procurement KPIs vs targets. Perfect for board meetings and monthly reviews.',
    icon: <BarChart2 size={20} />,
    color: '#6366f1', bg: 'rgba(99,102,241,0.1)',
    powerBI: true, rows: 'Summary table',
  },
  {
    id: 'spend-analysis',
    title: 'Spend Analysis',
    description: 'Every PO line item with supplier, category, project reference, month, quarter and year columns. Power BI pivot-ready.',
    icon: <DollarSign size={20} />,
    color: '#10b981', bg: 'rgba(16,185,129,0.1)',
    powerBI: true, rows: 'One row per line item',
  },
  {
    id: 'supplier-scorecard',
    title: 'Supplier Scorecard',
    description: 'All supplier KPIs, risk levels, spend totals, and PO counts in one flat table. Ideal for quarterly reviews.',
    icon: <Users size={20} />,
    color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',
    powerBI: true, rows: 'One row per supplier',
  },
  {
    id: 'payment-aging',
    title: 'Payment Aging Report',
    description: 'Outstanding payables bucketed by aging — Current, 1–30, 31–60, 61–90, and 90+ days. Finance team essential.',
    icon: <Clock size={20} />,
    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
    powerBI: true, rows: 'One row per PO',
  },
  {
    id: 'open-pos',
    title: 'Open POs & Pipeline',
    description: 'All active purchase orders with ETA, days remaining, outstanding balances, and delivery status.',
    icon: <FileText size={20} />,
    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
    powerBI: true, rows: 'One row per open PO',
  },
  {
    id: 'inventory-summary',
    title: 'Inventory Summary',
    description: 'Current stock levels, reorder points, available vs reserved quantities, and stock status for all SKUs.',
    icon: <Package size={20} />,
    color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',
    powerBI: true, rows: 'One row per SKU',
  },
];

type ExportStatus = 'idle' | 'loading' | 'done' | 'error';

export default function ReportsPage() {
  const { purchaseOrders, suppliers, stockItems, setSelectedPOId, setActivePage } = useApp();
  const [status, setStatus] = useState<Record<string, ExportStatus>>({});
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [fullStatus, setFullStatus] = useState<ExportStatus>('idle');
  const [fullProgress, setFullProgress] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const params = { purchaseOrders, suppliers, stockItems, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };

  const handleExport = async (id: ReportType) => {
    setStatus(s => ({ ...s, [id]: 'loading' }));
    try {
      await exportManagementReport(id, params, msg => setProgress(p => ({ ...p, [id]: msg })));
      setStatus(s => ({ ...s, [id]: 'done' }));
      setTimeout(() => setStatus(s => ({ ...s, [id]: 'idle' })), 3000);
    } catch (e) {
      setStatus(s => ({ ...s, [id]: 'error' }));
    }
  };

  const handleFullExport = async () => {
    setFullStatus('loading');
    try {
      await exportFullReport(params, msg => setFullProgress(msg));
      setFullStatus('done');
      setTimeout(() => setFullStatus('idle'), 4000);
    } catch (e) {
      setFullStatus('error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>Management Reports</h2>
            <p>Export procurement reports in Excel for Power BI, finance reviews, and management presentations</p>
          </div>
          {/* Full report CTA */}
          <button
            className="btn btn-primary"
            onClick={handleFullExport}
            disabled={fullStatus === 'loading'}
            style={{ gap: 8 }}
          >
            {fullStatus === 'loading' ? (
              <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {fullProgress || 'Building...'}</>
            ) : fullStatus === 'done' ? (
              <><CheckCircle2 size={16} /> Downloaded!</>
            ) : (
              <><Table size={16} /> Download All Reports (Full Workbook)</>
            )}
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Filter by Date Range:
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>From</label>
              <input type="date" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>To</label>
              <input type="date" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {(dateFrom || dateTo) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                Clear
              </button>
            )}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {dateFrom || dateTo
              ? `Filtering: ${dateFrom || 'start'} → ${dateTo || 'today'}`
              : 'All time (no filter applied)'}
          </div>
        </div>
      </div>

      {/* Power BI info banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 24,
        borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)'
      }}>
        <PieChart size={18} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          All reports are exported as <strong style={{ color: '#f1f5f9' }}>flat-table Excel format</strong> — 
          open Power BI Desktop, click <em>Get Data → Excel</em>, and select the downloaded file. 
          Each sheet becomes a separate table you can relate and pivot.
        </div>
      </div>

      {/* Report cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {REPORTS.map(report => {
          const s = status[report.id] || 'idle';
          return (
            <div key={report.id} className="card" style={{ border: `1px solid ${report.color}22`, transition: 'all 0.2s' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: report.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: report.color, flexShrink: 0,
                }}>
                  {report.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>{report.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {report.powerBI && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                        Power BI
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: report.bg, color: report.color }}>
                      {report.rows}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
                {report.description}
              </p>

              {/* Stats preview */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {report.id === 'spend-analysis' && (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{purchaseOrders.reduce((s, po) => s + po.items.length, 0)}</span> line items
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>${(purchaseOrders.reduce((s, po) => s + po.totalAmount, 0) / 1000).toFixed(0)}K</span> total spend
                    </div>
                  </>
                )}
                {report.id === 'supplier-scorecard' && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{suppliers.length}</span> suppliers included
                  </div>
                )}
                {report.id === 'payment-aging' && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 700, color: '#f43f5e', fontSize: 14 }}>
                      ${(purchaseOrders.reduce((s, po) => s + (po.totalAmount - po.amountPaid), 0) / 1000).toFixed(1)}K
                    </span> outstanding
                  </div>
                )}
                {report.id === 'open-pos' && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>
                      {purchaseOrders.filter(po => !['Delivered','Cancelled'].includes(po.deliveryStatus)).length}
                    </span> open POs
                  </div>
                )}
                {report.id === 'inventory-summary' && (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{stockItems.length}</span> SKUs
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700, color: '#f43f5e', fontSize: 14 }}>{stockItems.filter(s => s.currentStock === 0).length}</span> out of stock
                    </div>
                  </>
                )}
              </div>

              {/* Download button */}
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center', background: s === 'done' ? 'rgba(16,185,129,0.15)' : undefined, color: s === 'done' ? '#10b981' : undefined }}
                onClick={() => handleExport(report.id)}
                disabled={s === 'loading'}
              >
                {s === 'loading' ? (
                  <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {progress[report.id] || 'Generating...'}</>
                ) : s === 'done' ? (
                  <><CheckCircle2 size={14} /> Downloaded Successfully</>
                ) : s === 'error' ? (
                  <>Error — Try Again</>
                ) : (
                  <><Download size={14} /> Download Excel (.xlsx)</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick PO actions */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">Quick PO Exports</div>
          <div className="card-subtitle">Print or download individual purchase orders</div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>PO #</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {purchaseOrders.slice(0, 8).map(po => (
                <tr key={po.id}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{po.id}</td>
                  <td>{po.supplierName}</td>
                  <td className="font-mono">${po.totalAmount.toLocaleString()}</td>
                  <td><span className={`badge ${po.deliveryStatus.toLowerCase()}`}><span className="badge-dot" />{po.deliveryStatus}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedPOId(po.id); setActivePage('purchase-orders'); }}>
                        <FileText size={12} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
