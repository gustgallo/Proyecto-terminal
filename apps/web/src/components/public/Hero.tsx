import React from 'react';
import { LaserButton } from './LaserButton';
import { ChevronDown, ArrowRight } from 'lucide-react';

interface HeroProps {
  onOpenQuoteModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenQuoteModal }) => {
  return (
    <section className="relative h-screen min-h-[650px] w-full flex items-center justify-center overflow-hidden bg-[#070a10]">
      {/* Background Image with Slow Cinematic Motion */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/assets/Servicio corte laser con cnc.png"
          alt="Corte CNC Láser Prodisa"
          className="w-full h-full object-cover scale-105 animate-[pulse_10s_ease-in-out_infinite] opacity-60 filter brightness-[0.7]"
        />
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a10] via-[#070a10]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a10] via-transparent to-[#070a10]/80 z-10" />
      </div>

      {/* Industrial Grid Lines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:5rem_5rem] z-10 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center h-full pt-16">
        <div className="max-w-3xl space-y-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-500/30 rounded-full px-4 py-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-cyan-300 tracking-widest uppercase">
              Ingeniería & Manufactura
            </span>
          </div>

          {/* Masked Headline Reveal */}
          <div className="overflow-hidden">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[0.95]">
              PRECISIÓN <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                A GRAN ESCALA.
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl">
            Diseñamos, fabricamos, instalamos y conservamos soluciones de señalización e imagen corporativa para empresas que necesitan calidad, consistencia y atención integral.
          </p>

          {/* Laser Button CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <LaserButton onClick={onOpenQuoteModal} variant="primary">
              Solicitar Cotización Directa
              <ArrowRight className="w-4 h-4 ml-1" />
            </LaserButton>

            <a
              href="#historia-fabricacion"
              className="inline-flex items-center justify-center gap-2 text-slate-300 hover:text-white px-6 py-3.5 text-sm font-semibold bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
            >
              Explorar Proceso de Fabricación
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <a
        href="#historia-fabricacion"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group"
      >
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 group-hover:text-cyan-400">
          Desplaza para explorar
        </span>
        <ChevronDown className="w-5 h-5 animate-bounce text-cyan-400" />
      </a>
    </section>
  );
};
