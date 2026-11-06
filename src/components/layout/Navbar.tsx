'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Scale, BookOpen, Shield, Users, FileText, 
  MessageSquare, Briefcase, Lock, Menu, X, Globe, UserCheck, Bell, ShieldCheck, KeyRound
} from 'lucide-react';

interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
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

  const navLinks = [
    { href: '/', label: t.navHome, icon: Scale },
    { href: '/advocates', label: t.navAdvocates, icon: Users },
    { href: '/welfare', label: t.navWelfare, icon: Shield },
    { href: '/laws', label: t.navLaws, icon: BookOpen },
    { href: '/judgments', label: t.navJudgments, icon: Scale },
    { href: '/news', label: locale === 'hi' ? 'समाचार व परिपत्र' : 'News & Circulars', icon: Bell },
    { href: '/court-resources', label: t.navCourtResources, icon: Briefcase },
    { href: '/forms', label: t.navForms, icon: FileText },
    { href: '/forum', label: t.navForum, icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Statutory Independence Disclaimer Top Bar */}
      <div className="bg-legal-navyDark text-amber-200/90 text-xs px-4 py-1.5 border-b border-legal-gold/20 flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <p className="truncate text-[11px] sm:text-xs">
            ⚖️ {t.disclaimerBar}
          </p>
          <div className="flex items-center space-x-3 shrink-0 ml-2">
            <Link
              href="/verify?enrollment=R/2268/2009"
              className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 transition flex items-center space-x-1"
              title="Verify Advocate Sanad R/2268/2009"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Verify Sanad</span>
            </Link>
            <button
              onClick={() => setPersonaModalOpen(true)}
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 transition flex items-center space-x-1"
              title="Switch demo persona for testing"
            >
              <UserCheck className="w-3 h-3" />
              <span className="hidden sm:inline">Role Switcher</span>
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

      {/* Main Navigation */}
      <nav className="bg-legal-navy text-white border-b border-legal-gold/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Text-based Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-inner font-serif font-bold text-xl border border-amber-400/40">
              अ
            </div>
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-white block leading-tight group-hover:text-amber-300 transition">
                {t.siteName}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-300 block font-light">
                Alwar Advocates Portal & My Case AI Legal Office
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            <Link
              href="/my-case"
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 transition shadow-sm flex items-center space-x-1.5 border border-amber-300/40"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t.navMyCase}</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-white/20">
                <span className="text-xs text-slate-300 truncate max-w-[120px]">
                  {currentUser.full_name.split(' ')[0]}
                </span>
                <Link
                  href="/auth/change-password"
                  className="text-xs text-amber-300 hover:text-amber-200 transition flex items-center space-x-0.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/20"
                  title="Change Password / पासवर्ड बदलें"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>पासवर्ड</span>
                </Link>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="text-xs text-red-300 hover:text-red-200 underline"
                >
                  {t.navLogout}
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
              >
                {t.navLogin}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Link
              href="/my-case"
              className="px-2.5 py-1 rounded text-xs font-medium bg-amber-500 text-slate-950"
            >
              My Case
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-legal-navyDark px-4 py-3 border-t border-white/10 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded text-sm text-slate-200 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col space-y-2">
              <Link
                href="/auth/change-password"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-amber-300 hover:text-white py-1 flex items-center space-x-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{locale === 'hi' ? 'पासवर्ड बदलें (Change Password)' : 'Change Password'}</span>
              </Link>
              <Link
                href="/public-admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-white py-1"
              >
                {t.navPublicAdmin}
              </Link>
              <Link
                href="/case-admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-white py-1"
              >
                {t.navCaseAdmin}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Persona Switcher Modal for Easy Examiner Testing */}
      {personaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-900 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-legal-navy">
                Testing Role Switcher (Zero-Friction Authentication)
              </h3>
              <button
                onClick={() => setPersonaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Switch immediately between platform personas to verify multi-tenant isolation, public admin workflows, and My Case zero-knowledge separation:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => { switchPersona('advocate.rajesh@alwarbar.in'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-lg border hover:border-amber-500 hover:bg-amber-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">Advocate Rajesh Sharma</div>
                  <div className="text-xs text-slate-500">Registered Advocate • District Court Alwar (Private Case Workspace)</div>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">Advocate</span>
              </button>

              <button
                onClick={() => { switchPersona('advocate.meena@alwarbar.in'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-lg border hover:border-amber-500 hover:bg-amber-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">Advocate Sunita Meena</div>
                  <div className="text-xs text-slate-500">Registered Advocate • Commercial & Revenue Court Alwar</div>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">Advocate</span>
              </button>

              <button
                onClick={() => { switchPersona('public.admin@alwaradvocates.org'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">Alwar Bar Administrator</div>
                  <div className="text-xs text-slate-500">Public Portal Admin (Welfare, Laws, Directory Verification)</div>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">Public Admin</span>
              </button>

              <button
                onClick={() => { switchPersona('case.admin@alwaradvocates.org'); setPersonaModalOpen(false); }}
                className="w-full text-left p-3 rounded-lg border hover:border-red-500 hover:bg-red-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">My Case System Operator</div>
                  <div className="text-xs text-slate-500">Case Service Admin (Telemetry & Quotas • Zero Knowledge of Files)</div>
                </div>
                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">Case Admin</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t flex justify-end">
              <button
                onClick={() => setPersonaModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-medium rounded text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
