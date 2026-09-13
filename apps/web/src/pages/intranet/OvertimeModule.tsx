/**
 * ============================================================================
 * MÓDULO DE GESTIÓN Y AUTORIZACIÓN DE HORAS EXTRAS (PRODISA INTRANET)
 * ============================================================================
 * Implementa el flujo de autorización de horas extras en dos niveles:
 *   1. Registro por el Empleado (solo visualiza sus propias horas; puede editar o eliminar si está PENDIENTE_JEFE).
 *   2. Visto Bueno Jefe de Logística / Producción (pre-aprueba a PENDIENTE_RRHH o rechaza).
 *   3. Autorización Final por RRHH (aprueba a APROBADO o rechaza).
 *   4. Función de Reapertura (permite a Logística y RRHH reabrir solicitudes procesadas para correcciones).
 *   5. Reporteo a Excel (CSV) y PDF imprimible con logotipo oficial de PRODISA.
 * 
 * Comentado en español para desarrolladores Junior.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Plus, CheckCircle, XCircle, AlertCircle, Edit3, ShieldCheck, Users, RotateCcw, FileSpreadsheet, FileText, Trash2, Edit, X } from 'lucide-react';
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

  // Modales y formularios
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Formulario de Solicitud (Crear / Editar)
  const [formData, setFormData] = useState({
    startDateTime: '',
    endDateTime: '',
    projectId: 1,
    justification: '',
  });
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  // Formulario de Aprobación de Supervisores
  const [approvalData, setApprovalData] = useState({
    approvedHoursCount: 0,
    notes: '',
    step: 'AREA', // 'AREA' o 'RRHH'
  });

  // Formulario de Reapertura de Solicitud
  const [reopenNotes, setReopenNotes] = useState('');

  // Roles con permisos de supervisión
  const isSupervisorOrRRHH =
    user?.roleCode === 'ADMIN_GLOBAL' ||
    user?.roleCode === 'ADMIN_RRHH' ||
    user?.roleCode === 'PRODUCCION' ||
    user?.roleCode === 'MESA_CONTROL';

  const isLogisticaBoss = user?.roleCode === 'PRODUCCION' || user?.roleCode === 'ADMIN_GLOBAL';
  const isRRHHBoss = user?.roleCode === 'ADMIN_RRHH' || user?.roleCode === 'ADMIN_GLOBAL';

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
      const fetchedProjects = projectsRes.data.projects || [];
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0 && formData.projectId === 1) {
        setFormData((prev) => ({ ...prev, projectId: fetchedProjects[0].id }));
      }
    } catch (err) {
      console.error('Error al cargar horas extras:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear nueva solicitud de horas extras (Empleado)
   */
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
      alert(err.response?.data?.error || 'Error al guardar solicitud');
    }
  };

  /**
   * Editar solicitud pendiente del propio empleado
   */
  const openEditModal = (record: any) => {
    setSelectedRecord(record);
    const startStr = record.start_date_time ? new Date(record.start_date_time).toISOString().slice(0, 16) : '';
    const endStr = record.end_date_time ? new Date(record.end_date_time).toISOString().slice(0, 16) : '';
    setFormData({
      startDateTime: startStr,
      endDateTime: endStr,
      projectId: record.project_id || (projects[0]?.id || 1),
      justification: record.justification || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await api.put(`/overtime/${selectedRecord.id}`, formData);
      setShowEditModal(false);
      setSelectedRecord(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar solicitud');
    }
  };

  /**
   * Eliminar solicitud pendiente del propio empleado
   */
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud de horas extras?')) return;
    try {
      await api.delete(`/overtime/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar solicitud');
    }
  };

  /**
   * Modal de aprobación de supervisor (Logística o RRHH)
   */
  const openApprovalModal = (record: any, step: 'AREA' | 'RRHH') => {
    setSelectedRecord(record);
    setApprovalData({
      approvedHoursCount: record.approved_hours_count || record.hours_count,
      notes: step === 'AREA' ? record.area_boss_notes || 'Visto bueno otorgado por Jefe de Logística/Instalaciones.' : record.rrhh_notes || 'Autorizado para pago en nómina / tiempo por tiempo por RRHH.',
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

  /**
   * Reabrir solicitud aprobada o rechazada para revisión
   */
  const openReopenModal = (record: any) => {
    setSelectedRecord(record);
    setReopenNotes('');
    setShowReopenModal(true);
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await api.patch(`/overtime/${selectedRecord.id}/reopen`, { reopenNotes });
      setShowReopenModal(false);
      setSelectedRecord(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al reabrir la solicitud');
    }
  };

  /**
   * REPORTE EN EXCEL (CSV UTF-8)
   */
  const exportToExcel = () => {
    if (records.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const headers = ['ID', 'Empleado', 'Departamento', 'Proyecto', 'Inicio', 'Fin', 'Horas Solicitadas', 'Horas Aprobadas', 'Estatus', 'Obs. Jefe Logística', 'Obs. RRHH', 'Justificación'];
    const rows = records.map((r) => [
      r.id,
      `"${r.employee_name || 'Empleado'}"`,
      `"${r.department || ''}"`,
      `"${r.project_name || 'General'}"`,
      `"${r.start_date_time ? new Date(r.start_date_time).toLocaleString('es-MX') : ''}"`,
      `"${r.end_date_time ? new Date(r.end_date_time).toLocaleString('es-MX') : ''}"`,
      r.hours_count,
      r.approved_hours_count || 0,
      `"${r.status}"`,
      `"${r.area_boss_notes || ''}"`,
      `"${r.rrhh_notes || ''}"`,
      `"${(r.justification || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Horas_Extras_PRODISA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * REPORTE EN PDF (Impresión limpia formateada con Membrete y Logo oficial de PRODISA)
   */
  const exportToPDF = () => {
    if (records.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para generar el reporte PDF.');
      return;
    }

    const reportDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Concentrado de Horas Extras - PRODISA</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 20px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-b: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 15px; }
          .logo { height: 50px; }
          .company-title { text-align: right; }
          .company-title h1 { margin: 0; font-size: 16px; color: #0f172a; }
          .company-title p { margin: 2px 0 0 0; color: #64748b; font-size: 10px; }
          .report-info { margin-bottom: 15px; font-size: 10px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background-color: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
          .approved { background-color: #dcfce7; color: #166534; }
          .pending { background-color: #fef3c7; color: #92400e; }
          .rejected { background-color: #fee2e2; color: #991b1b; }
          .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/assets/logo-prodisa.png" class="logo" alt="PRODISA Logo" />
          <div class="company-title">
            <h1>CONCENTRADO DE HORAS EXTRAS</h1>
            <p>Comercializadora e Instalaciones Oriente Prodisa - SWGRHP-IG</p>
          </div>
        </div>

        <div class="report-info">
          <strong>Fecha de Emisión:</strong> ${reportDate} | 
          <strong>Generado por:</strong> ${user?.firstName} ${user?.lastName} (${user?.roleName || user?.roleCode}) | 
          <strong>Total de Registros:</strong> ${records.length}
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empleado / Depto</th>
              <th>Proyecto</th>
              <th>Fecha Inicio - Fin</th>
              <th>Hrs Solicitadas</th>
              <th>Hrs Aprobadas</th>
              <th>Estatus</th>
              <th>Observaciones Jefe / RRHH</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r) => `
              <tr>
                <td>#${r.id}</td>
                <td><strong>${r.employee_name || 'Empleado'}</strong><br><small>${r.department || 'Producción'}</small></td>
                <td>${r.project_name || 'General'}</td>
                <td>${r.start_date_time ? new Date(r.start_date_time).toLocaleString('es-MX') : r.work_date}</td>
                <td><strong>${r.hours_count} hrs</strong></td>
                <td><strong style="color: #16a34a;">${r.approved_hours_count || 0} hrs</strong></td>
                <td>
                  <span class="badge ${r.status === 'APROBADO' ? 'approved' : r.status === 'RECHAZADO' ? 'rejected' : 'pending'}">
                    ${r.status}
                  </span>
                </td>
                <td>
                  ${r.area_boss_notes ? `<div><small>Jefe:</small> ${r.area_boss_notes}</div>` : ''}
                  ${r.rrhh_notes ? `<div><small>RRHH:</small> ${r.rrhh_notes}</div>` : ''}
                  ${!r.area_boss_notes && !r.rrhh_notes ? `<small>${r.justification || ''}</small>` : ''}
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento oficial generado desde la Intranet PRODISA SWGRHP-IG. Prohibida su alteración o reproducción no autorizada.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDIENTE_JEFE':
        return <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">Paso 1: Visto Bueno Jefe Instalaciones/Logística</span>;
      case 'PENDIENTE_RRHH':
        return <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">Paso 2: Pendiente Autorización RRHH</span>;
      case 'APROBADO':
        return <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Aprobado Totalmente (Nómina)</span>;
      case 'RECHAZADO':
        return <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">✕ Rechazado</span>;
      default:
        return <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isSupervisorOrRRHH ? 'Concentrado General de Horas Extras' : 'Mis Horas Extras Registradas'}
            </h1>
            {isSupervisorOrRRHH && (
              <span className="bg-blue-950 text-blue-400 border border-blue-800/40 text-[10px] font-bold px-2 py-0.5 rounded">
                Supervisión / Autorización
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {isSupervisorOrRRHH
              ? 'Panel de control para Jefes de Logística y RRHH. Revisa, modifica horas, aprueba, rechaza o reabre solicitudes con generación de reportes.'
              : 'Registra tus horas extras y dale seguimiento a los vistos buenos otorgados por tu Jefe de Instalaciones/Logística y Recursos Humanos.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botones de Exportación de Reportes para Supervisores */}
          {isSupervisorOrRRHH && (
            <>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                title="Exportar reporte a Excel (CSV)"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                title="Imprimir o guardar reporte PDF con Logo"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </>
          )}

          {/* Botón de Registro de Horas (Empleado) */}
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Horas Extras
          </button>
        </div>
      </div>

      {/* KPI Cards: Resumen de Horas */}
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

      {/* Tabla Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            {isSupervisorOrRRHH ? 'Concentrado de Horas Extras del Personal' : 'Mis Solicitudes de Horas Extras'}
          </h2>
          <span className="text-xs text-slate-400">{records.length} Registro(s)</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-slate-300 min-w-[980px]">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Empleado / Depto</th>
                <th className="p-4">Proyecto</th>
                <th className="p-4">Fecha/Hora Inicio ➔ Fin</th>
                <th className="p-4">Solicitadas vs Aprobadas</th>
                <th className="p-4">Justificación</th>
                <th className="p-4">Estatus Visto Bueno</th>
                <th className="p-4">Visto Bueno Jefe Logística</th>
                <th className="p-4">Autorización RRHH</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">Cargando registros...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">No hay registros de horas extras.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {r.employee_name || 'Empleado'}
                      <span className="block text-[10px] text-slate-400 font-normal">{r.department || 'Instalaciones / Producción'}</span>
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

                    {/* Visto Bueno Jefe de Logística / Instalaciones */}
                    <td className="p-4 text-slate-300">
                      {r.area_boss_notes ? (
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px]">
                          <span className="font-bold text-amber-400 block text-[9px] uppercase">
                            Jefe Logística: {r.area_boss_name || 'Producción'}
                          </span>
                          {r.area_boss_notes}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Pendiente visto bueno</span>
                      )}
                    </td>

                    {/* Autorización RRHH */}
                    <td className="p-4 text-slate-300">
                      {r.rrhh_notes ? (
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px]">
                          <span className="font-bold text-emerald-400 block text-[9px] uppercase">
                            RRHH: {r.rrhh_name || 'Recursos Humanos'}
                          </span>
                          {r.rrhh_notes}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Pendiente autorización</span>
                      )}
                    </td>

                    {/* Acciones para Empleado vs Supervisores */}
                    <td className="p-4 text-right space-y-1.5 whitespace-nowrap">
                      {/* ACCIONES DEL EMPLEADO: Editar / Eliminar si sigue en PENDIENTE_JEFE */}
                      {!isSupervisorOrRRHH && r.status === 'PENDIENTE_JEFE' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(r)}
                            className="bg-blue-950/60 hover:bg-blue-900 text-blue-300 px-2.5 py-1 rounded text-[11px] font-semibold border border-blue-800/40 flex items-center gap-1 cursor-pointer"
                            title="Editar mi solicitud"
                          >
                            <Edit className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="bg-red-950/60 hover:bg-red-900 text-red-300 px-2.5 py-1 rounded text-[11px] font-semibold border border-red-800/40 flex items-center gap-1 cursor-pointer"
                            title="Eliminar mi solicitud"
                          >
                            <Trash2 className="w-3 h-3" /> Borrar
                          </button>
                        </div>
                      )}

                      {/* ACCIONES DE SUPERVISORES: Aprobar Jefe Logística / Autorizar RRHH / Rechazar / Reabrir */}
                      {isSupervisorOrRRHH && (
                        <div className="space-y-1.5">
                          {/* Paso 1: Jefe Logística */}
                          {r.status === 'PENDIENTE_JEFE' && isLogisticaBoss && (
                            <button
                              onClick={() => openApprovalModal(r, 'AREA')}
                              className="w-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white px-3 py-1.5 rounded text-[11px] font-bold border border-amber-500/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Visto Bueno (Paso 1)
                            </button>
                          )}

                          {/* Paso 2: RRHH */}
                          {(r.status === 'PENDIENTE_RRHH' || (r.status === 'PENDIENTE_JEFE' && user?.roleCode === 'ADMIN_GLOBAL')) && isRRHHBoss && (
                            <button
                              onClick={() => openApprovalModal(r, 'RRHH')}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Autorizar Pago RRHH
                            </button>
                          )}

                          {/* Rechazar */}
                          {(r.status === 'PENDIENTE_JEFE' || r.status === 'PENDIENTE_RRHH') && (
                            <button
                              onClick={() => handleReject(r.id)}
                              className="w-full bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-[11px] font-medium border border-red-500/30 transition-colors cursor-pointer"
                            >
                              Rechazar
                            </button>
                          )}

                          {/* Reabrir Solicitud Aprobada/Rechazada por error o nueva evidencia */}
                          {(r.status === 'APROBADO' || r.status === 'RECHAZADO') && (
                            <button
                              onClick={() => openReopenModal(r)}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1 rounded text-[11px] font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Reabrir solicitud para corrección de horas o nueva evidencia"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              Reabrir Solicitud
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREAR NUEVA SOLICITUD DE EMPLEADO */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d121f] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">Solicitar Horas Extras</h3>
                <p className="text-slate-400 text-xs mt-0.5">Ingresa proyecto, fecha/hora inicio y fin.</p>
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

      {/* MODAL 2: EDITAR SOLICITUD DE EMPLEADO */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d121f] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">Editar Solicitud #{selectedRecord.id}</h3>
                <p className="text-slate-400 text-xs mt-0.5">Modifica los tiempos o justificación de tus horas.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
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
                  <span className="text-slate-300 font-medium">Nuevas horas calculadas:</span>
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
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: APROBACIÓN DE SUPERVISORES (LOGÍSTICA O RRHH) */}
      {showApprovalModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d121f] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {approvalData.step === 'AREA' ? 'Visto Bueno por Jefe de Logística' : 'Autorización Final por RRHH'}
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
                  placeholder="Escribe comentarios u observaciones sobre las horas validadas..."
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

      {/* MODAL 4: REABRIR SOLICITUD APROBADA O RECHAZADA */}
      {showReopenModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0d121f] border border-amber-900/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Reabrir Solicitud de Horas Extras</h3>
              </div>
              <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Vas a reabrir la solicitud #{selectedRecord.id} del empleado <strong className="text-white">{selectedRecord.employee_name}</strong>. Esta acción regresará el estatus a revisión inicial.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Motivo de Reapertura (Corrección o nueva evidencia) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reopenNotes}
                  onChange={(e) => setReopenNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500"
                  placeholder="Detalla el motivo por el cual se reabre la solicitud (ej. error de captura, nueva evidencia de horas)..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-amber-600/30"
                >
                  Reabrir Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimeModule;
