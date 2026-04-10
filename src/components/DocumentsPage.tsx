'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search,
  FileText,
  File,
  Download,
  Eye,
} from 'lucide-react';
import type { DocumentCategory } from '@/data/mockData';

const DOC_CATEGORIES: DocumentCategory[] = [
  'MTC',
  'COO',
  'BL/AWB',
  'Delivery Note',
  'Packing List',
  'Invoice',
  'Internal Inspection Report',
];

const categoryColors: Record<DocumentCategory, string> = {
  MTC: '#6366f1',
  COO: '#06b6d4',
  'BL/AWB': '#f59e0b',
  'Delivery Note': '#10b981',
  'Packing List': '#8b5cf6',
  Invoice: '#f43f5e',
  'Internal Inspection Report': '#ec4899',
};

export default function DocumentsPage() {
  const { documents, items, purchaseOrders } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [poFilter, setPOFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.id.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || doc.category === categoryFilter;
      const matchPO = poFilter === 'All' || doc.poId === poFilter;
      return matchSearch && matchCategory && matchPO;
    });
  }, [documents, search, categoryFilter, poFilter]);

  const uniquePOs = Array.from(new Set(documents.map(d => d.poId)));

  // Group by category for stats
  const categoryStats = DOC_CATEGORIES.map(cat => ({
    category: cat,
    count: documents.filter(d => d.category === cat).length,
    color: categoryColors[cat],
  }));

  return (
    <div>
      <div className="page-header">
        <h2>Document Management</h2>
        <p>Upload, categorize, and track procurement documents</p>
      </div>

      {/* Category Stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categoryStats.map(stat => (
          <button
            key={stat.category}
            className="kpi-item"
            style={{
              flex: '1 1 120px',
              cursor: 'pointer',
              borderColor: categoryFilter === stat.category ? stat.color : undefined,
            }}
            onClick={() => setCategoryFilter(prev => prev === stat.category ? 'All' : stat.category)}
          >
            <div className="kpi-item-value" style={{ color: stat.color, fontSize: '20px' }}>
              {stat.count}
            </div>
            <div className="kpi-item-label" style={{ fontSize: '10px' }}>{stat.category}</div>
          </button>
        ))}
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {DOC_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={poFilter}
          onChange={e => setPOFilter(e.target.value)}
        >
          <option value="All">All POs</option>
          {uniquePOs.map(po => (
            <option key={po} value={po}>{po}</option>
          ))}
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
                <th>Item</th>
                <th>Upload Date</th>
                <th>Size</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const item = items.find(i => i.id === doc.itemId);
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: `${categoryColors[doc.category]}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={16} style={{ color: categoryColors[doc.category] }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '13px' }}>{doc.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${categoryColors[doc.category]}18`,
                          color: categoryColors[doc.category],
                        }}
                      >
                        {doc.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#6366f1' }}>{doc.poId}</td>
                    <td>{item?.name || doc.itemId}</td>
                    <td>{doc.uploadDate}</td>
                    <td>{doc.fileSize}</td>
                    <td>
                      <span className="badge draft">
                        <File size={10} />
                        {doc.fileType}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" title="Preview">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Download">
                          <Download size={14} />
                        </button>
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
