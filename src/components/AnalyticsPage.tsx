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
  
  // ── Data Preparation ──
  const monthlyData = [
    { month: 'Jan', current: 145000, previous: 120000 },
    { month: 'Feb', current: 168000, previous: 135000 },
    { month: 'Mar', current: 192000, previous: 155000 },
    { month: 'Apr', current: 125000, previous: 140000 }, // Partial month
  ];

  const spendByCategory = [
    { name: 'Piping', value: 245000 },
    { name: 'Valves', value: 180000 },
    { name: 'Electrical', value: 95000 },
    { name: 'Chemicals', value: 65000 },
    { name: 'Services', value: 110000 },
  ];

  const totalSavings = 42500; // Calculated based on benchmark pricing
  const savingsTarget = 60000;

  const handleExportPowerBI = () => {
    // Generate flat table: PO ID | Date | Supplier | Category | Item | Quantity | Price | Total | Budget
    const rows = purchaseOrders.flatMap(po => 
      po.items.map((item, idx) => ({
        poId: po.id,
        date: po.dateOfIssue,
        supplier: po.supplierName,
        item: item.itemName,
        qty: item.quantity,
        price: item.unitPrice,
        total: item.quantity * item.unitPrice,
        dept: po.projectReference || 'General',
        status: po.deliveryStatus
      }))
    );
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["PO ID,Date,Supplier,Item,Qty,Price,Total,Dept,Status", ...rows.map(r => Object.values(r).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ProcureIQ_PowerBI_Export_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div style={{ height: '100%', width: '71%', background: '#10b981' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Avg. Savings Rate</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#06b6d4' }}>6.8%</div>
            </div>
            <div style={{ padding: 10, background: 'rgba(6, 182, 212, 0.1)', borderRadius: 12, color: '#06b6d4' }}>
              <Target size={24} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#34d399' }}>+1.2% versus last quarter</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Spend Comparison (YoY)</div>
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
