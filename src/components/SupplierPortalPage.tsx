'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Building2, FileText, Send, Clock, CheckCircle2, 
  AlertTriangle, Download, Upload, ExternalLink,
  DollarSign, Package, ShieldCheck, MessageSquare,
  Search, Filter, ChevronRight, BarChart3, Calendar, Plus, TrendingUp, TrendingDown, Scale, UserPlus, Settings, Info, CreditCard, FileBarChart, Activity, User, Globe, Landmark, Lock, X, XCircle, Award, Mail, Edit2
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
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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
    <div className="page-content animate-in"><div className="content-wrapper" style={{ padding: 'var(--padding-page)', maxWidth: 1600 }}>
      {/* Sovereign Editorial Header */}
      <div className="page-header" style={{ 
        marginBottom: 24, 
        padding: '24px', 
        background: 'var(--gradient-surface)', 
        borderRadius: 'var(--radius-standard)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient Shimmer Background */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 10% 0%, rgba(177,202,215,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
        
        <div 
          style={{ 
            width: 72, 
            height: 72, 
            borderRadius: 18, 
            background: myData.logo ? 'none' : 'var(--gradient-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 28,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            color: 'rgba(0,0,0,0.6)',
            overflow: 'hidden',
            border: myData.logo ? '1px solid var(--border-subtle)' : 'none',
            flexShrink: 0
          }}
        >
          {myData.logo ? (
            <img src={myData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : myData.name[0]}
        </div>
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-12 mb-4">
            <h1 style={{ margin: 0, fontSize: 28, fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '-0.02em' }}>{myData.name} Vendor Portal</h1>
            <div className="badge" style={{ background: 'rgba(177,202,215,0.1)', color: 'var(--accent-slate)', padding: '4px 10px', fontSize: 10, letterSpacing: '0.05em' }}>
              <ShieldCheck size={12} /> VERIFIED PARTNER
            </div>
          </div>
          <div className="flex gap-20 text-xs text-muted">
            <div className="flex items-center gap-6"><Building2 size={12} /> ID: {myData.id}</div>
            <div className="flex items-center gap-6"><Mail size={12} /> {myData.email}</div>
            <div className="flex items-center gap-6 text-indigo"><Award size={12} /> Preferred Status</div>
          </div>
        </div>
        <div className="flex items-center gap-12">
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowEditProfile(true)}>
             <Settings size={14} /> Profile Settings
          </button>
          <button className="btn btn-primary shadow-neon" style={{ padding: '10px 20px', borderRadius: 12 }}>
            <Upload size={18} /> Submit New Offer
          </button>
        </div>
      </div>

      {/* Sovereign Intelligence Rail */}
      {activeTab === 'dashboard' && (
        <div className="metrics-grid animate-in" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-standard)' }}>
          <div className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
            <div className="metric-icon" style={{ background: 'rgba(177,202,215,0.06)', color: 'var(--accent-slate)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><FileText size={18} /></div>
            <div className="metric-value" style={{ fontSize: 26, fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{myPOs.filter(p => !['Delivered', 'Cancelled'].includes(p.deliveryStatus)).length}</div>
            <div className="metric-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.02em' }}>ACTIVE ORDERS</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} /> 2 awaiting action
            </div>
          </div>

          <div className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
            <div className="metric-icon" style={{ background: 'rgba(177,202,215,0.06)', color: 'var(--accent-slate)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><CheckCircle2 size={18} /></div>
            <div className="metric-value" style={{ fontSize: 26, fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{myData.kpis.deliveryPerformance}%</div>
            <div className="metric-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.02em' }}>ON-TIME DELIVERY</div>
            <div className="stat-trend positive" style={{ marginTop: 8, fontSize: 10, color: 'var(--accent-slate)' }}>Top 5% Globally</div>
          </div>

          <div className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
            <div className="metric-icon" style={{ background: 'rgba(177,202,215,0.06)', color: 'var(--accent-slate)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><ShieldCheck size={18} /></div>
            <div className="metric-value" style={{ fontSize: 26, fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{100 - myData.kpis.rejectionRate}%</div>
            <div className="metric-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.02em' }}>QUALITY PASS RATE</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 8 }}>Target Baseline: 98%</div>
          </div>

          <div className="metric-card" style={{ padding: '16px', background: 'rgba(233,193,118,0.03)', border: '1px solid rgba(233,193,118,0.1)', borderRadius: 'var(--radius-standard)' }}>
            <div className="metric-icon" style={{ background: 'rgba(233,193,118,0.1)', color: 'var(--accent-amber)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><DollarSign size={18} /></div>
            <div className="metric-value" style={{ fontSize: 26, fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--accent-amber)' }}>${(totalOutstanding / 1000).toFixed(1)}K</div>
            <div className="metric-label" style={{ fontSize: 11, color: 'var(--accent-amber)', opacity: 0.8, marginTop: 4, letterSpacing: '0.02em' }}>TOTAL OUTSTANDING</div>
            <div style={{ fontSize: 10, color: 'var(--accent-amber)', marginTop: 8, cursor: 'pointer', fontWeight: 700 }} onClick={() => setActiveTab('financials')}>
              LEDGER <ChevronRight size={10} style={{ verticalAlign: 'middle' }} />
            </div>
          </div>
        </div>
      )}

      {/* Sovereign Horizontal Tab Rail */}
      <div className="tabs-wrapper" style={{ 
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(11,14,20,0.92)',
        backdropFilter: 'blur(16px)',
        margin: '0 -24px 24px',
        padding: '0 24px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="tabs-minimal" style={{ 
          overflowX: 'auto', 
          whiteSpace: 'nowrap', 
          display: 'flex', 
          gap: 12,
          scrollbarWidth: 'none',
          padding: '8px 0'
        }}>
          {[
            { id: 'dashboard', label: 'Briefing', icon: <Activity size={14} /> },
            { id: 'pos', label: 'Procurement', icon: <Package size={14} /> },
            { id: 'bids', label: 'Bidding Hub', icon: <FileBarChart size={14} /> },
            { id: 'performance', label: 'Performance', icon: <BarChart3 size={14} /> },
            { id: 'financials', label: 'Financials', icon: <DollarSign size={14} /> },
            { id: 'communication', label: 'Secure Messages', icon: <MessageSquare size={14} /> },
            { id: 'compliance', label: 'Legal Vault', icon: <ShieldCheck size={14} /> },
            { id: 'product-library', label: 'Portfolios', icon: <Package size={14} /> },
            { id: 'account', label: 'Entity Profile', icon: <Building2 size={14} /> },
          ].map(tab => (
            <button 
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''} 
              onClick={() => setActiveTab(tab.id as PortalTab)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                color: activeTab === tab.id ? 'var(--accent-slate)' : 'var(--text-muted)',
                background: activeTab === tab.id ? 'rgba(177,202,215,0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                border: 'none',
                fontFamily: 'Manrope, sans-serif'
              }}
            >
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content with Animation Wrapper */}
      <div className="tab-viewport animate-in" style={{ animationDuration: '0.3s' }}>
        
        {/* DASHBOARD / OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <div className="stack-lg animate-in">
            <div className="grid grid-2" style={{ gap: 'var(--gap-standard)' }}>
               {/* Intelligence Briefing */}
               <div className="metric-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div className="flex items-center gap-16 mb-16">
                     <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity className="text-bg-deep" size={20} />
                     </div>
                     <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', fontWeight: 700, letterSpacing: '-0.01em' }}>Sovereign Briefing</h3>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Current Intelligence Status for {myData.name}</p>
                     </div>
                  </div>
                  <div className="stack-sm" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                     {[
                        { title: 'PO ACKNOWLEDGEMENT PENDING', desc: 'PO-008, PO-009 requiring verification.', type: 'critical' },
                        { title: 'VAULT EXPIRY NOTICE', desc: 'ISO 9001 Certificate expires in 12 days.', type: 'info' },
                        { title: 'INBOUND SECURE MESSAGE', desc: 'Feedback on Proposal Q-2026-003.', type: 'message' }
                     ].map((alert, i) => (
                        <div key={i} className="flex items-center gap-12 p-10" style={{ borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                           <div style={{ width: 6, height: 6, borderRadius: '50%', background: alert.type === 'critical' ? 'var(--accent-amber)' : 'var(--accent-slate)' }} />
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: alert.type === 'critical' ? 'var(--accent-amber)' : 'var(--text-primary)', letterSpacing: '0.03em' }}>{alert.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.desc}</div>
                           </div>
                           <ChevronRight size={14} className="text-faint" />
                        </div>
                     ))}
                  </div>
               </div>

               {/* Analytics Dashboard */}
               <div className="metric-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div className="flex justify-between items-center mb-16">
                     <h3 style={{ margin: 0, fontSize: 13, fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>PERFORMANCE RADAR</h3>
                     <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => setActiveTab('performance')}>DETAILED SCORECARD</button>
                  </div>
                  <div style={{ height: 160 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={myData.kpiHistory?.slice(-6)}>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                           <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={9} tickLine={false} axisLine={false} />
                           <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)', borderRadius: 10 }} />
                           <Bar dataKey="delivery" fill="var(--accent-slate)" radius={[3, 3, 0, 0]} barSize={20}>
                              {myData.kpiHistory?.slice(-6).map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.delivery > 95 ? 'var(--accent-slate)' : 'rgba(177,202,215,0.3)'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="grid grid-3" style={{ gap: 'var(--gap-standard)' }}>
               <div className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>LATEST PROCUREMENT</div>
                  <div className="font-mono text-lg" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{myPOs[0]?.id || 'N/A'}</div>
                  <div className="flex justify-between items-center mt-8">
                     <span className="badge" style={{ background: 'rgba(177,202,215,0.1)', color: 'var(--accent-slate)', fontSize: 10 }}>{myPOs[0]?.deliveryStatus || 'Pending'}</span>
                     <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{myPOs[0]?.dateOfIssue}</span>
                  </div>
               </div>
               <div className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>ACTIVE BIDS</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{myBids.filter(b => b.status === 'Pending' || b.status === 'Evaluated').length} ACTIVE PROPOSALS</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                     <div style={{ width: '65%', height: '100%', background: 'var(--gradient-primary)' }} />
                  </div>
               </div>
               <div className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>ENTITY COMPLIANCE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{complianceDocs.filter(d => d.status === 'Active').length} / {complianceDocs.length} VAULT ITEMS</div>
                  <div style={{ fontSize: 11, color: 'var(--accent-slate)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontWeight: 700 }}>
                     <CheckCircle2 size={12} /> VERIFIED COMPLIANCE
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PURCHASE ORDERS TAB */}
        {activeTab === 'pos' && (
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid grid-4" style={{ gap: 'var(--gap-standard)' }}>
              {[
                { label: 'ACK PENDING', value: myPOs.filter(p => !p.acknowledgedAt).length, icon: <Clock size={16} />, color: 'var(--accent-amber)', trend: 'Immediate Action' },
                { label: 'PRODUCTION', value: myPOs.filter(p => p.deliveryStatus === 'Approved').length, icon: <Activity size={16} />, color: 'var(--accent-slate)', trend: 'Active Logic' },
                { label: 'IN TRANSIT', value: myPOs.filter(p => p.deliveryStatus === 'Shipped').length, icon: <Globe size={16} />, color: 'var(--accent-slate)', trend: 'Global Log' },
                { label: 'FULFILLED', value: myPOs.filter(p => p.deliveryStatus === 'Delivered').length, icon: <CheckCircle2 size={16} />, color: 'var(--accent-slate)', trend: 'Archive' },
              ].map((m, i) => (
                <div key={i} className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div className="flex justify-between items-center">
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label}</div>
                    <div style={{ color: m.color }}>{m.icon}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700, opacity: 0.8 }}>{m.trend}</div>
                </div>
              ))}
            </div>

            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
              <div className="flex justify-between items-center p-20" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                <div className="flex items-center gap-12">
                   <Package className="text-slate" size={18} />
                   <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Procurement Ledger</h3>
                </div>
                <div className="search-box-minimal" style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-subtle)' }}>
                  <Search size={14} className="text-faint" />
                  <input 
                    type="text" 
                    placeholder="Filter Registry..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: 180 }}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LEDGER ID</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DATE</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FISCAL VALUE</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TARGET DATE</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INTEL STATUS</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SHIPPING</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONTROL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPOs.filter(po => po.id.toLowerCase().includes(searchTerm.toLowerCase())).map(po => (
                      <tr key={po.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{po.id}</td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{po.dateOfIssue}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700 }}>${po.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{po.expectedDeliveryDate}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge" style={{ 
                            background: po.deliveryStatus === 'Delivered' ? 'rgba(177,202,215,0.08)' : 'rgba(233,193,118,0.05)', 
                            color: po.deliveryStatus === 'Delivered' ? 'var(--accent-slate)' : 'var(--accent-amber)',
                            fontSize: 10,
                            fontWeight: 800
                          }}>
                            {po.deliveryStatus.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 11, color: 'var(--text-muted)' }}>
                          {po.trackingNumber ? (
                            <div className="flex items-center gap-4">
                              <Globe size={12} className="text-slate" /> {po.carrier}
                            </div>
                          ) : <span style={{ opacity: 0.5 }}>Pending Logistic Hub</span>}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div className="flex justify-end gap-6">
                            <button className="btn btn-ghost" style={{ padding: 4 }} title="Download PDF"><Download size={14} /></button>
                            {!po.acknowledgedAt && (
                              <button className="btn btn-primary" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => acknowledgePO(po.id)}>ACKNOWLEDGE</button>
                            )}
                            {po.deliveryStatus === 'Approved' && po.acknowledgedAt && (
                              <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => { setSelectedPOId(po.id); setModalOpen('confirmShipment'); }}>DISPATCH</button>
                            )}
                            {['Shipped', 'Partially Delivered'].includes(po.deliveryStatus) && (
                              <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => { setSelectedPOId(po.id); setModalOpen('notifyDelivery'); }}>LOG DELIVERY</button>
                            )}
                            {['Shipped', 'Partially Delivered', 'Delivered'].includes(po.deliveryStatus) && (
                              <button className="btn btn-primary" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => { setSelectedPOId(po.id); setModalOpen('submitInvoice'); }}>INVOICE</button>
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
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid grid-4" style={{ gap: 'var(--gap-standard)' }}>
              {[
                { label: 'ANALYTIC SCORE', value: `${myData.kpis.deliveryPerformance}%`, icon: <BarChart3 size={16} />, color: 'var(--accent-slate)', trend: 'Benchmark: 92%' },
                { label: 'MARKET POSITION', value: '#12 / 450', icon: <TrendingUp size={16} />, color: 'var(--accent-slate)', trend: '+3 positions' },
                { label: 'YOY GROWTH', value: '+4.2%', icon: <Activity size={16} />, color: 'var(--accent-slate)', trend: 'Calculated Logic' },
                { label: 'RISK FACTOR', value: `${myData.kpis.rejectionRate}%`, icon: <ShieldCheck size={16} />, color: 'var(--accent-amber)', trend: 'Actionable Delta' },
              ].map((m, i) => (
                <div key={i} className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="flex justify-between items-center text-xs" style={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    {m.label}
                    <div style={{ color: m.color }}>{m.icon}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700, opacity: 0.8 }}>{m.trend}</div>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginBottom: 16 }}>
               <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Strategic Intelligence Radar</h3>
               <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Long-term fulfillment and quality metrics derived from historical ledger data.</p>
            </div>

            <div className="grid grid-2" style={{ gap: 'var(--gap-standard)' }}>
              <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '20px' }}>
                <div className="flex justify-between items-center mb-16">
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>HISTORICAL FULFILLMENT</h3>
                  <div className="badge" style={{ background: 'rgba(177,202,215,0.05)', fontSize: 9 }}>UNIT: ON-TIME %</div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={myData.kpiHistory}>
                      <defs>
                        <linearGradient id="colorPerfTab" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-slate)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent-slate)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis domain={[80, 100]} stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)', borderRadius: 10 }} />
                      <Area type="monotone" dataKey="delivery" stroke="var(--accent-slate)" strokeWidth={3} fillOpacity={1} fill="url(#colorPerfTab)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '20px' }}>
                <div className="flex justify-between items-center mb-16">
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>REJECTION ANALYTICS</h3>
                  <div className="badge" style={{ background: 'rgba(233,193,118,0.05)', color: 'var(--accent-amber)', fontSize: 9 }}>STATUS: ANOMALY TRACKING</div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={myData.kpiHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)', borderRadius: 10 }} />
                      <Line type="monotone" dataKey="rejection" stroke="var(--accent-amber)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-amber)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '24px' }}>
              <div className="flex flex-col gap-4 mb-20">
                <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Sovereign Preferred Criteria</h3>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Target thresholds required to maintain Intellectual Supply Partner status.</p>
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--gap-standard)' }}>
                {myData.preferredStatusCriteria?.map((c, i) => (
                  <div key={i} className="kpi-target-row" style={{ 
                    display: 'flex', alignItems: 'center', gap: 16, 
                    padding: '16px', borderRadius: 'var(--radius-standard)', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {c.met ? <CheckCircle2 className="text-slate" size={20} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px dashed var(--border-subtle)' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c.met ? 'var(--text-primary)' : 'var(--text-muted)' }}>{c.criterion.toUpperCase()}</div>
                      <div className="progress-bar-container" style={{ margin: '8px 0', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div className="progress-bar-fill" style={{ width: c.met ? '100%' : '65%', background: c.met ? 'var(--gradient-primary)' : 'var(--accent-amber)' }} />
                      </div>
                    </div>
                    <span className="badge" style={{ fontSize: 9, background: c.met ? 'rgba(177,202,215,0.1)' : 'rgba(233,193,118,0.05)', color: c.met ? 'var(--accent-slate)' : 'var(--accent-amber)', fontWeight: 800 }}>{c.met ? 'VALID' : 'PENDING'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid grid-4" style={{ gap: 'var(--gap-standard)' }}>
              {[
                { label: 'OUTSTANDING FISCAL', value: `$${totalOutstanding.toLocaleString()}`, icon: <DollarSign size={18} />, color: 'var(--accent-amber)', trend: 'Actionable Balance' },
                { label: 'SETTLED TO DATE', value: `$${releasedPayments.toLocaleString()}`, icon: <CreditCard size={18} />, color: 'var(--accent-slate)', trend: 'Released Funds' },
                { label: 'SETTLEMENT CYCLE', value: `${avgPayCycle} DAYS`, icon: <Clock size={18} />, color: 'var(--accent-slate)', trend: 'Operational Velocity' },
                { label: 'LIQUIDITY RESERVE', value: '$500,000', icon: <Landmark size={18} />, color: 'var(--accent-slate)', trend: 'Locked Logic' },
              ].map((m, i) => (
                <div key={i} className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div className="flex justify-between items-center text-xs" style={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    {m.label}
                    <div style={{ color: m.color }}>{m.icon}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700, opacity: 0.8 }}>{m.trend}</div>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginBottom: 16 }}>
               <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Financial Settlement Hub</h3>
               <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Real-time statement of account and dynamic liquidity management.</p>
            </div>

            <div className="grid grid-2" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 'var(--gap-standard)' }}>
              <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
                <div className="flex justify-between items-center p-20" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Statement of Account</h3>
                  <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }}><Download size={12} /> EXPORT LEDGER</button>
                </div>
                <div className="table-responsive">
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DATE</th>
                        <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REFERENCE</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DEBIT</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CREDIT</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myInvoices.map((inv, i) => (
                        <tr key={inv.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 20px', fontSize: 12 }}>{inv.date}</td>
                          <td style={{ padding: '14px 20px', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 12, color: 'var(--accent-amber)', opacity: 0.5 }}>—</td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 12, color: 'var(--accent-slate)', fontWeight: 700 }}>${inv.totalAmount.toLocaleString()}</td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 12, fontWeight: 800 }}>
                            ${(totalOutstanding + releasedPayments - (i * 2000)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '24px' }}>
                <div className="flex justify-between items-center mb-20">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Liquidity Optimization</h3>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Accelerate cash flow via dynamic discounting.</p>
                  </div>
                  <TrendingUp className="text-slate" size={20} />
                </div>
                <div className="stack-sm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {invoices.filter(inv => inv.supplierId === mySupplierId && inv.matchStatus === 'Full Match').map(inv => (
                    <div key={inv.id} className="payment-offer-card" style={{ 
                      padding: '16px', borderRadius: 'var(--radius-standard)', 
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color 0.2s'
                    }}>
                      <div className="flex justify-between items-center mb-12">
                        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>{inv.invoiceNumber}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-slate)' }}>${inv.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TARGET MATURITY: {inv.dueDate}</div>
                        <button className="btn btn-primary" style={{ fontSize: 10, padding: '4px 10px' }} onClick={() => { setSelectedPOId(inv.id); setModalOpen('earlyPayment'); }}>
                          WITHDRAW NOW
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
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="section-header mb-0">
               <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Collaboration Hub</h3>
               <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Secure communication protocol for real-time procurement negotiation.</p>
            </div>
            
            <div className="metric-card" style={{ padding: 0, height: 600, display: 'flex', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
              <div className="chat-sidebar" style={{ width: 280, borderRight: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TACTICAL THREADS</h4>
                </div>
                <div className="chat-threads-list" style={{ overflowY: 'auto', height: 'calc(600px - 60px)' }}>
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
                        padding: '20px', cursor: 'pointer', 
                        background: thread.active ? 'rgba(177,202,215,0.04)' : 'transparent',
                        borderLeft: thread.active ? '3px solid var(--accent-slate)' : '3px solid transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.02)'
                      }}
                    >
                      <div className="flex justify-between mb-4">
                        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-slate)' }}>{thread.id}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>{thread.time || 'NOW'}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{thread.title.toUpperCase()}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{thread.type.toUpperCase()} · UPDATED</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="chat-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between' }}>
                  <div className="flex items-center gap-12">
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                       <User size={18} className="text-slate" />
                     </div>
                     <div>
                       <div style={{ fontSize: 13, fontWeight: 800 }}>PROCUREMENT INTEL TEAM</div>
                       <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>VERIFIED COMMAND CENTER · ONLINE</div>
                     </div>
                  </div>
                </div>
                <div className="chat-messages" style={{ flex: 1, padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div className="text-center p-32 opacity-20 mt-40">
                      <Lock size={48} className="mx-auto mb-16" />
                      <p style={{ fontSize: 12, fontWeight: 700 }}>SELECT THREAD TO INITIALIZE ENCRYPTED UPLINK</p>
                   </div>
                </div>
                <div className="chat-input-area" style={{ padding: 24, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16 }}>
                  <input 
                    type="text" 
                    placeholder="ENTER PROTOCOL MESSAGE..." 
                    style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0 16px', fontSize: 12, outline: 'none', color: '#fff', fontWeight: 600 }}
                  />
                  <button className="btn btn-primary" style={{ padding: '0 20px' }}><Send size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid grid-4" style={{ gap: 'var(--gap-standard)' }}>
              {[
                { label: 'VALID VAULT ITEMS', value: complianceDocs.filter(d => d.status === 'Active').length, icon: <ShieldCheck size={16} />, color: 'var(--accent-slate)', trend: 'Verified' },
                { label: 'EXPIRY ALERTS', value: complianceDocs.filter(d => d.status === 'Expiring Soon').length, icon: <Clock size={16} />, color: 'var(--accent-amber)', trend: 'Action Required' },
                { label: 'CRITICAL VOIDS', value: complianceDocs.filter(d => d.status === 'Expired').length, icon: <AlertTriangle size={16} />, color: 'var(--accent-amber)', trend: 'Immediate Delta' },
                { label: 'TRUST RATING', value: '100.00%', icon: <Activity size={16} />, color: 'var(--accent-slate)', trend: 'Calculated Logic' },
              ].map((m, i) => (
                <div key={i} className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="flex justify-between items-center text-xs" style={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    {m.label}
                    <div style={{ color: m.color }}>{m.icon}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700, opacity: 0.8 }}>{m.trend}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
               <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Document Governance & Compliance</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Managed registry of ISO certificates, licenses, and legal instrumentation.</p>
               </div>
               <button className="btn btn-primary" onClick={() => setModalOpen('uploadCompliance')}>
                  <Upload size={14} /> INITIALIZE UPLOAD
               </button>
            </div>
            
            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DOCUMENT TITLE</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CATEGORY</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MATURITY DATE</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INTEL STATUS</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONTROL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceDocs.map(doc => (
                      <tr key={doc.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div className="flex items-center gap-12">
                             <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheck size={16} className="text-slate" />
                             </div>
                             <span style={{ fontSize: 13, fontWeight: 700 }}>{doc.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{doc.category.toUpperCase()}</td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: doc.status === 'Expired' ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: doc.status === 'Expired' ? 700 : 400 }}>{doc.expiryDate}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge" style={{ 
                            background: doc.status === 'Active' ? 'rgba(177,202,215,0.1)' : 'rgba(233,193,118,0.05)', 
                            color: doc.status === 'Active' ? 'var(--accent-slate)' : 'var(--accent-amber)',
                            fontSize: 10,
                            fontWeight: 800
                          }}>
                            {doc.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                           <button className="btn btn-ghost" style={{ padding: 6 }}><Download size={14} /></button>
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
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid grid-4" style={{ gap: 'var(--gap-standard)' }}>
              {[
                { label: 'GLOBAL OPPORTUNITIES', value: eligibleRFQs.length, icon: <Globe size={18} />, color: 'var(--accent-slate)', trend: 'Live Tenders' },
                { label: 'ACTIVE SUBMISSIONS', value: myBids.length, icon: <Send size={18} />, color: 'var(--accent-slate)', trend: 'In Review' },
                { label: 'TENDER LOSS DELTA', value: myBids.filter(b => b.status === 'Rejected').length, icon: <ShieldCheck size={18} />, color: 'var(--accent-amber)', trend: 'Benchmark: 12%' },
                { label: 'AWARDS SECURED', value: myBids.filter(b => b.status === 'Awarded').length, icon: <Award size={18} />, color: 'var(--accent-slate)', trend: 'Fiscal Capture' },
              ].map((m, i) => (
                <div key={i} className="metric-card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div className="flex justify-between items-center text-xs" style={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    {m.label}
                    <div style={{ color: m.color }}>{m.icon}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700, opacity: 0.8 }}>{m.trend}</div>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginBottom: 16 }}>
               <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Strategic Sourcing & Quotations</h3>
               <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Discovery Hub for active procurements and proposal tracking.</p>
            </div>

            <div className="grid grid-2" style={{ gap: 'var(--gap-standard)' }}>
              <div className="stack-md" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="flex items-center gap-8 mb-4">
                   <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TENDER DISCOVERY</h4>
                </div>
                {eligibleRFQs.length > 0 ? eligibleRFQs.map(rfq => (
                  <div key={rfq.id} className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '20px', transition: 'border-color 0.2s' }}>
                    <div className="flex justify-between items-start mb-12">
                       <span className="badge" style={{ background: 'rgba(177,202,215,0.08)', color: 'var(--accent-slate)', fontSize: 9 }}>{rfq.tenderType?.toUpperCase() || 'RFQ'}</span>
                       <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'Inter, sans-serif' }}>{rfq.id}</span>
                    </div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>{rfq.title}</h4>
                    <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{rfq.notes}</p>
                    <div className="flex gap-20 mb-20 pt-16" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                       <div>
                          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>DEADLINE</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-amber)' }}>{rfq.bidDeadline}</div>
                       </div>
                       <div>
                          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>SCOPE</div>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>{rfq.lineItems.length} GROUPS</div>
                       </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', fontSize: 11 }} onClick={() => { setSelectedRFQId(rfq.id); setModalOpen('bidSubmission'); }}>INITIALIZE PROPOSAL</button>
                  </div>
                )) : (
                  <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '40px', textAlign: 'center', opacity: 0.6 }}>
                     <Search size={24} className="mx-auto mb-12 text-muted" />
                     <div style={{ fontSize: 11, fontWeight: 700 }}>No active tenders discovered for your entity profile.</div>
                  </div>
                )}
              </div>

              <div className="stack-md" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="flex items-center gap-8 mb-4">
                   <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SUBMISSION REGISTRY</h4>
                </div>
                <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
                  <div className="table-responsive">
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PROPOSAL</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INTEL SCORE</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STATUS</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONTROL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myBids.map(bid => (
                          <tr key={bid.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{bid.id}</td>
                            <td style={{ padding: '12px 16px' }}>
                               {bid.evaluation ? <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-slate)' }}>{bid.evaluation.totalScore}</span> : <span style={{ opacity: 0.5 }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                               <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', fontSize: 9 }}>{bid.status.toUpperCase()}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                               <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setActiveTab('communication')}><MessageSquare size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT LIBRARY TAB */}
        {activeTab === 'product-library' && (
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Visual Product Showcase */}
            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '24px' }}>
              <div className="flex justify-between items-center mb-24">
                <div>
                   <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Product Portfolio</h3>
                   <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Intellectual property and technical specifications registry ({products.length} units listed).</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
                  <Plus size={14} /> INITIALIZE UNIT
                </button>
              </div>
              <div className="grid grid-3" style={{ gap: 'var(--gap-standard)' }}>
                {products.map(product => (
                  <div key={product.id} className="product-card-premium" style={{ 
                    padding: '16px', borderRadius: 'var(--radius-standard)', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)', transition: 'border-color 0.2s'
                  }}>
                    <div style={{ width: '100%', height: 110, borderRadius: 10, background: 'var(--bg-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={32} style={{ color: 'var(--accent-slate)', opacity: 0.2 }} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-slate)', marginBottom: 2, letterSpacing: '0.05em' }}>{product.category.toUpperCase()}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>{product.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>{product.sku}</div>
                    <div className="flex justify-between items-center pt-12" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>${product.basePrice.toLocaleString()} <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 400 }}>/{product.unit.toUpperCase()}</span></span>
                      <button className="btn btn-ghost" style={{ padding: 4 }}><ExternalLink size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
              <div className="flex justify-between items-center p-20" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Technical Resource Vault</h3>
                <div className="search-box-minimal" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={12} className="text-faint" />
                  <input 
                    type="text" 
                    placeholder="Filter resources..." 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>RESOURCE NAME</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CLASSIFICATION</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MATURITY</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INTEL STATUS</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONTROL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceDocs
                      .filter(doc => doc.supplierId === mySupplierId && 
                        ['Product Catalogue', 'Product Certificate', 'Technical Datasheet', 'ISO Certification'].includes(doc.category) &&
                        (doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.category.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map(doc => (
                        <tr key={doc.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div className="flex items-center gap-10">
                              <FileText size={16} className="text-slate" />
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{doc.title}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{doc.category.toUpperCase()}</td>
                          <td style={{ padding: '14px 20px', fontSize: 12 }}>{doc.expiryDate}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="badge" style={{ background: 'rgba(177,202,215,0.08)', color: 'var(--accent-slate)', fontSize: 9 }}>{doc.status.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button className="btn btn-ghost" style={{ padding: 4 }}><Download size={14} /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* ACCOUNT & PROFILE TAB */}
        {activeTab === 'account' && (
          <div className="stack-lg animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Profile Header */}
            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '32px', display: 'flex', alignItems: 'center', gap: 32 }}>
              <div 
                style={{ 
                  width: 90, 
                  height: 90, 
                  borderRadius: 20, 
                  background: myData.logo ? 'none' : 'var(--gradient-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#000',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {myData.logo ? (
                  <img src={myData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : myData.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-12 mb-8">
                  <h2 style={{ margin: 0, fontSize: 24, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>{myData.name.toUpperCase()}</h2>
                  <div className="badge" style={{ background: 'rgba(177,202,215,0.1)', color: 'var(--accent-slate)', fontSize: 9, fontWeight: 800 }}>
                    <ShieldCheck size={12} /> VERIFIED PARTNER
                  </div>
                </div>
                <div className="flex gap-20 text-xs" style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
                  <div className="flex items-center gap-6"><Globe size={14} /> CLASSIFICATION: GLOBAL</div>
                  <div className="flex items-center gap-6"><Mail size={14} /> {myData.contactList?.[0]?.email || 'SECURE@PORTAL.COM'}</div>
                  <div className="flex items-center gap-6"><Award size={14} /> SOVEREIGN PREFERRED</div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setShowEditProfile(true)}><Edit2 size={14} /> EDIT DOSSIER</button>
            </div>

            <div className="grid grid-2" style={{ gap: 'var(--gap-standard)' }}>
              {/* Business Dossier */}
              <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
                <div className="p-20" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BUSINESS DOSSIER</h3>
                </div>
                <div className="p-24 grid grid-2" style={{ gap: 20 }}>
                  <div className="form-group-minimal">
                    <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 6, display: 'block' }}>TAX REGISTRATION</label>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{myData.taxRegNumber}</div>
                  </div>
                  <div className="form-group-minimal">
                    <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 6, display: 'block' }}>LEGAL ENTITY TYPE</label>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>JOINT STOCK COMPANY</div>
                  </div>
                  <div className="form-group-minimal">
                    <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 6, display: 'block' }}>ALIGNED REGION</label>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{myData.location}</div>
                  </div>
                  <div className="form-group-minimal">
                    <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 6, display: 'block' }}>REGISTERED FACILITY</label>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{myData.address}</div>
                  </div>
                </div>
              </div>

              {/* Settlement & Banking */}
              <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
                <div className="p-20" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SETTLEMENT PROTOCOL</h3>
                </div>
                <div className="p-24">
                   <div style={{ background: 'rgba(233,193,118,0.05)', borderRadius: 12, padding: 16, border: '1px solid rgba(233,193,118,0.1)', marginBottom: 20 }}>
                      <div className="flex items-center gap-12">
                         <DollarSign size={20} style={{ color: 'var(--accent-amber)' }} />
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 800 }}>NET 30 SETTLEMENT</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Maturity from Invoice Authorization</div>
                         </div>
                         <button className="btn btn-ghost" style={{ fontSize: 9, color: 'var(--accent-amber)' }}>REVIEW POLICY</button>
                      </div>
                   </div>
                   <div className="grid grid-2" style={{ gap: 20 }}>
                    <div className="form-group-minimal">
                      <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 6, display: 'block' }}>RECEIVING INSTITUTION</label>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{myData.bankInfo?.bankName || 'GLOBAL MERCHANT BANK'}</div>
                    </div>
                    <div className="form-group-minimal">
                      <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 6, display: 'block' }}>ACCOUNT TRAILING</label>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>**** {myData.bankInfo?.accountNo?.slice(-4) || '8842'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Hub */}
            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: '24px', display: 'flex', alignItems: 'center', gap: 24 }}>
               <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-slate)', border: '1px solid var(--border-subtle)' }}>
                  <Lock size={24} />
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>PRIVACY & ACCESS CENTER</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Encryption protocols active. Last credential rotation: 3 months ago.</div>
               </div>
               <button className="btn btn-ghost" style={{ fontSize: 11, fontWeight: 800 }} onClick={() => setShowChangePassword(true)}>
                  ROTATE CREDENTIALS
               </button>
            </div>

            {/* Personnel Registry */}
            <div className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', padding: 0, overflow: 'hidden' }}>
               <div className="p-20 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AUTHORIZED PERSONNEL</h3>
                  <button className="btn btn-ghost" style={{ fontSize: 10 }}><UserPlus size={12} /> ADD PROXY</button>
               </div>
               <div className="p-16">
                  <div className="grid grid-3" style={{ gap: 'var(--gap-standard)' }}>
                     {(myData.contactList || [
                        { id: '1', name: 'John Smith', role: 'Sales Director', email: 'john@portal.com' },
                        { id: '2', name: 'Alina K.', role: 'Account Manager', email: 'alina@portal.com' },
                        { id: '3', name: 'Vince T.', role: 'Operations', email: 'vince@portal.com' }
                     ]).map((contact, i) => (
                        <div key={i} className="metric-card" style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border-subtle)' }}>
                           <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--accent-slate)' }}>
                              {contact.name[0]}
                           </div>
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 800 }}>{contact.name.toUpperCase()}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{contact.role.toUpperCase()}</div>
                           </div>
                           <button className="btn btn-ghost" style={{ padding: 4 }}><Mail size={12} /></button>
                        </div>
                     ))}
                  </div>
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
        .form-group-minimal label {
          display: block;
          font-size: 9px;
          font-weight: 800;
          color: var(--text-faint);
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }
        .form-group-minimal input {
          width: 100%;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          padding: 12px 16px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          font-weight: 600;
        }
        .form-group-minimal input:focus {
          border-color: var(--accent-slate);
        }
      `}</style>
      {/* Standalone Logout Button */}
      {standalone && (
        <button 
          onClick={() => {
            supplierLogout();
            router.push('/');
          }}
          className="flex items-center gap-10 hover-row" 
          style={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32, 
            zIndex: 1000,
            padding: '12px 24px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 12,
            color: '#f87171',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: 'Manrope, sans-serif'
          }}
        >
          <Lock size={16} /> LOGOUT VENDOR TERMINAL
        </button>
      )}

      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div></div>
  );
}

// ── Add Product Wizard ──
function AddProductModal({ onClose }: { onClose: () => void }) {
  const { addProduct, uploadComplianceDoc, mySupplierId } = useApp() as any;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'Piping', description: '',
    basePrice: 0, unit: 'Piece', currency: 'USD',
    catalogueName: ''
  });

  const handleSubmit = () => {
    // 1. Add Product
    addProduct({
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      description: formData.description,
      basePrice: Number(formData.basePrice),
      unit: formData.unit,
      currency: formData.currency,
      technicalDocs: formData.catalogueName ? [`DOC-${Date.now()}`] : [],
      certifications: []
    });

    // 2. Mock Catalogue Upload
    if (formData.catalogueName) {
      uploadComplianceDoc({
        supplierId: mySupplierId,
        title: formData.catalogueName,
        category: 'Product Catalogue',
        expiryDate: '2027-12-31',
        fileSize: '2.4 MB'
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.8)' }}>
      <div className="modal" style={{ maxWidth: 500, width: '95%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>LIST NEW PRODUCT UNIT</h3>
          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onClose}><X size={18} /></button>
        </div>
        
        <div style={{ padding: 32 }}>
          {/* Progress Indicator */}
          <div className="flex gap-8 mb-32">
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? 'var(--accent-slate)' : 'rgba(255,255,255,0.05)', boxShadow: step >= s ? '0 0 10px rgba(177,202,215,0.3)' : 'none' }} />
            ))}
          </div>

          {step === 1 && (
            <div className="stack-md" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group-minimal">
                <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 8, display: 'block' }}>PRODUCT NOMENCLATURE</label>
                <input 
                  placeholder="E.G. HIGH PRESSURE REGULATOR" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600 }}
                />
              </div>
              <div className="grid grid-2" style={{ gap: 16 }}>
                <div className="form-group-minimal">
                  <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 8, display: 'block' }}>MODEL / SKU</label>
                  <input 
                    placeholder="SKU-88-ALPHA" 
                    value={formData.sku} 
                    onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600 }}
                  />
                </div>
                <div className="form-group-minimal">
                  <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 8, display: 'block' }}>CLASSIFICATION</label>
                  <select 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600 }}
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Piping">PIPING</option>
                    <option value="Valves">VALVES</option>
                    <option value="Fittings">FITTINGS</option>
                    <option value="Electrical">ELECTRICAL</option>
                  </select>
                </div>
              </div>
              <div className="form-group-minimal">
                <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 8, display: 'block' }}>TECHNICAL COMPREHENSION</label>
                <textarea 
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', outline: 'none', fontSize: 13, fontWeight: 600 }}
                  placeholder="SPECIFICATIONS AND PARAMETERS..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="stack-md" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="grid grid-2" style={{ gap: 16 }}>
                <div className="form-group-minimal">
                  <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 8, display: 'block' }}>BASE FISCAL PRICE</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.basePrice} 
                    onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})} 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600 }}
                  />
                </div>
                <div className="form-group-minimal">
                  <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 8, display: 'block' }}>CURRENCY</label>
                  <input 
                    value={formData.currency} 
                    readOnly 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13, outline: 'none', fontWeight: 600 }}
                  />
                </div>
              </div>
              <div className="form-group-minimal">
                <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 8, display: 'block' }}>SETTLEMENT UNIT</label>
                <input 
                  placeholder="E.G. METRIC TON, UNIT, METER" 
                  value={formData.unit} 
                  onChange={e => setFormData({...formData, unit: e.target.value.toUpperCase()})} 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600 }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="stack-md" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ padding: '40px 24px', border: '1px dashed var(--border-subtle)', borderRadius: 16, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <Upload size={32} style={{ color: 'var(--accent-slate)', opacity: 0.3, margin: '0 auto 16px' }} />
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>TECHNICAL CATALOGUE (PDF)</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 20 }}>SYSTEM UPLINK AUTHORIZED</div>
                <input 
                   placeholder="CATALOGUE_RESOURCES_V1.PDF" 
                   value={formData.catalogueName} 
                   onChange={e => setFormData({...formData, catalogueName: e.target.value.toUpperCase()})}
                   style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 8, color: '#fff', fontSize: 11, width: '100%', fontWeight: 700, textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16, padding: 16, background: 'rgba(177,202,215,0.03)', borderRadius: 12, border: '1px solid rgba(177,202,215,0.1)' }}>
                <ShieldCheck size={20} style={{ color: 'var(--accent-slate)' }} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 600 }}>SYSTEM NOTICE: ALL ASSETS ARE SUBJECT TO ENCRYPTION AND PROCUREMENT OVERSIGHT REVIEW PRIOR TO VISIBILITY.</div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-40">
            {step > 1 ? (
              <button className="btn btn-ghost" style={{ fontSize: 11, fontWeight: 800 }} onClick={() => setStep(step - 1)}>PREVIOUS PHASE</button>
            ) : <div />}
            
            {step < 3 ? (
              <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={() => setStep(step + 1)}>NEXT PHASE</button>
            ) : (
              <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={handleSubmit}>PUBLISH TO PORTFOLIO</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { myData, updateSupplierProfile } = useApp() as any;
  const [formData, setFormData] = useState({
    name: myData?.name || '',
    email: myData?.email || '',
    location: myData?.location || '',
    address: myData?.address || '',
    logo: myData?.logo || ''
  });

  const handleSubmit = () => {
    updateSupplierProfile(myData.id, formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.8)' }}>
      <div className="modal" style={{ maxWidth: 500, width: '95%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>AMEND ENTITY DOSSIER</h3>
          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 32 }} className="stack-md">
          <div className="form-group-minimal">
            <label>LEGAL ENTITY NAME</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
          </div>
          <div className="form-group-minimal">
            <label>BRAND ASSET / LOGO IDENTIFIER (URL)</label>
            <input placeholder="HTTPS://CERTIFIED-RESOURCES.COM/LOGO.PNG" value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} />
            <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 8, fontWeight: 600 }}>PROVIDE HIGH-RESOLUTION TRANSPARENT IDENTIFIER.</p>
          </div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="form-group-minimal">
              <label>PRIMARY CONTACT UPLINK</label>
              <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group-minimal">
              <label>HQ JURISDICTION</label>
              <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value.toUpperCase()})} />
            </div>
          </div>
          <div className="form-group-minimal">
            <label>REGISTERED OPERATIONS ADDRESS</label>
            <textarea 
              rows={2}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', outline: 'none', fontSize: 13, fontWeight: 600 }}
              value={formData.address} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
            />
          </div>
          <div className="flex justify-end mt-24">
            <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={handleSubmit}>COMMIT CHANGES</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { myData, updateSupplierProfile } = useApp() as any;
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = () => {
    if (currentPass !== myData.passwordHash) {
      setError('AUTHENTICATION FAILED: CURRENT PASSCODE INCORRECT');
      return;
    }
    if (newPass !== confirmPass) {
      setError('PROTOCOL ERROR: PASSCODES DO NOT ALIGN');
      return;
    }
    if (newPass.length < 6) {
      setError('SECURITY POLICY: PASSCODE MUST EXCEED 6 CHARACTERS');
      return;
    }

    updateSupplierProfile(myData.id, { passwordHash: newPass });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.8)' }}>
      <div className="modal" style={{ maxWidth: 450, width: '95%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>CREDENTIAL ROTATION</h3>
          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 32 }} className="stack-md">
          {error && <div style={{ padding: 12, fontSize: 10, textAlign: 'center', color: 'var(--accent-amber)', background: 'rgba(233,193,118,0.05)', border: '1px solid rgba(233,193,118,0.1)', borderRadius: 8, marginBottom: 16, fontWeight: 800 }}>{error}</div>}
          <div className="form-group-minimal">
            <label>CURRENT AUTHORIZATION PASSCODE</label>
            <input type="password" value={currentPass} onChange={e => { setCurrentPass(e.target.value); setError(''); }} />
          </div>
          <div className="form-group-minimal" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24, marginTop: 12 }}>
            <label>NEW SECURITY PASSCODE</label>
            <input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setError(''); }} />
          </div>
          <div className="form-group-minimal">
            <label>CONFIRM NEW PASSCODE</label>
            <input type="password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(''); }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 24, fontSize: 11 }} onClick={handleUpdate}>AUTHORIZE ROTATION</button>
        </div>
      </div>
    </div>
  );
}
