import React, { useState } from 'react';
import { Header } from '../../components/public/Header';
import { SolutionsCatalog } from '../../components/public/SolutionsCatalog';
import { QuoteModal } from '../../components/public/QuoteModal';
import { Footer } from '../../components/public/Footer';

export const SolucionesPage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<string | undefined>();

  const handleOpenQuote = (sol?: string) => {
    setSelectedSolution(sol);
    setIsQuoteOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      <Header onOpenQuoteModal={() => handleOpenQuote()} />
      <main className="flex-1">
        <div className="py-16 bg-gradient-to-b from-slate-900 to-[#0a0e17] border-b border-slate-800 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-extrabold text-white">Soluciones y Productos de Imagen Corporativa</h1>
            <p className="text-slate-400 mt-4">
              Fabricación de alta durabilidad en marquesinas, tótems, cajas de luz y señalización industrial en México.
            </p>
          </div>
        </div>
        <SolutionsCatalog onSelectSolutionForQuote={(sol) => handleOpenQuote(sol)} />
      </main>
      <Footer />
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} preselectedSolution={selectedSolution} />
    </div>
  );
};
