import { useLang, type Lang } from '../i18n';
import { useDownload } from './DownloadModal';

export default function Nav() {
  const { lang, setLang, t } = useLang();
  const { openDownload } = useDownload();

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-surface-container">
      <div className="max-w-container mx-auto px-gutter h-16 flex items-center justify-between">
        <a href="#inici" className="text-xl font-black tracking-tighter text-transit-red">
          Vies amb Cobertura
        </a>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-bold tracking-wider">
            {(['ca', 'es', 'en'] as Lang[]).map((l, i) => (
              <>
                {i > 0 && <span key={`sep-${l}`} className="text-outline-variant">|</span>}
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`uppercase transition-colors ${
                    lang === l ? 'text-transit-red' : 'text-on-surface-variant hover:text-transit-red'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              </>
            ))}
          </div>
          <button
            onClick={openDownload}
            className="bg-transit-red text-white px-4 py-2 text-sm font-bold uppercase hover:bg-primary transition-colors"
          >
            {t("Baixa l'App", 'Descarga la App', 'Download the App')}
          </button>
        </div>
      </div>
    </header>
  );
}
