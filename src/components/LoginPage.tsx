'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, Mail, Eye, EyeOff, ChevronRight, ShieldCheck } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'aisha@procureiq.ae', password: 'manager123',  label: 'Manager — Full Access',            role: 'manager',  initials: 'AA', color: '#b1cad7' },
  { email: 'james@procureiq.ae', password: 'engineer123', label: 'Engineer — Limited Access',        role: 'engineer', initials: 'JO', color: '#7c94a0' },
  { email: 'fatima@procureiq.ae',password: 'finance123',  label: 'Finance & Accounts — Payments',   role: 'finance',  initials: 'FZ', color: '#e9c176' },
];

const ROLE_LABELS: Record<string, string> = {
  manager:  'Manager',
  engineer: 'Engineer',
  finance:  'Finance',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  manager:  'Full procurement access, approvals & payments',
  engineer: 'Create POs, RFQs, items and GRNs',
  finance:  'Record payments, upload receipts & AP aging',
};

export default function LoginPage() {
  const { login } = useApp();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = login(email, password);
    setLoading(false);
    if (!ok) setError('Invalid email or password. Try a demo account below.');
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(177,202,215,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(177,202,215,0.02) 0%, transparent 60%)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14, boxShadow: 'var(--shadow-glow)' }}>
            📊
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px', margin: '0 0 6px' }}>ProcureIQ</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Procurement Management Platform</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '36px 32px', boxShadow: 'var(--shadow-card)', backdropFilter: 'blur(20px)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 22px' }}>Intelligence Terminal Login</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-input" placeholder="you@procureiq.ae"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPw ? 'text' : 'password'} className="form-input"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required style={{ paddingLeft: 36, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 10, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 13, color: '#f43f5e' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 15, fontWeight: 700, marginTop: 4 }}
              disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Signing in…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Sign in <ChevronRight size={16} />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Demo accounts</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.email} onClick={() => fillDemo(acc)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%', fontFamily: 'inherit' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${acc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: acc.color, flexShrink: 0 }}>
                  {acc.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{acc.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{ROLE_DESCRIPTIONS[acc.role]}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(140,145,149,0.08)', color: acc.color, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  <ShieldCheck size={10} />
                  {ROLE_LABELS[acc.role]}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
