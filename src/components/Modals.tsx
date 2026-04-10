'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Upload, Plus, Trash2, MessageSquare, FileText, Building2, MapPin, Mail, Phone, Hash } from 'lucide-react';
import type { POStatus, PaymentStatus, DocumentCategory, POItem } from '@/data/mockData';
import { companyInfo } from '@/data/mockData';

const DOC_CATEGORIES: DocumentCategory[] = [
  'MTC', 'COO', 'BL/AWB', 'Delivery Note', 'Packing List', 'Invoice', 'Internal Inspection Report',
];

// ============================================
// New PO Modal – 3-Step Wizard
// Step 1: PO Details (with custom payment terms)
// Step 2: Remarks Dialog
// Step 3: Draft PO Preview
// ============================================
function NewPOModal() {
  const { suppliers, items, addPurchaseOrder, setModalOpen, purchaseOrders } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [customPaymentTerms, setCustomPaymentTerms] = useState('');
  const [useCustomPayment, setUseCustomPayment] = useState(false);
  const [incoterms, setIncoterms] = useState('CIF');
  const [dueDate, setDueDate] = useState('');
  const [eta, setEta] = useState('');
  const [poItems, setPOItems] = useState<{ itemId: string; quantity: string; unitPrice: string }[]>([
    { itemId: '', quantity: '', unitPrice: '' },
  ]);

  // Reference fields
  const [projectReference, setProjectReference] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [approvalAuthority, setApprovalAuthority] = useState('');

  // Remarks state
  const [remarks, setRemarks] = useState('');

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const availableItems = supplierId
    ? items.filter(i => i.linkedSupplierIds.includes(supplierId))
    : items;

  const addRow = () => {
    setPOItems(prev => [...prev, { itemId: '', quantity: '', unitPrice: '' }]);
  };

  const removeRow = (index: number) => {
    setPOItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: string) => {
    setPOItems(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const resolvedPaymentTerms = useCustomPayment ? customPaymentTerms : paymentTerms;

  const validItems = poItems
    .filter(pi => pi.itemId && pi.quantity && pi.unitPrice)
    .map(pi => {
      const item = items.find(i => i.id === pi.itemId);
      return {
        itemId: pi.itemId,
        itemName: item?.name || pi.itemId,
        quantity: parseFloat(pi.quantity),
        unitPrice: parseFloat(pi.unitPrice),
      };
    });

  const totalAmount = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const newId = `PO-${String(purchaseOrders.length + 1).padStart(3, '0')}`;

  const canProceedStep1 = supplierId && dueDate && eta && validItems.length > 0 && (useCustomPayment ? customPaymentTerms.trim() : true);

  const handleGoToRemarks = () => {
    if (!canProceedStep1) return;
    setStep(2);
  };

  const handleGoToDraft = () => {
    setStep(3);
  };

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
      incoterms,
      remarks: remarks.trim() || undefined,
      projectReference: projectReference.trim() || undefined,
      requestNumber: requestNumber.trim() || undefined,
      approvalAuthority: approvalAuthority.trim() || undefined,
    });
    setModalOpen(null);
  };

  // ─── Step Indicator ───
  const StepIndicator = () => (
    <div className="po-steps">
      {[
        { num: 1, label: 'PO Details' },
        { num: 2, label: 'Remarks' },
        { num: 3, label: 'Draft Preview' },
      ].map((s, i) => (
        <React.Fragment key={s.num}>
          <div
            className={`po-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
            onClick={() => { if (s.num < step) setStep(s.num as 1 | 2 | 3); }}
            style={{ cursor: s.num < step ? 'pointer' : 'default' }}
          >
            <div className="po-step-circle">
              {step > s.num ? '✓' : s.num}
            </div>
            <span className="po-step-label">{s.label}</span>
          </div>
          {i < 2 && <div className={`po-step-line ${step > s.num ? 'completed' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  // ─── STEP 1: PO Details Form ───
  if (step === 1) {
    return (
      <div>
        <StepIndicator />
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select
              className="form-select"
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Payment Terms
              <button
                type="button"
                className="btn-toggle-custom"
                onClick={() => setUseCustomPayment(!useCustomPayment)}
              >
                {useCustomPayment ? '← Standard' : '✏️ Custom'}
              </button>
            </label>
            {useCustomPayment ? (
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 50% advance, 50% on delivery"
                value={customPaymentTerms}
                onChange={e => setCustomPaymentTerms(e.target.value)}
                required
              />
            ) : (
              <select className="form-select" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
                <option>Net 90</option>
                <option>Immediate</option>
                <option>50% Advance, 50% on Delivery</option>
                <option>Letter of Credit (LC)</option>
                <option>Cash Against Delivery (CAD)</option>
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
            <label className="form-label">ETA</label>
            <input type="date" className="form-input" value={eta} onChange={e => setEta(e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Incoterms</label>
          <select className="form-select" value={incoterms} onChange={e => setIncoterms(e.target.value)}>
            <option>CIF</option>
            <option>FOB</option>
            <option>EXW</option>
            <option>DDP</option>
            <option>DAP</option>
            <option>FCA</option>
            <option>CPT</option>
            <option>CFR</option>
          </select>
        </div>

        {/* Project Reference & Request Number */}
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

        {/* Approval Authority */}
        <div className="form-group">
          <label className="form-label">Approval Authority</label>
          <input type="text" className="form-input" value={approvalAuthority} onChange={e => setApprovalAuthority(e.target.value)} placeholder="Name and title of authorizing person" />
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Line Items</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>
              <Plus size={14} /> Add Row
            </button>
          </div>
          {poItems.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
              <select
                className="form-select"
                value={row.itemId}
                onChange={e => updateRow(i, 'itemId', e.target.value)}
                required
              >
                <option value="">Select Item</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <input
                type="number"
                className="form-input"
                placeholder="Qty"
                value={row.quantity}
                onChange={e => updateRow(i, 'quantity', e.target.value)}
                required
                min="1"
              />
              <input
                type="number"
                className="form-input"
                placeholder="Unit Price"
                value={row.unitPrice}
                onChange={e => updateRow(i, 'unitPrice', e.target.value)}
                required
                min="0"
                step="0.01"
              />
              {poItems.length > 1 && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(i)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {validItems.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', marginTop: '8px',
              background: 'rgba(99,102,241,0.08)', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              color: 'var(--accent-primary)',
            }}>
              Subtotal: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGoToRemarks}
            disabled={!canProceedStep1}
          >
            Next: Add Remarks →
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Remarks Dialog ───
  if (step === 2) {
    return (
      <div>
        <StepIndicator />
        <div className="remarks-dialog">
          <div className="remarks-header">
            <MessageSquare size={20} />
            <div>
              <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '15px' }}>Purchase Order Remarks</h4>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Add any notes, special instructions, or terms for this order
              </p>
            </div>
          </div>

          <div className="remarks-suggestions">
            <span className="remarks-suggestion-label">Quick Add:</span>
            {[
              'Urgent delivery required',
              'Inspection before dispatch',
              'Include test certificates',
              'Partial shipment allowed',
              'Must pass QA-401 specs',
            ].map(suggestion => (
              <button
                key={suggestion}
                type="button"
                className="remarks-chip"
                onClick={() => setRemarks(prev => prev ? `${prev}\n• ${suggestion}` : `• ${suggestion}`)}
              >
                + {suggestion}
              </button>
            ))}
          </div>

          <textarea
            className="remarks-textarea"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Enter remarks, special instructions, delivery notes, quality requirements..."
            rows={6}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>{remarks.length} characters</span>
            <span>Optional — you can skip this step</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
            ← Back
          </button>
          <button type="button" className="btn btn-primary" onClick={handleGoToDraft}>
            Next: Preview Draft →
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Draft PO Preview ───
  return (
    <div>
      <StepIndicator />
      <div className="draft-po">
        {/* Draft Header */}
        <div className="draft-po-header">
          <div className="draft-po-badge">DRAFT</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#f1f5f9' }}>Purchase Order — {newId}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Issued {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
              ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="badge pending" style={{ fontSize: '10px' }}>
              <span className="badge-dot" /> Draft
            </span>
          </div>
        </div>

        {/* ── Buyer / Supplier Address Blocks ── */}
        <div className="draft-po-parties">
          <div className="draft-po-party">
            <h4 className="draft-po-party-title">
              <Building2 size={14} /> From (Buyer)
            </h4>
            <p className="draft-po-party-name">{companyInfo.name}</p>
            <p className="draft-po-party-line"><MapPin size={12} /> {companyInfo.address}</p>
            <p className="draft-po-party-line"><Mail size={12} /> {companyInfo.email}</p>
            <p className="draft-po-party-line"><Phone size={12} /> {companyInfo.phone}</p>
            <p className="draft-po-party-line"><Hash size={12} /> TRN: {companyInfo.taxRegNumber}</p>
          </div>
          <div className="draft-po-party">
            <h4 className="draft-po-party-title">
              <Building2 size={14} /> To (Supplier)
            </h4>
            <p className="draft-po-party-name">{selectedSupplier?.name}</p>
            <p className="draft-po-party-line"><MapPin size={12} /> {selectedSupplier?.address}</p>
            <p className="draft-po-party-line"><Mail size={12} /> {selectedSupplier?.email}</p>
            <p className="draft-po-party-line"><Phone size={12} /> {selectedSupplier?.phone}</p>
            <p className="draft-po-party-line"><Hash size={12} /> TRN: {selectedSupplier?.taxRegNumber}</p>
          </div>
        </div>

        {/* ── Reference Row ── */}
        {(projectReference || requestNumber) && (
          <div className="draft-po-ref-row">
            {projectReference && (
              <div className="draft-po-ref">
                <span className="draft-po-ref-label">Project Reference</span>
                <span className="draft-po-ref-value">{projectReference}</span>
              </div>
            )}
            {requestNumber && (
              <div className="draft-po-ref">
                <span className="draft-po-ref-label">Request Number</span>
                <span className="draft-po-ref-value">{requestNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Order Details Grid ── */}
        <div className="draft-po-grid">
          <div className="draft-po-field">
            <span className="draft-po-field-label">Payment Terms</span>
            <span className="draft-po-field-value">{resolvedPaymentTerms}</span>
          </div>
          <div className="draft-po-field">
            <span className="draft-po-field-label">Due Date</span>
            <span className="draft-po-field-value">{dueDate}</span>
          </div>
          <div className="draft-po-field">
            <span className="draft-po-field-label">ETA</span>
            <span className="draft-po-field-value">{eta}</span>
          </div>
          <div className="draft-po-field">
            <span className="draft-po-field-label">Incoterms</span>
            <span className="draft-po-field-value">
              <span className="badge approved" style={{ fontSize: '11px' }}>{incoterms}</span>
            </span>
          </div>
          <div className="draft-po-field">
            <span className="draft-po-field-label">Payment Status</span>
            <span className="draft-po-field-value">
              <span className="badge pending" style={{ fontSize: '11px' }}>
                <span className="badge-dot" /> Unpaid
              </span>
            </span>
          </div>
          <div className="draft-po-field">
            <span className="draft-po-field-label">Delivery Status</span>
            <span className="draft-po-field-value">
              <span className="badge pending" style={{ fontSize: '11px' }}>
                <span className="badge-dot" /> Draft
              </span>
            </span>
          </div>
        </div>

        {/* ── Line Items Table ── */}
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Line Items ({validItems.length})
          </h4>
          <table className="draft-po-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {validItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.itemName}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantity.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>${item.unitPrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: '#f1f5f9' }}>
                    ${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                  Grand Total
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '16px', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                  ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Remarks ── */}
        {remarks.trim() && (
          <div className="draft-po-remarks">
            <h4 style={{ margin: '0 0 6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={14} /> Remarks
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {remarks}
            </p>
          </div>
        )}

        {/* ── Approval Authority / Signature Block ── */}
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

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
          ← Back
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
          ✏️ Edit
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          <FileText size={16} /> Create Purchase Order
        </button>
      </div>
    </div>
  );
}

// ============================================
// New Item Modal
// ============================================
function NewItemModal() {
  const { suppliers, addItem, setModalOpen, items } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Piping');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('piece');
  const [currentPrice, setCurrentPrice] = useState('');
  const [linkedSuppliers, setLinkedSuppliers] = useState<string[]>([]);

  const toggleSupplier = (id: string) => {
    setLinkedSuppliers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentPrice) return;

    const newId = `ITM-${String(items.length + 1).padStart(3, '0')}`;
    addItem({
      id: newId,
      name,
      category,
      description,
      unit,
      currentPrice: parseFloat(currentPrice),
      linkedSupplierIds: linkedSuppliers,
      priceHistory: [{ date: new Date().toISOString().slice(0, 7), price: parseFloat(currentPrice), supplierId: linkedSuppliers[0] || '' }],
      purchaseHistory: [],
    });
    setModalOpen(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Item Name</label>
        <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Carbon Steel Pipe (8&quot;)" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option>Piping</option>
            <option>Valves</option>
            <option>Fittings</option>
            <option>Chemicals</option>
            <option>Electrical</option>
            <option>Instrumentation</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Unit</label>
          <select className="form-select" value={unit} onChange={e => setUnit(e.target.value)}>
            <option value="piece">Piece</option>
            <option value="meter">Meter</option>
            <option value="ton">Ton</option>
            <option value="kg">Kg</option>
            <option value="set">Set</option>
            <option value="lot">Lot</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <input type="text" className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Item specifications..." />
      </div>
      <div className="form-group">
        <label className="form-label">Current Price ($)</label>
        <input type="number" className="form-input" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} required min="0" step="0.01" placeholder="0.00" />
      </div>
      <div className="form-group">
        <label className="form-label">Linked Suppliers</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {suppliers.map(s => (
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
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
        <button type="submit" className="btn btn-primary">Add Item</button>
      </div>
    </form>
  );
}

// ============================================
// Upload Document Modal
// ============================================
function UploadDocModal() {
  const { purchaseOrders, items, addDocument, setModalOpen, documents } = useApp();
  const [poId, setPOId] = useState('');
  const [itemId, setItemId] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Invoice');
  const [fileName, setFileName] = useState('');

  const selectedPO = purchaseOrders.find(po => po.id === poId);
  const poItemIds = selectedPO ? selectedPO.items.map(i => i.itemId) : [];
  const availableItems = poItemIds.length > 0 ? items.filter(i => poItemIds.includes(i.id)) : items;

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
      <div className="upload-zone" style={{ marginBottom: '20px' }}>
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
          <select className="form-select" value={poId} onChange={e => setPOId(e.target.value)} required>
            <option value="">Select PO</option>
            {purchaseOrders.map(po => (
              <option key={po.id} value={po.id}>{po.id} - {po.supplierName}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Item</label>
          <select className="form-select" value={itemId} onChange={e => setItemId(e.target.value)} required>
            <option value="">Select Item</option>
            {availableItems.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Document Category</label>
        <select className="form-select" value={category} onChange={e => setCategory(e.target.value as DocumentCategory)}>
          {DOC_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          <Upload size={16} /> Upload Document
        </button>
      </div>
    </form>
  );
}

// ============================================
// Modal Container
// ============================================
export default function Modals() {
  const { modalOpen, setModalOpen } = useApp();

  if (!modalOpen) return null;

  const titles: Record<string, string> = {
    newPO: 'Create New Purchase Order',
    newItem: 'Add New Item',
    uploadDoc: 'Upload Document',
  };

  return (
    <div className="modal-overlay" onClick={() => setModalOpen(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{titles[modalOpen] || 'Modal'}</h3>
          <button className="modal-close" onClick={() => setModalOpen(null)}>
            <X size={18} />
          </button>
        </div>

        {modalOpen === 'newPO' && <NewPOModal />}
        {modalOpen === 'newItem' && <NewItemModal />}
        {modalOpen === 'uploadDoc' && <UploadDocModal />}
      </div>
    </div>
  );
}
