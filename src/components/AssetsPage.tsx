'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Plus, Search, Filter, ShieldCheck, Wrench, Calendar, MapPin, 
  TrendingDown, TrendingUp, AlertTriangle, ArrowLeft, MoreVertical,
  History, Settings, Download, MoreHorizontal, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { Asset, MaintenanceRecord } from '@/types';

function AssetDetail({ assetId }: { assetId: string }) {
  const { assets, setSelectedAssetId, calculateCurrentAssetValue, getSupplierById, logMaintenance } = useApp();
  const asset = assets.find(a => a.id === assetId);
  const supplier = asset ? getSupplierById(asset.supplierId) : null;

  if (!asset) return <div>Asset not found</div>;

  const currentValue = calculateCurrentAssetValue(asset);
  const totalDepreciation = asset.purchaseValue - currentValue;

  // Generate depreciation projection data for the chart
  const projectionData = useMemo(() => {
    const data = [];
    const startYear = new Date(asset.purchaseDate).getFullYear();
    for (let i = 0; i <= asset.usefulLife; i++) {
      const yearVal = asset.purchaseValue * Math.pow(1 - asset.depreciationRate, i);
      data.push({
        year: startYear + i,
        value: Math.max(yearVal, asset.salvageValue)
      });
    }
    return data;
  }, [asset]);

  return (
    <div className="animate-in fade-in duration-500">
      <button className="detail-back" onClick={() => setSelectedAssetId(null)}>
        <ArrowLeft size={16} /> Back to Assets
      </button>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>{asset.name}</h2>
              <span className={`badge ${asset.status === 'Active' ? 'approved' : 'pending'}`}>{asset.status}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{asset.id} · {asset.category} · {asset.location}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>${currentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Book Value</div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={18} style={{ color: 'var(--accent-indigo)' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Depreciation</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>${totalDepreciation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {( (totalDepreciation / asset.purchaseValue) * 100 ).toFixed(1)}% of initial value lost
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Warranty Status</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
                {new Date(asset.warrantyExpiry || '') > new Date() ? 'Active' : 'Expired'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Expires: {asset.warrantyExpiry || 'N/A'}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <Wrench size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service Plan</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{asset.maintenancePlan}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Last service: {asset.maintenanceHistory[0]?.date || 'No records'}
          </div>
        </div>
      </div>

      <div className="charts-grid-equal" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Depreciation Curve</div>
            <div className="card-subtitle">Declining Balance @ {asset.depreciationRate * 100}%</div>
          </div>
          <div style={{ height: 280, width: '100%', marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Book Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Maintenance Logs</div>
            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>View All</button>
          </div>
          <div className="data-table-wrapper" style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {asset.maintenanceHistory.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12 }}>{log.date}</td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{log.activity}</td>
                    <td className="font-mono" style={{ fontSize: 12 }}>${log.cost}</td>
                  </tr>
                ))}
                {asset.maintenanceHistory.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No history found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Asset Specifications</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Purchase Supplier</div>
            <div style={{ fontSize: 14, color: '#f1f5f9' }}>{supplier?.name || 'Unknown'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Serial Number</div>
            <div style={{ fontSize: 14, color: '#f1f5f9' }}>{asset.serialNumber || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>PO Reference</div>
            <div style={{ fontSize: 14, color: asset.poId ? 'var(--accent-indigo)' : '#f1f5f9', fontWeight: asset.poId ? 600 : 400 }}>
              {asset.poId || 'No PO Linked'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Useful Life</div>
            <div style={{ fontSize: 14, color: '#f1f5f9' }}>{asset.usefulLife} Years</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Salvage Value</div>
            <div style={{ fontSize: 14, color: '#f1f5f9' }}>${asset.salvageValue.toLocaleString()}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Warranty Clause</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{asset.warrantyDetails || 'Standard warranty terms apply.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { assets, assetCategories, setSelectedAssetId, selectedAssetId, calculateCurrentAssetValue, setModalOpen } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const filteredAssets = useMemo(() => assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'All' || a.category === catFilter;
    return matchesSearch && matchesCat;
  }), [assets, search, catFilter]);

  if (selectedAssetId) return <AssetDetail assetId={selectedAssetId} />;

  const totalValue = assets.reduce((sum, a) => sum + a.purchaseValue, 0);
  const netBookValue = assets.reduce((sum, a) => sum + calculateCurrentAssetValue(a), 0);
  const maintenancePending = assets.filter(a => a.status === 'Under Maintenance').length;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2>Fixed Asset Management</h2>
            <p>Track high-value capital assets, depreciation, and maintenance lifecycle</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen('newAsset')}>
            <Plus size={18} /> Add New Asset
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="kpi-label">Total Asset Inventory</div>
          <div className="kpi-value">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <Calendar size={12} /> {assets.length} Assets Registered
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Current Net Book Value</div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>${netBookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: 'var(--accent-emerald)' }}>
             <TrendingDown size={12} /> {Math.round(( (totalValue - netBookValue) / totalValue ) * 100)}% Total Depreciation
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Maintenance Alerts</div>
          <div className="kpi-value" style={{ color: maintenancePending > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{maintenancePending}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: maintenancePending > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
            <AlertTriangle size={12} /> Assets requiring attention
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search assets by name, ID or location..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="filter-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {assetCategories?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" style={{ minWidth: 40, padding: '0 10px' }}>
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Name & Category</th>
                <th>Location</th>
                <th>Purchase Cost</th>
                <th>Current Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => {
                const currentVal = calculateCurrentAssetValue(asset);
                return (
                  <tr key={asset.id} className="clickable" onClick={() => setSelectedAssetId(asset.id)}>
                    <td style={{ fontWeight: 600 }}>{asset.id}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#f1f5f9', fontSize: 14 }}>{asset.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.category}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} /> {asset.location}
                      </div>
                    </td>
                    <td className="font-mono">${asset.purchaseValue.toLocaleString()}</td>
                    <td className="font-mono" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      ${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td>
                      <span className={`badge ${asset.status === 'Active' ? 'approved' : 'pending'}`}>
                        {asset.status === 'Active' ? <CheckCircle2 size={10} style={{ marginRight: 4 }} /> : <Clock size={10} style={{ marginRight: 4 }} />}
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); }}>
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredAssets.length === 0 && (
          <div className="empty-state">
            <Search size={48} />
            <h3>No assets found</h3>
            <p>Try matching with a different keyword or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
