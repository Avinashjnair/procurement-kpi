'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/types';
import { Search, Package, TrendingDown, AlertTriangle, SlidersHorizontal, X, ArrowUpCircle, ArrowDownCircle, RotateCcw, PackageCheck, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { exportCsv } from '@/utils/exportCsv';

function StockStatusBadge({ current, reorder, max }: { current: number; reorder: number; max: number }) {
  if (current === 0)          return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>OUT OF STOCK</span>;
  if (current <= reorder)     return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>⚠ Low Stock</span>;
  if (current >= max * 0.85)  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>Max Stock</span>;
  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>In Stock</span>;
}

function StockBar({ current, reorder, max }: { current: number; reorder: number; max: number }) {
  const pct     = Math.min(100, (current / max) * 100);
  const rPct    = (reorder / max) * 100;
  const color   = current === 0 ? '#f43f5e' : current <= reorder ? '#f59e0b' : '#10b981';
  return (
    <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(99,102,241,0.08)', overflow: 'visible' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      {/* Reorder marker */}
      <div style={{ position: 'absolute', left: `${rPct}%`, top: -3, width: 2, height: 12, background: '#f59e0b', borderRadius: 1 }} title="Reorder point" />
    </div>
  );
}

// Adjust stock modal (manager only)
function AdjustModal({ stockItemId, itemName, current, onClose }: { stockItemId: string; itemName: string; current: number; onClose: () => void }) {
  const { adjustStock } = useApp();
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [qty, setQty]   = useState('');
  const [reason, setReason] = useState('');

  const handle = () => {
    const delta = type === 'add' ? parseInt(qty) : -parseInt(qty);
    adjustStock(stockItemId, delta, reason);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Adjust Stock — {itemName}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
          Current stock: <span style={{ color: 'var(--accent-indigo)' }}>{current}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['add','remove'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid ${type === t ? (t === 'add' ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)') : 'var(--border-color)'}`, background: type === t ? (t === 'add' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)') : 'var(--bg-card)', color: type === t ? (t === 'add' ? '#10b981' : '#f43f5e') : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {t === 'add' ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
              {t === 'add' ? 'Add Stock' : 'Remove Stock'}
            </button>
          ))}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input type="number" className="form-input" value={qty} onChange={e => setQty(e.target.value)} min="1" placeholder="Enter quantity" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Reason *</label>
          <input type="text" className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Physical count correction, damaged goods, etc." />
        </div>
        {qty && reason && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.05)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            New balance: <strong style={{ color: '#f1f5f9' }}>{Math.max(0, current + (type === 'add' ? parseInt(qty) : -parseInt(qty)))}</strong>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={!qty || !reason || parseInt(qty) <= 0}><SlidersHorizontal size={14} /> Apply Adjustment</button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { stockItems, stockMovements, items, currentUser } = useApp();
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [adjustItem,   setAdjustItem]   = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const categories = Array.from(new Set(stockItems.map(s => s.category)));

  const filtered = useMemo(() => stockItems.filter(s => {
    const ms = s.itemName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'All' || s.category === catFilter;
    const mst = statusFilter === 'All' ||
      (statusFilter === 'low' && s.currentStock <= s.reorderPoint && s.currentStock > 0) ||
      (statusFilter === 'out' && s.currentStock === 0) ||
      (statusFilter === 'ok'  && s.currentStock > s.reorderPoint);
    return ms && mc && mst;
  }), [stockItems, search, catFilter, statusFilter]);

  const adjustingItem = stockItems.find(s => s.id === adjustItem);

  const lowCount = stockItems.filter(s => s.currentStock <= s.reorderPoint && s.currentStock > 0).length;
  const outCount = stockItems.filter(s => s.currentStock === 0).length;

  const chartData = stockItems.map(s => ({
    name: s.itemName.split(' ').slice(0, 2).join(' '),
    stock: s.currentStock,
    reorder: s.reorderPoint,
    max: s.maxStock,
    color: s.currentStock === 0 ? '#f43f5e' : s.currentStock <= s.reorderPoint ? '#f59e0b' : '#10b981',
  }));

  // Movement history for selected item
  const itemMovements = selectedItem
    ? stockMovements.filter(m => m.stockItemId === selectedItem).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const movementTypeIcon = (t: string) => {
    switch(t) {
      case 'GRN': return <PackageCheck size={13} style={{ color: '#10b981' }} />;
      case 'Issue': return <ArrowDownCircle size={13} style={{ color: '#f43f5e' }} />;
      case 'Return': return <RotateCcw size={13} style={{ color: '#06b6d4' }} />;
      default: return <SlidersHorizontal size={13} style={{ color: '#f59e0b' }} />;
    }
  };

  const handleExport = () => exportCsv('inventory', filtered.map(s => ({
    ID: s.id, ItemID: s.itemId, Item: s.itemName, Category: s.category,
    Unit: s.unit, CurrentStock: s.currentStock, ReservedStock: s.reservedStock,
    AvailableStock: s.currentStock - s.reservedStock,
    ReorderPoint: s.reorderPoint, MaxStock: s.maxStock,
    Location: s.location, LastUpdated: s.lastUpdated, LastGRN: s.lastGRNId || '',
  })));

  return (
    <div>
      {adjustItem && adjustingItem && (
        <AdjustModal
          stockItemId={adjustItem}
          itemName={adjustingItem.itemName}
          current={adjustingItem.currentStock}
          onClose={() => setAdjustItem(null)}
        />
      )}

      <div className="page-header">
        <h2>Goods Inventory & Stock List</h2>
        <p>Real-time stock levels — inventory updated only after GRN approval</p>
      </div>

      {/* Alert banners */}
      {outCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 12, borderRadius: 10, background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <AlertTriangle size={16} style={{ color: '#f43f5e', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#f43f5e', fontWeight: 500 }}>{outCount} item{outCount !== 1 ? 's are' : ' is'} out of stock.</span>
          <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }} onClick={() => setStatusFilter('out')}>View</button>
        </div>
      )}
      {lowCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 16, borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <TrendingDown size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 500 }}>{lowCount} item{lowCount !== 1 ? 's are' : ' is'} below reorder level.</span>
          <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }} onClick={() => setStatusFilter('low')}>View</button>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total SKUs', value: stockItems.length, color: 'var(--accent-indigo)' },
          { label: 'In Stock', value: stockItems.filter(s => s.currentStock > s.reorderPoint).length, color: '#10b981' },
          { label: 'Low Stock', value: lowCount, color: '#f59e0b' },
          { label: 'Out of Stock', value: outCount, color: '#f43f5e' },
          { label: 'Total Units', value: stockItems.reduce((s, i) => s + i.currentStock, 0).toLocaleString(), color: '#06b6d4' },
        ].map(stat => (
          <div key={stat.label} className="metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Stock level chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Stock Levels vs Reorder Points</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['#10b981','In Stock'],['#f59e0b','Low Stock'],['#f43f5e','Out of Stock']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 200, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#f1f5f9' }} />
              <Bar dataKey="stock" name="Current Stock" radius={[5, 5, 0, 0]} barSize={28}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div className="filters-bar" style={{ flex: 1, margin: 0 }}>
          <div className="search-wrapper">
            <Search size={16} />
            <input type="text" className="search-input" placeholder="Search stock items..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="ok">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}><Download size={13} /> Export CSV</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Stock table */}
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th><th>Category</th><th>Location</th>
                  <th>Available</th><th>Reserved</th><th>Stock Level</th><th>Status</th>
                  {can(currentUser, 'adjust_inventory') && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(stock => {
                  const available = stock.currentStock - stock.reservedStock;
                  const isSelected = selectedItem === stock.id;
                  return (
                    <tr key={stock.id}
                      className="clickable"
                      onClick={() => setSelectedItem(s => s === stock.id ? null : stock.id)}
                      style={{ background: isSelected ? 'rgba(99,102,241,0.06)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{stock.itemName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stock.unit}</div>
                      </td>
                      <td><span className="badge approved">{stock.category}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{stock.location}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: available <= 0 ? '#f43f5e' : '#f1f5f9', fontSize: 15 }}>
                          {available.toLocaleString()}
                        </span>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>of {stock.currentStock} total</div>
                      </td>
                      <td style={{ color: stock.reservedStock > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{stock.reservedStock}</td>
                      <td style={{ minWidth: 120 }}>
                        <StockBar current={stock.currentStock} reorder={stock.reorderPoint} max={stock.maxStock} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                          <span>0</span><span>ROP:{stock.reorderPoint}</span><span>{stock.maxStock}</span>
                        </div>
                      </td>
                      <td>
                        <StockStatusBadge current={stock.currentStock} reorder={stock.reorderPoint} max={stock.maxStock} />
                      </td>
                      {can(currentUser, 'adjust_inventory') && (
                        <td onClick={e => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm" title="Adjust stock" onClick={() => setAdjustItem(stock.id)}>
                            <SlidersHorizontal size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movement history panel */}
        {selectedItem && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Movement History</div>
                <div className="card-subtitle">{stockItems.find(s => s.id === selectedItem)?.itemName}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedItem(null)}><X size={14} /></button>
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {itemMovements.map(mov => (
                <div key={mov.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(99,102,241,0.06)', alignItems: 'flex-start' }}>
                  <div style={{ paddingTop: 2, flexShrink: 0 }}>{movementTypeIcon(mov.movementType)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{mov.movementType}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: mov.quantity > 0 ? '#10b981' : '#f43f5e' }}>
                        {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mov.date} · {mov.referenceId}</div>
                    {mov.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{mov.notes}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Balance: <strong style={{ color: '#f1f5f9' }}>{mov.balanceAfter}</strong></div>
                  </div>
                </div>
              ))}
              {itemMovements.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No movements recorded</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
