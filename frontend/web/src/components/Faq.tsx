import { useState } from 'react';
import { useLang, type Lang } from '../i18n';

type FaqItem = { question: string; answer: React.ReactNode };

const FAQS: Record<Lang, FaqItem[]> = {
  ca: [
    {
      question: 'Cobrirà altres línies ferroviàries de Catalunya?',
      answer: "Comencem amb la R11 perquè és la nostra línia diària. Si hi ha prou persones interessades a contribuir en altres línies — com la R1, la R2 o qualsevol altra — estarem encantats d'expandir el projecte. Posa't en contacte amb nosaltres o baixa l'app i comença a registrar.",
    },
    {
      question: "I les línies d'alta velocitat o els Rodalies de Madrid?",
      answer: "Per ara el projecte se centra en Catalunya, però la infraestructura és completament reutilitzable per a qualsevol corredor ferroviari. Si un grup de viatgers d'una altra línia vol impulsar-ho, podem donar-los suport.",
    },
    {
      question: "Com funciona l'aplicació mòbil?",
      answer: 'Baixa l\'app, prem "Inicia el trajecte" quan puges al tren i deixa-la funcionar en segon pla. Cada deu segons registra automàticament la qualitat del senyal mòbil i la ubicació aproximada (arrodonida a una quadrícula de ~50 m per preservar la privadesa). Quan arribes, prem "Atura" i les dades es carreguen al servidor.',
    },
    {
      question: 'Les meves dades personals estan segures?',
      answer: "L'app no recull mai el teu nom, número de telèfon ni cap dada d'identificació personal. Les coordenades GPS s'arrodoneixen a una quadrícula de 50 metres abans de desar-les, de manera que mai es guarda la teva posició exacta. Totes les dades publicades com a open data son anònimes.",
    },
    {
      question: 'Puc veure les meves pròpies dades registrades?',
      answer: "Ara per ara les dades es publiquen de forma agregada. En versions futures de l'app volem afegir una pantalla que mostri el teu historial de trajectes i les lectures de senyal que has contribuït.",
    },
    {
      question: 'Com puc ajudar si no viatjo en tren?',
      answer: <>Pots compartir el projecte amb persones que sí que viatgen habitualment, escriure als operadors ferroviaris i al Ministeri demanant millores de cobertura, o posar-te en contacte amb nosaltres a <a href="mailto:viesambcobertura@ivodegeus.nl" className="text-transit-red hover:underline font-medium">viesambcobertura@ivodegeus.nl</a> per col·laborar en el desenvolupament. Les dades que recollim serveixen precisament per donar pes a aquests missatges.</>,
    },
  ],
  es: [
    {
      question: '¿Cubrirá otras líneas ferroviarias de Cataluña?',
      answer: "Empezamos con la R11 porque es nuestra línea diaria. Si hay suficientes personas interesadas en contribuir en otras líneas — como la R1, la R2 o cualquier otra — estaremos encantados de expandir el proyecto. Contáctanos o descarga la app y empieza a registrar.",
    },
    {
      question: '¿Y las líneas de alta velocidad o los Cercanías de Madrid?',
      answer: "Por ahora el proyecto se centra en Cataluña, pero la infraestructura es completamente reutilizable para cualquier corredor ferroviario. Si un grupo de viajeros de otra línea quiere impulsarlo, podemos darles apoyo.",
    },
    {
      question: '¿Cómo funciona la aplicación móvil?',
      answer: 'Descarga la app, pulsa "Inicia el trayecto" cuando subas al tren y déjala funcionar en segundo plano. Cada diez segundos registra automáticamente la calidad de la señal móvil y la ubicación aproximada (redondeada a una cuadrícula de ~50 m para preservar la privacidad). Cuando llegues, pulsa "Parar" y los datos se cargan al servidor.',
    },
    {
      question: '¿Mis datos personales están seguros?',
      answer: "La app nunca recoge tu nombre, número de teléfono ni ningún dato de identificación personal. Las coordenadas GPS se redondean a una cuadrícula de 50 metros antes de guardarse, de modo que nunca se guarda tu posición exacta. Todos los datos publicados como open data son anónimos.",
    },
    {
      question: '¿Puedo ver mis propios datos registrados?',
      answer: "Por ahora los datos se publican de forma agregada. En versiones futuras de la app queremos añadir una pantalla que muestre tu historial de trayectos y las lecturas de señal que has contribuido.",
    },
    {
      question: '¿Cómo puedo ayudar si no viajo en tren?',
      answer: <>Puedes compartir el proyecto con personas que sí viajan habitualmente, escribir a los operadores ferroviarios y al Ministerio pidiendo mejoras de cobertura, o ponerte en contacto con nosotros en <a href="mailto:viesambcobertura@ivodegeus.nl" className="text-transit-red hover:underline font-medium">viesambcobertura@ivodegeus.nl</a> para colaborar en el desarrollo. Los datos que recogemos sirven precisamente para dar peso a estos mensajes.</>,
    },
  ],
};

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-surface-container last:border-b-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-base font-semibold text-on-surface">{item.question}</span>
        <span
          className="material-symbols-outlined text-transit-red flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <p className="pb-5 text-body-md text-on-surface-variant leading-relaxed">
          {item.answer}
        </p>
      )}
    </div>
  );
}

export default function Faq() {
  const { lang, t } = useLang();
  const faqs = FAQS[lang];

  return (
    <section className="bg-surface-container py-24">
      <div className="max-w-container mx-auto px-margin">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-transit-red mb-4">
            {t('Preguntes freqüents', 'Preguntas frecuentes')}
          </p>
          <h2 className="text-h2 font-bold text-on-surface tracking-tight mb-10">
            {t('Tens preguntes?', '¿Tienes preguntas?')}
          </h2>
          <div className="bg-white border border-surface-container px-6">
            {faqs.map((item) => (
              <FaqRow key={item.question} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
