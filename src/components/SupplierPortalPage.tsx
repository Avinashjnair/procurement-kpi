'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Building2, FileText, Send, Clock, CheckCircle2,
  AlertTriangle, Download, Upload, ExternalLink,
  DollarSign, Package, ShieldCheck, MessageSquare,
  Search, ChevronRight, BarChart3, Plus, TrendingUp, TrendingDown,
  UserPlus, Settings, CreditCard, FileBarChart, Activity, User,
  Globe, Landmark, Lock, X, Award, Mail, Edit2, Bell, Star,
  Truck, ChevronDown, ChevronUp, FileCheck, AlertCircle,
  Calendar, ArrowRight, Inbox, ReceiptText, ZapIcon, Filter,
  SlidersHorizontal, MoreHorizontal, Eye, Check, Info, Menu
} from 'lucide-react';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';

import { PortalTab } from '@/types';

// ─── CalendarIcon (moved to top to fix hoisting bug) ─────────────────────────
const CalendarIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

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
      case 'Released': case 'Active': case 'Approved': case 'Awarded': case 'Delivered':
        return { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.15)' };
      case 'Pending Ack': case 'Expiring Soon': case 'Processing': case 'In Review': case 'Shipped':
        return { bg: 'rgba(233,193,118,0.08)', color: 'var(--accent-amber)', border: 'rgba(233,193,118,0.15)' };
      case 'Expired': case 'Rejected': case 'Overdue': case 'QC Variance':
        return { bg: 'rgba(248,113,113,0.08)', color: '#f87171', border: 'rgba(248,113,113,0.15)' };
      case 'Draft': case 'Under Evaluation':
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

// FIX: AlertBadge now renders as proper inline chips, not heavy bordered blocks
function AlertChip({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      background: 'rgba(255,255,255,0.03)', borderRadius: 20,
      border: `1px solid ${color}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        <span style={{ color, fontWeight: 800 }}>{count}</span> {label}
      </span>
    </div>
  );
}

// Enhanced ProgressBar with threshold marker and pass/fail badge
function ProgressBar({ value, label, total, threshold, unit = '' }: {
  value: number; label: string; total: number; threshold?: number; unit?: string;
}) {
  const pct = Math.min((value / total) * 100, 100);
  const thresholdPct = threshold ? Math.min((threshold / total) * 100, 100) : null;
  const passing = threshold !== undefined ? (unit === 'h' ? value <= threshold : value >= threshold) : true;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {threshold !== undefined && (
            <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
              {unit === 'h' ? `Max ${threshold}${unit}` : `Min ${threshold}${unit || '%'}`}
            </span>
          )}
          <span style={{ fontWeight: 800 }}>{value}{unit || '%'}</span>
          {threshold !== undefined && (
            <span style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 800,
              background: passing ? 'rgba(74,222,128,0.08)' : 'rgba(233,193,118,0.08)',
              color: passing ? '#4ade80' : 'var(--accent-amber)',
              border: `1px solid ${passing ? 'rgba(74,222,128,0.2)' : 'rgba(233,193,118,0.2)'}`,
            }}>
              {passing ? '✓ Pass' : '⚠ Below'}
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, position: 'relative' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: passing ? 'var(--accent-slate)' : 'var(--accent-amber)',
          borderRadius: 3, transition: 'width 0.6s ease'
        }} />
        {thresholdPct !== null && (
          <div style={{
            position: 'absolute', top: -3, left: `${thresholdPct}%`,
            width: 2, height: 11, background: 'rgba(255,255,255,0.25)', borderRadius: 1
          }} />
        )}
      </div>
    </div>
  );
}

// NEW: Empty state component
function EmptyState({ icon, title, subtitle, action }: {
  icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '52px 24px', textAlign: 'center', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: 10
    }}>
      <div style={{ color: 'var(--text-faint)', opacity: 0.4, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: 'var(--text-muted)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', maxWidth: 280, lineHeight: 1.6 }}>{subtitle}</div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// NEW: Notification panel content
function NotificationPanel({ onClose, pendingAck, expiringDocs, expiredDocs, isMobile }: {
  onClose: () => void;
  pendingAck: number;
  expiringDocs: any[];
  expiredDocs: any[];
  isMobile: boolean;
}) {
  const items = [
    ...Array(pendingAck).fill(null).map((_, i) => ({
      type: 'warn', icon: <Clock size={13} />, title: `PO awaiting acknowledgement`, time: 'Just now'
    })),
    ...expiringDocs.map(d => ({
      type: 'info', icon: <Calendar size={13} />, title: `${d.title} expires soon`, time: d.expiryDate
    })),
    ...expiredDocs.map(d => ({
      type: 'danger', icon: <AlertTriangle size={13} />, title: `${d.title} has expired`, time: d.expiryDate
    })),
  ];

  return (
    <div style={{
      position: 'absolute', top: 48, right: isMobile ? -60 : 0, width: isMobile ? 'calc(100vw - 32px)' : 320, zIndex: 200,
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
    }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>Notifications</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2 }}><X size={14} /></button>
      </div>
      {items.length === 0
        ? <div style={{ padding: 28, textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>All clear — no new alerts.</div>
        : items.map((item, i) => (
          <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: item.type === 'danger' ? 'rgba(248,113,113,0.08)' : item.type === 'warn' ? 'rgba(233,193,118,0.08)' : 'rgba(177,202,215,0.08)',
              color: item.type === 'danger' ? '#f87171' : item.type === 'warn' ? 'var(--accent-amber)' : 'var(--accent-slate)',
            }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{item.time}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// NEW: PO Detail Drawer
function PODetailDrawer({ po, onClose, onAcknowledge, onUpdateShipment, onSubmitInvoice, isMobile }: {
  po: any; onClose: () => void;
  onAcknowledge: (id: string) => void;
  onUpdateShipment: (id: string, data: any) => void;
  onSubmitInvoice: () => void;
  isMobile: boolean;
}) {
  const [shipmentForm, setShipmentForm] = useState({ trackingNumber: po.trackingNumber || '', carrier: '', estimatedDelivery: '' });
  const [showShipmentForm, setShowShipmentForm] = useState(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        width: isMobile ? '100%' : 480, background: 'var(--bg-card)', borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{po.id}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Issued {po.dateOfIssue}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusPill status={!po.acknowledgedAt ? 'Pending Ack' : po.deliveryStatus} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4 }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Total value', value: `$${po.totalAmount?.toLocaleString()}` },
              { label: 'Line items', value: po.items?.length || 0 },
              { label: 'Delivery status', value: po.deliveryStatus || 'Pending' },
              { label: 'Tracking #', value: po.trackingNumber || '—' },
            ].map((f, i) => (
              <div key={i} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 5, letterSpacing: '0.06em' }}>{f.label.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Line Items */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 10 }}>LINE ITEMS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(po.items || []).map((item: any, i: number) => (
                <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{item.description || item.name || `Item ${i + 1}`}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Qty: {item.quantity} × ${item.unitPrice?.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>${(item.quantity * item.unitPrice)?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipment Update */}
          {po.acknowledgedAt && po.deliveryStatus !== 'Delivered' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 10 }}>SHIPMENT UPDATE</div>
              {!showShipmentForm ? (
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={() => setShowShipmentForm(true)}>
                  <Truck size={13} /> Update shipment details
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <Field label="Tracking number">
                    <input value={shipmentForm.trackingNumber} onChange={e => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })} placeholder="TRK-000000" style={drawerInputStyle} />
                  </Field>
                  <Field label="Carrier">
                    <input value={shipmentForm.carrier} onChange={e => setShipmentForm({ ...shipmentForm, carrier: e.target.value })} placeholder="e.g. DHL, FedEx" style={drawerInputStyle} />
                  </Field>
                  <Field label="Estimated delivery">
                    <input type="date" value={shipmentForm.estimatedDelivery} onChange={e => setShipmentForm({ ...shipmentForm, estimatedDelivery: e.target.value })} style={drawerInputStyle} />
                  </Field>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowShipmentForm(false)}>Cancel</button>
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: 11 }} onClick={() => { onUpdateShipment(po.id, shipmentForm); setShowShipmentForm(false); }}>
                      <Check size={12} /> Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: 20, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          {!po.acknowledgedAt && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => { onAcknowledge(po.id); onClose(); }}>
              <Check size={13} /> Acknowledge PO
            </button>
          )}
          {po.deliveryStatus === 'Delivered' && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={onSubmitInvoice}>
              <ReceiptText size={13} /> Submit invoice
            </button>
          )}
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
            <MessageSquare size={13} /> Message
          </button>
        </div>
      </div>
    </div>
  );
}

const drawerInputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)',
  color: '#fff', fontSize: 12, outline: 'none', fontWeight: 600, boxSizing: 'border-box'
};

// NEW: Invoice Submission Modal
function SubmitInvoiceModal({ po, onClose, onSubmit }: { po: any; onClose: () => void; onSubmit: (data: any) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [form, setForm] = useState({ invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, invoiceDate: today, dueDate, notes: '' });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)',
    color: '#fff', fontSize: 12, outline: 'none', fontWeight: 600, boxSizing: 'border-box'
  };

  return (
    <ModalShell title="Submit invoice" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: 14, background: 'rgba(177,202,215,0.04)', border: '1px solid rgba(177,202,215,0.1)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>For {po?.id}</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>${po?.totalAmount?.toLocaleString()}</div>
        </div>
        <Field label="Invoice number"><input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} style={inputStyle} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Invoice date"><input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} style={inputStyle} /></Field>
          <Field label="Due date (Net 30)"><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} /></Field>
        </div>
        <Field label="Notes (optional)"><textarea rows={2} value={form.notes} placeholder="Any additional notes…" onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, resize: 'none' }} /></Field>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => { onSubmit(form); onClose(); }}>
          <Send size={13} /> Submit invoice
        </button>
      </div>
    </ModalShell>
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
    mySupplierId, globalSearchQuery
  } = useApp() as any;

  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);
  const [selectedGRNId, setSelectedGRNId] = useState<string | null>(null);

  // FIX: Use currentSupplier consistently, pass down as prop to avoid desync
  const myData = currentSupplier || { name: 'Sovereign Heavy Industries', id: 'SUP-001', location: 'Dubai, UAE' };

  // Derived Data
  const myPOs = purchaseOrders.filter((p: any) => p.supplierId === myData.id);
  const pendingAck = myPOs.filter((p: any) => !p.acknowledgedAt).length;
  const inProduction = myPOs.filter((p: any) => p.deliveryStatus === 'Processing' || p.deliveryStatus === 'Approved').length;
  const eligibleRFQs = rfqs.filter((r: any) => r.status === 'Published');
  const myBids = quotations.filter((q: any) => q.supplierId === myData.id);
  const expiringDocs = complianceDocs.filter((d: any) => d.status === 'Expiring Soon');
  const expiredDocs = complianceDocs.filter((d: any) => d.status === 'Expired');
  const myInvoices = invoices.filter((i: any) => i.supplierId === myData.id);
  const totalOutstanding = myInvoices.filter((i: any) => i.status !== 'Paid').reduce((acc: number, cur: any) => acc + cur.totalAmount, 0);
  const releasedPayments = myInvoices.filter((i: any) => i.status === 'Paid').reduce((acc: number, cur: any) => acc + cur.totalAmount, 0);

  // PO search/filter state — WIRED (was decorative before)
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('All');
  const filteredPOs = useMemo(() => {
    return myPOs.filter((p: any) => {
      const matchesSearch = !poSearch || p.id.toLowerCase().includes(poSearch.toLowerCase());
      const matchesStatus = poStatusFilter === 'All' || (poStatusFilter === 'Pending' ? !p.acknowledgedAt : p.deliveryStatus === poStatusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [myPOs, poSearch, poStatusFilter]);

  // Batch acknowledgement state
  const [selectedPOIds, setSelectedPOIds] = useState<Set<string>>(new Set());
  const pendingPOs = myPOs.filter((p: any) => !p.acknowledgedAt);

  const handleBatchAcknowledge = useCallback(() => {
    if (selectedPOIds.size === 0) {
      pendingPOs.forEach((p: any) => acknowledgePO(p.id));
    } else {
      selectedPOIds.forEach(id => acknowledgePO(id));
      setSelectedPOIds(new Set());
    }
  }, [selectedPOIds, pendingPOs, acknowledgePO]);

  // PO Detail Drawer state
  const [drawerPO, setDrawerPO] = useState<any>(null);

  // Invoice submission state
  const [invoicePO, setInvoicePO] = useState<any>(null);

  // Messaging
  const [activeMessageThread, setActiveMessageThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [poMessages, activeMessageThread]);
  const activeThreadMessages = poMessages.filter((m: any) => m.poId === activeMessageThread);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeMessageThread) return;
    sendPOMessage({ poId: activeMessageThread, sender: 'supplier', senderName: myData.name, message: newMessage });
    setNewMessage('');
  };

  // Modal state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [earlyPayConfirm, setEarlyPayConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive logic
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth < 1024;

  // Total notification count
  const totalAlerts = pendingAck + expiringDocs.length + expiredDocs.length;

  // Tabs — FIX: Added 'bids' as proper nav entry
  const tabs = [
    { id: 'dashboard', label: 'Briefing', icon: <Activity size={15} /> },
    { id: 'pos', label: 'Procurement', icon: <Package size={15} />, badge: pendingAck + inProduction },
    { id: 'performance', label: 'Performance', icon: <FileBarChart size={15} /> },
    { id: 'financials', label: 'Financials', icon: <CreditCard size={15} />, badge: totalOutstanding > 0 ? 1 : 0 },
    { id: 'bids', label: 'Tenders', icon: <Award size={15} />, badge: eligibleRFQs.length },
    { id: 'communication', label: 'Messages', icon: <MessageSquare size={15} /> },
    { id: 'compliance', label: 'Documents', icon: <ShieldCheck size={15} />, badge: expiringDocs.length + expiredDocs.length },
    { id: 'quality', label: 'Quality', icon: <Activity size={15} /> },
    { id: 'product-library', label: 'Portfolio', icon: <Globe size={15} /> },
    { id: 'account', label: 'Settings', icon: <Settings size={15} /> },
  ];

  const deliveryHistory = [
    { month: 'Jan', onTime: 92, delayed: 8 },
    { month: 'Feb', onTime: 95, delayed: 5 },
    { month: 'Mar', onTime: 88, delayed: 12 },
    { month: 'Apr', onTime: 98, delayed: 2 },
  ];

  const liveAlerts = [
    { count: pendingAck, label: 'POs awaiting ack', color: 'var(--accent-amber)' },
    { count: expiringDocs.length, label: 'docs expiring', color: '#60a5fa' },
    { count: expiredDocs.length, label: 'compliance gaps', color: '#f87171' },
  ].filter(a => a.count > 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0e14', color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 60, paddingTop: 0 }}>
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
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 10px; font-size: 13px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
          border: 1px solid transparent; text-transform: none; font-family: inherit;
        }
        .btn-primary { background: var(--accent-slate); color: #000; }
        .btn-primary:hover { background: #cfdee6; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .btn-ghost { background: rgba(255,255,255,0.03); color: #fff; border-color: var(--border-subtle); }
        .btn-ghost:hover { background: rgba(255,255,255,0.06); }
        .btn-danger { background: rgba(248,113,113,0.08); color: #f87171; border-color: rgba(248,113,113,0.15); }
        .btn-danger:hover { background: rgba(248,113,113,0.14); }
        .hover-row:hover { background: rgba(255,255,255,0.02) !important; }
        .tab-pill {
          position: relative; padding: 7px 14px; border: none;
          background: transparent; color: var(--text-muted); cursor: pointer;
          font-size: 12px; font-weight: 700; display: flex;
          align-items: center; gap: 7px; transition: all 0.2s;
          border-radius: 8px; white-space: nowrap;
        }
        .tab-pill:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .tab-pill-active {
          background: rgba(177,202,215,0.08);
          color: #fff;
          border: 1px solid rgba(177,202,215,0.15);
        }
        .pip {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent-amber); flex-shrink: 0;
        }
        .pip-danger { background: #f87171; }
        .card-header-label {
          font-size: 10px; font-weight: 800; color: var(--text-faint);
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;
        }
        .checkbox-row { display: flex; align-items: center; gap: 10px; }
        .po-checkbox {
          width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.03); cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .po-checkbox.checked { background: var(--accent-slate); border-color: var(--accent-slate); }
      `}</style>

      {/* ═══ NAVIGATION ═════════════════════════════════════════════════════ */}
      <nav style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky', top: 'var(--header-height)', zIndex: 100, backdropFilter: 'blur(12px)'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 64 }}>
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <button
                className="btn btn-ghost"
                style={{ padding: 8, marginRight: 12 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginRight: isMobile ? 0 : 32, flex: isMobile ? 1 : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={18} color="#000" />
              </div>
              {!isMobile && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Sovereign Portal</div>
                  <div style={{ fontSize: 9, color: 'var(--accent-amber)', fontWeight: 800, letterSpacing: '0.08em' }}>{myData.name?.toUpperCase()}</div>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 2, height: '100%', alignItems: 'center', overflowX: 'auto', flex: 1 }}>
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as PortalTab)}
                    className={`tab-pill ${activeTab === t.id ? 'tab-pill-active' : ''}`}
                  >
                    {t.icon}
                    {t.label}
                    {t.badge && t.badge > 0 ? (
                      <span className={`pip ${t.id === 'compliance' && expiredDocs.length > 0 ? 'pip-danger' : ''}`} />
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            {/* Right actions */}
            <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative' }}>
              {/* FIX: Notification bell is now functional */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: 8, position: 'relative' }}
                  onClick={() => setShowNotifications(v => !v)}
                >
                  <Bell size={16} />
                  {totalAlerts > 0 && (
                    <span style={{
                      position: 'absolute', top: 4, right: 4, width: 7, height: 7,
                      borderRadius: '50%', background: '#f87171', border: '1.5px solid #0b0e14'
                    }} />
                  )}
                </button>
                {showNotifications && (
                  <NotificationPanel
                    onClose={() => setShowNotifications(false)}
                    pendingAck={pendingAck}
                    expiringDocs={expiringDocs}
                    expiredDocs={expiredDocs}
                    isMobile={isMobile}
                  />
                )}
              </div>
              <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                  <User size={16} />
                </div>
                {!isMobile && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{myData.contactList?.[0]?.name || 'Account Admin'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Security level 4</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {isMobile && mobileMenuOpen && (
          <div 
            style={{ position: 'fixed', inset: 0, top: 64, zIndex: 999, background: 'rgba(0,0,0,0.6)' }} 
            onClick={() => setMobileMenuOpen(false)}
          >
            <div style={{
              width: '280px', height: 'calc(100vh - 64px)', zIndex: 1000,
              background: '#0b0e14', // Opaque
              display: 'flex', flexDirection: 'column', padding: '24px 16px', borderRight: '1px solid var(--border-subtle)',
              boxShadow: '20px 0 50px rgba(0,0,0,0.8)', overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id as PortalTab); setMobileMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderRadius: 12, border: '1px solid transparent', background: activeTab === t.id ? 'rgba(177,202,215,0.08)' : 'transparent',
                    color: activeTab === t.id ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 700,
                    textAlign: 'left', outline: 'none', cursor: 'pointer'
                  }}
                >
                  {t.icon}
                  {t.label}
                  {t.badge && t.badge > 0 ? (
                    <span style={{
                      marginLeft: 'auto', background: t.id === 'compliance' && expiredDocs.length > 0 ? '#f87171' : 'var(--accent-amber)',
                      color: '#000', fontSize: 10, padding: '1px 6px', borderRadius: 10
                    }}>{t.badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </nav>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>

        {/* ═══ DASHBOARD ════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 340px', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* FIX: Status board — no markdown literals, uses proper JSX badge */}
                <div style={{
                  padding: isMobile ? 20 : 28, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-standard)', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 20 : 32
                }}>
                  <HealthScoreRing score={94} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Systems nominal</h2>
                      {/* FIX: Was **Preferred Supplier** (rendered as literal asterisks) */}
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)', letterSpacing: '0.04em' }}>
                        ✓ PREFERRED SUPPLIER
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {myPOs.length > 0 ? `${myPOs.length} items currently in procurement cycle.` : 'No active procurement items.'}
                    </p>
                  </div>
                  {/* FIX: Alert chips instead of bordered blocks */}
                  {liveAlerts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {liveAlerts.map((a, i) => <AlertChip key={i} {...a} />)}
                    </div>
                  ) : (
                    <AlertChip count={1} label="All clear" color="#4ade80" />
                  )}
                </div>

                {/* Chart */}
                <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Fulfillment analytics</h3>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Last 4 months</span>
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deliveryHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-faint)" fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, fontSize: 12 }} itemStyle={{ fontWeight: 800 }} />
                        <Bar dataKey="onTime" name="On time" fill="var(--accent-slate)" radius={[4, 4, 0, 0]} barSize={36} />
                        <Bar dataKey="delayed" name="Delayed" fill="rgba(248,113,113,0.3)" radius={[4, 4, 0, 0]} barSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Active bids */}
                <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div className="card-header-label">ACTIVE BIDS</div>
                  {eligibleRFQs.length === 0 ? (
                    <EmptyState icon={<Inbox size={28} />} title="No open tenders" subtitle="New RFQs matching your profile will appear here." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                      {eligibleRFQs.slice(0, 2).map((rfq: any) => (
                        <div key={rfq.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent-slate)' }}>{rfq.id}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171' }}>{rfq.bidDeadline}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{rfq.title}</div>
                        </div>
                      ))}
                      <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }} onClick={() => setActiveTab('bids' as PortalTab)}>
                        View all tenders <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {[
                    { label: 'Released capital', value: releasedPayments > 0 ? `$${releasedPayments.toLocaleString()}` : '$0', icon: <CheckCircle2 size={14} />, color: '#4ade80' },
                    { label: 'Fulfillment rate', value: '98.4%', icon: <Star size={14} />, color: 'var(--accent-amber)' },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>{m.icon}</div>
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
            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Ack. pending', value: pendingAck, color: 'var(--accent-amber)', icon: <Clock size={15} />, badge: pendingAck > 0 ? 'Action needed' : 'All clear', badgeColor: pendingAck > 0 ? 'rgba(233,193,118,0.08)' : 'rgba(74,222,128,0.08)', badgeText: pendingAck > 0 ? 'var(--accent-amber)' : '#4ade80' },
                { label: 'In production', value: inProduction, color: 'var(--accent-slate)', icon: <Activity size={15} />, badge: 'On schedule', badgeColor: 'rgba(177,202,215,0.08)', badgeText: 'var(--accent-slate)' },
                { label: 'In transit', value: myPOs.filter((p: any) => p.deliveryStatus === 'Shipped').length, color: 'var(--accent-slate)', icon: <Globe size={15} />, badge: 'Tracking active', badgeColor: 'rgba(177,202,215,0.08)', badgeText: 'var(--accent-slate)' },
                { label: 'Fulfilled', value: myPOs.filter((p: any) => p.deliveryStatus === 'Delivered').length, color: '#4ade80', icon: <CheckCircle2 size={15} />, badge: 'This quarter', badgeColor: 'rgba(74,222,128,0.08)', badgeText: '#4ade80' },
              ].map((m, i) => (
                <div key={i} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                    <span style={{ color: m.color }}>{m.icon}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif', marginBottom: 8 }}>{m.value}</div>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: m.badgeColor, color: m.badgeText, border: `1px solid ${m.badgeColor}` }}>{m.badge}</span>
                </div>
              ))}
            </div>

            {/* PO Table with working search + filter + batch ack */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* FIX: Search is now wired to filteredPOs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '7px 12px', border: '1px solid var(--border-subtle)' }}>
                  <Search size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Filter by PO ID…"
                    value={poSearch}
                    onChange={e => setPoSearch(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 12, width: '100%' }}
                  />
                  {poSearch && (
                    <button onClick={() => setPoSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0 }}><X size={12} /></button>
                  )}
                </div>
                {/* Status filter */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map(s => (
                    <button
                      key={s}
                      onClick={() => setPoStatusFilter(s)}
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                        background: poStatusFilter === s ? 'rgba(177,202,215,0.1)' : 'transparent',
                        color: poStatusFilter === s ? 'var(--accent-slate)' : 'var(--text-faint)',
                        border: `1px solid ${poStatusFilter === s ? 'rgba(177,202,215,0.2)' : 'transparent'}`,
                      }}
                    >{s}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 11 }}><Download size={12} /> Export</button>
                  {/* FIX: Batch acknowledgement is now wired */}
                  {pendingAck > 0 && (
                    <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={handleBatchAcknowledge}>
                      <Check size={12} /> Acknowledge all ({pendingAck})
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {!isMobile ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                        {['PO identifier', 'Date issued', 'Total value', 'Status', 'Tracking', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPOs.length === 0 ? (
                        <tr><td colSpan={6}><EmptyState icon={<Search size={24} />} title="No POs match your filter" subtitle="Try adjusting the search or status filter above." /></td></tr>
                      ) : filteredPOs.map((po: any) => (
                        <tr key={po.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s', cursor: 'pointer' }} onClick={() => setDrawerPO(po)}>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{po.id}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{po.items?.length || 0} LINE ITEMS</div>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{po.dateOfIssue}</td>
                          <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700 }}>${po.totalAmount?.toLocaleString()}</td>
                          <td style={{ padding: '13px 16px' }}><StatusPill status={!po.acknowledgedAt ? 'Pending Ack' : po.deliveryStatus} /></td>
                          <td style={{ padding: '13px 16px' }}>
                            {po.trackingNumber
                              ? <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent-slate)' }}>{po.trackingNumber}</span>
                              : <span style={{ opacity: 0.2 }}>—</span>}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {!po.acknowledgedAt && (
                                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 10 }} onClick={e => { e.stopPropagation(); acknowledgePO(po.id); }}>
                                  <Check size={11} /> Ack
                                </button>
                              )}
                              <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setDrawerPO(po)}>
                                <Eye size={11} /> Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredPOs.length === 0 ? (
                      <EmptyState icon={<Search size={24} />} title="No POs found" subtitle="No orders match your filter criteria." />
                    ) : filteredPOs.map((po: any) => (
                      <div
                        key={po.id}
                        onClick={() => setDrawerPO(po)}
                        style={{
                          padding: 16, borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex', flexDirection: 'column', gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{po.id}</div>
                          <StatusPill status={!po.acknowledgedAt ? 'Pending Ack' : po.deliveryStatus} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{po.dateOfIssue}</span>
                          <span style={{ fontWeight: 800 }}>${po.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>Details</button>
                          {!po.acknowledgedAt && (
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={e => { e.stopPropagation(); acknowledgePO(po.id); }}>
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PERFORMANCE ═════════════════════════════════════════════════ */}
        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Market position', value: '#14 Global', color: 'var(--accent-slate)', trend: '+3 spots', positive: true },
                { label: 'YoY growth', value: '24.2%', color: '#4ade80', trend: 'In-sector', positive: true },
                { label: 'Dispute rate', value: '0.4%', color: '#f87171', trend: 'Below threshold', positive: true },
                { label: 'Avg. lead time', value: '14.2 days', color: 'var(--accent-slate)', trend: '−1.2d improvement', positive: true },
              ].map((m, i) => (
                <div key={i} style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.positive ? '#4ade80' : '#f87171', fontWeight: 700, marginTop: 6 }}>{m.trend}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
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
                      {/* FIX: Threshold reference line added */}
                      <ReferenceLine y={95} stroke="rgba(233,193,118,0.3)" strokeDasharray="4 4" label={{ value: 'Min 95%', fill: 'var(--accent-amber)', fontSize: 10, position: 'insideTopRight' }} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="onTime" stroke="var(--accent-slate)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* FIX: Enhanced progress bars with thresholds and pass/fail indicators */}
                <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div className="card-header-label">PREFERRED STATUS CRITERIA</div>
                  <div style={{ marginTop: 20 }}>
                    <ProgressBar label="Fulfillment rate" value={98} total={100} threshold={95} />
                    <ProgressBar label="Response time" value={12} total={24} threshold={24} unit="h" />
                    <ProgressBar label="Quality pass rate" value={96} total={100} threshold={98} />
                    <ProgressBar label="Digital maturity" value={8} total={10} threshold={7} />
                  </div>
                </div>

                <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div className="card-header-label">DELAY TREND</div>
                  <div style={{ height: 140, marginTop: 12 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={deliveryHistory}>
                        <XAxis dataKey="month" stroke="var(--text-faint)" fontSize={10} axisLine={false} tickLine={false} />
                        <Line type="stepAfter" dataKey="delayed" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: '#f87171' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: 11 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FINANCIALS ════════════════════════════════════════════════════ */}
        {activeTab === 'financials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total outstanding', value: `$${totalOutstanding.toLocaleString()}`, color: 'var(--accent-amber)', icon: <Clock size={15} /> },
                { label: 'Settled this month', value: `$${releasedPayments.toLocaleString()}`, color: '#4ade80', icon: <DollarSign size={15} /> },
                { label: 'Average settlement', value: '28.4 days', color: 'var(--accent-slate)', icon: <CalendarIcon size={15} /> },
                { label: 'Early pay potential', value: `$${Math.round(totalOutstanding * 0.98).toLocaleString()}`, color: 'var(--accent-slate)', icon: <TrendingUp size={15} /> },
              ].map((m, i) => (
                <div key={i} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                    <span style={{ color: m.color }}>{m.icon}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Statement of account</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11 }}><Download size={12} /> Ledger PDF</button>
                  </div>
                </div>
                {myInvoices.length === 0 ? (
                  <EmptyState
                    icon={<ReceiptText size={28} />}
                    title="No invoices yet"
                    subtitle="Invoices will appear once a delivered PO is confirmed."
                    action={<button className="btn btn-primary" style={{ fontSize: 12 }}>Submit first invoice</button>}
                  />
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Document #', 'Type', 'Issue date', 'Due date', 'Amount', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myInvoices.map((inv: any) => (
                        <tr key={inv.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{inv.invoiceNumber}</td>
                          <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)' }}>SERVICE/GOODS</td>
                          <td style={{ padding: '12px 16px', fontSize: 12 }}>{inv.invoiceDate}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)' }}>{inv.dueDate}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>${inv.totalAmount?.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px' }}><StatusPill status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* FIX: Early payment has confirmation step before firing requestEarlyPayment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div className="card-header-label">EARLY PAYMENT PROTOCOL</div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, margin: '10px 0 16px' }}>Withdraw capital ahead of schedule by providing a dynamic discount to procurement authority.</p>
                  <div style={{ background: 'rgba(233,193,118,0.04)', border: '1px solid rgba(233,193,118,0.1)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-amber)', marginBottom: 4 }}>AVAILABLE FOR WITHDRAWAL</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>${Math.round(totalOutstanding * 0.98).toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: 'var(--accent-amber)', marginTop: 4, fontWeight: 600 }}>2% early access fee applied</div>
                  </div>
                  {!earlyPayConfirm ? (
                    <button
                      className="btn btn-primary"
                      disabled={totalOutstanding === 0}
                      style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                      onClick={() => setEarlyPayConfirm(true)}
                    >
                      Request early withdrawal
                    </button>
                  ) : (
                    <div style={{ padding: 14, background: 'rgba(233,193,118,0.05)', border: '1px solid rgba(233,193,118,0.15)', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-amber)', marginBottom: 8 }}>Confirm withdrawal?</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                        You will receive <strong style={{ color: '#fff' }}>${Math.round(totalOutstanding * 0.98).toLocaleString()}</strong> after the 2% fee. This action cannot be undone.
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11, justifyContent: 'center' }} onClick={() => setEarlyPayConfirm(false)}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1, fontSize: 11, justifyContent: 'center' }} onClick={() => {
                          const inv = myInvoices.find((i: any) => i.status !== 'Paid');
                          if (inv) requestEarlyPayment(inv.id, 2);
                          setEarlyPayConfirm(false);
                        }}>
                          <Check size={12} /> Confirm
                        </button>
                      </div>
                    </div>
                  )}
                  <p style={{ fontSize: 9, color: 'var(--text-faint)', textAlign: 'center', marginTop: 10 }}>Transfer takes approx. 4 billing hours.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TENDERS (BIDS) — FIX: Now accessible via nav ════════════════ */}
        {activeTab === 'bids' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Open opportunities', value: eligibleRFQs.length, color: 'var(--accent-slate)', badge: 'Live tenders' },
                { label: 'Active submissions', value: myBids.length, color: 'var(--accent-slate)', badge: 'In review' },
                { label: 'Rejected bids', value: myBids.filter((b: any) => b.status === 'Rejected').length, color: 'var(--accent-amber)', badge: 'Benchmark: 12%' },
                { label: 'Awards secured', value: myBids.filter((b: any) => b.status === 'Awarded').length, color: '#4ade80', badge: 'Revenue capture' },
              ].map((m, i) => (
                <div key={i} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif', marginBottom: 8 }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700 }}>{m.badge}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 10 }}>LIVE TENDERS</div>
                {eligibleRFQs.length === 0 ? (
                  <div style={{ padding: 36, textAlign: 'center', opacity: 0.5, background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                    <Inbox size={22} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--text-faint)' }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>No active tenders for your profile.</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>New opportunities will appear here as they're released.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {eligibleRFQs.map((rfq: any) => (
                      <div key={rfq.id} style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: 'rgba(177,202,215,0.08)', color: 'var(--accent-slate)' }}>{rfq.tenderType?.toUpperCase() || 'RFQ'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{rfq.id}</span>
                        </div>
                        <h4 style={{ margin: '0 0 8px', fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>{rfq.title}</h4>
                        <p style={{ margin: '0 0 14px', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{rfq.notes}</p>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 3 }}>DEADLINE</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-amber)' }}>{rfq.bidDeadline}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 3 }}>SCOPE</div>
                            <div style={{ fontSize: 12, fontWeight: 800 }}>{rfq.lineItems?.length || 0} line items</div>
                          </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', fontSize: 11, justifyContent: 'center' }}>Submit proposal</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 10 }}>SUBMISSION REGISTRY</div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                  {myBids.length === 0 ? (
                    <EmptyState icon={<Send size={22} />} title="No proposals submitted yet" subtitle="Submit a proposal on a live tender to see it here." />
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Proposal', 'Score', 'Status', ''].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: h === '' ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h.toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {myBids.map((bid: any) => (
                          <tr key={bid.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700 }}>{bid.id}</td>
                            <td style={{ padding: '12px 14px' }}>
                              {bid.evaluation ? <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-slate)' }}>{bid.evaluation.totalScore}</span> : <span style={{ opacity: 0.3, fontSize: 12 }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px' }}><StatusPill status={bid.status} /></td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 10 }} onClick={() => setActiveTab('communication' as PortalTab)}>
                                <MessageSquare size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ COMMUNICATION ════════════════════════════════════════════════ */}
        {activeTab === 'communication' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden', height: 600 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%' }}>
              <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12, fontWeight: 800 }}>Conversations</div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {myPOs.length === 0 ? (
                    <EmptyState icon={<MessageSquare size={22} />} title="No threads" subtitle="Message threads appear for each active PO." />
                  ) : myPOs.map((po: any) => (
                    <div
                      key={po.id}
                      onClick={() => setActiveMessageThread(po.id)}
                      style={{
                        padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer', background: activeMessageThread === po.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 800 }}>{po.id}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>10:45 AM</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Fulfillment update…</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                  {activeMessageThread ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                        <Lock size={13} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{activeMessageThread} — negotiation thread</div>
                        <div style={{ fontSize: 9, color: '#4ade80', fontWeight: 800, letterSpacing: '0.05em' }}>ENCRYPTED CHANNEL</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Select a thread to begin</div>
                  )}
                </div>

                <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {!activeMessageThread ? (
                    <div style={{ textAlign: 'center', paddingTop: 60, opacity: 0.2 }}>
                      <Lock size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 12, fontWeight: 700 }}>Select a thread to begin secure conversation</p>
                    </div>
                  ) : (
                    <>
                      {activeThreadMessages.length === 0 && (
                        <>
                          <div>
                            <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: '4px 12px 12px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', fontSize: 12, lineHeight: 1.6 }}>
                              Hello — could you confirm the lead time for item 3? We need delivery before May 15th.
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>Procurement team · 10:42 AM</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: '12px 4px 12px 12px', background: 'rgba(177,202,215,0.1)', border: '1px solid rgba(177,202,215,0.12)', fontSize: 12, lineHeight: 1.6 }}>
                              Confirmed — item 3 can be delivered by May 10. We'll send a revised schedule by EOD.
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>You · 11:05 AM</div>
                          </div>
                        </>
                      )}
                      {activeThreadMessages.map((msg: any, i: number) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'supplier' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '70%', padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
                            borderRadius: msg.sender === 'supplier' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                            background: msg.sender === 'supplier' ? 'rgba(177,202,215,0.1)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${msg.sender === 'supplier' ? 'rgba(177,202,215,0.12)' : 'var(--border-subtle)'}`,
                          }}>
                            {msg.message}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>{msg.sender === 'supplier' ? 'You' : 'Procurement team'}</div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder={activeMessageThread ? 'Type your message…' : 'Select a thread first'}
                    value={newMessage}
                    disabled={!activeMessageThread}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '8px 13px', fontSize: 12, outline: 'none', color: '#fff', fontWeight: 500, opacity: activeMessageThread ? 1 : 0.4, fontFamily: 'inherit' }}
                  />
                  <button className="btn btn-primary" style={{ padding: '0 16px' }} onClick={handleSendMessage} disabled={!activeMessageThread}>
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ COMPLIANCE ════════════════════════════════════════════════════ */}
        {activeTab === 'compliance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Valid documents', value: complianceDocs.filter((d: any) => d.status === 'Active').length, color: '#4ade80', badge: 'Verified' },
                { label: 'Expiring soon', value: expiringDocs.length, color: 'var(--accent-amber)', badge: expiringDocs.length > 0 ? 'Action needed' : 'All clear' },
                { label: 'Expired', value: expiredDocs.length, color: '#f87171', badge: expiredDocs.length > 0 ? 'Immediate action' : 'None' },
                { label: 'Trust rating', value: `${Math.round((complianceDocs.filter((d: any) => d.status === 'Active').length / Math.max(complianceDocs.length, 1)) * 100)}%`, color: 'var(--accent-slate)', badge: 'Calculated' },
              ].map((m, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif', marginBottom: 6 }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700 }}>{m.badge}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Document governance</h3>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>ISO certificates, licences, and legal instruments.</p>
              </div>
              <button className="btn btn-primary"><Upload size={13} /> Upload document</button>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
              {complianceDocs.length === 0 ? (
                <EmptyState icon={<ShieldCheck size={28} />} title="No documents uploaded" subtitle="Upload your ISO certifications, licences and legal instruments to maintain Preferred Supplier status." action={<button className="btn btn-primary" style={{ fontSize: 12 }}><Upload size={13} /> Upload first document</button>} />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                      {['Document', 'Category', 'Expiry date', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: h === '' ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {complianceDocs.map((doc: any) => (
                      <tr key={doc.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShieldCheck size={13} style={{ color: 'var(--accent-slate)' }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{doc.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{doc.category}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: doc.status === 'Expired' ? '#f87171' : doc.status === 'Expiring Soon' ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: doc.status !== 'Active' ? 700 : 400 }}>{doc.expiryDate}</td>
                        <td style={{ padding: '12px 16px' }}><StatusPill status={doc.status} /></td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button className="btn btn-ghost" style={{ padding: 5 }}><Download size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ═══ QUALITY ════════════════════════════════════════════════════════ */}
        {activeTab === 'quality' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Inspection pass rate', value: '98.2%', color: '#4ade80', icon: <CheckCircle2 size={14} /> },
                { label: 'Active disputes', value: disputes.filter((d: any) => d.status === 'Open').length, color: '#f87171', icon: <AlertTriangle size={14} /> },
                { label: 'Avg. variance', value: '1.4%', color: 'var(--accent-amber)', icon: <TrendingDown size={14} /> },
                { label: 'QC gates passed', value: '24', color: 'var(--accent-slate)', icon: <Activity size={14} /> },
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
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Goods receipt & inspection logs</h3>
              </div>
              {grns.filter((g: any) => g.supplierId === myData.id).length === 0 ? (
                <EmptyState icon={<FileCheck size={28} />} title="No GRN records" subtitle="Inspection logs will appear here once goods are received and inspected." />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['GRN ID', 'Received date', 'Passed qty', 'Rejected qty', 'QC status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: h === '' ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grns.filter((g: any) => g.supplierId === myData.id).map((grn: any) => {
                      const rejectedTotal = grn.lineItems.reduce((acc: number, item: any) => acc + (item.rejectedQty || 0), 0);
                      const passedTotal = grn.lineItems.reduce((acc: number, item: any) => acc + (item.receivedQty || 0), 0) - rejectedTotal;
                      return (
                        <tr key={grn.id} className="hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{grn.id}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{grn.dateCreated}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{passedTotal}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: rejectedTotal > 0 ? '#f87171' : 'var(--text-muted)' }}>{rejectedTotal}</td>
                          <td style={{ padding: '12px 16px' }}><StatusPill status={rejectedTotal > 0 ? 'QC Variance' : 'Approved'} /></td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {rejectedTotal > 0 && (
                              <button className="btn btn-ghost" style={{ fontSize: 10, color: '#f87171', padding: '4px 10px' }}>Dispute</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ═══ PRODUCT LIBRARY ════════════════════════════════════════════════ */}
        {activeTab === 'product-library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>Product portfolio</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{products.length} units listed</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
                  <Plus size={13} /> Add product
                </button>
              </div>
              {products.length === 0 ? (
                <EmptyState icon={<Package size={32} />} title="No products in portfolio" subtitle="Add your products to appear in procurement searches and RFQ matching." action={<button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setShowAddProduct(true)}><Plus size={13} /> Add first product</button>} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {products.map((product: any) => (
                    <div key={product.id} style={{ padding: 14, borderRadius: 'var(--radius-standard)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ width: '100%', height: 80, borderRadius: 9, background: 'var(--bg-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={24} style={{ color: 'var(--accent-slate)', opacity: 0.2 }} />
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-slate)', marginBottom: 2, letterSpacing: '0.05em' }}>{product.category}</div>
                      <div style={{ fontWeight: 800, fontSize: 13, fontFamily: 'Manrope, sans-serif', marginBottom: 3 }}>{product.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 12, fontFamily: 'monospace' }}>{product.sku}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>${product.basePrice?.toLocaleString()} <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 400 }}>/{product.unit}</span></span>
                        <button className="btn btn-ghost" style={{ padding: 4 }}><ExternalLink size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ACCOUNT / SETTINGS ════════════════════════════════════════════ */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px 28px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, background: 'rgba(177,202,215,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: 'var(--accent-slate)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                {myData.logo ? <img src={myData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (myData.name?.[0] || 'S')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>{myData.name}</h2>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>✓ VERIFIED</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Globe size={11} /> {myData.location || 'Global'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} /> {myData.contactList?.[0]?.email || myData.email || 'Not set'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-amber)' }}><Award size={11} /> Preferred partner</span>
                </div>
              </div>
              {/* FIX: Pass myData as prop to EditProfileModal to avoid desync */}
              <button className="btn btn-primary" onClick={() => setShowEditProfile(true)}><Edit2 size={13} /> Edit profile</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BUSINESS DOSSIER</h3>
                </div>
                <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Tax registration', value: myData.taxRegNumber },
                    { label: 'Legal entity type', value: 'Joint Stock Company' },
                    { label: 'Jurisdiction', value: myData.location },
                    { label: 'Registered address', value: myData.address },
                  ].map((f, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 5, letterSpacing: '0.06em' }}>{f.label.toUpperCase()}</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{f.value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SETTLEMENT PROTOCOL</h3>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ background: 'rgba(233,193,118,0.04)', borderRadius: 10, padding: 14, border: '1px solid rgba(233,193,118,0.1)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <DollarSign size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>Net 30 settlement</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>From invoice authorization date</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', color: 'var(--accent-slate)', flexShrink: 0 }}>
                <Lock size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Privacy & access centre</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Encryption protocols active. Last credential rotation: 3 months ago.</div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => setShowChangePassword(true)}>Rotate credentials</button>
            </div>

            {/* Personnel */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-standard)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AUTHORISED PERSONNEL</h3>
                <button className="btn btn-ghost" style={{ fontSize: 10 }}><UserPlus size={12} /> Add contact</button>
              </div>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {(myData.contactList || [
                  { name: 'John Smith', role: 'Sales director', email: 'john@portal.com' },
                  { name: 'Alina K.', role: 'Account manager', email: 'alina@portal.com' },
                  { name: 'Vince T.', role: 'Operations', email: 'vince@portal.com' }
                ]).map((contact: any, i: number) => (
                  <div key={i} style={{ padding: 12, borderRadius: 11, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(177,202,215,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent-slate)', flexShrink: 0 }}>
                      {contact.name?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{contact.role}</div>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: 4, flexShrink: 0 }}><Mail size={11} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PO DETAIL DRAWER ──────────────────────────────────────────────── */}
      {drawerPO && (
        <PODetailDrawer
          po={drawerPO}
          onClose={() => setDrawerPO(null)}
          onAcknowledge={acknowledgePO}
          onUpdateShipment={updateShipment}
          onSubmitInvoice={() => { setInvoicePO(drawerPO); setDrawerPO(null); }}
          isMobile={isMobile}
        />
      )}

      {/* ── INVOICE MODAL ─────────────────────────────────────────────────── */}
      {invoicePO && (
        <SubmitInvoiceModal
          po={invoicePO}
          onClose={() => setInvoicePO(null)}
          onSubmit={(data) => submitInvoice({ poId: invoicePO.id, supplierId: myData.id, ...data, totalAmount: invoicePO.totalAmount })}
        />
      )}

      {/* ── STANDALONE LOGOUT ─────────────────────────────────────────────── */}
      {standalone && (
        <button
          onClick={() => { supplierLogout(); router.push('/'); }}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 999,
            padding: '9px 18px', background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: 11,
            color: '#f87171', fontSize: 11, fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          <Lock size={13} /> Logout
        </button>
      )}

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} />}
      {/* FIX: Pass currentSupplier as prop to avoid desync with useApp() inside modal */}
      {showEditProfile && <EditProfileModal supplierData={myData} onClose={() => setShowEditProfile(false)} updateSupplierProfile={updateSupplierProfile} />}
      {showChangePassword && <ChangePasswordModal supplierData={myData} onClose={() => setShowChangePassword(false)} updateSupplierProfile={updateSupplierProfile} />}
    </div>
  );
}

// ─── Modal: Add Product ─────────────────────────────────────────────────────
function AddProductModal({ onClose }: { onClose: () => void }) {
  const { addProduct, uploadComplianceDoc, mySupplierId } = useApp() as any;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'Piping', description: '',
    basePrice: 0, unit: 'Piece', currency: 'USD', catalogueName: ''
  });

  const handleSubmit = () => {
    addProduct({
      name: formData.name, sku: formData.sku, category: formData.category,
      description: formData.description, basePrice: Number(formData.basePrice),
      unit: formData.unit, currency: formData.currency,
      technicalDocs: formData.catalogueName ? [`DOC-${Date.now()}`] : [], certifications: []
    });
    if (formData.catalogueName) {
      uploadComplianceDoc({ supplierId: mySupplierId, title: formData.catalogueName, category: 'Product Catalogue', expiryDate: '2027-12-31', fileSize: '2.4 MB' });
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)',
    color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'inherit'
  };

  return (
    <ModalShell title="Add product" onClose={onClose}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? 'var(--accent-slate)' : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
        ))}
      </div>
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Base price (USD)"><input type="number" placeholder="0.00" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} style={inputStyle} /></Field>
            <Field label="Unit"><input placeholder="e.g. Metric ton, Unit" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={inputStyle} /></Field>
          </div>
        </div>
      )}
      {step === 3 && (
        <div>
          <div style={{ padding: '28px 18px', border: '1px dashed var(--border-subtle)', borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <Upload size={24} style={{ color: 'var(--accent-slate)', opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Product catalogue (PDF)</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 14 }}>Enter filename to simulate upload</div>
            <input placeholder="catalogue_v1.pdf" value={formData.catalogueName} onChange={e => setFormData({ ...formData, catalogueName: e.target.value })} style={{ ...inputStyle, textAlign: 'center', width: '80%' }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        {step > 1 ? <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setStep(step - 1)}>Back</button> : <div />}
        {step < 3
          ? <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={12} /></button>
          : <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSubmit}><Check size={12} /> Add to portfolio</button>
        }
      </div>
    </ModalShell>
  );
}

// ─── Modal: Edit Profile — FIX: Takes supplierData as prop instead of calling useApp() ─
function EditProfileModal({ supplierData, onClose, updateSupplierProfile }: {
  supplierData: any; onClose: () => void; updateSupplierProfile: (id: string, data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: supplierData?.name || '',
    email: supplierData?.email || '',
    location: supplierData?.location || '',
    address: supplierData?.address || '',
    logo: supplierData?.logo || ''
  });
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)',
    color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'inherit'
  };
  return (
    <ModalShell title="Edit profile" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Legal entity name"><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></Field>
        <Field label="Logo URL"><input placeholder="https://…/logo.png" value={formData.logo} onChange={e => setFormData({ ...formData, logo: e.target.value })} style={inputStyle} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Contact email"><input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} /></Field>
          <Field label="Jurisdiction"><input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} /></Field>
        </div>
        <Field label="Registered address"><textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ ...inputStyle, resize: 'none' }} /></Field>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => { updateSupplierProfile(supplierData.id, formData); onClose(); }}>
          <Check size={12} /> Save changes
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Modal: Change Password — FIX: Takes supplierData as prop ──────────────
function ChangePasswordModal({ supplierData, onClose, updateSupplierProfile }: {
  supplierData: any; onClose: () => void; updateSupplierProfile: (id: string, data: any) => void;
}) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)',
    color: '#fff', fontSize: 13, outline: 'none', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'inherit'
  };

  const handleUpdate = () => {
    if (currentPass !== supplierData.passwordHash) { setError('Current password is incorrect.'); return; }
    if (newPass !== confirmPass) { setError('New passwords do not match.'); return; }
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    updateSupplierProfile(supplierData.id, { passwordHash: newPass });
    onClose();
  };

  return (
    <ModalShell title="Rotate credentials" onClose={onClose}>
      {error && (
        <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--accent-amber)', background: 'rgba(233,193,118,0.06)', border: '1px solid rgba(233,193,118,0.12)', borderRadius: 8, marginBottom: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Current password"><input type="password" value={currentPass} onChange={e => { setCurrentPass(e.target.value); setError(''); }} style={inputStyle} /></Field>
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />
        <Field label="New password"><input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setError(''); }} style={inputStyle} /></Field>
        <Field label="Confirm new password"><input type="password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(''); }} style={inputStyle} /></Field>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 22, fontSize: 12, justifyContent: 'center' }} onClick={handleUpdate}>
        <Lock size={12} /> Update password
      </button>
    </ModalShell>
  );
}

// ─── Shared helpers ─────────────────────────────────────────────────────────
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
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>{title}</h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4 }} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', marginBottom: 6, letterSpacing: '0.06em' }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}
