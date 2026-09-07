import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export const InternalRequestsModule: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests');
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Solicitudes Internas (Vacaciones & Permisos)</h1>
          <p className="text-slate-400 text-xs mt-1">Registro y autorización de solicitudes de vacaciones, permisos y ausencias.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
            <tr>
              <th className="p-4">Empleado</th>
              <th className="p-4">Tipo Solicitud</th>
              <th className="p-4">Fecha Inicio</th>
              <th className="p-4">Fecha Fin</th>
              <th className="p-4">Motivo</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando solicitudes...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay solicitudes registradas.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-semibold text-white">{r.employee_name}</td>
                  <td className="p-4 font-bold text-blue-400">{r.request_type}</td>
                  <td className="p-4">{r.start_date?.split('T')[0]}</td>
                  <td className="p-4">{r.end_date?.split('T')[0]}</td>
                  <td className="p-4">{r.reason}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
