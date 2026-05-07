import { useLang } from '../i18n';

const LINKS = [
  { labelCa: 'GitHub',             labelEs: 'GitHub',              labelEn: 'GitHub',              href: 'https://github.com/idegeus/railsignal' },
  { labelCa: 'Open Data (CSV)',     labelEs: 'Open Data (CSV)',     labelEn: 'Open Data (CSV)',     href: '#dades' },
  { labelCa: 'Privadesa',          labelEs: 'Privacidad',          labelEn: 'Privacy',             href: '#' },
  { labelCa: 'Premsa',             labelEs: 'Prensa',              labelEn: 'Press',               href: '#' },
];

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-white border-t border-surface-container py-12">
      <div className="max-w-container mx-auto px-margin flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <span className="text-lg font-black tracking-tighter text-transit-red">
            Vies amb Cobertura
          </span>
          <p className="text-xs tracking-widest uppercase text-on-surface-variant text-center md:text-left">
            © 2026 viesambcobertura.cat — {t('Projecte de codi obert', 'Proyecto de código abierto', 'Open-source project')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {LINKS.map((link) => (
            <a
              key={link.labelCa}
              href={link.href}
              className="text-sm tracking-wider uppercase text-on-surface-variant hover:text-transit-red transition-colors font-bold"
            >
              {t(link.labelCa, link.labelEs, link.labelEn)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
