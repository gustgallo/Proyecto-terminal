import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, Plus, DollarSign } from 'lucide-react';
import api from '../../services/api';

export const BonusesModule: React.FC = () => {
  const { user } = useAuth();
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      const response = await api.get('/bonuses');
      setBonuses(response.data.bonuses || []);
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
          <h1 className="text-2xl font-bold text-white">Módulo de Bonificaciones</h1>
          <p className="text-slate-400 text-xs mt-1">Asignación y consulta de bonos por desempeño en proyectos.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
            <tr>
              <th className="p-4">Empleado</th>
              <th className="p-4">Monto</th>
              <th className="p-4">Proyecto</th>
              <th className="p-4">Razón / Motivo</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando bonificaciones...</td></tr>
            ) : bonuses.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay bonificaciones registradas.</td></tr>
            ) : (
              bonuses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-semibold text-white">{b.employee_name || 'Empleado'}</td>
                  <td className="p-4 font-bold text-emerald-400">${parseFloat(b.amount).toLocaleString()} MXN</td>
                  <td className="p-4">{b.project_name || 'General'}</td>
                  <td className="p-4">{b.reason}</td>
                  <td className="p-4">{b.bonus_date?.split('T')[0]}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {b.status}
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
