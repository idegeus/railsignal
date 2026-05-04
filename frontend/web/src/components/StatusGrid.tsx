import { useEffect, useState } from 'react';
import { useLang } from '../i18n';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

type Stats = { readings: number; journeys: number; stations: number };

function useStats() {
  const [stats, setStats] = useState<Stats>({ readings: 0, journeys: 0, stations: 0 });
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/stats`)
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => {});
  }, []);
  return stats;
}

export default function StatusGrid() {
  const { t } = useLang();
  const stats = useStats();

  const cards = [
    {
      icon: 'sensors',
      value: stats.readings,
      label: t('Lectures Registrades', 'Lecturas Registradas'),
      description: t(
        "Mesures de senyal recollides pels usuaris de l'aplicació mòbil al llarg de la línia R11.",
        'Medidas de señal recogidas por los usuarios de la aplicación móvil a lo largo de la línea R11.',
      ),
    },
    {
      icon: 'route',
      value: stats.journeys,
      label: t('Trajectes Completats', 'Trayectos Completados'),
      description: t(
        'Recorreguts enregistrats des de Barcelona fins a Portbou o fins a Cerbère i viceversa.',
        'Recorridos registrados desde Barcelona hasta Portbou o hasta Cerbère y viceversa.',
      ),
    },
    {
      icon: 'location_on',
      value: stats.stations,
      label: t('Estacions amb Dades', 'Estaciones con Datos'),
      description: t(
        "Estacions de la línia R11 amb almenys una lectura de senyal registrada pels contribuïdors.",
        'Estaciones de la línea R11 con al menos una lectura de señal registrada por los colaboradores.',
      ),
    },
  ];

  return (
    <section className="max-w-container mx-auto px-margin py-20" id="dades">
      <div className="mb-12">
        <h2 className="text-h2 font-bold text-on-surface tracking-tight">
          {t('Estat del Servei R11', 'Estado del Servicio R11')}
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          {t(
            "Dades recollides pels usuaris de l'aplicació",
            'Datos recogidos por los usuarios de la aplicación',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-bright p-8 border border-surface-container hover:border-transit-yellow transition-colors"
          >
            <div className="mb-6">
              <span className="material-symbols-outlined text-transit-red text-[40px]">
                {card.icon}
              </span>
            </div>
            <div className="text-[40px] font-black text-on-surface tracking-tight leading-none mb-1">
              {card.value.toLocaleString()}
            </div>
            <div className="text-label text-on-surface uppercase tracking-widest mb-4">
              {card.label}
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
