import { useState } from 'react';
import { useLang } from '../i18n';

export default function Newsletter() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section className="bg-surface-container py-24" id="butlleti">
      <div className="max-w-2xl mx-auto px-margin text-center">
        <span className="text-transit-red font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
          {t('Butlletí de Transparència', 'Boletín de Transparencia')}
        </span>
        <h2 className="text-h2 font-bold text-on-surface tracking-tight mb-4">
          {t('Rep els informes mensuals', 'Recibe los informes mensuales')}
        </h2>
        <p className="text-body-lg text-on-surface-variant mb-10">
          {t(
            "Analitzem les dades crowdsourced per exigir millores a les operadores i al Ministeri.",
            'Analizamos los datos crowdsourced para exigir mejoras a los operadores y al Ministerio.',
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
              {t("T'has subscrit correctament.", 'Te has suscrito correctamente.')}
            </p>
            <p className="text-sm text-on-surface-variant mt-2">
              {t(
                "T'enviarem l'informe quan surti el pròxim mes.",
                'Te enviaremos el informe cuando salga el próximo mes.',
              )}
            </p>
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
                placeholder={t('La teva adreça electrònica', 'Tu dirección de correo electrónico')}
                className="flex-grow bg-white px-6 py-4 outline-none text-on-surface text-body-md"
                required
              />
              <button
                type="submit"
                className="bg-transit-red text-white font-bold text-sm uppercase px-8 py-4 hover:bg-primary transition-colors whitespace-nowrap"
              >
                {t('Subscriu-te', 'Suscríbete')}
              </button>
            </form>
            <p className="mt-4 text-xs text-on-surface-variant uppercase tracking-wider">
              {t(
                'Respectem la teva privadesa. Dades xifrades segons la GDPR.',
                'Respetamos tu privacidad. Datos cifrados según el GDPR.',
              )}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
