'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, FileText, File, Download, Eye, Wrench } from 'lucide-react';
import type { DocumentCategory } from '@/data/mockData';

const ALL_CATEGORIES: DocumentCategory[] = [
  'MTC', 'COO', 'BL/AWB', 'Delivery Note', 'Packing List', 'Invoice',
  'Internal Inspection Report', 'Work Completion Certificate', 'Service Report',
  'Timesheet', 'SLA Report',
];

const GOODS_CATEGORIES: DocumentCategory[] = [
  'MTC', 'COO', 'BL/AWB', 'Delivery Note', 'Packing List', 'Invoice', 'Internal Inspection Report',
];

const SERVICE_CATEGORIES: DocumentCategory[] = [
  'Work Completion Certificate', 'Service Report', 'Timesheet', 'SLA Report', 'Invoice',
];

const categoryColors: Record<DocumentCategory, string> = {
  MTC: '#6366f1',
  COO: '#06b6d4',
  'BL/AWB': '#f59e0b',
  'Delivery Note': '#10b981',
  'Packing List': '#8b5cf6',
  Invoice: '#f43f5e',
  'Internal Inspection Report': '#ec4899',
  'Work Completion Certificate': '#a78bfa',
  'Service Report': '#7c3aed',
  Timesheet: '#5b21b6',
  'SLA Report': '#4c1d95',
};

const isServiceCategory = (cat: DocumentCategory): boolean =>
  SERVICE_CATEGORIES.includes(cat);

export default function DocumentsPage() {
  const { documents, items, purchaseOrders } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [poFilter, setPOFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'goods' | 'services'>('all');

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.id.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || doc.category === categoryFilter;
      const matchPO = poFilter === 'All' || doc.poId === poFilter;
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'services' && isServiceCategory(doc.category)) ||
        (typeFilter === 'goods' && !isServiceCategory(doc.category));
      return matchSearch && matchCategory && matchPO && matchType;
    });
  }, [documents, search, categoryFilter, poFilter, typeFilter]);

  const uniquePOs = Array.from(new Set(documents.map(d => d.poId)));

  // Category stats — only show categories that have docs
  const categoryStats = ALL_CATEGORIES
    .map(cat => ({ category: cat, count: documents.filter(d => d.category === cat).length, color: categoryColors[cat], isService: isServiceCategory(cat) }))
    .filter(s => s.count > 0);

  const serviceDocCount = documents.filter(d => isServiceCategory(d.category)).length;
  const goodsDocCount = documents.length - serviceDocCount;

  return (
    <div>
      <div className="page-header">
        <h2>Document Management</h2>
        <p>Upload, categorize, and track procurement and service documents</p>
      </div>

      {/* Type tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
          All ({documents.length})
        </button>
        <button className={`tab-btn ${typeFilter === 'goods' ? 'active' : ''}`} onClick={() => setTypeFilter('goods')}>
          Goods Docs ({goodsDocCount})
        </button>
        <button className={`tab-btn ${typeFilter === 'services' ? 'active' : ''}`} onClick={() => setTypeFilter('services')}>
          <Wrench size={13} style={{ display: 'inline', marginRight: 4 }} />
          Service Docs ({serviceDocCount})
        </button>
      </div>

      {/* Category pill stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {categoryStats
          .filter(s => typeFilter === 'all' || (typeFilter === 'services' ? s.isService : !s.isService))
          .map(stat => (
            <button
              key={stat.category}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${categoryFilter === stat.category ? stat.color : 'var(--border-color)'}`,
                background: categoryFilter === stat.category ? `${stat.color}15` : 'var(--bg-card)',
                color: categoryFilter === stat.category ? stat.color : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              }}
              onClick={() => setCategoryFilter(prev => prev === stat.category ? 'All' : stat.category)}
            >
              {stat.isService && <Wrench size={10} />}
              {stat.category}
              <span style={{ fontWeight: 700, color: stat.color }}>{stat.count}</span>
            </button>
          ))}
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input type="text" className="search-input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          <optgroup label="── Goods Documents ──">
            {GOODS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="── Service Documents ──">
            {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
        <select className="filter-select" value={poFilter} onChange={e => setPOFilter(e.target.value)}>
          <option value="All">All POs</option>
          {uniquePOs.map(po => {
            const poObj = purchaseOrders.find(p => p.id === po);
            const hasSvc = poObj?.items.some(i => i.isService);
            return <option key={po} value={po}>{po}{hasSvc ? ' [SVC]' : ''}</option>;
          })}
        </select>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>PO</th>
                <th>Item / Service</th>
                <th>Upload Date</th>
                <th>Size</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const item = items.find(i => i.id === doc.itemId);
                const isSvcDoc = isServiceCategory(doc.category);
                const po = purchaseOrders.find(p => p.id === doc.poId);
                const isSvcPO = po?.items.some(i => i.isService);
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: `${categoryColors[doc.category]}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={16} style={{ color: categoryColors[doc.category] }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{doc.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${categoryColors[doc.category]}18`, color: categoryColors[doc.category] }}>
                        {isSvcDoc && <Wrench size={9} style={{ marginRight: 3 }} />}
                        {doc.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: isSvcPO ? '#a78bfa' : '#6366f1' }}>
                        {doc.poId}
                        {isSvcPO && <span style={{ marginLeft: 4, fontSize: 9, padding: '1px 4px', background: 'rgba(139,92,246,0.1)', borderRadius: 3 }}>SVC</span>}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {item?.category === 'Services' && <Wrench size={11} style={{ color: '#a78bfa' }} />}
                        {item?.name || doc.itemId}
                      </div>
                    </td>
                    <td>{doc.uploadDate}</td>
                    <td>{doc.fileSize}</td>
                    <td>
                      <span className="badge draft">
                        <File size={10} /> {doc.fileType}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" title="Preview"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" title="Download"><Download size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No documents found</h3>
            <p>Try adjusting your filters or upload a new document</p>
          </div>
        )}
      </div>
    </div>
  );
}
