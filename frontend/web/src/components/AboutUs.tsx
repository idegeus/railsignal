import flacaImg from '../assets/flaca.jpg';
import { useLang } from '../i18n';

export default function AboutUs() {
  const { t } = useLang();

  return (
    <section className="bg-white border-t border-surface-container py-24" id="qui-som">
      <div className="max-w-container mx-auto px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-transit-red mb-4">
              {t('Qui som', 'Quiénes somos', 'Who we are')}
            </p>
            <h2 className="text-h2 font-bold text-on-surface tracking-tight mb-8">
              Ivo &amp; Marta
            </h2>
            <div className="flex flex-col gap-5 text-body-lg text-on-surface-variant leading-relaxed">
              <p>
                {t(
                  "Som viatgers habituals de la línia R11, entre Flaçà i Barcelona. Cada vegada que fem aquest trajecte ens trobem amb el mateix problema: zones sense cobertura, connexions inestables i la impossibilitat de treballar o descansar connectats durant el viatge.",
                  'Somos viajeros habituales de la línea R11, entre Flaçà y Barcelona. Cada vez que hacemos este trayecto nos encontramos con el mismo problema: zonas sin cobertura, conexiones inestables y la imposibilidad de trabajar o descansar conectados durante el viaje.',
                  "We're regular passengers on the R11 line, between Flaçà and Barcelona. Every time we make this journey we face the same problem: dead zones, unstable connections, and the impossibility of working or staying connected during the trip.",
                )}
              </p>
              <p>
                {t(
                  "Ens encantaria poder utilitzar el tren molt més. És el transport més sostenible, el més còmode per a distàncies llargues, i hauria de ser la primera opció. Però sense internet, molts dies el cotxe guanya.",
                  'Nos encantaría poder utilizar el tren mucho más. Es el transporte más sostenible, el más cómodo para distancias largas, y debería ser la primera opción. Pero sin internet, muchos días el coche gana.',
                  "We'd love to use the train much more. It's the most sustainable transport, the most comfortable for long distances, and should be the first choice. But without internet, too many days the car wins.",
                )}
              </p>
              <p>
                {t(
                  "A Alemanya, els Països Baixos i França, la cobertura a la xarxa ferroviària és un estàndard que ja no es discuteix. A Catalunya, encara és una excepció. Volem canviar-ho, i ho fem amb dades.",
                  'En Alemania, los Países Bajos y Francia, la cobertura en la red ferroviaria es un estándar que ya no se discute. En Cataluña, todavía es una excepción. Queremos cambiarlo, y lo hacemos con datos.',
                  "In Germany, the Netherlands, and France, rail network coverage is a standard no one debates. In Catalonia, it's still the exception. We want to change that — with data.",
                )}
              </p>
            </div>
          </div>

          <div>
            <img
              src={flacaImg}
              alt={t("Ivo i Marta a l'estació de Flaçà", "Ivo y Marta en la estación de Flaçà", "Ivo and Marta at Flaçà station")}
              className="w-full object-cover"
            />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {t("Estació de Flaçà", "Estación de Flaçà", "Flaçà Station")}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
