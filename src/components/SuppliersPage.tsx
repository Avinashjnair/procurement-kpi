'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft,
  Search,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

function getKpiColor(val: number, thresholds: [number, number], inverted = false) {
  const [good, warn] = thresholds;
  if (inverted) {
    if (val <= good) return 'kpi-good';
    if (val <= warn) return 'kpi-warn';
    return 'kpi-bad';
  }
  if (val >= good) return 'kpi-good';
  if (val >= warn) return 'kpi-warn';
  return 'kpi-bad';
}

function SupplierDetail({ supplierId }: { supplierId: string }) {
  const { suppliers, purchaseOrders, items, setSelectedSupplierId } = useApp();
  const supplier = suppliers.find(s => s.id === supplierId);

  if (!supplier) return <p>Supplier not found.</p>;

  const kpis = supplier.kpis;

  const radarData = [
    { metric: 'Delivery', value: kpis.deliveryPerformance, fullMark: 100 },
    { metric: 'On-Time Pay', value: kpis.onTimePayment, fullMark: 100 },
    { metric: 'Low Rejection', value: 100 - kpis.rejectionRate * 10, fullMark: 100 },
    { metric: 'Price Stability', value: 100 - kpis.priceVariation * 10, fullMark: 100 },
    { metric: 'Response', value: Math.max(0, 100 - kpis.responseTime * 5), fullMark: 100 },
  ];

  const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplierId);
  const supplierItems = items.filter(i => i.linkedSupplierIds.includes(supplierId));

  const statusBars = [
    { status: 'Delivered', count: supplierPOs.filter(p => p.deliveryStatus === 'Delivered').length, color: '#10b981' },
    { status: 'Shipped', count: supplierPOs.filter(p => p.deliveryStatus === 'Shipped').length, color: '#06b6d4' },
    { status: 'Pending', count: supplierPOs.filter(p => p.deliveryStatus === 'Pending').length, color: '#f59e0b' },
    { status: 'Approved', count: supplierPOs.filter(p => p.deliveryStatus === 'Approved').length, color: '#6366f1' },
  ];

  return (
    <div>
      <button className="detail-back" onClick={() => setSelectedSupplierId(null)}>
        <ArrowLeft size={16} /> Back to Suppliers
      </button>

      <div className="page-header">
        <h2>{supplier.name}</h2>
        <p style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} /> {supplier.location}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={14} /> {supplier.email}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={14} /> {supplier.phone}
          </span>
        </p>
      </div>

      {/* KPI Scorecard */}
      <div className="kpi-grid">
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.priceVariation, [3, 5], true)}`}>
            {kpis.priceVariation}%
          </div>
          <div className="kpi-item-label">Price Variation</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.deliveryPerformance, [95, 88])}`}>
            {kpis.deliveryPerformance}%
          </div>
          <div className="kpi-item-label">On-Time Delivery</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-item-value" style={{ color: 'var(--accent-indigo)' }}>
            {kpis.paymentTerms}
          </div>
          <div className="kpi-item-label">Payment Terms</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.onTimePayment, [95, 90])}`}>
            {kpis.onTimePayment}%
          </div>
          <div className="kpi-item-label">Our On-Time Payment</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.responseTime, [4, 8], true)}`}>
            {kpis.responseTime}h
          </div>
          <div className="kpi-item-label">Avg Response Time</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-item-value" style={{ color: 'var(--accent-cyan)' }}>
            {kpis.deliveryTerms}
          </div>
          <div className="kpi-item-label">Incoterms</div>
        </div>
        <div className="kpi-item">
          <div className={`kpi-item-value ${getKpiColor(kpis.rejectionRate, [1, 3], true)}`}>
            {kpis.rejectionRate}%
          </div>
          <div className="kpi-item-label">Rejection Rate</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid-equal">
        {/* Radar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Performance Radar</div>
              <div className="card-subtitle">Overall capability assessment</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(99,102,241,0.12)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar
                name={supplier.name}
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* PO Status Bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">PO Status Breakdown</div>
              <div className="card-subtitle">{supplierPOs.length} total POs</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                {statusBars.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linked Items */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Linked Items</div>
            <div className="card-subtitle">{supplierItems.length} items supplied</div>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Current Price</th>
              </tr>
            </thead>
            <tbody>
              {supplierItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.id}</td>
                  <td>{item.name}</td>
                  <td><span className="badge approved">{item.category}</span></td>
                  <td className="font-mono">${item.currentPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const { suppliers, selectedSupplierId, setSelectedSupplierId } = useApp();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  if (selectedSupplierId) return <SupplierDetail supplierId={selectedSupplierId} />;

  return (
    <div>
      <div className="page-header">
        <h2>Supplier Management</h2>
        <p>Track and evaluate supplier performance</p>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search suppliers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="supplier-cards">
        {filtered.map(supplier => {
          const k = supplier.kpis;
          return (
            <div
              key={supplier.id}
              className="card supplier-card"
              onClick={() => setSelectedSupplierId(supplier.id)}
            >
              <div className="supplier-card-header">
                <div className="supplier-avatar">
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <div className="supplier-card-name">{supplier.name}</div>
                  <div className="supplier-card-location">
                    <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {supplier.location}
                  </div>
                </div>
              </div>
              <div className="supplier-kpi-bar">
                <div className="supplier-kpi-tag">
                  {k.deliveryPerformance >= 95 ? (
                    <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                  ) : k.deliveryPerformance >= 88 ? (
                    <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                  ) : (
                    <XCircle size={12} style={{ color: '#f43f5e' }} />
                  )}
                  {k.deliveryPerformance}% delivery
                </div>
                <div className="supplier-kpi-tag">
                  ↕ {k.priceVariation}% price var.
                </div>
                <div className="supplier-kpi-tag">
                  🔃 {k.responseTime}h response
                </div>
                <div className="supplier-kpi-tag">
                  📦 {k.deliveryTerms}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
