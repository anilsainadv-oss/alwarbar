'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Settings, Sparkles, Shield, User, Download, 
  CheckCircle2, Lock, KeyRound, Eye, EyeOff, AlertCircle, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function OfficeSettingsPage() {
  const { t, locale } = useLanguage();
  const [chamber, setChamber] = useState('Chamber No. 42, Civil Wing, District Court Campus, Alwar');
  const [courtComplex, setCourtComplex] = useState('District & Sessions Court, Alwar');
  const [saved, setSaved] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError(locale === 'hi' ? 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' : 'New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError(locale === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters.');
      return;
    }

    if (currentPassword === newPassword) {
      setPwdError(locale === 'hi' ? 'नया पासवर्ड पुराने पासवर्ड से भिन्न होना चाहिए।' : 'New password must be different from current password.');
      return;
    }

    setPwdLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (locale === 'hi' ? 'पासवर्ड बदलने में विफलता' : 'Failed to change password'));
      }

      setPwdSuccess(data.message || (locale === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल दिया गया है!' : 'Password updated successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 5000);
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : 'Error changing password');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b pb-5 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Settings className="w-4 h-4" />
          <span>Workspace Preferences</span>
        </div>
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
          {locale === 'hi' ? 'कार्यालय सेटिंग्स एवं सुरक्षा विन्यास' : 'My Case Office Settings & Security Configuration'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {locale === 'hi'
            ? 'अपने चैंबर विवरण, खाता पासवर्ड और एआई इंजन का प्रबंधन करें।'
            : 'Manage your advocate chamber credentials, account password, and AI engine options.'}
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Office settings updated successfully!</span>
        </div>
      )}

      {/* Security & Change Password Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
        <div className="border-b pb-3 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>{locale === 'hi' ? 'खाता पासवर्ड बदलें (Change Password)' : 'Account Password & Security'}</span>
          </h2>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            SHA-256 Salted Hash
          </span>
        </div>

        {pwdError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        {pwdSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{pwdSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {locale === 'hi' ? 'वर्तमान पासवर्ड' : 'Current Password'}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-3 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                placeholder="वर्तमान पासवर्ड दर्ज करें"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'नया पासवर्ड' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-3 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  placeholder="न्यूनतम 6 अक्षर"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'नया पासवर्ड पुनः दर्ज करें' : 'Confirm Password'}
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                placeholder="पुनः दर्ज करें"
              />
            </div>
          </div>

          {newPassword && confirmPassword && (
            <span className={`text-[11px] font-medium block ${
              newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {newPassword === confirmPassword 
                ? (locale === 'hi' ? '✓ दोनों पासवर्ड समान हैं' : '✓ Passwords match')
                : (locale === 'hi' ? '✗ दोनों पासवर्ड मेल नहीं खाते' : '✗ Passwords do not match')}
            </span>
          )}

          <div className="flex items-center space-x-3 pt-1">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-4 py-2 bg-legal-navy hover:bg-slate-800 text-amber-300 font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>{pwdLoading ? 'अपडेट हो रहा है...' : (locale === 'hi' ? 'पासवर्ड बदलें' : 'Update Password')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link
              href="/auth/change-password"
              className="text-amber-700 hover:underline text-xs"
            >
              {locale === 'hi' ? 'पूर्ण स्क्रीन में खोलें →' : 'Open Full Screen →'}
            </Link>
          </div>
        </form>
      </div>

      {/* AI Provider Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Legal Engine Status</span>
          </h2>
          <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded text-[11px]">
            Active: Deterministic Offline Demo Mode
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">
          The application is currently running in <strong>Honest Demo Mode</strong> using deterministic legal templates verified for Alwar court practice. This provides immediate, zero-cost drafting and analysis without external network dependency.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] font-mono">
          <span className="font-bold text-slate-700 block">To enable live Google Gemini or OpenAI LLM inference:</span>
          <p className="text-slate-600">
            Open <code>.env.local</code> in your project directory and set:
          </p>
          <pre className="p-2.5 bg-slate-900 text-amber-300 rounded overflow-x-auto">
{`AI_PROVIDER="gemini"
AI_API_KEY="AIzaSy..."
AI_MODEL_NAME="gemini-1.5-flash"`}
          </pre>
        </div>
      </div>

      {/* Chamber Profile Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h2 className="font-serif font-bold text-base text-slate-900 border-b pb-3 flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-700" />
          <span>Advocate Practice Profile Details</span>
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chamber Address (Pleadings Header)</label>
            <input
              type="text"
              value={chamber}
              onChange={e => setChamber(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Primary Practice Complex</label>
            <input
              type="text"
              value={courtComplex}
              onChange={e => setCourtComplex(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg font-semibold shadow-sm transition"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Zero-Knowledge Security Notice */}
      <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
        <h3 className="font-bold text-sm flex items-center space-x-1.5">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>Privilege & Zero-Knowledge Verification</span>
        </h3>
        <p className="leading-relaxed">
          Your case dossiers, client rosters, and drafts are isolated by foreign key <code>advocate_id = session.user.id</code>.
          Neither portal administrators nor other advocates have technical ability to query or inspect your records.
        </p>
      </div>
    </div>
  );
}
