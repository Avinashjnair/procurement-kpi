'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BlanketPO, BlanketStatus } from '@/types';
import { 
  Plus, Search, Filter, ArrowRight, Calendar, 
  DollarSign, FileText, CheckCircle, Clock, AlertTriangle,
  ChevronRight, BarChart3, TrendingUp, Building2
} from 'lucide-react';

export default function BlanketsPage() {
  const { 
    blanketPOs, selectedBlanketId, setSelectedBlanketId, 
    setModalOpen, purchaseOrders 
  } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlanketStatus | 'All'>('All');

  const filteredBlankets = blanketPOs.filter(b => {
    const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedBlanket = blanketPOs.find(b => b.id === selectedBlanketId);
  const releases = purchaseOrders.filter(po => po.blanketPoId === selectedBlanketId);

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return '#f43f5e'; // Red
    if (percentage >= 75) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  if (selectedBlanketId && selectedBlanket) {
    const utilization = (selectedBlanket.consumedAmount / selectedBlanket.totalCeiling) * 100;
    const remaining = selectedBlanket.totalCeiling - selectedBlanket.consumedAmount;

    return (
      <div className="page-content animate-in">
        <div className="page-header">
          <div className="breadcrumb">
            <span onClick={() => setSelectedBlanketId(null)} className="breadcrumb-link">Blanket POs</span>
            <ChevronRight size={14} />
            <span>{selectedBlanket.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 8 }}>
            <h1 className="page-title">{selectedBlanket.id} - {selectedBlanket.supplierName}</h1>
            <div className="status-badge" data-status={selectedBlanket.status}>
              {selectedBlanket.status}
            </div>
          </div>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Utilization</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-value">{utilization.toFixed(1)}%</span>
                <span className="stat-trend neutral">Consumed</span>
              </div>
              <div className="progress-bar-container" style={{ marginTop: 12, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${Math.min(utilization, 100)}%`, 
                    height: '100%', 
                    background: getUtilizationColor(utilization),
                    borderRadius: 4,
                    transition: 'width 1s ease-out'
                  }} 
                />
              </div>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Ceiling</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-value">{selectedBlanket.totalCeiling.toLocaleString()} {selectedBlanket.currency}</span>
              </div>
              <span className="stat-trend neutral">Framework Limit</span>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Remaining Balance</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-value">{remaining.toLocaleString()} {selectedBlanket.currency}</span>
              </div>
              <span className="stat-trend neutral">Available for Release</span>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">Agreement Details</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <Calendar size={16} />
                <div className="info-content">
                  <label>Validity Period</label>
                  <span>{selectedBlanket.validFrom} to {selectedBlanket.validTo}</span>
                </div>
              </div>
              <div className="info-item">
                <Building2 size={16} />
                <div className="info-content">
                  <label>Department / Project</label>
                  <span>{selectedBlanket.department || 'All Departments'} {selectedBlanket.project ? `(${selectedBlanket.project})` : ''}</span>
                </div>
              </div>
              <div className="info-item">
                <FileText size={16} />
                <div className="info-content">
                  <label>Category Scope</label>
                  <span>{selectedBlanket.category || 'General Procurement'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">Release Orders History</h3>
            </div>
            <div className="table-container compact">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.length > 0 ? releases.map(po => (
                    <tr key={po.id}>
                      <td className="font-mono text-primary">{po.id}</td>
                      <td>{po.dateOfIssue}</td>
                      <td>{po.totalAmount.toLocaleString()} {po.currency}</td>
                      <td>
                        <div className="status-badge" data-status={po.deliveryStatus} style={{ fontSize: 10, padding: '2px 6px' }}>
                          {po.deliveryStatus}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        No release orders found for this blanket.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Blanket Purchase Orders</h1>
          <p className="page-subtitle">Manage framework agreements and release order ceilings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen('newBlanket')}>
          <Plus size={18} /> New Blanket Agreement
        </button>
      </div>

      <div className="filters-bar glass">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="table-container card glass">
        <table className="data-table">
          <thead>
            <tr>
              <th>Blanket ID</th>
              <th>Supplier</th>
              <th>Validity</th>
              <th>Ceiling</th>
              <th>Utilization</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredBlankets.map(b => {
              const utilPercent = (b.consumedAmount / b.totalCeiling) * 100;
              return (
                <tr key={b.id} onClick={() => setSelectedBlanketId(b.id)} className="clickable">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} className="text-muted" />
                      <span className="font-mono">{b.id}</span>
                    </div>
                  </td>
                  <td className="font-semibold">{b.supplierName}</td>
                  <td className="text-sm">
                    {b.validFrom} to {b.validTo}
                  </td>
                  <td className="font-mono">
                    {b.totalCeiling.toLocaleString()} {b.currency}
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-container" style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${Math.min(utilPercent, 100)}%`, 
                            height: '100%', 
                            background: getUtilizationColor(utilPercent),
                            borderRadius: 3
                          }} 
                        />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: getUtilizationColor(utilPercent) }}>
                        {utilPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {b.consumedAmount.toLocaleString()} consumed
                    </div>
                  </td>
                  <td>
                    <div className="status-badge" data-status={b.status}>
                      {b.status}
                    </div>
                  </td>
                  <td>
                    <ArrowRight size={16} className="text-muted" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
