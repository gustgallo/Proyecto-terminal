import React, { useState } from 'react';
import { Header } from '../../components/public/Header';
import { QuoteModal } from '../../components/public/QuoteModal';
import { Footer } from '../../components/public/Footer';
import { Shield, Award, MapPin, Factory, Users } from 'lucide-react';

export const NosotrosPage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      <Header onOpenQuoteModal={() => setIsQuoteOpen(true)} />
      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl font-extrabold text-white">Sobre Comercializadora Prodisa</h1>
            <p className="text-slate-400 text-lg">
              Empresa mexicana especializada en la producción, montaje y mantenimiento de soluciones de imagen corporativa y señalización con cobertura en toda la República Mexicana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto">
                <Factory className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Infraestructura Propia</h3>
              <p className="text-slate-400 text-sm">
                Contamos con planta de producción equipada con CNC, thermoforming y equipos de soldadura y ensamble especializado.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Cobertura Nacional</h3>
              <p className="text-slate-400 text-sm">
                Cuadrillas de instalación capacitadas para desplegar proyectos simultáneos en los 32 estados del país.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Relación de Largo Plazo</h3>
              <p className="text-slate-400 text-sm">
                Brindamos esquemas de conservación continua para asegurar que la imagen de sus sucursales no se degrade.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
};
