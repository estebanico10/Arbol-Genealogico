import { useState, useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { formatAgeDisplay } from '../../utils/ageCalculator';
import { Search, Phone, Mail, ChevronRight, Briefcase, MapPin } from 'lucide-react';

interface TreeTableViewProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson?: (id: string | null) => void;
  onSelectPersonForDetail: (persona: Persona) => void;
}

export default function TreeTableView({
  personas,
  relaciones,
  focalPersonId,
  onSelectPersonForDetail,
}: TreeTableViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alive' | 'deceased'>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | '0-18' | '19-50' | '50+'>('all');

  const filteredPersonas = useMemo(() => {
    return personas.filter((p) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesText = 
          p.nombres?.toLowerCase().includes(q) ||
          p.apellidos?.toLowerCase().includes(q) ||
          p.profesion?.toLowerCase().includes(q) ||
          p.lugar_nacimiento?.toLowerCase().includes(q) ||
          p.biografia?.toLowerCase().includes(q) ||
          p.apodo?.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'alive' && p.fecha_fallecimiento) return false;
      if (statusFilter === 'deceased' && !p.fecha_fallecimiento) return false;

      // 3. Age Filter
      if (ageFilter !== 'all') {
        const currentYear = new Date().getFullYear();
        let age = null;
        if (p.fecha_nacimiento) {
          const birthYear = parseInt(p.fecha_nacimiento.split('-')[0], 10);
          if (!isNaN(birthYear)) {
            if (p.fecha_fallecimiento) {
              const deathYear = parseInt(p.fecha_fallecimiento.split('-')[0], 10);
              if (!isNaN(deathYear)) age = deathYear - birthYear;
            } else {
              age = currentYear - birthYear;
            }
          }
        }
        
        if (age === null) return false;
        if (ageFilter === '0-18' && (age < 0 || age > 18)) return false;
        if (ageFilter === '19-50' && (age < 19 || age > 50)) return false;
        if (ageFilter === '50+' && age < 51) return false;
      }

      return true;
    });
  }, [personas, search, statusFilter, ageFilter]);

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-[#F8FAFC] dark:bg-slate-950 space-y-6 sm:space-y-8">
      {/* Header and Search/Filters */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Tabla de Miembros
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Vista tabular estructurada con parentesco inteligente, edades precisas y datos rápidos.
            </p>
          </div>
          
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o atributo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <option value="all">Estado: Todos</option>
            <option value="alive">Solo Vivos</option>
            <option value="deceased">Solo Fallecidos</option>
          </select>

          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <option value="all">Edad: Todas</option>
            <option value="0-18">0 - 18 años</option>
            <option value="19-50">19 - 50 años</option>
            <option value="50+">Más de 50 años</option>
          </select>
        </div>
      </div>

      {/* Tabla estilo SaaS moderno (Linear / Stripe) */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Persona</th>
                <th className="py-4 px-6">Parentesco / Rol</th>
                <th className="py-4 px-6">Edad / Período</th>
                <th className="py-4 px-6">Profesión & Lugar</th>
                <th className="py-4 px-6">Contacto Directo</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredPersonas.map((p) => {
                const isFocal = focalPersonId === p.id;
                const kinship = focalPersonId
                  ? calculateKinship(focalPersonId, p.id, personas, relaciones)
                  : null;
                const ageDisplay = formatAgeDisplay(p.fecha_nacimiento, p.fecha_fallecimiento);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPersonForDetail(p)}
                    className={`group cursor-pointer transition-colors ${
                      isFocal
                        ? 'bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-50/70'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Persona: Avatar + Nombre */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        {p.foto ? (
                          <img
                            src={p.foto}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {p.nombres?.[0] || ''}{p.apellidos?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {p.nombres} {p.apellidos}
                          </p>
                          {p.apodo && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                              «{p.apodo}»
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Parentesco / Rol */}
                    <td className="py-4 px-6">
                      {isFocal ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider">
                          Punto de Vista
                        </span>
                      ) : kinship ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                          {kinship}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Edad / Período */}
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                      {ageDisplay || 'No registrada'}
                    </td>

                    {/* Profesión & Lugar */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {p.profesion && (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{p.profesion}</span>
                          </div>
                        )}
                        {p.lugar_nacimiento && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{p.lugar_nacimiento}</span>
                          </div>
                        )}
                        {!p.profesion && !p.lugar_nacimiento && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Contacto Directo */}
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {p.telefono ? (
                          <a
                            href={`tel:${p.telefono}`}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 transition-colors"
                            title={p.telefono}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}`}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 transition-colors"
                            title={p.email}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                        {!p.telefono && !p.email && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Acción */}
                    <td className="py-4 px-6 text-right">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPersonForDetail(p);
                        }}
                        className="inline-flex items-center gap-1 font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      >
                        <span>Ficha</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
