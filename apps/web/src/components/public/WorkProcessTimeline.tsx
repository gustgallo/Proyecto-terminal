import React from 'react';
import { Search, Compass, Hammer, Truck, ShieldCheck } from 'lucide-react';

export const WorkProcessTimeline: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Conceptualización & Levantamiento',
      desc: 'Revisión de requerimientos, levantamiento físico en sitio y análisis del manual de identidad de marca.',
      icon: Search,
    },
    {
      num: '02',
      title: 'Especificación e Ingeniería',
      desc: 'Selección estricta de materiales, cálculo estructural y renderizado técnico para producción.',
      icon: Compass,
    },
    {
      num: '03',
      title: 'Fabricación en Planta',
      desc: 'Corte CNC, termoformado, ensamblado de componentes y control de calidad en instalaciones propias.',
      icon: Hammer,
    },
    {
      num: '04',
      title: 'Montaje e Instalación Especializada',
      desc: 'Despliegue de cuadrillas certificadas a nivel nacional con estricto apego a normas de seguridad.',
      icon: Truck,
    },
    {
      num: '05',
      title: 'Mantenimiento & Conservación',
      desc: 'Planes continuos de mantenimiento preventivo y correctivo para asegurar la durabilidad de su imagen.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-24 bg-[#0d121f] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold text-blue-400 tracking-widest uppercase">
            Metodología de Trabajo
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Proceso estructurado de 5 pasos para garantizar el éxito del proyecto
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl font-black text-slate-700 group-hover:text-blue-400 transition-colors block mb-4">
                    {s.num}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{s.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
