'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Key, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BootstrapAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('setup-alwar-admin-token-2026');
  const [role, setRole] = useState<'public_admin' | 'case_admin'>('public_admin');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, password, token, role })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bootstrap failed');
      }

      setSuccess(`Administrator created successfully as ${role.toUpperCase()}! Redirecting...`);
      setTimeout(() => {
        if (role === 'case_admin') router.push('/case-admin/dashboard');
        else router.push('/public-admin/dashboard');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">
            Initial Administrator Bootstrap
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Establish a verified super-administrator using the server environment token. Hardcoded default passwords are strictly prohibited.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleBootstrap} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Administrative Panel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('public_admin')}
                className={`p-3 rounded-lg border text-left text-xs transition ${
                  role === 'public_admin' 
                    ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Public Portal Admin</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Content, Welfare & Directory</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('case_admin')}
                className={`p-3 rounded-lg border text-left text-xs transition ${
                  role === 'case_admin' 
                    ? 'border-red-600 bg-red-50/60 font-semibold text-red-900' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Case Service Admin</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Telemetry & Quotas (Zero Files)</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Admin Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Senior Administrator"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="admin@alwarbar.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Environment Bootstrap Token (`ADMIN_BOOTSTRAP_TOKEN`)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Check .env.local"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition shadow flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Verifying & Initializing...' : 'Claim Administrator Status'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
