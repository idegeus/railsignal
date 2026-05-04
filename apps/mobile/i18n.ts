import { getLocales } from 'expo-localization';

type Lang = 'ca' | 'es' | 'en';

function detectLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  if (code === 'ca') return 'ca';
  if (code === 'es') return 'es';
  return 'en';
}

export const lang: Lang = detectLang();

const strings = {
  ca: {
    startLogging:   'Inicia el trajecte',
    stopLogging:    'Atura el trajecte',
    recording:      '● Enregistrant',
    readingsStored: 'mesures guardades',
    nearStation:    'Prop de',
    exportCsv:      'Exportar CSV',
    noDataYet:      'Sense dades encara',
    minLabel:       '−5 min',
    nowLabel:       'ara',
    stationTitle:   '🚆 Estació propera',
    stationBody:    (name: string) =>
      `Ets a prop de ${name}. RailSignal registrarà la qualitat del senyal.`,
  },
  es: {
    startLogging:   'Iniciar trayecto',
    stopLogging:    'Detener trayecto',
    recording:      '● Grabando',
    readingsStored: 'medidas guardadas',
    nearStation:    'Cerca de',
    exportCsv:      'Exportar CSV',
    noDataYet:      'Sin datos aún',
    minLabel:       '−5 min',
    nowLabel:       'ahora',
    stationTitle:   '🚆 Estación cercana',
    stationBody:    (name: string) =>
      `Estás cerca de ${name}. RailSignal registrará la calidad de señal.`,
  },
  en: {
    startLogging:   'Start journey',
    stopLogging:    'Stop journey',
    recording:      '● Recording',
    readingsStored: 'readings stored',
    nearStation:    'Near',
    exportCsv:      'Export CSV',
    noDataYet:      'No data yet',
    minLabel:       '−5 min',
    nowLabel:       'now',
    stationTitle:   '🚆 Train station nearby',
    stationBody:    (name: string) =>
      `You're near ${name}. RailSignal will log signal quality on your journey.`,
  },
};

export const t = strings[lang];
