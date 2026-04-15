'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Plus, Search, Calendar, FileText, Bell, ExternalLink } from 'lucide-react';
import { Contract } from '@/types';

export default function ContractsPage() {
  const { contracts, setActivePage, setSelectedSupplierId, setSelectedPOId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = contracts.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Contract Management</h2>
          <p>Monitor supplier agreements, lifecycle dates, and compliance</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Register Contract
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        {filtered.map(contract => {
          const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const isUrrent = daysLeft <= contract.renewalWindowDays;
          
          return (
            <div key={contract.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              {isUrrent && (
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
                {contract.linkedPoIds.map(poId => (
                  <button key={poId} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#f1f5f9', fontSize: 10, cursor: 'pointer' }} onClick={() => { setSelectedPOId(poId); setActivePage('purchase-orders'); }}>
                    {poId}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
