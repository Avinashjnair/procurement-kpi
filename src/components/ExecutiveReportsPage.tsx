'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  BarChart3, Download, FileJson, FileText, PieChart, 
  TrendingUp, TrendingDown, Calendar, Filter, ChevronDown,
  Target, Zap, ShieldCheck, DollarSign
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExecutiveReportsPage() {
  const { 
    purchaseOrders, rfqs, suppliers, budgets, contracts, grns, invoices 
  } = useApp();
  
  const [period, setPeriod] = useState('This Quarter');
  const [isExporting, setIsExporting] = useState(false);

  // ── Calculated Metrics ──
  const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalSavings = purchaseOrders.reduce((sum, po) => sum + (po.savingsAmount || 0), 0);
  const avgCycleTimeDays = 4.2; // Mocked for now: Time from RFQ to Receipt
  const topSupplier = suppliers.sort((a,b) => b.kpis.deliveryPerformance - a.kpis.deliveryPerformance)[0];
  const budgetUtilization = (budgets.reduce((s,b) => s + b.spentAmount, 0) / budgets.reduce((s,b) => s + b.totalAmount, 0)) * 100;

  const exportPDF = () => {
    setIsExporting(true);
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('ProcureIQ - Executive KPI Report', 15, 25);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${period}`, 15, 33);

    // Summary Cards
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.text('1. Executive Summary', 15, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value', 'Status']],
      body: [
        ['Total Procurement Spend', `$${totalSpend.toLocaleString()}`, 'Normal'],
        ['Negotiated Savings', `$${totalSavings.toLocaleString()}`, 'Above Target (+12%)'],
        ['Budget Utilization', `${budgetUtilization.toFixed(1)}%`, 'On Track'],
        ['Avg. Cycle Time (RFQ → GRN)', `${avgCycleTimeDays} Days`, 'Optimal'],
        ['Supplier Quality Index', '94.2%', 'Premium'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }
    });

    // Top Suppliers
    doc.text('2. Top Supplier Performance', 15, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Supplier', 'Category', 'Quality Score', 'Delivery Reliability']],
      body: suppliers.slice(0, 5).map(s => [
        s.name, 
        'General', 
        `${s.kpis.deliveryPerformance}%`, 
        `${s.kpis.deliveryPerformance}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Confidential - For Internal Executive Review Only | Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
    }

    doc.save(`ProcureIQ_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExporting(false);
  };

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive KPI Hub</h1>
          <p className="page-subtitle">Strategic overview of procurement operations & financial health</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => {}}>
            <FileJson size={18} /> Export JSON
          </button>
          <button className="btn btn-primary" onClick={exportPDF} disabled={isExporting}>
             <Download size={18} /> {isExporting ? 'Generating...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      <div className="filters-bar glass">
        <div className="filter-group">
          <Calendar size={18} />
          <select value={period} onChange={e => setPeriod(e.target.value)}>
             <option>This Month</option>
             <option>This Quarter</option>
             <option>Year to Date</option>
             <option>Last 12 Months</option>
          </select>
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select>
             <option>All Business Units</option>
             <option>Manufacturing</option>
             <option>Logistics</option>
             <option>IT & Admin</option>
          </select>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Spend Volume</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">${(totalSpend / 1000).toFixed(1)}K</span>
              <span className="stat-trend up">+4.2%</span>
            </div>
            <span className="stat-trend neutral">vs. Previous period</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Target size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Savings</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">${(totalSavings / 1000).toFixed(1)}K</span>
              <span className="stat-trend up">+12.8%</span>
            </div>
            <span className="stat-trend neutral">Actual vs. Benchmark</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg Cycle Time</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">{avgCycleTimeDays} Days</span>
              <span className="stat-trend down">-15%</span>
            </div>
            <span className="stat-trend neutral">Efficiency Improvement</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Risk Compliance</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value">98.4%</span>
            </div>
            <span className="stat-trend neutral">Audit Trail Completeness</span>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card glass">
          <div className="card-header">
            <h3 className="card-title"><BarChart3 size={18} /> Budget VS Actuals</h3>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
             <p className="text-muted">Interactive Spend Chart Comparison Placeholder</p>
             <div className="progress-bar-container" style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginTop: 20 }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${budgetUtilization}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                    borderRadius: 10 
                  }} 
                />
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
                <span>Spent: ${totalSpend.toLocaleString()}</span>
                <span>Remaining: ${(budgets.reduce((s,b) => s + b.totalAmount, 0) - totalSpend).toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="card glass">
          <div className="card-header">
            <h3 className="card-title"><TrendingUp size={18} /> Top Suppliers by Value</h3>
          </div>
          <div className="table-container compact">
             <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Spend</th>
                    <th>Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.slice(0, 5).map(s => (
                    <tr key={s.id}>
                      <td className="font-semibold">{s.name}</td>
                      <td className="font-mono">$84,000</td>
                      <td>
                        <div className="status-badge approved" style={{ fontSize: 10 }}>{s.kpis.deliveryPerformance}%</div>
                      </td>
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
