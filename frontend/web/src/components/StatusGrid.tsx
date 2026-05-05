import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

type Stats = { readings: number; journeys: number; stations: number };

const ZERO: Stats = { readings: 0, journeys: 0, stations: 0 };
const INITIAL_OFFSET = 20;   // start this many below the real value
const INITIAL_DURATION = 4_000;
const UPDATE_DURATION = 60_000;

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function useAnimatedStats(): Stats {
  const [display, setDisplay] = useState<Stats>(ZERO);

  // Refs avoid stale closures in the animation loop
  const displayRef  = useRef<Stats>(ZERO);
  const fromRef     = useRef<Stats>(ZERO);
  const toRef       = useRef<Stats>(ZERO);
  const startRef    = useRef<number>(0);
  const durationRef = useRef<number>(INITIAL_DURATION);
  const rafRef      = useRef<number | null>(null);
  const phaseRef    = useRef<'initial' | 'animating' | 'idle'>('initial');

  const tick = useCallback((timestamp: number) => {
    const t = Math.min((timestamp - startRef.current) / durationRef.current, 1);
    const eased = easeOut(t);
    const next: Stats = {
      readings: lerp(fromRef.current.readings, toRef.current.readings, eased),
      journeys: lerp(fromRef.current.journeys, toRef.current.journeys, eased),
      stations: lerp(fromRef.current.stations, toRef.current.stations, eased),
    };
    displayRef.current = next;
    setDisplay(next);

    if (t < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      phaseRef.current = 'idle';
    }
  }, []);

  function startAnim(from: Stats, to: Stats, duration: number) {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    fromRef.current  = from;
    toRef.current    = to;
    startRef.current = performance.now();
    durationRef.current = duration;
    phaseRef.current = 'animating';
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    function fetchAndUpdate() {
      fetch(`${API_BASE}/api/v1/stats`)
        .then((r) => r.json())
        .then((data: Stats) => {
          if (phaseRef.current === 'initial') {
            // First load: start just below the real value and count up
            const from: Stats = {
              readings: Math.max(0, data.readings - INITIAL_OFFSET),
              journeys: Math.max(0, data.journeys - INITIAL_OFFSET),
              stations: Math.max(0, data.stations - INITIAL_OFFSET),
            };
            startAnim(from, data, INITIAL_DURATION);
          } else if (phaseRef.current === 'idle') {
            // Subsequent poll: smooth transition from wherever we are now
            startAnim({ ...displayRef.current }, data, UPDATE_DURATION);
          } else {
            // Animation still running: just update the destination silently
            toRef.current = data;
          }
        })
        .catch(() => {});
    }

    fetchAndUpdate();
    const id = setInterval(fetchAndUpdate, 60_000);
    return () => {
      clearInterval(id);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return display;
}

export default function StatusGrid() {
  const { t } = useLang();
  const stats = useAnimatedStats();

  const cards = [
    {
      icon: 'sensors',
      value: stats.readings,
      label: t('Lectures Registrades', 'Lecturas Registradas', 'Readings Recorded'),
      description: t(
        "Mesures de senyal recollides pels usuaris de l'aplicació mòbil al llarg de la línia R11.",
        'Medidas de señal recogidas por los usuarios de la aplicación móvil a lo largo de la línea R11.',
        'Signal measurements collected by mobile app users along the R11 line.',
      ),
    },
    {
      icon: 'route',
      value: stats.journeys,
      label: t('Trajectes Completats', 'Trayectos Completados', 'Journeys Completed'),
      description: t(
        'Recorreguts enregistrats des de Barcelona fins a Portbou o fins a Cerbère i viceversa.',
        'Recorridos registrados desde Barcelona hasta Portbou o hasta Cerbère y viceversa.',
        'Trips recorded between Barcelona and Portbou or Cerbère and back.',
      ),
    },
    {
      icon: 'location_on',
      value: stats.stations,
      label: t('Estacions amb Dades', 'Estaciones con Datos', 'Stations with Data'),
      description: t(
        "Estacions de la línia R11 amb almenys una lectura de senyal registrada pels contribuïdors.",
        'Estaciones de la línea R11 con al menos una lectura de señal registrada por los colaboradores.',
        'R11 stations with at least one signal reading recorded by contributors.',
      ),
    },
  ];

  return (
    <section className="max-w-container mx-auto px-margin py-20" id="dades">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-good opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-signal-good" />
          </span>
          <span className="text-label text-signal-good uppercase tracking-widest">
            {t('En Directe', 'En Directo', 'Live')}
          </span>
        </div>
        <h2 className="text-h2 font-bold text-on-surface tracking-tight">
          {t('Estat del Servei R11', 'Estado del Servicio R11', 'R11 Service Status')}
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          {t(
            "Dades recollides pels usuaris de l'aplicació",
            'Datos recogidos por los usuarios de la aplicació',
            'Data collected by app users',
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
