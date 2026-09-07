import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Calendar, Building, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export const ProjectsModule: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
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
          <h1 className="text-2xl font-bold text-white">Gestión de Proyectos</h1>
          <p className="text-slate-400 text-xs mt-1">Seguimiento de proyectos comerciales, estatus y asignación de personal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-slate-500">Cargando proyectos...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-500">No hay proyectos registrados.</div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">{p.code}</span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {p.status}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  Cliente: <strong className="text-slate-200">{p.client_name}</strong> ({p.sector})
                </p>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{p.description}</p>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Inicio: {p.start_date?.split('T')[0]}</span>
                <span>Estimado Fin: {p.estimated_end_date?.split('T')[0]}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
