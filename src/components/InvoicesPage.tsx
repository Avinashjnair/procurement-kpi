'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, Plus, Search, CheckCircle, AlertTriangle, Clock, ExternalLink, X, Check, Paperclip } from 'lucide-react';
import type { Invoice, InvoiceLineItem, DocumentCategory, AppDocument } from '@/types';
import { formatFileSize } from '@/utils/formatFileSize';
import DocumentAttachmentsEditor, { AttachmentDraft, newAttachmentId } from './DocumentAttachmentsEditor';

// Commercial & shipping document categories relevant to an invoice
const INVOICE_DOC_CATEGORIES: DocumentCategory[] = ['Invoice', 'BL/AWB', 'Packing List', 'COO', 'MTC', 'Delivery Note'];
const WHOLE_SHIPMENT_ITEM_ID = 'ALL';

function computeDueDate(fromDate: string, paymentTerms?: string): string {
  const match = paymentTerms?.match(/(\d+)/);
  const days = match ? parseInt(match[1], 10) : 30;
  const base = fromDate ? new Date(fromDate) : new Date();
  return new Date(base.getTime() + days * 24 * 3600000).toISOString().split('T')[0];
}

function NewInvoiceModal({ onClose }: { onClose: () => void }) {
  const { addInvoice, addDocument, purchaseOrders, grns } = useApp();
  const [poId, setPoId] = useState('');
  const [grnId, setGrnId] = useState('');
  const [invNum, setInvNum] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [otherCharges, setOtherCharges] = useState('0');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);

  const selectedPO = purchaseOrders.find(p => p.id === poId);
  const relatedGRNs = grns.filter(g => g.poId === poId && g.status === 'Approved');

  const buildLinesFromPO = (po: typeof selectedPO): InvoiceLineItem[] =>
    (po?.items || []).map((item, i) => ({
      poLineIndex: i,
      itemId: item.itemId,
      itemName: item.itemName,
      billedQty: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

  const buildLinesFromGRN = (grnRefId: string): InvoiceLineItem[] => {
    const grn = grns.find(g => g.id === grnRefId);
    if (!grn) return [];
    return grn.lineItems
      .filter(l => l.acceptedQty > 0)
      .map(l => ({
        poLineIndex: l.poLineIndex,
        itemId: l.itemId,
        itemName: l.itemName,
        billedQty: l.acceptedQty,
        unitPrice: l.unitPrice,
        totalPrice: l.acceptedQty * l.unitPrice,
      }));
  };

  const handlePoChange = (id: string) => {
    setPoId(id);
    setGrnId('');
    const po = purchaseOrders.find(p => p.id === id);
    setLineItems(buildLinesFromPO(po));
    setDueDate(po ? computeDueDate(date, po.paymentTerms) : '');
  };

  const handleGrnChange = (id: string) => {
    setGrnId(id);
    setLineItems(id ? buildLinesFromGRN(id) : buildLinesFromPO(selectedPO));
  };

  const updateLine = (i: number, field: 'billedQty' | 'unitPrice', value: number) =>
    setLineItems(prev => prev.map((li, idx) => {
      if (idx !== i) return li;
      const updated = { ...li, [field]: value };
      updated.totalPrice = updated.billedQty * updated.unitPrice;
      return updated;
    }));

  const lineItemsTotal = lineItems.reduce((s, l) => s + l.totalPrice, 0);
  const totalAmount = lineItemsTotal + (parseFloat(otherCharges) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !selectedPO || !invNum || lineItems.length === 0) return;

    const validLines = lineItems.filter(l => l.billedQty > 0);

    addInvoice({
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: invNum,
      poId,
      grnId: grnId || undefined,
      supplierId: selectedPO.supplierId,
      supplierName: selectedPO.supplierName,
      date,
      dueDate: dueDate || computeDueDate(date, selectedPO.paymentTerms),
      totalAmount,
      currency: 'USD',
      status: 'Pending',
      lineItems: validLines,
      matchStatus: 'Pending',
    });

    const today = new Date().toISOString().split('T')[0];
    attachments.filter(a => a.file).forEach(a => {
      const file = a.file as File;
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      addDocument({
        id: `DOC-${newAttachmentId()}`,
        name: file.name,
        category: a.category,
        poId,
        itemId: WHOLE_SHIPMENT_ITEM_ID,
        uploadDate: today,
        fileSize: formatFileSize(file.size),
        fileType: ext,
      } as AppDocument);
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Record New Invoice</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">PO Reference *</label>
              <select className="form-select" value={poId} onChange={e => handlePoChange(e.target.value)} required>
                <option value="">Select a Purchase Order</option>
                {purchaseOrders.filter(p => p.deliveryStatus !== 'Draft' && p.deliveryStatus !== 'Cancelled').map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.supplierName} (${p.totalAmount.toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Match Against GRN</label>
              <select className="form-select" value={grnId} onChange={e => handleGrnChange(e.target.value)} disabled={!poId}>
                <option value="">{relatedGRNs.length ? 'No GRN — use PO quantities' : 'No approved GRN for this PO yet'}</option>
                {relatedGRNs.map(g => (
                  <option key={g.id} value={g.id}>{g.id} — {g.totalAccepted} accepted ({g.dateApproved || g.dateCreated})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Number *</label>
            <input type="text" className="form-input" value={invNum} onChange={e => setInvNum(e.target.value)} placeholder="e.g. INV-2026-001" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Invoice Date *</label>
              <input type="date" className="form-input" value={date} onChange={e => {
                setDate(e.target.value);
                if (selectedPO) setDueDate(computeDueDate(e.target.value, selectedPO.paymentTerms));
              }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          {lineItems.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '6px 0 10px' }}>
                Line Items {grnId ? '— populated from GRN accepted quantities' : '— populated from PO ordered quantities'} (editable)
              </div>
              <div className="data-table-wrapper" style={{ marginBottom: 14 }}>
                <table className="data-table">
                  <thead><tr><th>Item</th><th>Billed Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {lineItems.map((li, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{li.itemName}</td>
                        <td><input type="number" className="form-input" style={{ width: 90 }} value={li.billedQty} min="0" onChange={e => updateLine(i, 'billedQty', parseFloat(e.target.value) || 0)} /></td>
                        <td><input type="number" className="form-input" style={{ width: 100 }} value={li.unitPrice} min="0" step="0.01" onChange={e => updateLine(i, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
                        <td className="font-mono" style={{ fontWeight: 600 }}>${li.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Other Charges (tax, freight, etc.)</label>
              <input type="number" className="form-input" value={otherCharges} onChange={e => setOtherCharges(e.target.value)} min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Total Amount</label>
              <div style={{ padding: '10px 13px', borderRadius: 9, background: 'rgba(99,102,241,0.08)', fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <DocumentAttachmentsEditor
            attachments={attachments}
            categories={INVOICE_DOC_CATEGORIES}
            onChange={setAttachments}
            label="Commercial & Shipping Documents"
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!poId || !invNum || lineItems.length === 0}><Check size={16} /> Record Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceDetailModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { grns, documents, setActivePage, setSelectedPOId } = useApp();
  const grn = invoice.grnId ? grns.find(g => g.id === invoice.grnId) : undefined;
  const linkedDocs = documents.filter(d => d.poId === invoice.poId);
  const matchColor = invoice.matchStatus === 'Full Match' ? '#10b981' : invoice.matchStatus === 'Variance' ? '#f43f5e' : invoice.matchStatus === 'Pending' ? '#f59e0b' : '#94a3b8';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Invoice {invoice.invoiceNumber}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 18 }}>
          {[
            ['Supplier', invoice.supplierName],
            ['Invoice Date', invoice.date],
            ['Due Date', invoice.dueDate],
            ['Status', invoice.status],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>PO Reference</div>
            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 12 }} onClick={() => { setSelectedPOId(invoice.poId); setActivePage('purchase-orders'); onClose(); }}>
              {invoice.poId} <ExternalLink size={10} style={{ marginLeft: 4 }} />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>GRN Reference</div>
            <div style={{ fontSize: 14, color: grn ? '#f1f5f9' : 'var(--text-muted)', fontWeight: 500 }}>{invoice.grnId || 'Not matched to a GRN'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>3-Way Match</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: matchColor, fontSize: 13, fontWeight: 700 }}>
              {invoice.matchStatus === 'Full Match' ? <CheckCircle size={14} /> : invoice.matchStatus === 'Variance' ? <AlertTriangle size={14} /> : <Clock size={14} />}
              {invoice.matchStatus}
            </div>
          </div>
        </div>

        <div className="data-table-wrapper" style={{ marginBottom: 18 }}>
          <table className="data-table">
            <thead><tr><th>Item</th><th>Billed Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              {invoice.lineItems.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No line items recorded.</td></tr>
              ) : invoice.lineItems.map((li, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{li.itemName}</td>
                  <td>{li.billedQty}</td>
                  <td className="font-mono">${li.unitPrice.toFixed(2)}</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>${li.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>Grand Total:</td>
                <td className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-indigo)', fontSize: 15 }}>${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Attached Documents</div>
          {linkedDocs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documents attached for this PO yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {linkedDocs.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <Paperclip size={14} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.category} · {doc.fileSize} · {doc.uploadDate}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {invoice.notes && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{invoice.notes}</p>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { invoices, performMatch, setActivePage, setSelectedPOId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter(i =>
    i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.poId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {showModal && <NewInvoiceModal onClose={() => setShowModal(false)} />}
      {detailInvoice && <InvoiceDetailModal invoice={detailInvoice} onClose={() => setDetailInvoice(null)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Invoice Management</h2>
          <p>Record supplier invoices and perform 3-way matching</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Record Invoice
        </button>
      </div>

      <div className="filters-bar" style={{ marginBottom: 24 }}>
        <div className="search-wrapper" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by invoice#, PO#, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>PO Ref</th>
                <th>GRN Ref</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Amount</th>
                <th>3-Way Match</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const matchStatus = inv.matchStatus || performMatch(inv.poId, inv.id);
                const matchColor = matchStatus === 'Full Match' ? '#10b981' : matchStatus === 'Variance' ? '#f43f5e' : matchStatus === 'Pending' ? '#f59e0b' : '#94a3b8';

                return (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.id}</div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 12 }} onClick={() => { setSelectedPOId(inv.poId); setActivePage('purchase-orders'); }}>
                        {inv.poId} <ExternalLink size={10} style={{ marginLeft: 4 }} />
                      </button>
                    </td>
                    <td style={{ fontSize: 12, color: inv.grnId ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{inv.grnId || '—'}</td>
                    <td>{inv.supplierName}</td>
                    <td style={{ fontSize: 13 }}>{inv.date}</td>
                    <td style={{ fontWeight: 600 }}>${inv.totalAmount.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: matchColor, fontSize: 13, fontWeight: 600 }}>
                        {matchStatus === 'Full Match' ? <CheckCircle size={14} /> : matchStatus === 'Variance' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                        {matchStatus}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" title="View Details" onClick={() => setDetailInvoice(inv)}>
                        <FileText size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <FileText size={40} />
          <h3>No invoices found</h3>
          <p>Try recording a new invoice or adjusting your search</p>
        </div>
      )}
    </div>
  );
}
