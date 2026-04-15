'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Building2, FileText, Send, Clock, CheckCircle2, 
  AlertTriangle, Download, Upload, ExternalLink,
  DollarSign, Package, ShieldCheck, MessageSquare,
  Search, Filter, ChevronRight, BarChart3
} from 'lucide-react';

export default function SupplierPortalPage() {
  const { 
    purchaseOrders, rfqs, quotations, addQuotation, 
    suppliers, setModalOpen 
  } = useApp();
  
  // For demo: pretend we are "Steel Masters" (S-001)
  const mySupplierId = 'S-001';
  const myData = suppliers.find(s => s.id === mySupplierId);
  
  const [activeTab, setActiveTab] = useState<'pos' | 'bids' | 'compliance'>('pos');
  const [searchTerm, setSearchTerm] = useState('');

  const myPOs = purchaseOrders.filter(po => po.supplierId === mySupplierId);
  const myBids = quotations.filter(q => q.supplierId === mySupplierId);
  const openRFQs = rfqs.filter(rfq => rfq.status === 'Sent' && !myBids.some(b => b.rfqId === rfq.id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Delivered': return '#10b981';
      case 'Pending':
      case 'Draft': return '#f59e0b';
      case 'Rejected':
      case 'Cancelled': return '#f43f5e';
      default: return '#94a3b8';
    }
  };

  if (!myData) return <div className="p-8 text-center">Supplier Data Not Found</div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="supplier-logo" style={{ width: 64, height: 64, background: 'rgba(99,102,241,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="page-title">{myData.name} Vendor Portal</h1>
            <p className="page-subtitle">Vendor ID: {myData.id} • Registered since 2024</p>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setModalOpen('newQuotation')}>
            <Upload size={18} /> Submit New Offer
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            <FileText size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active POs</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">{myPOs.filter(p => p.deliveryStatus !== 'Delivered').length}</span>
            </div>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Performance Score</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">{myData.kpis.deliveryPerformance}%</span>
            </div>
            <span className="stat-trend neutral">Premium Vendor</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">On-Time Delivery</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">{myData.kpis.deliveryPerformance}%</span>
            </div>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Wallet Balance</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">$12.4K</span>
            </div>
            <span className="stat-trend neutral">Pending Payments</span>
          </div>
        </div>
      </div>

      <div className="tabs-minimal" style={{ marginBottom: 24 }}>
        <button className={activeTab === 'pos' ? 'active' : ''} onClick={() => setActiveTab('pos')}>Purchase Orders</button>
        <button className={activeTab === 'bids' ? 'active' : ''} onClick={() => setActiveTab('bids')}>Opportunities & Bids</button>
        <button className={activeTab === 'compliance' ? 'active' : ''} onClick={() => setActiveTab('compliance')}>Compliance & Docs</button>
      </div>

      {activeTab === 'pos' && (
        <div className="table-container card glass">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO ID</th>
                <th>Issue Date</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myPOs.map(po => (
                <tr key={po.id}>
                  <td className="font-mono text-primary">{po.id}</td>
                  <td>{po.dateOfIssue}</td>
                  <td className="font-mono">${po.totalAmount.toLocaleString()}</td>
                  <td>{po.dueDate}</td>
                  <td>
                    <div className="status-badge" data-status={po.deliveryStatus}>
                      {po.deliveryStatus}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-xs"><Download size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bids' && (
        <div className="grid grid-2">
          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">Open Tenders / RFQs</h3>
            </div>
            <div className="tender-list">
              {openRFQs.length > 0 ? openRFQs.map(rfq => (
                <div key={rfq.id} className="tender-item">
                  <div className="tender-main">
                    <span className="tender-id">{rfq.id}</span>
                    <span className="tender-title">{rfq.title}</span>
                    <div className="tender-meta">
                      <span><Clock size={12} /> Ends: {rfq.deadlineDate}</span>
                      <span><Package size={12} /> {rfq.lineItems.length} Items</span>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModalOpen('newQuotation')}>Bid Now</button>
                </div>
              )) : (
                <div className="p-8 text-center text-muted">No open opportunities at this time.</div>
              )}
            </div>
          </div>

          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">My Recent Quotations</h3>
            </div>
            <div className="table-container compact">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quotation</th>
                    <th>RFQ</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myBids.map(bid => (
                    <tr key={bid.id}>
                      <td className="font-mono">{bid.id}</td>
                      <td className="text-muted">{bid.rfqId}</td>
                      <td className="font-mono">${bid.totalAmount.toLocaleString()}</td>
                      <td>
                        <div className="status-badge" data-status={bid.status === 'Awarded' ? 'Approved' : bid.status}>
                           {bid.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="card glass">
          <div className="card-header">
            <h3 className="card-title">Document Hub & Compliance</h3>
          </div>
          <div className="info-list" style={{ padding: 16 }}>
            <div className="info-item">
              <ShieldCheck size={20} className="text-primary" />
              <div className="info-content">
                <label>Trade License</label>
                <span>Expiry: 2026-12-15</span>
              </div>
              <div className="badge approved">Verified</div>
              <button className="btn btn-ghost btn-sm"><ExternalLink size={14} /></button>
            </div>
            <div className="info-item">
              <ShieldCheck size={20} className="text-primary" />
              <div className="info-content">
                <label>Tax Registration (VAT)</label>
                <span>TRN: 100234850020003</span>
              </div>
              <div className="badge approved">Verified</div>
              <button className="btn btn-ghost btn-sm"><ExternalLink size={14} /></button>
            </div>
            <div className="info-item">
              <AlertTriangle size={20} className="text-warning" />
              <div className="info-content">
                <label>ISO 9001 Certificate</label>
                <span className="text-warning">Missing or Expired</span>
              </div>
              <button className="btn btn-primary btn-sm">Upload New</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tender-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .tender-item:last-child {
          border-bottom: none;
        }
        .tender-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tender-id {
          font-size: 11px;
          color: #6366f1;
          font-weight: 700;
          font-family: monospace;
        }
        .tender-title {
          font-weight: 600;
          color: #f1f5f9;
          font-size: 14px;
        }
        .tender-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .tender-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}
