'use client';
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/types';
import {
  LayoutDashboard, Package, Users, FileText, FolderOpen,
  Menu, X, Sun, Moon, Bell, AlertCircle, Clock,
  Send, BarChart2, PackageCheck, Boxes, LogOut, ShieldCheck, Landmark, Wrench,
  Banknote, BarChart, BarChart3, Building2,
} from 'lucide-react';

const navItems: { id: string; label: string; icon: any; permission: string; section: string; accent?: string }[] = [
  { id: 'dashboard',       label: 'Operational Dashboard', icon: LayoutDashboard, permission: 'view_dashboard',        section: 'Core' },
  { id: 'portal',          label: 'Supplier Self-Service', icon: Building2,       permission: 'view_dashboard',        section: 'Core' },
  { id: 'items',           label: 'Materials & Services',  icon: Boxes,           permission: 'view_items',            section: 'Procurement' },
  { id: 'suppliers',       label: 'Suppliers',           icon: Users,           permission: 'view_suppliers',        section: 'Catalogue' },
  { id: 'rfq',             label: 'RFQ / PR',            icon: Send,            permission: 'view_rfqs',             section: 'Sourcing' },
  { id: 'quotations',      label: 'Quotations',          icon: BarChart2,       permission: 'view_quotations',       section: 'Sourcing' },
  { id: 'purchase-orders', label: 'Purchase Orders',     icon: FileText,        permission: 'view_pos',              section: 'Procurement' },
  { id: 'invoices',        label: 'Invoices',            icon: FolderOpen,      permission: 'view_pos',              section: 'Procurement' },
  { id: 'grn',             label: 'Goods Receipt',       icon: PackageCheck,    permission: 'view_grn',              section: 'Procurement' },
  { id: 'inventory',       label: 'Inventory',           icon: Boxes,           permission: 'view_inventory',        section: 'Procurement' },
  { id: 'blanket-pos',     label: 'Blanket POs',         icon: FileText,        permission: 'view_pos',              section: 'Procurement' },
  { id: 'assets',          label: 'Fixed Assets',        icon: Landmark,        permission: 'view_assets',           section: 'Procurement' },
  { id: 'contracts',       label: 'Contracts',           icon: ShieldCheck,     permission: 'view_suppliers',        section: 'Procurement' },
  { id: 'budgets',         label: 'Budget Envelopes',    icon: Landmark,        permission: 'view_dashboard',        section: 'Finance' },
  { id: 'finance',         label: 'Finance & Payments',  icon: Banknote,        permission: 'view_payments',         section: 'Finance' },
  { id: 'analytics',       label: 'Spend Analytics',     icon: BarChart,        permission: 'view_dashboard',        section: 'Finance' },
  { id: 'reports',         label: 'Executive KPI Reports', icon: BarChart3,       permission: 'view_finance_reports',  section: 'Finance' },
  { id: 'notifications',   label: 'Alerts & rules',      icon: Bell,            permission: 'view_dashboard',        section: 'Records' },
  { id: 'documents',       label: 'Documents',           icon: FolderOpen,      permission: 'view_documents',        section: 'Records' },
];

const ROLE_COLORS: Record<string, string> = {
  manager:  '#b1cad7',
  engineer: '#7c94a0',
  finance:  '#e9c176',
};

const ROLE_LABELS: Record<string, string> = {
  manager:  'Manager',
  engineer: 'Engineer',
  finance:  'Finance',
};

export default function Sidebar() {
  const {
    activePage, setActivePage, setModalOpen, darkMode, toggleDarkMode,
    currentUser, logout, notifications, markNotificationRead, markAllNotificationsRead,
    isSupplierPortal, setSupplierPortal
  } = useApp();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen,  setNotifOpen]  = React.useState(false);
  const [shortcutOpen, setShortcutOpen] = React.useState(false);

  // Synchronize CSS class for light mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (darkMode) {
        html.classList.remove('light-mode');
      } else {
        html.classList.add('light-mode');
      }
    }
  }, [darkMode]);


  const unreadNotifications = notifications.filter(n => !n.read);
  const notifCount = unreadNotifications.length;

  const visibleNavItems = navItems.filter(item => can(currentUser, item.permission));
  const grouped = visibleNavItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const roleColor = currentUser ? (ROLE_COLORS[currentUser.role] || '#6366f1') : '#6366f1';

  return (
    <>
      <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon" style={{ background: 'var(--gradient-primary)' }}>📊</div>
            <div><h1>ProcureIQ</h1><span>Stealth OS</span></div>
          </div>
        </div>

        {currentUser && (
          <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: `${roleColor}08`, border: `1px solid ${roleColor}18` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${roleColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: roleColor, flexShrink: 0 }}>
                {currentUser.avatarInitials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name.split(' ')[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.department}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, background: `${roleColor}18`, color: roleColor, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                <ShieldCheck size={9} />{ROLE_LABELS[currentUser.role] || currentUser.role}
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, sectionItems]) => (
            <React.Fragment key={section}>
              <div className="nav-section-title">{section}</div>
              {sectionItems.map(item => {
                const Icon = item.icon;
                const isFinance  = item.id === 'finance';
                const isReports  = item.id === 'reports';
                const accent = isFinance ? 'var(--accent-amber)' : isReports ? 'var(--accent-slate)' : undefined;
                return (
                  <button key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => { setActivePage(item.id); setMobileOpen(false); }}
                    style={accent && activePage !== item.id ? { color: accent } : undefined}>
                    <Icon style={accent && activePage !== item.id ? { color: accent } : undefined} />
                    {item.label}
                    {item.id === 'notifications' && notifCount > 0 && (
                      <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: 'var(--accent-rose)', color: '#000', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{notifCount}</span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-item-wrapper">
            <button 
              className="footer-action-btn"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell size={16} /> Alerts
              {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
            </button>
            
            {notifOpen && (
              <div className="notification-panel">
                <div className="panel-header">System Notifications</div>
                {notifCount === 0 && <div className="empty-notif">No unread alerts</div>}
                
                {notifCount > 0 && (
                  <div className="notif-section">
                    <div className="notif-section-title danger">Action Required</div>
                    {unreadNotifications.map(n => (
                      <div key={n.id} className="notif-row" onClick={() => { markNotificationRead(n.id); setActivePage('notifications'); setNotifOpen(false); }}>
                        <div className="notif-details">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-meta">{n.source} • {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => { setActivePage('notifications'); setNotifOpen(false); }}
                >
                  See all notifications
                </button>
              </div>
            )}
          </div>

          <button className="footer-action-btn" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light Theme' : 'Dark Theme'}
          </button>

          <button 
            className="footer-action-btn" 
            style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.15)' }}
            onClick={logout}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
