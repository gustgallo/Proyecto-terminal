import React, { useState } from 'react';
import { Header } from '../../components/public/Header';
import { ValueProposition } from '../../components/public/ValueProposition';
import { WorkProcessTimeline } from '../../components/public/WorkProcessTimeline';
import { QuoteModal } from '../../components/public/QuoteModal';
import { Footer } from '../../components/public/Footer';

export const ServiciosPage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      <Header onOpenQuoteModal={() => setIsQuoteOpen(true)} />
      <main className="flex-1">
        <div className="py-16 bg-gradient-to-b from-slate-900 to-[#0a0e17] border-b border-slate-800 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-extrabold text-white">Servicios y Capacidades Integrales</h1>
            <p className="text-slate-400 mt-4">
              Diseño, fabricación, instalación, mantenimiento y conservación a nivel nacional.
            </p>
          </div>
        </div>
        <ValueProposition />
        <WorkProcessTimeline />
      </main>
      <Footer />
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
};
