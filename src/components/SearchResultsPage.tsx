'use client';
import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, Search, ExternalLink, Download, 
  Eye, FileCheck, AlertCircle, Filter, 
  ArrowRight, Landmark, Building2, User
} from 'lucide-react';
import type { AppDocument, DocumentCategory } from '@/types';

const catColor: Record<string, string> = {
  Invoice: '#f43f5e',
  'Payment Receipt': '#f43f5e',
  MTC: '#6366f1',
  COO: '#06b6d4',
  'BL/AWB': '#f59e0b',
  'Delivery Note': '#10b981',
  'Packing List': '#8b5cf6',
  'Compliance': '#10b981',
};

export default function SearchResultsPage() {
  const { 
    globalSearchQuery, documents, purchaseOrders, suppliers, 
    activePage, isSupplierPortal, setActivePage 
  } = useApp();

  const results = useMemo(() => {
    if (!globalSearchQuery) return [];
    
    const query = globalSearchQuery.toLowerCase();
    
    return documents.map(doc => {
      let score = 0;
      
      // Basic Text Match
      if (doc.name.toLowerCase().includes(query)) score += 10;
      if (doc.id.toLowerCase().includes(query)) score += 15;
      if (doc.poId.toLowerCase().includes(query)) score += 8;
      
      // Contextual Prioritization
      if (activePage === 'finance') {
        if (doc.category === 'Invoice' || doc.category === 'Payment Receipt') score += 20;
      } else if (isSupplierPortal) {
        if (['Trade License', 'VAT Certificate', 'ISO Certification'].includes(doc.category)) score += 20;
      } else {
        // Procurement preference
        if (['MTC', 'COO', 'Packing List', 'Delivery Note'].includes(doc.category)) score += 15;
      }

      // Metadata match (Supplier name from PO)
      const po = purchaseOrders.find(p => p.id === doc.poId);
      if (po?.supplierName.toLowerCase().includes(query)) score += 5;

      return { doc, score, po };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
  }, [globalSearchQuery, documents, purchaseOrders, activePage, isSupplierPortal]);

  if (!globalSearchQuery) return null;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
            <Search size={22} />
          </div>
          <div>
            <h2>Search Results</h2>
            <p>Showing {results.length} matches for "{globalSearchQuery}"</p>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ opacity: 0.3, marginBottom: 20 }}>
            <Search size={64} />
          </div>
          <h3>No documents found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '10px auto' }}>
            We couldn't find any documents matching your query. Try searching by PO#, Supplier Name, or Document type.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => useApp().setGlobalSearchQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {results.map(({ doc, score, po }, idx) => (
            <div key={doc.id} className="card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16,
              borderLeft: idx < 3 ? '4px solid var(--accent-indigo)' : undefined
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, 
                    background: `${catColor[doc.category] || 'var(--accent-slate)'}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: catColor[doc.category] || 'var(--accent-slate)'
                  }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.id} • {doc.fileSize}</div>
                  </div>
                </div>
                {idx < 3 && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-indigo)', background: 'rgba(124,148,160,0.1)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                    Top Match
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Category</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: catColor[doc.category] || 'var(--text-primary)' }}>{doc.category}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>PO Reference</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-indigo)' }}>{doc.poId}</div>
                </div>
              </div>

              {po && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '4px 8px' }}>
                  <Building2 size={12} />
                  <span>{po.supplierName}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                  <Eye size={14} /> Preview
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                  <Download size={14} /> Download
                </button>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => {
                  if (activePage === 'finance' && (doc.category === 'Invoice' || doc.category === 'Payment Receipt')) {
                    setActivePage('finance');
                  } else {
                    setActivePage('documents');
                  }
                }}>
                  <ExternalLink size={14} /> Source
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
