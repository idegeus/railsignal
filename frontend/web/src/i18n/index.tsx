import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'ca' | 'es';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ca: string, es: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'ca',
  setLang: () => {},
  t: (ca) => ca,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ca');

  function setLang(l: Lang) {
    setLangState(l);
    document.documentElement.lang = l;
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (ca: string, es: string) => (lang === 'ca' ? ca : es);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
