'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Calendar, Bell, MapPin, ExternalLink, Clock } from 'lucide-react';
import type { NoticeEvent } from '@/types/database';

export default function NoticesPage() {
  const { t, locale } = useLanguage();
  const [notices, setNotices] = useState<NoticeEvent[]>([]);

  useEffect(() => {
    fetch('/api/public/news')
      .then(res => res.json())
      .then(data => {
        if (data.news) setNotices(data.news);
        else if (data.notices) setNotices(data.notices);
      })
      .catch(() => {
        fetch('/api/public/notices')
          .then(res => res.json())
          .then(data => {
            if (data.notices) setNotices(data.notices);
          })
          .catch(console.error);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      <div className="border-b pb-6 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
          <Bell className="w-4 h-4" />
          <span>Court & Bar Circulars</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900">
          {locale === 'hi' ? 'न्यायालयी सूचनाएं, कार्यशालाएं एवं विधिक गतिविधियां' : 'Court Notices, CLE Workshops & Events'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Official notifications from the District & Sessions Judge Alwar, Bar Association circulars, holiday schedules, and Continuing Legal Education (CLE) programs.
        </p>
      </div>

      <div className="space-y-6">
        {notices.map(notice => (
          <div
            key={notice.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3 hover:border-amber-400 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-900 rounded">
                {notice.category.replace('_', ' ')}
              </span>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{notice.event_date ? new Date(notice.event_date).toLocaleDateString() : 'Immediate'}</span>
                </span>
                {notice.venue && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{notice.venue}</span>
                  </span>
                )}
              </div>
            </div>

            <h2 className="font-serif font-bold text-lg text-slate-900">
              {locale === 'hi' ? notice.title_hi : notice.title_en}
            </h2>

            <p className="text-xs text-slate-700 leading-relaxed">
              {locale === 'hi' ? notice.content_hi : notice.content_en}
            </p>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
              <span>Organizer: {notice.organizer}</span>
              {notice.official_source_url && (
                <a
                  href={notice.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline flex items-center space-x-1 font-medium"
                >
                  <span>Official Source Circular</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
