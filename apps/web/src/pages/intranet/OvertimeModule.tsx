import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Plus, CheckCircle, XCircle, AlertCircle, Edit3, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import api from '../../services/api';

export const OvertimeModule: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total_requested_hours: '0',
    total_approved_hours: '0',
    total_rejected_hours: '0',
    total_pending_hours: '0',
  });
  const [loading, setLoading] = useState(true);

  // Modal de Solicitud de Empleado
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    startDateTime: '',
    endDateTime: '',
    projectId: 1,
    justification: '',
  });
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  // Modal de Aprobación/Modificación de Jefe / RRHH
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [approvalData, setApprovalData] = useState({
    approvedHoursCount: 0,
    notes: '',
    step: 'AREA', // 'AREA' o 'RRHH'
  });

  const isSupervisorOrRRHH =
    user?.roleCode === 'ADMIN_GLOBAL' ||
    user?.roleCode === 'ADMIN_RRHH' ||
    user?.roleCode === 'PRODUCCION' ||
    user?.roleCode === 'MESA_CONTROL';

  const fetchData = async () => {
    try {
      const [overtimeRes, projectsRes] = await Promise.all([
        api.get('/overtime'),
        api.get('/projects'),
      ]);
      setRecords(overtimeRes.data.records || []);
      if (overtimeRes.data.dashboardStats) {
        setStats(overtimeRes.data.dashboardStats);
      }
      setProjects(projectsRes.data.projects || []);
    } catch (err) {
      console.error('Error al cargar horas extras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (end > start) {
        const diffMs = end.getTime() - start.getTime();
        const hrs = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        setCalculatedHours(hrs);
      } else {
        setCalculatedHours(null);
      }
    } else {
      setCalculatedHours(null);
    }
  }, [formData.startDateTime, formData.endDateTime]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculatedHours || calculatedHours <= 0) {
      alert('La fecha y hora de fin debe ser posterior a la de inicio.');
      return;
    }

    try {
      await api.post('/overtime', formData);
      setShowRequestModal(false);
      setFormData({
        startDateTime: '',
        endDateTime: '',
        projectId: projects[0]?.id || 1,
        justification: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar');
    }
  };

  const openApprovalModal = (record: any, step: 'AREA' | 'RRHH') => {
    setSelectedRecord(record);
    setApprovalData({
      approvedHoursCount: record.approved_hours_count || record.hours_count,
      notes: step === 'AREA' ? record.area_boss_notes || 'Revisado y verificado en sitio.' : record.rrhh_notes || 'Autorizado para pago en nómina.',
      step,
    });
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      if (approvalData.step === 'AREA') {
        await api.patch(`/overtime/${selectedRecord.id}/approve-area`, {
          approvedHoursCount: approvalData.approvedHoursCount,
          areaNotes: approvalData.notes,
        });
      } else {
        await api.patch(`/overtime/${selectedRecord.id}/approve-rrhh`, {
          approvedHoursCount: approvalData.approvedHoursCount,
          rrhhNotes: approvalData.notes,
        });
      }
      setShowApprovalModal(false);
      setSelectedRecord(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al procesar la aprobación');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    try {
      await api.patch(`/overtime/${id}/reject`, { rejectionReason: reason });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al rechazar');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDIENTE_JEFE':
        return <span className="px-2.5 py-1 rounded font-semibold text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">Paso 1: Pendiente Jefe Directo</span>;
      case 'PENDIENTE_RRHH':
        return <span className="px-2.5 py-1 rounded font-semibold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">Paso 2: Pendiente RRHH</span>;
      case 'APROBADO':
        return <span className="px-2.5 py-1 rounded font-semibold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Aprobado Totalmente</span>;
      case 'RECHAZADO':
        return <span className="px-2.5 py-1 rounded font-semibold text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">✕ Rechazado</span>;
      default:
        return <span className="px-2.5 py-1 rounded font-semibold text-[10px] bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isSupervisorOrRRHH ? 'Concentrado General de Horas Extras' : 'Dashboard de Horas Extras'}
            </h1>
            {isSupervisorOrRRHH && (
              <span className="bg-blue-950 text-blue-400 border border-blue-800/40 text-[10px] font-bold px-2 py-0.5 rounded">
                Vista de Supervisión
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {isSupervisorOrRRHH
              ? 'Concentrado total de horas de todos los empleados con capacidad de modificar horas aprobadas y notificar por campanita.'
              : 'Registro con inicio/fin, consulta de estatus e historial con comentarios del jefe y RRHH.'}
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Registrar Horas Extras
        </button>
      </div>

      {/* KPI Cards: Concentrado o Empleado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {isSupervisorOrRRHH ? 'Horas Totales Concentradas' : 'Mis Horas Solicitadas'}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">
              {parseFloat(stats.total_requested_hours).toFixed(1)} <span className="text-xs text-slate-400 font-normal">hrs</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            Horas Autorizadas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-400">
              {parseFloat(stats.total_approved_hours).toFixed(1)} <span className="text-xs text-slate-400 font-normal">hrs</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
            Horas Pendientes
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-400">
              {parseFloat(stats.total_pending_hours).toFixed(1)} <span className="text-xs text-slate-400 font-normal">hrs</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider block">
            Horas Rechazadas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-red-400">
              {parseFloat(stats.total_rejected_hours).toFixed(1)} <span className="text-xs text-slate-400 font-normal">hrs</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla del Concentrado General / Historial */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            {isSupervisorOrRRHH ? 'Concentrado de Todos los Empleados' : 'Historial Personal de Horas Extras'}
          </h2>
          <span className="text-xs text-slate-400">{records.length} Registro(s)</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-slate-300 min-w-[950px]">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Empleado / Depto</th>
                <th className="p-4">Proyecto</th>
                <th className="p-4">Fecha/Hora Inicio ➔ Fin</th>
                <th className="p-4">Solicitadas vs Aprobadas</th>
                <th className="p-4">Justificación</th>
                <th className="p-4">Estatus</th>
                <th className="p-4">Comentarios Jefe Directo</th>
                <th className="p-4">Comentarios RRHH</th>
                <th className="p-4 text-right">Acciones de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">Cargando registros...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">No hay registros.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {r.employee_name || 'Empleado'}
                      <span className="block text-[10px] text-slate-400 font-normal">{r.department || 'Producción'}</span>
                    </td>
                    <td className="p-4 font-medium text-slate-200">
                      {r.project_name ? `${r.project_name}` : 'General'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="block font-medium text-slate-200">
                        {r.start_date_time ? new Date(r.start_date_time).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : r.work_date}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        hasta {r.end_date_time ? new Date(r.end_date_time).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-bold text-slate-300 block">Solicitadas: {r.hours_count} hrs</span>
                      {r.approved_hours_count !== null && (
                        <span className="font-extrabold text-emerald-400 block text-[11px]">
                          Aprobadas: {r.approved_hours_count} hrs
                        </span>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">{r.justification}</td>
                    <td className="p-4 whitespace-nowrap">{getStatusBadge(r.status)}</td>

                    {/* Comentario Jefe */}
                    <td className="p-4 text-slate-300">
                      {r.area_boss_notes ? (
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px]">
                          <span className="font-bold text-amber-400 block text-[9px] uppercase">
                            Jefe: {r.area_boss_name || 'Producción'}
                          </span>
                          {r.area_boss_notes}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Sin comentarios aún</span>
                      )}
                    </td>

                    {/* Comentario RRHH */}
                    <td className="p-4 text-slate-300">
                      {r.rrhh_notes ? (
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px]">
                          <span className="font-bold text-emerald-400 block text-[9px] uppercase">
                            RRHH: {r.rrhh_name || 'Recursos Humanos'}
                          </span>
                          {r.rrhh_notes}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Sin comentarios aún</span>
                      )}
                    </td>

                    {/* Botones de Aprobación & Modificación de Tiempos */}
                    <td className="p-4 text-right space-y-1.5 whitespace-nowrap">
                      {r.status === 'PENDIENTE_JEFE' && (user?.roleCode === 'PRODUCCION' || user?.roleCode === 'ADMIN_GLOBAL') && (
                        <button
                          onClick={() => openApprovalModal(r, 'AREA')}
                          className="w-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white px-3 py-1.5 rounded text-[11px] font-bold border border-amber-500/40 transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Aprobar / Modificar (Paso 1)
                        </button>
                      )}

                      {(r.status === 'PENDIENTE_RRHH' || (r.status === 'PENDIENTE_JEFE' && user?.roleCode === 'ADMIN_GLOBAL')) &&
                        (user?.roleCode === 'ADMIN_RRHH' || user?.roleCode === 'ADMIN_GLOBAL') && (
                          <button
                            onClick={() => openApprovalModal(r, 'RRHH')}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow transition-colors flex items-center justify-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Autorizar RRHH (Final)
                          </button>
                        )}

                      {(r.status === 'PENDIENTE_JEFE' || r.status === 'PENDIENTE_RRHH') &&
                        (user?.roleCode === 'ADMIN_GLOBAL' || user?.roleCode === 'ADMIN_RRHH' || user?.roleCode === 'PRODUCCION') && (
                          <button
                            onClick={() => handleReject(r.id)}
                            className="w-full bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-[11px] font-medium border border-red-500/30 transition-colors"
                          >
                            Rechazar
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Solicitud de Empleado */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d121f] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">Solicitar Horas Extras</h3>
                <p className="text-slate-400 text-xs mt-0.5">Ingresa fecha/hora inicio y fin.</p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Proyecto Asignado *</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} ({p.client_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fecha y Hora Inicial *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fecha y Hora Final *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>

              {calculatedHours !== null && (
                <div className="p-3 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Total de horas calculadas:</span>
                  <span className="font-extrabold text-blue-400 text-sm">{calculatedHours} horas</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Motivo / Justificación *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  placeholder="Detalla las actividades operativas ejecutadas..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  Enviar a Revisión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aprobación & Modificación de Tiempos por el Jefe / RRHH */}
      {showApprovalModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d121f] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {approvalData.step === 'AREA' ? 'Aprobación / Modificación por Jefe Directo' : 'Autorización Final por RRHH'}
                </h3>
                <p className="text-xs text-slate-400">Empleado: {selectedRecord.employee_name}</p>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitApproval} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Horas solicitadas originalmente:</span>
                  <span className="font-bold text-white">{selectedRecord.hours_count} hrs</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <span>Justificación: </span>
                  <span className="text-slate-200 italic">{selectedRecord.justification}</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Horas Autorizadas a Pagar (Modificable por Supervisor) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  max="24"
                  value={approvalData.approvedHoursCount}
                  onChange={(e) => setApprovalData({ ...approvalData, approvedHoursCount: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Si modificas las horas, el empleado recibirá una notificación de aviso en la campanita.
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Comentarios / Observaciones de Aprobación *
                </label>
                <textarea
                  rows={3}
                  required
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  placeholder="Escribe comentarios u observaciones sobre el trabajo realizado..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/30"
                >
                  Confirmar & Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
