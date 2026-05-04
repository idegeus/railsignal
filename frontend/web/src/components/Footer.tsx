import { useLang } from '../i18n';

const LINKS = [
  { labelCa: 'GitHub',             labelEs: 'GitHub',              href: 'https://github.com' },
  { labelCa: 'Open Data (CSV)',     labelEs: 'Open Data (CSV)',     href: '#dades' },
  { labelCa: 'Privadesa',          labelEs: 'Privacidad',          href: '#' },
  { labelCa: 'Premsa',             labelEs: 'Prensa',              href: '#' },
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
            © 2025 viesambcobertura.cat — {t('Projecte de codi obert', 'Proyecto de código abierto')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {LINKS.map((link) => (
            <a
              key={link.labelCa}
              href={link.href}
              className="text-sm tracking-wider uppercase text-on-surface-variant hover:text-transit-red transition-colors font-bold"
            >
              {t(link.labelCa, link.labelEs)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
