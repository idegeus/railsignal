import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLang } from '../i18n';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=cat.viesambcobertura.app';

interface DownloadContextValue {
  openDownload: () => void;
}

const DownloadContext = createContext<DownloadContextValue>({ openDownload: () => {} });
export const useDownload = () => useContext(DownloadContext);

function Modal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      setLoading(true);
      try {
        await fetch('/api/v1/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch {
        // best-effort — proceed to Play Store regardless
      } finally {
        setLoading(false);
      }
    }
    setDone(true);
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
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {done ? (
          <div className="p-10 text-center">
            <span
              className="material-symbols-outlined text-signal-good text-5xl block mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h2 className="text-h3 font-bold text-on-surface mb-3">
              {t('Gràcies!', '¡Gracias!', 'Thank you!')}
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              {email
                ? t(
                    "T'avisarem quan l'app estigui llesta per descarregar.",
                    'Te avisaremos cuando la app esté lista para descargar.',
                    "We'll let you know when the app is ready to download.",
                  )
                : t(
                    "Troba l'app a Google Play.",
                    'Encuentra la app en Google Play.',
                    'Find the app on Google Play.',
                  )}
            </p>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-transit-red text-white font-bold text-sm uppercase px-8 py-3.5 hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>android</span>
              {t('Obre Google Play', 'Abrir Google Play', 'Open Google Play')}
            </a>
          </div>
        ) : (
          <div className="p-8">
            <span className="bg-transit-yellow text-on-background px-2 py-0.5 text-xs font-bold uppercase tracking-widest">
              {t('Descarrega', 'Descarga', 'Download')}
            </span>
            <h2 className="text-h3 font-bold text-on-surface mt-4 mb-2">
              {t("Baixa l'app", 'Descarga la app', 'Get the app')}
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              {t(
                "L'app és a Google Play. Deixa'ns el teu correu si vols rebre actualitzacions del projecte — és opcional.",
                'La app está en Google Play. Déjanos tu correo si quieres recibir actualizaciones del proyecto — es opcional.',
                "The app is on Google Play. Leave your email if you'd like project updates — it's optional.",
              )}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t(
                  'La teva adreça electrònica (opcional)',
                  'Tu correo electrónico (opcional)',
                  'Your email address (optional)',
                )}
                className="w-full border-2 border-on-surface px-4 py-3 text-body-md outline-none focus:border-transit-red transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-transit-red text-white font-bold text-sm uppercase px-6 py-3 hover:bg-primary transition-colors disabled:opacity-60"
              >
                {loading
                  ? t('Enviant…', 'Enviando…', 'Sending…')
                  : t('Continua a Google Play', 'Continuar a Google Play', 'Continue to Google Play')}
              </button>
            </form>
            <p className="mt-3 text-xs text-on-surface-variant">
              {t('Sense spam. Respectem la teva privadesa.', 'Sin spam. Respetamos tu privacidad.', 'No spam. We respect your privacy.')}
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
