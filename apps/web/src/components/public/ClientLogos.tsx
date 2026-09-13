import React from 'react';

interface Client {
  name: string;
  /*tag: string;*/
  logo: string;
}

export const ClientLogos: React.FC = () => {
  const clients: Client[] = [
    {
      name: 'BBVA México',
      /*tag: 'Banca & Servicios Financieros',*/
      logo: '/assets/BBVA-logo.webp',
    },
    {
      name: 'BANCOPPEL',
      /*tag: 'Banca & Servicios Financieros',*/
      logo: '/assets/logo_Bancopperl.webp',
    },
  ];

  return (
    <section className="py-12 bg-[#0d121f] border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
          Marcas y empresas líderes que confían en la capacidad de Prodisa
        </p>

        <div className="flex flex-wrap justify-center items-center gap-6">
          {clients.map((client, idx) => (
            <div
              key={idx}
              className="w-48 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-slate-800/60 transition-all duration-300 group cursor-default"
            >
              {/* Recuadro blanco para resaltar el logo con fondo transparente */}
              <div className="w-full h-20 bg-white rounded-lg p-3 flex items-center justify-center mb-4 shadow-sm">
                <img
                  src={client.logo}
                  alt={`Logo ${client.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Información del cliente */}
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors line-clamp-1">
                {client.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {client.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};