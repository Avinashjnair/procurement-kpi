'use client';
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, Package, Users, FileText, FolderOpen,
  Menu, X, Sun, Moon, Bell, AlertCircle, Clock,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',       label: 'Dashboard',        icon: LayoutDashboard, section: 'Overview' },
  { id: 'items',           label: 'Items & Services',  icon: Package,         section: 'Management' },
  { id: 'suppliers',       label: 'Suppliers',         icon: Users,           section: 'Management' },
  { id: 'purchase-orders', label: 'Purchase Orders',   icon: FileText,        section: 'Management' },
  { id: 'documents',       label: 'Documents',         icon: FolderOpen,      section: 'Management' },
];

export default function Sidebar() {
  const { activePage, setActivePage, setModalOpen, darkMode, toggleDarkMode,
          purchaseOrders, documents } = useApp();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen,  setNotifOpen]  = React.useState(false);

  // Apply dark/light class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode);
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'k' || e.key === 'K') { e.preventDefault(); setModalOpen('newPO'); }
      if (e.key === 'i' || e.key === 'I') { e.preventDefault(); setModalOpen('newItem'); }
      if (e.key === '/') { e.preventDefault(); document.querySelector<HTMLInputElement>('.search-input')?.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setModalOpen]);

  // Build notifications
  const today = new Date();
  const overduePOs = purchaseOrders.filter(po => {
    if (po.paymentStatus === 'Paid' || po.deliveryStatus === 'Cancelled') return false;
    return new Date(po.dueDate) < today;
  });
  const expiringDocs = documents.filter(doc => {
    if (!doc.expiryDate) return false;
    const days = Math.ceil((new Date(doc.expiryDate).getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 30;
  });
  const expiredDocs = documents.filter(doc => {
    if (!doc.expiryDate) return false;
    return new Date(doc.expiryDate) < today;
  });

  const notifCount = overduePOs.length + expiringDocs.length + expiredDocs.length;

  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Mobile hamburger */}
      <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📊</div>
            <div>
              <h1>ProcureIQ</h1>
              <span>KPI Tracker</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, sectionItems]) => (
            <React.Fragment key={section}>
              <div className="nav-section-title">{section}</div>
              {sectionItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => { setActivePage(item.id); setMobileOpen(false); }}>
                    <Icon />
                    {item.label}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer: Notifications + Dark mode toggle */}
        <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Notifications button */}
          <div style={{ position: 'relative' }}>
            <button
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', justifyContent: 'flex-start' }}
              onClick={() => setNotifOpen(o => !o)}>
              <Bell size={18} />
              Alerts
              {notifCount > 0 && (
                <span style={{ marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: 10, background: '#f43f5e', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {notifCount}
                </span>
              )}
            </button>

            {/* Notifications panel */}
            {notifOpen && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 12, boxShadow: 'var(--shadow-card)', maxHeight: 320, overflowY: 'auto', zIndex: 60 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Notifications</div>

                {notifCount === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>All clear — no alerts</p>
                )}

                {overduePOs.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                      Overdue POs ({overduePOs.length})
                    </div>
                    {overduePOs.slice(0, 3).map(po => (
                      <div key={po.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(99,102,241,0.06)', cursor: 'pointer' }}
                        onClick={() => { setActivePage('purchase-orders'); setNotifOpen(false); }}>
                        <AlertCircle size={13} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{po.id} — {po.supplierName.split(' ')[0]}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due {po.dueDate} · ${po.totalAmount.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                    {overduePOs.length > 3 && <div style={{ fontSize: 11, color: '#f43f5e', padding: '4px 0' }}>+{overduePOs.length - 3} more</div>}
                  </div>
                )}

                {expiredDocs.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                      Expired Docs ({expiredDocs.length})
                    </div>
                    {expiredDocs.slice(0, 3).map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(99,102,241,0.06)', cursor: 'pointer' }}
                        onClick={() => { setActivePage('documents'); setNotifOpen(false); }}>
                        <AlertCircle size={13} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{doc.name.substring(0, 24)}{doc.name.length > 24 ? '…' : ''}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expired {doc.expiryDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expiringDocs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                      Expiring Soon ({expiringDocs.length})
                    </div>
                    {expiringDocs.slice(0, 3).map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(99,102,241,0.06)', cursor: 'pointer' }}
                        onClick={() => { setActivePage('documents'); setNotifOpen(false); }}>
                        <Clock size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{doc.name.substring(0, 24)}{doc.name.length > 24 ? '…' : ''}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expires {doc.expiryDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark / light mode toggle */}
          <button
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', justifyContent: 'flex-start' }}
            onClick={toggleDarkMode}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Keyboard shortcuts hint */}
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Shortcuts</div>
            {[
              { key: 'K', label: 'New PO' },
              { key: 'I', label: 'New Item' },
              { key: '/', label: 'Search' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo)', fontFamily: 'monospace', border: '1px solid rgba(99,102,241,0.2)' }}>{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
