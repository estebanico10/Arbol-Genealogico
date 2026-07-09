import { useState, useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { Search, Eye, Phone, Mail, Calendar, MapPin } from 'lucide-react';

interface TreeCardsViewProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson: (id: string | null) => void;
  onSelectPersonForDetail: (persona: Persona) => void;
}

export default function TreeCardsView({
  personas,
  relaciones,
  focalPersonId,
  onSelectFocalPerson,
  onSelectPersonForDetail,
}: TreeCardsViewProps) {
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
    <div className="p-6 space-y-6">
      {/* Search & Header */}
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
          Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredPersonas.length}</strong> de{' '}
          {personas.length} familiares
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPersonas.map((p) => {
          const isFocal = focalPersonId === p.id;
          const kinship = focalPersonId ? calculateKinship(focalPersonId, p.id, personas, relaciones) : null;

          return (
            <div
              key={p.id}
              onClick={() => onSelectPersonForDetail(p)}
              className={`group cursor-pointer flex flex-col justify-between p-5 rounded-2xl transition-all duration-200 ${
                isFocal
                  ? 'bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500 shadow-lg'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Header card with Avatar and Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt={p.nombres || ''}
                      className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-blue-500/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-2xl shadow-sm ring-2 ring-blue-500/20">
                      👤
                    </div>
                  )}

                  {kinship && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        isFocal
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200'
                      }`}
                    >
                      {kinship}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-snug">
                  {p.nombres} {p.apellidos}
                </h3>

                {/* Dates & Location */}
                <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {(p.fecha_nacimiento || p.fecha_fallecimiento) && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        {p.fecha_nacimiento ? new Date(p.fecha_nacimiento).getFullYear() : '?'} —{' '}
                        {p.fecha_fallecimiento ? new Date(p.fecha_fallecimiento).getFullYear() : 'Presente'}
                      </span>
                    </div>
                  )}

                  {p.lugar_nacimiento && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{p.lugar_nacimiento}</span>
                    </div>
                  )}
                </div>

                {/* Biografía */}
                {p.biografia && (
                  <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400 border-l-2 border-blue-400 pl-2 line-clamp-3">
                    "{p.biografia}"
                  </p>
                )}

                {/* Contacto */}
                {(p.celular || p.email) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {p.celular && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.celular}</span>
                      </div>
                    )}
                    {p.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón Punto de vista */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                {!isFocal ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFocalPerson(p.id);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Ver desde su Punto de Vista
                  </button>
                ) : (
                  <div className="text-center text-xs font-bold text-blue-600 dark:text-blue-400 py-2">
                    ★ Centro del Punto de Vista
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
