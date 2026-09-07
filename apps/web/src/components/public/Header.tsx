import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Menu, X, ArrowRight } from 'lucide-react';

interface HeaderProps {
  onOpenQuoteModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuoteModal }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Soluciones', path: '/soluciones' },
    { name: 'Servicios', path: '/servicios' },
    { name: 'Proyectos', path: '/proyectos' },
    { name: 'Nosotros', path: '/nosotros' },
    { name: 'Contacto', path: '/contacto' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0e17]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/assets/logo-prodisa.png"
            alt="PRODISA Logo"
            className="w-[52px] h-[52px] object-contain rounded-xl shadow-lg shadow-blue-500/20 border border-slate-700/50 group-hover:scale-105 transition-transform bg-black p-0.5"
          />
          <div>
            <span className="text-xl font-bold tracking-tight text-white block leading-none">
              PRODISA
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase block mt-1">
              Comercializadora e Instalaciones
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive(link.path)
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/intranet/login"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            Acceso Personal
          </Link>

          <button
            onClick={onOpenQuoteModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            Solicitar Cotización
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0d121f] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.path)
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenQuoteModal();
              }}
              className="w-full text-center bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow"
            >
              Solicitar Cotización B2B
            </button>
            <Link
              to="/intranet/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center text-slate-300 bg-slate-800 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-blue-400" />
              Acceso Personal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
