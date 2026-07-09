import { useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { X, Phone, Mail, Calendar, MapPin, Eye, Users } from 'lucide-react';

interface PersonDetailModalProps {
  persona: Persona | null;
  focalPersonId: string | null;
  personas: Persona[];
  relaciones: Relacion[];
  mode: 'popup' | 'drawer';
  onClose: () => void;
  onSelectRelative: (persona: Persona) => void;
  onSetFocalPerson: (id: string) => void;
}

export default function PersonDetailModal({
  persona,
  focalPersonId,
  personas,
  relaciones,
  mode,
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
        if (relType === 'hijo' || relType === 'hija') hijosList.push({ persona: p2, rel: 'Hijo/a' });
        if (relType === 'padre' || relType === 'madre') padresList.push({ persona: p2, rel: 'Padre/Madre' });
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

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          {persona.foto ? (
            <img
              src={persona.foto}
              alt={persona.nombres || ''}
              className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-3xl shadow-lg shrink-0">
              👤
            </div>
          )}

          <div>
            {kinship && (
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md mb-2">
                {kinship}
              </span>
            )}
            <h2 className="text-2xl font-black leading-tight">
              {persona.nombres} {persona.apellidos}
            </h2>
            {persona.cedula && <p className="text-xs text-blue-100 mt-1">Cédula / ID: {persona.cedula}</p>}
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Fechas y Lugar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vida</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {persona.fecha_nacimiento
                  ? new Date(persona.fecha_nacimiento).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Desconocido'}
                {' — '}
                {persona.fecha_fallecimiento
                  ? new Date(persona.fecha_fallecimiento).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Presente'}
              </p>
            </div>
          </div>

          {persona.lugar_nacimiento && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lugar de Origen</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{persona.lugar_nacimiento}</p>
              </div>
            </div>
          )}
        </div>

        {/* Contacto */}
        {(persona.celular || persona.telefono || persona.email) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Datos de Contacto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {persona.celular && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{persona.celular}</span>
                </div>
              )}
              {persona.telefono && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{persona.telefono}</span>
                </div>
              )}
              {persona.email && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm sm:col-span-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="font-medium truncate">{persona.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Biografía */}
        {persona.biografia && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Acerca de
            </h3>
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed">
              "{persona.biografia}"
            </div>
          </div>
        )}

        {/* Red Familiar Directa */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" /> Familiares Directos (Haz clic para ver)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {padres.map((rel) => (
              <button
                key={`p-${rel.persona.id}`}
                onClick={() => onSelectRelative(rel.persona)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-left group"
              >
                {rel.persona.foto ? (
                  <img src={rel.persona.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                    👤
                  </div>
                )}
                <div className="truncate">
                  <p className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400">Padre / Madre</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {rel.persona.nombres} {rel.persona.apellidos}
                  </p>
                </div>
              </button>
            ))}

            {conyuges.map((rel) => (
              <button
                key={`c-${rel.persona.id}`}
                onClick={() => onSelectRelative(rel.persona)}
                className="flex items-center gap-3 p-3 rounded-xl bg-pink-50/60 hover:bg-pink-100/80 dark:bg-pink-950/30 dark:hover:bg-pink-900/40 border border-pink-200 dark:border-pink-900 transition-all text-left group"
              >
                {rel.persona.foto ? (
                  <img src={rel.persona.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold text-sm shrink-0">
                    💖
                  </div>
                )}
                <div className="truncate">
                  <p className="text-[11px] font-bold uppercase text-pink-600 dark:text-pink-400">Cónyuge</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-pink-600 dark:group-hover:text-pink-400">
                    {rel.persona.nombres} {rel.persona.apellidos}
                  </p>
                </div>
              </button>
            ))}

            {hermanos.map((rel) => (
              <button
                key={`h-${rel.persona.id}`}
                onClick={() => onSelectRelative(rel.persona)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-left group"
              >
                {rel.persona.foto ? (
                  <img src={rel.persona.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold text-sm shrink-0">
                    👤
                  </div>
                )}
                <div className="truncate">
                  <p className="text-[11px] font-bold uppercase text-cyan-600 dark:text-cyan-400">Hermano/a</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {rel.persona.nombres} {rel.persona.apellidos}
                  </p>
                </div>
              </button>
            ))}

            {hijos.map((rel) => (
              <button
                key={`ch-${rel.persona.id}`}
                onClick={() => onSelectRelative(rel.persona)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-left group"
              >
                {rel.persona.foto ? (
                  <img src={rel.persona.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 flex items-center justify-center font-bold text-sm shrink-0">
                    🌱
                  </div>
                )}
                <div className="truncate">
                  <p className="text-[11px] font-bold uppercase text-green-600 dark:text-green-400">Hijo/a</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {rel.persona.nombres} {rel.persona.apellidos}
                  </p>
                </div>
              </button>
            ))}

            {padres.length === 0 && conyuges.length === 0 && hermanos.length === 0 && hijos.length === 0 && (
              <p className="text-xs text-slate-400 col-span-2 italic">No hay familiares directos registrados aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-3">
        {!isFocal ? (
          <button
            onClick={() => {
              onSetFocalPerson(persona.id);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
          >
            <Eye className="w-4 h-4" /> Centrar Punto de Vista en {persona.nombres}
          </button>
        ) : (
          <div className="flex-1 py-2.5 px-4 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold text-sm text-center flex items-center justify-center gap-2">
            ★ Actual Centro del Punto de Vista
          </div>
        )}

        <button
          onClick={onClose}
          className="py-2.5 px-5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  if (mode === 'drawer') {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop oculto/sutil para permitir clics fuera o sombra */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />

        <div className="relative w-full sm:w-96 md:w-[440px] h-full shadow-2xl z-10 animate-fade-in">
          {content}
        </div>
      </div>
    );
  }

  // mode === 'popup'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {content}
      </div>
    </div>
  );
}
