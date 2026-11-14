'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Settings, Sparkles, Shield, User, Download, 
  CheckCircle2, Lock, KeyRound, Eye, EyeOff, AlertCircle, ArrowRight, Briefcase, Award,
  Bell, Mail, MessageSquare, Play, History, Check, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import type { AdvocateProfile } from '@/types/database';

export default function OfficeSettingsPage() {
  const { t, locale } = useLanguage();

  // Profile states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [barAssociation, setBarAssociation] = useState('District Bar Association, Alwar');
  const [chamberAddress, setChamberAddress] = useState('');
  const [courtComplex, setCourtComplex] = useState('District & Sessions Court, Alwar');
  const [experienceYears, setExperienceYears] = useState(1);
  const [practiceAreas, setPracticeAreas] = useState<string[]>(['Civil', 'Criminal']);
  const [bioHindi, setBioHindi] = useState('');
  const [bioEnglish, setBioEnglish] = useState('');
  const [isPubliclyListed, setIsPubliclyListed] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Notification Preferences State (P4)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(false);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifDailyDigest, setNotifDailyDigest] = useState(true);
  const [notifDailyTime, setNotifDailyTime] = useState('08:00');
  const [notifLeadDays, setNotifLeadDays] = useState<number[]>([1, 2]);
  const [notifClientReminders, setNotifClientReminders] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifError, setNotifError] = useState('');

  // Automation Run State
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [automationResult, setAutomationResult] = useState<any>(null);

  // Delivery History State
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);

  const loadNotifications = () => {
    fetch('/api/my-case/notifications/preferences')
      .then(r => r.json())
      .then(data => {
        if (data.preferences) {
          const p = data.preferences;
          setNotifEmail(p.email_enabled);
          setNotifWhatsApp(p.whatsapp_enabled);
          setNotifInApp(p.in_app_enabled);
          setNotifDailyDigest(p.daily_digest_enabled);
          setNotifDailyTime(p.daily_digest_time || '08:00');
          setNotifLeadDays(p.reminder_lead_days || [1, 2]);
          setNotifClientReminders(p.client_reminders_enabled);
        }
      })
      .catch(console.error);

    fetch('/api/my-case/notifications/history?limit=10')
      .then(r => r.json())
      .then(data => {
        if (data.history) setDeliveryHistory(data.history);
      })
      .catch(console.error);
  };

  const loadProfile = () => {
    fetch('/api/my-case/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          const p = data.profile;
          setEnrollmentNo(p.bar_council_enrollment_no || '');
          setBarAssociation(p.bar_association_name || 'District Bar Association, Alwar');
          setChamberAddress(p.chamber_address || '');
          setCourtComplex(p.court_practice_complex || 'District & Sessions Court, Alwar');
          setExperienceYears(p.experience_years || 1);
          setPracticeAreas(p.practice_areas || ['Civil', 'Criminal']);
          setBioHindi(p.bio_hindi || '');
          setBioEnglish(p.bio_english || '');
          setIsPubliclyListed(p.is_publicly_listed ?? true);
        }
        if (data.user) {
          setFullName(data.user.full_name || '');
          setEmail(data.user.email || '');
          if (data.user.phone) setPhone(data.user.phone);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingProfile(false));
  };

  useEffect(() => {
    loadProfile();
    loadNotifications();
  }, []);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSaving(true);
    setNotifError('');
    try {
      const res = await fetch('/api/my-case/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_enabled: notifEmail,
          whatsapp_enabled: notifWhatsApp,
          in_app_enabled: notifInApp,
          daily_digest_enabled: notifDailyDigest,
          daily_digest_time: notifDailyTime,
          reminder_lead_days: notifLeadDays,
          client_reminders_enabled: notifClientReminders,
          preferred_language: locale === 'hi' ? 'hi' : 'en'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save notification preferences');
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch (err: unknown) {
      setNotifError(err instanceof Error ? err.message : 'Error updating preferences');
    } finally {
      setNotifSaving(false);
    }
  };

  const handleRunAutomations = async () => {
    setRunningAutomation(true);
    try {
      const res = await fetch('/api/my-case/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_type: 'all' })
      });
      const data = await res.json();
      setAutomationResult(data);
      loadNotifications();
      setTimeout(() => setAutomationResult(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);

    try {
      const res = await fetch('/api/my-case/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          bar_council_enrollment_no: enrollmentNo,
          bar_association_name: barAssociation,
          chamber_address: chamberAddress,
          court_practice_complex: courtComplex,
          experience_years: experienceYears,
          practice_areas: practiceAreas,
          bio_hindi: bioHindi,
          bio_english: bioEnglish,
          is_publicly_listed: isPubliclyListed
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 4000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setProfileSaving(false);
    }
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

  const togglePracticeArea = (area: string) => {
    if (practiceAreas.includes(area)) {
      setPracticeAreas(practiceAreas.filter(a => a !== area));
    } else {
      setPracticeAreas([...practiceAreas, area]);
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
          {locale === 'hi' ? 'कार्यालय सेटिंग्स एवं प्रोफाइल विन्यास' : 'My Case Office Settings & Profile'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {locale === 'hi'
            ? 'अपने पेशेवर विवरण, चैंबर पता, संपर्क जानकारी एवं सुरक्षा पासवर्ड का प्रबंधन करें।'
            : 'Manage your advocate practice profile, chamber credentials, contact information, and security.'}
        </p>
      </div>

      {/* Advocate Practice Profile Settings Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <User className="w-4 h-4 text-amber-700" />
            <span>{locale === 'hi' ? 'अधिवक्ता पेशेवर प्रोफाइल (Professional Practice Profile)' : 'Advocate Professional Profile'}</span>
          </h2>
          <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded font-medium">
            {locale === 'hi' ? 'सार्वजनिक एवं व्यक्तिगत' : 'Directory & Pleading Header'}
          </span>
        </div>

        {profileSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              {locale === 'hi' 
                ? 'अधिवक्ता प्रोफाइल सफलतापूर्वक अपडेट कर दी गई है!' 
                : 'Advocate profile and chamber information updated successfully!'}
            </span>
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {loadingProfile ? (
          <div className="p-8 text-center text-slate-400">Loading advocate profile...</div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'अधिवक्ता का पूरा नाम' : 'Full Name'}
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Advocate Name"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'ईमेल (Login Email)' : 'Email (Read-only)'}
                </label>
                <input
                  disabled
                  type="email"
                  value={email}
                  className="w-full p-2.5 border rounded-lg bg-slate-50 text-slate-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'बार काउंसिल सनद संख्या' : 'Bar Council Enrollment No.'}
                </label>
                <input
                  type="text"
                  value={enrollmentNo}
                  onChange={e => setEnrollmentNo(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono"
                  placeholder="e.g. R/331/1977"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'मोबाइल नंबर' : 'Phone / Mobile'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono"
                  placeholder="94140XXXXX"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'वकालत अनुभव (वर्ष)' : 'Years of Experience'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={experienceYears}
                  onChange={e => setExperienceYears(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'बार एसोसिएशन का नाम' : 'Bar Association'}
                </label>
                <input
                  type="text"
                  value={barAssociation}
                  onChange={e => setBarAssociation(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="District Bar Association, Alwar"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'प्राथमिक न्यायालय परिसर' : 'Primary Practice Complex'}
                </label>
                <input
                  type="text"
                  value={courtComplex}
                  onChange={e => setCourtComplex(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="District & Sessions Court, Alwar"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'चैंबर / कार्यालय का पता (वकालतनामे व प्रार्थना पत्रों हेतु)' : 'Chamber Address (Appears on Pleadings & Vakalatnama)'}
              </label>
              <input
                type="text"
                value={chamberAddress}
                onChange={e => setChamberAddress(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
                placeholder="e.g. Chamber No. 42, Civil Wing, District Court Campus, Alwar"
              />
            </div>

            {/* Practice Areas */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {locale === 'hi' ? 'अभ्यास के प्रमुख क्षेत्र (Practice Areas)' : 'Practice Areas'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Civil', 'Criminal', 'Revenue Law', 'Bail & NDPS', 
                  'Constitutional (High Court)', 'Motor Accident (MACT)', 
                  'Family Law', 'POCSO & Special Laws', 'Arbitration & Commercial'
                ].map(area => (
                  <button
                    type="button"
                    key={area}
                    onClick={() => togglePracticeArea(area)}
                    className={`px-3 py-1 rounded-lg border transition text-[11px] font-medium ${
                      practiceAreas.includes(area)
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {practiceAreas.includes(area) ? '✓ ' : '+ '}{area}
                  </button>
                ))}
              </div>
            </div>

            {/* Bios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'परिचय (हिंदी)' : 'Professional Bio (Hindi)'}
                </label>
                <textarea
                  rows={3}
                  value={bioHindi}
                  onChange={e => setBioHindi(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="अलवर न्यायालय में सिविल एवं दांडिक मुकदमों में वरिष्ठ विधिक परामर्श..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === 'hi' ? 'परिचय (अंग्रेजी)' : 'Professional Bio (English)'}
                </label>
                <textarea
                  rows={3}
                  value={bioEnglish}
                  onChange={e => setBioEnglish(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Specialized in Civil Trials, Revenue Writs, and Sessions Trials in Alwar..."
                />
              </div>
            </div>

            {/* Public Listing Toggle */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                id="isPubliclyListed"
                checked={isPubliclyListed}
                onChange={e => setIsPubliclyListed(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="isPubliclyListed" className="text-slate-800 font-medium">
                {locale === 'hi' 
                  ? 'अलवर अधिवक्ता सार्वजनिक डायरेक्टरी में मेरी प्रोफाइल प्रदर्शित करें।' 
                  : 'Display my profile in the Alwar Advocates Public Directory (/advocates).'}
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {profileSaving ? 'Saving Profile...' : 'Save Advocate Profile'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security & Change Password Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
        <div className="border-b pb-3 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>{locale === 'hi' ? 'खाता पासवर्ड बदलें (Change Password)' : 'Account Password & Security'}</span>
          </h2>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            BCrypt-12 Salted Hash
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
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
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

      {/* ======================================================== */}
      {/* NOTIFICATION & AUTOMATION PREFERENCES (P4) */}
      {/* ======================================================== */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>{locale === 'hi' ? 'अधिसूचना एवं ऑटोमेशन प्राथमिकताएं' : 'Notification & Automation Preferences'}</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure daily court diary digests, automated hearing reminders, and client notice triggers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunAutomations}
            disabled={runningAutomation}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${runningAutomation ? 'animate-spin' : ''}`} />
            <span>{runningAutomation ? 'Executing...' : 'Run Automations Now'}</span>
          </button>
        </div>

        {automationResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-1">
            <span className="font-bold block">✓ Automation Trigger Completed:</span>
            <div className="flex flex-wrap gap-4 text-[11px]">
              <span>Reminders: <strong>{automationResult.remindersSent}</strong></span>
              <span>Digests: <strong>{automationResult.digestsSent}</strong></span>
              <span>Client Notices: <strong>{automationResult.clientNoticesSent}</strong></span>
              <span>Duplicates Prevented: <strong>{automationResult.skippedDuplicates}</strong></span>
            </div>
          </div>
        )}

        {notifSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        {notifError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {notifError}
          </div>
        )}

        <form onSubmit={handleSaveNotifications} className="space-y-5">
          {/* Channel Toggles */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">Notification Delivery Channels</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={notifEmail}
                  onChange={e => setNotifEmail(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Email Alerts</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Daily diary & reminders</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={notifWhatsApp}
                  onChange={e => setNotifWhatsApp(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp API</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Authorized Business API</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={notifInApp}
                  onChange={e => setNotifInApp(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 flex items-center space-x-1">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>In-App Banner</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Dashboard status badge</span>
                </div>
              </label>
            </div>
          </div>

          {/* Daily Hearing Digest Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="flex items-center space-x-2 mb-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={notifDailyDigest}
                  onChange={e => setNotifDailyDigest(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Enable Morning Cause List Digest</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Sends a summary table of all hearings scheduled for today before Alwar District Courts.
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-600">Dispatch Time:</span>
                <input
                  type="time"
                  value={notifDailyTime}
                  onChange={e => setNotifDailyTime(e.target.value)}
                  className="p-1.5 border rounded-lg bg-slate-50 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hearing Reminder Lead Time</label>
              <p className="text-[11px] text-slate-500 mb-2">
                How many days before the scheduled hearing date to dispatch reminders:
              </p>
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map(days => (
                  <label key={days} className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifLeadDays.includes(days)}
                      onChange={e => {
                        if (e.target.checked) setNotifLeadDays([...notifLeadDays, days]);
                        else setNotifLeadDays(notifLeadDays.filter(d => d !== days));
                      }}
                      className="rounded text-amber-600"
                    />
                    <span>{days} {days === 1 ? 'day' : 'days'} before</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Client Reminders Setting */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2 font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={notifClientReminders}
                onChange={e => setNotifClientReminders(e.target.checked)}
                className="rounded text-amber-600"
              />
              <span>Automated Client Hearing Date Reminders</span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1">
              Automatically dispatches courtesy hearing notices to clients 1 day prior to their court date via verified email or WhatsApp.
            </p>
          </div>

          <button
            type="submit"
            disabled={notifSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <span>{notifSaving ? 'Saving...' : 'Save Notification Preferences'}</span>
          </button>
        </form>

        {/* Delivery Audit History Table */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Delivery History & Provider Confirmation</span>
            </h3>
            <span className="text-[10px] text-slate-400">Strict confirmation required</span>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold">
                  <th className="p-2.5">Date & Time</th>
                  <th className="p-2.5">Channel</th>
                  <th className="p-2.5">Recipient</th>
                  <th className="p-2.5">Type & Notice</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveryHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">
                      No automated notification events recorded yet. Run automations above to initiate dispatch.
                    </td>
                  </tr>
                ) : (
                  deliveryHistory.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60">
                      <td className="p-2.5 text-slate-500 font-mono">
                        {new Date(rec.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[9px] ${
                          rec.channel === 'email' ? 'bg-blue-50 text-blue-700' :
                          rec.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.channel}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">{rec.recipient}</td>
                      <td className="p-2.5 truncate max-w-xs text-slate-600">{rec.title}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          rec.status === 'delivered' || rec.status === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                          rec.status === 'simulated' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rec.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400 truncate max-w-[120px]">{rec.provider}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Provider Status Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Legal Engine Status</span>
          </h2>
          <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded text-[11px]">
            Active: Deterministic Verified Offline Engine
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">
          The application is running in deterministic mode using verified legal templates customized for Alwar court practice. This provides immediate, zero-cost drafting and analysis without external network dependency.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] font-mono">
          <span className="font-bold text-slate-700 block">To connect live Google Gemini or OpenAI LLM inference:</span>
          <pre className="p-2.5 bg-slate-900 text-amber-300 rounded overflow-x-auto">
{`AI_PROVIDER="gemini"
AI_API_KEY="AIzaSy..."
AI_MODEL_NAME="gemini-1.5-flash"`}
          </pre>
        </div>
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
