import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Plus, Search, Calendar, FileText, Bell, ExternalLink, X, Check, DollarSign } from 'lucide-react';
import { Contract } from '@/types';

function ContractFormModal({ onClose }: { onClose: () => void }) {
  const { addContract, suppliers } = useApp();
  const [title, setTitle] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !supplierId || !startDate || !endDate || !totalValue) return;
    
    const supplier = suppliers.find(s => s.id === supplierId);
    
    addContract({
      id: `CON-${Date.now().toString().slice(-4)}`,
      title,
      supplierId,
      supplierName: supplier?.name || 'Unknown Supplier',
      startDate,
      endDate,
      totalValue: parseFloat(totalValue),
      currency,
      status: 'Active',
      renewalWindowDays: 60,
      linkedPoIds: []
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Register New Contract</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Contract Title *</label>
            <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual Steel Supply 2026" required />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
              <option value="">Select a supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Contract Value *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                <input type="number" className="form-input" style={{ paddingLeft: 28 }} value={totalValue} onChange={e => setTotalValue(e.target.value)} placeholder="0.00" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Check size={16} /> Register Contract</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const { contracts, setActivePage, setSelectedSupplierId, setSelectedPOId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = contracts.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {showModal && <ContractFormModal onClose={() => setShowModal(false)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Contract Management</h2>
          <p>Monitor supplier agreements, lifecycle dates, and compliance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Register Contract
        </button>
      </div>

      <div className="filters-bar" style={{ marginBottom: 24 }}>
        <div className="search-wrapper" style={{ flex: 1 }}>
          <Search size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search contracts by title, supplier, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
        {filtered.map(contract => {
          const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const isUrnent = daysLeft <= contract.renewalWindowDays;
          
          return (
            <div key={contract.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              {isUrnent && (
                <div style={{ position: 'absolute', top: 12, right: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: 8 }}>
                  <Bell size={14} /> <span style={{ fontSize: 11, fontWeight: 700 }}>Renew Soon</span>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 15 }}>{contract.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contract.id} · {contract.status}</div>
                </div>
              </div>

              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supplier</span>
                  <span style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 500, cursor: 'pointer' }} onClick={() => { setSelectedSupplierId(contract.supplierId); setActivePage('suppliers'); }}>
                    {contract.supplierName} <ExternalLink size={10} style={{ display: 'inline', marginLeft: 2 }} />
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Value</span>
                  <span style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>${contract.totalValue.toLocaleString()} {contract.currency}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Start Date</div>
                  <div style={{ fontSize: 13, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} /> {contract.startDate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>End Date</div>
                  <div style={{ fontSize: 13, color: daysLeft < 30 ? '#f43f5e' : '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} /> {contract.endDate}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Linked Orders ({contract.linkedPoIds.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {contract.linkedPoIds.length > 0 ? contract.linkedPoIds.map(poId => (
                  <button key={poId} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#f1f5f9', fontSize: 10, cursor: 'pointer' }} onClick={() => { setSelectedPOId(poId); setActivePage('purchase-orders'); }}>
                    {poId}
                  </button>
                )) : <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)' }}>No linked orders</span>}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <ShieldCheck size={40} />
          <h3>No contracts found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
}
