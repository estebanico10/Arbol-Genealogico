import { useState, useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { Search, Eye, Phone, Mail } from 'lucide-react';

interface TreeTableViewProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson: (id: string | null) => void;
}

export default function TreeTableView({
  personas,
  relaciones,
  focalPersonId,
  onSelectFocalPerson,
}: TreeTableViewProps) {
  const [search, setSearch] = useState('');

  const filteredPersonas = useMemo(() => {
    if (!search.trim()) return personas;
    const q = search.toLowerCase();
    return personas.filter(
      (p) =>
        (p.nombres && p.nombres.toLowerCase().includes(q)) ||
        p.apellidos.toLowerCase().includes(q) ||
        (p.biografia && p.biografia.toLowerCase().includes(q))
    );
  }, [personas, search]);

  return (
    <div className="p-6 space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o biografía..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredPersonas.length}</strong> registros
        </p>
      </div>

      {/* Table container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
            <tr>
              <th className="p-4">Familiar</th>
              <th className="p-4">Relación (Punto de Vista)</th>
              <th className="p-4">Años</th>
              <th className="p-4">Contacto</th>
              <th className="p-4">Biografía</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredPersonas.map((p) => {
              const isFocal = focalPersonId === p.id;
              const kinship = focalPersonId ? calculateKinship(focalPersonId, p.id, personas, relaciones) : null;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${
                    isFocal ? 'bg-blue-50/50 dark:bg-blue-950/40' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.foto ? (
                        <img src={p.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-base shrink-0">
                          👤
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {p.nombres} {p.apellidos}
                        </div>
                        {p.lugar_nacimiento && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{p.lugar_nacimiento}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    {kinship ? (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block ${
                          isFocal
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200'
                        }`}
                      >
                        {kinship}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="p-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {p.fecha_nacimiento ? new Date(p.fecha_nacimiento).getFullYear() : '?'} —{' '}
                    {p.fecha_fallecimiento ? new Date(p.fecha_fallecimiento).getFullYear() : 'Presente'}
                  </td>

                  <td className="p-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    {p.celular && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.celular}</span>
                      </div>
                    )}
                    {p.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.email}</span>
                      </div>
                    )}
                  </td>

                  <td className="p-4 text-xs italic text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {p.biografia || '—'}
                  </td>

                  <td className="p-4 text-right">
                    {!isFocal ? (
                      <button
                        onClick={() => onSelectFocalPerson(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Punto de Vista
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">★ Focal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
