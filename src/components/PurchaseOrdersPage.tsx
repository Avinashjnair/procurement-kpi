'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search, ChevronDown, ArrowLeft, Copy, XCircle,
  DollarSign, Download, Printer, Wrench,
  FileText, FileSpreadsheet, Check
} from 'lucide-react';
import type { POStatus } from '@/types';
import { exportCsv } from '@/utils/exportCsv';
import { exportPOAsPDF } from '@/utils/poPdfExport';
import { exportPOAsExcel } from '@/utils/poExcelExport';
import { companyInfo } from '@/data/mockData';

const ALL_STATUSES: POStatus[] = ['Draft', 'Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled'];

// ── Status dropdown ──
function StatusDropdown({ currentStatus, onStatusChange, onCancel }: {
  currentStatus: POStatus;
  onStatusChange: (s: POStatus) => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="status-dropdown">
      <button className={`badge ${currentStatus.toLowerCase()}`}
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span className="badge-dot" />{currentStatus}<ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div className="status-dropdown-menu">
            {ALL_STATUSES.filter(s => s !== 'Cancelled').map(status => (
              <button key={status} className="status-dropdown-item"
                onClick={e => { e.stopPropagation(); onStatusChange(status); setOpen(false); }}>
                <span className={`badge ${status.toLowerCase()}`} style={{ transform: 'scale(0.9)' }}>
                  <span className="badge-dot" />{status}
                </span>
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
            <button className="status-dropdown-item"
              onClick={e => { e.stopPropagation(); setOpen(false); onCancel(); }}
              style={{ color: 'var(--accent-rose)' }}>
              <XCircle size={13} /> Cancel PO…
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Cancel PO modal ──
function CancelModal({ poId, onClose }: { poId: string; onClose: () => void }) {
  const { cancelPO } = useApp();
  const [reason, setReason] = useState('');
  const handle = () => { if (reason.trim()) { cancelPO(poId, reason.trim()); onClose(); } };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Cancel Purchase Order</h3>
          <button className="modal-close" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Please provide a reason for cancellation. This will be stored on the PO record.
        </p>
        <div className="form-group">
          <label className="form-label">Cancellation Reason *</label>
          <textarea className="form-input" rows={3} value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g., Supplier failed quality check. Re-issuing to alternative supplier." />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Go Back</button>
          <button className="btn btn-danger" onClick={handle} disabled={!reason.trim()}>
            <XCircle size={14} /> Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Record Payment modal ──
function PaymentModal({ poId, totalAmount, amountPaid, onClose }: {
  poId: string; totalAmount: number; amountPaid: number; onClose: () => void;
}) {
  const { updatePOPayment } = useApp();
  const outstanding = totalAmount - amountPaid;
  const [amount, setAmount] = useState(String(outstanding));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handle = () => {
    const paid = Math.min(totalAmount, amountPaid + parseFloat(amount));
    const status = paid >= totalAmount ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    updatePOPayment(poId, status, paid, date);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Record Payment</h3>
          <button className="modal-close" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, padding: 12, background: 'rgba(99,102,241,0.05)', borderRadius: 10 }}>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total</div><div style={{ fontWeight: 700, color: '#f1f5f9' }}>${totalAmount.toLocaleString()}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Outstanding</div><div style={{ fontWeight: 700, color: '#f43f5e' }}>${outstanding.toLocaleString()}</div></div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} min="0" max={outstanding} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={!amount || parseFloat(amount) <= 0}>
            <DollarSign size={14} /> Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PO Detail page ──
function PODetail({ poId }: { poId: string }) {
  const { purchaseOrders, items, suppliers, setSelectedPOId, updatePOStatus, duplicatePO, processApprovalStep, currentUser } = useApp();
  const [cancelModal, setCancelModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  const po = purchaseOrders.find(p => p.id === poId);
  const supplier = suppliers.find(s => s.id === po?.supplierId);

  if (!po) return <p>PO not found.</p>;

  // Check if current user can approve the current step
  const currentStep = po.approvalSteps[po.currentApprovalStep];
  const canApprove = currentUser && currentStep && currentStep.role === currentUser.role && currentStep.status === 'Pending';
  const isDraft = po.deliveryStatus === 'Draft';

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    try {
      setExportLoading('Generating PDF...');
      await exportPOAsPDF(po, supplier);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading('Generating Excel...');
      await exportPOAsExcel(po, supplier);
    } catch (err) {
      console.error(err);
      alert('Failed to generate Excel');
    } finally {
      setExportLoading(null);
    }
  };

  const handleSubmitForApproval = () => {
    updatePOStatus(po.id, 'Pending');
  };

  return (
    <div>
      {cancelModal  && <CancelModal  poId={po.id} onClose={() => setCancelModal(false)} />}
      {paymentModal && <PaymentModal poId={po.id} totalAmount={po.totalAmount} amountPaid={po.amountPaid} onClose={() => setPaymentModal(false)} />}

      <button className="detail-back" onClick={() => setSelectedPOId(null)}>
        <ArrowLeft size={16} /> Back to Purchase Orders
      </button>

      {/* PO Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{po.id}</h2>
            <span className={`badge ${po.deliveryStatus.toLowerCase()}`}><span className="badge-dot" />{po.deliveryStatus}</span>
            <span className={`badge ${po.paymentStatus.toLowerCase()}`}>{po.paymentStatus}</span>
            {po.items.some(i => i.isService) && (
              <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,background:'rgba(139,92,246,0.12)',color:'#a78bfa' }}>
                <Wrench size={11} /> Service PO
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Issued {po.dateOfIssue} · {po.supplierName}
            {po.revisionNumber && ` · Rev. ${po.revisionNumber}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isDraft && (
            <button className="btn btn-primary btn-sm" onClick={handleSubmitForApproval}>
              Submit for Approval
            </button>
          )}
          {po.deliveryStatus !== 'Cancelled' && po.paymentStatus !== 'Paid' && po.deliveryStatus !== 'Draft' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setPaymentModal(true)}>
              <DollarSign size={13} /> Record Payment
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => { duplicatePO(po.id); setSelectedPOId(null); }}>
            <Copy size={13} /> Duplicate
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF} disabled={!!exportLoading}>
            <FileText size={13} /> {exportLoading === 'Generating PDF...' ? 'Generating...' : 'Export PDF'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportExcel} disabled={!!exportLoading}>
            <FileSpreadsheet size={13} /> {exportLoading === 'Generating Excel...' ? 'Generating...' : 'Export Excel'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handlePrint}>
            <Printer size={13} /> Print
          </button>
          {po.deliveryStatus !== 'Cancelled' && po.deliveryStatus !== 'Delivered' && (
            <button className="btn btn-danger btn-sm" onClick={() => setCancelModal(true)}>
              <XCircle size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Cancellation reason */}
      {po.cancellationReason && (
        <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 10, background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', borderLeft: '3px solid #f43f5e' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cancellation Reason</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{po.cancellationReason}</p>
        </div>
      )}

      {/* Approval Timeline & Match Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Approval Workflow</div>
            {canApprove && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ height: 32, fontSize: 12, minWidth: 150 }} 
                  placeholder="Review comments..." 
                  value={approvalComment} 
                  onChange={e => setApprovalComment(e.target.value)} 
                />
                <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                  onClick={() => { processApprovalStep(po.id, po.currentApprovalStep, 'Approved', approvalComment); setApprovalComment(''); }}>
                  Approve
                </button>
                <button className="btn btn-sm btn-danger"
                  onClick={() => { processApprovalStep(po.id, po.currentApprovalStep, 'Rejected', approvalComment); setApprovalComment(''); }}>
                  Reject
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '20px 0' }}>
            {(po.approvalSteps || []).map((step, idx) => {
              const isLast = idx === (po.approvalSteps?.length || 0) - 1;
              const isCurrent = idx === po.currentApprovalStep;
              const statusColor = step.status === 'Approved' ? '#10b981' : step.status === 'Rejected' ? '#f43f5e' : isCurrent ? 'var(--accent-indigo)' : '#94a3b8';
              
              return (
                <React.Fragment key={idx}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', 
                      background: step.status === 'Approved' ? 'rgba(16,185,129,0.1)' : isCurrent ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)', 
                      border: `2px solid ${statusColor}`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: statusColor, fontSize: 11, fontWeight: 700, zIndex: 1,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(99,102,241,0.1)' : 'none'
                    }}>
                      {step.status === 'Approved' ? <Check size={16} /> : idx + 1}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{step.role.toUpperCase()}</div>
                      <div style={{ fontSize: 10, color: statusColor, fontWeight: isCurrent ? 600 : 400 }}>{step.status}</div>
                      {step.userName && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{step.userName}</div>}
                    </div>
                  </div>
                  {!isLast && (
                    <div style={{ flex: 1, height: 2, background: step.status === 'Approved' ? '#10b981' : 'rgba(255,255,255,0.05)', marginTop: 16, margin: '16px -16px 0' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>3-Way Match Status</div>
          <div style={{ 
            padding: '12px 20px', borderRadius: 12, background: po.matchStatus === 'Full Match' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${po.matchStatus === 'Full Match' ? '#10b981' : '#f59e0b'}`, color: po.matchStatus === 'Full Match' ? '#34d399' : '#fbbf24',
            fontWeight: 700, fontSize: 15
          }}>
            {po.matchStatus || 'Pending Match'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>PO ↔ GRN ↔ Invoice</div>
        </div>
      </div>

      {/* Details grid */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            ['Supplier',         po.supplierName],
            ['Date of Issue',    po.dateOfIssue],
            ['Due Date',         po.dueDate],
            ['ETA / Completion', po.eta],
            ['Payment Terms',    po.paymentTerms],
            ['Incoterms',        po.incoterms],
            ['Amount Paid',      `$${po.amountPaid.toLocaleString()}`],
            ['Outstanding',      `$${(po.totalAmount - po.amountPaid).toLocaleString()}`],
            ...(po.projectReference ? [['Project Ref.', po.projectReference] as [string, string]] : []),
            ...(po.approvalAuthority ? [['Approved By', po.approvalAuthority] as [string, string]] : []),
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment timeline */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Payment Status</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12, height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(99,102,241,0.1)' }}>
          <div style={{ width: `${(po.amountPaid / po.totalAmount) * 100}%`, height: '100%', background: po.paymentStatus === 'Paid' ? '#10b981' : '#6366f1', transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
          <span>Paid: <strong style={{ color: '#f1f5f9' }}>${po.amountPaid.toLocaleString()}</strong></span>
          <span>Outstanding: <strong style={{ color: po.amountPaid < po.totalAmount ? '#f43f5e' : '#10b981' }}>${(po.totalAmount - po.amountPaid).toLocaleString()}</strong></span>
          <span>Total: <strong style={{ color: '#f1f5f9' }}>${po.totalAmount.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Line items */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Line Items</div></div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              {po.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.isService && <Wrench size={12} style={{ color: '#a78bfa' }} />}
                      <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.itemName}</span>
                    </div>
                    {item.isService && item.serviceDetails && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 18 }}>
                        {item.serviceDetails.billingType} · {item.serviceDetails.duration}
                      </div>
                    )}
                  </td>
                  <td>{item.quantity.toLocaleString()}</td>
                  <td className="font-mono">${item.unitPrice.toFixed(2)}</td>
                  <td className="font-mono" style={{ fontWeight: 600, color: '#f1f5f9' }}>
                    ${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grand Total</td>
                <td className="font-mono" style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent-indigo)' }}>${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Audit Trail (Roadmap Feature) */}
      <div className="card">
        <div className="card-header"><div className="card-title">Audit Trail & History</div></div>
        <div style={{ marginTop: 10 }}>
          {(useApp().auditLogs.filter(log => log.entityId === po.id) || []).map((log, idx) => (
            <div key={log.id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: idx === (useApp().auditLogs.filter(l => l.entityId === po.id).length - 1) ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ minWidth: 100, fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{log.action} · {log.actorName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{log.description}</div>
              </div>
            </div>
          ))}
          {useApp().auditLogs.filter(log => log.entityId === po.id).length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>No historical logs available for this PO.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main PO List page ──
export default function PurchaseOrdersPage() {
  const { purchaseOrders, updatePOStatus, setSelectedPOId, selectedPOId, duplicatePO } = useApp();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('All');
  const [sortField, setSortField]   = useState('dateOfIssue');
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode]     = useState<'table' | 'kanban'>('table');
  const [cancelModal, setCancelModal] = useState<string | null>(null);


  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let result = purchaseOrders.filter(po => {
      const ms = po.id.toLowerCase().includes(search.toLowerCase()) ||
                 po.supplierName.toLowerCase().includes(search.toLowerCase());
      const mst = statusFilter === 'All' || po.deliveryStatus === statusFilter;
      return ms && mst;
    });
    result.sort((a, b) => {
      const av = sortField === 'totalAmount' ? a.totalAmount : (a as any)[sortField] as string;
      const bv = sortField === 'totalAmount' ? b.totalAmount : (b as any)[sortField] as string;
      return (av < bv ? -1 : av > bv ? 1 : 0) * (sortDir === 'asc' ? 1 : -1);
    });
    return result;
  }, [purchaseOrders, search, statusFilter, sortField, sortDir]);

  const handleExport = () => {
    exportCsv('purchase_orders', filtered.map(po => ({
      ID: po.id, Date: po.dateOfIssue, Supplier: po.supplierName,
      Items: po.items.map(i => i.itemName).join('; '),
      Total: po.totalAmount, AmountPaid: po.amountPaid, PaymentTerms: po.paymentTerms,
      DueDate: po.dueDate, DeliveryStatus: po.deliveryStatus,
      PaymentStatus: po.paymentStatus, ETA: po.eta, Incoterms: po.incoterms,
      ProjectRef: po.projectReference || '',
      CancellationReason: po.cancellationReason || '',
    })));
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span style={{ opacity: sortField === field ? 1 : 0.3, fontSize: 10, marginLeft: 4 }}>
      {sortField === field && sortDir === 'asc' ? '▲' : '▼'}
    </span>
  );

  const kanbanCols: POStatus[] = ['Pending', 'Approved', 'Shipped', 'Delivered'];

  if (selectedPOId) return <PODetail poId={selectedPOId} />;

  return (
    <div>
      {cancelModal && <CancelModal poId={cancelModal} onClose={() => setCancelModal(null)} />}

      <div className="page-header">
        <h2>Purchase Orders</h2>
        <p>Track and manage the entire PO lifecycle</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>📋 Table</button>
          <button className={`tab-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>📌 Kanban</button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input type="text" className="search-input" placeholder="Search PO# or supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {viewMode === 'table' ? (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>PO # <SortIcon field="id" /></th>
                  <th onClick={() => handleSort('dateOfIssue')}>Date <SortIcon field="dateOfIssue" /></th>
                  <th onClick={() => handleSort('supplierName')}>Supplier <SortIcon field="supplierName" /></th>
                  <th>Items</th>
                  <th onClick={() => handleSort('totalAmount')}>Amount <SortIcon field="totalAmount" /></th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th onClick={() => handleSort('dueDate')}>Due <SortIcon field="dueDate" /></th>
                  <th>ETA</th>
                  <th>Incoterms</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(po => (
                  <tr key={po.id} className="clickable" onClick={() => setSelectedPOId(po.id)}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                      {po.id}
                      {po.items.some(i => i.isService) && <Wrench size={11} style={{ color: '#a78bfa', marginLeft: 5 }} />}
                    </td>
                    <td>{po.dateOfIssue}</td>
                    <td>{po.supplierName}</td>
                    <td><span className="truncate" style={{ maxWidth: 160 }}>{po.items.map(i => i.itemName).join(', ')}</span></td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>${po.totalAmount.toLocaleString()}</td>
                    <td><span className={`badge ${po.paymentStatus.toLowerCase()}`}>{po.paymentStatus}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <StatusDropdown
                        currentStatus={po.deliveryStatus}
                        onStatusChange={s => updatePOStatus(po.id, s)}
                        onCancel={() => setCancelModal(po.id)}
                      />
                    </td>
                    <td>{po.dueDate}</td>
                    <td>{po.eta}</td>
                    <td><span className="badge approved">{po.incoterms}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" title="Duplicate" onClick={() => duplicatePO(po.id)}>
                        <Copy size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kanbanCols.length}, 1fr)`, gap: 16 }}>
          {kanbanCols.map(status => {
            const col = purchaseOrders.filter(po => po.deliveryStatus === status);
            return (
              <div key={status}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-color)' }}>
                  <span className={`badge ${status.toLowerCase()}`}><span className="badge-dot" />{status}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{col.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.map(po => (
                    <div key={po.id} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setSelectedPOId(po.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{po.id}</span>
                        <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>${po.totalAmount.toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{po.supplierName}</p>
                      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>ETA: {po.eta}</span>
                        <span>·</span>
                        <span className={`badge ${po.paymentStatus.toLowerCase()}`} style={{ fontSize: 10, padding: '2px 6px' }}>{po.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                  {col.length === 0 && <div style={{ textAlign: 'center', padding: 24, fontSize: 12, color: 'var(--text-muted)' }}>No POs</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
