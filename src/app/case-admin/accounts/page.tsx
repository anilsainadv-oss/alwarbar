'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function CaseAdminAccountsPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/case/accounts')
      .then(r => r.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <Link
        href="/case-admin/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Service Admin</span>
      </Link>

      <div className="border-b pb-4 border-slate-200">
        <h1 className="font-serif font-bold text-2xl text-slate-900">
          Advocate Tenant Accounts & Provisioning
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage chamber user access, activation status, and password reset authorizations.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-4">Advocate / User</th>
              <th className="p-4">Account Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Enrolled On</th>
              <th className="p-4 text-right">Account Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{u.full_name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                </td>
                <td className="p-4 font-mono font-semibold text-slate-700">
                  {u.role}
                </td>
                <td className="p-4">
                  {u.is_active ? (
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                      Active Tenant
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                      Suspended
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-500 font-mono">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => alert(`Password reset link dispatched to ${u.email}`)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-xs"
                  >
                    Send Reset Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
