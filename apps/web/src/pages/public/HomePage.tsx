import React, { useState } from 'react';
import { Header } from '../../components/public/Header';
import { Hero } from '../../components/public/Hero';
import { ClientLogos } from '../../components/public/ClientLogos';
import { StickyStorytelling } from '../../components/public/StickyStorytelling';
import { HotspotsSection } from '../../components/public/HotspotsSection';
import { BeforeAfterSection } from '../../components/public/BeforeAfterSection';
import { ValueProposition } from '../../components/public/ValueProposition';
import { SolutionsCatalog } from '../../components/public/SolutionsCatalog';
import { PortfolioSection } from '../../components/public/PortfolioSection';
import { WorkProcessTimeline } from '../../components/public/WorkProcessTimeline';
import { QuoteModal } from '../../components/public/QuoteModal';
import { Footer } from '../../components/public/Footer';

export const HomePage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<string | undefined>();

  const handleOpenQuote = (solution?: string) => {
    setSelectedSolution(solution);
    setIsQuoteOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <Header onOpenQuoteModal={() => handleOpenQuote()} />
      <main className="flex-1">
        {/* 1. Hero Fullscreen 100vh Cinemático estilo Lamborghini / Mercedes */}
        <Hero onOpenQuoteModal={() => handleOpenQuote()} />

        {/* 2. Marcas Atendidas */}
        <ClientLogos />

        {/* 3. Sticky Storytelling del Proceso de Fabricación CNC -> Luz */}
        <StickyStorytelling />

        {/* 4. Hotspots Interactivos sobre Macro-Fotografía */}
        <HotspotsSection />

        {/* 5. Slider Interactivo Antes y Después de Renovación */}
        <BeforeAfterSection />

        {/* 6. Los 5 Servicios Integrales Prodisa */}
        <ValueProposition />

        {/* 7. Catálogo Oficial de los 8 Productos */}
        <SolutionsCatalog onSelectSolutionForQuote={(sol) => handleOpenQuote(sol)} />

        {/* 8. Proyectos por Sector */}
        <PortfolioSection />

        {/* 9. Metodología en 5 Pasos */}
        <WorkProcessTimeline />
      </main>
      <Footer />
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        preselectedSolution={selectedSolution}
      />
    </div>
  );
};
