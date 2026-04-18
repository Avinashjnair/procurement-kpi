'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  DollarSign, FileText, Package, Users, Clock, TrendingUp,
  ArrowRight, AlertCircle, TrendingDown, Activity, ShieldCheck,
  Zap, Target, X, ExternalLink, ChevronRight, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  LineChart, Line,
} from 'recharts';
import { dashboardMetrics, spendByCategory, monthlySpend, poCycleData } from '@/data/mockData';

const PIE_COLORS = ['#b1cad7', '#7c94a0', '#e9c176', '#a5b4fc', '#42484b'];

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

// ── Spend under management donut ──
function SpendGauge({ pct }: { pct: number }) {
  const data = [{ value: pct }, { value: 100 - pct }];
  return (
    <div style={{ position: 'relative', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={62} outerRadius={82}
            startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill="var(--accent-slate)" />
            <Cell fill="rgba(140,145,149,0.08)" />
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

// ── Supporting Data Modal (Drill-down) ──
function DrillDownModal({ 
  title, 
  data, 
  type, 
  onClose, 
  onNavigate 
}: { 
  title: string; 
  data: any[]; 
  type: 'po' | 'supplier' | 'item' | 'generic'; 
  onClose: () => void;
  onNavigate: (page: string, id?: string) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 880, width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{data.length} records found supporting this metric</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          <div className="data-table-wrapper" style={{ boxShadow: 'none', border: '1px solid var(--border-color)' }}>
            <table className="data-table">
              <thead>
                {type === 'po' ? (
                  <tr><th>ID</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr>
                ) : type === 'supplier' ? (
                  <tr><th>Supplier</th><th>Category</th><th>Performance</th><th>Status</th><th></th></tr>
                ) : (
                  <tr><th>Reference</th><th>Description</th><th>Value</th><th>Status</th><th></th></tr>
                )}
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i}>
                    {type === 'po' ? (
                      <>
                        <td style={{ fontWeight: 700, color: '#f1f5f9' }}>{item.id}</td>
                        <td>{item.supplierName}</td>
                        <td className="font-mono">${item.totalAmount.toLocaleString()}</td>
                        <td><span className={`badge ${item.deliveryStatus.toLowerCase()}`}>{item.deliveryStatus}</span></td>
                        <td>{item.dateOfIssue}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('purchase-orders', item.id)}>
                            <ExternalLink size={13} />
                          </button>
                        </td>
                      </>
                    ) : type === 'supplier' ? (
                      <>
                        <td style={{ fontWeight: 700, color: '#f1f5f9' }}>{item.name}</td>
                        <td>{item.kpis.deliveryTerms === 'N/A' ? 'Services' : 'Goods'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 4, width: 60, background: 'rgba(140,145,149,0.1)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${item.kpis.deliveryPerformance}%`, background: item.kpis.deliveryPerformance > 90 ? '#b1cad7' : '#e9c176', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11 }}>{item.kpis.deliveryPerformance}%</span>
                          </div>
                        </td>
                        <td><span className={`badge ${item.preferred ? 'approved' : 'draft'}`}>{item.preferred ? 'Preferred' : 'Standard'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('suppliers', item.id)}>
                            <ExternalLink size={13} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 700, color: '#f1f5f9' }}>{item.id || '#' + (i+1)}</td>
                        <td>{item.name || item.title || item.supplierName || '—'}</td>
                        <td className="font-mono">${item.amount?.toLocaleString() || item.totalAmount?.toLocaleString() || item.value || '—'}</td>
                        <td><span className="badge draft">{item.status || 'Active'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm"><ChevronRight size={13} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(99,102,241,0.02)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Overview</button>
        </div>
      </div>
    </div>
  );
}

// ── Refined uniform KPI Card component ──
function KPICard({ 
  icon: Icon, 
  value, 
  label, 
  colorClass, 
  trend, 
  onClick,
  priority
}: { 
  icon: any; 
  value: string | number; 
  label: string; 
  colorClass: string; 
  trend?: { val: string; up: boolean };
  onClick: () => void;
  priority?: boolean;
}) {
  return (
    <button className={`uniform-card ${priority ? 'priority-pulse' : ''}`} onClick={onClick} style={{ position: 'relative', zIndex: 1 }}>
      <div className="card-click-hint">
        <Activity size={10} /> View Details
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div className={`metric-icon ${colorClass}`} style={{ margin: 0 }}>
          <Icon size={20} />
        </div>
        {trend && (
          <div style={{ fontSize: 11, fontWeight: 700, color: trend.up ? '#10b981' : '#f43f5e', display: 'flex', alignItems: 'center', gap: 2, background: trend.up ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>
            {trend.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.val}
          </div>
        )}
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </button>
  );
}

export default function DashboardPage() {
  const { purchaseOrders, suppliers, budgets, setActivePage, setSelectedSupplierId, setSelectedPOId } = useApp();
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [drillDown, setDrillDown] = useState<{ title: string, type: 'po' | 'supplier' | 'generic', data: any[] } | null>(null);

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
                background: dateRange === r ? 'rgba(140,145,149,0.1)' : 'transparent',
                color: dateRange === r ? 'var(--text-primary)' : 'var(--text-muted)',
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

      {/* ── Drill Down Modal ── */}
      {drillDown && (
        <DrillDownModal 
          title={drillDown.title}
          data={drillDown.data}
          type={drillDown.type}
          onClose={() => setDrillDown(null)}
          onNavigate={(page, id) => {
            if (id) {
              if (page === 'purchase-orders') setSelectedPOId?.(id);
              if (page === 'suppliers') setSelectedSupplierId?.(id);
            }
            setActivePage(page as any);
            setDrillDown(null);
          }}
        />
      )}

      {/* ── Performance Analytics Header ── */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ height: 2, flex: 1, background: 'linear-gradient(90deg, var(--accent-indigo), transparent)' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Performance Analytics</span>
        <div style={{ height: 2, flex: 1, background: 'linear-gradient(-90deg, var(--accent-indigo), transparent)' }} />
      </div>

      <div className="metrics-grid">
        <KPICard 
          icon={DollarSign} 
          value={`$${(dashboardMetrics.totalSpend / 1000).toFixed(0)}K`}
          label="Total Procurement Spend"
          colorClass="indigo"
          trend={{ val: '+12%', up: true }}
          onClick={() => setDrillDown({ title: 'Total Procurement Spend', type: 'po', data: purchaseOrders.slice().sort((a,b) => b.totalAmount - a.totalAmount).slice(0, 10) })}
        />
        <KPICard 
          icon={FileText} 
          value={dashboardMetrics.totalPOs}
          label="Total Purchase Orders"
          colorClass="cyan"
          onClick={() => setDrillDown({ title: 'Standard Purchase Orders', type: 'po', data: purchaseOrders.filter(p => !p.items.some(i => i.isService)) })}
        />
        <KPICard 
          icon={Clock} 
          value={dashboardMetrics.pendingPOs}
          label="Pending / In-Transit"
          colorClass="amber"
          onClick={() => setDrillDown({ title: 'In-Transit Orders', type: 'po', data: purchaseOrders.filter(p => ['Pending', 'Approved', 'Shipped'].includes(p.deliveryStatus)) })}
        />
        <KPICard 
          icon={TrendingUp} 
          value={`${dashboardMetrics.avgDeliveryPerformance}%`}
          label="Avg Delivery Performance"
          colorClass="emerald"
          trend={{ val: '+2.1%', up: true }}
          onClick={() => setDrillDown({ title: 'Supplier Quality Rating', type: 'supplier', data: suppliers.slice().sort((a,b) => b.kpis.deliveryPerformance - a.kpis.deliveryPerformance) })}
        />
        <KPICard 
          icon={AlertCircle} 
          value={`$${(dashboardMetrics.unpaidAmount / 1000).toFixed(0)}K`}
          label="Outstanding Payments"
          colorClass="rose"
          onClick={() => setDrillDown({ title: 'Outstanding Accounts Payable', type: 'po', data: purchaseOrders.filter(p => p.paymentStatus !== 'Paid' && p.deliveryStatus !== 'Cancelled') })}
        />
        <KPICard 
          icon={Users} 
          value={dashboardMetrics.totalSuppliers}
          label="Active Suppliers"
          colorClass="violet"
          onClick={() => setDrillDown({ title: 'Approved Supplier Roster', type: 'supplier', data: suppliers })}
        />
        <KPICard 
          icon={TrendingDown} 
          value={`$${(dashboardMetrics.costReduction / 1000).toFixed(1)}K`}
          label="Cost Reduction (savings)"
          colorClass="emerald"
          onClick={() => setDrillDown({ title: 'Sourcing Savings & Reductions', type: 'po', data: purchaseOrders.slice(0, 5).map(po => ({ ...po, status: 'Savings Captured', amount: po.totalAmount * 0.05 })) })}
        />
        <KPICard 
          icon={Activity} 
          value={`${dashboardMetrics.avgPOCycleTime}d`}
          label="Avg PO Cycle Time"
          colorClass="cyan"
          onClick={() => setDrillDown({ title: 'Order Execution Efficiency', type: 'po', data: purchaseOrders.filter(p => p.deliveryStatus === 'Delivered').slice(0, 10) })}
        />
        <KPICard 
          icon={Zap} 
          value={`${dashboardMetrics.emergencyPORatio}%`}
          label="Emergency PO Ratio"
          colorClass={emergencyAlert ? 'rose' : 'amber'}
          priority={emergencyAlert}
          onClick={() => setDrillDown({ title: 'Urgent / Emergency Requisitions', type: 'po', data: purchaseOrders.slice(4, 7).map(po => ({ ...po, status: 'Urgent' })) })}
        />
        <KPICard 
          icon={ShieldCheck} 
          value={`${dashboardMetrics.spendUnderManagement}%`}
          label="Spend Under Management"
          colorClass="indigo"
          onClick={() => setDrillDown({ title: 'Spend Consolidation Analysis', type: 'supplier', data: suppliers.filter(s => s.preferred) })}
        />
        <KPICard 
          icon={Target} 
          value={dashboardMetrics.preferredSuppliers}
          label="Preferred Suppliers"
          colorClass="violet"
          onClick={() => setDrillDown({ title: 'Preferred Vendor List', type: 'supplier', data: suppliers.filter(s => s.preferred) })}
        />
        <KPICard 
          icon={Package} 
          value={`$${(dashboardMetrics.serviceSpend / 1000).toFixed(0)}K`}
          label="Services Spend"
          colorClass="amber"
          onClick={() => setDrillDown({ title: 'Service & Maintenance Spend', type: 'po', data: purchaseOrders.filter(p => p.items.some(i => i.isService)) })}
        />
      </div>

      {/* ── Row 1: Budget and Spend Focus ── */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Budget Utilization</div>
              <div className="card-subtitle">Tracking by department & project</div>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => setActivePage('budgets')}>Manage</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {budgets.slice(0, 3).map(b => {
              const utilization = Math.round(((b.spentAmount + b.committedAmount) / b.totalAmount) * 100);
              const statusColor = utilization >= 100 ? '#f43f5e' : utilization >= 80 ? '#f59e0b' : '#10b981';
              return (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 700 }}>{utilization}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(utilization, 100)}%`, background: statusColor, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Spend Health Gauge</div>
              <div className="card-subtitle">% spend via preferred suppliers</div>
            </div>
          </div>
          <div style={{ height: 160, marginTop: -10 }}>
            <SpendGauge pct={dashboardMetrics.spendUnderManagement} />
          </div>
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
                  <stop offset="0%" stopColor="#b1cad7" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#b1cad7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#b1cad7" strokeWidth={2}
                fill="url(#spendGrad)"
                dot={{ r: 3, fill: '#b1cad7', strokeWidth: 1.5, stroke: 'var(--bg-primary)' }}
                activeDot={{ r: 5 }} />
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
              <Line type="monotone" dataKey="avgDays" stroke="#7c94a0" strokeWidth={2}
                dot={{ r: 3, fill: '#7c94a0', strokeWidth: 1.5, stroke: 'var(--bg-primary)' }}
                activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Analytics Detail</div>
              <div className="card-subtitle">Key procurement breakdown</div>
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '12px 18px', background: 'rgba(99,102,241,0.06)', borderRadius: 12, flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{dashboardMetrics.preferredSuppliers}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Preferred vendors</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 18px', background: 'rgba(99,102,241,0.06)', borderRadius: 12, flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{dashboardMetrics.totalSuppliers - dashboardMetrics.preferredSuppliers}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Standard pool</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--text-secondary)', padding: '0 10px', lineHeight: 1.5 }}>
            Efficiently managing <b>${((dashboardMetrics.totalSpend * dashboardMetrics.spendUnderManagement) / 100 / 1000).toFixed(0)}K</b> through pre-vetted contracts.
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
              <Bar dataKey="delivery" fill="#b1cad7" radius={[0, 6, 6, 0]} barSize={18} name="Delivery %" />
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
