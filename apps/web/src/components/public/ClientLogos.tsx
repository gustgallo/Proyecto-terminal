import React from 'react';

export const ClientLogos: React.FC = () => {
  const clients = [
    { name: 'BBVA México', tag: 'Banca & Servicios Financieros' },
    { name: 'Fibra Uno (FUNO)', tag: 'Centros Comerciales' },
    { name: 'Walmart de México', tag: 'Retail & Supermercados' },
    { name: 'Grupo Posadas', tag: 'Hotelería & Turismo' },
  ];

  return (
    <section className="py-12 bg-[#0d121f] border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
          Marcas y empresas líderes que confían en la capacidad de Prodisa
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
          {clients.map((client, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-slate-800/60 transition-all duration-300 group cursor-default"
            >
              <span className="text-base font-bold text-slate-300 group-hover:text-white transition-colors">
                {client.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">{client.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
