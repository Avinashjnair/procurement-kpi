'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/types';
import type { RFQ, RFQLineItem, RFQStatus } from '@/types';
import { Search, Plus, Send, ArrowLeft, Eye, X, CheckCircle2, Award, Lock } from 'lucide-react';

const STATUS_META: Record<RFQStatus, { color: string; bg: string }> = {
  Draft:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  Sent:      { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  Closed:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Awarded:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Cancelled: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
};

function StatusPill({ status }: { status: RFQStatus }) {
  const s = STATUS_META[status];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ── RFQ Detail / View ──
function RFQDetail({ rfqId }: { rfqId: string }) {
  const { rfqs, quotations, suppliers, items, currentUser, sendRFQ, closeRFQ, awardRFQ, setSelectedRFQId, setActivePage } = useApp();
  const rfq = rfqs.find(r => r.id === rfqId);
  if (!rfq) return null;

  const rfqQuotations = quotations.filter(q => q.rfqId === rfqId);

  return (
    <div>
      <button className="detail-back" onClick={() => setSelectedRFQId(null)}>
        <ArrowLeft size={16} /> Back to RFQs
      </button>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2>{rfq.title}</h2>
            <StatusPill status={rfq.status} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {rfq.id} · Created by {rfq.createdByName} · {rfq.dateCreated}
            {rfq.projectReference && ` · ${rfq.projectReference}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rfq.status === 'Draft' && can(currentUser, 'edit_rfq') && (
            <button className="btn btn-primary btn-sm" onClick={() => sendRFQ(rfq.id)}>
              <Send size={13} /> Send to Suppliers
            </button>
          )}
          {rfq.status === 'Sent' && can(currentUser, 'close_rfq') && (
            <button className="btn btn-secondary btn-sm" onClick={() => closeRFQ(rfq.id)}>
              Close RFQ
            </button>
          )}
          {(rfq.status === 'Sent' || rfq.status === 'Closed') && rfqQuotations.length > 0 && can(currentUser, 'view_quotations') && (
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage('quotations')}>
              <Eye size={13} /> Compare Quotes ({rfqQuotations.length})
            </button>
          )}
        </div>
      </div>

      {/* Invited suppliers */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Invited Suppliers</div></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {rfq.invitedSupplierIds.map(sid => {
            const sup = suppliers.find(s => s.id === sid);
            const hasQuote = rfqQuotations.some(q => q.supplierId === sid);
            return (
              <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: `1px solid ${hasQuote ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`, background: hasQuote ? 'rgba(16,185,129,0.05)' : 'var(--bg-primary)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6366f1' }}>
                  {sup?.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{sup?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hasQuote ? '✓ Quote received' : rfq.status === 'Draft' ? 'Not yet sent' : 'Awaiting quote'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line items */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Requested Items</div></div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>#</th><th>Item</th><th>Description</th><th>Category</th><th>Quantity</th><th>Unit</th></tr></thead>
            <tbody>
              {rfq.lineItems.map((line, i) => (
                <tr key={line.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{line.itemName}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{line.description}</td>
                  <td><span className="badge approved">{line.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{line.quantity.toLocaleString()}</td>
                  <td>{line.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotations received */}
      {rfqQuotations.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quotations Received ({rfqQuotations.length})</div>
            {can(currentUser, 'evaluate_quotation') && (
              <button className="btn btn-primary btn-sm" onClick={() => setActivePage('quotations')}>
                Open Comparison →
              </button>
            )}
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Quote #</th><th>Supplier</th><th>Total</th><th>Lead Time</th><th>Payment</th><th>Score</th><th>Status</th></tr></thead>
              <tbody>
                {rfqQuotations
                  .sort((a, b) => (b.evaluation?.totalScore || 0) - (a.evaluation?.totalScore || 0))
                  .map(q => (
                    <tr key={q.id} style={{ background: q.status === 'Awarded' ? 'rgba(16,185,129,0.04)' : undefined }}>
                      <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{q.id}</td>
                      <td>
                        {q.status === 'Awarded' && <Award size={13} style={{ color: '#10b981', marginRight: 5 }} />}
                        {q.supplierName}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>${q.totalAmount.toLocaleString()}</td>
                      <td>{q.lineItems.length > 0 ? `${Math.max(...q.lineItems.map(l => l.leadTimeDays))}d max` : '—'}</td>
                      <td>{q.paymentTerms}</td>
                      <td>
                        {q.evaluation
                          ? <span style={{ fontWeight: 700, color: q.evaluation.totalScore >= 8 ? '#10b981' : q.evaluation.totalScore >= 6 ? '#f59e0b' : '#f43f5e', fontSize: 14 }}>{q.evaluation.totalScore}/10</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not evaluated</span>
                        }
                      </td>
                      <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${STATUS_META[q.status as RFQStatus]?.bg || 'rgba(99,102,241,0.1)'}`, color: STATUS_META[q.status as RFQStatus]?.color || '#6366f1' }}>{q.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rfq.awardedSupplierName && (
        <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>Awarded to {rfq.awardedSupplierName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Quotation {rfq.awardedQuotationId}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New RFQ Modal ──
function NewRFQModal({ onClose }: { onClose: () => void }) {
  const { addRFQ, rfqs, items, suppliers, currentUser } = useApp();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projRef, setProjRef] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<Partial<RFQLineItem>[]>([{}]);

  const toggleSup = (id: string) => setSelectedSuppliers(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const updateLine = (i: number, field: keyof RFQLineItem, val: string | number) =>
    setLineItems(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const removeLine = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || selectedSuppliers.length === 0) return;
    const validLines = lineItems.filter(l => l.itemId && l.quantity) as RFQLineItem[];
    if (!validLines.length) return;
    const newId = `RFQ-${String(rfqs.length + 1).padStart(3, '0')}`;
    addRFQ({
      id: newId, title, status: 'Draft',
      createdBy: currentUser?.id || 'USR-001', createdByName: currentUser?.name || 'Unknown',
      dateCreated: new Date().toISOString().split('T')[0], dateSent: null,
      deadlineDate: deadline, projectReference: projRef || undefined, notes: notes || undefined,
      lineItems: validLines.map((l, i) => ({ ...l, id: `RLI-${newId}-${i}`, category: items.find(item => item.id === l.itemId)?.category || '' })),
      invitedSupplierIds: selectedSuppliers,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">New Request for Quotation</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">RFQ Title *</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Carbon Steel Pipes — Phase 4" />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline *</label>
              <input type="date" className="form-input" value={deadline} onChange={e => setDeadline(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project Reference</label>
              <input type="text" className="form-input" value={projRef} onChange={e => setProjRef(e.target.value)} placeholder="e.g., PRJ-2026-XXXX" />
            </div>
          </div>

          {/* Line items */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '4px 0 10px' }}>Items Requested</div>
          {lineItems.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{i === 0 ? 'Item' : ''}</label>
                <select className="form-select" value={line.itemId || ''} onChange={e => {
                  const item = items.find(it => it.id === e.target.value);
                  updateLine(i, 'itemId', e.target.value);
                  updateLine(i, 'itemName', item?.name || '');
                  updateLine(i, 'unit', item?.unit || '');
                  updateLine(i, 'description', item?.description || '');
                }}>
                  <option value="">Select item…</option>
                  {items.filter(it => !it.archived).map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Quantity</label>}
                <input type="number" className="form-input" placeholder="Qty" value={line.quantity || ''} onChange={e => updateLine(i, 'quantity', parseInt(e.target.value))} min="1" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Unit</label>}
                <input type="text" className="form-input" value={line.unit || ''} onChange={e => updateLine(i, 'unit', e.target.value)} placeholder="pcs / m / ton" />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(i)} style={{ color: 'var(--accent-rose)', marginBottom: 0 }}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLineItems(p => [...p, {}])} style={{ marginBottom: 16 }}>
            <Plus size={13} /> Add Line
          </button>

          {/* Invite suppliers */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '8px 0 10px' }}>Invite Suppliers *</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {suppliers.map(s => {
              const sel = selectedSuppliers.includes(s.id);
              return (
                <button key={s.id} type="button" onClick={() => toggleSup(s.id)}
                  style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'var(--border-color)'}`, background: sel ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', color: sel ? 'var(--accent-indigo)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {sel && <CheckCircle2 size={12} />}
                  {s.name}
                  {s.preferred && <span style={{ fontSize: 10, color: '#f59e0b' }}>★</span>}
                </button>
              );
            })}
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Instructions</label>
            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Technical standards, compliance requirements, etc." />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={14} /> Create RFQ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main RFQ List ──
export default function RFQPage() {
  const { rfqs, quotations, currentUser, selectedRFQId, setSelectedRFQId } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showNew, setShowNew] = useState(false);

  if (selectedRFQId) return <RFQDetail rfqId={selectedRFQId} />;

  const filtered = rfqs.filter(r => {
    const ms = r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'All' || r.status === statusFilter;
    return ms && mst;
  });

  const stats = {
    total: rfqs.length,
    draft: rfqs.filter(r => r.status === 'Draft').length,
    sent: rfqs.filter(r => r.status === 'Sent').length,
    awarded: rfqs.filter(r => r.status === 'Awarded').length,
  };

  return (
    <div>
      {showNew && <NewRFQModal onClose={() => setShowNew(false)} />}

      <div className="page-header">
        <h2>Purchase Requests & RFQs</h2>
        <p>Raise requests for quotation and manage the sourcing process</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total RFQs', value: stats.total, color: 'var(--accent-indigo)' },
          { label: 'Drafts', value: stats.draft, color: '#94a3b8' },
          { label: 'Sent / Active', value: stats.sent, color: '#06b6d4' },
          { label: 'Awarded', value: stats.awarded, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div className="filters-bar" style={{ flex: 1, margin: 0 }}>
          <div className="search-wrapper">
            <Search size={16} />
            <input type="text" className="search-input" placeholder="Search RFQs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            {(['Draft','Sent','Closed','Awarded','Cancelled'] as RFQStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {can(currentUser, 'create_rfq') ? (
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={14} /> New RFQ</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <Lock size={13} /> View only
          </div>
        )}
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>RFQ #</th><th>Title</th><th>Created By</th><th>Deadline</th><th>Suppliers</th><th>Quotes</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(rfq => {
                const qCount = quotations.filter(q => q.rfqId === rfq.id).length;
                return (
                  <tr key={rfq.id} className="clickable" onClick={() => setSelectedRFQId(rfq.id)}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{rfq.id}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#f1f5f9' }}>{rfq.title}</div>
                      {rfq.projectReference && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rfq.projectReference}</div>}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rfq.createdByName}</td>
                    <td>{rfq.deadlineDate}</td>
                    <td>{rfq.invitedSupplierIds.length}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: qCount > 0 ? '#10b981' : 'var(--text-muted)' }}>
                        {qCount} / {rfq.invitedSupplierIds.length}
                      </span>
                    </td>
                    <td><StatusPill status={rfq.status} /></td>
                    <td>
                      {rfq.awardedSupplierName && <span style={{ fontSize: 11, color: '#10b981' }}>→ {rfq.awardedSupplierName.split(' ')[0]}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state"><Send size={40} /><h3>No RFQs found</h3><p>Raise a new RFQ to start the sourcing process</p></div>
        )}
      </div>
    </div>
  );
}
