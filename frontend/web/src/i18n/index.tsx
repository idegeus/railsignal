import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'ca' | 'es' | 'en';

function detectLang(): Lang {
  const langs = navigator.languages?.length ? [...navigator.languages] : [navigator.language ?? ''];
  for (const l of langs) {
    const code = l.toLowerCase().split('-')[0];
    if (code === 'ca') return 'ca';
    if (code === 'es') return 'es';
    if (code === 'en') return 'en';
  }
  return 'ca';
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ca: string, es: string, en?: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'ca',
  setLang: () => {},
  t: (ca) => ca,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  function setLang(l: Lang) {
    setLangState(l);
    document.documentElement.lang = l;
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (ca: string, es: string, en?: string): string => {
    if (lang === 'en') return en ?? ca;
    if (lang === 'es') return es;
    return ca;
  };

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
