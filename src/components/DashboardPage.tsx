'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  DollarSign, FileText, Package, Users, Clock, TrendingUp,
  ArrowRight, AlertCircle, TrendingDown, Activity, ShieldCheck,
  Zap, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  LineChart, Line,
} from 'recharts';
import { dashboardMetrics, spendByCategory, monthlySpend, poCycleData } from '@/data/mockData';

const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#a78bfa'];

type DateRange = '30' | '90' | '180' | 'all';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; payload?: { category?: string } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label">{label || payload[0]?.payload?.category}</p>
      <p className="value">${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

function CycleTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label">{label}</p>
      <p className="value">{payload[0].value} days avg.</p>
    </div>
  );
}

// Spend under management donut
function SpendGauge({ pct }: { pct: number }) {
  const data = [{ value: pct }, { value: 100 - pct }];
  return (
    <div style={{ position: 'relative', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={62} outerRadius={82}
            startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill="#6366f1" />
            <Cell fill="rgba(99,102,241,0.08)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Under management</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { purchaseOrders, suppliers, setActivePage, setSelectedSupplierId } = useApp();
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // Filter monthly spend data by range
  const filteredMonthly = useMemo(() => {
    if (dateRange === 'all') return monthlySpend;
    const months = dateRange === '30' ? 1 : dateRange === '90' ? 3 : 6;
    return monthlySpend.slice(-months);
  }, [dateRange]);

  const pendingPOs = purchaseOrders.filter(po =>
    ['Pending', 'Approved', 'Shipped'].includes(po.deliveryStatus)
  );

  const topSuppliers = [...suppliers]
    .sort((a, b) => b.kpis.deliveryPerformance - a.kpis.deliveryPerformance)
    .slice(0, 5);

  const supplierPerformance = topSuppliers.map(s => ({
    name: s.name.split(' ')[0],
    delivery: s.kpis.deliveryPerformance,
  }));

  const emergencyAlert = dashboardMetrics.emergencyPORatio > 15;

  return (
    <div>
      {/* Header + date filter */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Procurement Dashboard</h2>
          <p>Real-time overview of your procurement operations</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 4 }}>
          {(['30', '90', '180', 'all'] as DateRange[]).map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              style={{
                padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                background: dateRange === r ? 'rgba(99,102,241,0.18)' : 'transparent',
                color: dateRange === r ? 'var(--accent-indigo)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>
              {r === 'all' ? 'All' : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency PO alert banner */}
      {emergencyAlert && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          marginBottom: 20, borderRadius: 12,
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
        }}>
          <Zap size={18} style={{ color: '#f43f5e', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#f43f5e', fontWeight: 500 }}>
            Emergency PO ratio is {dashboardMetrics.emergencyPORatio}% — above the 15% threshold. Review urgent orders to reduce procurement risk.
          </span>
        </div>
      )}

      {/* ── Row 1: Core metrics ── */}
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

      {/* ── Row 2: New KPI cards ── */}
      <div className="metrics-grid" style={{ marginBottom: 28 }}>
        <div className="metric-card emerald">
          <div className="metric-icon emerald"><TrendingDown size={22} /></div>
          <div className="metric-value" style={{ fontSize: 22 }}>${(dashboardMetrics.costReduction / 1000).toFixed(1)}K</div>
          <div className="metric-label">Cost Reduction (savings)</div>
        </div>
        <div className="metric-card cyan">
          <div className="metric-icon cyan"><Activity size={22} /></div>
          <div className="metric-value">{dashboardMetrics.avgPOCycleTime}d</div>
          <div className="metric-label">Avg PO Cycle Time</div>
        </div>
        <div className={`metric-card ${emergencyAlert ? 'rose' : 'amber'}`}>
          <div className={`metric-icon ${emergencyAlert ? 'rose' : 'amber'}`}>
            <Zap size={22} />
          </div>
          <div className="metric-value">{dashboardMetrics.emergencyPORatio}%</div>
          <div className="metric-label">Emergency PO Ratio</div>
        </div>
        <div className="metric-card indigo">
          <div className="metric-icon indigo"><ShieldCheck size={22} /></div>
          <div className="metric-value">{dashboardMetrics.spendUnderManagement}%</div>
          <div className="metric-label">Spend Under Management</div>
        </div>
        <div className="metric-card violet">
          <div className="metric-icon violet"><Target size={22} /></div>
          <div className="metric-value">{dashboardMetrics.preferredSuppliers}</div>
          <div className="metric-label">Preferred Suppliers</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon amber"><Package size={22} /></div>
          <div className="metric-value">${(dashboardMetrics.serviceSpend / 1000).toFixed(0)}K</div>
          <div className="metric-label">Services Spend</div>
        </div>
      </div>

      {/* ── Charts Row 1: Spend trend + Category breakdown ── */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Procurement Spend</div>
              <div className="card-subtitle">Filtered: {dateRange === 'all' ? 'All time' : `Last ${dateRange} days`}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredMonthly}>
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
              <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#spendGrad)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0a0e1a' }}
                activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Spend by Category</div>
              <div className="card-subtitle">Distribution breakdown</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={spendByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                dataKey="amount" nameKey="category" stroke="none" paddingAngle={3}>
                {spendByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            {spendByCategory.map((cat, i) => (
              <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: PIE_COLORS[i] }} />
                {cat.category}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: PO Cycle Time + Spend Under Management ── */}
      <div className="charts-grid-equal" style={{ marginBottom: 28 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">PO Cycle Time Trend</div>
              <div className="card-subtitle">Avg days from issue to delivery</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={poCycleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="d" />
              <Tooltip content={<CycleTooltip />} />
              <Line type="monotone" dataKey="avgDays" stroke="#06b6d4" strokeWidth={2.5}
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#0a0e1a' }}
                activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Spend Under Management</div>
              <div className="card-subtitle">% spend via preferred suppliers</div>
            </div>
          </div>
          <SpendGauge pct={dashboardMetrics.spendUnderManagement} />
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            ${((dashboardMetrics.totalSpend * dashboardMetrics.spendUnderManagement) / 100 / 1000).toFixed(0)}K of ${(dashboardMetrics.totalSpend / 1000).toFixed(0)}K through preferred suppliers
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{dashboardMetrics.preferredSuppliers}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Preferred suppliers</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{dashboardMetrics.totalSuppliers - dashboardMetrics.preferredSuppliers}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Other suppliers</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row 3: Supplier performance + Pending POs ── */}
      <div className="charts-grid-equal">
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
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={supplierPerformance} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#f1f5f9' }} />
              <Bar dataKey="delivery" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} name="Delivery %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

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
                <tr><th>PO #</th><th>Supplier</th><th>Amount</th><th>Status</th><th>ETA</th></tr>
              </thead>
              <tbody>
                {pendingPOs.slice(0, 5).map(po => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{po.id}</td>
                    <td>{po.supplierName.split(' ').slice(0, 2).join(' ')}</td>
                    <td className="font-mono">${po.totalAmount.toLocaleString()}</td>
                    <td><span className={`badge ${po.deliveryStatus.toLowerCase()}`}><span className="badge-dot" />{po.deliveryStatus}</span></td>
                    <td>{po.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Supplier scorecard ── */}
      <div className="card" style={{ marginTop: 20 }}>
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
                <th>Supplier</th><th>Price Var.</th><th>On-Time Delivery</th>
                <th>Rejection Rate</th><th>Response Time</th><th>Payment Terms</th><th>Incoterms</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="clickable" onClick={() => { setSelectedSupplierId(s.id); setActivePage('suppliers'); }}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{s.name}</td>
                  <td><span className={s.kpis.priceVariation <= 3 ? 'kpi-good' : s.kpis.priceVariation <= 5 ? 'kpi-warn' : 'kpi-bad'}>{s.kpis.priceVariation}%</span></td>
                  <td><span className={s.kpis.deliveryPerformance >= 95 ? 'kpi-good' : s.kpis.deliveryPerformance >= 88 ? 'kpi-warn' : 'kpi-bad'}>{s.kpis.deliveryPerformance}%</span></td>
                  <td><span className={s.kpis.rejectionRate <= 1 ? 'kpi-good' : s.kpis.rejectionRate <= 3 ? 'kpi-warn' : 'kpi-bad'}>{s.kpis.rejectionRate}%</span></td>
                  <td>{s.kpis.responseTime}h</td>
                  <td>{s.kpis.paymentTerms}</td>
                  <td><span className="badge approved">{s.kpis.deliveryTerms}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
