import React, { useState } from 'react';
import { Bot, Send, User as UserIcon, Sparkles, FileText } from 'lucide-react';
import api from '../../services/api';

export const ChatbotModule: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'USER' | 'BOT'; content: string }>>([
    {
      sender: 'BOT',
      content: '¡Hola! Soy el Asistente Virtual Inteligente de Recursos Humanos de Prodisa (impulsado por Google Gemini API & RAG). ¿En qué puedo ayudarte hoy sobre políticas, vacaciones u horas extras?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'USER', content: userQuery }]);
    setLoading(true);

    try {
      const response = await api.post('/chat/query', { message: userQuery });
      const botReply = response.data.botResponse?.content || 'No se obtuvo respuesta del bot.';
      setMessages((prev) => [...prev, { sender: 'BOT', content: botReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'BOT',
          content: 'No pude conectarme con el servidor de IA. Por favor verifica tu conexión o intenta más tarde.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    '¿Cuál es el procedimiento para solicitar horas extras?',
    '¿Cuántos días de vacaciones me corresponden?',
    '¿Qué materiales se requieren para requisiciones de marquesinas?',
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Asistente RRHH Prodisa</h2>
              <span className="inline-flex items-center gap-1 bg-blue-950 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-800/40">
                <Sparkles className="w-3 h-3" />
                Gemini RAG AI
              </span>
            </div>
            <p className="text-slate-400 text-xs">Entrenado sobre reglamentos y políticas internas de Prodisa</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'USER' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                m.sender === 'USER'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-blue-400'
              }`}
            >
              {m.sender === 'USER' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'USER'
                  ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
              }`}
            >
              <p>{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs animate-pulse">
            <Bot className="w-4 h-4 text-blue-400" />
            <span>Consultando documentos RAG y generando respuesta con Gemini...</span>
          </div>
        )}
      </div>

      {/* Preset sample prompt suggestions */}
      <div className="px-6 py-2 bg-slate-950/60 border-t border-slate-800/60 flex flex-wrap gap-2">
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => setInput(q)}
            className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-800 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta sobre políticas, vacaciones, horas extras..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs"
        >
          Enviar
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
