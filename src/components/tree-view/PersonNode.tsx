import { Handle, Position } from '@xyflow/react';
import { Compass } from 'lucide-react';
import { Persona } from '../../types/database';
import { memo } from 'react';

export interface PersonNodeData {
  persona: Persona;
  isFocal: boolean;
  kinship: string | null;
  badgeRole: string;
  showPhotos: boolean;
  showGenerations: boolean;
  showLabels: boolean;
  isDimmed: boolean; // if another node is hovered or it's non-relative
  generation: string | null; // actual generation label
  index?: number;
  onSelect: (p: Persona) => void;
  onSetFocal: (id: string) => void;
  onHover: (id: string | null) => void;
}

const PersonNode = ({ data }: { data: PersonNodeData }) => {
  const {
    persona: p,
    isFocal,
    badgeRole,
    showPhotos,
    showGenerations,
    showLabels,
    isDimmed,
    generation,
    index,
    onSelect,
    onSetFocal,
    onHover,
  } = data;

  const yearBirth = p.fecha_nacimiento ? p.fecha_nacimiento.split('-')[0] : '';
  const yearDeath = p.fecha_fallecimiento ? p.fecha_fallecimiento.split('-')[0] : '';
  const dateDisplay =
    yearBirth && yearDeath
      ? `${yearBirth} – ${yearDeath}`
      : yearBirth
      ? `n. ${yearBirth}`
      : '—';

  // Vivo vs Fallecido visual styling
  const isDeceased = !!p.fecha_fallecimiento;
  
  const ringColor = isFocal
    ? 'border-blue-500 shadow-[0_8px_30px_rgba(37,99,235,0.18)] bg-blue-50/40 dark:bg-blue-950/30 border-l-4'
    : isDeceased 
    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 border-l-[3px] border-l-slate-300 dark:border-l-slate-600 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 border-l-[3px] border-l-emerald-400 dark:border-l-emerald-600 shadow-sm hover:border-slate-300 dark:hover:border-slate-700';

  const opacityClass = isDimmed ? 'opacity-40 grayscale-[30%]' : 'opacity-100 grayscale-0';

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" className="opacity-0 w-4 h-4 bg-transparent border-0 -top-2" />
      <Handle type="target" position={Position.Left} id="left" className="opacity-0 w-4 h-4 bg-transparent border-0 -left-2" />
      <Handle type="target" position={Position.Right} id="right" className="opacity-0 w-4 h-4 bg-transparent border-0 -right-2" />
      
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver detalles de ${p.nombres} ${p.apellidos}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(p);
          }
        }}
        onMouseEnter={() => onHover(p.id)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(p)}
        className={`relative group w-[270px] h-[95px] rounded-3xl p-3.5 border transition-all duration-300 flex items-center justify-between cursor-pointer animate-fade-in ${ringColor} ${opacityClass}`}
        style={{ animationDelay: `${(index || 0) * 0.05}s` }}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {showPhotos && p.foto ? (
            <img
              src={p.foto}
              alt=""
              className={`w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-xs shrink-0 ${isDeceased ? 'grayscale-[50%] sepia-[20%]' : ''}`}
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base tracking-tight shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-xs ${isDeceased ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
              {(p.nombres?.[0] || '').toUpperCase()}{(p.apellidos?.[0] || '').toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1 text-left">
            <h4 className={`font-semibold text-[15px] leading-snug truncate ${isDeceased ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>
              {p.nombres} {p.apellidos}
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight flex items-center gap-1">
              {isDeceased && <span className="inline-block w-1.5 h-1.5 bg-slate-300 rounded-full" title="Fallecido" />}
              {dateDisplay}
            </p>
            {showGenerations && generation && (
              <span className="inline-block mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {generation}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end justify-between h-full pl-2 shrink-0">
          {(showLabels || isFocal) ? (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                isFocal
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {badgeRole}
            </span>
          ) : (
            <div />
          )}

          {!isFocal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetFocal(p.id);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Establecer como Punto de Vista"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Tooltip en hover largo */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 translate-y-full w-64 bg-slate-900/95 dark:bg-slate-800/95 text-white p-3.5 rounded-2xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 delay-500 z-50 flex flex-col gap-2 backdrop-blur-sm border border-slate-700/50">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm leading-tight">{p.nombres} {p.apellidos}</span>
            {dateDisplay !== '—' && <span className="text-[11px] text-slate-400 font-medium">{dateDisplay}</span>}
          </div>
          {(p.lugar_nacimiento || p.profesion || p.email || p.celular) && (
            <div className="flex flex-col gap-1.5 text-[10px] text-slate-300 border-t border-slate-700/50 pt-2 mt-1">
              {p.lugar_nacimiento && <div className="flex justify-between gap-2"><span className="text-slate-500 font-medium shrink-0">Lugar:</span> <span className="truncate">{p.lugar_nacimiento}</span></div>}
              {p.profesion && <div className="flex justify-between gap-2"><span className="text-slate-500 font-medium shrink-0">Profesión:</span> <span className="truncate">{p.profesion}</span></div>}
              {p.email && <div className="flex justify-between gap-2"><span className="text-slate-500 font-medium shrink-0">Email:</span> <span className="truncate">{p.email}</span></div>}
              {p.celular && <div className="flex justify-between gap-2"><span className="text-slate-500 font-medium shrink-0">Móvil:</span> <span className="truncate">{p.celular}</span></div>}
            </div>
          )}
          {p.notas && (
             <div className="text-[10px] italic text-slate-400 line-clamp-2 mt-1 pt-2 border-t border-slate-700/50">"{p.notas}"</div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 w-4 h-4 bg-transparent border-0 -bottom-2" />
      <Handle type="source" position={Position.Left} id="left-source" className="opacity-0 w-4 h-4 bg-transparent border-0 -left-2" />
      <Handle type="source" position={Position.Right} id="right-source" className="opacity-0 w-4 h-4 bg-transparent border-0 -right-2" />
    </>
  );
};

export default memo(PersonNode);
