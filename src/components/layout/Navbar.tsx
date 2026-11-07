'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Scale, BookOpen, Shield, Users, FileText, 
  MessageSquare, Briefcase, Lock, Menu, X, Globe, UserCheck, 
  Bell, ShieldCheck, KeyRound, Sparkles, Calendar, DollarSign, 
  Settings, FolderKanban, Database, LogOut, Landmark, ExternalLink
} from 'lucide-react';

interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: 'public_admin' | 'case_admin' | 'registered_advocate' | string;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
}

export function Navbar() {
  const { locale, setLocale, t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
        else setCurrentUser(null);
      })
      .catch(() => setCurrentUser(null));
  }, [pathname]);

  const switchPersona = async (email: string) => {
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  // 1. PUBLIC VISITOR TABS (जब कोई लॉग इन नहीं है / आम जनता व मुवक्किल)
  const publicNavLinks: NavLinkItem[] = [
    { href: '/', label: t.navHome, icon: Scale },
    { href: '/bar-association', label: locale === 'hi' ? '🏛️ बार एसोसिएशन' : 'Bar Association', icon: Landmark, badge: 'Alwar Bar' },
    { href: '/advocates', label: locale === 'hi' ? 'वकील खोजें' : 'Find Advocates', icon: Users },
    { href: '/welfare', label: locale === 'hi' ? '18 बार वेलफेयर' : 'Bar Welfare & Dues', icon: Shield, badge: '18 Bars' },
    { href: '/laws', label: locale === 'hi' ? 'नए कानून' : 'New Laws', icon: BookOpen, badge: 'BNS 2023' },
    { href: '/judgments', label: locale === 'hi' ? 'निर्णय व नज़ीरें' : 'Judgments', icon: Scale },
    { href: '/news', label: locale === 'hi' ? 'परिपत्र व नोटिस' : 'Notices & News', icon: Bell },
    { href: '/court-resources', label: locale === 'hi' ? 'कोर्ट रिसोर्सेज' : 'Court Resources', icon: Briefcase },
    { href: '/forms', label: locale === 'hi' ? 'विधिक फॉर्म' : 'Legal Forms', icon: FileText },
    { href: '/forum', label: locale === 'hi' ? 'अधिवक्ता मंच' : 'Advocates Forum', icon: MessageSquare },
  ];

  // 2. REGISTERED ADVOCATE TABS (पंजीकृत अधिवक्ता - डिजिटल लॉ ऑफिस)
  const advocateNavLinks: NavLinkItem[] = [
    { href: '/my-case/dashboard', label: locale === 'hi' ? '📊 डैशबोर्ड' : 'Dashboard', icon: Scale },
    { href: '/my-case/diary', label: locale === 'hi' ? '📅 केस डायरी' : 'Cause List / Diary', icon: Calendar, badge: 'Daily' },
    { href: '/my-case/cases', label: locale === 'hi' ? '📂 सक्रिय केस' : 'Active Cases', icon: FolderKanban },
    { href: '/bcr-services', label: locale === 'hi' ? '🏛️ BCR सेवाएं' : 'BCR Services', icon: Landmark, badge: '14' },
    { href: '/my-case/clients', label: locale === 'hi' ? '👥 मुवक्किल' : 'Clients Roster', icon: Users },
    { href: '/my-case/ai-assistant', label: locale === 'hi' ? '🤖 AI असिस्टेंट' : 'AI Assistant', icon: Sparkles, badge: 'AI' },
    { href: '/my-case/drafting', label: locale === 'hi' ? '📝 ड्राफ्टिंग' : 'Bail & Pleadings', icon: FileText },
    { href: '/my-case/billing', label: locale === 'hi' ? '💰 फीस व बिलिंग' : 'Fee Billing', icon: DollarSign },
    { href: '/my-case/library', label: locale === 'hi' ? '📚 विधिक लाइब्रेरी' : 'Law Library', icon: BookOpen },
    { href: '/my-case/settings', label: locale === 'hi' ? '⚙️ चैंबर सेटिंग्स' : 'Chamber Settings', icon: Settings },
    { href: '/', label: locale === 'hi' ? '🌐 पब्लिक साइट' : 'Public Portal', icon: Globe },
  ];

  // 3. PUBLIC ADMIN TABS (बार एसोसिएशन प्रशासन - अनिल सैन एवं बार एडमिन)
  const publicAdminNavLinks: NavLinkItem[] = [
    { href: '/public-admin/dashboard', label: locale === 'hi' ? '🏛️ एडमिन डैशबोर्ड' : 'Admin Overview', icon: Shield, badge: 'Admin' },
    { href: '/public-admin/advocates', label: locale === 'hi' ? '👥 अधिवक्ता सत्यापन' : 'Verify Advocates', icon: UserCheck },
    { href: '/public-admin/welfare', label: locale === 'hi' ? '🛡️ 18 बार वेलफेयर' : '18 Bars Dues', icon: ShieldCheck, badge: 'RAWF' },
    { href: '/bcr-services', label: locale === 'hi' ? '🏛️ BCR सेवाएं' : 'BCR Services', icon: Landmark, badge: '14' },
    { href: '/public-admin/laws', label: locale === 'hi' ? '📜 कानून व परिपत्र' : 'Laws & Circulars', icon: BookOpen },
    { href: '/public-admin/forum', label: locale === 'hi' ? '💬 फोरम मॉडरेशन' : 'Forum Moderation', icon: MessageSquare },
    { href: '/public-admin/audit-logs', label: locale === 'hi' ? '📋 ऑडिट लॉग्स' : 'Security Logs', icon: FileText },
    { href: '/my-case/dashboard', label: locale === 'hi' ? '⚖️ माई केस ऑफिस' : 'My Case Office', icon: Briefcase },
    { href: '/', label: locale === 'hi' ? '🌐 पब्लिक साइट' : 'Public Portal', icon: Globe },
  ];

  // 4. CASE ADMIN TABS (सिस्टम एवं आईटी ऑपरेटर - Zero-Knowledge)
  const caseAdminNavLinks: NavLinkItem[] = [
    { href: '/case-admin/dashboard', label: locale === 'hi' ? '📊 सिस्टम टेलीमेट्री' : 'System Telemetry', icon: Shield, badge: 'Operator' },
    { href: '/case-admin/accounts', label: locale === 'hi' ? '👥 अधिवक्ता खाते व कोटा' : 'Advocate Quotas', icon: Users },
    { href: '/case-admin/usage', label: locale === 'hi' ? '💾 स्टोरेज व क्लाउड' : 'Storage & Quotas', icon: Database },
    { href: '/case-admin/security', label: locale === 'hi' ? '🔒 सुरक्षा नियंत्रण' : 'Security Controls', icon: Lock, badge: 'ZK' },
    { href: '/', label: locale === 'hi' ? '🌐 पब्लिक साइट' : 'Public Portal', icon: Globe },
  ];

  // Select active nav link set according to current role
  let activeNavLinks = publicNavLinks;
  let roleTitle = locale === 'hi' ? 'पब्लिक मोड (Public Visitor)' : 'Public Visitor Mode';
  let roleBadgeClass = 'bg-slate-700/60 text-slate-200 border-slate-600/40';

  if (currentUser?.role === 'public_admin') {
    activeNavLinks = publicAdminNavLinks;
    roleTitle = currentUser.email.includes('anilsain')
      ? (locale === 'hi' ? '👑 सुपर एडमिन (Advocate Anil Sain)' : '👑 Super Admin: Advocate Anil Sain')
      : (locale === 'hi' ? '🏛️ बार एसोसिएशन प्रशासन (Bar Admin)' : '🏛️ Bar Association Admin');
    roleBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-400/40';
  } else if (currentUser?.role === 'case_admin') {
    activeNavLinks = caseAdminNavLinks;
    roleTitle = locale === 'hi' 
      ? '🛡️ सिस्टम ऑपरेटर (Case Admin • Zero-Knowledge Isolation)' 
      : '🛡️ Case Admin (Zero-Knowledge System Operator)';
    roleBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
  } else if (currentUser?.role === 'registered_advocate') {
    activeNavLinks = advocateNavLinks;
    roleTitle = locale === 'hi' 
      ? `⚖️ पंजीकृत अधिवक्ता: ${currentUser.full_name}` 
      : `⚖️ Registered Advocate: ${currentUser.full_name}`;
    roleBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-400/40';
  }

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Statutory Independence Disclaimer & Role Switcher Top Bar */}
      <div className="bg-legal-navyDark text-amber-200/90 text-xs px-4 py-1.5 border-b border-legal-gold/20 flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <p className="truncate text-[11px] sm:text-xs">
            ⚖️ {t.disclaimerBar}
          </p>
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 ml-2">
            <a
              href="https://barcouncilofrajasthan.org/Advocate/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 transition flex items-center space-x-1 font-semibold"
              title="Bar Council of Rajasthan Official Advocate Portal (Login)"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">BCR Login (जोधपुर) ↗</span>
            </a>

            <Link
              href="/verify?enrollment=R/2268/2009"
              className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 transition flex items-center space-x-1"
              title="Verify Advocate Sanad R/2268/2009"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Verify Sanad</span>
            </Link>
            
            {/* Role Switcher Pill */}
            <button
              onClick={() => setPersonaModalOpen(true)}
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 transition flex items-center space-x-1 font-medium"
              title="Switch user role to preview role-based menu tabs"
            >
              <UserCheck className="w-3 h-3" />
              <span>Role Switcher (मेन्यू बदलें)</span>
            </button>

            <button
              onClick={() => setLocale(locale === 'hi' ? 'en' : 'hi')}
              className="flex items-center space-x-1 text-xs text-white hover:text-amber-300 transition font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{locale === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role-Context Ribbon Banner */}
      <div className="bg-slate-900 text-xs px-4 py-1 border-b border-white/10 flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
              सक्रिय यूज़र मेन्यू (Active Menu):
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border flex items-center space-x-1 ${roleBadgeClass}`}>
              <span>{roleTitle}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            {currentUser ? (
              <span className="text-slate-300 font-mono hidden md:inline">
                ID: {currentUser.email}
              </span>
            ) : (
              <span className="text-amber-300/80 hidden sm:inline">
                ℹ️ विभिन्न भूमिकाओं के मेन्यू देखने के लिए ऊपर Role Switcher पर क्लिक करें
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-legal-navy text-white border-b border-legal-gold/30">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-inner font-serif font-bold text-xl border border-amber-400/40">
              अ
            </div>
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-white block leading-tight group-hover:text-amber-300 transition">
                {t.siteName}
              </span>
              <span className="text-[10px] text-amber-200/70 block font-light">
                {currentUser?.role === 'public_admin' 
                  ? '👑 Bar Administration Portal' 
                  : currentUser?.role === 'case_admin'
                  ? '🛡️ Case Telemetry & Infrastructure'
                  : currentUser?.role === 'registered_advocate'
                  ? '⚖️ My Case AI Legal Office'
                  : 'Public Information & Advocate Portal'}
              </span>
            </div>
          </Link>

          {/* Desktop Role-Based Menu Tabs */}
          <div className="hidden xl:flex items-center space-x-1 overflow-x-auto max-w-3xl py-1">
            {activeNavLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 shrink-0 ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded font-mono">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Tablet Quick Menu for lg screens */}
          <div className="hidden lg:flex xl:hidden items-center space-x-1">
            {activeNavLinks.slice(0, 6).map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 py-1 rounded text-xs ${
                    isActive ? 'bg-amber-500/20 text-amber-300' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-white/20">
                
                {/* User Name Badge */}
                <span className="text-xs text-amber-300 font-medium truncate max-w-[120px]">
                  {currentUser.full_name.split(' ')[0]}
                </span>

                {/* Change Password Link */}
                <Link
                  href="/auth/change-password"
                  className="text-xs text-amber-300 hover:text-amber-200 transition flex items-center space-x-0.5 bg-amber-500/10 px-2 py-1 rounded border border-amber-400/20 font-medium"
                  title="Change Password / पासवर्ड बदलें"
                >
                  <KeyRound className="w-3 h-3 text-amber-400" />
                  <span>पासवर्ड</span>
                </Link>

                {/* Role specific quick action */}
                {currentUser.role === 'registered_advocate' && (
                  <Link
                    href="/my-case/settings"
                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10"
                    title="Chamber Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-300 hover:text-red-200 transition flex items-center space-x-1 px-1.5 py-1 rounded hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{t.navLogout}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 transition shadow-sm flex items-center space-x-1.5 border border-amber-300/40"
                >
                  <Lock className="w-3 h-3" />
                  <span>अधिवक्ता लॉगिन</span>
                </Link>
                <Link
                  href="/public-admin/login"
                  className="px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-white/10 border border-slate-700 transition"
                  title="Bar Admin Portal"
                >
                  🏛️ एडमिन
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 flex items-center space-x-1 border border-white/20"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="text-xs font-medium">मेन्यू</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown (Role Specific) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-legal-navyDark px-4 py-3 border-t border-white/10 space-y-1">
            <div className="pb-2 mb-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">
                {roleTitle}
              </span>
              <button
                onClick={() => { setPersonaModalOpen(true); setMobileMenuOpen(false); }}
                className="text-[11px] text-amber-300 underline"
              >
                रोल बदलें →
              </button>
            </div>

            {activeNavLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded text-sm text-slate-200 hover:bg-white/10"
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-white/10 flex flex-col space-y-2">
              <Link
                href="/auth/change-password"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-amber-300 hover:text-white py-1.5 flex items-center space-x-2 px-2 rounded hover:bg-white/5"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>🔐 पासवर्ड बदलें (Change Password)</span>
              </Link>
              
              {currentUser ? (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="text-xs text-red-300 hover:text-red-200 py-1.5 flex items-center space-x-2 px-2 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>लॉगआउट करें ({currentUser.full_name})</span>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs bg-amber-500 text-slate-950 font-bold py-2 rounded text-center"
                >
                  लॉगिन करें (Sign In)
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Persona Switcher Modal: Instant Role Previews */}
      {personaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-legal-navy flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>यूज़र मेन्यू स्विचर (Role Menu Switcher)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  किसी भी यूज़र पर क्लिक करें और देखें कि उनके अनुसार वेबसाइट के मेन्यू टैब कैसे बदल जाते हैं:
                </p>
              </div>
              <button
                onClick={() => setPersonaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* 1. Super Admin: Anil Sain */}
              <button
                onClick={() => { switchPersona('anilsain.adv@gmail.com'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <span>👑 Advocate Anil Sain</span>
                    <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded">Master Admin</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">anilsain.adv@gmail.com • पूरे पोर्टल का सर्वोच्च नियंत्रण</div>
                  <div className="text-[11px] text-amber-800 font-medium mt-1">
                    👉 मेन्यू में दिखेगा: एडमिन डैशबोर्ड, वकील सत्यापन, 18 बार वेलफेयर, कानून व परिपत्र, ऑडिट लॉग्स
                  </div>
                </div>
              </button>

              {/* 2. Public Admin: Bar Office */}
              <button
                onClick={() => { switchPersona('public.admin@alwaradvocates.org'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <span>🏛️ Alwar Bar Administrator</span>
                    <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded">Bar Admin</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">public.admin@alwaradvocates.org • बार एसोसिएशन कार्यालय स्टाफ</div>
                  <div className="text-[11px] text-purple-800 font-medium mt-1">
                    👉 मेन्यू में दिखेगा: बार नोटिस, वेलफेयर फंड, वकील डायरेक्टरी अप्रूवल
                  </div>
                </div>
              </button>

              {/* 3. Registered Advocate: Rajesh Sharma */}
              <button
                onClick={() => { switchPersona('advocate.rajesh@alwarbar.in'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <span>⚖️ Advocate Rajesh Sharma</span>
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded">Advocate</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">advocate.rajesh@alwarbar.in • दांडिक एवं सिविल वकालत (अलवर कोर्ट)</div>
                  <div className="text-[11px] text-blue-800 font-medium mt-1">
                    👉 मेन्यू में दिखेगा: माई केस डैशबोर्ड, केस डायरी (पेशी कैलेंडर), सक्रिय केस, मुवक्किल, AI असिस्टेंट, ड्राफ्टिंग, बिलिंग
                  </div>
                </div>
              </button>

              {/* 4. Registered Advocate: Sunita Meena */}
              <button
                onClick={() => { switchPersona('advocate.meena@alwarbar.in'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-xl border border-cyan-200 bg-cyan-50/40 hover:bg-cyan-100/60 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <span>⚖️ Advocate Sunita Meena</span>
                    <span className="text-[10px] bg-cyan-600 text-white font-bold px-1.5 py-0.2 rounded">Advocate</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">advocate.meena@alwarbar.in • पारिवारिक एवं राजस्व कोर्ट प्रैक्टिस</div>
                  <div className="text-[11px] text-cyan-800 font-medium mt-1">
                    👉 मेन्यू में दिखेगा: डिजिटल केस डायरी, क्लाइंट्स, AI ड्राफ्टिंग, चैंबर लाइब्रेरी
                  </div>
                </div>
              </button>

              {/* 5. Case Admin: System Operator */}
              <button
                onClick={() => { switchPersona('case.admin@alwaradvocates.org'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <span>🛡️ My Case System Operator</span>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">Case Admin</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">case.admin@alwaradvocates.org • सर्वर व क्लाउड सुरक्षा ऑपरेटर</div>
                  <div className="text-[11px] text-emerald-800 font-medium mt-1">
                    👉 मेन्यू में दिखेगा: सिस्टम टेलीमेट्री, स्टोरेज व क्लाउड कोटा, सुरक्षा नियंत्रण (Zero-Knowledge)
                  </div>
                </div>
              </button>

              {/* 6. Public Visitor (Guest Mode) */}
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  setPersonaModalOpen(false);
                  window.location.reload();
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <span>🌐 Public Visitor (आम नागरिक / आगंतुक मोड)</span>
                    <span className="text-[10px] bg-slate-600 text-white font-bold px-1.5 py-0.2 rounded">Public</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">लॉगआउट करें और सामान्य आगंतुक के रूप में पोर्टल देखें</div>
                  <div className="text-[11px] text-slate-700 font-medium mt-1">
                    👉 मेन्यू में दिखेगा: वकील खोजें, 18 बार वेलफेयर, नए कानून, निर्णय, कोर्ट फॉर्म, विधिक मंच
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                परीक्षण एवं सत्यापन हेतु त्वरित भूमिका स्विचर
              </span>
              <button
                onClick={() => setPersonaModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
