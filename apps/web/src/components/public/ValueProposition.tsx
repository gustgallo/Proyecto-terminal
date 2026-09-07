import React from 'react';
import { PenTool, Factory, Wrench, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ValueProposition: React.FC = () => {
  const capacities = [
    {
      icon: PenTool,
      title: 'Diseño',
      desc: 'Conceptualización, adaptación de manuales de identidad corporativa, especificaciones técnicas y selección de materiales.',
      highlights: ['Manuales de marca', 'Ingeniería de materiales', 'Desarrollo conceptual'],
    },
    {
      icon: Factory,
      title: 'Fabricación',
      desc: 'Planta de producción propia equipada con corte CNC, termoformado, soldadura y ensamblado de precisión.',
      highlights: ['Procesos CNC de precisión', 'Control de calidad', 'Capacidad masiva'],
    },
    {
      icon: Wrench,
      title: 'Instalación',
      desc: 'Montaje profesional en sitio con atención rigurosa a normas de seguridad, acabados de alto nivel y cumplimiento de tiempos.',
      highlights: ['Cobertura en territorio nacional', 'Personal certificado', 'Seguridad operativa'],
    },
    {
      icon: ShieldAlert,
      title: 'Mantenimiento',
      desc: 'Corrección oportuna de fallas en iluminación, sustitución de componentes y reparación de elementos visuales.',
      highlights: ['Atención correctiva', 'Sustitución de componentes', 'Garantía de servicio'],
    },
    {
      icon: RefreshCw,
      title: 'Conservación',
      desc: 'Programas orientados a mantener una imagen uniforme, funcional y en excelente estado a largo plazo.',
      highlights: ['Planes preventivos', 'Homogeneidad de marca', 'Visitas programadas'],
    },
  ];

  return (
    <section className="py-24 bg-[#0a0e17] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold text-blue-400 tracking-widest uppercase">
            Servicios Integrales
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Diseño, Fabricación, Instalación, Mantenimiento y Conservación
          </h3>
          <p className="text-slate-400 text-sm">
            Acompañamos a nuestros clientes durante todo el ciclo del proyecto, desde la conceptualización hasta la conservación posterior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capacities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all duration-300 group relative flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{item.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/60 space-y-2">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
