import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.ar;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('enghub_lang');
        if (saved) return saved as Language;
      }
    } catch {
      // Storage restricted or unavailable in sandboxed iframe
    }
    return 'ar'; // Arabic is default
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('enghub_lang', lang);
      }
    } catch {
      // Storage restricted or unavailable in sandboxed iframe
    }
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
      }
    } catch {
      // Ignore document modification error
    }
  }, [language, isRTL]);

  const t = translations[language] || translations.ar;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'ar' as Language,
      setLanguage: () => {},
      t: translations.ar,
      isRTL: true
    };
  }
  return context;
};

