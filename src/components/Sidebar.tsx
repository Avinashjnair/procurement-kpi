'use client';
import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  FolderOpen,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { id: 'items', label: 'Items', icon: Package, section: 'Management' },
  { id: 'suppliers', label: 'Suppliers', icon: Users, section: 'Management' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: FileText, section: 'Management' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, section: 'Management' },
];

export default function Sidebar() {
  const { activePage, setActivePage } = useApp();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📊</div>
            <div>
              <h1>ProcureIQ</h1>
              <span>KPI Tracker</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, sectionItems]) => (
            <React.Fragment key={section}>
              <div className="nav-section-title">{section}</div>
              {sectionItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileOpen(false);
                    }}
                  >
                    <Icon />
                    {item.label}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>
      </aside>
    </>
  );
}
