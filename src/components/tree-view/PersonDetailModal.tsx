import { useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { formatAgeDisplay, getBirthdayInfo } from '../../utils/ageCalculator';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Compass,
  Briefcase,
  Cake,
  ExternalLink,
  Edit3,
  Maximize2,
  PanelRight,
} from 'lucide-react';

interface PersonDetailModalProps {
  persona: Persona | null;
  focalPersonId: string | null;
  personas: Persona[];
  relaciones: Relacion[];
  mode?: 'popup' | 'drawer';
  onToggleMode?: () => void;
  onClose: () => void;
  onSelectRelative: (persona: Persona) => void;
  onSetFocalPerson: (id: string) => void;
}

export default function PersonDetailModal({
  persona,
  focalPersonId,
  personas,
  relaciones,
  mode = 'drawer',
  onToggleMode,
  onClose,
  onSelectRelative,
  onSetFocalPerson,
}: PersonDetailModalProps) {
  if (!persona) return null;

  const kinship = focalPersonId ? calculateKinship(focalPersonId, persona.id, personas, relaciones) : null;
  const isFocal = focalPersonId === persona.id;

  // Encontrar familiares directos de esta persona en específico
  const { padres, conyuges, hijos, hermanos } = useMemo(() => {
    const padresList: { persona: Persona; rel: string }[] = [];
    const conyugesList: { persona: Persona; rel: string }[] = [];
    const hijosList: { persona: Persona; rel: string }[] = [];
    const hermanosList: { persona: Persona; rel: string }[] = [];

    relaciones.forEach((r) => {
      const p1 = personas.find((p) => p.id === r.persona_id_1);
      const p2 = personas.find((p) => p.id === r.persona_id_2);
      if (!p1 || !p2) return;

      const relType = r.tipo_relacion;
      if (r.persona_id_1 === persona.id) {
        if (relType === 'padre' || relType === 'madre') padresList.push({ persona: p2, rel: 'Padre/Madre' });
        if (relType === 'hijo' || relType === 'hija') hijosList.push({ persona: p2, rel: 'Hijo/a' });
        if (relType === 'conyuge' || relType === 'esposo' || relType === 'esposa' || relType === 'pareja') conyugesList.push({ persona: p2, rel: 'Cónyuge' });
        if (relType === 'hermano' || relType === 'hermana') hermanosList.push({ persona: p2, rel: 'Hermano/a' });
      } else if (r.persona_id_2 === persona.id) {
        if (relType === 'padre' || relType === 'madre') hijosList.push({ persona: p1, rel: 'Hijo/a' });
        if (relType === 'hijo' || relType === 'hija') padresList.push({ persona: p1, rel: 'Padre/Madre' });
        if (relType === 'conyuge' || relType === 'esposo' || relType === 'esposa' || relType === 'pareja') conyugesList.push({ persona: p1, rel: 'Cónyuge' });
        if (relType === 'hermano' || relType === 'hermana') hermanosList.push({ persona: p1, rel: 'Hermano/a' });
      }
    });

    return {
      padres: padresList,
      conyuges: conyugesList,
      hijos: hijosList,
      hermanos: hermanosList,
    };
  }, [persona, personas, relaciones]);

  const ageDisplay = formatAgeDisplay(persona.fecha_nacimiento, persona.fecha_fallecimiento);
  const bdayInfo = !persona.fecha_fallecimiento ? getBirthdayInfo(persona.fecha_nacimiento) : null;

  const isPopup = mode === 'popup';

  return (
    <div
      className={
        isPopup
          ? 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm pointer-events-auto animate-fade-in'
          : 'fixed inset-y-0 right-0 z-50 flex pointer-events-none animate-fade-in'
      }
      onClick={isPopup ? onClose : undefined}
    >
      {/* Backdrop suave sólo en móvil cuando es Drawer */}
      {!isPopup && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/10 dark:bg-black/30 backdrop-blur-[1px] md:hidden pointer-events-auto"
        />
      )}

      {/* Contenedor Principal: Modal Pop-up (centrada) o Drawer (lateral) */}
      <aside
        onClick={isPopup ? (e) => e.stopPropagation() : undefined}
        className={
          isPopup
            ? 'pointer-events-auto relative w-full max-w-2xl max-h-[88vh] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col overflow-hidden transition-all'
            : 'pointer-events-auto relative w-full md:w-[420px] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col transition-all'
        }
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Ficha del Familiar
            </span>
            {isFocal && (
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                Punto de Vista
              </span>
            )}
            {kinship && !isFocal && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300">
                {kinship}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleMode && (
              <button
                onClick={onToggleMode}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
                title={
                  isPopup
                    ? 'Anclar como Panel Lateral Derecho'
                    : 'Abrir como Ventana Modal Pop-up flotante'
                }
              >
                {isPopup ? (
                  <>
                    <PanelRight className="w-3.5 h-3.5 text-blue-500" />
                    <span>Panel lateral</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Pop-up</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Header del familiar */}
          <div className="flex items-center gap-4">
            {persona.foto ? (
              <img
                src={persona.foto}
                alt={`${persona.nombres} ${persona.apellidos}`}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm shrink-0">
                {persona.nombres?.[0]?.toUpperCase() || ''}{persona.apellidos?.[0]?.toUpperCase() || ''}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {persona.nombres} {persona.apellidos}
              </h2>
              {persona.apodo && (
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  «{persona.apodo}»
                </p>
              )}
              {ageDisplay && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {ageDisplay}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2.5">
            {!isFocal && (
              <button
                onClick={() => onSetFocalPerson(persona.id)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs"
              >
                <Compass className="w-4 h-4" />
                <span>Punto de Vista</span>
              </button>
            )}
            {isFocal && (
              <div className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
                <Compass className="w-4 h-4" />
                <span>Punto de Vista activo</span>
              </div>
            )}
            <button
              onClick={() => {
                /* Futuro hook a edición rápida */
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ficha</span>
            </button>
          </div>

          {/* Alerta de cumpleaños */}
          {bdayInfo && bdayInfo.daysLeft <= 30 && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-3">
              <Cake className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                {bdayInfo.isToday ? (
                  <span><strong>¡Hoy es su cumpleaños!</strong> Cumple {bdayInfo.nextAge} años.</span>
                ) : (
                  <span><strong>Próximo cumpleaños en {bdayInfo.daysLeft} días</strong> ({bdayInfo.dateFormatted}) — Cumplirá {bdayInfo.nextAge} años.</span>
                )}
              </div>
            </div>
          )}

          {/* Datos Profesionales y Ubicación */}
          {(persona.profesion || persona.lugar_nacimiento) && (
            <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              {persona.profesion && (
                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{persona.profesion}</span>
                </div>
              )}
              {persona.lugar_nacimiento && (
                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{persona.lugar_nacimiento}</span>
                </div>
              )}
            </div>
          )}

          {/* Contactos rápidos */}
          {(persona.telefono || persona.email) && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contacto Directo</h3>
              <div className="grid grid-cols-1 gap-2">
                {persona.telefono && (
                  <a
                    href={`tel:${persona.telefono}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span>{persona.telefono}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
                {persona.email && (
                  <a
                    href={`mailto:${persona.email}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium truncate">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      <span className="truncate">{persona.email}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Biografía / Notas */}
          {persona.biografia && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Biografía & Notas</h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {persona.biografia}
              </p>
            </div>
          )}

          {/* Fechas detalladas */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fechas Clave</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Nacimiento</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {persona.fecha_nacimiento || 'No registrada'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Defunción</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {persona.fecha_fallecimiento || 'Presente'}
                </p>
              </div>
            </div>
          </div>

          {/* Familiares Directos */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Familiares Inmediatos</h3>

            {[...padres, ...conyuges, ...hijos, ...hermanos].length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay familiares directos registrados en este árbol.</p>
            ) : (
              <div className="space-y-1.5">
                {[...padres, ...conyuges, ...hijos, ...hermanos].map((item) => (
                  <button
                    key={`${item.rel}-${item.persona.id}`}
                    onClick={() => onSelectRelative(item.persona)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.persona.foto ? (
                        <img
                          src={item.persona.foto}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.persona.nombres?.[0] || '?'}{item.persona.apellidos?.[0] || ''}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {item.persona.nombres} {item.persona.apellidos}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                          {item.rel}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
