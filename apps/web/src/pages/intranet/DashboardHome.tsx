import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, FolderKanban, Award, Package, Users, MessageSquare, CheckCircle, TrendingUp } from 'lucide-react';
import api from '../../services/api';

export const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingOvertime: 3,
    activeProjects: 2,
    totalBonuses: '$14,500 MXN',
    pendingRequisitions: 1,
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 border border-blue-800/40 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest block mb-1">
            Panel Interno SWGRHP-IG
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Bienvenido, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Rol de Operación: <strong className="text-blue-300">{user?.roleName || user?.roleCode}</strong> | Departamento: {user?.department || 'General'}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 px-4 py-3 rounded-xl text-right">
          <span className="text-xs text-slate-400 block">Estatus de Plataforma</span>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistemas Operativos
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Horas Extras Pendientes</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-white">{stats.pendingOvertime}</span>
            <span className="text-xs text-slate-400 block mt-1">En flujo de aprobación</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Proyectos Activos</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-white">{stats.activeProjects}</span>
            <span className="text-xs text-slate-400 block mt-1">En ejecución nacional</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Bonificaciones del Mes</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{stats.totalBonuses}</span>
            <span className="text-xs text-slate-400 block mt-1">Asignadas por proyecto</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Requisiciones Materiales</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-white">{stats.pendingRequisitions}</span>
            <span className="text-xs text-slate-400 block mt-1">Solicitudes a almacén</span>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix according to User Role */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-white">Resumen de Capacidades de su Rol</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="font-bold text-blue-400 block">Flujo Aprobatorio de 2 Pasos (Horas Extras)</span>
            <p className="text-slate-400 leading-relaxed">
              Empleado registra ➔ Jefe de Área aprueba nivel 1 ➔ RRHH o Admin otorga visto bueno final.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="font-bold text-blue-400 block">Asistente Virtual RAG (Gemini API)</span>
            <p className="text-slate-400 leading-relaxed">
              Responde automáticamente consultas sobre políticas de la empresa recuperando contexto almacenado en MySQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
