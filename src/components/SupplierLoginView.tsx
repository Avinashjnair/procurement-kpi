'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Box, Lock, User, ArrowRight, ShieldCheck, Globe } from 'lucide-react';

export default function SupplierLoginView() {
  const { supplierLogin } = useApp();
  const [supplierId, setSupplierId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    // Artificial delay for premium feel
    setTimeout(() => {
      const success = supplierLogin(supplierId, password);
      if (!success) {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-height-screen flex items-center justify-center p-6 bg-[#0b0e14] relative overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-[420px] relative z-10 animate-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/5">
            <Globe className="text-blue-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Vendor Portal</h1>
          <p className="text-gray-400 text-sm">Secure access for ProcureIQ Valued Partners</p>
        </div>

        <div className="bg-[#111319]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Supplier ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. SUP-001"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg animate-shake">
                Invalid Supplier ID or Password. Please try again or contact support.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                loading 
                ? 'bg-blue-600/50 cursor-not-allowed text-white/50' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter Portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>AES-256 Encrypted Connection</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              By logging in, you agree to our Terms of Service and Data Privacy Policy for Valued Partners.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs tracking-wide uppercase">
            Powering Global Supply Chains with <span className="text-blue-400 font-bold">ProcureIQ</span>
          </p>
        </div>
      </div>
    </div>
  );
}
