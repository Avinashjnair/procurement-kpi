'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/types';
import type { GRN, GRNStatus, GRNLineItem } from '@/types';
import { ArrowLeft, Plus, Search, Check, X, Lock, Truck, PackageCheck, AlertTriangle } from 'lucide-react';

const STATUS_META: Record<GRNStatus, { color: string; bg: string; label: string }> = {
  Draft:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Draft' },
  Submitted: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',   label: 'Submitted' },
  Approved:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Approved' },
  Rejected:  { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   label: 'Rejected' },
  Partial:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Partial' },
};

// ── GRN Detail ──
function GRNDetail({ grnId }: { grnId: string }) {
  const { grns, purchaseOrders, currentUser, submitGRN, approveGRN, rejectGRN, setSelectedGRNId } = useApp();
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const grn = grns.find(g => g.id === grnId);
  if (!grn) return null;
  const po = purchaseOrders.find(p => p.id === grn.poId);
  const s = STATUS_META[grn.status];

  return (
    <div>
      <button className="detail-back" onClick={() => setSelectedGRNId(null)}>
        <ArrowLeft size={16} /> Back to GRNs
      </button>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2>{grn.id}</h2>
            <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
            {grn.stockUpdated && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>📦 Stock Updated</span>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Against {grn.poId} · {grn.supplierName} · Created {grn.dateCreated}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {grn.status === 'Draft' && can(currentUser, 'create_grn') && (
            <button className="btn btn-primary btn-sm" onClick={() => submitGRN(grn.id)}>
              <Truck size={13} /> Submit for Approval
            </button>
          )}
          {grn.status === 'Submitted' && can(currentUser, 'approve_grn') && (
            <>
              <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }} onClick={() => approveGRN(grn.id)}>
                <Check size={13} /> Approve & Update Stock
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowReject(true)}>
                <X size={13} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      {showReject && (
        <div style={{ padding: 16, marginBottom: 20, borderRadius: 12, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Rejection Reason *</label>
            <textarea className="form-input" rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="State reason for rejection…" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowReject(false)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={() => { rejectGRN(grn.id, rejectReason); setShowReject(false); }} disabled={!rejectReason.trim()}>Confirm Rejection</button>
          </div>
        </div>
      )}

      {/* GRN Info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
          {[
            ['Purchase Order', grn.poId],
            ['Supplier', grn.supplierName],
            ['Delivery Note #', grn.deliveryNoteNumber || '—'],
            ['Vehicle / AWB', grn.vehicleNumber || '—'],
            ['Created By', grn.createdBy],
            ['Approved By', grn.approvedBy || '—'],
            ['Date Created', grn.dateCreated],
            ['Date Approved', grn.dateApproved || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Received Items</div></div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th><th>Ordered Qty</th><th>Received Qty</th>
                <th>Accepted</th><th>Rejected</th><th>Unit Price</th><th>Accepted Value</th><th>Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {grn.lineItems.map((line, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{line.itemName}</td>
                  <td>{line.orderedQty}</td>
                  <td>{line.receivedQty}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{line.acceptedQty}</td>
                  <td style={{ color: line.rejectedQty > 0 ? '#f43f5e' : 'var(--text-muted)', fontWeight: line.rejectedQty > 0 ? 700 : 400 }}>{line.rejectedQty}</td>
                  <td className="font-mono">${line.unitPrice.toFixed(2)}</td>
                  <td className="font-mono">${(line.acceptedQty * line.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontSize: 12, color: '#f43f5e' }}>{line.rejectionReason || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>Accepted Value Total:</td>
                <td colSpan={2} className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-indigo)', fontSize: 15 }}>
                  ${grn.lineItems.reduce((s, l) => s + l.acceptedQty * l.unitPrice, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {grn.totalRejected > 0 && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={14} style={{ color: '#f43f5e', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#f43f5e' }}>{grn.totalRejected} unit{grn.totalRejected !== 1 ? 's' : ''} rejected. Supplier to be notified for replacement or credit note.</span>
          </div>
        )}
        {grn.notes && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{grn.notes}</p>}
      </div>
    </div>
  );
}

// ── New GRN Modal ──
function NewGRNModal({ onClose }: { onClose: () => void }) {
  const { grns, purchaseOrders, addGRN, currentUser } = useApp();
  const [poId, setPoId] = useState('');
  const [dn, setDN] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Partial<GRNLineItem>[]>([]);

  const eligiblePOs = purchaseOrders.filter(po =>
    ['Approved', 'Shipped'].includes(po.deliveryStatus)
  );

  const selectedPO = purchaseOrders.find(p => p.id === poId);

  // Pre-fill lines when PO selected
  const handlePoChange = (id: string) => {
    setPoId(id);
    const po = purchaseOrders.find(p => p.id === id);
    if (po) {
      setLines(po.items.map((item, i) => ({
        poLineIndex: i,
        itemId: item.itemId,
        itemName: item.itemName,
        orderedQty: item.quantity,
        receivedQty: item.quantity,
        acceptedQty: item.quantity,
        rejectedQty: 0,
        unitPrice: item.unitPrice,
      })));
    }
  };

  const updateLine = (i: number, field: keyof GRNLineItem, val: number | string) =>
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: val };
      if (field === 'receivedQty' || field === 'acceptedQty') {
        const recv = field === 'receivedQty' ? Number(val) : Number(l.receivedQty || 0);
        const acc  = field === 'acceptedQty' ? Number(val) : Number(l.acceptedQty || 0);
        updated.rejectedQty = Math.max(0, recv - acc);
      }
      return updated;
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !selectedPO) return;
    const validLines = lines.filter(l => l.itemId) as GRNLineItem[];
    const totalAcc = validLines.reduce((s, l) => s + (l.acceptedQty || 0), 0);
    const totalRej = validLines.reduce((s, l) => s + (l.rejectedQty || 0), 0);
    const newId = `GRN-${String(grns.length + 1).padStart(3, '0')}`;
    addGRN({
      id: newId, poId, supplierId: selectedPO.supplierId, supplierName: selectedPO.supplierName,
      status: 'Draft', dateCreated: new Date().toISOString().split('T')[0], dateApproved: null,
      createdBy: currentUser?.name || 'Unknown', approvedBy: null,
      deliveryNoteNumber: dn || undefined, vehicleNumber: vehicle || undefined,
      notes: notes || undefined, lineItems: validLines,
      totalAccepted: totalAcc, totalRejected: totalRej, stockUpdated: false,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Raise Goods Receipt Note</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Purchase Order *</label>
              <select className="form-select" value={poId} onChange={e => handlePoChange(e.target.value)} required>
                <option value="">Select PO…</option>
                {eligiblePOs.map(po => <option key={po.id} value={po.id}>{po.id} — {po.supplierName} (${po.totalAmount.toLocaleString()})</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Delivery Note Number</label>
              <input type="text" className="form-input" value={dn} onChange={e => setDN(e.target.value)} placeholder="DN-XXXXXXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle / AWB Number</label>
              <input type="text" className="form-input" value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Plate or tracking number" />
            </div>
          </div>

          {lines.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '6px 0 10px' }}>
                Line Items — Record Receipt
              </div>
              {lines.map((line, i) => (
                <div key={i} style={{ padding: '12px 14px', marginBottom: 10, borderRadius: 10, background: 'rgba(99,102,241,0.03)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 10, fontSize: 14 }}>{line.itemName}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Ordered</label>
                      <input type="number" className="form-input" value={line.orderedQty || 0} readOnly style={{ opacity: 0.6 }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Received</label>
                      <input type="number" className="form-input" value={line.receivedQty || 0} onChange={e => updateLine(i, 'receivedQty', parseInt(e.target.value) || 0)} min="0" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Accepted</label>
                      <input type="number" className="form-input" value={line.acceptedQty || 0} onChange={e => updateLine(i, 'acceptedQty', parseInt(e.target.value) || 0)} min="0" max={line.receivedQty} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: (line.rejectedQty || 0) > 0 ? '#f43f5e' : undefined }}>Rejected</label>
                      <input type="number" className="form-input" value={line.rejectedQty || 0} readOnly style={{ opacity: 0.6, color: (line.rejectedQty || 0) > 0 ? '#f43f5e' : undefined }} />
                    </div>
                  </div>
                  {(line.rejectedQty || 0) > 0 && (
                    <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
                      <label className="form-label">Rejection Reason</label>
                      <input type="text" className="form-input" value={line.rejectionReason || ''} onChange={e => updateLine(i, 'rejectionReason', e.target.value)} placeholder="Describe the defect or non-conformance" />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations during receipt inspection…" />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!poId || lines.length === 0}><PackageCheck size={14} /> Save GRN</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main GRN List ──
export default function GRNPage() {
  const { grns, purchaseOrders, currentUser, selectedGRNId, setSelectedGRNId } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showNew, setShowNew] = useState(false);

  if (selectedGRNId) return <GRNDetail grnId={selectedGRNId} />;

  const filtered = grns.filter(g => {
    const ms = g.id.toLowerCase().includes(search.toLowerCase()) || g.supplierName.toLowerCase().includes(search.toLowerCase()) || g.poId.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'All' || g.status === statusFilter;
    return ms && mst;
  });

  const stats = {
    total: grns.length,
    pending: grns.filter(g => g.status === 'Submitted').length,
    approved: grns.filter(g => g.status === 'Approved').length,
    partial: grns.filter(g => g.status === 'Partial').length,
  };

  return (
    <div>
      {showNew && <NewGRNModal onClose={() => setShowNew(false)} />}

      <div className="page-header">
        <h2>Goods Receipt Notes</h2>
        <p>Record and verify received goods — inventory is updated only upon GRN approval</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total GRNs', value: stats.total, color: 'var(--accent-indigo)' },
          { label: 'Pending Approval', value: stats.pending, color: '#06b6d4' },
          { label: 'Approved', value: stats.approved, color: '#10b981' },
          { label: 'Partial', value: stats.partial, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div className="filters-bar" style={{ flex: 1, margin: 0 }}>
          <div className="search-wrapper">
            <Search size={16} />
            <input type="text" className="search-input" placeholder="Search GRNs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            {(['Draft','Submitted','Approved','Rejected','Partial'] as GRNStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {can(currentUser, 'create_grn') ? (
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={14} /> New GRN</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <Lock size={13} /> Manager only
          </div>
        )}
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>GRN #</th><th>PO</th><th>Supplier</th><th>Date</th><th>Accepted</th><th>Rejected</th><th>Stock</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(grn => {
                const s = STATUS_META[grn.status];
                return (
                  <tr key={grn.id} className="clickable" onClick={() => setSelectedGRNId(grn.id)}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{grn.id}</td>
                    <td style={{ color: '#6366f1', fontWeight: 600 }}>{grn.poId}</td>
                    <td>{grn.supplierName}</td>
                    <td>{grn.dateCreated}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{grn.totalAccepted}</td>
                    <td style={{ color: grn.totalRejected > 0 ? '#f43f5e' : 'var(--text-muted)', fontWeight: grn.totalRejected > 0 ? 700 : 400 }}>{grn.totalRejected}</td>
                    <td>{grn.stockUpdated
                      ? <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ Updated</span>
                      : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</span>}
                    </td>
                    <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state"><Truck size={40} /><h3>No GRNs found</h3><p>Create a GRN when goods arrive against a PO</p></div>
        )}
      </div>
    </div>
  );
}
