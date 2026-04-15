'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/types';
import type { PaymentRecord, PaymentMethod, PaymentRecordStatus } from '@/types';
import {
  DollarSign, Upload, Search, CheckCircle2, Clock, AlertTriangle,
  XCircle, ChevronDown, Filter, Download, FileText, CreditCard,
  Building2, Check, X, Eye, Receipt
} from 'lucide-react';
import { exportCsv } from '@/utils/exportCsv';

const PAYMENT_METHODS: PaymentMethod[] = [
  'Bank Transfer', 'Cheque', 'Cash', 'Letter of Credit', 'Online Payment',
];

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  'Bank Transfer':    <Building2 size={13} />,
  'Cheque':           <FileText size={13} />,
  'Cash':             <DollarSign size={13} />,
  'Letter of Credit': <CreditCard size={13} />,
  'Online Payment':   <CreditCard size={13} />,
};

// ── Aging bucket helpers ─────────────────────────────────────
function getAgingBucket(dueDate: string, paid: boolean): string {
  if (paid) return 'paid';
  const days = Math.ceil((new Date().getTime() - new Date(dueDate).getTime()) / 86400000);
  if (days < 0)   return 'current';
  if (days <= 30)  return '1-30';
  if (days <= 60)  return '31-60';
  if (days <= 90)  return '61-90';
  return '90+';
}

const AGING_META: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'Paid',         color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  current: { label: 'Current',      color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  '1-30':  { label: '1–30 days',    color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'  },
  '31-60': { label: '31–60 days',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  '61-90': { label: '61–90 days',   color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  '90+':   { label: '90+ days',     color: '#f43f5e', bg: 'rgba(244,63,94,0.1)'  },
};

// ── Record Payment Modal ─────────────────────────────────────
function RecordPaymentModal({ poId, onClose }: { poId: string; onClose: () => void }) {
  const { purchaseOrders, recordPayment, currentUser } = useApp();
  const po = purchaseOrders.find(p => p.id === poId);
  if (!po) return null;

  const outstanding = po.totalAmount - po.amountPaid;
  const [amount,     setAmount]     = useState(outstanding.toFixed(2));
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [method,     setMethod]     = useState<PaymentMethod>('Bank Transfer');
  const [reference,  setReference]  = useState('');
  const [notes,      setNotes]      = useState('');
  const [receiptName,setReceiptName]= useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reference) return;
    recordPayment({
      poId,
      amount: parseFloat(amount),
      currency: 'USD',
      paymentDate: date,
      referenceNumber: reference,
      paymentMethod: method,
      recordedBy: currentUser?.id || 'USR-006',
      recordedByName: currentUser?.name || 'Finance Team',
      receiptFileName: receiptName || undefined,
      receiptFileSize: receiptName ? '0.8 MB' : undefined,
      notes: notes || undefined,
      status: currentUser?.role === 'manager' ? 'Approved' : 'Pending Approval',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Record Payment — {poId}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* PO summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '12px 14px', marginBottom: 20, borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>PO Total</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>${po.totalAmount.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Paid to Date</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>${po.amountPaid.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Outstanding</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: outstanding > 0 ? '#f43f5e' : '#10b981' }}>${outstanding.toLocaleString()}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Amount ($) *</label>
              <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" max={outstanding} step="0.01" required />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select className="form-select" value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} required>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bank / Transaction Reference *</label>
              <input type="text" className="form-input" value={reference} onChange={e => setReference(e.target.value)} required placeholder="e.g. TRF-2026-XXXX" />
            </div>
          </div>

          {/* Receipt upload */}
          <div className="form-group">
            <label className="form-label">Payment Receipt (optional)</label>
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: 'rgba(99,102,241,0.04)', border: '1px dashed var(--border-color)',
                borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-indigo)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>
                <Upload size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: receiptName ? '#f1f5f9' : 'var(--text-muted)' }}>
                  {receiptName || 'Upload receipt PDF or image'}
                </span>
                {receiptName && <CheckCircle2 size={14} style={{ color: '#10b981', marginLeft: 'auto' }} />}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Final payment, Part of milestone schedule..." />
          </div>

          {currentUser?.role === 'finance' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 16, borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 12, color: '#f59e0b' }}>
              <Clock size={13} />
              This payment will be submitted for manager approval before being applied.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!amount || !reference}>
              <Receipt size={14} /> Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Payment History Panel ─────────────────────────────────────
function PaymentHistory({ poId, onClose }: { poId: string; onClose: () => void }) {
  const { purchaseOrders, currentUser, approvePaymentRecord } = useApp();
  const po = purchaseOrders.find(p => p.id === poId);
  if (!po) return null;
  const records = po.paymentRecords || [];

  return (
    <div className="card" style={{ marginTop: 16, borderColor: 'rgba(99,102,241,0.2)' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Payment History — {poId}</div>
          <div className="card-subtitle">{records.length} record{records.length !== 1 ? 's' : ''} · {po.supplierName}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No payments recorded yet.
        </div>
      ) : (
        <div>
          {records.map((rec, i) => (
            <div key={rec.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < records.length - 1 ? '1px solid rgba(99,102,241,0.06)' : 'none', alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {METHOD_ICONS[rec.paymentMethod]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>${rec.amount.toLocaleString()}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: rec.status === 'Approved' ? 'rgba(16,185,129,0.1)' : rec.status === 'Rejected' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
                    color: rec.status === 'Approved' ? '#10b981' : rec.status === 'Rejected' ? '#f43f5e' : '#f59e0b',
                  }}>
                    {rec.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  {rec.paymentMethod} · {rec.referenceNumber} · {rec.paymentDate}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Recorded by {rec.recordedByName}
                  {rec.receiptFileName && (
                    <span style={{ marginLeft: 8, color: '#6366f1', cursor: 'pointer' }}>
                      <Receipt size={10} style={{ display: 'inline', marginRight: 3 }} />
                      {rec.receiptFileName}
                    </span>
                  )}
                </div>
                {rec.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>{rec.notes}</div>}

                {/* Manager approval controls */}
                {rec.status === 'Pending Approval' && can(currentUser, 'approve_payment') && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 11 }}
                      onClick={() => approvePaymentRecord(poId, rec.id, 'Approved')}>
                      <Check size={11} /> Approve
                    </button>
                    <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }}
                      onClick={() => approvePaymentRecord(poId, rec.id, 'Rejected')}>
                      <X size={11} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Finance Page ─────────────────────────────────────────
export default function FinancePage() {
  const { purchaseOrders, currentUser } = useApp();
  const [search,        setSearch]        = useState('');
  const [agingFilter,   setAgingFilter]   = useState('all');
  const [recordingPO,   setRecordingPO]   = useState<string | null>(null);
  const [viewHistoryPO, setViewHistoryPO] = useState<string | null>(null);

  // Only show POs that have financial relevance (not cancelled drafts with no spend)
  const financialPOs = purchaseOrders.filter(po =>
    po.deliveryStatus !== 'Draft' && po.deliveryStatus !== 'Cancelled'
  );

  const filtered = useMemo(() => financialPOs.filter(po => {
    const ms = po.id.toLowerCase().includes(search.toLowerCase()) ||
               po.supplierName.toLowerCase().includes(search.toLowerCase());
    const bucket = getAgingBucket(po.dueDate, po.paymentStatus === 'Paid');
    const ma = agingFilter === 'all' || bucket === agingFilter;
    return ms && ma;
  }), [financialPOs, search, agingFilter]);

  // Aging summary totals
  const agingSummary = useMemo(() => {
    const buckets: Record<string, number> = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    financialPOs.forEach(po => {
      if (po.paymentStatus === 'Paid') return;
      const outstanding = po.totalAmount - po.amountPaid;
      const bucket = getAgingBucket(po.dueDate, false);
      if (bucket !== 'paid') buckets[bucket] = (buckets[bucket] || 0) + outstanding;
    });
    return buckets;
  }, [financialPOs]);

  const totalOutstanding = Object.values(agingSummary).reduce((a, b) => a + b, 0);
  const totalPaid        = financialPOs.filter(p => p.paymentStatus === 'Paid').reduce((s, p) => s + p.amountPaid, 0);
  const pendingApprovals = financialPOs.reduce((count, po) => count + (po.paymentRecords?.filter(r => r.status === 'Pending Approval').length || 0), 0);

  const handleExport = () => exportCsv('ap_aging_report', filtered.map(po => ({
    'PO ID': po.id, Supplier: po.supplierName, 'PO Total': po.totalAmount,
    'Amount Paid': po.amountPaid, 'Outstanding': po.totalAmount - po.amountPaid,
    'Due Date': po.dueDate, 'Payment Status': po.paymentStatus,
    'Delivery Status': po.deliveryStatus, 'Aging Bucket': AGING_META[getAgingBucket(po.dueDate, po.paymentStatus === 'Paid')]?.label,
    'Payment Terms': po.paymentTerms, 'Project Ref': po.projectReference || '',
    'Payment Records': (po.paymentRecords || []).length,
  })));

  return (
    <div>
      {recordingPO && <RecordPaymentModal poId={recordingPO} onClose={() => setRecordingPO(null)} />}

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>Finance &amp; Accounts Payable</h2>
            <p>Record payments, upload receipts, and track outstanding balances</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={13} /> Export Aging Report
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="metric-card indigo">
          <div className="metric-icon indigo"><DollarSign size={20} /></div>
          <div className="metric-value" style={{ fontSize: 22 }}>${(totalOutstanding / 1000).toFixed(1)}K</div>
          <div className="metric-label">Total Outstanding</div>
        </div>
        <div className="metric-card emerald">
          <div className="metric-icon emerald"><CheckCircle2 size={20} /></div>
          <div className="metric-value" style={{ fontSize: 22 }}>${(totalPaid / 1000).toFixed(1)}K</div>
          <div className="metric-label">Total Paid</div>
        </div>
        <div className="metric-card rose">
          <div className="metric-icon rose"><AlertTriangle size={20} /></div>
          <div className="metric-value" style={{ fontSize: 22 }}>${((agingSummary['61-90'] + agingSummary['90+']) / 1000).toFixed(1)}K</div>
          <div className="metric-label">Overdue 60+ days</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon amber"><Clock size={20} /></div>
          <div className="metric-value" style={{ fontSize: 22 }}>{pendingApprovals}</div>
          <div className="metric-label">Pending Approval</div>
        </div>
      </div>

      {/* Aging buckets */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Accounts Payable Aging</div>
          <div className="card-subtitle">Click a bucket to filter</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {(['current', '1-30', '31-60', '61-90', '90+'] as const).map(bucket => {
            const meta = AGING_META[bucket];
            const amount = agingSummary[bucket] || 0;
            const isActive = agingFilter === bucket;
            return (
              <div key={bucket}
                onClick={() => setAgingFilter(isActive ? 'all' : bucket)}
                style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  background: isActive ? meta.bg : 'rgba(99,102,241,0.03)',
                  border: `1px solid ${isActive ? meta.color : 'var(--border-color)'}`,
                  transition: 'all 0.2s',
                }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{meta.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {financialPOs.filter(p => getAgingBucket(p.dueDate, p.paymentStatus === 'Paid') === bucket).length} POs
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <div className="search-wrapper">
          <Search size={16} />
          <input type="text" className="search-input" placeholder="Search PO# or supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={agingFilter} onChange={e => setAgingFilter(e.target.value)}>
          <option value="all">All aging buckets</option>
          {Object.entries(AGING_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {agingFilter !== 'all' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setAgingFilter('all')}>
            <X size={13} /> Clear filter
          </button>
        )}
      </div>

      {/* AP Table */}
      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>PO Total</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Due Date</th>
                <th>Aging</th>
                <th>Status</th>
                <th>Receipts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => {
                const outstanding = po.totalAmount - po.amountPaid;
                const bucket = getAgingBucket(po.dueDate, po.paymentStatus === 'Paid');
                const meta = AGING_META[bucket];
                const receiptCount = (po.paymentRecords || []).filter(r => r.receiptFileName).length;
                const pendingCount = (po.paymentRecords || []).filter(r => r.status === 'Pending Approval').length;
                const isViewingHistory = viewHistoryPO === po.id;

                return (
                  <React.Fragment key={po.id}>
                    <tr style={{ background: isViewingHistory ? 'rgba(99,102,241,0.04)' : undefined }}>
                      <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{po.id}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#f1f5f9', fontSize: 13 }}>{po.supplierName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{po.paymentTerms}</div>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>${po.totalAmount.toLocaleString()}</td>
                      <td className="font-mono" style={{ color: '#10b981' }}>${po.amountPaid.toLocaleString()}</td>
                      <td className="font-mono" style={{ fontWeight: 700, color: outstanding > 0 ? '#f43f5e' : '#10b981' }}>
                        ${outstanding.toLocaleString()}
                      </td>
                      <td style={{ fontSize: 13 }}>{po.dueDate}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${po.paymentStatus.toLowerCase()}`}>
                          <span className="badge-dot" />{po.paymentStatus}
                          {pendingCount > 0 && <span style={{ marginLeft: 5, background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 9 }}>{pendingCount}</span>}
                        </span>
                      </td>
                      <td>
                        {receiptCount > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                            <Receipt size={12} /> {receiptCount}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" title="Payment history"
                            onClick={() => setViewHistoryPO(isViewingHistory ? null : po.id)}>
                            <Eye size={13} />
                          </button>
                          {can(currentUser, 'record_payment') && po.paymentStatus !== 'Paid' && (
                            <button className="btn btn-primary btn-sm" title="Record payment"
                              onClick={() => setRecordingPO(po.id)}>
                              <DollarSign size={13} /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isViewingHistory && (
                      <tr>
                        <td colSpan={10} style={{ padding: '0 8px 16px', background: 'rgba(99,102,241,0.02)' }}>
                          <PaymentHistory poId={po.id} onClose={() => setViewHistoryPO(null)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <DollarSign size={40} />
            <h3>No records found</h3>
            <p>Try adjusting your search or aging filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
