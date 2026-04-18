'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Building2, FileText, Send, Clock, CheckCircle2,
  AlertTriangle, Download, Upload, ExternalLink,
  DollarSign, Package, ShieldCheck, MessageSquare,
  Search, ChevronRight, BarChart3, Plus, TrendingUp, TrendingDown,
  UserPlus, Settings, CreditCard, FileBarChart, Activity, User,
  Globe, Landmark, Lock, X, Award, Mail, Edit2, Bell, Star
} from 'lucide-react';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell
} from 'recharts';

import { PortalTab } from '@/types';

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthScoreRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 90 ? '#4ade80' : score >= 75 ? '#60a5fa' : '#f59e0b';
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', lineHeight: 1
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color }}>{score}</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.05em' }}>SCORE</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const getStyles = () => {
    switch (status) {
      case 'Released':
      case 'Active':
      case 'Approved':
      case 'Awarded':
        return { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.15)' };
      case 'Pending Ack':
      case 'Expiring Soon':
      case 'Processing':
      case 'In Review':
        return { bg: 'rgba(233,193,118,0.08)', color: 'var(--accent-amber)', border: 'rgba(233,193,118,0.15)' };
      case 'Expired':
      case 'Rejected':
      case 'Overdue':
      case 'QC Variance':
        return { bg: 'rgba(248,113,113,0.08)', color: '#f87171', border: 'rgba(248,113,113,0.15)' };
      case 'Draft':
      case 'Under Evaluation':
        return { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: 'var(--border-subtle)' };
      default:
        return { bg: 'rgba(177,202,215,0.08)', color: 'var(--accent-slate)', border: 'rgba(177,202,215,0.15)' };
    }
  };
  const { bg, color, border } = getStyles();
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`,
      letterSpacing: '0.02em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center'
    }}>
      {status}
    </span>
  );
}

function AlertBadge({ count, label, color }: { count: number, label: string, color: string }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0'
    }}>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'Manrope, sans-serif' }}>{count}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>{label.toUpperCase()}</div>
    </div>
  );
}

function ProgressBar({ value, label, total }: { value: number, label: string, total: number }) {
  const pct = Math.min((value / total) * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 10, fontWeight: 700 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span>{value}/{total}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-slate)', borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SupplierPortalPage({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const {
    currentSupplier, purchaseOrders, rfqs, quotations, invoices,
    complianceDocs, disputes, grns, poMessages, products,
    sendPOMessage, acknowledgePO, updateShipment, submitInvoice,
    requestEarlyPayment, updateSupplierProfile, supplierLogout,
    mySupplierId
  } = useApp() as any;

  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);
  const [selectedGRNId, setSelectedGRNId] = useState<string | null>(null);

  // Profile data
  const myData = currentSupplier || { name: 'Sovereign Heavy Industries', id: 'SUP-001', location: 'Dubai, UAE' };

  // Derived Data
  const myPOs = purchaseOrders.filter((p: any) => p.supplierId === myData.id);
  const pendingAck = myPOs.filter((p: any) => !p.acknowledgedAt).length;
  const inProduction = myPOs.filter((p: any) => p.deliveryStatus === 'Processing' || p.deliveryStatus === 'Approved').length;

  const eligibleRFQs = rfqs.filter((r: any) => r.status === 'Published');
  const myBids = quotations.filter((q: any) => q.supplierId === myData.id);

  const expiringDocs = complianceDocs.filter((d: any) => d.status === 'Expiring Soon');
  const expiredDocs = complianceDocs.filter((d: any) => d.status === 'Expired');

  // Financials
  const myInvoices = invoices.filter((i: any) => i.supplierId === myData.id);
  const totalOutstanding = myInvoices.filter((i: any) => i.status !== 'Paid').reduce((acc: number, cur: any) => acc + cur.totalAmount, 0);
  const releasedPayments = myInvoices.filter((i: any) => i.status === 'Paid').reduce((acc: number, cur: any) => acc + cur.totalAmount, 0);

  // Messaging state
  const [activeMessageThread, setActiveMessageThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [poMessages, activeMessageThread]);

  const activeThreadMessages = poMessages.filter((m: any) => m.poId === activeMessageThread);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeMessageThread) return;
    sendPOMessage({
      poId: activeMessageThread,
      sender: 'supplier',
      senderName: myData.name,
      message: newMessage
    });
    setNewMessage('');
  };

  // Modals state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Tab config
  const tabs = [
    { id: 'dashboard', label: 'Briefing', icon: <Activity size={16} /> },
    { id: 'pos', label: 'Procurement', icon: <Package size={16} />, badge: pendingAck + inProduction },
    { id: 'performance', label: 'Performance', icon: <FileBarChart size={16} /> },
    { id: 'financials', label: 'Financials', icon: <CreditCard size={16} />, badge: totalOutstanding > 0 ? 1 : 0 },
    { id: 'communication', label: 'Intelligence', icon: <MessageSquare size={16} /> },
    { id: 'compliance', label: 'Legal Vault', icon: <ShieldCheck size={16} />, badge: expiringDocs.length + expiredDocs.length },
    { id: 'quality', label: 'Quality', icon: <Activity size={16} /> },
    { id: 'product-library', label: 'Portfolio', icon: <Globe size={16} /> },
    { id: 'account', label: 'Settings', icon: <Settings size={16} /> },
  ];

  // Performance data
  const deliveryHistory = [
    { month: 'Jan', onTime: 92, delayed: 8 },
    { month: 'Feb', onTime: 95, delayed: 5 },
    { month: 'Mar', onTime: 88, delayed: 12 },
    { month: 'Apr', onTime: 98, delayed: 2 },
  ];

  const liveAlerts = [
    { count: pendingAck, label: 'POs awaiting ack', color: 'var(--accent-amber)' },
    { count: expiringDocs.length, label: 'Docs expiring', color: '#60a5fa' },
    { count: expiredDocs.length, label: 'Overdue compliance', color: '#f87171' },
    { count: 2, label: 'Unread messages', color: 'var(--accent-slate)' },
  ].filter(a => a.count > 0);

  return (
    <div style={{
      minHeight: '100vh', background: '#0b0e14', color: '#fff',
      fontFamily: 'Inter, sans-serif', paddingBottom: 60
    }}>
      {/* ═══ INTERNAL CSS ══════════════════════════════════════════════════ */}
      <style jsx global>{`
        :root {
          --bg-card: #12161f;
          --bg-secondary: #1a1f2b;
          --border-subtle: rgba(255,255,255,0.06);
          --accent-slate: #b1cad7;
          --accent-amber: #e9c176;
          --text-primary: #ffffff;
          --text-muted: #94a3b8;
          --text-faint: #475569;
          --radius-standard: 12px;
          --font-heading: 'Manrope', sans-serif;
        }
        .btn {
          display: inline-flex; items: center; gap: 8px;
          padding: 8px 16px; border-radius: 10px; font-size: 13px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
          border: 1px solid transparent; text-transform: none;
        }
        .btn-primary {
          background: var(--accent-slate); color: #000;
        }
        .btn-primary:hover {
          background: #cfdee6; transform: translateY(-1px);
        }
        .btn-ghost {
          background: rgba(255,255,255,0.03); color: #fff;
          border-color: var(--border-subtle);
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.06);
        }
        .hover-row:hover {
          background: rgba(255,255,255,0.02) !important;
        }
        .tab-btn {
          position: relative; padding: 12px 20px; border: none;
          background: none; color: var(--text-muted); cursor: pointer;
          font-size: 13px; font-weight: 700; display: flex;
          align-items: center; gap: 10px; transition: all 0.2s;
        }
        .tab-btn-active {
          color: #fff;
        }
        .tab-indicator {
          position: absolute; bottom: 0; left: 20px; right: 20px;
          height: 2px; background: var(--accent-slate);
          box-shadow: 0 0 10px rgba(177,202,215,0.4);
        }
        .card-header-label {
          font-size: 10px; font-weight: 800; color: var(--text-faint);
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;
        }
      `}</style>

      {/* ═══ NAVIGATION ═════════════════════════════════════════════════════ */}
      <nav style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 72 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, marginRight: 40 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="#000" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Sovereign Portal</span>
                <span style={{ fontSize: 9, color: 'var(--accent-amber)', fontWeight: 800, letterSpacing: '0.1em' }}>{myData.name.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, height: '100%' }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as PortalTab)}
                  className={`tab-btn ${activeTab === t.id ? 'tab-btn-active' : ''}`}
                >
                  {t.icon}
                  {t.label}
                  {t.badge && t.badge > 0 ? (
                    <span style={{ padding: '2px 6px', background: t.id === 'pos' ? 'var(--accent-amber)' : 'var(--accent-slate)', color: '#000', fontSize: 9, borderRadius: 6, fontWeight: 900 }}>{t.badge}</span>
                  ) : null}
                  {activeTab === t.id && <div className="tab-indicator" />}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="btn btn-ghost" style={{ padding: 8 }}><Bell size={18} /></button>
              <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right', display: 'none', md: 'block' } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{myData.contactList?.[0]?.name || 'Account Admin'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Security Level 4</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                  <User size={18} className="text-slate" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN CONTENT AREA ═══════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ═══ DASHBOARD (BRIEFING) ════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Status board */}
                  <div style={{ padding: 28, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', alignItems: 'center', gap: 40 }}>
                    <HealthScoreRing score={94} />
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: '0 0 6px', fontSize: 24, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Systems Nominal</h2>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>You are holding **Preferred Supplier** status. 14 items currently in procurement cycle.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {liveAlerts.map((a, i) => <AlertBadge key={i} {...a} />)}
                    </div>
                  </div>

                  {/* Performance Radar */}
                  <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Fulfillment analytics</h3>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Last 4 months</span>
                    </div>
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deliveryHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis stroke="var(--text-faint)" fontSize={11} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, fontSize: 12 }}
                            itemStyle={{ fontWeight: 800 }}
                          />
                          <Bar dataKey="onTime" fill="var(--accent-slate)" radius={[4, 4, 0, 0]} barSize={40} />
                          <Bar dataKey="delayed" fill="rgba(248,113,113,0.3)" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Latest Procurement */}
                  <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div className="card-header-label">ACTIVE BIDS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                      {eligibleRFQs.slice(0, 2).map((rfq: any) => (
                        <div key={rfq.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent-slate)' }}>{rfq.id}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171' }}>{rfq.bidDeadline}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>{rfq.title}</div>
                        </div>
                      ))}
                      <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }} onClick={() => setActiveTab('bids' as PortalTab)}>View all tenders</button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    {[
                      { label: 'Released capital', value: `$${releasedPayments.toLocaleString()}`, icon: <CheckCircle2 size={14} />, color: '#4ade80' },
                      { label: 'Fulfillment rate', value: '98.4%', icon: <Star size={14} />, color: 'var(--accent-amber)' },
                    ].map((m, i) => (
                      <div key={i} style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>{m.icon}</div>
                        <div>
                          <div className="card-header-label">{m.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PROCUREMENT (POs) ═══════════════════════════════════════════ */}
          {activeTab === 'pos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Ack. pending', value: pendingAck, color: 'var(--accent-amber)', icon: <Clock size={16} /> },
                  { label: 'In production', value: inProduction, color: 'var(--accent-slate)', icon: <Activity size={16} /> },
                  { label: 'In transit', value: myPOs.filter((p: any) => p.deliveryStatus === 'Shipped').length, color: 'var(--accent-slate)', icon: <Globe size={16} /> },
                  { label: 'Fulfilled', value: myPOs.filter((p: any) => p.deliveryStatus === 'Delivered').length, color: '#4ade80', icon: <CheckCircle2 size={16} /> },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                      <span style={{ color: m.color }}>{m.icon}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <Search size={14} className="text-muted" />
                    <input type="text" placeholder="Filter by ID or reference…" style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: 280 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11 }}><Download size={13} /> Export manifest</button>
                    <button className="btn btn-primary" style={{ fontSize: 11 }}><Plus size={13} /> Batch acknowledgement</button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                        {['PO identifier', 'Date issued', 'Total value', 'Status', 'Tracking', ''].map(h => (
                          <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myPOs.map((po: any) => (
                        <tr key={po.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{po.id}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{po.items.length} LINE ITEMS</div>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-muted)' }}>{po.dateOfIssue}</td>
                          <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700 }}>${po.totalAmount.toLocaleString()}</td>
                          <td style={{ padding: '14px 18px' }}><StatusPill status={!po.acknowledgedAt ? 'Pending Ack' : po.deliveryStatus} /></td>
                          <td style={{ padding: '14px 18px' }}>
                            {po.trackingNumber ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Globe size={12} className="text-slate" />
                                <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{po.trackingNumber}</span>
                              </div>
                            ) : <span style={{ opacity: 0.2 }}>—</span>}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              {!po.acknowledgedAt && (
                                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => acknowledgePO(po.id)}>Acknowledge</button>
                              )}
                              <button className="btn btn-ghost" style={{ padding: 6 }}><ExternalLink size={13} /></button>
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

          {/* ═══ PERFORMANCE ══════════════════════════════════════════════════ */}
          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Market position', value: '#14 Global', color: 'var(--accent-slate)', trend: '+3 spots', positive: true },
                  { label: 'YoY Growth', value: '24.2%', color: '#4ade80', trend: 'In-sector', positive: true },
                  { label: 'Dispute rate', value: '0.4%', color: '#f87171', trend: 'Below threshold', positive: true },
                  { label: 'Avg. lead time', value: '14.2 Days', color: 'var(--accent-slate)', trend: '-1.2d improvement', positive: true },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: m.positive ? '#4ade80' : '#f87171', fontWeight: 700, marginTop: 6 }}>{m.trend}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div className="card-header-label">HISTORICAL FULFILLMENT</div>
                    <div style={{ height: 300, marginTop: 24 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={deliveryHistory}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent-slate)" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="var(--accent-slate)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis stroke="var(--text-faint)" fontSize={11} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, fontSize: 12 }}
                          />
                          <Area type="monotone" dataKey="onTime" stroke="var(--accent-slate)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div className="card-header-label">PREFERRED STATUS CRITERIA</div>
                    <div style={{ marginTop: 20 }}>
                      <ProgressBar label="Fulfillment rate (Min 95%)" value={98} total={100} />
                      <ProgressBar label="Response time (Max 24h)" value={12} total={24} />
                      <ProgressBar label="Quality pass (Min 98%)" value={99} total={100} />
                      <ProgressBar label="Digital maturity" value={8} total={10} />
                    </div>
                  </div>

                  <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div className="card-header-label">REJECTION ANALYTICS</div>
                    <div style={{ height: 160, marginTop: 12 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={deliveryHistory}>
                          <Line type="stepAfter" dataKey="delayed" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: '#f87171' }} />
                          <Tooltip contentStyle={{ display: 'none' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ FINANCIALS ═══════════════════════════════════════════════════ */}
          {activeTab === 'financials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total outstanding', value: `$${totalOutstanding.toLocaleString()}`, color: 'var(--accent-amber)', icon: <Clock size={16} /> },
                  { label: 'Settled this month', value: `$${releasedPayments.toLocaleString()}`, color: '#4ade80', icon: <DollarSign size={16} /> },
                  { label: 'Average settlement', value: '28.4 Days', color: 'var(--accent-slate)', icon: <CalendarIcon size={16} /> },
                  { label: 'Early pay potential', value: `$${(totalOutstanding * 0.98).toLocaleString()}`, color: 'var(--accent-slate)', icon: <TrendingUp size={16} /> },
                ].map((m: any, i) => (
                  <div key={i} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                      <span style={{ color: m.color }}>{m.icon || <Activity size={16} />}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Statement of account</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" style={{ fontSize: 11 }}><Search size={13} /> Filter</button>
                      <button className="btn btn-ghost" style={{ fontSize: 11 }}><Download size={13} /> Ledger PDF</button>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Document #', 'Type', 'Issue Date', 'Settlement Date', 'Amount', 'Status'].map(h => (
                          <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myInvoices.map((inv: any) => (
                        <tr key={inv.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '13px 18px', fontWeight: 700, fontSize: 13 }}>{inv.invoiceNumber}</td>
                          <td style={{ padding: '13px 18px', fontSize: 11, color: 'var(--text-muted)' }}>SERVICE/GOODS</td>
                          <td style={{ padding: '13px 18px', fontSize: 12 }}>{inv.invoiceDate}</td>
                          <td style={{ padding: '13px 18px', fontSize: 12, color: 'var(--text-faint)' }}>{inv.dueDate}</td>
                          <td style={{ padding: '13px 18px', fontWeight: 800 }}>${inv.totalAmount.toLocaleString()}</td>
                          <td style={{ padding: '13px 18px' }}><StatusPill status={inv.status} /></td>
                        </tr>
                      ))}
                      {myInvoices.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13 }}>No financial transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div className="card-header-label">EARLY PAYMENT PROTOCOL</div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: '12px 0 20px' }}>Withdraw capital ahead of schedule by providing a dynamic discount to the procurement authority.</p>
                    <div style={{ background: 'rgba(233,193,118,0.04)', border: '1px solid rgba(233,193,118,0.1)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-amber)', marginBottom: 4 }}>AVAILABLE FOR WITHDRAWAL</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>${(totalOutstanding * 0.98).toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: 'var(--accent-amber)', marginTop: 4, fontWeight: 600 }}>2% Early access fee applied</div>
                    </div>
                    <button
                      className="btn btn-primary"
                      disabled={totalOutstanding === 0}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        const inv = myInvoices.find((i: any) => i.status !== 'Paid');
                        if (inv) requestEarlyPayment(inv.id, 2);
                      }}
                    >
                      Authorize withdrawal
                    </button>
                    <p style={{ fontSize: 9, color: 'var(--text-faint)', textAlign: 'center', marginTop: 12 }}>Transfer takes approx. 4 optimal billing hours.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ COMMUNICATION HUB ════════════════════════════════════════════ */}
          {activeTab === 'communication' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden', height: 600 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
                <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 800 }}>Conversation Registry</div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {myPOs.map((po: any) => (
                      <div
                        key={po.id}
                        onClick={() => setActiveMessageThread(po.id)}
                        style={{
                          padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer', background: activeMessageThread === po.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 800 }}>{po.id}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>10:45 AM</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Latest regarding fulfillment update...</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {activeMessageThread ? (
                      <>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                            <Lock size={14} className="text-slate" />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>{activeMessageThread} Negotiation Thread</div>
                            <div style={{ fontSize: 9, color: '#4ade80', fontWeight: 800 }}>ENCRYPTED CHANNEL</div>
                          </div>
                        </div>
                        <button className="btn btn-ghost" style={{ padding: 6 }}><Settings size={14} /></button>
                      </>
                    ) : <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Secure intelligence link standby</div>}
                  </div>

                  <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {!activeMessageThread && (
                      <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.25 }}>
                        <Lock size={40} className="mx-auto mb-12" />
                        <p style={{ fontSize: 12, fontWeight: 700 }}>Select a thread to begin secure conversation</p>
                      </div>
                    )}
                    {activeMessageThread && activeThreadMessages.length === 0 && (
                      <>
                        {/* Demo messages for UX preview */}
                        <div>
                          <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: '4px 12px 12px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', fontSize: 12, lineHeight: 1.5 }}>
                            Hello — could you confirm the lead time for item 3 in your proposal? We need delivery before May 15th.
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, paddingLeft: 2 }}>Procurement team · 10:42 AM</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: '12px 4px 12px 12px', background: 'rgba(177,202,215,0.1)', border: '1px solid rgba(177,202,215,0.12)', fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                            Confirmed — item 3 can be delivered by May 10. We'll send a revised schedule by EOD today.
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, paddingRight: 2 }}>You · 11:05 AM</div>
                        </div>
                      </>
                    )}
                    {activeThreadMessages.map((msg: any, i: number) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'supplier' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '72%', padding: '10px 14px', fontSize: 12, lineHeight: 1.5,
                          borderRadius: msg.sender === 'supplier' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                          background: msg.sender === 'supplier' ? 'rgba(177,202,215,0.1)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${msg.sender === 'supplier' ? 'rgba(177,202,215,0.12)' : 'var(--border-subtle)'}`,
                        }}>
                          {msg.message}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, padding: '0 2px' }}>{msg.sender === 'supplier' ? 'You' : 'Procurement team'}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      placeholder={activeMessageThread ? 'Type your message…' : 'Select a thread first'}
                      value={newMessage}
                      disabled={!activeMessageThread}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 14px', fontSize: 12, outline: 'none', color: '#fff', fontWeight: 500, opacity: activeMessageThread ? 1 : 0.4 }}
                    />
                    <button className="btn btn-primary" style={{ padding: '0 18px' }} onClick={handleSendMessage} disabled={!activeMessageThread}>
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ COMPLIANCE ══════════════════════════════════════════════════ */}
          {activeTab === 'compliance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Valid documents', value: complianceDocs.filter((d: any) => d.status === 'Active').length, color: '#4ade80', icon: <ShieldCheck size={15} />, trend: 'Verified' },
                  { label: 'Expiring soon', value: expiringDocs.length, color: 'var(--accent-amber)', icon: <Clock size={15} />, trend: 'Action needed' },
                  { label: 'Expired', value: expiredDocs.length, color: '#f87171', icon: <AlertTriangle size={15} />, trend: 'Immediate action' },
                  { label: 'Trust rating', value: `${Math.round((complianceDocs.filter((d:any) => d.status === 'Active').length / Math.max(complianceDocs.length, 1)) * 100)}%`, color: 'var(--accent-slate)', icon: <Activity size={15} />, trend: 'Calculated' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                      <span style={{ color: m.color }}>{m.icon}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: m.color, fontWeight: 700, marginTop: 6 }}>{m.trend}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 17, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Document governance</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Managed registry of ISO certificates, licenses, and legal instruments.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalOpen('uploadCompliance')}>
                  <Upload size={13} /> Upload document
                </button>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                      {['Document', 'Category', 'Expiry date', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: h === '' ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {complianceDocs.map((doc: any) => (
                      <tr key={doc.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShieldCheck size={14} className="text-slate" />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{doc.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{doc.category}</td>
                        <td style={{ padding: '13px 18px', fontSize: 12, color: doc.status === 'Expired' ? '#f87171' : doc.status === 'Expiring Soon' ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: doc.status !== 'Active' ? 700 : 400 }}>{doc.expiryDate}</td>
                        <td style={{ padding: '13px 18px' }}><StatusPill status={doc.status} /></td>
                        <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                          <button className="btn btn-ghost" style={{ padding: 5 }}><Download size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ QUALITY ═════════════════════════════════════════════════════ */}
          {activeTab === 'quality' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Inspection pass rate', value: '98.2%', color: '#4ade80', icon: <CheckCircle2 size={15} /> },
                  { label: 'Active disputes', value: disputes.filter((d: any) => d.status === 'Open').length, color: '#f87171', icon: <AlertTriangle size={15} /> },
                  { label: 'Avg. variance', value: '1.4%', color: 'var(--accent-amber)', icon: <TrendingDown size={15} /> },
                  { label: 'QC gates passed', value: '24', color: 'var(--accent-slate)', icon: <Activity size={15} /> },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                      <span style={{ color: m.color }}>{m.icon}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Goods receipt & inspection logs</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['GRN ID', 'Received date', 'Passed qty', 'Rejected qty', 'QC status', ''].map(h => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: h === '' ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grns.filter((g: any) => g.supplierId === myData.id).map((grn: any) => {
                      const rejectedTotal = grn.lineItems.reduce((acc: number, item: any) => acc + (item.rejectedQty || 0), 0);
                      const passedTotal = grn.lineItems.reduce((acc: number, item: any) => acc + (item.receivedQty || 0), 0) - rejectedTotal;
                      return (
                        <tr key={grn.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '13px 18px', fontWeight: 700, fontSize: 13 }}>{grn.id}</td>
                          <td style={{ padding: '13px 18px', fontSize: 12, color: 'var(--text-muted)' }}>{grn.dateCreated}</td>
                          <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{passedTotal}</td>
                          <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: rejectedTotal > 0 ? '#f87171' : 'var(--text-muted)' }}>{rejectedTotal}</td>
                          <td style={{ padding: '13px 18px' }}><StatusPill status={rejectedTotal > 0 ? 'QC Variance' : 'Approved'} /></td>
                          <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                            {rejectedTotal > 0 && (
                              <button className="btn btn-ghost" style={{ fontSize: 10, color: '#f87171' }} onClick={() => { setSelectedGRNId(grn.id); setModalOpen('disputeGRN'); }}>Dispute</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {grns.filter((g: any) => g.supplierId === myData.id).length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>No GRN records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ BIDS ════════════════════════════════════════════════════════ */}
          {activeTab === 'bids' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Open opportunities', value: eligibleRFQs.length, color: 'var(--accent-slate)', icon: <Globe size={15} />, trend: 'Live tenders' },
                  { label: 'Active submissions', value: myBids.length, color: 'var(--accent-slate)', icon: <Send size={15} />, trend: 'In review' },
                  { label: 'Rejected bids', value: myBids.filter((b:any) => b.status === 'Rejected').length, color: 'var(--accent-amber)', icon: <ShieldCheck size={15} />, trend: 'Benchmark: 12%' },
                  { label: 'Awards secured', value: myBids.filter((b:any) => b.status === 'Awarded').length, color: '#4ade80', icon: <Award size={15} />, trend: 'Revenue capture' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                      <span style={{ color: m.color }}>{m.icon}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: m.color, fontWeight: 700, marginTop: 6 }}>{m.trend}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LIVE TENDERS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {eligibleRFQs.length > 0 ? eligibleRFQs.map((rfq:any) => (
                      <div key={rfq.id} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', transition: 'border-color 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: 'rgba(177,202,215,0.08)', color: 'var(--accent-slate)' }}>{rfq.tenderType?.toUpperCase() || 'RFQ'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{rfq.id}</span>
                        </div>
                        <h4 style={{ margin: '0 0 8px', fontSize: 15, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>{rfq.title}</h4>
                        <p style={{ margin: '0 0 14px', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{rfq.notes}</p>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 3 }}>DEADLINE</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-amber)' }}>{rfq.bidDeadline}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 3 }}>SCOPE</div>
                            <div style={{ fontSize: 12, fontWeight: 800 }}>{rfq.lineItems.length} line items</div>
                          </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', fontSize: 11 }} onClick={() => { setSelectedRFQId(rfq.id); setModalOpen('bidSubmission'); }}>Submit proposal</button>
                      </div>
                    )) : (
                      <div style={{ padding: 36, textAlign: 'center', opacity: 0.5, background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                        <Search size={22} className="mx-auto mb-10 text-muted" />
                        <p style={{ fontSize: 11, fontWeight: 700 }}>No active tenders for your profile.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SUBMISSION REGISTRY</h4>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Proposal', 'Score', 'Status', ''].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: h === '' ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h.toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {myBids.map((bid:any) => (
                          <tr key={bid.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700 }}>{bid.id}</td>
                            <td style={{ padding: '12px 14px' }}>
                              {bid.evaluation ? <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-slate)' }}>{bid.evaluation.totalScore}</span> : <span style={{ opacity: 0.4, fontSize: 12 }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px' }}><StatusPill status={bid.status} /></td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setActiveTab('communication' as PortalTab)}><MessageSquare size={13} /></button>
                            </td>
                          </tr>
                        ))}
                        {myBids.length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>No proposals submitted yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PRODUCT LIBRARY ═════════════════════════════════════════════ */}
          {activeTab === 'product-library' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 17, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Product portfolio</h3>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{products.length} units listed</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
                    <Plus size={13} /> Add product
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {products.map((product: any) => (
                    <div key={product.id} style={{ padding: 14, borderRadius: 'var(--radius-standard)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', transition: 'border-color 0.2s' }}>
                      <div style={{ width: '100%', height: 90, borderRadius: 10, background: 'var(--bg-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={28} style={{ color: 'var(--accent-slate)', opacity: 0.2 }} />
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-slate)', marginBottom: 2, letterSpacing: '0.05em' }}>{product.category}</div>
                      <div style={{ fontWeight: 800, fontSize: 13, fontFamily: 'Manrope, sans-serif', marginBottom: 3 }}>{product.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 12, fontFamily: 'monospace' }}>{product.sku}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>${product.basePrice.toLocaleString()} <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 400 }}>/{product.unit}</span></span>
                        <button className="btn btn-ghost" style={{ padding: 4 }}><ExternalLink size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ACCOUNT ═════════════════════════════════════════════════════ */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '28px 28px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, flexShrink: 0, background: myData.logo ? 'none' : 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#000', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  {myData.logo ? <img src={myData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (myData.name ? myData.name[0] : 'S')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>{myData.name}</h2>
                    <span style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(74,222,128,0.15)' }}>✓ VERIFIED</span>
                  </div>
                  <div style={{ display: 'flex', gap: 18, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Globe size={11} /> Global classification</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} /> {myData.contactList?.[0]?.email || myData.email}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-amber)' }}><Award size={11} /> Preferred partner</span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowEditProfile(true)}><Edit2 size={13} /> Edit profile</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Business dossier */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BUSINESS DOSSIER</h3>
                  </div>
                  <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                    {[
                      { label: 'Tax registration', value: myData.taxRegNumber },
                      { label: 'Legal entity type', value: 'Joint Stock Company' },
                      { label: 'Jurisdiction', value: myData.location },
                      { label: 'Registered address', value: myData.address },
                    ].map((f, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 5, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{f.value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settlement */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SETTLEMENT PROTOCOL</h3>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ background: 'rgba(233,193,118,0.04)', borderRadius: 12, padding: 14, border: '1px solid rgba(233,193,118,0.1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <DollarSign size={18} style={{ color: 'var(--accent-amber)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800 }}>Net 30 settlement</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>From invoice authorization date</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 5, letterSpacing: '0.05em' }}>BANK</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{myData.bankInfo?.bankName || 'Global Merchant Bank'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 5, letterSpacing: '0.05em' }}>ACCOUNT</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>**** {myData.bankInfo?.accountNo?.slice(-4) || '8842'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', color: 'var(--accent-slate)' }}>
                  <Lock size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Privacy & access center</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Encryption protocols active. Last credential rotation: 3 months ago.</div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 11, fontWeight: 800 }} onClick={() => setShowChangePassword(true)}>Rotate credentials</button>
              </div>

              {/* Personnel */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AUTHORIZED PERSONNEL</h3>
                  <button className="btn btn-ghost" style={{ fontSize: 10 }}><UserPlus size={12} /> Add contact</button>
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {(myData.contactList || [
                    { name: 'John Smith', role: 'Sales Director', email: 'john@portal.com' },
                    { name: 'Alina K.', role: 'Account Manager', email: 'alina@portal.com' },
                    { name: 'Vince T.', role: 'Operations', email: 'vince@portal.com' }
                  ]).map((contact: any, i: number) => (
                    <div key={i} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--accent-slate)', flexShrink: 0 }}>
                        {contact.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{contact.role}</div>
                      </div>
                      <button className="btn btn-ghost" style={{ padding: 4, flexShrink: 0 }}><Mail size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── STANDALONE LOGOUT ──────────────────────────────────────────────── */}
        {standalone && (
          <button
            onClick={() => { supplierLogout(); router.push('/'); }}
            style={{
              position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
              padding: '10px 20px', background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12,
              color: '#f87171', fontSize: 11, fontWeight: 800, fontFamily: 'Manrope, sans-serif',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.15s'
            }}
          >
            <Lock size={14} /> Logout
          </button>
        )}

        {/* ── MODALS ────────────────────────────────────────────────────────── */}
        {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} />}
        {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
        {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      </div>
    </div>
  );
}

// ─── Modal: Add Product ────────────────────────────────────────────────────────
function AddProductModal({ onClose }: { onClose: () => void }) {
  const { addProduct, uploadComplianceDoc, mySupplierId } = useApp() as any;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', sku: '', category: 'Piping', description: '', basePrice: 0, unit: 'Piece', currency: 'USD', catalogueName: '' });

  const handleSubmit = () => {
    addProduct({ name: formData.name, sku: formData.sku, category: formData.category, description: formData.description, basePrice: Number(formData.basePrice), unit: formData.unit, currency: formData.currency, technicalDocs: formData.catalogueName ? [`DOC-${Date.now()}`] : [], certifications: [] });
    if (formData.catalogueName) uploadComplianceDoc({ supplierId: mySupplierId, title: formData.catalogueName, category: 'Product Catalogue', expiryDate: '2027-12-31', fileSize: '2.4 MB' });
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

  return (
    <ModalShell title="Add product" onClose={onClose}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? 'var(--accent-slate)' : 'rgba(255,255,255,0.06)', transition: 'background 0.3s', boxShadow: step >= s ? '0 0 8px rgba(177,202,215,0.25)' : 'none' }} />)}
      </div>
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Product name"><input placeholder="e.g. High pressure regulator" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="SKU / model"><input placeholder="SKU-88-ALPHA" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} style={inputStyle} /></Field>
            <Field label="Category">
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                {['Piping', 'Valves', 'Fittings', 'Electrical'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description"><textarea rows={3} placeholder="Technical specifications…" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ ...inputStyle, resize: 'none' }} /></Field>
        </div>
      )}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Base price (USD)"><input type="number" placeholder="0.00" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} style={inputStyle} /></Field>
            <Field label="Unit"><input placeholder="e.g. Metric ton, Unit" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={inputStyle} /></Field>
          </div>
        </div>
      )}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '32px 20px', border: '1px dashed var(--border-subtle)', borderRadius: 14, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <Upload size={28} style={{ color: 'var(--accent-slate)', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Product catalogue (PDF)</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 16 }}>Enter filename to simulate upload</div>
            <input placeholder="catalogue_v1.pdf" value={formData.catalogueName} onChange={e => setFormData({ ...formData, catalogueName: e.target.value })} style={{ ...inputStyle, textAlign: 'center', width: '80%' }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        {step > 1 ? <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setStep(step - 1)}>Back</button> : <div />}
        {step < 3 ? <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setStep(step + 1)}>Continue</button> : <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSubmit}>Add to portfolio</button>}
      </div>
    </ModalShell>
  );
}

// ─── Modal: Edit Profile ───────────────────────────────────────────────────────
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { myData, updateSupplierProfile } = useApp() as any;
  const [formData, setFormData] = useState({ name: myData?.name || '', email: myData?.email || '', location: myData?.location || '', address: myData?.address || '', logo: myData?.logo || '' });
  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

  return (
    <ModalShell title="Edit profile" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Legal entity name"><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></Field>
        <Field label="Logo URL"><input placeholder="https://…/logo.png" value={formData.logo} onChange={e => setFormData({ ...formData, logo: e.target.value })} style={inputStyle} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Contact email"><input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} /></Field>
          <Field label="Jurisdiction"><input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} /></Field>
        </div>
        <Field label="Registered address"><textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ ...inputStyle, resize: 'none' }} /></Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => { updateSupplierProfile(myData.id, formData); onClose(); }}>Save changes</button>
      </div>
    </ModalShell>
  );
}

// ─── Modal: Change Password ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { myData, updateSupplierProfile } = useApp() as any;
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

  const handleUpdate = () => {
    if (currentPass !== myData.passwordHash) { setError('Current password is incorrect.'); return; }
    if (newPass !== confirmPass) { setError('New passwords do not match.'); return; }
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    updateSupplierProfile(myData.id, { passwordHash: newPass });
    onClose();
  };

  return (
    <ModalShell title="Change password" onClose={onClose}>
      {error && <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--accent-amber)', background: 'rgba(233,193,118,0.06)', border: '1px solid rgba(233,193,118,0.12)', borderRadius: 8, marginBottom: 16, fontWeight: 700 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Current password"><input type="password" value={currentPass} onChange={e => { setCurrentPass(e.target.value); setError(''); }} style={inputStyle} /></Field>
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
        <Field label="New password"><input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setError(''); }} style={inputStyle} /></Field>
        <Field label="Confirm new password"><input type="password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(''); }} style={inputStyle} /></Field>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 24, fontSize: 12 }} onClick={handleUpdate}>Update password</button>
    </ModalShell>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '95%', maxWidth: 500, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>{title}</h3>
          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ padding: 28 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 7, letterSpacing: '0.06em' }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

const CalendarIcon = ({ size, color }: { size?: number, color?: string }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
