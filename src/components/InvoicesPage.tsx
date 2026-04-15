'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, Plus, Search, CheckCircle, AlertTriangle, Clock, ExternalLink, X, Check } from 'lucide-react';
import { Invoice } from '@/types';

function NewInvoiceModal({ onClose }: { onClose: () => void }) {
  const { addInvoice, purchaseOrders } = useApp();
  const [poId, setPoId] = useState('');
  const [invNum, setInvNum] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !invNum || !amount) return;
    
    const po = purchaseOrders.find(p => p.id === poId);
    
    addInvoice({
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: invNum,
      poId,
      supplierId: po?.supplierId || '',
      supplierName: po?.supplierName || '',
      date,
      dueDate: new Date(new Date(date).getTime() + 30 * 24 * 3600000).toISOString().split('T')[0],
      totalAmount: parseFloat(amount),
      currency: 'USD',
      status: 'Pending',
      lineItems: [], // Simplified for this demo
      matchStatus: 'Pending'
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Record New Invoice</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">PO Reference *</label>
            <select className="form-select" value={poId} onChange={e => setPoId(e.target.value)} required>
              <option value="">Select a Purchase Order</option>
              {purchaseOrders.filter(p => p.deliveryStatus !== 'Draft' && p.deliveryStatus !== 'Cancelled').map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.supplierName} (${p.totalAmount})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Number *</label>
            <input type="text" className="form-input" value={invNum} onChange={e => setInvNum(e.target.value)} placeholder="e.g. INV-2026-001" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Invoice Date *</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Total Amount ($) *</label>
              <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Check size={16} /> Record Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { invoices, purchaseOrders, performMatch, setActivePage, setSelectedPOId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.poId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {showModal && <NewInvoiceModal onClose={() => setShowModal(false)} />}
      
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
                const matchStatus = inv.matchStatus || performMatch(inv.poId);
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
                      <button className="btn btn-ghost btn-sm" title="View Details">
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
