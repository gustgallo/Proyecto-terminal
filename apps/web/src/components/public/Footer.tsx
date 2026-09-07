import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#070a10] border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-prodisa.png"
              alt="PRODISA Logo"
              className="w-[47px] h-[47px] object-contain rounded-lg bg-black p-0.5 border border-slate-700/50"
            />
            <span className="text-lg font-bold text-white tracking-tight">PRODISA</span>
          </div>
          <p className="leading-relaxed">
            Comercializadora e Instalaciones Oriente Prodisa. Especialistas en diseño, fabricación, instalación y mantenimiento de señalización e imagen corporativa en México.
          </p>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">Navegación</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-blue-400">Inicio</Link></li>
            <li><Link to="/soluciones" className="hover:text-blue-400">Soluciones de Productos</Link></li>
            <li><Link to="/servicios" className="hover:text-blue-400">Capacidades Integrales</Link></li>
            <li><Link to="/proyectos" className="hover:text-blue-400">Portafolio de Proyectos</Link></li>
            <li><Link to="/nosotros" className="hover:text-blue-400">Sobre Prodisa</Link></li>
            <li><Link to="/contacto" className="hover:text-blue-400">Contacto & Cotizaciones</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">Contacto Comercial</h4>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-400" />
              <span>+52 (55) 5123 4567</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>ventas@prodisa.com.mx</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Tecamachalco La Paz Estado de México</span>
            </li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">Intranet Operativa</h4>
          <p className="text-[11px] leading-relaxed">
            Acceso restringido para personal interno, jefes de producción, mesa de control y RRHH.
          </p>
          <Link
            to="/intranet/login"
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium hover:border-blue-500 hover:text-white transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            Acceso SWGRHP-IG
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-6 text-center text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Comercializadora Prodisa. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Aviso de Privacidad</a>
            <a href="#" className="hover:text-slate-300">Términos de Servicio</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
