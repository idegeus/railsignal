import { useLang } from '../i18n';
import { useDownload } from './DownloadModal';


export default function RouteBar() {
  const { t } = useLang();
  const { openDownload } = useDownload();

  return (
    <section className="bg-inverse-surface text-white py-14">
      <div className="max-w-container mx-auto px-margin">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-10">

          <div className="flex-shrink-0 max-w-xs">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-transit-yellow mb-2">
              {t('Cobertura de Dades', 'Cobertura de Datos', 'Data Coverage')}
            </p>
            <h2 className="text-xl font-bold mb-3">
              {t('Cobertura per Kilometràge', 'Cobertura por Kilometraje', 'Coverage by Kilometre')}
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              {t(
                "Estem recollint les primeres lectures. La cobertura es mostrarà de forma contínua quan hi hagi prou dades al llarg de la ruta.",
                'Estamos recopilando las primeras lecturas. La cobertura se mostrará de forma continua cuando haya suficientes datos a lo largo de la ruta.',
                "We're collecting the first readings. Coverage will be displayed continuously once there's enough data along the route.",
              )}
            </p>
            <button
              onClick={openDownload}
              className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-sm font-bold uppercase hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">volunteer_activism</span>
              {t("Ajuda'ns a mapejar", 'Ayúdanos a mapear', 'Help us map')}
            </button>
          </div>

          <div className="flex-grow w-full min-w-0">
            <div className="flex justify-between text-xs text-white/40 font-bold uppercase tracking-wider mb-2">
              <span>Barcelona-Sants</span>
              <span>Cerbère</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full" />
            <p className="mt-3 text-xs text-white/40 uppercase tracking-wider">
              {t('Sense dades suficients — disponible aviat', 'Sin datos suficientes — disponible pronto', 'Not enough data yet — coming soon')}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
