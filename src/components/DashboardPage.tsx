'use client';
import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  DollarSign,
  FileText,
  Package,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { dashboardMetrics, spendByCategory, monthlySpend } from '@/data/mockData';

const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name?: string; payload?: {category?: string}}>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label">{label || payload[0]?.payload?.category}</p>
      <p className="value">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { purchaseOrders, suppliers, setActivePage, setSelectedSupplierId } = useApp();

  const pendingPOs = purchaseOrders.filter(
    po => po.deliveryStatus === 'Pending' || po.deliveryStatus === 'Approved' || po.deliveryStatus === 'Shipped'
  );

  const topSuppliers = [...suppliers]
    .sort((a, b) => b.kpis.deliveryPerformance - a.kpis.deliveryPerformance)
    .slice(0, 5);

  const supplierPerformance = topSuppliers.map(s => ({
    name: s.name.split(' ')[0],
    delivery: s.kpis.deliveryPerformance,
    rejection: s.kpis.rejectionRate,
  }));

  return (
    <div>
      <div className="page-header">
        <h2>Procurement Dashboard</h2>
        <p>Real-time overview of your procurement operations</p>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card indigo">
          <div className="metric-icon indigo"><DollarSign size={22} /></div>
          <div className="metric-value">${(dashboardMetrics.totalSpend / 1000).toFixed(0)}K</div>
          <div className="metric-label">Total Procurement Spend</div>
        </div>
        <div className="metric-card cyan">
          <div className="metric-icon cyan"><FileText size={22} /></div>
          <div className="metric-value">{dashboardMetrics.totalPOs}</div>
          <div className="metric-label">Total Purchase Orders</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon amber"><Clock size={22} /></div>
          <div className="metric-value">{dashboardMetrics.pendingPOs}</div>
          <div className="metric-label">Pending / In-Transit</div>
        </div>
        <div className="metric-card emerald">
          <div className="metric-icon emerald"><TrendingUp size={22} /></div>
          <div className="metric-value">{dashboardMetrics.avgDeliveryPerformance}%</div>
          <div className="metric-label">Avg Delivery Performance</div>
        </div>
        <div className="metric-card rose">
          <div className="metric-icon rose"><AlertCircle size={22} /></div>
          <div className="metric-value">${(dashboardMetrics.unpaidAmount / 1000).toFixed(0)}K</div>
          <div className="metric-label">Outstanding Payments</div>
        </div>
        <div className="metric-card violet">
          <div className="metric-icon violet"><Users size={22} /></div>
          <div className="metric-value">{dashboardMetrics.totalSuppliers}</div>
          <div className="metric-label">Active Suppliers</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Monthly Spend Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Procurement Spend</div>
              <div className="card-subtitle">Last 7 months trend</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlySpend}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#spendGrad)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0a0e1a' }}
                activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#0a0e1a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Spend by Category */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Spend by Category</div>
              <div className="card-subtitle">Distribution breakdown</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={spendByCategory}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                dataKey="amount"
                nameKey="category"
                stroke="none"
                paddingAngle={4}
              >
                {spendByCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {spendByCategory.map((cat, i) => (
              <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: PIE_COLORS[i] }} />
                {cat.category}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supplier Performance + Pending POs */}
      <div className="charts-grid-equal">
        {/* Supplier Performance Bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Supplier Performance</div>
              <div className="card-subtitle">Delivery rate %</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('suppliers')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={supplierPerformance} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="delivery" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} name="Delivery %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending POs Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Pending Purchase Orders</div>
              <div className="card-subtitle">{pendingPOs.length} orders in pipeline</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('purchase-orders')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {pendingPOs.slice(0, 5).map(po => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{po.id}</td>
                    <td>{po.supplierName.split(' ').slice(0, 2).join(' ')}</td>
                    <td className="font-mono">${po.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${po.deliveryStatus.toLowerCase()}`}>
                        <span className="badge-dot" />
                        {po.deliveryStatus}
                      </span>
                    </td>
                    <td>{po.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Suppliers Scorecard */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Supplier Scorecard</div>
            <div className="card-subtitle">Quick comparison of key metrics</div>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Price Var.</th>
                <th>On-Time Delivery</th>
                <th>Rejection Rate</th>
                <th>Response Time</th>
                <th>Payment Terms</th>
                <th>Incoterms</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr
                  key={s.id}
                  className="clickable"
                  onClick={() => {
                    setSelectedSupplierId(s.id);
                    setActivePage('suppliers');
                  }}
                >
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{s.name}</td>
                  <td>
                    <span className={s.kpis.priceVariation <= 3 ? 'kpi-good' : s.kpis.priceVariation <= 5 ? 'kpi-warn' : 'kpi-bad'}>
                      {s.kpis.priceVariation}%
                    </span>
                  </td>
                  <td>
                    <span className={s.kpis.deliveryPerformance >= 95 ? 'kpi-good' : s.kpis.deliveryPerformance >= 88 ? 'kpi-warn' : 'kpi-bad'}>
                      {s.kpis.deliveryPerformance}%
                    </span>
                  </td>
                  <td>
                    <span className={s.kpis.rejectionRate <= 1 ? 'kpi-good' : s.kpis.rejectionRate <= 3 ? 'kpi-warn' : 'kpi-bad'}>
                      {s.kpis.rejectionRate}%
                    </span>
                  </td>
                  <td>{s.kpis.responseTime}h</td>
                  <td>{s.kpis.paymentTerms}</td>
                  <td>
                    <span className="badge approved">
                      {s.kpis.deliveryTerms}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
