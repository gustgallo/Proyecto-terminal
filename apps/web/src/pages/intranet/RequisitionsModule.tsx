import React, { useState, useEffect } from 'react';
import { Package, Plus, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const RequisitionsModule: React.FC = () => {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReqs();
  }, []);

  const fetchReqs = async () => {
    try {
      const response = await api.get('/requisitions');
      setRequisitions(response.data.requisitions || []);
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
          <h1 className="text-2xl font-bold text-white">Requisición de Materiales</h1>
          <p className="text-slate-400 text-xs mt-1">Gestión de insumos solicitados para producción e instalación por proyecto.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
            <tr>
              <th className="p-4">Código Requisición</th>
              <th className="p-4">Proyecto</th>
              <th className="p-4">Solicitante</th>
              <th className="p-4">Departamento</th>
              <th className="p-4">Ítems</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando requisiciones...</td></tr>
            ) : requisitions.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay requisiciones creadas.</td></tr>
            ) : (
              requisitions.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-blue-400">{r.requisition_code}</td>
                  <td className="p-4 font-semibold text-white">{r.project_name}</td>
                  <td className="p-4">{r.requested_by_name}</td>
                  <td className="p-4">{r.department}</td>
                  <td className="p-4 font-bold">{r.total_items} materiales</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
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
