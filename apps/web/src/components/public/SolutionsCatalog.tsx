import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SolutionsCatalogProps {
  onSelectSolutionForQuote?: (solutionName: string) => void;
}

export const SolutionsCatalog: React.FC<SolutionsCatalogProps> = ({ onSelectSolutionForQuote }) => {
  const solutions = [
    {
      name: 'Marquesinas',
      category: 'Exterior',
      desc: 'Marquesinas y frentes comerciales en bastidor de aluminio, acrílico termoformado e iluminación LED.',
      img: '/assets/producto marquesinas.png',
    },
    {
      name: 'Totem de posicionamiento de marca',
      category: 'Exterior Monumental',
      desc: 'Estructuras de alto impacto visual diseñadas para visibilidad lejana en avenidas y accesos principales.',
      img: '/assets/Totem_comerciales.webp',
    },
    {
      name: 'Posicionamiento de marca',
      category: 'Branding 3D',
      desc: 'Logotipos corpóreos volumétricos en acrílico, metal o retroiluminados para impacto de marca.',
      img: '/assets/Producto acrilico Negro iluminado.png',
    },
    {
      name: 'Señalización interior',
      category: 'Directorios',
      desc: 'Sistemas de orientación, placas de directorio, módulos informativos y señalización corporativa.',
      img: '/assets/senalizacion_interna_pcivil.webp',
    },
    {
      name: 'Señalización de protección civil',
      category: 'Normativa NOM',
      desc: 'Elementos fotoluminiscentes y normativos conforme a normas mexicanas para rutas de evacuación.',
      img: '/assets/proteccion_civil.jpg',
    },
    {
      name: 'Cajas de luz interior',
      category: 'Iluminación Interior',
      desc: 'Cajas de luz ultra-delgadas con marcos de precisión e iluminación LED uniforme de bajo consumo.',
      img: '/assets/cajas_luz_textil.jpg',
    },
    {
      name: 'Cajas de luz exterior',
      category: 'Iluminación Exterior',
      desc: 'Cajas de luz resistentes a la intemperie en pánel compuesto de aluminio con gráficos de alta definición.',
      img: '/assets/porductos caja de luz panel de aluminio.png',
    },
    {
      name: 'Paneles de Comunicación y Exhibición',
      category: 'División de Espacios',
      desc: 'Mamparas modulares en MDF con portapóster acrílico integrado, diseñadas para señalización, atención al cliente y áreas corporativas.',
      img: '/assets/Producto panel portaposter.png',
    },
    {
      name: 'Conservación de Áreas Comerciales',
      category: 'Mantenimiento',
      desc: 'Mantenimiento preventivo, acabados y acondicionamiento integral de espacios corporativos y puntos de venta.',
      img: '/assets/conservacion.webp',
    },
        {
      name: 'Marcos Luminosos LED',
      category: 'Señalización Iluminada',
      desc: 'Estructuras slim de aluminio con iluminación LED perimetral de alta difusión para gráficos intercambiables y publicidad interior.',
      img: '/assets/portaposter_luminoso1.webp',
    },
    {
      name: 'Señalización Braille y Accesibilidad',
      category: 'Señalización Arquitectónica',
      desc: 'Placas táctiles con sistema Braille y texto en alto relieve, fabricadas bajo normas de accesibilidad universal para interiores corporativos y públicos.',
      img: '/assets/señalizacion_braile.webp',
    },
        {
      name: 'Ingeniería y Desarrollo de Proyectos',
      category: 'Servicios Técnicos',
      desc: 'Levantamiento técnico, cálculo estructural, desarrollo de planos de despiece y optimización de materiales para fabricación e instalación en obra.',
      img: '/assets/Ingenieria.webp',
    },
  ];

  return (
    <section id="soluciones" className="py-24 bg-[#0d121f] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-2">
              Productos
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Solucion de Productos
            </h3>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            Fabricación propia con materiales de calidad industrial diseñados para máxima durabilidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {solutions.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/60 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-3 py-1 rounded-full text-[10px] font-semibold text-blue-300">
                  {item.category}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">{item.desc}</p>
                </div>

                {onSelectSolutionForQuote && (
                  <button
                    onClick={() => onSelectSolutionForQuote(item.name)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 pt-2 transition-colors"
                  >
                    Cotizar este producto
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
