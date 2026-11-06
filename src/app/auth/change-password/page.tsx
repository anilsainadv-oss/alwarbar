'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  KeyRound, Lock, Mail, Eye, EyeOff, CheckCircle2, 
  AlertCircle, ArrowRight, ShieldCheck, ArrowLeft 
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Check if user is already logged in to pre-fill email
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.email) {
          setEmail(data.user.email);
          setIsLoggedIn(true);
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(locale === 'hi' ? 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' : 'New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError(locale === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters.');
      return;
    }

    if (currentPassword === newPassword) {
      setError(locale === 'hi' ? 'नया पासवर्ड पुराने पासवर्ड से भिन्न होना चाहिए।' : 'New password must be different from the current password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (locale === 'hi' ? 'पासवर्ड बदलने में विफलता' : 'Failed to change password'));
      }

      setSuccess(data.message || (locale === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल दिया गया है!' : 'Password updated successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto-redirect if logged in after 2 seconds
      setTimeout(() => {
        if (userRole === 'public_admin') {
          router.push('/public-admin/dashboard');
        } else if (userRole === 'case_admin') {
          router.push('/case-admin/dashboard');
        } else if (isLoggedIn) {
          router.push('/my-case/dashboard');
        } else {
          router.push('/auth/login');
        }
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        
        {/* Back Link */}
        <div className="mb-4">
          <Link 
            href={isLoggedIn ? (userRole === 'public_admin' ? '/public-admin/dashboard' : '/my-case/dashboard') : '/auth/login'} 
            className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'hi' ? 'वापस जाएं' : 'Back'}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-legal-navy text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-legal-navy">
            {locale === 'hi' ? 'पासवर्ड बदलें' : 'Change Password'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {locale === 'hi' 
              ? 'अपने खाते की सुरक्षा के लिए नया पासवर्ड सेट करें' 
              : 'Set a new secure password for your advocate portal account'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs space-y-2">
            <div className="flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              {locale === 'hi' ? 'आपको कुछ ही क्षणों में पुनः निर्देशित किया जा रहा है...' : 'Redirecting you shortly...'}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Registered Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {locale === 'hi' ? 'पंजीकृत ईमेल आईडी' : 'Registered Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoggedIn}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isLoggedIn ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder="advocate@alwarbar.in"
              />
            </div>
            {isLoggedIn && (
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {locale === 'hi' ? 'सक्रिय सत्र से स्वतः लिया गया' : 'Auto-filled from active session'}
              </span>
            )}
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {locale === 'hi' ? 'वर्तमान पासवर्ड' : 'Current Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {locale === 'hi' ? 'नया पासवर्ड (New Password)' : 'New Password'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="नया पासवर्ड (न्यूनतम 6 अक्षर)"
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

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {locale === 'hi' ? 'नया पासवर्ड पुनः दर्ज करें (Confirm)' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="नया पासवर्ड पुनः लिखें"
              />
            </div>
            {newPassword && confirmPassword && (
              <span className={`text-[11px] font-medium mt-1 block ${
                newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {newPassword === confirmPassword 
                  ? (locale === 'hi' ? '✓ पासवर्ड मेल खा रहे हैं' : '✓ Passwords match')
                  : (locale === 'hi' ? '✗ दोनों पासवर्ड समान नहीं हैं' : '✗ Passwords do not match')}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-legal-navy hover:bg-slate-800 text-amber-300 font-semibold text-sm transition flex items-center justify-center space-x-2 shadow disabled:opacity-50"
          >
            <span>{loading 
              ? (locale === 'hi' ? 'सत्यापित किया जा रहा है...' : 'Updating...') 
              : (locale === 'hi' ? 'पासवर्ड अपडेट करें' : 'Update Password')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
          <p>
            {locale === 'hi' 
              ? 'पासवर्ड बदलने के बाद सभी सक्रिय सत्रों में नया पासवर्ड लागू होगा।' 
              : 'New password will take effect immediately across all sessions.'}
          </p>
          <div className="mt-2">
            <Link href="/auth/login" className="text-amber-700 hover:underline font-medium text-xs">
              {locale === 'hi' ? '← लॉगिन पेज पर जाएं' : '← Back to Login'}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
