import { useState } from 'react';
import { useLang } from '../i18n';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=cat.viesambcobertura.app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const track = (event: string, params?: Record<string, string>) => (window as any).gtag?.('event', event, params);

export default function Newsletter() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      track('sign_up', { method: 'newsletter' });
      setSubmitted(true);
    } catch {
      setError(t(
        'Alguna cosa ha fallat. Torna-ho a provar.',
        'Algo ha fallado. Inténtalo de nuevo.',
        'Something went wrong. Please try again.',
      ));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-surface-container py-24" id="butlleti">
      <div className="max-w-2xl mx-auto px-margin text-center">
        <span className="text-transit-red font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
          {t('Butlletí de Transparència', 'Boletín de Transparencia', 'Transparency Newsletter')}
        </span>
        <h2 className="text-h2 font-bold text-on-surface tracking-tight mb-4">
          {t('Rep els informes mensuals', 'Recibe los informes mensuales', 'Receive the monthly reports')}
        </h2>
        <p className="text-body-lg text-on-surface-variant mb-10">
          {t(
            "Analitzem les dades crowdsourced per exigir millores a les operadores i al Ministeri.",
            'Analizamos los datos crowdsourced para exigir mejoras a los operadores y al Ministerio.',
            'We analyse the crowdsourced data to demand improvements from operators and the Ministry.',
          )}
        </p>

        {submitted ? (
          <div className="bg-white border border-surface-container-high p-10">
            <span
              className="material-symbols-outlined text-signal-good text-4xl block mb-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <p className="font-bold text-on-surface">
              {t("T'has subscrit correctament.", 'Te has suscrito correctamente.', "You've subscribed successfully.")}
            </p>
            <p className="text-sm text-on-surface-variant mt-2 mb-6">
              {t(
                "T'enviarem l'informe quan surti el pròxim mes.",
                'Te enviaremos el informe cuando salga el próximo mes.',
                "We'll send you the report when the next one is published.",
              )}
            </p>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('google_play_click', { source: 'newsletter' })}
              className="inline-flex items-center gap-2 bg-transit-red text-white font-bold text-sm uppercase px-8 py-4 hover:bg-primary transition-colors"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                android
              </span>
              {t('Descarrega a Google Play', 'Descarga en Google Play', 'Download on Google Play')}
            </a>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row border-2 border-on-surface focus-within:border-transit-red transition-colors overflow-hidden"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('La teva adreça electrònica', 'Tu dirección de correo electrónico', 'Your email address')}
                className="flex-grow bg-white px-6 py-4 outline-none text-on-surface text-body-md"
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-transit-red text-white font-bold text-sm uppercase px-8 py-4 hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-60"
              >
                {loading
                  ? t('Enviant…', 'Enviando…', 'Sending…')
                  : t('Subscriu-te', 'Suscríbete', 'Subscribe')}
              </button>
            </form>
            {error && (
              <p className="mt-3 text-xs text-transit-red">{error}</p>
            )}
            <p className="mt-4 text-xs text-on-surface-variant uppercase tracking-wider">
              {t(
                'Respectem la teva privadesa. Dades xifrades segons la GDPR.',
                'Respetamos tu privacidad. Datos cifrados según el GDPR.',
                'We respect your privacy. Data processed in accordance with GDPR.',
              )}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
