'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft,
  Search,
  Package,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function ItemDetail({ itemId }: { itemId: string }) {
  const { items, suppliers, setSelectedItemId } = useApp();
  const item = items.find(i => i.id === itemId);

  if (!item) return <p>Item not found.</p>;

  const linkedSuppliers = suppliers.filter(s => item.linkedSupplierIds.includes(s.id));

  return (
    <div>
      <button className="detail-back" onClick={() => setSelectedItemId(null)}>
        <ArrowLeft size={16} /> Back to Items
      </button>

      <div className="page-header">
        <h2>{item.name}</h2>
        <p>{item.category} · {item.id} · Current Price: ${item.currentPrice.toFixed(2)}/{item.unit}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.description}</p>
      </div>

      {/* Linked Suppliers */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div className="card-title">Linked Suppliers</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {linkedSuppliers.map(s => (
            <div key={s.id} className="supplier-kpi-tag" style={{ padding: '8px 14px', fontSize: '13px' }}>
              {s.name} · {s.kpis.paymentTerms} · {s.kpis.deliveryTerms}
            </div>
          ))}
        </div>
      </div>

      <div className="charts-grid-equal">
        {/* Price History Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Price History</div>
              <div className="card-subtitle">Trend over time</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={item.priceHistory}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#f1f5f9' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#0a0e1a' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Purchase History Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Purchase History</div>
              <div className="card-subtitle">{item.purchaseHistory.length} past purchases</div>
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

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
      return matchSearch && matchCategory;
    });
  }, [items, search, categoryFilter]);

  if (selectedItemId) return <ItemDetail itemId={selectedItemId} />;

  return (
    <div>
      <div className="page-header">
        <h2>Item Management</h2>
        <p>Master list of procurement items</p>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search items by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current Price</th>
                <th>Linked Suppliers</th>
                <th>Purchases</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr
                  key={item.id}
                  className="clickable"
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(99,102,241,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Package size={16} style={{ color: '#6366f1' }} />
                      </div>
                      {item.name}
                    </div>
                  </td>
                  <td>
                    <span className="badge approved">{item.category}</span>
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
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <h3>No items found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
