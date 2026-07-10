import { useState, useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { formatAgeDisplay } from '../../utils/ageCalculator';
import { Search, Phone, Mail, MapPin, Briefcase, ChevronRight } from 'lucide-react';

interface TreeCardsViewProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson?: (id: string | null) => void;
  onSelectPersonForDetail: (persona: Persona) => void;
}

export default function TreeCardsView({
  personas,
  relaciones,
  focalPersonId,
  onSelectPersonForDetail,
}: TreeCardsViewProps) {
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
        
        if (age === null) return false; // If we don't know age, filter it out
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
              Directorio Familiar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fichas detalladas con acceso rápido a información de contacto y biografía.
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

      {/* Grid de Fichas Estilo Apple Contacts */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPersonas.map((persona) => {
          const isFocal = focalPersonId === persona.id;
          const kinship = focalPersonId
            ? calculateKinship(focalPersonId, persona.id, personas, relaciones)
            : null;

          const ageDisplay = formatAgeDisplay(persona.fecha_nacimiento, persona.fecha_fallecimiento);

          return (
            <div
              key={persona.id}
              onClick={() => onSelectPersonForDetail(persona)}
              className={`group cursor-pointer p-6 rounded-3xl transition-all duration-200 bg-white dark:bg-slate-900 border ${
                isFocal
                  ? 'border-blue-500/80 shadow-[0_4px_25px_rgba(37,99,235,0.12)] bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
              } flex flex-col justify-between`}
            >
              <div>
                {/* Header de ficha: Avatar y Badge */}
                <div className="flex items-start justify-between gap-4">
                  {persona.foto ? (
                    <img
                      src={persona.foto}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm">
                      {persona.nombres?.[0] || ''}{persona.apellidos?.[0] || ''}
                    </div>
                  )}

                  <div className="flex flex-col items-end gap-1.5">
                    {isFocal ? (
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] tracking-wider uppercase">
                        Punto de Vista
                      </span>
                    ) : kinship ? (
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] tracking-wider uppercase">
                        {kinship}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Nombre y Edad */}
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {persona.nombres} {persona.apellidos}
                  </h3>
                  {persona.apodo && (
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      «{persona.apodo}»
                    </p>
                  )}
                  {ageDisplay && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {ageDisplay}
                    </p>
                  )}
                </div>

                {/* Profesión / Ubicación */}
                {(persona.profesion || persona.lugar_nacimiento) && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    {persona.profesion && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{persona.profesion}</span>
                      </div>
                    )}
                    {persona.lugar_nacimiento && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{persona.lugar_nacimiento}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de Contacto o ver más */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {persona.telefono && (
                    <a
                      href={`tel:${persona.telefono}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      title={persona.telefono}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {persona.email && (
                    <a
                      href={`mailto:${persona.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      title={persona.email}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPersonForDetail(persona);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                >
                  <span>Abrir ficha</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
