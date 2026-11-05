'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Briefcase, Folder, FileText, Sparkles, Search, Calendar, 
  CheckSquare, Users, CreditCard, Bookmark, Settings, Scale, Lock, ShieldCheck, ChevronRight
} from 'lucide-react';

export function MyCaseSidebar() {
  const pathname = usePathname();
  const { t, locale } = useLanguage();

  const links = [
    { href: '/my-case/dashboard', label: 'Office Dashboard', icon: Briefcase },
    { href: '/my-case/cases', label: 'Case Management', icon: Folder },
    { href: '/my-case/diary', label: 'Hearing Diary', icon: Calendar },
    { href: '/my-case/documents', label: 'Document Vault', icon: FileText },
    { href: '/my-case/drafting', label: 'AI Drafting Studio', icon: Sparkles },
    { href: '/my-case/research', label: 'AI Legal Research', icon: Search },
    { href: '/my-case/ai-assistant', label: 'Case File Analyzer', icon: Scale },
    { href: '/my-case/tasks', label: 'Deadlines & Tasks', icon: CheckSquare },
    { href: '/my-case/clients', label: 'Client Directory', icon: Users },
    { href: '/my-case/billing', label: 'Fee & Billing Ledger', icon: CreditCard },
    { href: '/my-case/library', label: 'Personal Library', icon: Bookmark },
    { href: '/my-case/settings', label: 'Office Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-legal-navyDark text-slate-300 border-r border-legal-gold/20 flex flex-col shrink-0 min-h-[calc(100vh-80px)]">
      {/* Workspace Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/40">
            MC
          </div>
          <div>
            <div className="text-xs font-bold text-white font-serif tracking-wide">
              MY CASE OFFICE
            </div>
            <div className="text-[10px] text-amber-300/80 font-mono flex items-center space-x-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Privileged & Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/my-case' && pathname.startsWith(link.href) && link.href !== '/my-case/dashboard');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Honest AI Status Badge */}
      <div className="p-3 border-t border-white/10">
        <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-amber-300 font-semibold">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>AI Engine</span>
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
              Demo Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Deterministic local templates active. Zero cloud token costs.
          </p>
        </div>
      </div>
    </aside>
  );
}
