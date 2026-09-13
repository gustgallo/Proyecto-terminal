/**
 * ============================================================================
 * COMPONENTE: PÁGINA DE INICIO DE SESIÓN Y RECUPERACIÓN DE CONTRASEÑA
 * ============================================================================
 * Maneja la autenticación de usuarios de la Intranet PRODISA SWGRHP-IG y el
 * sistema de recuperación de clave vía correo institucional con contraseña temporal.
 * Protegido mediante Google reCAPTCHA v3.
 * 
 * Comentado en español para fácil comprensión de desarrolladores Junior.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { getRecaptchaToken } from '../../services/recaptcha';

export const LoginPage: React.FC = () => {
  // 1. ESTADOS PARA EL FORMULARIO DE INICIO DE SESIÓN
  // Inicialmente vacíos por seguridad (se removieron las credenciales demo pre-llenadas)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. ESTADOS PARA EL MODO DE RECUPERACIÓN DE CONTRASEÑA
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Maneja el envío del formulario de Login tradicional.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Obtenemos el token de seguridad de Google reCAPTCHA v3
      const recaptchaToken = await getRecaptchaToken('login');
      // 2. Enviamos las credenciales al backend PHP
      const response = await api.post('/auth/login', { email, password, recaptchaToken });
      const { token, user } = response.data;
      // 3. Guardamos el token y datos en la sesión y redirigimos a la intranet
      login(token, user);
      navigate('/intranet/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error de conexión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío de la solicitud de recuperación de contraseña temporal.
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError(null);
    setRecoverySuccess(null);

    try {
      // 1. Obtenemos el token de reCAPTCHA v3 para verificar la solicitud
      const recaptchaToken = await getRecaptchaToken('login');
      // 2. Enviamos el correo institucional a la API PHP
      const response = await api.post('/auth/forgot-password', {
        email: recoveryEmail,
        recaptchaToken,
      });
      // 3. Mostramos la respuesta de éxito devuelta por la API
      setRecoverySuccess(response.data.message || 'Se ha enviado una contraseña temporal a tu correo electrónico.');
    } catch (err: any) {
      setRecoveryError(err.response?.data?.error || err.message || 'No se pudo procesar la solicitud de recuperación.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  /**
   * Alterna a la vista de recuperación de contraseña.
   */
  const handleSwitchToForgot = () => {
    setIsForgotMode(true);
    setRecoveryEmail(email); // Pre-llena con el correo si el usuario ya lo había escrito
    setError(null);
    setRecoveryError(null);
    setRecoverySuccess(null);
  };

  /**
   * Regresa a la vista principal de Inicio de Sesión.
   */
  const handleSwitchToLogin = () => {
    setIsForgotMode(false);
    setError(null);
    setRecoveryError(null);
    setRecoverySuccess(null);
  };

  return (
    <div className="min-h-screen bg-[#070a10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo con iluminación ambiental decorativa */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[#0d121f] border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Logotipo y Encabezado de PRODISA */}
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

        {/* ==================================================================== */}
        {/* VISTA 1: RECUPERACIÓN DE CONTRASEÑA TEMPORAL                        */}
        {/* ==================================================================== */}
        {isForgotMode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400 border-b border-slate-800 pb-3">
              <KeyRound className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">Recuperar Contraseña</h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ingresa tu correo electrónico institucional. El sistema generará una <strong>contraseña temporal</strong> y te la enviará por correo.
            </p>

            {recoveryError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Solicitud Procesada
                  </div>
                  <p>{recoverySuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Correo Electrónico Institucional *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="usuario@prodisa.com.mx"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {recoveryLoading ? 'Generando clave temporal...' : 'Enviar Contraseña Temporal'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Cancelar y regresar al login
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ==================================================================== */
          /* VISTA 2: FORMULARIO DE INICIO DE SESIÓN TRADICIONAL                */
          /* ==================================================================== */
          <div className="space-y-4">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Contraseña</label>
                  <button
                    type="button"
                    onClick={handleSwitchToForgot}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? 'Verificando seguridad...' : 'Iniciar Sesión'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[10px] text-center text-slate-500 leading-relaxed pt-2">
              Acceso protegido con Google reCAPTCHA v3 y encriptación SSL.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
