'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: typeof translations.hi;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'hi',
  setLocale: () => {},
  t: translations.hi,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('hi');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('alwar_locale') as Locale;
      if (saved === 'hi' || saved === 'en') {
        setLocaleState(saved);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem('alwar_locale', loc);
      if (typeof document !== 'undefined') {
        document.cookie = `alwar_locale=${loc}; path=/; max-age=31536000`;
        document.documentElement.lang = loc;
      }
    } catch {
      // ignore
    }
  };

  const t = translations[locale] || translations.hi;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
