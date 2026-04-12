'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Search, Package, Wrench, CheckCircle2, Circle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function ServiceBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.3px' }}>
      <Wrench size={10} /> Service
    </span>
  );
}

function ItemDetail({ itemId }: { itemId: string }) {
  const { items, suppliers, setSelectedItemId } = useApp();
  const item = items.find(i => i.id === itemId);
  if (!item) return <p>Item not found.</p>;

  const isService = item.category === 'Services';
  const linkedSuppliers = suppliers.filter(s => item.linkedSupplierIds.includes(s.id));

  return (
    <div>
      <button className="detail-back" onClick={() => setSelectedItemId(null)}>
        <ArrowLeft size={16} /> Back to Items
      </button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>{item.name}</h2>
          {isService && <ServiceBadge />}
        </div>
        <p>
          {item.category} · {item.id} · Current {isService ? 'Rate' : 'Price'}: ${item.currentPrice.toFixed(2)}/{item.unit}
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{item.description}</p>
      </div>

      {/* ── Service Details Panel ── */}
      {isService && item.serviceDetails && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(139,92,246,0.2)' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={16} style={{ color: '#a78bfa' }} /> Service Details
              </div>
              <div className="card-subtitle">Contract and SLA information</div>
            </div>
            <span style={{ padding: '4px 12px', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
              {item.serviceDetails.billingType}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Duration</div>
              <div style={{ fontSize: 14, color: '#f1f5f9' }}>{item.serviceDetails.duration}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Billing Type</div>
              <div style={{ fontSize: 14, color: '#f1f5f9' }}>{item.serviceDetails.billingType}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Scope of Work</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px', background: 'rgba(99,102,241,0.04)', borderRadius: 8, borderLeft: '3px solid rgba(139,92,246,0.4)' }}>
              {item.serviceDetails.scopeOfWork}
            </div>
          </div>

          <div style={{ marginBottom: item.serviceDetails.milestones ? 16 : 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>SLA Terms</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {item.serviceDetails.slaTerms}
            </div>
          </div>

          {/* Milestone tracker */}
          {item.serviceDetails.milestones && item.serviceDetails.milestones.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                Milestones
                <span style={{ marginLeft: 8, color: '#a78bfa', fontWeight: 700 }}>
                   {item.serviceDetails.milestones.filter(m => m.completed).length}/{item.serviceDetails.milestones.length} complete
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, background: 'rgba(99,102,241,0.1)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 3,
                  background: 'var(--gradient-primary)',
                  width: `${item.serviceDetails.milestones.filter(m => m.completed).reduce((s, m) => s + m.percentage, 0)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              {item.serviceDetails.milestones.map((ms) => (
                <div key={ms.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr 60px 80px',
                  gap: 10,
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(99,102,241,0.06)',
                }}>
                  {ms.completed
                    ? <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
                    : <Circle size={16} style={{ color: 'var(--text-muted)' }} />
                  }
                  <span style={{ fontSize: 13, color: ms.completed ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: ms.completed ? 'line-through' : 'none' }}>
                    {ms.description}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', textAlign: 'right' }}>{ms.percentage}%</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{ms.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked Suppliers */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Linked {isService ? 'Service Providers' : 'Suppliers'}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {linkedSuppliers.map(s => (
            <div key={s.id} className="supplier-kpi-tag" style={{ padding: '8px 14px', fontSize: 13 }}>
              {s.name} · {s.kpis.paymentTerms} · {isService ? `${s.kpis.responseTime}h response` : s.kpis.deliveryTerms}
            </div>
          ))}
        </div>
      </div>

      {/* Price / Rate History chart — only for items with meaningful history */}
      {!isService || item.priceHistory.length > 1 ? (
        <div className="charts-grid-equal">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{isService ? 'Rate History' : 'Price History'}</div>
                <div className="card-subtitle">Trend over time</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={item.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: number) => [`$${Number(value).toFixed(2)}`, isService ? 'Rate' : 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isService ? '#a78bfa' : '#06b6d4'}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: isService ? '#a78bfa' : '#06b6d4', strokeWidth: 2, stroke: '#0a0e1a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Purchase / Service History */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{isService ? 'Service History' : 'Purchase History'}</div>
                <div className="card-subtitle">{item.purchaseHistory.length} past {isService ? 'contracts' : 'purchases'}</div>
              </div>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{isService ? 'Provider' : 'Supplier'}</th>
                    <th>{isService ? 'Units' : 'Qty'}</th>
                    <th>Unit Rate</th>
                    <th>Total</th>
                    <th>PO</th>
                  </tr>
                </thead>
                <tbody>
                  {item.purchaseHistory.map((rec, i) => (
                    <tr key={i}>
                      <td>{rec.date}</td>
                      <td>{rec.supplierName}</td>
                      <td>{rec.quantity}</td>
                      <td className="font-mono">${rec.unitPrice.toFixed(2)}</td>
                      <td className="font-mono">${rec.totalAmount.toLocaleString()}</td>
                      <td style={{ color: '#6366f1', fontWeight: 600 }}>{rec.poId}</td>
                    </tr>
                  ))}
                  {item.purchaseHistory.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ItemsPage() {
  const { items, suppliers, selectedItemId, setSelectedItemId } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'goods' | 'services'>('all');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(i => i.category)));
    return ['All', ...cats];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'services' && item.category === 'Services') ||
        (typeFilter === 'goods' && item.category !== 'Services');
      return matchSearch && matchCategory && matchType;
    });
  }, [items, search, categoryFilter, typeFilter]);

  const serviceCount = items.filter(i => i.category === 'Services').length;
  const goodsCount = items.length - serviceCount;

  if (selectedItemId) return <ItemDetail itemId={selectedItemId} />;

  return (
    <div>
      <div className="page-header">
        <h2>Item &amp; Services Management</h2>
        <p>Master catalogue of procurement items and contracted services</p>
      </div>

      {/* Type pills */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
          All ({items.length})
        </button>
        <button className={`tab-btn ${typeFilter === 'goods' ? 'active' : ''}`} onClick={() => setTypeFilter('goods')}>
          Goods ({goodsCount})
        </button>
        <button className={`tab-btn ${typeFilter === 'services' ? 'active' : ''}`} onClick={() => setTypeFilter('services')}>
          <Wrench size={13} style={{ display: 'inline', marginRight: 4 }} />
          Services ({serviceCount})
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search items or services by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Unit / Billing</th>
                <th>Current Price / Rate</th>
                <th>Linked Suppliers</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isService = item.category === 'Services';
                return (
                  <tr key={item.id} className="clickable" onClick={() => setSelectedItemId(item.id)}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: isService ? 'rgba(139,92,246,0.12)' : 'rgba(99,102,241,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isService
                            ? <Wrench size={16} style={{ color: '#a78bfa' }} />
                            : <Package size={16} style={{ color: '#6366f1' }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#f1f5f9', fontSize: 13 }}>{item.name}</div>
                          {isService && item.serviceDetails && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.serviceDetails.billingType}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {isService
                        ? <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>Services</span>
                        : <span className="badge approved">{item.category}</span>
                      }
                    </td>
                    <td>{item.unit}</td>
                    <td className="font-mono">${item.currentPrice.toFixed(2)}</td>
                    <td>
                      {item.linkedSupplierIds.map(sid => {
                        const s = suppliers.find(sup => sup.id === sid);
                        return s ? s.name.split(' ')[0] : sid;
                      }).join(', ')}
                    </td>
                    <td>{item.purchaseHistory.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            {typeFilter === 'services' ? <Wrench size={48} /> : <Package size={48} />}
            <h3>No {typeFilter === 'services' ? 'services' : 'items'} found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
