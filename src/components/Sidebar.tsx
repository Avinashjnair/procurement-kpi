'use client';
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/types';
import {
  LayoutDashboard, Package, Users, FileText, FolderOpen,
  Menu, X, Sun, Moon, Bell, AlertCircle, Clock,
  Send, BarChart2, PackageCheck, Boxes, LogOut, ShieldCheck,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',       label: 'Dashboard',       icon: LayoutDashboard, permission: 'view_dashboard', section: 'Overview' },
  { id: 'items',           label: 'Items & Services', icon: Package,         permission: 'view_items',     section: 'Catalogue' },
  { id: 'suppliers',       label: 'Suppliers',        icon: Users,           permission: 'view_suppliers', section: 'Catalogue' },
  { id: 'rfq',             label: 'RFQ / PR',         icon: Send,            permission: 'view_rfqs',      section: 'Sourcing' },
  { id: 'quotations',      label: 'Quotations',       icon: BarChart2,       permission: 'view_quotations',section: 'Sourcing' },
  { id: 'purchase-orders', label: 'Purchase Orders',  icon: FileText,        permission: 'view_pos',       section: 'Procurement' },
  { id: 'grn',             label: 'Goods Receipt',    icon: PackageCheck,    permission: 'view_grn',       section: 'Procurement' },
  { id: 'inventory',       label: 'Inventory',        icon: Boxes,           permission: 'view_inventory', section: 'Procurement' },
  { id: 'documents',       label: 'Documents',        icon: FolderOpen,      permission: 'view_documents', section: 'Records' },
];

export default function Sidebar() {
  const { activePage, setActivePage, setModalOpen, darkMode, toggleDarkMode, currentUser, logout,
          purchaseOrders, documents, grns } = useApp();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen,  setNotifOpen]  = React.useState(false);

  useEffect(() => { document.documentElement.classList.toggle('light-mode', !darkMode); }, [darkMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'k') { e.preventDefault(); setModalOpen('newPO'); }
      if (e.key === 'i') { e.preventDefault(); setModalOpen('newItem'); }
      if (e.key === '/') { e.preventDefault(); document.querySelector<HTMLInputElement>('.search-input')?.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setModalOpen]);

  const today = new Date();
  const overduePOs    = purchaseOrders.filter(po => po.paymentStatus !== 'Paid' && po.deliveryStatus !== 'Cancelled' && new Date(po.dueDate) < today);
  const pendingGRNs   = grns.filter(g => g.status === 'Submitted');
  const pendingPOs    = currentUser?.role === 'manager' ? purchaseOrders.filter(po => po.deliveryStatus === 'Draft') : [];
  const expiringDocs  = documents.filter(doc => { if (!doc.expiryDate) return false; const days = Math.ceil((new Date(doc.expiryDate).getTime() - today.getTime()) / 86400000); return days >= 0 && days <= 30; });
  const expiredDocs   = documents.filter(doc => doc.expiryDate && new Date(doc.expiryDate) < today);

  const notifCount = overduePOs.length + expiringDocs.length + expiredDocs.length + pendingGRNs.length + pendingPOs.length;

  const visibleNavItems = navItems.filter(item => can(currentUser, item.permission));
  const grouped = visibleNavItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <>
      <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📊</div>
            <div><h1>ProcureIQ</h1><span>KPI Tracker</span></div>
          </div>
        </div>

        {/* Current user info */}
        {currentUser && (
          <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.08)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: currentUser.role === 'manager' ? 'rgba(99,102,241,0.15)' : 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: currentUser.role === 'manager' ? '#6366f1' : '#06b6d4', flexShrink: 0 }}>
                {currentUser.avatarInitials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name.split(' ')[0]}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <ShieldCheck size={9} style={{ color: currentUser.role === 'manager' ? '#6366f1' : '#06b6d4' }} />
                  <span style={{ fontSize: 10, color: currentUser.role === 'manager' ? '#6366f1' : '#06b6d4', fontWeight: 600, textTransform: 'capitalize' }}>{currentUser.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, sectionItems]) => (
            <React.Fragment key={section}>
              <div className="nav-section-title">{section}</div>
              {sectionItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => { setActivePage(item.id); setMobileOpen(false); }}>
                    <Icon />{item.label}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}
              onClick={() => setNotifOpen(o => !o)}>
              <Bell size={16} /> Alerts
              {notifCount > 0 && <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: '#f43f5e', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{notifCount}</span>}
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 12, boxShadow: 'var(--shadow-card)', maxHeight: 320, overflowY: 'auto', zIndex: 60 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Notifications</div>
                {notifCount === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>All clear</p>}
                {pendingPOs.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>POs Awaiting Approval ({pendingPOs.length})</div>
                    {pendingPOs.slice(0,3).map(po => (
                      <div key={po.id} style={{ fontSize: 12, color: '#f1f5f9', padding: '4px 0', cursor: 'pointer', borderBottom: '1px solid rgba(99,102,241,0.06)' }} onClick={() => { setActivePage('purchase-orders'); setNotifOpen(false); }}>
                        {po.id} · {po.supplierName.split(' ')[0]} · ${po.totalAmount.toLocaleString()}
                      </div>
                    ))}
                  </div>
                )}
                {pendingGRNs.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>GRNs Pending Approval ({pendingGRNs.length})</div>
                    {pendingGRNs.slice(0,3).map(g => (
                      <div key={g.id} style={{ fontSize: 12, color: '#f1f5f9', padding: '4px 0', cursor: 'pointer', borderBottom: '1px solid rgba(99,102,241,0.06)' }} onClick={() => { setActivePage('grn'); setNotifOpen(false); }}>
                        {g.id} · {g.supplierName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )}
                {overduePOs.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Overdue POs ({overduePOs.length})</div>
                    {overduePOs.slice(0,3).map(po => (
                      <div key={po.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer', borderBottom: '1px solid rgba(99,102,241,0.06)' }} onClick={() => { setActivePage('purchase-orders'); setNotifOpen(false); }}>
                        <AlertCircle size={11} style={{ color: '#f43f5e', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#f1f5f9' }}>{po.id} · Due {po.dueDate}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(expiredDocs.length + expiringDocs.length) > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Document Alerts ({expiredDocs.length + expiringDocs.length})</div>
                    {[...expiredDocs, ...expiringDocs].slice(0,3).map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer' }} onClick={() => { setActivePage('documents'); setNotifOpen(false); }}>
                        <Clock size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#f1f5f9' }}>{doc.name.substring(0,24)}{doc.name.length > 24 ? '…' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark mode */}
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}
            onClick={toggleDarkMode}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Logout */}
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(244,63,94,0.2)', background: 'transparent', color: '#f43f5e', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}
            onClick={logout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
