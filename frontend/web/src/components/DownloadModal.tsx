import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLang } from '../i18n';

interface DownloadContextValue {
  openDownload: () => void;
}

const DownloadContext = createContext<DownloadContextValue>({ openDownload: () => {} });
export const useDownload = () => useContext(DownloadContext);

function Modal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    localStorage.setItem('beta_email', email);
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Tanca"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {submitted ? (
          <div className="p-10 text-center">
            <span
              className="material-symbols-outlined text-signal-good text-5xl block mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h2 className="text-h3 font-bold text-on-surface mb-3">
              {t('Gràcies!', '¡Gracias!')}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {t(
                "T'avisarem quan l'app estigui llesta per descarregar.",
                'Te avisaremos cuando la app esté lista para descargar.',
              )}
            </p>
          </div>
        ) : (
          <div className="p-8">
            <span className="bg-transit-yellow text-on-background px-2 py-0.5 text-xs font-bold uppercase tracking-widest">
              {t('Accés anticipat', 'Acceso anticipado')}
            </span>
            <h2 className="text-h3 font-bold text-on-surface mt-4 mb-2">
              {t("Uneix-te a la beta", 'Únete a la beta')}
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              {t(
                "Deixa'ns el teu correu i t'enviarem l'accés a l'app quan estigui llesta per al públic.",
                'Déjanos tu correo y te enviaremos el acceso a la app cuando esté lista para el público.',
              )}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('La teva adreça electrònica', 'Tu dirección de correo electrónico')}
                className="w-full border-2 border-on-surface px-4 py-3 text-body-md outline-none focus:border-transit-red transition-colors"
                required
                autoFocus
              />
              <button
                type="submit"
                className="bg-transit-red text-white font-bold text-sm uppercase px-6 py-3 hover:bg-primary transition-colors"
              >
                {t("Sol·licita accés", 'Solicitar acceso')}
              </button>
            </form>
            <p className="mt-3 text-xs text-on-surface-variant">
              {t('Sense spam. Respectem la teva privadesa.', 'Sin spam. Respetamos tu privacidad.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <DownloadContext.Provider value={{ openDownload: () => setShow(true) }}>
      {children}
      {show && <Modal onClose={() => setShow(false)} />}
    </DownloadContext.Provider>
  );
}
