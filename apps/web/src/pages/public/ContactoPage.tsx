import React, { useState } from 'react';
import { Header } from '../../components/public/Header';
import { QuoteModal } from '../../components/public/QuoteModal';
import { Footer } from '../../components/public/Footer';
import { Phone, Mail, MapPin, Send, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { getRecaptchaToken } from '../../services/recaptcha';

export const ContactoPage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    projectDescription: '',
    privacyAccepted: true,
  });

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const recaptchaToken = await getRecaptchaToken('contact_quote');
      await api.post('/contact/quote', { ...formData, recaptchaToken });
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message || 'No fue posible enviar la cotización.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      <Header onOpenQuoteModal={() => setIsQuoteOpen(true)} />
      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Contacto Comercial</span>
              <h1 className="text-4xl font-extrabold text-white">Atención a Proyectos & Cotizaciones</h1>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Póngase en contacto con nuestro equipo comercial para recibir información técnica, cotizaciones o programar una visita a su proyecto.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Teléfonos de Atención</h4>
                  <p className="text-slate-400 text-xs mt-0.5">+52 (55) 5123 4567 | +52 (55) 5987 6543</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Correo Comercial</h4>
                  <p className="text-slate-400 text-xs mt-0.5">ventas@prodisa.com.mx</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Planta & Oficinas</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Tecamachalco La Paz Estado de México</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            {sent ? (
              <div className="py-12 text-center space-y-4">
                <h3 className="text-2xl font-bold text-white">¡Gracias por contactarnos!</h3>
                <p className="text-slate-400 text-sm">Hemos recibido su información y nos comunicaremos en menos de 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-6">Formulario Directo de Cotización</h3>
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-blue-500"
                      placeholder="Ej. Ing. Carlos Mendoza"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Empresa *</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-blue-500"
                      placeholder="Ej. Grupo Financiero X"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-blue-500"
                      placeholder="carlos@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-blue-500"
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Detalles del Proyecto</label>
                  <textarea
                    rows={4}
                    value={formData.projectDescription}
                    onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-blue-500"
                    placeholder="Describa requerimientos, cantidades o ubicaciones..."
                  />
                </div>

                <div className="text-[10px] text-center text-slate-500">
                  Formulario protegido con Google reCAPTCHA v3.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Enviando...' : 'Enviar Cotización'}
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
};
