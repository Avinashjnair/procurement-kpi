'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Search, Package, Wrench, CheckCircle2, Circle, Archive, ArchiveRestore, Plus, Download } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { exportCsv } from '@/utils/exportCsv';

const SUPPLIER_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#a78bfa'];

function ItemDetail({ itemId }: { itemId: string }) {
  const { items, suppliers, setSelectedItemId, archiveItem, unarchiveItem, addItemPriceHistory } = useApp();
  const item = items.find(i => i.id === itemId);
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [newDate,     setNewDate]     = useState(new Date().toISOString().slice(0,7));
  const [newPrice,    setNewPrice]    = useState('');
  const [newSupplier, setNewSupplier] = useState('');

  if (!item) return <p>Item not found.</p>;
  const isService = item.category === 'Services';
  const linkedSuppliers = suppliers.filter(s => item.linkedSupplierIds.includes(s.id));

  // Build multi-supplier overlay data
  const allDates = Array.from(new Set(item.priceHistory.map(p => p.date))).sort();
  const multiData = allDates.map(date => {
    const entry: Record<string, unknown> = { date };
    item.linkedSupplierIds.forEach(sid => {
      const point = item.priceHistory.filter(p => p.supplierId === sid && p.date <= date).slice(-1)[0];
      if (point) entry[sid] = point.price;
    });
    return entry;
  });
  const showMulti = item.linkedSupplierIds.length > 1 && multiData.length > 0;

  const handleAddPrice = () => {
    if (!newDate || !newPrice || !newSupplier) return;
    addItemPriceHistory(item.id, { date: newDate, price: parseFloat(newPrice), supplierId: newSupplier });
    setNewPrice(''); setShowAddPrice(false);
  };

  const handleExport = () => exportCsv(`item_${item.id}_price_history`, item.priceHistory.map(p => ({
    Date: p.date, Price: p.price, Supplier: suppliers.find(s => s.id === p.supplierId)?.name || p.supplierId,
  })));

  return (
    <div>
      <button className="detail-back" onClick={() => setSelectedItemId(null)}>
        <ArrowLeft size={16} /> Back to Items
      </button>

      <div className="page-header">
        <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
          <h2>{item.name}</h2>
          {isService && <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,background:'rgba(139,92,246,0.12)',color:'#a78bfa' }}><Wrench size={11} /> Service</span>}
          {item.archived && <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,background:'rgba(100,116,139,0.12)',color:'#94a3b8' }}><Archive size={11} /> Archived</span>}
        </div>
        <p>{item.category} · {item.id} · Current {isService ? 'Rate' : 'Price'}: ${item.currentPrice.toFixed(2)}/{item.unit}</p>
      </div>

      {/* Action bar */}
      <div style={{ display:'flex',gap:8,marginBottom:20,flexWrap:'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPrice(s => !s)}>
          <Plus size={13} /> {showAddPrice ? 'Cancel' : 'Log New Price'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleExport}><Download size={13} /> Export History</button>
        {item.archived
          ? <button className="btn btn-secondary btn-sm" onClick={() => unarchiveItem(item.id)}><ArchiveRestore size={13} /> Restore Item</button>
          : <button className="btn btn-ghost btn-sm" style={{ color:'var(--text-muted)' }} onClick={() => archiveItem(item.id)}><Archive size={13} /> Archive Item</button>
        }
      </div>

      {/* Add price form */}
      {showAddPrice && (
        <div style={{ padding:14,marginBottom:20,border:'1px solid rgba(99,102,241,0.2)',borderRadius:12,background:'rgba(99,102,241,0.04)' }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 2fr auto',gap:10,alignItems:'flex-end' }}>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Month</label>
              <input type="month" className="form-input" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">{isService ? 'Rate ($)' : 'Price ($)'}</label>
              <input type="number" className="form-input" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Supplier</label>
              <select className="form-select" value={newSupplier} onChange={e => setNewSupplier(e.target.value)}>
                <option value="">Select supplier</option>
                {linkedSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAddPrice} disabled={!newPrice || !newSupplier} style={{ whiteSpace:'nowrap' }}>
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      )}

      {/* Service details */}
      {isService && item.serviceDetails && (
        <div className="card" style={{ marginBottom:20,borderColor:'rgba(139,92,246,0.2)' }}>
          <div className="card-header">
            <div className="card-title" style={{ display:'flex',alignItems:'center',gap:8 }}>
              <Wrench size={15} style={{ color:'#a78bfa' }} /> Service Details
            </div>
            <span style={{ padding:'4px 12px',background:'rgba(139,92,246,0.1)',color:'#a78bfa',borderRadius:8,fontSize:12,fontWeight:600 }}>{item.serviceDetails.billingType}</span>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14 }}>
            <div><div style={{ fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:3 }}>Duration</div><div style={{ fontSize:14,color:'#f1f5f9' }}>{item.serviceDetails.duration}</div></div>
            <div><div style={{ fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:3 }}>SLA Terms</div><div style={{ fontSize:14,color:'#f1f5f9' }}>{item.serviceDetails.slaTerms}</div></div>
          </div>
          <div style={{ fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Scope of Work</div>
          <div style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,padding:'10px 14px',background:'rgba(99,102,241,0.04)',borderRadius:8,borderLeft:'3px solid rgba(139,92,246,0.4)' }}>{item.serviceDetails.scopeOfWork}</div>
          {item.serviceDetails.milestones && item.serviceDetails.milestones.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:8 }}>
                Milestones — <span style={{ color:'#a78bfa' }}>{item.serviceDetails.milestones.filter(m=>m.completed).length}/{item.serviceDetails.milestones.length} complete</span>
              </div>
              <div style={{ height:5,background:'rgba(99,102,241,0.1)',borderRadius:3,marginBottom:12,overflow:'hidden' }}>
                <div style={{ height:'100%',borderRadius:3,background:'var(--gradient-primary)',width:`${item.serviceDetails.milestones.filter(m=>m.completed).reduce((s,m)=>s+m.percentage,0)}%` }} />
              </div>
              {item.serviceDetails.milestones.map(ms => (
                <div key={ms.id} style={{ display:'grid',gridTemplateColumns:'20px 1fr 60px 80px',gap:10,alignItems:'center',padding:'7px 0',borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                  {ms.completed ? <CheckCircle2 size={15} style={{ color:'var(--accent-emerald)' }} /> : <Circle size={15} style={{ color:'var(--text-muted)' }} />}
                  <span style={{ fontSize:13,color:ms.completed ? 'var(--text-muted)' : 'var(--text-secondary)',textDecoration:ms.completed ? 'line-through' : 'none' }}>{ms.description}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:'#a78bfa',textAlign:'right' }}>{ms.percentage}%</span>
                  <span style={{ fontSize:11,color:'var(--text-muted)',textAlign:'right' }}>{ms.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked suppliers */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><div className="card-title">Linked {isService ? 'Service Providers' : 'Suppliers'}</div></div>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
          {linkedSuppliers.map(s => (
            <div key={s.id} className="supplier-kpi-tag" style={{ padding:'8px 14px',fontSize:13 }}>
              {s.name} · {s.kpis.paymentTerms} · {isService ? `${s.kpis.responseTime}h response` : s.kpis.deliveryTerms}
            </div>
          ))}
        </div>
      </div>

      <div className="charts-grid-equal">
        {/* Price / Rate history */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{isService ? 'Rate History' : 'Price History'}</div>
              <div className="card-subtitle">{showMulti ? 'Multi-supplier overlay' : 'Trend over time'}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            {showMulti ? (
              <LineChart data={multiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill:'#64748b',fontSize:11 }} />
                <YAxis tick={{ fill:'#64748b',fontSize:11 }} domain={['dataMin - 5','dataMax + 5']} />
                <Tooltip contentStyle={{ background:'#111827',border:'1px solid rgba(99,102,241,0.15)',borderRadius:10,fontSize:12 }} labelStyle={{ color:'#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize:11,color:'#94a3b8' }} />
                {item.linkedSupplierIds.map((sid, idx) => {
                  const sup = suppliers.find(s => s.id === sid);
                  return (
                    <Line key={sid} type="monotone" dataKey={sid} name={sup?.name.split(' ')[0] || sid}
                      stroke={SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length]} strokeWidth={2}
                      dot={{ r:3 }} activeDot={{ r:5 }} connectNulls />
                  );
                })}
              </LineChart>
            ) : (
              <LineChart data={item.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill:'#64748b',fontSize:11 }} />
                <YAxis tick={{ fill:'#64748b',fontSize:11 }} domain={['dataMin - 5','dataMax + 5']} />
                <Tooltip contentStyle={{ background:'#111827',border:'1px solid rgba(99,102,241,0.15)',borderRadius:10,fontSize:12 }} labelStyle={{ color:'#f1f5f9' }}
                  formatter={(v: any) => [`$${parseFloat(v).toFixed(2)}`, isService ? 'Rate' : 'Price']} />
                <Line type="monotone" dataKey="price" stroke={isService ? '#a78bfa' : '#06b6d4'} strokeWidth={2.5}
                  dot={{ r:4,fill:isService ? '#a78bfa' : '#06b6d4',strokeWidth:2,stroke:'#0a0e1a' }} activeDot={{ r:6 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Purchase history */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{isService ? 'Service History' : 'Purchase History'}</div>
              <div className="card-subtitle">{item.purchaseHistory.length} past {isService ? 'contracts' : 'purchases'}</div>
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Supplier</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>PO</th></tr></thead>
              <tbody>
                {item.purchaseHistory.map((rec, i) => (
                  <tr key={i}>
                    <td>{rec.date}</td>
                    <td>{rec.supplierName}</td>
                    <td>{rec.quantity}</td>
                    <td className="font-mono">${rec.unitPrice.toFixed(2)}</td>
                    <td className="font-mono">${rec.totalAmount.toLocaleString()}</td>
                    <td style={{ color:'#6366f1',fontWeight:600 }}>{rec.poId}</td>
                  </tr>
                ))}
                {item.purchaseHistory.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center',color:'var(--text-muted)',padding:20 }}>No history yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItemsPage() {
  const { items, suppliers, selectedItemId, setSelectedItemId } = useApp();
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('All');
  const [typeFilter,  setTypeFilter]  = useState<'all'|'goods'|'services'>('all');
  const [showArchived,setShowArchived]= useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(i => i.category)));
    return ['All', ...cats];
  }, [items]);

  const filtered = useMemo(() => items.filter(item => {
    const ms = item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'All' || item.category === catFilter;
    const mt = typeFilter === 'all' || (typeFilter === 'services' ? item.category === 'Services' : item.category !== 'Services');
    const ma = showArchived ? item.archived : !item.archived;
    return ms && mc && mt && ma;
  }), [items, search, catFilter, typeFilter, showArchived]);

  const svcCount    = items.filter(i => i.category === 'Services' && !i.archived).length;
  const goodsCount  = items.filter(i => i.category !== 'Services' && !i.archived).length;
  const archCount   = items.filter(i => i.archived).length;

  const handleExport = () => exportCsv('items', filtered.map(item => ({
    ID: item.id, Name: item.name, Category: item.category, Unit: item.unit,
    CurrentPrice: item.currentPrice, Archived: item.archived ? 'Yes' : 'No',
    LinkedSuppliers: item.linkedSupplierIds.map(sid => suppliers.find(s => s.id === sid)?.name || sid).join('; '),
    PurchaseCount: item.purchaseHistory.length,
  })));

  if (selectedItemId) return <ItemDetail itemId={selectedItemId} />;

  return (
    <div>
      <div className="page-header">
        <h2>Item &amp; Services Management</h2>
        <p>Master catalogue of procurement items and contracted services</p>
      </div>

      {/* Type tabs */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div className="tabs" style={{ marginBottom:0 }}>
          <button className={`tab-btn ${typeFilter==='all'?'active':''}`} onClick={() => setTypeFilter('all')}>All ({goodsCount + svcCount})</button>
          <button className={`tab-btn ${typeFilter==='goods'?'active':''}`} onClick={() => setTypeFilter('goods')}>Goods ({goodsCount})</button>
          <button className={`tab-btn ${typeFilter==='services'?'active':''}`} onClick={() => setTypeFilter('services')}>
            <Wrench size={12} style={{ display:'inline',marginRight:4 }} />Services ({svcCount})
          </button>
          {archCount > 0 && (
            <button className={`tab-btn ${showArchived?'active':''}`} onClick={() => setShowArchived(s => !s)}>
              <Archive size={12} style={{ display:'inline',marginRight:4 }} />Archived ({archCount})
            </button>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}><Download size={13} /> Export CSV</button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input type="text" className="search-input" placeholder="Search items or services..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Category</th><th>Unit</th>
                <th>Current Price / Rate</th><th>Linked Suppliers</th><th>History</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isService = item.category === 'Services';
                return (
                  <tr key={item.id} className="clickable" onClick={() => setSelectedItemId(item.id)}>
                    <td style={{ fontWeight:600,color:item.archived ? 'var(--text-muted)' : '#f1f5f9' }}>{item.id}</td>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ width:32,height:32,borderRadius:8,background:isService ? 'rgba(139,92,246,0.12)' : 'rgba(99,102,241,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          {isService ? <Wrench size={15} style={{ color:'#a78bfa' }} /> : <Package size={15} style={{ color:'#6366f1' }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight:500,color:item.archived ? 'var(--text-muted)' : '#f1f5f9',fontSize:13,textDecoration:item.archived ? 'line-through' : 'none' }}>{item.name}</div>
                          {isService && item.serviceDetails && <div style={{ fontSize:11,color:'var(--text-muted)' }}>{item.serviceDetails.billingType}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {isService
                        ? <span className="badge" style={{ background:'rgba(139,92,246,0.12)',color:'#a78bfa' }}>Services</span>
                        : <span className="badge approved">{item.category}</span>
                      }
                    </td>
                    <td>{item.unit}</td>
                    <td className="font-mono">${item.currentPrice.toFixed(2)}</td>
                    <td>{item.linkedSupplierIds.map(sid => suppliers.find(s => s.id === sid)?.name.split(' ')[0] || sid).join(', ')}</td>
                    <td>{item.purchaseHistory.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            {showArchived ? <Archive size={48} /> : typeFilter === 'services' ? <Wrench size={48} /> : <Package size={48} />}
            <h3>No {showArchived ? 'archived items' : typeFilter === 'services' ? 'services' : 'items'} found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
