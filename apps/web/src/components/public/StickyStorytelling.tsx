import React, { useState } from 'react';
import { PenTool, Cpu, Layers, Zap, Building2, CheckCircle2 } from 'lucide-react';

export const StickyStorytelling: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      stage: 'ETAPA 01',
      title: 'Diseño e Ingeniería de Materiales',
      desc: 'Conceptualización 3D y adaptación precisa de manuales de identidad corporativa. Definición de calibres, aleaciones y especificaciones de durabilidad.',
      img: '/assets/diseño industrial.png',
      icon: PenTool,
      highlights: ['Modelado CAD/CAM', 'Cálculo estructural', 'Manuales de marca'],
    },
    {
      stage: 'ETAPA 02',
      title: 'Corte CNC Láser de Alta Precisión',
      desc: 'Procesamiento en nuestra planta mediante cortadoras CNC láser industrial para acrílico, aluminio y lámina de acero sin imperfecciones.',
      img: '/assets/Servicio corte laser con cnc.png',
      icon: Cpu,
      highlights: ['Tolerancia milimétrica', 'Cantos pulidos', 'Cero rebabas'],
    },
    {
      stage: 'ETAPA 03',
      title: 'Materiales Premium & Acrílico Negro',
      desc: 'Ensamblado de frentes en acrílico negro especial con propiedades difusoras que cobran luz brillante al encenderse.',
      img: '/assets/Producto acrilico Negro iluminado.png',
      icon: Layers,
      highlights: ['Acrílico de alto impacto', 'Aleaciones de aluminio', 'Vinil arquitectónico'],
    },
    {
      stage: 'ETAPA 04',
      title: 'Iluminación LED de Bajo Consumo & Ensamble',
      desc: 'Montaje de módulos LED de alta intensidad con protección IP67 contra intemperie y fuentes de poder reguladas.',
      img: '/assets/producto letras luminosas.png',
      icon: Zap,
      highlights: ['Módulos LED IP67', 'Luz uniforme sin sombras', 'Bajo consumo eléctrico'],
    },
    {
      stage: 'ETAPA 05',
      title: 'Instalación en Sitio & Encendido Final',
      desc: 'Despliegue de cuadrillas certificadas a nivel nacional para el montaje seguro en fachadas y encendido nocturno del letrero.',
      img: '/assets/producto logotipo en fachada.png',
      icon: Building2,
      highlights: ['Cobertura nacional 32 estados', 'Montaje seguro en alturas', 'Encendido de impacto'],
    },
  ];

  return (
    <section id="historia-fabricacion" className="py-24 bg-[#0a0e17] relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase block">
            Storytelling de Fabricación
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Del concepto a la fachada: El viaje de un letrero Prodisa
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Explora interactivamente cómo transformamos materias primas en elementos de branding tridimensionales.
          </p>
        </div>

        {/* Interactive Sticky Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Interactive Visual Display */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl group aspect-[16/10]">
              <img
                src={steps[activeStep].img}
                alt={steps[activeStep].title}
                className="w-full h-full object-cover transition-all duration-700 opacity-95 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Active Stage Floating Badge */}
              <div className="absolute top-6 left-6 bg-slate-950/90 backdrop-blur-md border border-slate-700 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-300">{steps[activeStep].stage}</span>
              </div>

              {/* Image Footer Caption */}
              <div className="absolute bottom-6 left-6 right-6 space-y-1">
                <h3 className="text-xl font-bold text-white">{steps[activeStep].title}</h3>
              </div>
            </div>
          </div>

          {/* Right Column: Step Selector Timeline */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase block">
                        {step.stage}
                      </span>
                      <h4 className="text-base font-bold text-white">{step.title}</h4>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
                      <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {step.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md"
                          >
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
