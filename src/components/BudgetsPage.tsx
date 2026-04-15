'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Landmark, Plus, AlertCircle, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { BudgetEnvelope } from '@/types';

export default function BudgetsPage() {
  const { budgets, addBudget, updateBudget, darkMode } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBudgets = budgets.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.project?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Budget Management</h2>
          <p>Global allocation tracking by Department and Project</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> New Envelope
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={22} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>
                ${(budgets.reduce((s, b) => s + b.totalAmount, 0) / 1000000).toFixed(2)}M
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Allocated</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>
                ${(budgets.reduce((s, b) => s + b.committedAmount, 0) / 1000).toFixed(1)}k
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Committed</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={22} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>
                ${(budgets.reduce((s, b) => s + b.spentAmount, 0) / 1000).toFixed(1)}k
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Spent</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <input 
            type="text" 
            placeholder="Search envelopes, depts, or projects..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'white' }}
          />
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Budget Name</th>
                <th>Dept / Project</th>
                <th>Allocated</th>
                <th>Utilization</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.map(b => {
                const totalUsed = b.spentAmount + b.committedAmount;
                const utilPct = Math.round((totalUsed / b.totalAmount) * 100);
                const remaining = b.totalAmount - totalUsed;
                const statusColor = utilPct >= 100 ? '#f43f5e' : utilPct >= 80 ? '#f59e0b' : '#10b981';

                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.id} · {b.period}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: '#f1f5f9' }}>{b.department}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.project || 'General Operations'}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>${b.totalAmount.toLocaleString()}</td>
                    <td>
                      <div style={{ width: 140 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span>{utilPct}% Used</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(utilPct, 100)}%`, background: statusColor }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ color: remaining < 0 ? '#f43f5e' : '#f1f5f9' }}>
                      ${remaining.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${utilPct >= 100 ? 'cancelled' : utilPct >= 80 ? 'pending' : 'delivered'}`}>
                        {utilPct >= 100 ? 'Over Limit' : utilPct >= 80 ? 'Warning' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
