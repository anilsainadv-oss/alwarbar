'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function PublicAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('public.admin@alwaradvocates.org');
  const [password, setPassword] = useState('AdminPass@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (data.user?.role !== 'public_admin') {
        throw new Error('Access denied: You do not have Public Portal Administrator credentials.');
      }

      router.push('/public-admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-700 text-white rounded-xl flex items-center justify-center mx-auto shadow">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">
            Public Portal Administration
          </h1>
          <p className="text-xs text-slate-500">
            Content curation, welfare schemes, advocate directory verification, and community moderation.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Public Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 font-mono">
          Preset: public.admin@alwaradvocates.org / AdminPass@2026
        </div>
      </div>
    </div>
  );
}
