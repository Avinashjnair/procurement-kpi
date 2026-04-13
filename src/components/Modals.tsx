'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Upload, Plus, Trash2, MessageSquare, FileText, Building2, MapPin, Mail, Phone, Hash, Wrench, CheckSquare, Square, Landmark } from 'lucide-react';
import type { POStatus, PaymentStatus, DocumentCategory, POItem, ServiceBillingType, ServiceMilestone } from '@/data/mockData';
import { companyInfo } from '@/data/mockData';

// ── All document categories (goods + services) ──
const DOC_CATEGORIES: DocumentCategory[] = [
  'MTC', 'COO', 'BL/AWB', 'Delivery Note', 'Packing List', 'Invoice',
  'Internal Inspection Report', 'Work Completion Certificate', 'Service Report',
  'Timesheet', 'SLA Report',
];

const GOODS_DOC_CATEGORIES: DocumentCategory[] = [
  'MTC', 'COO', 'BL/AWB', 'Delivery Note', 'Packing List', 'Invoice', 'Internal Inspection Report',
];
const SERVICE_DOC_CATEGORIES: DocumentCategory[] = [
  'Work Completion Certificate', 'Service Report', 'Timesheet', 'SLA Report', 'Invoice',
];

const BILLING_TYPES: ServiceBillingType[] = ['Fixed Price', 'Hourly Rate', 'Milestone Based', 'Lump Sum'];

// ────────────────────────────────────────────────
// Milestone editor sub-component
// ────────────────────────────────────────────────
function MilestoneEditor({
  milestones,
  onChange,
}: {
  milestones: ServiceMilestone[];
  onChange: (ms: ServiceMilestone[]) => void;
}) {
  const addMilestone = () => {
    const newMs: ServiceMilestone = {
      id: `MS-${Date.now()}`,
      description: '',
      percentage: 0,
      dueDate: '',
      completed: false,
    };
    onChange([...milestones, newMs]);
  };

  const updateMs = (idx: number, field: keyof ServiceMilestone, value: string | number | boolean) => {
    onChange(milestones.map((ms, i) => i === idx ? { ...ms, [field]: value } : ms));
  };

  const removeMs = (idx: number) => onChange(milestones.filter((_, i) => i !== idx));

  const totalPct = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>Milestones</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: totalPct === 100 ? 'var(--accent-emerald)' : totalPct > 100 ? 'var(--accent-rose)' : 'var(--accent-amber)',
          }}>
            Total: {totalPct}%
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addMilestone}>
            <Plus size={13} /> Add milestone
          </button>
        </div>
      </div>
      {milestones.map((ms, i) => (
        <div key={ms.id} style={{
          display: 'grid',
          gridTemplateColumns: '2fr 80px 130px auto',
          gap: 8,
          marginBottom: 6,
          padding: '10px 12px',
          background: 'rgba(99,102,241,0.04)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
        }}>
          <input
            type="text"
            className="form-input"
            placeholder="Milestone description"
            value={ms.description}
            onChange={e => updateMs(i, 'description', e.target.value)}
            style={{ margin: 0 }}
          />
          <input
            type="number"
            className="form-input"
            placeholder="%"
            value={ms.percentage || ''}
            min={0}
            max={100}
            onChange={e => updateMs(i, 'percentage', Number(e.target.value))}
            style={{ margin: 0 }}
          />
          <input
            type="date"
            className="form-input"
            value={ms.dueDate}
            onChange={e => updateMs(i, 'dueDate', e.target.value)}
            style={{ margin: 0 }}
          />
          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMs(i)}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      {milestones.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          No milestones yet — click &ldquo;Add milestone&rdquo; above
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// New PO Modal – 3-Step Wizard (service-aware)
// ────────────────────────────────────────────────
function NewPOModal() {
  const { suppliers, items, addPurchaseOrder, setModalOpen, purchaseOrders } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [supplierId, setSupplierId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [customPaymentTerms, setCustomPaymentTerms] = useState('');
  const [useCustomPayment, setUseCustomPayment] = useState(false);
  const [incoterms, setIncoterms] = useState('CIF');
  const [dueDate, setDueDate] = useState('');
  const [eta, setEta] = useState('');
  const [projectReference, setProjectReference] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [approvalAuthority, setApprovalAuthority] = useState('');
  const [remarks, setRemarks] = useState('');

  // Each row now carries optional serviceDetails
  const [poItems, setPOItems] = useState<{
    itemId: string;
    quantity: string;
    unitPrice: string;
    scopeOfWork: string;
    duration: string;
    slaTerms: string;
    billingType: ServiceBillingType;
    milestones: ServiceMilestone[];
    showServiceFields: boolean;
    isAsset: boolean;
  }[]>([{ itemId: '', quantity: '', unitPrice: '', scopeOfWork: '', duration: '', slaTerms: '', billingType: 'Fixed Price', milestones: [], showServiceFields: false, isAsset: false }]);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const availableItems = supplierId
    ? items.filter(i => i.linkedSupplierIds.includes(supplierId))
    : items;

  const isServiceItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.category === 'Services';
  };

  const addRow = () => setPOItems(prev => [...prev, { itemId: '', quantity: '', unitPrice: '', scopeOfWork: '', duration: '', slaTerms: '', billingType: 'Fixed Price', milestones: [], showServiceFields: false, isAsset: false }]);
  const removeRow = (i: number) => setPOItems(prev => prev.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: string, value: unknown) => {
    setPOItems(prev => prev.map((row, idx) => {
      if (idx !== i) return row;
      const updated = { ...row, [field]: value };
      // auto-detect service and toggle fields
      if (field === 'itemId') {
        const itm = items.find(x => x.id === value);
        if (itm?.category === 'Services') {
          return { ...updated, showServiceFields: true, incoterms: 'N/A', billingType: itm.serviceDetails?.billingType || 'Fixed Price', scopeOfWork: itm.serviceDetails?.scopeOfWork || '', duration: itm.serviceDetails?.duration || '', slaTerms: itm.serviceDetails?.slaTerms || '', milestones: itm.serviceDetails?.milestones ? [...itm.serviceDetails.milestones] : [], unitPrice: itm.currentPrice.toString() };
        }
        return { ...updated, showServiceFields: false };
      }
      return updated;
    }));
  };

  const resolvedPaymentTerms = useCustomPayment ? customPaymentTerms : paymentTerms;
  const hasServiceLines = poItems.some(r => r.itemId && isServiceItem(r.itemId));

  const validItems = poItems
    .filter(pi => pi.itemId && pi.quantity && pi.unitPrice)
    .map(pi => {
      const item = items.find(i => i.id === pi.itemId);
      const isSvc = item?.category === 'Services';
      const base: POItem = {
        itemId: pi.itemId,
        itemName: item?.name || pi.itemId,
        quantity: parseFloat(pi.quantity),
        unitPrice: parseFloat(pi.unitPrice),
        isAsset: pi.isAsset,
      };
      if (isSvc) {
        base.isService = true;
        base.serviceDetails = {
          billingType: pi.billingType,
          scopeOfWork: pi.scopeOfWork,
          duration: pi.duration,
          slaTerms: pi.slaTerms,
          milestones: pi.billingType === 'Milestone Based' ? pi.milestones : undefined,
        };
      }
      return base;
    });

  const totalAmount = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const newId = `PO-${String(purchaseOrders.length + 1).padStart(3, '0')}`;

  const canProceedStep1 = supplierId && dueDate && eta && validItems.length > 0 && (useCustomPayment ? customPaymentTerms.trim() : true);

  const handleSubmit = () => {
    addPurchaseOrder({
      id: newId,
      dateOfIssue: new Date().toISOString().split('T')[0],
      supplierId,
      supplierName: selectedSupplier?.name || '',
      items: validItems,
      totalAmount,
      paymentTerms: resolvedPaymentTerms,
      amountPaid: 0,
      dateOfPayment: null,
      dueDate,
      deliveryStatus: 'Draft' as POStatus,
      paymentStatus: 'Unpaid' as PaymentStatus,
      eta,
      incoterms: hasServiceLines ? 'N/A' : incoterms,
      remarks: remarks.trim() || undefined,
      projectReference: projectReference.trim() || undefined,
      requestNumber: requestNumber.trim() || undefined,
      approvalAuthority: approvalAuthority.trim() || undefined,
    });
    setModalOpen(null);
  };

  const StepIndicator = () => (
    <div className="po-steps">
      {[{ num: 1, label: 'PO Details' }, { num: 2, label: 'Remarks' }, { num: 3, label: 'Draft Preview' }].map((s, i) => (
        <React.Fragment key={s.num}>
          <div
            className={`po-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
            onClick={() => { if (s.num < step) setStep(s.num as 1 | 2 | 3); }}
            style={{ cursor: s.num < step ? 'pointer' : 'default' }}
          >
            <div className="po-step-circle">{step > s.num ? '✓' : s.num}</div>
            <span className="po-step-label">{s.label}</span>
          </div>
          {i < 2 && <div className={`po-step-line ${step > s.num ? 'completed' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  // ── STEP 1 ──
  if (step === 1) return (
    <div>
      <StepIndicator />
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Supplier</label>
          <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
            <option value="">Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            Payment Terms
            <button type="button" className="btn-toggle-custom" onClick={() => setUseCustomPayment(!useCustomPayment)}>
              {useCustomPayment ? '← Standard' : '✏️ Custom'}
            </button>
          </label>
          {useCustomPayment ? (
            <input type="text" className="form-input" placeholder="e.g., Milestone based" value={customPaymentTerms} onChange={e => setCustomPaymentTerms(e.target.value)} required />
          ) : (
            <select className="form-select" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
              <option>Net 30</option><option>Net 45</option><option>Net 60</option><option>Net 90</option>
              <option>Immediate</option><option>50% Advance, 50% on Delivery</option>
              <option>Letter of Credit (LC)</option><option>Cash Against Delivery (CAD)</option>
              <option>Milestone Based</option>
            </select>
          )}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">ETA / Completion Date</label>
          <input type="date" className="form-input" value={eta} onChange={e => setEta(e.target.value)} required />
        </div>
      </div>
      {!hasServiceLines && (
        <div className="form-group">
          <label className="form-label">Incoterms</label>
          <select className="form-select" value={incoterms} onChange={e => setIncoterms(e.target.value)}>
            <option>CIF</option><option>FOB</option><option>EXW</option><option>DDP</option>
            <option>DAP</option><option>FCA</option><option>CPT</option><option>CFR</option>
          </select>
        </div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Project Reference</label>
          <input type="text" className="form-input" value={projectReference} onChange={e => setProjectReference(e.target.value)} placeholder="e.g., PRJ-2026-0048" />
        </div>
        <div className="form-group">
          <label className="form-label">Request Number</label>
          <input type="text" className="form-input" value={requestNumber} onChange={e => setRequestNumber(e.target.value)} placeholder="e.g., REQ-04-0012" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Approval Authority</label>
        <input type="text" className="form-input" value={approvalAuthority} onChange={e => setApprovalAuthority(e.target.value)} placeholder="Name and title" />
      </div>

      {/* Line Items */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Line Items</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}><Plus size={14} /> Add Row</button>
        </div>

        {poItems.map((row, i) => {
          const isSvc = row.itemId && isServiceItem(row.itemId);
          return (
            <div key={i} style={{ marginBottom: 12, border: '1px solid var(--border-color)', borderRadius: 10, padding: 12, background: isSvc ? 'rgba(99,102,241,0.03)' : 'transparent' }}>
              {isSvc && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--accent-violet)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Wrench size={12} /> Service line
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: isSvc ? 8 : 0 }}>
                <select className="form-select" value={row.itemId} onChange={e => updateRow(i, 'itemId', e.target.value)} required>
                  <option value="">Select Item / Service</option>
                  <optgroup label="── Goods ──">
                    {availableItems.filter(x => x.category !== 'Services').map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Services ──">
                    {availableItems.filter(x => x.category === 'Services').map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </optgroup>
                </select>
                <input type="number" className="form-input" placeholder={isSvc ? 'Qty / Units' : 'Qty'} value={row.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)} min="1" required />
                <input type="number" className="form-input" placeholder="Unit Price" value={row.unitPrice} onChange={e => updateRow(i, 'unitPrice', e.target.value)} min="0" step="0.01" required />
                
                <button 
                  type="button" 
                  className={`btn-asset-toggle ${row.isAsset ? 'active' : ''}`} 
                  onClick={() => updateRow(i, 'isAsset', !row.isAsset)}
                  title={row.isAsset ? "Marked as Capital Asset" : "Mark as Capital Asset"}
                >
                  <Landmark size={14} />
                  <span style={{ fontSize: 10 }}>Asset</span>
                </button>

                {poItems.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(i)}><Trash2 size={14} /></button>}
              </div>

              {/* Service-specific fields */}
              {isSvc && (
                <div>
                  <div className="form-row" style={{ marginBottom: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Billing Type</label>
                      <select className="form-select" value={row.billingType} onChange={e => updateRow(i, 'billingType', e.target.value as ServiceBillingType)}>
                        {BILLING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Duration</label>
                      <input type="text" className="form-input" placeholder="e.g., 3 months" value={row.duration} onChange={e => updateRow(i, 'duration', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="form-label">Scope of Work</label>
                    <textarea className="form-input" rows={2} placeholder="Describe the scope..." value={row.scopeOfWork} onChange={e => updateRow(i, 'scopeOfWork', e.target.value)} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: row.billingType === 'Milestone Based' ? 8 : 0 }}>
                    <label className="form-label">SLA Terms</label>
                    <input type="text" className="form-input" placeholder="e.g., Response within 4h" value={row.slaTerms} onChange={e => updateRow(i, 'slaTerms', e.target.value)} />
                  </div>
                  {row.billingType === 'Milestone Based' && (
                    <MilestoneEditor
                      milestones={row.milestones}
                      onChange={ms => updateRow(i, 'milestones', ms)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {validItems.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', marginTop: 8, background: 'rgba(99,102,241,0.08)', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
            Subtotal: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={() => setStep(2)} disabled={!canProceedStep1}>Next: Add Remarks →</button>
      </div>
    </div>
  );

  // ── STEP 2: Remarks ──
  if (step === 2) return (
    <div>
      <StepIndicator />
      <div className="remarks-dialog">
        <div className="remarks-header">
          <MessageSquare size={20} />
          <div>
            <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: 15 }}>Purchase Order Remarks</h4>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Add notes, special instructions or terms</p>
          </div>
        </div>
        <div className="remarks-suggestions">
          <span className="remarks-suggestion-label">Quick Add:</span>
          {(hasServiceLines
            ? ['Weekly progress reports required', 'HSE induction before mobilisation', 'Approval required before next phase', 'Inspector access 24/7']
            : ['Urgent delivery required', 'Inspection before dispatch', 'Include test certificates', 'Partial shipment allowed']
          ).map(s => (
            <button key={s} type="button" className="remarks-chip" onClick={() => setRemarks(prev => prev ? `${prev}\n• ${s}` : `• ${s}`)}>+ {s}</button>
          ))}
        </div>
        <textarea className="remarks-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter remarks, special instructions..." rows={5} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Next: Preview Draft →</button>
      </div>
    </div>
  );

  // ── STEP 3: Draft Preview ──
  return (
    <div>
      <StepIndicator />
      <div className="draft-po">
        <div className="draft-po-header">
          <div className="draft-po-badge">DRAFT</div>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, color: '#f1f5f9' }}>Purchase Order — {newId}</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Issued {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {hasServiceLines && <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>SERVICES</span>}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace' }}>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <span className="badge pending" style={{ fontSize: 10 }}><span className="badge-dot" /> Draft</span>
          </div>
        </div>

        <div className="draft-po-parties">
          <div className="draft-po-party">
            <h4 className="draft-po-party-title"><Building2 size={14} /> From (Buyer)</h4>
            <p className="draft-po-party-name">{companyInfo.name}</p>
            <p className="draft-po-party-line"><MapPin size={12} /> {companyInfo.address}</p>
            <p className="draft-po-party-line"><Mail size={12} /> {companyInfo.email}</p>
            <p className="draft-po-party-line"><Phone size={12} /> {companyInfo.phone}</p>
            <p className="draft-po-party-line"><Hash size={12} /> TRN: {companyInfo.taxRegNumber}</p>
          </div>
          <div className="draft-po-party">
            <h4 className="draft-po-party-title"><Building2 size={14} /> To (Supplier)</h4>
            <p className="draft-po-party-name">{selectedSupplier?.name}</p>
            <p className="draft-po-party-line"><MapPin size={12} /> {selectedSupplier?.address}</p>
            <p className="draft-po-party-line"><Mail size={12} /> {selectedSupplier?.email}</p>
            <p className="draft-po-party-line"><Phone size={12} /> {selectedSupplier?.phone}</p>
            <p className="draft-po-party-line"><Hash size={12} /> TRN: {selectedSupplier?.taxRegNumber}</p>
          </div>
        </div>

        {(projectReference || requestNumber) && (
          <div className="draft-po-ref-row">
            {projectReference && <div className="draft-po-ref"><span className="draft-po-ref-label">Project Reference</span><span className="draft-po-ref-value">{projectReference}</span></div>}
            {requestNumber && <div className="draft-po-ref"><span className="draft-po-ref-label">Request Number</span><span className="draft-po-ref-value">{requestNumber}</span></div>}
          </div>
        )}

        <div className="draft-po-grid">
          <div className="draft-po-field"><span className="draft-po-field-label">Payment Terms</span><span className="draft-po-field-value">{resolvedPaymentTerms}</span></div>
          <div className="draft-po-field"><span className="draft-po-field-label">Due Date</span><span className="draft-po-field-value">{dueDate}</span></div>
          <div className="draft-po-field"><span className="draft-po-field-label">{hasServiceLines ? 'Completion Date' : 'ETA'}</span><span className="draft-po-field-value">{eta}</span></div>
          <div className="draft-po-field">
            <span className="draft-po-field-label">Incoterms</span>
            <span className="draft-po-field-value"><span className="badge approved" style={{ fontSize: 11 }}>{hasServiceLines ? 'N/A' : incoterms}</span></span>
          </div>
          <div className="draft-po-field"><span className="draft-po-field-label">Payment Status</span><span className="draft-po-field-value"><span className="badge pending" style={{ fontSize: 11 }}><span className="badge-dot" /> Unpaid</span></span></div>
          <div className="draft-po-field"><span className="draft-po-field-label">Delivery Status</span><span className="draft-po-field-value"><span className="badge pending" style={{ fontSize: 11 }}><span className="badge-dot" /> Draft</span></span></div>
        </div>

        {/* Line items table */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Line Items ({validItems.length})</h4>
          <table className="draft-po-table">
            <thead>
              <tr>
                <th>#</th><th>Item / Service</th><th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th><th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {validItems.map((item, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.isService && <Wrench size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />}
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.itemName}</span>
                      </div>
                      {item.isService && item.serviceDetails && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, paddingLeft: 18 }}>
                          {item.serviceDetails.billingType} · {item.serviceDetails.duration}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>{item.quantity.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: '#f1f5f9' }}>
                      ${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {/* Milestone sub-rows */}
                  {item.isService && item.serviceDetails?.milestones && item.serviceDetails.milestones.length > 0 && (
                    item.serviceDetails.milestones.map(ms => (
                      <tr key={ms.id} style={{ background: 'rgba(139,92,246,0.04)' }}>
                        <td />
                        <td colSpan={2} style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 28 }}>
                          ↳ {ms.description} — due {ms.dueDate}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 11, color: '#a78bfa' }}>{ms.percentage}%</td>
                        <td style={{ textAlign: 'right', fontSize: 11, fontFamily: 'monospace', color: '#a78bfa' }}>
                          ${((item.quantity * item.unitPrice * ms.percentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px' }}>Grand Total</td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, fontFamily: 'monospace' }}>
                  ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {remarks.trim() && (
          <div className="draft-po-remarks">
            <h4 style={{ margin: '0 0 6px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} /> Remarks
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{remarks}</p>
          </div>
        )}

        <div className="draft-po-signature">
          <div className="draft-po-signature-block">
            <p className="draft-po-sig-label">Prepared By</p>
            <div className="draft-po-sig-line" />
            <p className="draft-po-sig-name">Procurement Department</p>
            <p className="draft-po-sig-date">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="draft-po-signature-block">
            <p className="draft-po-sig-label">Approved By</p>
            <div className="draft-po-sig-line" />
            <p className="draft-po-sig-name">{approvalAuthority || '—'}</p>
            <p className="draft-po-sig-date">Date: _______________</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>✏️ Edit</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}><FileText size={16} /> Create Purchase Order</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// New Item Modal (Services-aware)
// ────────────────────────────────────────────────
function NewItemModal() {
  const { suppliers, addItem, setModalOpen, items } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Piping');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('piece');
  const [currentPrice, setCurrentPrice] = useState('');
  const [linkedSuppliers, setLinkedSuppliers] = useState<string[]>([]);
  // Service fields
  const [billingType, setBillingType] = useState<ServiceBillingType>('Fixed Price');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [duration, setDuration] = useState('');
  const [slaTerms, setSlaTerms] = useState('');
  const [milestones, setMilestones] = useState<ServiceMilestone[]>([]);

  const isService = category === 'Services';

  // Auto-switch unit when category changes
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val === 'Services') {
      setUnit('lump sum');
    } else {
      setUnit('piece');
    }
  };

  const toggleSupplier = (id: string) => {
    setLinkedSuppliers(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const serviceSuppliers = suppliers.filter(s =>
    s.kpis.deliveryTerms === 'N/A' || linkedSuppliers.includes(s.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentPrice) return;
    const newId = `ITM-${String(items.length + 1).padStart(3, '0')}`;
    addItem({
      id: newId,
      name,
      category: category as import('@/data/mockData').ItemCategory,
      description,
      unit,
      currentPrice: parseFloat(currentPrice),
      linkedSupplierIds: linkedSuppliers,
      priceHistory: [{ date: new Date().toISOString().slice(0, 7), price: parseFloat(currentPrice), supplierId: linkedSuppliers[0] || '' }],
      purchaseHistory: [],
      serviceDetails: isService ? {
        billingType,
        scopeOfWork,
        duration,
        slaTerms,
        milestones: billingType === 'Milestone Based' ? milestones : undefined,
      } : undefined,
    });
    setModalOpen(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Item / Service Name</label>
        <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder={isService ? 'e.g., Annual Inspection Contract' : 'e.g., Carbon Steel Pipe (8")'} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={category} onChange={e => handleCategoryChange(e.target.value)}>
            <optgroup label="── Goods ──">
              <option>Piping</option><option>Valves</option><option>Fittings</option>
              <option>Chemicals</option><option>Electrical</option><option>Instrumentation</option>
            </optgroup>
            <optgroup label="── Services ──">
              <option value="Services">Services</option>
            </optgroup>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Unit / Billing Unit</label>
          {isService ? (
            <select className="form-select" value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="lump sum">Lump Sum</option>
              <option value="hour">Hour</option>
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="visit">Visit</option>
            </select>
          ) : (
            <select className="form-select" value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="piece">Piece</option><option value="meter">Meter</option>
              <option value="ton">Ton</option><option value="kg">Kg</option>
              <option value="set">Set</option><option value="lot">Lot</option>
            </select>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <input type="text" className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder={isService ? 'Brief description of the service...' : 'Item specifications...'} />
      </div>
      <div className="form-group">
        <label className="form-label">{isService ? 'Rate / Price ($)' : 'Current Price ($)'}</label>
        <input type="number" className="form-input" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} required min="0" step="0.01" placeholder="0.00" />
      </div>

      {/* ── Service-specific fields ── */}
      {isService && (
        <div style={{ border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 16, marginBottom: 18, background: 'rgba(139,92,246,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Wrench size={14} /> Service Details
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Billing Type</label>
              <select className="form-select" value={billingType} onChange={e => setBillingType(e.target.value as ServiceBillingType)}>
                {BILLING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input type="text" className="form-input" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 12 months, ongoing" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Scope of Work</label>
            <textarea
              className="form-input"
              rows={3}
              value={scopeOfWork}
              onChange={e => setScopeOfWork(e.target.value)}
              placeholder="Describe the full scope of work, deliverables, and acceptance criteria..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: billingType === 'Milestone Based' ? 12 : 0 }}>
            <label className="form-label">SLA Terms</label>
            <input type="text" className="form-input" value={slaTerms} onChange={e => setSlaTerms(e.target.value)} placeholder="e.g., Response within 4h, resolution within 24h" />
          </div>
          {billingType === 'Milestone Based' && (
            <MilestoneEditor milestones={milestones} onChange={setMilestones} />
          )}
        </div>
      )}

      {/* Linked Suppliers */}
      <div className="form-group">
        <label className="form-label">Linked {isService ? 'Service Providers' : 'Suppliers'}</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(isService ? suppliers : suppliers.filter(s => s.kpis.deliveryTerms !== 'N/A')).map(s => (
            <button
              key={s.id}
              type="button"
              className={`btn btn-sm ${linkedSuppliers.includes(s.id) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => toggleSupplier(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
        <button type="submit" className="btn btn-primary">{isService ? <><Wrench size={14} /> Add Service</> : 'Add Item'}</button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────
// Upload Document Modal (service-aware categories)
// ────────────────────────────────────────────────
function UploadDocModal() {
  const { purchaseOrders, items, addDocument, setModalOpen, documents } = useApp();
  const [poId, setPOId] = useState('');
  const [itemId, setItemId] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Invoice');
  const [fileName, setFileName] = useState('');

  const selectedPO = purchaseOrders.find(po => po.id === poId);
  const poItemIds = selectedPO ? selectedPO.items.map(i => i.itemId) : [];
  const availableItems = poItemIds.length > 0 ? items.filter(i => poItemIds.includes(i.id)) : items;
  const hasServiceLines = selectedPO?.items.some(i => i.isService);

  // Suggest relevant categories based on PO type
  const suggestedCategories = hasServiceLines ? SERVICE_DOC_CATEGORIES : GOODS_DOC_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !itemId || !fileName) return;
    const newId = `DOC-${String(documents.length + 1).padStart(3, '0')}`;
    addDocument({
      id: newId,
      name: fileName,
      category,
      poId,
      itemId,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: `${(Math.random() * 3 + 0.2).toFixed(1)} MB`,
      fileType: 'PDF',
    });
    setModalOpen(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="upload-zone" style={{ marginBottom: 20 }}>
        <Upload />
        <p>Click to upload or drag & drop</p>
        <span>PDF, DOC, XLS up to 10MB</span>
      </div>
      <div className="form-group">
        <label className="form-label">File Name</label>
        <input type="text" className="form-input" value={fileName} onChange={e => setFileName(e.target.value)} required placeholder="Document_Name.pdf" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Purchase Order</label>
          <select className="form-select" value={poId} onChange={e => { setPOId(e.target.value); setCategory('Invoice'); }} required>
            <option value="">Select PO</option>
            {purchaseOrders.map(po => (
              <option key={po.id} value={po.id}>
                {po.id} - {po.supplierName}{po.items.some(i => i.isService) ? ' [SVC]' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Item / Service</label>
          <select className="form-select" value={itemId} onChange={e => setItemId(e.target.value)} required>
            <option value="">Select Item</option>
            {availableItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">
          Document Category
          {hasServiceLines && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: '#a78bfa', padding: '2px 6px', background: 'rgba(139,92,246,0.1)', borderRadius: 4 }}>
              Service doc types shown
            </span>
          )}
        </label>
        <select className="form-select" value={category} onChange={e => setCategory(e.target.value as DocumentCategory)}>
          <optgroup label={hasServiceLines ? '── Service Documents ──' : '── Standard Documents ──'}>
            {suggestedCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="── All Categories ──">
            {DOC_CATEGORIES.filter(c => !suggestedCategories.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
        <button type="submit" className="btn btn-primary"><Upload size={16} /> Upload Document</button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────
// New Asset Modal
// ────────────────────────────────────────────────
function NewAssetModal() {
  const { suppliers, assets, assetCategories, addAsset, addAssetCategory, setModalOpen, purchaseOrders } = useApp();
  const [name, setName] = useState('');
  const [poId, setPOId] = useState('');
  const [category, setCategory] = useState(assetCategories[0] || '');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseValue, setPurchaseValue] = useState('');
  const [salvageValue, setSalvageValue] = useState('0');
  const [depreciationRate, setDepreciationRate] = useState('20'); // 20% default
  const [usefulLife, setUsefulLife] = useState('5');
  const [location, setLocation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [maintenancePlan, setMaintenancePlan] = useState('Quarterly');
  const [warrantyDetails, setWarrantyDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !supplierId || !purchaseValue) return;

    let finalCategory = category;
    if (isAddingCategory && newCategory) {
      addAssetCategory(newCategory);
      finalCategory = newCategory;
    }

    const newAsset: any = {
      id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      name,
      category: finalCategory,
      supplierId,
      poId: poId || undefined,
      purchaseDate,
      purchaseValue: parseFloat(purchaseValue),
      salvageValue: parseFloat(salvageValue),
      depreciationRate: parseFloat(depreciationRate) / 100,
      usefulLife: parseInt(usefulLife),
      location,
      serialNumber,
      warrantyExpiry,
      maintenancePlan,
      warrantyDetails,
      maintenanceHistory: [],
      status: 'Active',
    };

    addAsset(newAsset);
    setModalOpen(null);
  };

  const handlePOChange = (id: string) => {
    setPOId(id);
    const po = purchaseOrders.find(p => p.id === id);
    if (po) {
      setPurchaseValue(po.totalAmount.toString());
      setPurchaseDate(po.dateOfIssue);
      setSupplierId(po.supplierId);
    }
  };

  const filteredPOs = supplierId 
    ? purchaseOrders.filter(p => p.supplierId === supplierId && (p.deliveryStatus === 'Delivered' || p.deliveryStatus === 'Approved'))
    : purchaseOrders.filter(p => p.deliveryStatus === 'Delivered' || p.deliveryStatus === 'Approved');

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Asset Name</label>
        <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Industrial Air Compressor" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Category
            <button type="button" className="btn-toggle-custom" onClick={() => setIsAddingCategory(!isAddingCategory)}>
              {isAddingCategory ? '← Select' : '+ New'}
            </button>
          </label>
          {isAddingCategory ? (
            <input type="text" className="form-input" placeholder="New Category Name" value={newCategory} onChange={e => setNewCategory(e.target.value)} required />
          ) : (
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} required>
              {assetCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Supplier</label>
          <select className="form-select" value={supplierId} onChange={e => { setSupplierId(e.target.value); setPOId(''); }} required={!poId}>
            <option value="">Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Linked Purchase Order (Optional)</label>
        <select className="form-select" value={poId} onChange={e => handlePOChange(e.target.value)}>
          <option value="">Select PO Reference</option>
          {filteredPOs.map(po => (
            <option key={po.id} value={po.id}>
              {po.id} — {po.supplierName} (${po.totalAmount.toLocaleString()})
            </option>
          ))}
        </select>
        {poId && <p style={{ fontSize: 11, color: '#a78bfa', marginTop: 4 }}>Auto-filled from selected PO</p>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Purchase Date</label>
          <input type="date" className="form-input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Purchase Value ($)</label>
          <input type="number" className="form-input" value={purchaseValue} onChange={e => setPurchaseValue(e.target.value)} required min="0" step="0.01" />
        </div>
      </div>

      <div className="grid-3">
        <div className="form-group">
          <label className="form-label">Useful Life (Yrs)</label>
          <input type="number" className="form-input" value={usefulLife} onChange={e => setUsefulLife(e.target.value)} required min="1" />
        </div>
        <div className="form-group">
          <label className="form-label">Deprec. Rate (%)</label>
          <input type="number" className="form-input" value={depreciationRate} onChange={e => setDepreciationRate(e.target.value)} required min="0" max="100" />
        </div>
        <div className="form-group">
          <label className="form-label">Salvage Value</label>
          <input type="number" className="form-input" value={salvageValue} onChange={e => setSalvageValue(e.target.value)} min="0" step="0.01" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Location</label>
          <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Warehouse B, Bay 4" />
        </div>
        <div className="form-group">
          <label className="form-label">Maintenance Plan</label>
          <select className="form-select" value={maintenancePlan} onChange={e => setMaintenancePlan(e.target.value)}>
            <option>Monthly</option><option>Quarterly</option><option>Bi-Annual</option><option>Annual</option><option>On-Demand</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Warranty Expiry</label>
          <input type="date" className="form-input" value={warrantyExpiry} onChange={e => setWarrantyExpiry(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Serial Number</label>
          <input type="text" className="form-input" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="SN-XXXXX" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Warranty Details / Clauses</label>
        <textarea className="form-input" rows={2} value={warrantyDetails} onChange={e => setWarrantyDetails(e.target.value)} placeholder="Standard warranty terms..." />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
        <button type="submit" className="btn btn-primary">Register Asset</button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────
// Log Maintenance Modal
// ────────────────────────────────────────────────
function LogMaintenanceModal() {
  const { assets, selectedAssetId, logMaintenance, setModalOpen, currentUser } = useApp();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const asset = assets.find(a => a.id === selectedAssetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !activity || !cost) return;

    logMaintenance(selectedAssetId, {
      date,
      activity,
      cost: parseFloat(cost),
      performedBy: currentUser?.name || 'Authorized Personnel',
      notes,
    });
    setModalOpen(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Logging maintenance for: <strong style={{ color: '#f1f5f9' }}>{asset?.name} ({asset?.id})</strong>
      </p>
      
      <div className="form-group">
        <label className="form-label">Maintenance Activity</label>
        <input type="text" className="form-input" value={activity} onChange={e => setActivity(e.target.value)} required placeholder="e.g. Pump Seal Replacement" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Service Date</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Total Cost ($)</label>
          <input type="number" className="form-input" value={cost} onChange={e => setCost(e.target.value)} required min="0" step="0.01" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Detailed Notes</label>
        <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Technical findings, parts replaced..." />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save Maintenance Record</button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────
// Modal Container
// ────────────────────────────────────────────────
export default function Modals() {
  const { modalOpen, setModalOpen } = useApp();
  if (!modalOpen) return null;

  const titles: Record<string, string> = {
    newPO: 'Create New Purchase Order',
    newItem: 'Add New Item or Service',
    uploadDoc: 'Upload Document',
    newAsset: 'Register Capital Asset',
    logMaintenance: 'Log Maintenance Activity',
  };

  return (
    <div className="modal-overlay" onClick={() => setModalOpen(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{titles[modalOpen] || 'Modal'}</h3>
          <button className="modal-close" onClick={() => setModalOpen(null)}><X size={18} /></button>
        </div>
        <div className="modal-content" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '0 20px 20px' }}>
          {modalOpen === 'newPO' && <NewPOModal />}
          {modalOpen === 'newItem' && <NewItemModal />}
          {modalOpen === 'uploadDoc' && <UploadDocModal />}
          {modalOpen === 'newAsset' && <NewAssetModal />}
          {modalOpen === 'logMaintenance' && <LogMaintenanceModal />}
        </div>
      </div>
    </div>
  );
}
