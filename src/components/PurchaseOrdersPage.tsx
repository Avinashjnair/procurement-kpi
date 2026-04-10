'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, ChevronDown } from 'lucide-react';
import type { POStatus } from '@/data/mockData';

const ALL_STATUSES: POStatus[] = ['Draft', 'Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled'];

function StatusDropdown({ currentStatus, onStatusChange }: {
  currentStatus: POStatus;
  onStatusChange: (status: POStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="status-dropdown">
      <button
        className={`badge ${currentStatus.toLowerCase()}`}
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        <span className="badge-dot" />
        {currentStatus}
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div className="status-dropdown-menu">
            {ALL_STATUSES.map(status => (
              <button
                key={status}
                className="status-dropdown-item"
                onClick={e => {
                  e.stopPropagation();
                  onStatusChange(status);
                  setOpen(false);
                }}
              >
                <span className={`badge ${status.toLowerCase()}`} style={{ transform: 'scale(0.9)' }}>
                  <span className="badge-dot" />
                  {status}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const { purchaseOrders, updatePOStatus } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<string>('dateOfIssue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = purchaseOrders.filter(po => {
      const matchSearch =
        po.id.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || po.deliveryStatus === statusFilter;
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortField) {
        case 'dateOfIssue': aVal = a.dateOfIssue; bVal = b.dateOfIssue; break;
        case 'totalAmount': aVal = a.totalAmount; bVal = b.totalAmount; break;
        case 'dueDate': aVal = a.dueDate; bVal = b.dueDate; break;
        case 'supplierName': aVal = a.supplierName; bVal = b.supplierName; break;
        default: aVal = a.id; bVal = b.id;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [purchaseOrders, search, statusFilter, sortField, sortDir]);

  const kanbanColumns: POStatus[] = ['Pending', 'Approved', 'Shipped', 'Delivered'];

  const SortIcon = ({ field }: { field: string }) => (
    <span style={{ opacity: sortField === field ? 1 : 0.3, fontSize: '10px', marginLeft: '4px' }}>
      {sortField === field && sortDir === 'asc' ? '▲' : '▼'}
    </span>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Purchase Orders</h2>
        <p>Track and manage the entire PO lifecycle</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button
            className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            📋 Table View
          </button>
          <button
            className={`tab-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            📌 Kanban Board
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search PO# or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {viewMode === 'table' ? (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>PO # <SortIcon field="id" /></th>
                  <th onClick={() => handleSort('dateOfIssue')}>Date Issued <SortIcon field="dateOfIssue" /></th>
                  <th onClick={() => handleSort('supplierName')}>Supplier <SortIcon field="supplierName" /></th>
                  <th>Items</th>
                  <th onClick={() => handleSort('totalAmount')}>Amount <SortIcon field="totalAmount" /></th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th onClick={() => handleSort('dueDate')}>Due Date <SortIcon field="dueDate" /></th>
                  <th>ETA</th>
                  <th>Incoterms</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{po.id}</td>
                    <td>{po.dateOfIssue}</td>
                    <td>{po.supplierName}</td>
                    <td>
                      <span className="truncate" style={{ maxWidth: 180 }}>
                        {po.items.map(i => i.itemName).join(', ')}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      ${po.totalAmount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${po.paymentStatus.toLowerCase()}`}>
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <StatusDropdown
                        currentStatus={po.deliveryStatus}
                        onStatusChange={status => updatePOStatus(po.id, status)}
                      />
                    </td>
                    <td>{po.dueDate}</td>
                    <td>{po.eta}</td>
                    <td>
                      <span className="badge approved">{po.incoterms}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kanbanColumns.length}, 1fr)`, gap: '16px' }}>
          {kanbanColumns.map(status => {
            const columnPOs = purchaseOrders.filter(po => po.deliveryStatus === status);
            return (
              <div key={status}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                  padding: '8px 12px', borderRadius: '10px',
                  background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-color)'
                }}>
                  <span className={`badge ${status.toLowerCase()}`}>
                    <span className="badge-dot" />
                    {status}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {columnPOs.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {columnPOs.map(po => (
                    <div key={po.id} className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '14px' }}>{po.id}</span>
                        <span className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: '#6366f1' }}>
                          ${po.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {po.supplierName}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>ETA: {po.eta}</span>
                        <span>·</span>
                        <span>{po.incoterms}</span>
                        <span>·</span>
                        <span className={`badge ${po.paymentStatus.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                          {po.paymentStatus}
                        </span>
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {po.items.map(i => i.itemName).join(', ')}
                      </div>
                    </div>
                  ))}
                  {columnPOs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No POs
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
