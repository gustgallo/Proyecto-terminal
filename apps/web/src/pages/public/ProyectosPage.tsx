import React, { useState } from 'react';
import { Header } from '../../components/public/Header';
import { PortfolioSection } from '../../components/public/PortfolioSection';
import { QuoteModal } from '../../components/public/QuoteModal';
import { Footer } from '../../components/public/Footer';

export const ProyectosPage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      <Header onOpenQuoteModal={() => setIsQuoteOpen(true)} />
      <main className="flex-1">
        <div className="py-12 bg-gradient-to-b from-slate-900 to-[#0a0e17] border-b border-slate-800 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-extrabold text-white">Proyectos</h1>
          </div>
        </div>
        <PortfolioSection />
      </main>
      <Footer />
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
};
