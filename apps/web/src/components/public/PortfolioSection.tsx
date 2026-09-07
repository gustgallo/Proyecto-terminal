import React, { useState } from 'react';

export const PortfolioSection: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');

  const sectors = ['TODOS', 'Banca y Financiero', 'Retail y Comercial'];

  const projects = [
    {
      title: 'Renovación de Imagen BBVA México',
      sector: 'Banca y Financiero',
      client: 'BBVA México',
      solution: 'Tótems & Marquesinas LED',
      location: 'Sucursales Nacionales',
      img: '/assets/caja_luz_bbva.jpg',
    },
    {
      title: 'Logotipo en Fachada & Block Exterior',
      sector: 'Retail y Comercial',
      client: 'Fibra Uno',
      solution: 'Logo Block Tridimensional Exterior',
      location: 'Plaza Comercial Mitikah',
      img: '/assets/Producto Logo block exterior.png',
    },
    {
      title: 'Señalización Interior & Cajas de Luz',
      sector: 'Retail y Comercial',
      client: 'Walmart de México',
      solution: 'Señalización Corpórea & Cajas de Luz',
      location: 'México',
      img: '/assets/Producto letras de acrilico.png',
    },
    {
      title: 'Señalización de Protección Civil NOM',
      sector: 'Retail y Comercial',
      client: 'Grupo Posadas',
      solution: 'Protección Civil & Directorios NOM',
      location: 'México',
      img: '/assets/proteccion_civil.jpg',
    },
  ];

  const filteredProjects =
    selectedSector === 'TODOS'
      ? projects
      : projects.filter((p) => p.sector === selectedSector);

  return (
    <section className="py-16 bg-[#0a0e17] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                selectedSector === sec
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map((proj, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 group"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                <img
                  src={proj.img}
                  alt={proj.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-3 py-1 rounded-full text-[10px] font-semibold text-blue-300">
                  {proj.sector}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Cliente: <strong className="text-slate-200">{proj.client}</strong></span>
                  <span>{proj.location}</span>
                </div>
                <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {proj.title}
                </h4>
                <div className="inline-block bg-slate-800/80 px-3 py-1 rounded-md text-xs font-medium text-slate-300">
                  Solución: {proj.solution}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
