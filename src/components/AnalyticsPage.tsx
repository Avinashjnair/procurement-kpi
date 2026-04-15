'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { BarChart3, Download, Filter, FileSpreadsheet, TrendingDown, Target } from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function AnalyticsPage() {
  const { purchaseOrders, items, budgets } = useApp();
  
  // ── Dynamic Dynamic Calculations ──
  
  // 1. Calculate Real Savings
  let totalSavings = 0;
  let totalNegotiatedSpend = 0;
  let marketSpend = 0;

  purchaseOrders.forEach(po => {
    if (po.deliveryStatus === 'Cancelled') return;
    po.items.forEach(line => {
      // Find item to get benchmarkPrice
      const itemRef = items.find(i => i.id === line.itemId || i.name === line.itemName);
      const benchmark = itemRef?.benchmarkPrice || line.unitPrice; // Fallback to unitPrice if no benchmark
      
      const lineSavings = (benchmark - line.unitPrice) * line.quantity;
      totalSavings += lineSavings;
      totalNegotiatedSpend += (line.unitPrice * line.quantity);
      marketSpend += (benchmark * line.quantity);
    });
  });

  const savingsRate = marketSpend > 0 ? (totalSavings / marketSpend) * 100 : 0;
  const savingsTarget = 75000;

  // 2. Monthly Spend (Dynamic)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap: Record<string, { month: string, current: number, previous: number }> = {};
  
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = monthNames[d.getMonth()];
    monthlyMap[m] = { month: m, current: 0, previous: (120000 + Math.random() * 40000) }; // Random baseline for demo
  }

  purchaseOrders.forEach(po => {
    if (po.deliveryStatus === 'Cancelled') return;
    const date = new Date(po.dateOfIssue);
    const m = monthNames[date.getMonth()];
    if (monthlyMap[m]) {
      monthlyMap[m].current += po.totalAmount;
    }
  });

  const monthlyData = Object.values(monthlyMap);

  // 3. Spend by Category
  // Note: Item category isn't in PurchaseOrder Items, so we map from Item reference
  const categoryMap: Record<string, number> = {};
  purchaseOrders.forEach(po => {
    if (po.deliveryStatus === 'Cancelled') return;
    po.items.forEach(line => {
      const itemRef = items.find(i => i.id === line.itemId || i.name === line.itemName);
      const cat = itemRef?.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + (line.unitPrice * line.quantity);
    });
  });

  const spendByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const handleExportPowerBI = () => {
    // Generate flat table: PO ID | Date | Supplier | Category | Item | Quantity | Price | Total | Savings
    const rows = purchaseOrders.flatMap(po => 
      po.items.map((line, idx) => {
        const itemRef = items.find(i => i.id === line.itemId || i.name === line.itemName);
        const benchmark = itemRef?.benchmarkPrice || line.unitPrice;
        return {
          poId: po.id,
          date: po.dateOfIssue,
          supplier: po.supplierName,
          category: itemRef?.category || 'General',
          item: line.itemName,
          qty: line.quantity,
          price: line.unitPrice,
          benchmark: benchmark,
          total: line.quantity * line.unitPrice,
          savings: (benchmark - line.unitPrice) * line.quantity,
          status: po.deliveryStatus
        };
      })
    );
    
    const headers = Object.keys(rows[0] || {}).join(",");
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows.map(r => Object.values(r).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ProcureIQ_Analytics_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Procurement Intelligence</h2>
          <p>Deep-dive analytics and year-over-year performance tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary"><Filter size={18} /> Filters</button>
          <button className="btn btn-primary" onClick={handleExportPowerBI}>
            <FileSpreadsheet size={18} /> Power BI Export
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cost Savings (YTD)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>${totalSavings.toLocaleString()}</div>
            </div>
            <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, color: '#10b981' }}>
              <TrendingDown size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Progress to Target</span>
            <span>{Math.round((totalSavings / savingsTarget) * 100)}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((totalSavings / savingsTarget) * 100, 100)}%`, background: '#10b981' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Avg. Savings Rate</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#06b6d4' }}>{savingsRate.toFixed(1)}%</div>
            </div>
            <div style={{ padding: 10, background: 'rgba(6, 182, 212, 0.1)', borderRadius: 12, color: '#06b6d4' }}>
              <Target size={24} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#34d399' }}>基于基准市场价格计算</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Spend Comparison (Dynamic)</div>
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                <Bar name="2026 (Actual)" dataKey="current" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar name="2025 (Baseline)" dataKey="previous" fill="rgba(99, 102, 241, 0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Spend by Category</div>
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendByCategory}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {spendByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
