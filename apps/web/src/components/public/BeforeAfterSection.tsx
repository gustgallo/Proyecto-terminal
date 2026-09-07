import React, { useState } from 'react';
import { MoveHorizontal, Sparkles } from 'lucide-react';

export const BeforeAfterSection: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <section className="py-24 bg-[#0d121f] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase block">
            Transformación de Espacios
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Antes y Después: Renovación de Imagen Corporativa
          </h2>
          <p className="text-slate-400 text-sm">
            Arrastra el deslizador central para comparar el cambio de visibilidad e impacto visual.
          </p>
        </div>

        {/* Before / After Slider Container */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl max-w-5xl mx-auto aspect-[16/9] select-none">
          {/* AFTER Image (Full background) */}
          <img
            src="/assets/producto logotipo en fachada.png"
            alt="Después de la instalación Prodisa"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-emerald-600/90 text-white font-bold text-xs px-3 py-1.5 rounded-full z-10 shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            DESPUÉS (Prodisa)
          </div>

          {/* BEFORE Image (Clipped overlay) */}
          <div
            style={{ width: `${sliderPos}%` }}
            className="absolute top-0 bottom-0 left-0 overflow-hidden z-10 border-r-2 border-white shadow-2xl transition-all duration-75"
          >
            <img
              src="/assets/producto marquesinas.png"
              alt="Antes de la instalación"
              className="absolute top-0 bottom-0 left-0 w-full h-full object-cover filter grayscale contrast-125 brightness-75 max-w-none"
              style={{ width: '100%' }}
            />
            <div className="absolute top-4 left-4 bg-slate-950/90 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-full shadow-lg border border-slate-700">
              ANTES
            </div>
          </div>

          {/* Slider Control Handle */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />

          <div
            style={{ left: `${sliderPos}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl z-20 pointer-events-none"
          >
            <MoveHorizontal className="w-5 h-5 text-slate-900" />
          </div>
        </div>
      </div>
    </section>
  );
};
