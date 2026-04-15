'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Bell, Settings, CheckCircle2, AlertCircle, Info, 
  Clock, Trash2, Filter, Search, BellRing, Mail, 
  Smartphone, ShieldCheck, ShoppingCart, CreditCard,
  FileBadge, HardDrive
} from 'lucide-react';

export default function NotificationsPage() {
  const { 
    notifications, markNotificationRead, markAllNotificationsRead, 
    notificationRules, toggleNotificationRule 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'settings'>('feed');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type: string, source: string) => {
    switch (source) {
      case 'PO': return <ShoppingCart size={18} />;
      case 'Payment': return <CreditCard size={18} />;
      case 'Document': return <FileBadge size={18} />;
      case 'GRN': return <HardDrive size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert':
      case 'warning': return '#f43f5e';
      case 'success': return '#10b981';
      case 'info': return '#6366f1';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">Manage your alerts and notification preferences</p>
        </div>
        <div className="btn-group">
          <button 
            className={`btn ${activeTab === 'feed' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('feed')}
          >
            <Bell size={18} /> Feed
          </button>
          <button 
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} /> Settings
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <>
          <div className="filters-bar glass">
            <div className="tabs-minimal">
              <button 
                className={filter === 'all' ? 'active' : ''} 
                onClick={() => setFilter('all')}
              >
                All Notifications
              </button>
              <button 
                className={filter === 'unread' ? 'active' : ''} 
                onClick={() => setFilter('unread')}
              >
                Unread {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead}>
              Mark all read
            </button>
          </div>

          <div className="notification-list card glass">
            {filteredNotifs.length > 0 ? filteredNotifs.map(n => (
              <div 
                key={n.id} 
                className={`notif-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div 
                  className="notif-icon-wrapper" 
                  style={{ background: `${getTypeColor(n.type)}15`, color: getTypeColor(n.type) }}
                >
                  {getIcon(n.type, n.source)}
                </div>
                <div className="notif-content">
                  <div className="notif-title-row">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-time">
                      <Clock size={12} /> {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="notif-message">{n.message}</p>
                </div>
                {!n.read && <div className="unread-dot" />}
              </div>
            )) : (
              <div className="empty-state">
                <BellRing size={48} className="text-muted" />
                <h3>No notifications found</h3>
                <p>We'll alert you when important events happen in the system.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-2">
          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">Event Alerts</h3>
            </div>
            <div className="rule-list">
              {notificationRules.map(rule => (
                <div key={rule.id} className="rule-item">
                  <div className="rule-info">
                    <span className="rule-name">{rule.eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <div className="rule-channels">
                      {rule.channels.includes('in-app') && <span className="channel-tag"><Smartphone size={10} /> In-App</span>}
                      {rule.channels.includes('email') && <span className="channel-tag"><Mail size={10} /> Email</span>}
                    </div>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={rule.enabled} 
                      onChange={() => toggleNotificationRule(rule.id)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass">
            <div className="card-header">
              <h3 className="card-title">Preferences</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <ShieldCheck size={18} />
                <div className="info-content">
                  <label>Security Notifications</label>
                  <span>Alert me on unauthorized login attempts</span>
                </div>
                <div className="badge approved">Always On</div>
              </div>
              <div className="info-item">
                <Mail size={18} />
                <div className="info-content">
                   <label>Daily Digest</label>
                   <span>Receive a summary of all events every morning</span>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .notif-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }
        .notif-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .notif-item.unread {
          background: rgba(99, 102, 241, 0.04);
        }
        .notif-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .notif-content {
          flex: 1;
        }
        .notif-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .notif-title {
          font-weight: 600;
          color: #f1f5f9;
        }
        .notif-time {
          font-size: 11px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .notif-message {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }
        .unread-dot {
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
        }
        .rule-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .rule-item:last-child {
          border-bottom: none;
        }
        .rule-name {
          font-weight: 500;
          font-size: 14px;
          color: #f1f5f9;
        }
        .rule-channels {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .channel-tag {
          font-size: 10px;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 1px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          text-align: center;
        }
        .empty-state h3 {
          margin: 16px 0 8px;
          color: #f1f5f9;
        }
        .empty-state p {
          color: var(--text-muted);
          max-width: 300px;
        }
      `}</style>
    </div>
  );
}
