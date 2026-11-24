'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, ArrowRight, AlertCircle } from 'lucide-react';

export default function CaseAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both operator email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (data.user?.role !== 'case_admin') {
        throw new Error('Access denied: You do not have My Case Service Administrator credentials.');
      }

      router.push('/case-admin/dashboard');
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
          <div className="w-12 h-12 bg-red-700 text-white rounded-xl flex items-center justify-center mx-auto shadow">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">
            My Case Service Operations Admin
          </h1>
          <p className="text-xs text-slate-500">
            System health, storage metrics, and account provisioning (Zero-Knowledge).
          </p>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-[11px] text-red-800 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>
            <strong>Zero-Knowledge Security Wall:</strong> Case service administrators have zero access to advocate case files, clients, or drafts.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operator Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="operator@alwaradvocates.org"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Service Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
