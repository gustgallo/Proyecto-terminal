/**
 * Asistente RRHH Prodisa
 *
 * La conversación está disponible para todo el personal. La administración de
 * fuentes documentales solo se renderiza dentro de este módulo y únicamente
 * para ADMIN_GLOBAL / ADMIN_RRHH.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  CheckCircle,
  ClipboardPaste,
  FileCheck2,
  FileText,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User as UserIcon,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface RagDoc {
  id: number;
  title: string;
  category: string;
  chunks_count: number;
  uploader_name?: string;
  created_at: string;
}

interface ChatMessage {
  sender: 'USER' | 'BOT';
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  sender: 'BOT',
  content:
    'Hola. Puedo orientarte sobre las políticas y procedimientos de Recursos Humanos que están documentados en Prodisa. ¿Qué necesitas consultar?',
};

const CONVERSATION_STORAGE_KEY = 'prodisa_rrhh_conversation_id';

export const ChatbotModule: React.FC = () => {
  const { user } = useAuth();
  const isRRHHOrAdmin = user?.roleCode === 'ADMIN_GLOBAL' || user?.roleCode === 'ADMIN_RRHH';

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [ragDocs, setRagDocs] = useState<RagDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Políticas Institucionales',
    content: '',
  });
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docSuccess, setDocSuccess] = useState<string | null>(null);
  const [docInputMode, setDocInputMode] = useState<'file' | 'text'>('file');
  const [selectedFileName, setSelectedFileName] = useState('');
  const docFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchRagDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await api.get('/chat/rag/documents');
      setRagDocs(response.data.documents || []);
    } catch (err) {
      console.error('Error al cargar documentación de RRHH:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (isRRHHOrAdmin) {
      fetchRagDocuments();
    }
  }, [isRRHHOrAdmin]);

  /** Recupera la conversación de esta sesión para conservar continuidad. */
  useEffect(() => {
    const storedId = Number(sessionStorage.getItem(CONVERSATION_STORAGE_KEY) || 0);
    if (!storedId) return;

    let cancelled = false;
    const restoreConversation = async () => {
      try {
        const response = await api.get(`/chat/history/${storedId}`);
        if (cancelled) return;

        const history = (response.data.messages || [])
          .filter((item: any) => item?.sender === 'USER' || item?.sender === 'BOT')
          .map((item: any) => ({ sender: item.sender, content: String(item.content || '') })) as ChatMessage[];

        setConversationId(storedId);
        setMessages(history.length > 0 ? history : [WELCOME_MESSAGE]);
      } catch {
        sessionStorage.removeItem(CONVERSATION_STORAGE_KEY);
        if (!cancelled) {
          setConversationId(null);
          setMessages([WELCOME_MESSAGE]);
        }
      }
    };

    restoreConversation();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewConversation = () => {
    sessionStorage.removeItem(CONVERSATION_STORAGE_KEY);
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  const closeDocumentModal = () => {
    setShowAddDocModal(false);
    setDocError(null);
    setDocSuccess(null);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim() || !docForm.content.trim()) return;

    setDocLoading(true);
    setDocError(null);
    setDocSuccess(null);

    try {
      await api.post('/chat/rag/documents', {
        title: docForm.title.trim(),
        category: docForm.category,
        content: docForm.content.trim(),
      });
      setDocSuccess('Documento incorporado. Ya puede utilizarse como fuente del asistente.');
      setDocForm({ title: '', category: 'Políticas Institucionales', content: '' });
      setSelectedFileName('');
      await fetchRagDocuments();
      window.setTimeout(closeDocumentModal, 900);
    } catch (err: any) {
      setDocError(err.response?.data?.error || 'No fue posible incorporar el documento.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDocument = async (id: number, title: string) => {
    if (!confirm(`¿Deseas eliminar "${title}"? El asistente dejará de utilizar ese contenido.`)) return;

    try {
      await api.delete(`/chat/rag/documents/${id}`);
      await fetchRagDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'No fue posible eliminar el documento.');
    }
  };

  const handleFileSelection = async (file?: File) => {
    if (!file) return;

    setDocError(null);
    setSelectedFileName(file.name);

    const lowerName = file.name.toLowerCase();
    const isPlainText = file.type === 'text/plain' || lowerName.endsWith('.txt') || lowerName.endsWith('.md');
    if (!isPlainText) {
      setDocForm((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^.]+$/, ''),
        content: '',
      }));
      setDocError(
        'Para asegurar que el asistente lea el contenido real, esta versión incorpora archivos TXT o MD. Para PDF o DOCX, extrae el texto y usa la opción “Pegar texto”.'
      );
      return;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        setDocError('El archivo no contiene texto legible.');
        return;
      }
      setDocForm((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^.]+$/, ''),
        content: text,
      }));
    } catch {
      setDocError('No fue posible leer el archivo seleccionado.');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'USER', content: userQuery }]);
    setLoading(true);

    try {
      const response = await api.post('/chat/query', {
        message: userQuery,
        ...(conversationId ? { conversationId } : {}),
      });

      const returnedConversationId = Number(response.data.conversationId || 0);
      if (returnedConversationId) {
        setConversationId(returnedConversationId);
        sessionStorage.setItem(CONVERSATION_STORAGE_KEY, String(returnedConversationId));
      }

      const botReply = String(
        response.data.botResponse?.content ||
          'No pude generar una respuesta con la información disponible. Intenta formular la pregunta de otra manera.'
      );
      setMessages((prev) => [...prev, { sender: 'BOT', content: botReply }]);
    } catch (err: any) {
      const apiMessage = err.response?.data?.error;
      setMessages((prev) => [
        ...prev,
        {
          sender: 'BOT',
          content: apiMessage || 'No pude procesar tu consulta en este momento. Intenta nuevamente en unos minutos.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    '¿Con cuánta anticipación debo solicitar vacaciones?',
    '¿Cómo se autorizan las vacaciones?',
    '¿Con quién reviso mi saldo de vacaciones?',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" /> Asistente RRHH Prodisa
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Consulta políticas, reglamentos y procedimientos internos de Recursos Humanos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={startNewConversation}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
            title="Iniciar una conversación nueva"
          >
            <RotateCcw className="w-4 h-4" /> Nueva conversación
          </button>

          {isRRHHOrAdmin && (
            <button
              type="button"
              onClick={() => setShowAddDocModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Añadir fuente
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)] min-h-[580px]">
        {isRRHHOrAdmin && (
          <aside className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Documentación de RRHH</h2>
              </div>
              <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded font-bold">
                {ragDocs.length} fuente(s)
              </span>
            </div>

            <div className="p-3 bg-slate-900/50 border-b border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              Estas son las fuentes que el asistente puede consultar. Solo administradores y RRHH pueden modificarlas.
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingDocs ? (
                <div className="p-6 text-center text-xs text-slate-500">Cargando documentación...</div>
              ) : ragDocs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">Todavía no hay documentación incorporada.</div>
              ) : (
                ragDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
                        <h3 className="font-bold text-xs text-white leading-snug break-words">{doc.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition-colors shrink-0"
                        title="Eliminar fuente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 pt-1">
                      <span className="bg-slate-900 px-2 py-0.5 rounded text-blue-400 font-semibold border border-slate-800 truncate">
                        {doc.category}
                      </span>
                      <span className="shrink-0">{doc.chunks_count} secciones</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        <section
          className={`${isRRHHOrAdmin ? 'lg:col-span-8' : 'lg:col-span-12'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl`}
        >
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Asistente de Recursos Humanos</h2>
                <p className="text-slate-400 text-[11px]">
                  Responde con base en información institucional y evita completar datos no documentados.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`flex items-start gap-3 ${message.sender === 'USER' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    message.sender === 'USER'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-blue-400'
                  }`}
                >
                  {message.sender === 'USER' ? (
                    <UserIcon className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                </div>

                <div
                  className={`max-w-2xl rounded-2xl p-3.5 text-xs leading-relaxed ${
                    message.sender === 'USER'
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-slate-400 text-xs animate-pulse p-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <span>Revisando la documentación disponible...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-5 py-2 bg-slate-950/60 border-t border-slate-800/60 flex flex-wrap gap-2">
            {sampleQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => setInput(question)}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-800 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta sobre vacaciones, permisos, horas extras..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs disabled:cursor-not-allowed"
            >
              Enviar <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>

      {/* Este componente existe únicamente dentro de Asistente RRHH Prodisa. */}
      {isRRHHOrAdmin && showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d121f] border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Añadir fuente de RRHH</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                      Incorpora una política, reglamento o procedimiento. Revisa el texto antes de guardarlo, porque será la fuente que utilizará el asistente.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDocumentModal}
                  className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                Si el contenido no respalda una respuesta, el asistente debe indicarlo en lugar de completar información por su cuenta.
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {docError && (
                <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> {docError}
                </div>
              )}
              {docSuccess && (
                <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {docSuccess}
                </div>
              )}

              <form onSubmit={handleAddDocument} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1.5">Nombre de la fuente *</label>
                    <input
                      type="text"
                      required
                      value={docForm.title}
                      onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ej. Política de Vacaciones 2026"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1.5">Categoría *</label>
                    <select
                      value={docForm.category}
                      onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Políticas Institucionales">Políticas Institucionales</option>
                      <option value="Reglamento Interior">Reglamento Interior</option>
                      <option value="Horas Extras y Nómina">Horas Extras y Nómina</option>
                      <option value="Vacaciones y Permisos">Vacaciones y Permisos</option>
                      <option value="Procedimientos Operativos">Procedimientos Operativos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setDocInputMode('file');
                      setDocError(null);
                    }}
                    className={`py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      docInputMode === 'file'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" /> Cargar TXT o MD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocInputMode('text');
                      setDocError(null);
                    }}
                    className={`py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      docInputMode === 'text'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ClipboardPaste className="w-4 h-4" /> Pegar texto
                  </button>
                </div>

                {docInputMode === 'file' && (
                  <div>
                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      className="hidden"
                      onChange={(e) => handleFileSelection(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="w-full min-h-36 border border-dashed border-slate-600 hover:border-blue-500 bg-slate-950/60 hover:bg-blue-950/10 rounded-2xl flex flex-col items-center justify-center gap-2.5 px-5 py-6 transition-colors"
                    >
                      {selectedFileName && docForm.content ? (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center">
                            <FileCheck2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <span className="text-sm font-semibold text-white">{selectedFileName}</span>
                          <span className="text-[11px] text-slate-400">Texto leído correctamente. Haz clic para reemplazarlo.</span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                            <UploadCloud className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className="text-sm font-semibold text-white">Seleccionar archivo</span>
                          <span className="text-[11px] text-slate-400 text-center">
                            TXT o MD. Para PDF y DOCX utiliza “Pegar texto” después de extraer su contenido.
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <label className="block font-medium text-slate-300">Contenido que podrá consultar el asistente *</label>
                    <span className="text-[10px] text-slate-500">
                      {docForm.content.length.toLocaleString('es-MX')} caracteres
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    required
                    value={docForm.content}
                    onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-xs leading-relaxed text-white focus:outline-none focus:border-blue-500 resize-y"
                    placeholder="Pega aquí el texto completo y revisa que títulos, plazos, responsables y condiciones sean legibles..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    El sistema separará el texto por secciones para mejorar la recuperación de información. No incorpores documentos incompletos o solo nombres de archivo.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={closeDocumentModal}
                    className="sm:min-w-28 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={docLoading || !docForm.title.trim() || docForm.content.trim().length < 10}
                    className="sm:min-w-44 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2.5 px-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed transition-colors"
                  >
                    {docLoading ? 'Guardando...' : 'Guardar fuente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotModule;
