'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft, Search, MapPin, Mail, Phone,
  CheckCircle2, AlertTriangle, XCircle,
  Star, StarOff, Shield, ShieldAlert, ShieldX,
  Edit2, Check, X, Plus, MessageSquare, ChevronDown, ChevronUp,
  Wrench,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { computeRiskScore, type Supplier, type SupplierKPIs } from '@/data/mockData';

// ─────────────────────────────────────────────
// Risk badge
// ─────────────────────────────────────────────
function RiskBadge({ kpis }: { kpis: SupplierKPIs }) {
  const risk = computeRiskScore(kpis);
  const Icon = risk.label === 'Low' ? Shield : risk.label === 'Medium' ? ShieldAlert : ShieldX;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: `${risk.color}18`, color: risk.color,
      border: `1px solid ${risk.color}40`,
    }}>
      <Icon size={12} /> {risk.label} Risk · {risk.score}
    </span>
  );
}

// ─────────────────────────────────────────────
// Preferred badge
// ─────────────────────────────────────────────
function PreferredBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
      border: '1px solid rgba(245,158,11,0.3)',
    }}>
      <Star size={11} fill="#f59e0b" /> Preferred
    </span>
  );
}

// ─────────────────────────────────────────────
// Service badge
// ─────────────────────────────────────────────
function ServiceBadge() {
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: 4, 
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
      border: '1px solid rgba(139,92,246,0.3)',
    }}>
      <Wrench size={11} /> Service Provider
    </span>
  );
}

// ─────────────────────────────────────────────
// Inline KPI editor
// ─────────────────────────────────────────────
function KPIEditor({
  kpis,
  onSave,
  onCancel,
}: {
  kpis: SupplierKPIs;
  onSave: (k: SupplierKPIs) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<SupplierKPIs>({ ...kpis });

  const set = (field: keyof SupplierKPIs, val: string) =>
    setDraft(prev => ({ ...prev, [field]: isNaN(Number(val)) ? val : Number(val) }));

  return (
    <div style={{ border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: 16, marginBottom: 20, background: 'rgba(99,102,241,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <Edit2 size={13} /> Edit KPIs
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Price Variation (%)', field: 'priceVariation' as const, type: 'number' },
          { label: 'Delivery Performance (%)', field: 'deliveryPerformance' as const, type: 'number' },
          { label: 'Rejection Rate (%)', field: 'rejectionRate' as const, type: 'number' },
          { label: 'Response Time (hrs)', field: 'responseTime' as const, type: 'number' },
          { label: 'On-Time Payment (%)', field: 'onTimePayment' as const, type: 'number' },
          { label: 'Payment Terms', field: 'paymentTerms' as const, type: 'text' },
          { label: 'Incoterms / Delivery', field: 'deliveryTerms' as const, type: 'text' },
        ].map(({ label, field, type }) => (
          <div key={field} className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{label}</label>
            <input
              type={type}
              className="form-input"
              value={draft[field]}
              onChange={e => set(field, e.target.value)}
              step={type === 'number' ? '0.1' : undefined}
              min={type === 'number' ? '0' : undefined}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}><X size={13} /> Cancel</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onSave(draft)}><Check size={13} /> Save KPIs</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Notes timeline
// ─────────────────────────────────────────────
function NotesTimeline({ supplier }: { supplier: Supplier }) {
  const { addSupplierNote } = useApp();
  const [newNote, setNewNote] = useState('');
  const [expanded, setExpanded] = useState(true);

  const handleAdd = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    addSupplierNote(supplier.id, trimmed);
    setNewNote('');
  };

  const notes = [...(supplier.notes || [])].reverse(); 

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={15} style={{ color: 'var(--accent-indigo)' }} />
            Notes &amp; Audit Log
          </div>
          <div className="card-subtitle">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</div>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </div>

      {expanded && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Add a note about this supplier..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, margin: 0 }}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!newNote.trim()}>
              <Plus size={13} /> Add
            </button>
          </div>

          {notes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
              No notes yet. Add the first one above.
            </p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 1, background: 'var(--border-color)' }} />
              {notes.map((note, i) => (
                <div key={note.id} style={{ display: 'flex', gap: 12, marginBottom: i < notes.length - 1 ? 16 : 0, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -14, top: 5,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent-indigo)', border: '2px solid var(--bg-primary)',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, paddingLeft: 4 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 4px' }}>
                      {note.text}
                    </p>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {note.author} · {note.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Supplier Detail page
// ─────────────────────────────────────────────
function getKpiColor(val: number, thresholds: [number, number], inverted = false) {
  const [good, warn] = thresholds;
  if (inverted) {
    if (val <= good) return 'kpi-good';
    if (val <= warn) return 'kpi-warn';
    return 'kpi-bad';
  }
  if (val >= good) return 'kpi-good';
  if (val >= warn) return 'kpi-warn';
  return 'kpi-bad';
}

function SupplierDetail({ supplierId }: { supplierId: string }) {
  const { suppliers, purchaseOrders, items, setSelectedSupplierId, updateSupplierKPIs, togglePreferredSupplier } = useApp();
  const supplier = suppliers.find(s => s.id === supplierId);
  const [editingKPIs, setEditingKPIs] = useState(false);

  if (!supplier) return <p>Supplier not found.</p>;

  const kpis = supplier.kpis;
  const risk = computeRiskScore(kpis);
  const isServiceProvider = kpis.deliveryTerms === 'N/A';

  const radarData = [
    { metric: isServiceProvider ? 'Service Performance' : 'Delivery', value: kpis.deliveryPerformance, fullMark: 100 },
    { metric: 'On-Time Pay', value: kpis.onTimePayment, fullMark: 100 },
    { metric: isServiceProvider ? 'SLA Compliance' : 'Low Rejection', value: Math.max(0, 100 - kpis.rejectionRate * (isServiceProvider ? 5 : 10)), fullMark: 100 },
    { metric: 'Price Stability', value: Math.max(0, 100 - kpis.priceVariation * 10), fullMark: 100 },
    { metric: 'Response', value: Math.max(0, 100 - kpis.responseTime * 5), fullMark: 100 },
  ];

  const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplierId);
  const supplierItems = items.filter(i => i.linkedSupplierIds.includes(supplierId));

  const statusBars = [
    { status: isServiceProvider ? 'Complete' : 'Delivered', count: supplierPOs.filter(p => p.deliveryStatus === 'Delivered').length, color: '#10b981' },
    { status: isServiceProvider ? 'Ongoing' : 'Shipped', count: supplierPOs.filter(p => p.deliveryStatus === 'Shipped').length, color: '#06b6d4' },
    { status: 'Pending', count: supplierPOs.filter(p => p.deliveryStatus === 'Pending').length, color: '#f59e0b' },
    { status: 'Approved', count: supplierPOs.filter(p => p.deliveryStatus === 'Approved').length, color: '#6366f1' },
  ];

  return (
    <div>
      <button className="detail-back" onClick={() => setSelectedSupplierId(null)}>
        <ArrowLeft size={16} /> Back to Suppliers
      </button>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h2>{supplier.name}</h2>
          <RiskBadge kpis={kpis} />
          {supplier.preferred && <PreferredBadge />}
          {isServiceProvider && <ServiceBadge />}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
            <MapPin size={13} /> {supplier.location}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
            <Mail size={13} /> {supplier.email}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
            <Phone size={13} /> {supplier.phone}
          </span>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setEditingKPIs(e => !e)}
        >
          <Edit2 size={14} /> {editingKPIs ? 'Cancel Edit' : 'Edit KPIs'}
        </button>
        <button
          className="btn btn-sm"
          style={{
            background: supplier.preferred ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.08)',
            color: supplier.preferred ? '#f59e0b' : 'var(--text-secondary)',
            border: `1px solid ${supplier.preferred ? 'rgba(245,158,11,0.3)' : 'var(--border-color)'}`,
          }}
          onClick={() => togglePreferredSupplier(supplier.id)}
        >
          {supplier.preferred
            ? <><StarOff size={14} /> Remove Preferred</>
            : <><Star size={14} /> Mark as Preferred</>
          }
        </button>
      </div>

      {/* KPI editor */}
      {editingKPIs && (
        <KPIEditor
          kpis={kpis}
          onSave={updated => { updateSupplierKPIs(supplier.id, updated); setEditingKPIs(false); }}
          onCancel={() => setEditingKPIs(false)}
        />
      )}

      {/* KPI Scorecard */}
      <div className="kpi-grid">
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.priceVariation, [3, 5], true)}`}>{kpis.priceVariation}%</div>
          <div className="kpi-item-label">Price Variation</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.deliveryPerformance, [95, 88])}`}>{kpis.deliveryPerformance}%</div>
          <div className="kpi-item-label">{isServiceProvider ? 'Service Performance' : 'On-Time Delivery'}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-item-value" style={{ color: 'var(--accent-indigo)' }}>{kpis.paymentTerms}</div>
          <div className="kpi-item-label">Payment Terms</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.onTimePayment, [95, 90])}`}>{kpis.onTimePayment}%</div>
          <div className="kpi-item-label">Our On-Time Payment</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.responseTime, [4, 8], true)}`}>{kpis.responseTime}h</div>
          <div className="kpi-item-label">Avg Response Time</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-item-value" style={{ color: 'var(--accent-cyan)' }}>{kpis.deliveryTerms}</div>
          <div className="kpi-item-label">{isServiceProvider ? 'Incoterms (N/A)' : 'Incoterms'}</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.rejectionRate, [1, 3], true)}`}>{kpis.rejectionRate}%</div>
          <div className="kpi-item-label">{isServiceProvider ? 'SLA Failure Rate' : 'Rejection Rate'}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-item-value" style={{ color: risk.color }}>{risk.label}</div>
          <div className="kpi-item-label">Risk Level · Score {risk.score}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid-equal">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Performance Radar</div>
              <div className="card-subtitle">Overall capability assessment</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(99,102,241,0.12)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar 
                name={supplier.name} 
                dataKey="value" 
                stroke={isServiceProvider ? '#a78bfa' : '#6366f1'} 
                fill={isServiceProvider ? '#a78bfa' : '#6366f1'} 
                fillOpacity={0.2} 
                strokeWidth={2} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{isServiceProvider ? 'Service Contract Breakdown' : 'PO Status Breakdown'}</div>
              <div className="card-subtitle">{supplierPOs.length} total orders</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#f1f5f9' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                {statusBars.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linked Items */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">{isServiceProvider ? 'Linked Services' : 'Linked Items'}</div>
            <div className="card-subtitle">{supplierItems.length} {isServiceProvider ? 'services provided' : 'items supplied'}</div>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{isServiceProvider ? 'Svc ID' : 'Item ID'}</th>
                <th>Name</th>
                <th>Category</th>
                <th>{isServiceProvider ? 'Unit Rate' : 'Current Price'}</th>
              </tr>
            </thead>
            <tbody>
              {supplierItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.category === 'Services' && <Wrench size={13} style={{ color: '#a78bfa' }} />}
                      {item.name}
                    </div>
                  </td>
                  <td>
                    {item.category === 'Services'
                      ? <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>Services</span>
                      : <span className="badge approved">{item.category}</span>
                    }
                  </td>
                  <td className="font-mono">${item.currentPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NotesTimeline supplier={supplier} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Add New Supplier Modal form
// ─────────────────────────────────────────────
function AddSupplierModal({ onClose }: { onClose: () => void }) {
  const { addSupplier, suppliers } = useApp();
  const [form, setForm] = useState({
    name: '', contactPerson: '', email: '', phone: '',
    location: '', address: '', taxRegNumber: '', preferred: false,
    priceVariation: '3', deliveryPerformance: '90', paymentTerms: 'Net 30',
    onTimePayment: '95', responseTime: '6', deliveryTerms: 'CIF', rejectionRate: '2',
  });

  const set = (field: string, val: string | boolean) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    const newId = `SUP-${String(suppliers.length + 1).padStart(3, '0')}`;
    addSupplier({
      id: newId,
      name: form.name,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      location: form.location,
      address: form.address,
      taxRegNumber: form.taxRegNumber,
      preferred: form.preferred,
      status: 'Pending Approval',
      notes: [],
      kpis: {
        priceVariation: parseFloat(form.priceVariation) || 0,
        deliveryPerformance: parseFloat(form.deliveryPerformance) || 90,
        paymentTerms: form.paymentTerms,
        onTimePayment: parseFloat(form.onTimePayment) || 95,
        responseTime: parseFloat(form.responseTime) || 6,
        deliveryTerms: form.deliveryTerms,
        rejectionRate: parseFloat(form.rejectionRate) || 0,
      },
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add New Supplier</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Contact Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input type="text" className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g., Atlas Steel Ltd." />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input type="text" className="form-input" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="e.g., John Smith" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="contact@supplier.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+971 50 000 0000" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location (City, Country)</label>
              <input type="text" className="form-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Dubai, UAE" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Reg. Number (TRN / VAT)</label>
              <input type="text" className="form-input" value={form.taxRegNumber} onChange={e => set('taxRegNumber', e.target.value)} placeholder="TRN-XXXXXXXXXXXX" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Full Address</label>
            <input type="text" className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, City, Country" />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '16px 0 10px' }}>Initial KPIs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'Price Variation (%)', field: 'priceVariation' },
              { label: 'Delivery Performance (%)', field: 'deliveryPerformance' },
              { label: 'Rejection Rate (%)', field: 'rejectionRate' },
              { label: 'Response Time (hrs)', field: 'responseTime' },
              { label: 'On-Time Payment (%)', field: 'onTimePayment' },
            ].map(({ label, field }) => (
              <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{label}</label>
                <input type="number" className="form-input" value={(form as Record<string,any>)[field]} onChange={e => set(field, e.target.value)} min="0" step="0.1" />
              </div>
            ))}
          </div>
          <div className="form-row" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select className="form-select" value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>
                <option>Net 30</option><option>Net 45</option><option>Net 60</option>
                <option>Net 90</option><option>Immediate</option><option>Milestone Based</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Incoterms / Delivery Terms</label>
              <select className="form-select" value={form.deliveryTerms} onChange={e => set('deliveryTerms', e.target.value)}>
                <option>CIF</option><option>FOB</option><option>EXW</option><option>DDP</option>
                <option>DAP</option><option>FCA</option><option>N/A</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '12px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)' }}>
            <input
              type="checkbox"
              id="pref-check"
              checked={form.preferred}
              onChange={e => set('preferred', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
            />
            <label htmlFor="pref-check" style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={14} fill={form.preferred ? '#f59e0b' : 'none'} /> Add to Preferred / Approved Vendor List
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Supplier</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Suppliers list page
// ─────────────────────────────────────────────
export default function SuppliersPage() {
  const { suppliers, selectedSupplierId, setSelectedSupplierId, togglePreferredSupplier } = useApp();
  const [search, setSearch] = useState('');
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [riskFilter, setRiskFilter] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'goods' | 'services'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.location.toLowerCase().includes(search.toLowerCase());
      
      const matchPreferred = !preferredOnly || s.preferred;
      
      const risk = computeRiskScore(s.kpis);
      const matchRisk = riskFilter === 'all' || risk.label === riskFilter;

      const isSvc = s.kpis.deliveryTerms === 'N/A';
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'services' && isSvc) ||
        (typeFilter === 'goods' && !isSvc);

      return matchSearch && matchPreferred && matchRisk && matchType;
    });
  }, [suppliers, search, preferredOnly, riskFilter, typeFilter]);

  const serviceCount = suppliers.filter(s => s.kpis.deliveryTerms === 'N/A').length;
  const goodsCount = suppliers.length - serviceCount;
  const preferredCount = suppliers.filter(s => s.preferred).length;
  
  const riskCounts = {
    Low:    suppliers.filter(s => computeRiskScore(s.kpis).label === 'Low').length,
    Medium: suppliers.filter(s => computeRiskScore(s.kpis).label === 'Medium').length,
    High:   suppliers.filter(s => computeRiskScore(s.kpis).label === 'High').length,
  };

  if (selectedSupplierId) return <SupplierDetail supplierId={selectedSupplierId} />;

  return (
    <div>
      {showAddModal && <AddSupplierModal onClose={() => setShowAddModal(false)} />}

      <div className="page-header">
        <h2>Supplier &amp; Provider Management</h2>
        <p>Track, evaluate and manage performance of vendors and service providers</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Suppliers', value: suppliers.length, color: 'var(--accent-indigo)' },
          { label: 'Preferred', value: preferredCount, color: '#f59e0b' },
          { label: 'Low Risk', value: riskCounts.Low, color: '#10b981' },
          { label: 'Medium Risk', value: riskCounts.Medium, color: '#f59e0b' },
          { label: 'High Risk', value: riskCounts.High, color: '#f43f5e' },
        ].map(stat => (
          <div key={stat.label} className="metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs for Goods/Services */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
          All Vendors ({suppliers.length})
        </button>
        <button className={`tab-btn ${typeFilter === 'goods' ? 'active' : ''}`} onClick={() => setTypeFilter('goods')}>
          Goods Suppliers ({goodsCount})
        </button>
        <button className={`tab-btn ${typeFilter === 'services' ? 'active' : ''}`} onClick={() => setTypeFilter('services')}>
          <Wrench size={13} style={{ display: 'inline', marginRight: 4 }} />
          Service Providers ({serviceCount})
        </button>
      </div>

      {/* Filters + Add button */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input type="text" className="search-input" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <button
          className="btn btn-sm"
          style={{
            background: preferredOnly ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.06)',
            color: preferredOnly ? '#f59e0b' : 'var(--text-secondary)',
            border: `1px solid ${preferredOnly ? 'rgba(245,158,11,0.35)' : 'var(--border-color)'}`,
          }}
          onClick={() => setPreferredOnly(p => !p)}
        >
          <Star size={13} fill={preferredOnly ? '#f59e0b' : 'none'} />
          {preferredOnly ? 'Preferred only' : 'All status'}
        </button>

        <select className="filter-select" value={riskFilter} onChange={e => setRiskFilter(e.target.value as any)}>
          <option value="all">All risk levels</option>
          <option value="Low">Low Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="High">High Risk</option>
        </select>

        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      {/* Supplier cards */}
      <div className="supplier-cards">
        {filtered.map(supplier => {
          const risk = computeRiskScore(supplier.kpis);
          const isSvc = supplier.kpis.deliveryTerms === 'N/A';
          const RiskIcon = risk.label === 'Low' ? Shield : risk.label === 'Medium' ? ShieldAlert : ShieldX;
          
          return (
            <div 
              key={supplier.id} 
              className="card supplier-card" 
              onClick={() => setSelectedSupplierId(supplier.id)}
              style={isSvc ? { borderLeft: '4px solid #a78bfa' } : {}}
            >
              <div className="supplier-card-header">
                <div className="supplier-avatar" style={isSvc ? { background: 'rgba(139,92,246,0.12)', color: '#a78bfa' } : {}}>
                  {isSvc ? <Wrench size={20} /> : supplier.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <div className="supplier-card-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{supplier.name}</div>
                      {supplier.preferred && (
                        <Star size={13} fill="#f59e0b" style={{ color: '#f59e0b', flexShrink: 0 }} />
                      )}
                    </div>
                    {isSvc && <ServiceBadge />}
                  </div>
                  <div className="supplier-card-location">
                    <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {supplier.location}
                  </div>
                </div>
              </div>

              <div className="supplier-kpi-bar">
                <div className="supplier-kpi-tag" style={{
                  background: `${risk.color}15`, color: risk.color, fontWeight: 600
                }}>
                  <RiskIcon size={11} /> {risk.label}
                </div>
                <div className="supplier-kpi-tag">
                  {supplier.kpis.deliveryPerformance >= 95
                    ? <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                    : supplier.kpis.deliveryPerformance >= 88
                    ? <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                    : <XCircle size={12} style={{ color: '#f43f5e' }} />
                  }
                  {supplier.kpis.deliveryPerformance}% {isSvc ? 'perf.' : 'del.'}
                </div>
                <div className="supplier-kpi-tag">↕ {supplier.kpis.priceVariation}%</div>
                <div className="supplier-kpi-tag">⏱ {supplier.kpis.responseTime}h</div>
                {(supplier.notes?.length ?? 0) > 0 && (
                  <div className="supplier-kpi-tag">
                    <MessageSquare size={11} /> {supplier.notes!.length}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11, color: supplier.preferred ? '#f59e0b' : 'var(--text-muted)', padding: '3px 8px' }}
                  onClick={e => { e.stopPropagation(); togglePreferredSupplier(supplier.id); }}
                >
                  {supplier.preferred ? <><StarOff size={12} /> Unmark</> : <><Star size={12} /> Prefer</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Search size={48} />
          <h3>No suppliers found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
