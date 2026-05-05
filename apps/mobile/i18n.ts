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
    startLogging:        'Inicia el trajecte',
    stopLogging:         'Atura el trajecte',
    recording:           '● Enregistrant',
    readingsStored:      'mesures guardades',
    nearStation:         'Prop de',
    noDataYet:           'Sense dades encara',
    minLabel:            '−5 min',
    nowLabel:            'ara',
    stationTitle:        '🚆 Estació propera',
    stationBody:         (name: string) =>
      `Ets a prop de ${name}. RailSignal registrarà la qualitat del senyal.`,
    notificationTitle:   'Vies amb Cobertura',
    notificationBody:    'Registrant la qualitat del senyal…',
    signalExcellent:     'Excel·lent',
    signalGood:          'Bo',
    signalFair:          'Regular',
    signalPoor:          'Dolent',
    signalVeryPoor:      'Molt dolent',
    signalNone:          'Sense senyal',
    pendingUpload:       'per pujar',
    lastPingLabel:       'Última connexió:',
    pingJustNow:         'ara mateix',
    pingMinAgo:          'min',
    pingNever:           'Sense connexió',
  },
  es: {
    startLogging:        'Iniciar trayecto',
    stopLogging:         'Detener trayecto',
    recording:           '● Grabando',
    readingsStored:      'medidas guardadas',
    nearStation:         'Cerca de',
    noDataYet:           'Sin datos aún',
    minLabel:            '−5 min',
    nowLabel:            'ahora',
    stationTitle:        '🚆 Estación cercana',
    stationBody:         (name: string) =>
      `Estás cerca de ${name}. RailSignal registrará la calidad de señal.`,
    notificationTitle:   'Vies amb Cobertura',
    notificationBody:    'Registrando la calidad de señal…',
    signalExcellent:     'Excelente',
    signalGood:          'Bueno',
    signalFair:          'Regular',
    signalPoor:          'Malo',
    signalVeryPoor:      'Muy malo',
    signalNone:          'Sin señal',
    pendingUpload:       'por subir',
    lastPingLabel:       'Última conexión:',
    pingJustNow:         'ahora mismo',
    pingMinAgo:          'min',
    pingNever:           'Sin conexión',
  },
  en: {
    startLogging:        'Start journey',
    stopLogging:         'Stop journey',
    recording:           '● Recording',
    readingsStored:      'readings stored',
    nearStation:         'Near',
    noDataYet:           'No data yet',
    minLabel:            '−5 min',
    nowLabel:            'now',
    stationTitle:        '🚆 Train station nearby',
    stationBody:         (name: string) =>
      `You're near ${name}. RailSignal will log signal quality on your journey.`,
    notificationTitle:   'Vies amb Cobertura',
    notificationBody:    'Logging signal quality…',
    signalExcellent:     'Excellent',
    signalGood:          'Good',
    signalFair:          'Fair',
    signalPoor:          'Poor',
    signalVeryPoor:      'Very Poor',
    signalNone:          'No Signal',
    pendingUpload:       'pending upload',
    lastPingLabel:       'Last connection:',
    pingJustNow:         'just now',
    pingMinAgo:          'min ago',
    pingNever:           'No connection',
  },
};

export const t = strings[lang];
