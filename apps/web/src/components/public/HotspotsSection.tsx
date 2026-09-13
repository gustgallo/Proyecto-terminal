import React, { useState } from 'react';
import { Target, ShieldCheck, ChevronRight } from 'lucide-react';

interface Hotspot {
  id: number;
  x: string;
  y: string;
  label: string;
  desc: string;
}

export const HotspotsSection: React.FC = () => {
  const [activeHotspot, setActiveHotspot] = useState<number>(0);

  const hotspots: Hotspot[] = [
    {
      id: 0,
      x: '35%',
      y: '45%',
      label: 'Frente en Acrílico de Alto Impacto',
      desc: 'Corte CNC de 3mm a 6mm con excelente difusividad óptica y resistencia a la degradación UV.',
    },
    {
      id: 1,
      x: '62%',
      y: '68%',
      label: 'Módulos LED de Alta Eficiencia (IP67)',
      desc: 'Iluminación uniforme de 6500K con certificación de resistencia al agua e intemperie.',
    },
    {
      id: 2,
      x: '78%',
      y: '30%',
      label: 'Perfil de Aluminio & Soldadura',
      desc: 'Estructura perimetral ligera con recubrimiento electrostático resistente a la corrosión.',
    },
  ];

  const currentActive = hotspots.find((h) => h.id === activeHotspot) ?? hotspots[0];

  return (
    <section className="py-16 sm:py-24 bg-[#070a10] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-16">
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase block">
            Macro-Fotografía & Detalles Técnicos
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Anatomía de la calidad Prodisa
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Toca o haz clic sobre los puntos de inspección para explorar la ingeniería interna.
          </p>
        </div>

        {/* Contenedor Principal */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Vista Gráfica del Producto */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-700/80 bg-slate-950 shadow-2xl aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden">
            <img
              src="/assets/Producto acrilico Negro iluminado.png"
              alt="Detalle macro de letrero acrílico retroiluminado Prodisa"
              className="w-full h-full object-cover filter brightness-90"
            />
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

            {/* Puntos Interactivos */}
            {hotspots.map((hs) => {
              const isActive = activeHotspot === hs.id;
              return (
                <div
                  key={hs.id}
                  style={{ top: hs.y, left: hs.x }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(hs.id)}
                    aria-label={`Inspeccionar ${hs.label}`}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 scale-110 shadow-[0_0_20px_#22d3ee]'
                        : 'bg-slate-900/90 text-cyan-400 border border-cyan-400/60 hover:scale-105'
                    }`}
                  >
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Tooltip flotante: Exclusivo para escritorio (md+) */}
                  {isActive && (
                    <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-12 w-72 bg-slate-950/95 border border-cyan-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-30 space-y-2 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                        <h4 className="text-xs font-bold text-white leading-tight">{hs.label}</h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{hs.desc}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tarjeta de detalle para móvil (oculta en md y superior) */}
          <div className="md:hidden bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 shadow-lg backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <h4 className="text-sm font-bold text-white">{currentActive.label}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{currentActive.desc}</p>
          </div>

          {/* Selector inferior tipo píldoras para facilitar la navegación en táctil */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            {hotspots.map((hs) => {
              const isActive = activeHotspot === hs.id;
              return (
                <button
                  key={hs.id}
                  onClick={() => setActiveHotspot(hs.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-950/30 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-semibold truncate pr-2">{hs.label}</span>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-cyan-400 translate-x-1' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};