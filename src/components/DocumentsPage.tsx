'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, FileText, File, Download, Eye, Wrench, AlertTriangle, Clock, Upload } from 'lucide-react';
import type { DocumentCategory } from '@/data/mockData';
import { exportCsv } from '@/utils/exportCsv';

const GOODS_CATS: DocumentCategory[] = ['MTC','COO','BL/AWB','Delivery Note','Packing List','Invoice','Internal Inspection Report'];
const SERVICE_CATS: DocumentCategory[] = ['Work Completion Certificate','Service Report','Timesheet','SLA Report','Invoice'];
const ALL_CATS: DocumentCategory[] = [...new Set([...GOODS_CATS, ...SERVICE_CATS])];

const catColor: Record<DocumentCategory, string> = {
  MTC:                           '#6366f1',
  COO:                           '#06b6d4',
  'BL/AWB':                      '#f59e0b',
  'Delivery Note':               '#10b981',
  'Packing List':                '#8b5cf6',
  Invoice:                       '#f43f5e',
  'Internal Inspection Report':  '#ec4899',
  'Work Completion Certificate': '#a78bfa',
  'Service Report':              '#7c3aed',
  Timesheet:                     '#5b21b6',
  'SLA Report':                  '#4c1d95',
};

function isSvcCat(c: DocumentCategory) { return SERVICE_CATS.includes(c); }

// Expiry status helper
function expiryStatus(expiryDate?: string): 'expired' | 'expiring' | 'ok' | 'none' {
  if (!expiryDate) return 'none';
  const today = new Date();
  const exp   = new Date(expiryDate);
  const days  = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0)   return 'expired';
  if (days <= 30) return 'expiring';
  return 'ok';
}

function ExpiryBadge({ date }: { date?: string }) {
  const status = expiryStatus(date);
  if (status === 'none' || status === 'ok') return null;
  const cfg = status === 'expired'
    ? { icon: <AlertTriangle size={10} />, label: `Expired ${date}`, bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' }
    : { icon: <Clock size={10} />, label: `Expires ${date}`, bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:cfg.bg,color:cfg.color,marginLeft:6 }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function DocumentsPage() {
  const { documents, items, purchaseOrders, addDocument, uploadNewDocVersion } = useApp();
  const [search,          setSearch]         = useState('');
  const [catFilter,       setCatFilter]      = useState('All');
  const [poFilter,        setPOFilter]       = useState('All');
  const [typeFilter,      setTypeFilter]     = useState<'all'|'goods'|'services'>('all');
  const [expiryFilter,    setExpiryFilter]   = useState<'all'|'expiring'|'expired'>('all');
  const [uploadModal,     setUploadModal]    = useState(false);
  const [newVersionTarget,setNewVersionTarget] = useState<string|null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => documents.filter(doc => {
    const ms   = doc.name.toLowerCase().includes(search.toLowerCase()) || doc.id.toLowerCase().includes(search.toLowerCase());
    const mc   = catFilter  === 'All' || doc.category === catFilter;
    const mp   = poFilter   === 'All' || doc.poId === poFilter;
    const mt   = typeFilter === 'all' || (typeFilter === 'services' ? isSvcCat(doc.category) : !isSvcCat(doc.category));
    const es   = expiryStatus(doc.expiryDate);
    const me   = expiryFilter === 'all' || expiryFilter === es;
    return ms && mc && mp && mt && me;
  }), [documents, search, catFilter, poFilter, typeFilter, expiryFilter]);

  const uniquePOs      = Array.from(new Set(documents.map(d => d.poId)));
  const expiredCount   = documents.filter(d => expiryStatus(d.expiryDate) === 'expired').length;
  const expiringCount  = documents.filter(d => expiryStatus(d.expiryDate) === 'expiring').length;
  const svcDocCount    = documents.filter(d => isSvcCat(d.category)).length;
  const goodsDocCount  = documents.length - svcDocCount;

  const handleExport = () => exportCsv('documents', filtered.map(d => ({
    ID: d.id, Name: d.name, Category: d.category, PO: d.poId,
    Item: items.find(i => i.id === d.itemId)?.name || d.itemId,
    UploadDate: d.uploadDate, FileSize: d.fileSize, FileType: d.fileType,
    ExpiryDate: d.expiryDate || '', Version: d.version || 1,
  })));

  // Quick upload of a new doc version
  const handleNewVersion = (originalId: string) => {
    const original = documents.find(d => d.id === originalId);
    if (!original) return;
    const newId  = `DOC-${String(documents.length + 1).padStart(3, '0')}`;
    const newVer = (original.version || 1) + 1;
    uploadNewDocVersion(originalId, {
      ...original,
      id:           newId,
      name:         original.name.replace(/(_v\d+)?\./, `_v${newVer}.`),
      uploadDate:   today,
      version:      newVer,
      supersededBy: undefined,
    });
    setNewVersionTarget(null);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Document Management</h2>
        <p>Upload, categorize, and track procurement and service documents</p>
      </div>

      {/* Expiry alert banners */}
      {expiredCount > 0 && (
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',marginBottom:12,borderRadius:10,background:'rgba(244,63,94,0.07)',border:'1px solid rgba(244,63,94,0.2)' }}>
          <AlertTriangle size={16} style={{ color:'#f43f5e',flexShrink:0 }} />
          <span style={{ fontSize:13,color:'#f43f5e',fontWeight:500 }}>
            {expiredCount} document{expiredCount > 1 ? 's have' : ' has'} expired and {expiredCount > 1 ? 'require' : 'requires'} renewal.
          </span>
          <button className="btn btn-sm" style={{ marginLeft:'auto',background:'rgba(244,63,94,0.1)',color:'#f43f5e',border:'1px solid rgba(244,63,94,0.3)' }} onClick={() => setExpiryFilter('expired')}>
            View expired
          </button>
        </div>
      )}
      {expiringCount > 0 && (
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',marginBottom:16,borderRadius:10,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)' }}>
          <Clock size={16} style={{ color:'#f59e0b',flexShrink:0 }} />
          <span style={{ fontSize:13,color:'#f59e0b',fontWeight:500 }}>
            {expiringCount} document{expiringCount > 1 ? 's expire' : ' expires'} within 30 days.
          </span>
          <button className="btn btn-sm" style={{ marginLeft:'auto',background:'rgba(245,158,11,0.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.3)' }} onClick={() => setExpiryFilter('expiring')}>
            View expiring
          </button>
        </div>
      )}

      {/* Type tabs */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div className="tabs" style={{ marginBottom:0 }}>
          <button className={`tab-btn ${typeFilter==='all'?'active':''}`}     onClick={() => setTypeFilter('all')}>All ({documents.length})</button>
          <button className={`tab-btn ${typeFilter==='goods'?'active':''}`}   onClick={() => setTypeFilter('goods')}>Goods ({goodsDocCount})</button>
          <button className={`tab-btn ${typeFilter==='services'?'active':''}`} onClick={() => setTypeFilter('services')}>
            <Wrench size={12} style={{ display:'inline',marginRight:4 }} />Services ({svcDocCount})
          </button>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}><Download size={13} /> Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setUploadModal(true)}><Upload size={13} /> Upload</button>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' }}>
        {ALL_CATS
          .filter(c => typeFilter==='all' || (typeFilter==='services' ? isSvcCat(c) : !isSvcCat(c)))
          .filter(c => documents.some(d => d.category === c))
          .map(c => (
            <button key={c} onClick={() => setCatFilter(p => p===c ? 'All' : c)}
              style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:500,border:`1px solid ${catFilter===c ? catColor[c] : 'var(--border-color)'}`,background:catFilter===c ? `${catColor[c]}15` : 'var(--bg-card)',color:catFilter===c ? catColor[c] : 'var(--text-secondary)',transition:'all 0.15s' }}>
              {isSvcCat(c) && <Wrench size={9} />}
              {c}
              <span style={{ fontWeight:700,color:catColor[c] }}>{documents.filter(d => d.category===c).length}</span>
            </button>
          ))}
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input type="text" className="search-input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          <optgroup label="── Goods ──">{GOODS_CATS.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
          <optgroup label="── Services ──">{SERVICE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
        </select>
        <select className="filter-select" value={poFilter} onChange={e => setPOFilter(e.target.value)}>
          <option value="All">All POs</option>
          {uniquePOs.map(po => {
            const hasSvc = purchaseOrders.find(p => p.id === po)?.items.some(i => i.isService);
            return <option key={po} value={po}>{po}{hasSvc ? ' [SVC]' : ''}</option>;
          })}
        </select>
        <select className="filter-select" value={expiryFilter} onChange={e => setExpiryFilter(e.target.value as typeof expiryFilter)}>
          <option value="all">All expiry</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th><th>Category</th><th>Version</th>
                <th>PO</th><th>Item / Service</th><th>Uploaded</th>
                <th>Expiry</th><th>Size</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const item    = items.find(i => i.id === doc.itemId);
                const po      = purchaseOrders.find(p => p.id === doc.poId);
                const isSvcPO = po?.items.some(i => i.isService);
                const es      = expiryStatus(doc.expiryDate);
                const isSuperseded = !!doc.supersededBy;

                return (
                  <tr key={doc.id} style={{ opacity: isSuperseded ? 0.5 : 1 }}>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:34,height:34,borderRadius:8,background:`${catColor[doc.category]}15`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <FileText size={15} style={{ color:catColor[doc.category] }} />
                        </div>
                        <div>
                          <div style={{ fontWeight:600,color: isSuperseded ? 'var(--text-muted)' : '#f1f5f9',fontSize:13 }}>
                            {doc.name}
                            {isSuperseded && <span style={{ marginLeft:6,fontSize:10,color:'var(--text-muted)' }}>(superseded)</span>}
                          </div>
                          <div style={{ fontSize:11,color:'var(--text-muted)' }}>{doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background:`${catColor[doc.category]}18`,color:catColor[doc.category] }}>
                        {isSvcCat(doc.category) && <Wrench size={9} style={{ marginRight:3 }} />}
                        {doc.category}
                      </span>
                    </td>
                    <td>
                      {doc.version
                        ? <span style={{ fontSize:12,fontWeight:700,color:doc.version > 1 ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>v{doc.version}</span>
                        : <span style={{ color:'var(--text-muted)',fontSize:12 }}>v1</span>
                      }
                    </td>
                    <td>
                      <span style={{ fontWeight:600,color:isSvcPO ? '#a78bfa' : '#6366f1' }}>
                        {doc.poId}{isSvcPO && <span style={{ marginLeft:4,fontSize:9,padding:'1px 4px',background:'rgba(139,92,246,0.1)',borderRadius:3 }}>SVC</span>}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                        {item?.category==='Services' && <Wrench size={11} style={{ color:'#a78bfa' }} />}
                        {item?.name || doc.itemId}
                      </div>
                    </td>
                    <td>{doc.uploadDate}</td>
                    <td>
                      {doc.expiryDate ? (
                        <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:12,color: es==='expired' ? '#f43f5e' : es==='expiring' ? '#f59e0b' : 'var(--text-secondary)' }}>
                          {es!=='none' && es!=='ok' && (es==='expired' ? <AlertTriangle size={11} /> : <Clock size={11} />)}
                          {doc.expiryDate}
                        </span>
                      ) : <span style={{ color:'var(--text-muted)',fontSize:12 }}>—</span>}
                    </td>
                    <td>{doc.fileSize}</td>
                    <td>
                      <div style={{ display:'flex',gap:5 }}>
                        <button className="btn btn-ghost btn-sm" title="Preview"><Eye size={13} /></button>
                        <button className="btn btn-ghost btn-sm" title="Download"><Download size={13} /></button>
                        {!isSuperseded && (
                          <button className="btn btn-ghost btn-sm" title="Upload new version" onClick={() => handleNewVersion(doc.id)}>
                            <Upload size={13} />
                          </button>
                        )}
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
