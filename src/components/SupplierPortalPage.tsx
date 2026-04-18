'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Building2, FileText, Send, Clock, CheckCircle2, 
  AlertTriangle, Download, Upload, ExternalLink,
  DollarSign, Package, ShieldCheck, MessageSquare,
  Search, Filter, ChevronRight, BarChart3, Calendar, Plus, TrendingUp, TrendingDown, Scale, UserPlus, Settings, Info, CreditCard, FileBarChart, Activity, User, Globe, Landmark, Lock, X, XCircle, Award
} from 'lucide-react';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell
} from 'recharts';

import { PortalTab } from '@/types';

export default function SupplierPortalPage({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const { 
    acknowledgePO, setSelectedPOId,
    invoices, grns, complianceDocs, disputes,
    setSelectedGRNId, setModalOpen, suppliers, purchaseOrders, quotations, rfqs,
    setSelectedRFQId, setSelectedQuotationId, documents, poMessages,
    sendPOMessage, updateSupplierProfile, requestEarlyPayment, addSupplierContact,
    currentSupplier, supplierLogout, selectedSupplierId, products
  } = useApp();
  
  // Use currently logged in supplier if in standalone mode, otherwise use selected/default
  const mySupplierId = standalone ? (currentSupplier?.id || '') : (selectedSupplierId || 'SUP-001');
  const myData = suppliers.find(s => s.id === mySupplierId);
  
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMessageThread, setActiveMessageThread] = useState('RFQ-001');

  const myPOs = purchaseOrders.filter(po => po.supplierId === mySupplierId);
  const myBids = quotations.filter(q => q.supplierId === mySupplierId);
  
  // Tendering Engine: Discovery Logic
  const eligibleRFQs = rfqs.filter(rfq => {
    const isAlreadyBid = myBids.some(b => b.rfqId === rfq.id);
    if (isAlreadyBid) return false;
    
    const isOpenAndPublished = rfq.tenderType === 'open' && rfq.status === 'Published';
    const isInvitedAndSent = rfq.tenderType === 'selective' && rfq.status === 'Sent' && rfq.invitedSupplierIds.includes(mySupplierId);
    
    return isOpenAndPublished || isInvitedAndSent;
  });

  const myInvoices = invoices.filter(inv => inv.supplierId === mySupplierId);

  // Negotiation Threads Integration
  const negotiationThreads = quotations
    .filter(q => q.supplierId === mySupplierId)
    .map(q => ({
      id: q.id,
      rfqId: q.rfqId,
      type: 'Negotiation',
      title: `Proposal ${q.id} Feedback`,
      time: 'Active',
      active: activeMessageThread === q.id
    }));

  // DYNAMIC METRICS CALCULATION
  const totalOutstanding = myInvoices
    .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const releasedPayments = myPOs
    .filter(po => po.paymentStatus === 'Paid')
    .reduce((sum, po) => sum + po.amountPaid, 0);

  // Calculate Average Payment Cycle (Mock computation based on invoice dates)
  const paidInvoices = myInvoices.filter(inv => inv.status === 'Paid');
  const avgPayCycle = paidInvoices.length > 0
    ? Math.round(paidInvoices.reduce((acc, inv) => acc + 30, 0) / paidInvoices.length) // Simplification for demo
    : 28.4;

  // Auto-scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  if (!myData) return <div className="p-8 text-center">Supplier Data Not Found</div>;

  return (
    <div className="page-content animate-in"><div className="content-wrapper">
      {/* Premium Gradient Header */}
      <div className="page-header" style={{ 
        marginBottom: 32, 
        padding: '32px 32px 24px', 
        background: 'linear-gradient(135deg, rgba(140,145,149,0.06) 0%, transparent 100%)',
        borderRadius: 24,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="supplier-logo" style={{ 
            width: 72, height: 72, 
            background: 'var(--bg-tertiary)', 
            border: '2px solid var(--border-active)', 
            borderRadius: 20, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'var(--accent-slate)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <Building2 size={36} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title" style={{ fontSize: 26, margin: 0 }}>{myData.name} Vendor Portal</h1>
              <span className="badge approved" style={{ height: 20, fontSize: 9 }}>VERIFIED PARTNER</span>
            </div>
            <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Supplier ID: <span className="font-mono text-primary">{myData.id}</span> • Member since Apr 2024 • Status: <span className="text-success">Preferred</span>
            </p>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary shadow-neon" onClick={() => setModalOpen('newQuotation')}>
            <Upload size={18} /> Submit New Offer
          </button>
        </div>
      </div>

      {/* Top Metrics Grid - Only visible on Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="metrics-grid animate-in" style={{ marginBottom: 32 }}>
          <div className="metric-card indigo">
            <div className="metric-icon indigo"><FileText size={22} /></div>
            <div className="metric-value">{myPOs.filter(p => !['Delivered', 'Cancelled'].includes(p.deliveryStatus)).length}</div>
            <div className="metric-label">Active Purchase Orders</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} /> 2 awaiting acknowledgement
            </div>
          </div>

          <div className="metric-card emerald">
            <div className="metric-icon emerald"><CheckCircle2 size={22} /></div>
            <div className="metric-value text-success">{myData.kpis.deliveryPerformance}%</div>
            <div className="metric-label">On-Time Performance</div>
            <div className="stat-trend positive" style={{ marginTop: 6 }}>Top 5% of Vendors</div>
          </div>

          <div className="metric-card amber">
            <div className="metric-icon amber"><ShieldCheck size={22} /></div>
            <div className="metric-value">{100 - myData.kpis.rejectionRate}%</div>
            <div className="metric-label">Quality Success Rate</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Target: 98.0%</div>
          </div>

          <div className="metric-card cyan">
            <div className="metric-icon cyan"><DollarSign size={22} /></div>
            <div className="metric-value">${(totalOutstanding / 1000).toFixed(1)}K</div>
            <div className="metric-label">Total Outstanding Balance</div>
            <div style={{ fontSize: 10, color: 'var(--accent-cyan)', marginTop: 6, cursor: 'pointer' }} onClick={() => setActiveTab('financials')}>
              View SOA <ChevronRight size={10} style={{ verticalAlign: 'middle' }} />
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Transparent Tab Bar */}
      <div className="tabs-wrapper" style={{ 
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(11,14,20,0.85)',
        backdropFilter: 'blur(12px)',
        margin: '0 -28px 24px',
        padding: '0 28px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="tabs-minimal" style={{ 
          overflowX: 'auto', 
          whiteSpace: 'nowrap', 
          display: 'flex', 
          gap: 0,
          scrollbarWidth: 'none'
        }}>
          {[
            { id: 'dashboard', label: 'Overview', icon: <Activity size={14} /> },
            { id: 'pos', label: 'Purchase Orders', icon: <Package size={14} /> },
            { id: 'bids', label: 'Quotations & Bidding', icon: <FileBarChart size={14} /> },
            { id: 'performance', label: 'Performance Scorecard', icon: <BarChart3 size={14} /> },
            { id: 'financials', label: 'Financial Visibility', icon: <DollarSign size={14} /> },
            { id: 'quality', label: 'Delivery & Quality', icon: <Activity size={14} /> },
            { id: 'communication', label: 'Communication Hub', icon: <MessageSquare size={14} /> },
            { id: 'compliance', label: 'Compliance Vault', icon: <ShieldCheck size={14} /> },
            { id: 'product-library', label: 'Product Library', icon: <Package size={14} /> },
            { id: 'account', label: 'Account & Profile', icon: <User size={14} /> },
          ].map(tab => (
            <button 
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''} 
              onClick={() => setActiveTab(tab.id as PortalTab)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content with Animation Wrapper */}
      <div className="tab-viewport animate-in" style={{ animationDuration: '0.3s' }}>
        
        {/* DASHBOARD / OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-2" style={{ gap: 24 }}>
               <div className="card glass luxury-border p-24">
                  <div className="flex items-center gap-16 mb-20">
                     <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity className="text-bg-deep" size={24} />
                     </div>
                     <div>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Welcome back, {myData.name}</h3>
                        <p className="text-xs text-muted">You have 3 items requiring immediate action.</p>
                     </div>
                  </div>
                  <div className="stack-md">
                     {[
                        { title: 'Pending Acknowledgement', desc: 'PO-008 and PO-009 require confirmation.', type: 'warning' },
                        { title: 'Expiring Documents', desc: 'ISO 9001 Certificate expires in 12 days.', type: 'info' },
                        { title: 'Unread Messages', desc: 'New feedback on Proposal Q-2026-003.', type: 'message' }
                     ].map((alert, i) => (
                        <div key={i} className="flex items-center gap-12 p-12 hover-glow" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                           <div style={{ width: 8, height: 8, borderRadius: '50%', background: alert.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-indigo)' }} />
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{alert.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.desc}</div>
                           </div>
                           <ChevronRight size={14} className="text-muted" />
                        </div>
                     ))}
                  </div>
               </div>

               <div className="card glass luxury-border p-24">
                  <div className="card-header border-none p-0 mb-20">
                     <h3 className="card-title">Delivery Performance Summary</h3>
                     <button className="btn btn-ghost btn-xs" onClick={() => setActiveTab('performance')}>Full Scorecard</button>
                  </div>
                  <div style={{ height: 180 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={myData.kpiHistory?.slice(-6)}>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                           <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} />
                           <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-glow)', borderRadius: 12 }} />
                           <Bar dataKey="delivery" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} barSize={24}>
                              {myData.kpiHistory?.slice(-6).map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.delivery > 95 ? 'var(--accent-emerald)' : 'var(--accent-indigo)'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="grid grid-3" style={{ gap: 24 }}>
               <div className="card glass p-20">
                  <div className="text-xs text-muted mb-4">LATEST PO</div>
                  <div className="font-mono font-bold text-lg mb-8">{myPOs[0]?.id || 'N/A'}</div>
                  <div className="flex justify-between items-center">
                     <span className="badge" data-status={myPOs[0]?.deliveryStatus}>{myPOs[0]?.deliveryStatus || 'None'}</span>
                     <span className="text-xs text-muted">{myPOs[0]?.dateOfIssue}</span>
                  </div>
               </div>
               <div className="card glass p-20">
                  <div className="text-xs text-muted mb-4">ACTIVE BIDS</div>
                  <div className="font-bold text-lg mb-8">{myBids.filter(b => b.status === 'Pending' || b.status === 'Evaluated').length} Proposals</div>
                  <div className="progress-bar-container" style={{ height: 4 }}>
                     <div className="progress-bar-fill" style={{ width: '65%', background: 'var(--accent-indigo)' }} />
                  </div>
               </div>
               <div className="card glass p-20">
                  <div className="text-xs text-muted mb-4">DOCUMENTS VALID</div>
                  <div className="font-bold text-lg mb-8">{complianceDocs.filter(d => d.status === 'Active').length} / {complianceDocs.length}</div>
                  <div className="text-xs text-success flex items-center gap-4">
                     <CheckCircle2 size={12} /> Full Compliance
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PURCHASE ORDERS TAB */}
        {activeTab === 'pos' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-4" style={{ gap: 16 }}>
              {[
                { label: 'New Orders', value: myPOs.filter(p => !p.acknowledgedAt).length, icon: <Clock size={16} />, color: 'var(--accent-amber)' },
                { label: 'In Production', value: myPOs.filter(p => p.deliveryStatus === 'Approved').length, icon: <Activity size={16} />, color: 'var(--accent-indigo)' },
                { label: 'In Transit', value: myPOs.filter(p => p.deliveryStatus === 'Shipped').length, icon: <Globe size={16} />, color: 'var(--accent-cyan)' },
                { label: 'Delivered (30d)', value: myPOs.filter(p => p.deliveryStatus === 'Delivered').length, icon: <CheckCircle2 size={16} />, color: 'var(--accent-emerald)' },
              ].map((m, i) => (
                <div key={i} className="card glass luxury-border p-16 flex items-center gap-12" style={{ borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card glass">
              <div className="card-header">
                <div className="flex items-center gap-10">
                   <Package className="text-indigo" size={18} />
                   <h3 className="card-title">Purchase Order Registry</h3>
                </div>
                <div className="search-box-minimal">
                  <Search size={14} />
                  <input type="text" placeholder="Search PO numbers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PO ID</th>
                      <th>Issue Date</th>
                      <th>Value</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Shipment</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPOs.map(po => (
                      <tr key={po.id}>
                        <td className="font-mono text-primary font-bold">{po.id}</td>
                        <td>{po.dateOfIssue}</td>
                        <td className="font-mono">${po.totalAmount.toLocaleString()}</td>
                        <td>{po.dueDate}</td>
                        <td>
                          <div className="badge shadow-sm" data-status={po.deliveryStatus}>
                            <span className="badge-dot" /> {po.deliveryStatus}
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {po.trackingNumber ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Globe size={12} className="text-indigo" /> {po.carrier}
                            </div>
                          ) : 'Not Shipped'}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-6">
                            <button className="btn btn-ghost btn-xs" title="Download PDF"><Download size={14} /></button>
                            {!po.acknowledgedAt && (
                              <button className="btn btn-xs btn-outline-indigo" onClick={() => acknowledgePO(po.id)}>Ack</button>
                            )}
                            {po.deliveryStatus === 'Approved' && po.acknowledgedAt && (
                              <button className="btn btn-xs btn-outline-indigo" onClick={() => { setSelectedPOId(po.id); setModalOpen('confirmShipment'); }}>Ship</button>
                            )}
                            {['Shipped', 'Partially Delivered'].includes(po.deliveryStatus) && (
                              <button className="btn btn-xs btn-outline-indigo" onClick={() => { setSelectedPOId(po.id); setModalOpen('notifyDelivery'); }}>Deliv</button>
                            )}
                            {['Shipped', 'Partially Delivered', 'Delivered'].includes(po.deliveryStatus) && (
                              <button className="btn btn-xs btn-primary btn-glow" onClick={() => { setSelectedPOId(po.id); setModalOpen('submitInvoice'); }}>Invoice</button>
                            )}
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

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-4" style={{ gap: 16 }}>
              {[
                { label: 'Overall Score', value: `${myData.kpis.deliveryPerformance}%`, icon: <BarChart3 size={16} />, color: 'var(--accent-indigo)' },
                { label: 'Market Rank', value: '#12 / 450', icon: <TrendingUp size={16} />, color: 'var(--accent-emerald)' },
                { label: 'Yearly Trend', value: '+4.2%', icon: <TrendingUp size={16} />, color: 'var(--accent-cyan)' },
                { label: 'Rejection Rate', value: `${myData.kpis.rejectionRate}%`, icon: <TrendingDown size={16} />, color: 'var(--accent-rose)' },
              ].map((m, i) => (
                <div key={i} className="card glass luxury-border p-16 flex items-center gap-12" style={{ borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header">
               <div className="flex items-center gap-10">
                  <BarChart3 className="text-indigo" size={18} />
                  <h3 className="card-title">Supplier Performance Scorecard</h3>
               </div>
            </div>

            <div className="grid grid-2" style={{ gap: 24 }}>
              <div className="card glass">
                <div className="card-header">
                  <h3 className="card-title">Historical Fulfillment Trend</h3>
                  <div className="badge draft">Units: % Delivered On-Time</div>
                </div>
                <div style={{ height: 280, padding: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={myData.kpiHistory}>
                      <defs>
                        <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-slate)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent-slate)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis domain={[80, 100]} stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-glow)', borderRadius: 12 }} />
                      <Area type="monotone" dataKey="delivery" stroke="var(--accent-slate)" strokeWidth={3} fillOpacity={1} fill="url(#colorPerf)" dot={{ r: 5, fill: 'var(--accent-slate)', strokeWidth: 2, stroke: 'var(--bg-primary)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card glass">
                <div className="card-header">
                  <h3 className="card-title">Rejection Rate Breakdown</h3>
                  <div className="badge shadow-neon" data-status="Rejected">Anomalies Detected</div>
                </div>
                <div style={{ height: 280, padding: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={myData.kpiHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-glow)', borderRadius: 12 }} />
                      <Line type="monotone" dataKey="rejection" stroke="var(--accent-rose)" strokeWidth={3} dot={{ r: 5, fill: 'var(--accent-rose)', strokeWidth: 2, stroke: 'var(--bg-primary)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card glass luxury-border">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Preferred Status Criteria</h3>
                  <p className="text-muted text-xs">Meet these targets to unlock early payment rewards and higher quotas.</p>
                </div>
              </div>
              <div className="grid grid-2" style={{ gap: 16, padding: 24 }}>
                {myData.preferredStatusCriteria?.map((c, i) => (
                  <div key={i} className="kpi-target-row" style={{ 
                    display: 'flex', alignItems: 'center', gap: 16, 
                    padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {c.met ? <ShieldCheck className="text-success" size={24} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px dashed var(--text-faint)' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.met ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.criterion}</div>
                      <div className="progress-bar-container" style={{ margin: '8px 0', height: 4 }}>
                        <div className="progress-bar-fill" style={{ width: c.met ? '100.00%' : '65%', background: c.met ? 'var(--accent-indigo)' : 'var(--accent-amber)' }} />
                      </div>
                    </div>
                    <span className={`badge ${c.met ? 'approved' : 'pending'}`} style={{ fontSize: 9 }}>{c.met ? 'QUALIFIED' : 'PENDING'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-4" style={{ gap: 16 }}>
              {[
                { label: 'Outstanding Balance', value: `$${totalOutstanding.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'var(--accent-rose)', bg: 'rgba(239,68,68,0.08)' },
                { label: 'Payments Released', value: `$${releasedPayments.toLocaleString()}`, icon: <CreditCard size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.08)' },
                { label: 'Avg Payment Cycle', value: `${avgPayCycle} Days`, icon: <Clock size={20} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.08)' },
                { label: 'Active Credit Line', value: '$500,000', icon: <Landmark size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.08)' },
              ].map((m, i) => (
                <div key={i} className="card glass luxury-border p-16 flex items-center gap-16" style={{ borderLeft: `4px solid ${m.color}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header">
               <div className="flex items-center gap-10">
                  <DollarSign className="text-indigo" size={18} />
                  <h3 className="card-title">Financial Ledger & Settlement Hub</h3>
               </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
              <div className="card glass">
                <div className="card-header">
                  <h3 className="card-title">Statement of Account (SOA)</h3>
                  <button className="btn btn-ghost btn-xs"><Download size={14} /> PDF</button>
                </div>
                <div className="table-responsive">
                  <table className="data-table ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th className="text-right">Debit</th>
                        <th className="text-right">Credit</th>
                        <th className="text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myInvoices.map((inv, i) => (
                        <tr key={inv.id}>
                          <td>{inv.date}</td>
                          <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                          <td className="text-right text-danger font-mono">—</td>
                          <td className="text-right text-success font-mono">+{inv.totalAmount.toLocaleString()}</td>
                          <td className="text-right font-bold font-mono">
                            ${(totalOutstanding + releasedPayments - (i * 2000)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {releasedPayments > 0 && (
                        <tr style={{ background: 'rgba(16,185,129,0.05)' }}>
                          <td>2026-04-05</td>
                          <td className="font-mono text-xs">PAY-BATCH-004</td>
                          <td className="text-right text-danger font-mono">-{releasedPayments.toLocaleString()}</td>
                          <td className="text-right text-success font-mono">—</td>
                          <td className="text-right font-bold font-mono">Settled</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card glass priority-glow">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Early Settlement Offers</h3>
                    <p className="text-muted text-xs">Unlock liquidity using dynamic discounting.</p>
                  </div>
                  <TrendingUp className="text-indigo" size={20} />
                </div>
                <div className="stack-md" style={{ padding: 4 }}>
                  {invoices.filter(inv => inv.supplierId === mySupplierId && inv.matchStatus === 'Full Match').map(inv => (
                    <div key={inv.id} className="payment-offer-card" style={{ 
                      padding: 16, borderRadius: 16, 
                      background: 'linear-gradient(135deg, rgba(124,148,160,0.1) 0%, rgba(99,102,241,0.02) 100%)',
                      border: '1px solid rgba(124,148,160,0.2)'
                    }}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold font-mono">{inv.invoiceNumber}</span>
                        <span className="text-indigo font-bold">${inv.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted">Original Due: {inv.dueDate}</div>
                        <button className="btn btn-xs btn-primary btn-glow" onClick={() => { setSelectedPOId(inv.id); setModalOpen('earlyPayment'); }}>
                          Withdraw Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUALITY TAB */}
        {activeTab === 'quality' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-4" style={{ gap: 16 }}>
              {[
                { label: 'Inspection Pass', value: '98.2%', icon: <CheckCircle2 size={16} />, color: 'var(--accent-emerald)' },
                { label: 'Active Disputes', value: disputes.filter(d => d.status === 'Open').length, icon: <AlertTriangle size={16} />, color: 'var(--accent-rose)' },
                { label: 'Average Variance', value: '1.4%', icon: <TrendingDown size={16} />, color: 'var(--accent-amber)' },
                { label: 'QC Gates Passed', value: '24', icon: <Activity size={16} />, color: 'var(--accent-cyan)' },
              ].map((m, i) => (
                <div key={i} className="card glass luxury-border p-16 flex items-center gap-12" style={{ borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header">
               <div className="flex items-center gap-10">
                  <Activity className="text-indigo" size={18} />
                  <h3 className="card-title">Delivery & Quality Governance</h3>
               </div>
            </div>

            <div className="card glass">
              <div className="card-header">
                <h3 className="card-title">Goods Receipt & Inspection Logs</h3>
                <div className="badge pending">Live Feed</div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>GRN ID</th>
                      <th>Received Date</th>
                      <th>Passed Qty</th>
                      <th>Rejected Qty</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grns.filter(g => g.supplierId === mySupplierId).map(grn => {
                      const rejectedTotal = grn.lineItems.reduce((acc, item) => acc + (item.rejectedQty || 0), 0);
                      const passedTotal = grn.lineItems.reduce((acc, item) => acc + (item.receivedQty || 0), 0) - rejectedTotal;
                      return (
                        <tr key={grn.id}>
                          <td className="font-mono text-primary font-bold">{grn.id}</td>
                          <td>{grn.dateCreated}</td>
                          <td className="text-success font-bold">{passedTotal}</td>
                          <td className="text-danger font-bold">{rejectedTotal}</td>
                          <td>
                            <div className="badge shadow-sm" data-status={rejectedTotal > 0 ? 'Variance' : 'Approved'}>
                              <span className="badge-dot" /> {rejectedTotal > 0 ? 'QC VARIANCE' : 'QC PASSED'}
                            </div>
                          </td>
                          <td className="text-right">
                            {rejectedTotal > 0 && (
                              <button className="btn btn-xs btn-ghost text-danger" onClick={() => { setSelectedGRNId(grn.id); setModalOpen('disputeGRN'); }}>
                                Dispute
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* COMMUNICATION HUB */}
        {activeTab === 'communication' && (
          <div className="stack-lg animate-in">
            <div className="section-header mb-0">
               <div className="flex items-center gap-10">
                  <MessageSquare className="text-indigo" size={18} />
                  <h3 className="card-title">Collaboration Hub</h3>
               </div>
               <div className="flex gap-8">
                  <button className="btn btn-ghost btn-xs"><Settings size={14} /> Protocol Settings</button>
               </div>
            </div>
            
            <div className="card glass" style={{ padding: 0, height: 600, display: 'flex', overflow: 'hidden' }}>
              <div className="chat-sidebar" style={{ width: 280, borderRight: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 className="card-title">Recent Threads</h3>
                </div>
                <div className="chat-threads-list" style={{ overflowY: 'auto', height: 'calc(600px - 70px)' }}>
                  {[
                    ...negotiationThreads,
                    { id: 'RFQ-001', type: 'Clarification', title: 'Carbon Steel Pipes Specs', time: '10:45 AM', active: activeMessageThread === 'RFQ-001' },
                    { id: 'PO-001', type: 'Logistics', title: 'Delivery Window Steele', time: 'Yesterday', active: activeMessageThread === 'PO-001' },
                  ].map(thread => (
                    <div 
                      key={thread.id} 
                      className={`chat-thread-item ${thread.active ? 'active' : ''}`}
                      onClick={() => setActiveMessageThread(thread.id)}
                      style={{ 
                        padding: '16px 20px', cursor: 'pointer', 
                        background: thread.active ? 'rgba(99,102,241,0.08)' : 'transparent',
                        borderLeft: thread.active ? '3px solid var(--accent-indigo)' : '3px solid transparent'
                      }}
                    >
                      <div className="flex justify-between mb-1">
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-indigo)' }}>{thread.type}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{thread.time || 'NOW'}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{thread.title}</div>
                      <div className="text-xs text-muted truncate">{thread.id} · New activity</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="chat-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between' }}>
                  <div className="flex items-center gap-12">
                     <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <User size={20} className="text-bg-deep" />
                     </div>
                     <div>
                       <div style={{ fontWeight: 700 }}>Procurement Team</div>
                       <div className="text-xs text-muted">Aisha Al-Hashimi · Online</div>
                     </div>
                  </div>
                </div>
                <div className="chat-messages" style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div className="text-center p-32 opacity-30 mt-20">
                      <MessageSquare size={48} className="mx-auto mb-16" />
                      <p>Select a thread to view full history</p>
                   </div>
                </div>
                <div className="chat-input-area" style={{ padding: 20, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    placeholder="Type message..." 
                    style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '0 16px', fontSize: 13, outline: 'none' }}
                  />
                  <button className="btn btn-primary btn-icon"><Send size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-4" style={{ gap: 16 }}>
              {[
                { label: 'Certified Docs', value: complianceDocs.filter(d => d.status === 'Active').length, icon: <ShieldCheck size={16} />, color: 'var(--accent-emerald)' },
                { label: 'Expiring Soon', value: complianceDocs.filter(d => d.status === 'Expiring Soon').length, icon: <Clock size={16} />, color: 'var(--accent-amber)' },
                { label: 'Expired', value: complianceDocs.filter(d => d.status === 'Expired').length, icon: <AlertTriangle size={16} />, color: 'var(--accent-rose)' },
                { label: 'Compliance Score', value: '100.00%', icon: <Activity size={16} />, color: 'var(--accent-indigo)' },
              ].map((m, i) => (
                <div key={i} className="card glass luxury-border p-16 flex items-center gap-12" style={{ borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header">
               <div className="flex items-center gap-10">
                  <ShieldCheck className="text-indigo" size={18} />
                  <h3 className="card-title">Document Governance & Compliance</h3>
               </div>
               <button className="btn btn-primary btn-sm shadow-neon" onClick={() => setModalOpen('uploadCompliance')}>
                  <Upload size={14} /> Upload New Certificate
               </button>
            </div>
            
            <div className="card glass">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Document Title</th>
                      <th>Category</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceDocs.map(doc => (
                      <tr key={doc.id}>
                        <td className="font-bold flex items-center gap-10">
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <ShieldCheck size={16} className="text-indigo" />
                          </div>
                          {doc.title}
                        </td>
                        <td className="text-muted">{doc.category}</td>
                        <td className={doc.status === 'Expired' ? 'text-danger font-bold' : ''}>{doc.expiryDate}</td>
                        <td>
                          <div className="badge shadow-sm" data-status={doc.status}>
                            <span className="badge-dot" /> {doc.status.toUpperCase()}
                          </div>
                        </td>
                        <td className="text-right">
                           <button className="btn btn-ghost btn-icon"><Download size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BIDS TAB */}
        {activeTab === 'bids' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-4" style={{ gap: 16 }}>
              {[
                { label: 'Open Tenders', value: eligibleRFQs.length, icon: <Globe size={20} />, color: 'var(--accent-indigo)', bg: 'rgba(99,102,241,0.08)' },
                { label: 'Participated', value: myBids.length, icon: <Send size={20} />, color: 'var(--accent-slate)', bg: 'rgba(177,202,215,0.08)' },
                { label: 'Tenders Lost', value: myBids.filter(b => b.status === 'Rejected').length, icon: <XCircle size={20} />, color: 'var(--accent-rose)', bg: 'rgba(239,68,68,0.08)' },
                { label: 'Awards Won', value: myBids.filter(b => b.status === 'Awarded').length, icon: <Award size={20} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.08)' },
              ].map((m, i) => (
                <div key={i} className="card glass luxury-border flex items-center gap-16" style={{ padding: '16px 20px', borderLeft: `4px solid ${m.color}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header">
               <div className="flex items-center gap-10">
                  <FileBarChart className="text-indigo" size={18} />
                  <h3 className="card-title">Strategic Sourcing & Quotations</h3>
               </div>
            </div>

            <div className="grid grid-2" style={{ gap: 24 }}>
              <div className="stack-md">
                <div className="flex items-center gap-8 mb-12">
                   <Globe className="text-indigo" size={16} />
                   <h4 style={{ margin: 0, fontSize: 14 }}>Discovery Opportunities</h4>
                </div>
                {eligibleRFQs.length > 0 ? eligibleRFQs.map(rfq => (
                  <div key={rfq.id} className="card glass luxury-border p-20 hover-glow">
                    <div className="flex justify-between items-start mb-12">
                       <span className="badge approved" style={{ fontSize: 9 }}>{rfq.tenderType?.toUpperCase() || 'RFQ'}</span>
                       <span className="font-mono text-xs opacity-50">{rfq.id}</span>
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>{rfq.title}</h4>
                    <p className="text-xs text-muted mb-16 line-clamp-2">{rfq.notes}</p>
                    <div className="flex gap-16 mb-16 pt-12 border-t border-white/5">
                       <div>
                          <div className="text-[10px] text-muted uppercase">Deadline</div>
                          <div className="text-xs font-bold text-danger">{rfq.bidDeadline}</div>
                       </div>
                       <div>
                          <div className="text-[10px] text-muted uppercase">Scope</div>
                          <div className="text-xs font-bold">{rfq.lineItems.length} Groups</div>
                       </div>
                    </div>
                    <button className="btn btn-primary btn-xs w-full shadow-neon" onClick={() => { setSelectedRFQId(rfq.id); setModalOpen('bidSubmission'); }}>Initialize Proposal</button>
                  </div>
                )) : (
                  <div className="card glass p-32 text-center opacity-50 border-dashed">
                     <Search size={24} className="mx-auto mb-8" />
                     <div className="text-xs">No active tenders for your profile</div>
                  </div>
                )}
              </div>

              <div className="stack-md">
                <div className="flex items-center gap-8 mb-12">
                   <CheckCircle2 className="text-success" size={16} />
                   <h4 style={{ margin: 0, fontSize: 14 }}>My Active Submissions</h4>
                </div>
                <div className="card glass p-0 overflow-hidden">
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Proposal</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myBids.map(bid => (
                          <tr key={bid.id}>
                            <td className="font-bold font-mono text-xs">{bid.id}</td>
                            <td>
                               {bid.evaluation ? <span className="font-black text-indigo">{bid.evaluation.totalScore}</span> : '—'}
                            </td>
                            <td>
                               <div className="badge shadow-sm" data-status={bid.status}>{bid.status}</div>
                            </td>
                            <td className="text-right">
                               <button className="btn btn-ghost btn-icon btn-xs" onClick={() => setActiveTab('communication')}><MessageSquare size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Product Showcase */}
            <div className="card glass luxury-border" style={{ padding: 24, marginBottom: 24 }}>
              <div className="card-header" style={{ marginBottom: 20 }}>
                <h3 className="card-title">My Product Portfolio</h3>
                <span className="text-xs text-muted">{products.length} Items Listed</span>
              </div>
              <div className="grid grid-3" style={{ gap: 20 }}>
                {products.map(product => (
                  <div key={product.id} className="product-card-premium" style={{ 
                    padding: 16, borderRadius: 20, background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease'
                  }}>
                    <div style={{ width: '100%', height: 120, borderRadius: 12, background: 'var(--bg-tertiary)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={40} className="text-muted" opacity={0.3} />
                    </div>
                    <div className="text-xs font-bold text-indigo mb-1 uppercase letter-spacing-1">{product.category}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{product.name}</div>
                    <div className="text-xs text-muted mb-4 font-mono">{product.sku}</div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <span className="font-bold text-success">${product.basePrice.toLocaleString()} <span className="text-[10px] opacity-60">/{product.unit}</span></span>
                      <button className="btn btn-ghost btn-icon btn-xs"><ExternalLink size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card glass">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Document Library & Resource Center</h3>
                  <p className="text-xs text-muted">All product documentation visible to the procurement team.</p>
                </div>
                <div className="search-box-minimal">
                  <Search size={14} />
                  <input type="text" placeholder="Search resources..." onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Category</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th>Size</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceDocs
                      .filter(doc => doc.supplierId === mySupplierId && 
                        ['Product Catalogue', 'Product Certificate', 'Technical Datasheet', 'ISO Certification'].includes(doc.category) &&
                        (doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.category.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map(doc => (
                        <tr key={doc.id}>
                          <td>
                            <div className="flex items-center gap-10">
                              <div style={{ color: doc.category.includes('Catalogue') ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>
                                <FileText size={18} />
                              </div>
                              <span style={{ fontWeight: 600 }}>{doc.title}</span>
                            </div>
                          </td>
                          <td><span className="text-xs font-bold opacity-60 uppercase letter-spacing-1">{doc.category}</span></td>
                          <td>{doc.expiryDate}</td>
                          <td>
                            <div className="badge shadow-sm" data-status={doc.status}>
                              <span className="badge-dot" /> {doc.status.toUpperCase()}
                            </div>
                          </td>
                          <td className="font-mono text-xs opacity-60">{doc.fileSize}</td>
                          <td className="text-right">
                            <button className="btn btn-ghost btn-icon btn-xs" title="Download Resource"><Download size={14} /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .tabs-minimal button {
          border: none;
          background: none;
          padding: 18px 24px;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .tabs-minimal button:hover {
          color: var(--text-primary);
        }
        .tabs-minimal button.active {
          color: var(--accent-slate);
        }
        .tabs-minimal button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20%;
          right: 20%;
          height: 3px;
          background: var(--accent-slate);
          border-radius: 3px 3px 0 0;
          box-shadow: 0 0 10px rgba(177,202,215,0.4);
        }
        .btn-glow:hover {
          box-shadow: 0 0 15px rgba(99,102,241,0.4);
        }
        .luxury-border:hover {
          border-color: var(--accent-indigo);
          box-shadow: 0 0 30px rgba(99,102,241,0.1);
        }
        .payment-offer-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-indigo) !important;
        }
        .chat-thread-item:hover {
          background: rgba(255,255,255,0.03);
        }
        .form-group-minimal label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .form-group-minimal input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .form-group-minimal input:focus {
          border-color: var(--accent-indigo);
        }
      `}</style>
      {/* Standalone Logout Button */}
      {standalone && (
        <button 
          onClick={() => {
            supplierLogout();
            router.push('/');
          }}
          className="glass-button flex items-center gap-2" 
          style={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32, 
            zIndex: 1000,
            padding: '12px 24px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#f87171'
          }}
        >
          <Lock size={18} /> Logout Vendor Portal
        </button>
      )}
    </div></div>
  );
}
