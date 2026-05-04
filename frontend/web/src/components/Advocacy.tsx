export default function Advocacy() {
  return (
    <section className="bg-white border-y border-surface-container py-24" id="qui-som">
      <div className="max-w-container mx-auto px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          <div className="border-l-4 border-transit-yellow pl-8">
            <h2 className="text-h2 font-bold text-on-surface tracking-tight mb-6">
              Reflexió sobre el silenci digital
            </h2>
            <p className="text-body-lg text-on-surface-variant leading-relaxed italic">
              "Mentre que les autopistes espanyoles gaudeixen d'una cobertura excel·lent
              i França ha garantit internet en tota la seva xarxa d'alta velocitat,
              els nostres corredors ferroviaris queden en el silenci digital. Millorar
              la connectivitat no és una impossibilitat tècnica, sinó una decisió
              d'inversió dels operadors."
            </p>
          </div>

          <div className="bg-surface-container p-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-transit-red text-3xl">campaign</span>
              <span className="text-sm font-bold uppercase tracking-widest text-transit-red">
                Acció Ciutadana
              </span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Exigim transparència i inversions reals en infraestructures digitals.
              La mobilitat sostenible requereix estar connectats al món. Les dades
              que recollim són la prova objectiva que necessitem per demanar canvis.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-transit-red font-bold text-xs uppercase hover:underline"
            >
              Llegeix el nostre manifest
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
