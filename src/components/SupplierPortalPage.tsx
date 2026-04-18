'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Building2, FileText, Send, Clock, CheckCircle2, 
  AlertTriangle, Download, Upload, ExternalLink,
  DollarSign, Package, ShieldCheck, MessageSquare,
  Search, Filter, ChevronRight, BarChart3, Calendar, Plus, TrendingUp, TrendingDown, Scale, UserPlus, Settings, Info, CreditCard, FileBarChart, Activity, User, Globe, Landmark
} from 'lucide-react';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell
} from 'recharts';

type PortalTab = 'pos' | 'bids' | 'performance' | 'financials' | 'quality' | 'communication' | 'compliance' | 'account';

export default function SupplierPortalPage() {
  const { 
    acknowledgePO, setSelectedPOId,
    invoices, grns, complianceDocs, disputes,
    setSelectedGRNId, setModalOpen, suppliers, purchaseOrders, quotations, rfqs,
    setSelectedRFQId, setSelectedQuotationId, documents, poMessages,
    sendPOMessage, updateSupplierProfile, requestEarlyPayment, addSupplierContact
  } = useApp();
  
  // For demo: pretend we are "SteelMax Industries" (SUP-001)
  const mySupplierId = 'SUP-001';
  const myData = suppliers.find(s => s.id === mySupplierId);
  
  const [activeTab, setActiveTab] = useState<PortalTab>('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMessageThread, setActiveMessageThread] = useState('RFQ-001');

  const myPOs = purchaseOrders.filter(po => po.supplierId === mySupplierId);
  const myBids = quotations.filter(q => q.supplierId === mySupplierId);
  const openRFQs = rfqs.filter(rfq => rfq.status === 'Sent' && !myBids.some(b => b.rfqId === rfq.id));

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

      {/* Top Metrics Grid */}
      <div className="metrics-grid" style={{ marginBottom: 32 }}>
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
          <div className="metric-value">$142.5K</div>
          <div className="metric-label">Total Outstanding Balance</div>
          <div style={{ fontSize: 10, color: 'var(--accent-cyan)', marginTop: 6, cursor: 'pointer' }} onClick={() => setActiveTab('financials')}>
            View SOA <ChevronRight size={10} style={{ verticalAlign: 'middle' }} />
          </div>
        </div>
      </div>

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
            { id: 'pos', label: 'Purchase Orders', icon: <Package size={14} /> },
            { id: 'bids', label: 'Quotations & Bidding', icon: <FileBarChart size={14} /> },
            { id: 'performance', label: 'Performance Scorecard', icon: <BarChart3 size={14} /> },
            { id: 'financials', label: 'Financial Visibility', icon: <DollarSign size={14} /> },
            { id: 'quality', label: 'Delivery & Quality', icon: <Activity size={14} /> },
            { id: 'communication', label: 'Communication Hub', icon: <MessageSquare size={14} /> },
            { id: 'compliance', label: 'Compliance Vault', icon: <ShieldCheck size={14} /> },
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
        
        {/* PURCHASE ORDERS TAB */}
        {activeTab === 'pos' && (
          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">Active Purchase Orders</h3>
              <div className="search-box-minimal">
                <Search size={14} />
                <input type="text" placeholder="Search PO numbers..." />
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
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-xs" title="Download PDF"><Download size={14} /></button>
                          
                          {!po.acknowledgedAt && (
                            <button className="btn btn-xs btn-outline-indigo" onClick={() => acknowledgePO(po.id)}>
                              Ack
                            </button>
                          )}

                          {po.deliveryStatus === 'Approved' && po.acknowledgedAt && (
                            <button className="btn btn-xs btn-outline-indigo" onClick={() => { setSelectedPOId(po.id); setModalOpen('confirmShipment'); }}>
                              Ship
                            </button>
                          )}

                          {['Shipped', 'Partially Delivered'].includes(po.deliveryStatus) && (
                            <button className="btn btn-xs btn-outline-indigo" onClick={() => { setSelectedPOId(po.id); setModalOpen('notifyDelivery'); }}>
                              Deliv
                            </button>
                          )}

                          {['Shipped', 'Partially Delivered', 'Delivered'].includes(po.deliveryStatus) && (
                            <button className="btn btn-xs btn-primary btn-glow" onClick={() => { setSelectedPOId(po.id); setModalOpen('submitInvoice'); }}>
                              Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="stack-lg">
            <div className="grid grid-2">
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
              <div className="grid grid-2" style={{ gap: 16 }}>
                {myData.preferredStatusCriteria?.map((c, i) => (
                  <div key={i} className="kpi-target-row" style={{ 
                    display: 'flex', alignItems: 'center', gap: 16, 
                    padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {c.met ? <ShieldCheck className="text-success" size={24} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px dashed var(--text-faint)' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.met ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.criterion}</div>
                      <div className="progress-bar-container" style={{ margin: '8px 0', height: 4 }}>
                        <div className="progress-bar-fill" style={{ width: c.met ? '100%' : '65%', background: c.met ? 'var(--accent-indigo)' : 'var(--accent-amber)' }} />
                      </div>
                    </div>
                    <span className={`badge ${c.met ? 'approved' : 'pending'}`} style={{ fontSize: 9 }}>{c.met ? 'QUALIFIED' : 'PENDING'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FINANCIALS TAB (Refined Ledger) */}
        {activeTab === 'financials' && (
          <div className="stack-lg">
            <div className="grid grid-3">
              <div className="metric-card emerald">
                <div className="metric-icon emerald"><DollarSign size={20} /></div>
                <div className="metric-value">$24,850</div>
                <div className="metric-label">Outstanding Invoices</div>
              </div>
              <div className="metric-card indigo">
                <div className="metric-icon indigo"><CreditCard size={20} /></div>
                <div className="metric-value">$12,400</div>
                <div className="metric-label">Payments Released (30d)</div>
              </div>
              <div className="metric-card amber">
                <div className="metric-icon amber"><Clock size={20} /></div>
                <div className="metric-value">28.4 Days</div>
                <div className="metric-label">Average Payment Cycle</div>
              </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
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
                      {[
                        { date: '2026-04-10', ref: 'INV-SM-7781', debit: 0, credit: 5200, balance: 24850 },
                        { date: '2026-04-05', ref: 'PAY-ORD-9921', debit: 12400, credit: 0, balance: 19650 },
                        { date: '2026-03-28', ref: 'INV-SM-7742', debit: 0, credit: 8800, balance: 32050 },
                      ].map((entry, i) => (
                        <tr key={i}>
                          <td>{entry.date}</td>
                          <td className="font-mono text-xs">{entry.ref}</td>
                          <td className="text-right text-danger font-mono">{entry.debit > 0 ? `-${entry.debit.toLocaleString()}` : '—'}</td>
                          <td className="text-right text-success font-mono">{entry.credit > 0 ? `+${entry.credit.toLocaleString()}` : '—'}</td>
                          <td className="text-right font-bold font-mono">${entry.balance.toLocaleString()}</td>
                        </tr>
                      ))}
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

        {/* COMMUNICATION HUB */}
        {activeTab === 'communication' && (
          <div className="card glass" style={{ padding: 0, height: 600, display: 'flex', overflow: 'hidden' }}>
            <div className="chat-sidebar" style={{ width: 280, borderRight: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 className="card-title">Recent Threads</h3>
              </div>
              <div className="chat-threads-list" style={{ overflowY: 'auto', height: 'calc(600px - 70px)' }}>
                {[
                  { id: 'RFQ-001', type: 'Clarification', title: 'Carbon Steel Pipes Specs', time: '10:45 AM', active: true },
                  { id: 'PO-001', type: 'Logistics', title: 'Delivery Window Steele', time: 'Yesterday', active: false },
                  { id: 'SUP-PRO', type: 'Support', title: 'Platform Onboarding', time: '2d ago', active: false },
                ].map(thread => (
                  <div 
                    key={thread.id} 
                    className={`chat-thread-item ${thread.active ? 'active' : ''}`}
                    style={{ 
                      padding: '16px 20px', cursor: 'pointer', 
                      background: thread.active ? 'rgba(99,102,241,0.08)' : 'transparent',
                      borderLeft: thread.active ? '3px solid var(--accent-indigo)' : '3px solid transparent'
                    }}
                  >
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-indigo)' }}>{thread.type}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{thread.time}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{thread.title}</div>
                    <div className="text-xs text-muted truncate">{thread.id} · New message from Buyer</div>
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
                     <div style={{ fontWeight: 700 }}>Aisha Al-Hashimi</div>
                     <div className="text-xs text-muted">Senior Procurement Manager · Online</div>
                   </div>
                </div>
                <button className="btn btn-ghost btn-xs"><Settings size={14} /></button>
              </div>
              <div className="chat-messages" style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ alignSelf: 'flex-start', maxWidth: '70%', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px' }}>
                  <p style={{ fontSize: 13 }}>Hi, we noticed the MTC for lines 4-8 are missing the ASME stamp. Can you please re-upload?</p>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>10:45 AM</span>
                </div>
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%', background: 'var(--accent-indigo)', color: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '16px 16px 4px 16px' }}>
                  <p style={{ fontSize: 13 }}>Apologies, checking with QC team now. Will upload by EOD.</p>
                  <span style={{ fontSize: 10, opacity: 0.7, marginTop: 4, display: 'block' }}>11:02 AM</span>
                </div>
              </div>
              <div className="chat-input-area" style={{ padding: 20, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost btn-icon"><Plus size={18} /></button>
                <input type="text" placeholder="Type clarification request..." style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '0 16px', fontSize: 13, outline: 'none' }} />
                <button className="btn btn-primary btn-icon"><Send size={18} /></button>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="grid grid-2">
            <div className="card glass">
               <div className="card-header">
                  <h3 className="card-title">Company Profile Settings</h3>
               </div>
               <div className="stack-lg">
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '0 0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Building2 size={40} className="text-muted" />
                    </div>
                    <div>
                       <button className="btn btn-xs btn-outline-indigo mb-2">Update Company Logo</button>
                       <p className="text-xs text-muted">JPG or PNG. Max 5MB.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-2">
                    <div className="form-group-minimal">
                      <label>Legal Company Name</label>
                      <input type="text" defaultValue={myData.name} />
                    </div>
                    <div className="form-group-minimal">
                      <label>Trade License Number</label>
                      <input type="text" defaultValue="TL-2024-99812" readOnly style={{ opacity: 0.6 }} />
                    </div>
                  </div>

                  <div style={{ padding: 20, borderRadius: 16, background: 'rgba(233,193,118,0.03)', border: '1px solid rgba(233,193,118,0.1)' }}>
                    <div className="flex items-center gap-10 mb-6">
                      <Landmark className="text-amber" size={20} />
                      <h4 style={{ margin: 0, fontSize: 14 }}>Settlement & Bank Details</h4>
                    </div>
                    <div className="grid grid-2">
                      <div className="form-group-minimal">
                        <label>Beneficiary Bank</label>
                        <input type="text" defaultValue={myData.bankInfo?.bankName} />
                      </div>
                      <div className="form-group-minimal">
                        <label>Account Number</label>
                        <input type="text" defaultValue={myData.bankInfo?.accountNo} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button className="btn btn-primary">Save Changes</button>
                  </div>
               </div>
            </div>

            <div className="card glass">
               <div className="card-header">
                  <h3 className="card-title">Authorized Contacts</h3>
                  <button className="btn btn-xs" onClick={() => setModalOpen('addContact')}>+ Add New</button>
               </div>
               <div className="stack-md">
                  {myData.contactList?.map((contact) => (
                    <div key={contact.id} className="contact-card-premium" style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div className="flex items-center gap-12">
                         <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} className="text-indigo" />
                         </div>
                         <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{contact.name}</div>
                            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ShieldCheck size={10} className="text-success" /> {contact.role}
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div style={{ fontSize: 12, fontWeight: 600 }}>{contact.email}</div>
                         <div className="badge shadow-sm mt-1" style={{ fontSize: 8 }}>ADMIN ACCESS</div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* QUALITY TAB */}
        {activeTab === 'quality' && (
          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">Goods Receipt & Inspection Status</h3>
              <div className="badge pending">Live Tracking</div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>GRN ID</th>
                    <th>PO Ref</th>
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
                        <td className="text-muted">{grn.poId}</td>
                        <td>{grn.dateCreated}</td>
                        <td className="text-success font-bold">{passedTotal}</td>
                        <td className="text-danger font-bold">{rejectedTotal}</td>
                        <td>
                          <div className="badge" data-status={rejectedTotal > 0 ? 'Variance' : 'Approved'}>
                            {rejectedTotal > 0 ? 'QC VARIANCE' : 'QC PASSED'}
                          </div>
                        </td>
                        <td className="text-right">
                          {rejectedTotal > 0 && (
                            <button className="btn btn-xs btn-outline-danger" onClick={() => { setSelectedGRNId(grn.id); setModalOpen('disputeGRN'); }}>
                              Raise Dispute
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
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="stack-lg">
            <div className="card glass">
              <div className="card-header">
                <div>
                   <h3 className="card-title">Document Governance</h3>
                   <p className="text-xs text-muted">Automatic renewals are enabled for trade certificates.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setModalOpen('uploadCompliance')}>
                   Upload New Cert
                </button>
              </div>
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
                          <div className="badge" data-status={doc.status}>
                            {doc.status.toUpperCase()}
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
          <div className="grid-2">
            <div className="card glass">
              <div className="card-header">
                <h3 className="card-title">Open Tender Portal</h3>
              </div>
              <div className="stack-md">
                {openRFQs.length > 0 ? openRFQs.map(rfq => (
                  <div key={rfq.id} className="tender-item-premium" style={{ 
                    padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)', position: 'relative'
                  }}>
                    <span style={{ position: 'absolute', top: 20, right: 20, fontSize: 10, fontWeight: 800, color: 'var(--accent-amber)' }}>NEW RFQ</span>
                    <div style={{ color: 'var(--accent-indigo)', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', marginBottom: 6 }}>{rfq.id}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{rfq.title}</div>
                    <div className="flex gap-16 mb-6">
                       <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><Clock size={11} /> Due {rfq.deadlineDate}</span>
                       <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><Package size={11} /> {rfq.lineItems.length} Products</span>
                    </div>
                    <button className="btn btn-sm btn-primary w-full" onClick={() => { setSelectedRFQId(rfq.id); setModalOpen('newQuotation'); }}>
                       Draft Proposal
                    </button>
                  </div>
                )) : (
                  <div className="p-12 text-center text-muted italic">No new tenders found. Check back later.</div>
                )}
              </div>
            </div>

            <div className="card glass">
              <div className="card-header">
                <h3 className="card-title">Submitted Quotations</h3>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBids.map(bid => (
                      <tr key={bid.id}>
                        <td className="font-mono text-xs">{bid.id}</td>
                        <td className="font-bold">${bid.totalAmount.toLocaleString()}</td>
                        <td>
                          <div className="badge shadow-sm" data-status={bid.status === 'Awarded' ? 'Approved' : bid.status}>
                            {bid.status.toUpperCase()}
                          </div>
                        </td>
                        <td className="text-right">
                           <button className="btn btn-ghost btn-xs" onClick={() => { setSelectedQuotationId(bid.id); setModalOpen('negotiation'); }}>
                             <MessageSquare size={14} /> View Feedback
                           </button>
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
    </div></div>
  );
}
