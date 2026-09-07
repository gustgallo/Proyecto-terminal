import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { getRecaptchaToken } from '../../services/recaptcha';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@prodisa.com.mx');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const recaptchaToken = await getRecaptchaToken('login');
      const response = await api.post('/auth/login', { email, password, recaptchaToken });
      const { token, user } = response.data;
      login(token, user);
      navigate('/intranet/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error de conexión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin123!');
  };

  return (
    <div className="min-h-screen bg-[#070a10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[#0d121f] border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Logo Header */}
        <div className="text-center space-y-3">
          <img
            src="/assets/logo-prodisa.png"
            alt="PRODISA Logo"
            className="w-[83px] h-[83px] object-contain rounded-2xl mx-auto bg-black p-1 border border-slate-700/60 shadow-xl shadow-blue-500/20"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">Acceso Personal SWGRHP-IG</h1>
          <p className="text-xs text-slate-400">
            Comercializadora e Instalaciones Oriente Prodisa
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Correo Institucional</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="usuario@prodisa.com.mx"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? 'Verificando seguridad...' : 'Iniciar Sesión'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-500 leading-relaxed">
          Acceso protegido con Google reCAPTCHA v3.
        </p>

        {/* Demo Accounts Selector for Testing */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">
            Cuentas Demo para Pruebas de Roles (Password: Admin123!)
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setDemoAccount('admin@prodisa.com.mx')}
              className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-300 text-left truncate"
            >
              <strong className="block text-white">Admin Global</strong>
              admin@prodisa.com.mx
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('rrhh@prodisa.com.mx')}
              className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-300 text-left truncate"
            >
              <strong className="block text-white">Recursos Humanos</strong>
              rrhh@prodisa.com.mx
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('produccion@prodisa.com.mx')}
              className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-300 text-left truncate"
            >
              <strong className="block text-white">Producción (Jefe)</strong>
              produccion@prodisa.com.mx
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('mesacontrol@prodisa.com.mx')}
              className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-300 text-left truncate"
            >
              <strong className="block text-white">Mesa de Control</strong>
              mesacontrol@prodisa.com.mx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
