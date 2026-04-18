'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/types';
import type { RFQ, RFQLineItem, RFQStatus, TenderType } from '@/types';
import { Search, Plus, Send, ArrowLeft, Eye, X, CheckCircle2, Award, Lock } from 'lucide-react';

const STATUS_META: Record<RFQStatus, { color: string; bg: string }> = {
  Draft:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  Published: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  Sent:      { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  Closed:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Awarded:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Cancelled: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
};

function StatusPill({ status }: { status: RFQStatus }) {
  const s = STATUS_META[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ── Comparison Matrix Component ──
function ComparisonMatrix({ rfqs, quotations, selection, onClose }: { rfqs: any[], quotations: any[], selection: string[], onClose: () => void }) {
  const selectedQuotes = quotations.filter(q => selection.includes(q.id));
  const rfq = rfqs.find(r => r.id === selectedQuotes[0]?.rfqId);
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 1000, width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Bid Comparison Matrix</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="data-table-wrapper">
          <table className="data-table matrix-table">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Criteria</th>
                {selectedQuotes.map(q => (
                  <th key={q.id} style={{ textAlign: 'center', minWidth: 150 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{q.supplierName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.id}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Total Bid Amount</td>
                {selectedQuotes.map(q => <td key={q.id} style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-indigo)', fontSize: 16 }}>${q.totalAmount.toLocaleString()}</td>)}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Lead Time (Max)</td>
                {selectedQuotes.map(q => <td key={q.id} style={{ textAlign: 'center' }}>{Math.max(...q.lineItems.map((l: any) => l.leadTimeDays))} Days</td>)}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Payment Terms</td>
                {selectedQuotes.map(q => <td key={q.id} style={{ textAlign: 'center' }}>{q.paymentTerms}</td>)}
              </tr>
              <tr style={{ background: 'rgba(99,102,241,0.05)' }}>
                <td style={{ fontWeight: 700 }}>Overall Eval Score</td>
                {selectedQuotes.map(q => (
                  <td key={q.id} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: (q.evaluation?.totalScore || 0) >= 8 ? '#10b981' : '#f59e0b' }}>
                      {q.evaluation?.totalScore || 'N/A'}/10
                    </div>
                  </td>
                ))}
              </tr>
              {/* Detailed Technical Breakdown */}
              <tr>
                <td colSpan={selectedQuotes.length + 1} style={{ background: 'var(--bg-secondary)', fontSize: 11, fontWeight: 700, padding: '8px 12px' }}>TECHNICAL EVALUATION BREAKDOWN</td>
              </tr>
              {['pastHistory', 'serviceQuality', 'responsiveness', 'compliance'].map(key => (
                <tr key={key}>
                  <td style={{ fontSize: 13, paddingLeft: 20 }}>{WEIGHT_LABELS[key]} ({((rfq?.evaluationWeights?.[key] || DEFAULT_EVAL_WEIGHTS[key as keyof typeof DEFAULT_EVAL_WEIGHTS]) * 100).toFixed(0)}%)</td>
                  {selectedQuotes.map(q => <td key={q.id} style={{ textAlign: 'center' }}>{q.evaluation?.[key] || '—'}/10</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── RFQ Detail / View ──
function RFQDetail({ rfqId }: { rfqId: string }) {
  const { rfqs, quotations, suppliers, items, currentUser, sendRFQ, closeRFQ, awardRFQ, publishRFQ, setSelectedRFQId, setActivePage, negotiationMessages, addNegotiationMessage } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'inbox' | 'matrix' | 'nego'>('overview');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [matrixSelection, setMatrixSelection] = useState<string[]>([]);
  const [negoInput, setNegoInput] = useState('');

  const rfq = rfqs.find(r => r.id === rfqId);
  if (!rfq) return null;

  const rfqQuotations = quotations.filter(q => q.rfqId === rfqId);
  const selectedQuote = rfqQuotations.find(q => q.id === selectedQuoteId);

  const handleSendNego = () => {
    if (!negoInput.trim() || !selectedQuoteId) return;
    addNegotiationMessage({
      quotationId: selectedQuoteId,
      senderId: currentUser?.id || 'USR-001',
      senderName: currentUser?.name || 'Buyer',
      role: 'buyer',
      text: negoInput,
      type: 'info'
    });
    setNegoInput('');
  };

  return (
    <div className="stack-lg">
      <button className="detail-back" onClick={() => setSelectedRFQId(null)}>
        <ArrowLeft size={16} /> Back to RFQs
      </button>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2>{rfq.title}</h2>
            <StatusPill status={rfq.status} />
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>{rfq.tenderType} Tender</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {rfq.id} · Created by {rfq.createdByName} · Deadlines: Bid ({rfq.bidDeadline}) / Q&A ({rfq.clarificationDeadline})
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {rfq.status === 'Draft' && rfq.tenderType === 'open' && (
            <button className="btn btn-primary btn-sm" onClick={() => publishRFQ(rfq.id)}>
              <Send size={13} /> Publish Tender
            </button>
          )}
          {rfq.status === 'Draft' && rfq.tenderType !== 'open' && (
            <button className="btn btn-primary btn-sm" onClick={() => sendRFQ(rfq.id)}>
              <Send size={13} /> Send Invitations
            </button>
          )}
          {rfq.status === 'Sent' && <button className="btn btn-secondary btn-sm" onClick={() => closeRFQ(rfq.id)}>Close RFQ</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 0 }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>Bid Inbox ({rfqQuotations.length})</button>
        <button className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>Comparison Matrix</button>
        <button className={`tab-btn ${activeTab === 'nego' ? 'active' : ''}`} onClick={() => setActiveTab('nego')}>Negotiations</button>
      </div>

      {activeTab === 'overview' && (
        <div className="stack-md">
           <div className="card">
            <div className="card-header"><div className="card-title">Scope of Supply</div></div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>#</th><th>Item</th><th>Description</th><th>Qty</th></tr></thead>
                <tbody>
                  {rfq.lineItems.map((line, i) => (
                    <tr key={line.id}><td>{i + 1}</td><td style={{ fontWeight: 600 }}>{line.itemName}</td><td style={{ fontSize: 12 }}>{line.description}</td><td style={{ fontWeight: 700 }}>{line.quantity} {line.unit}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Strategic Weights</div></div>
            <div className="grid-3" style={{ padding: 16, gap: 16 }}>
              {Object.entries(rfq.evaluationWeights || DEFAULT_EVAL_WEIGHTS).map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{WEIGHT_LABELS[k] || k}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{(Number(v) * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Select</th><th>Supplier</th><th>Amount</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rfqQuotations.map(q => (
                  <tr key={q.id}>
                    <td><input type="checkbox" checked={matrixSelection.includes(q.id)} onChange={() => setMatrixSelection(p => p.includes(q.id) ? p.filter(x => x !== q.id) : [...p, q.id])} /></td>
                    <td style={{ fontWeight: 600 }}>{q.supplierName}</td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>${q.totalAmount.toLocaleString()}</td>
                    <td>
                      <div style={{ width: 80, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ width: `${(q.evaluation?.totalScore || 0) * 10}%`, height: '100%', background: (q.evaluation?.totalScore || 0) >= 8 ? '#10b981' : '#f59e0b' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{q.evaluation?.totalScore || 'Pending Evaluation'}</span>
                    </td>
                    <td><StatusPill status={q.status as any} /></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedQuoteId(q.id); setActiveTab('nego'); }}>Talk</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          {matrixSelection.length < 2 ? (
             <div className="empty-state">
               <Eye size={40} />
               <h3>Compare Bids</h3>
               <p>Select at least 2 quotes from the Bid Inbox to view the comparison matrix.</p>
               <button className="btn btn-secondary mt-12" onClick={() => setActiveTab('inbox')}>Go to Bid Inbox</button>
             </div>
          ) : (
            <ComparisonMatrix 
              rfqs={rfqs} 
              quotations={rfqQuotations} 
              selection={matrixSelection} 
              onClose={() => { setMatrixSelection([]); setActiveTab('inbox'); }} 
            />
          )}
        </div>
      )}

      {activeTab === 'nego' && (
        <div className="grid-2-1" style={{ gap: 20 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
            <div className="card-header border-bottom">
              <div className="card-title">
                {selectedQuoteId ? `Negotiation with ${selectedQuote?.supplierName}` : "Select a vendor to negotiate"}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="stack-md">
              {negotiationMessages.filter(m => m.quotationId === selectedQuoteId).map(m => (
                <div key={m.id} style={{ alignSelf: m.senderId === currentUser?.id ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: m.senderId === currentUser?.id ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)', color: m.senderId === currentUser?.id ? '#fff' : '#f1f5f9' }}>
                   <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>{m.senderName} · {m.timestamp.split('T')[1].slice(0,5)}</div>
                   <div style={{ fontSize: 13 }}>{m.text}</div>
                </div>
              ))}
              {!selectedQuoteId && <div className="empty-state" style={{ height: '100%', justifyContent: 'center' }}>Select a vendor from the Bid Inbox to start private negotiations.</div>}
            </div>
            {selectedQuoteId && (
              <div className="p-12 border-top" style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" placeholder="Type a message..." value={negoInput} onChange={e => setNegoInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendNego()} />
                <button className="btn btn-primary" onClick={handleSendNego}><Send size={16} /></button>
              </div>
            )}
          </div>
          
          <div className="card">
             <div className="card-header border-bottom"><div className="card-title">Vendors</div></div>
             <div className="stack-xs" style={{ padding: 8 }}>
                {rfqQuotations.map(q => (
                  <button key={q.id} onClick={() => setSelectedQuoteId(q.id)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, background: selectedQuoteId === q.id ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: q.status === 'Awarded' ? '#10b981' : '#94a3b8' }} />
                     <div>
                       <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{q.supplierName}</div>
                       <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${q.totalAmount.toLocaleString()}</div>
                     </div>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Evaluation Weights Defaults ──
const DEFAULT_EVAL_WEIGHTS = {
  price: 0.3, leadTime: 0.2, pastHistory: 0.15, paymentTerms: 0.12, serviceQuality: 0.12, responsiveness: 0.06, compliance: 0.05
};

const WEIGHT_LABELS: Record<string, string> = {
  price: 'Price / Commercial',
  leadTime: 'Lead Time / Delivery',
  pastHistory: 'Supplier History',
  paymentTerms: 'Payment Terms',
  serviceQuality: 'Quality & Service',
  responsiveness: 'Responsiveness',
  compliance: 'Safety & Compliance'
};

// ── New RFQ Modal ──
function NewRFQModal({ onClose }: { onClose: () => void }) {
  const { addRFQ, rfqs, items, suppliers, currentUser } = useApp();
  const [title, setTitle] = useState('');
  const [tenderType, setTenderType] = useState<TenderType>('selective');
  const [bidDeadline, setBidDeadline] = useState('');
  const [clarificationDeadline, setClarificationDeadline] = useState('');
  const [projRef, setProjRef] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<Partial<RFQLineItem>[]>([{}]);
  
  // Weights state (normalized automatically on submit)
  const [weights, setWeights] = useState<Record<string, number>>({
    price: 30, leadTime: 20, pastHistory: 15, paymentTerms: 10, serviceQuality: 10, responsiveness: 10, compliance: 5
  });

  const updateWeight = (key: string, val: number) => setWeights(p => ({ ...p, [key]: val }));

  const toggleSup = (id: string) => setSelectedSuppliers(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const updateLine = (i: number, field: keyof RFQLineItem, val: string | number) =>
    setLineItems(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const removeLine = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !bidDeadline) return;
    if (tenderType === 'selective' && selectedSuppliers.length === 0) return;
    
    const validLines = lineItems.filter(l => l.itemId && l.quantity) as RFQLineItem[];
    if (!validLines.length) return;

    // Normalize weights to sum to 1.0
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    const normalizedWeights: Record<string, number> = {};
    Object.keys(weights).forEach(k => normalizedWeights[k] = weights[k] / sum);

    const newId = `RFQ-${String(rfqs.length + 1).padStart(3, '0')}`;
    addRFQ({
      id: newId, title, status: 'Draft',
      createdBy: currentUser?.id || 'USR-001', createdByName: currentUser?.name || 'Unknown',
      dateCreated: new Date().toISOString().split('T')[0], dateSent: null,
      deadlineDate: bidDeadline, // Keep for backward compat
      bidDeadline, 
      clarificationDeadline: clarificationDeadline || bidDeadline,
      projectReference: projRef || undefined, notes: notes || undefined,
      lineItems: validLines.map((l, i) => ({ ...l, id: `RLI-${newId}-${i}`, category: items.find(item => item.id === l.itemId)?.category || '' })),
      invitedSupplierIds: tenderType === 'open' ? [] : selectedSuppliers,
      tenderType,
      evaluationWeights: normalizedWeights
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 800, width: '92%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">New Strategic Tender / RFQ</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="stack-lg">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Tender Title *</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Annual Steel Supply 2026" />
            </div>
            <div className="form-group">
              <label className="form-label">Tender Type</label>
              <select className="form-select" value={tenderType} onChange={e => setTenderType(e.target.value as TenderType)}>
                <option value="selective">Selective (Invite Only)</option>
                <option value="open">Open (Public Discovery)</option>
                <option value="single-source">Single Source</option>
                <option value="framework">Framework Agreement</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bid Submission Deadline *</label>
              <input type="date" className="form-input" value={bidDeadline} onChange={e => setBidDeadline(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Clarification Deadline</label>
              <input type="date" className="form-input" value={clarificationDeadline} onChange={e => setClarificationDeadline(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Project Ref</label>
              <input type="text" className="form-input" value={projRef} onChange={e => setProjRef(e.target.value)} />
            </div>
          </div>

          {/* Evaluation Weights Section */}
          <div className="card-soft" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Evaluation Criteria Weights (Total: {Object.values(weights).reduce((a,b)=>a+b, 0)}%)</div>
            <div className="grid-2" style={{ gap: '12px 24px' }}>
              {Object.keys(weights).map(k => (
                <div key={k} className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ fontSize: 12, marginBottom: 0 }}>{WEIGHT_LABELS[k]}</label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{weights[k]}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={weights[k]} onChange={e => updateWeight(k, parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-indigo)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '12px 0 10px' }}>Scope of Supply</div>
            {lineItems.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
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
                  <input type="number" className="form-input" placeholder="Qty" value={line.quantity || ''} onChange={e => updateLine(i, 'quantity', parseInt(e.target.value))} min="1" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" className="form-input" value={line.unit || ''} onChange={e => updateLine(i, 'unit', e.target.value)} placeholder="Unit" />
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(i)} style={{ color: 'var(--accent-rose)', marginBottom: 0 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLineItems(p => [...p, {}])}>
              <Plus size={13} /> Add Scope Item
            </button>
          </div>

          {/* Invite suppliers */}
          {tenderType !== 'open' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '8px 0 10px' }}>Targeted Suppliers *</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {suppliers.map(s => {
                  const sel = selectedSuppliers.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggleSup(s.id)}
                      style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'var(--border-color)'}`, background: sel ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', color: sel ? 'var(--accent-indigo)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {sel && <CheckCircle2 size={12} />}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes / Instructions</label>
            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Technical standards, compliance requirements, etc." />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={14} /> Create Tender</button>
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

      {/* Quick Access Bubbles - Premium Design */}
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active RFQs', value: stats.sent, icon: <Send size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Bids Received', value: quotations.length, icon: <ArrowLeft size={20} />, color: 'var(--accent-slate)', bg: 'rgba(177,202,215,0.08)' },
          { label: 'Tenders Awarded', value: stats.awarded, icon: <Award size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Draft Tenders', value: stats.draft, icon: <X size={20} />, color: 'var(--accent-rose)', bg: 'rgba(239,68,68,0.08)' },
        ].map((bubble, i) => (
          <div key={i} className="card glass luxury-border flex items-center gap-16" style={{ padding: '16px 20px', borderLeft: `4px solid ${bubble.color}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bubble.bg, color: bubble.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {bubble.icon}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{bubble.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{bubble.value}</div>
            </div>
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
