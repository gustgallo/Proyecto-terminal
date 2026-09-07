import React, { useState } from 'react';
import { Target, Info, ShieldCheck } from 'lucide-react';

export const HotspotsSection: React.FC = () => {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(0);

  const hotspots = [
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

  return (
    <section className="py-24 bg-[#070a10] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase block">
            Macro-Fotografía & Detalles Técnicos
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Anatomía de la calidad Prodisa
          </h2>
          <p className="text-slate-400 text-sm">
            Haz clic o pasa el cursor sobre los puntos de inspección para explorar la ingeniería interna.
          </p>
        </div>

        {/* Hotspots Container */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl max-w-5xl mx-auto aspect-[16/9]">
          <img
            src="/assets/Producto acrilico Negro iluminado.png"
            alt="Detalle macro de letrero acrílico retroiluminado Prodisa"
            className="w-full h-full object-cover filter brightness-90"
          />
          <div className="absolute inset-0 bg-slate-950/20" />

          {/* Render Hotspots */}
          {hotspots.map((hs) => {
            const isActive = activeHotspot === hs.id;
            return (
              <div
                key={hs.id}
                style={{ top: hs.y, left: hs.x }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
              >
                {/* Hotspot Pulse Circle */}
                <button
                  onClick={() => setActiveHotspot(hs.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 scale-115 shadow-[0_0_20px_#22d3ee]'
                      : 'bg-slate-900/90 text-cyan-400 border border-cyan-400/60 hover:scale-110'
                  }`}
                >
                  <Target className="w-5 h-5 animate-spin-slow" />
                </button>

                {/* Hotspot Info Popup Card */}
                {isActive && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-12 w-64 sm:w-72 bg-slate-950/95 border border-cyan-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-30 animate-fadeIn space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white">{hs.label}</h4>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{hs.desc}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
