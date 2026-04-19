'use client';
import React, { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, Command, X, Bell, User, Settings, Info } from 'lucide-react';

export default function GlobalHeader() {
  const { 
    globalSearchQuery, setGlobalSearchQuery, 
    activePage, isSupplierPortal, currentUser, currentSupplier,
    isMobileSidebarOpen, setMobileSidebarOpen
  } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setGlobalSearchQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchQuery]);

  const getContextLabel = () => {
    if (isSupplierPortal) return 'Supplier Portal';
    if (activePage === 'finance' || activePage === 'budgets' || activePage === 'reports') return 'Finance Records';
    return 'Procurement Hub';
  };

  const getContextPlaceholder = () => {
    if (isSupplierPortal) return 'Search compliance docs, POs...';
    if (activePage === 'finance') return 'Search invoices, receipts, payments...';
    return 'Search MTCs, packing lists, POs...';
  };

  return (
    <header className="global-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <button 
          className="mobile-menu-toggle-btn"
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          style={{ 
            display: 'none', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px',
            color: 'var(--text-primary)',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isMobileSidebarOpen ? <X size={20} /> : <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
            <div style={{ width:18,height:2,background:'currentColor',borderRadius:1 }} />
            <div style={{ width:12,height:2,background:'currentColor',borderRadius:1 }} />
            <div style={{ width:18,height:2,background:'currentColor',borderRadius:1 }} />
          </div>}
        </button>

        <div className="search-container">
          <div className="search-icon-hint">
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="search-bar-input"
            placeholder={getContextPlaceholder()}
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
          />
          <div className="search-shortcut-hint">
            {globalSearchQuery ? (
              <button 
                onClick={() => setGlobalSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <X size={14} />
              </button>
            ) : (
              <>
                <kbd><Command size={10} style={{ marginRight: 2 }} />K</kbd>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {getContextLabel()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
            {isSupplierPortal ? currentSupplier?.name : currentUser?.name}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '8px', borderRadius: '10px' }}>
            <Bell size={18} />
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: '8px', borderRadius: '10px' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
