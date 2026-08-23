'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Search, RefreshCw, Clock, HardDrive } from 'lucide-react';

export default function AuditLogsPage() {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');

  const filtered = auditLogs.filter(log => {
    const matchesSearch = 
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase() === actionFilter.toLowerCase();
    const matchesTarget = targetFilter === 'all' || log.entityType.toLowerCase() === targetFilter.toLowerCase();

    return matchesSearch && matchesAction && matchesTarget;
  });

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return '#10b981';
      case 'update': return '#6366f1';
      case 'delete': return '#ef4444';
      case 'approve': return '#14b8a6';
      default: return '#94a3b8';
    }
  };

  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action)));
  const uniqueTargets = Array.from(new Set(auditLogs.map(l => l.entityType)));

  return (
    <div className="page-content animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>System Audit Trail</h2>
          <p>Chronological records of database mutations, edits, deletions, and user actions</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Refresh Trail
        </button>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 2, minWidth: 260 }}>
          <Search size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search logs by description, user, or record ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-select" 
            style={{ width: 160 }}
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>

          <select 
            className="form-select" 
            style={{ width: 160 }}
            value={targetFilter} 
            onChange={(e) => setTargetFilter(e.target.value)}
          >
            <option value="all">All Models</option>
            {uniqueTargets.map(tgt => (
              <option key={tgt} value={tgt}>{tgt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Target Model</th>
              <th>Record ID</th>
              <th>Activity Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => {
              const formattedDate = new Date(log.timestamp).toLocaleString();
              return (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--text-muted)' }} />
                    {formattedDate}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                        {log.actorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{log.actorName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.actorId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '4px 8px', 
                      borderRadius: 6, 
                      fontSize: 11, 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      background: `${getActionColor(log.action)}15`,
                      color: getActionColor(log.action),
                      border: `1px solid ${getActionColor(log.action)}30`
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    <HardDrive size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--text-muted)' }} />
                    {log.entityType}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-indigo)' }}>
                    {log.entityId}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {log.description}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div>No matching audit records found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
