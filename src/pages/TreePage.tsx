import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  ArrowLeft,
  Compass,
  Share2,
  Settings,
  Cake,
  Network,
  CreditCard,
  TableProperties,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import TreeDiagram from '../components/tree-view/TreeDiagram';
import TreeCardsView from '../components/tree-view/TreeCardsView';
import TreeTableView from '../components/tree-view/TreeTableView';
import { BirthdaysView } from '../components/tree-view/BirthdaysView';
import PersonDetailModal from '../components/tree-view/PersonDetailModal';
import { Persona } from '../types/database';
import { getBirthdayInfo } from '../utils/ageCalculator';

export default function TreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { arboles, selectedArbol, setSelectedArbol, loading, personas, relaciones } = useData();

  // Modo de vista principal
  const [viewMode, setViewMode] = useState<'diagram' | 'grid' | 'table' | 'birthdays'>('diagram');
  const [focalPersonId, setFocalPersonId] = useState<string | null>(null);

  // Tema claro/oscuro
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );

  // Inspector de detalles: 'drawer' (panel lateral) o 'popup' (ventana modal centrada)
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState<Persona | null>(null);
  const [detailMode, setDetailMode] = useState<'drawer' | 'popup'>(() => {
    return (localStorage.getItem('misraices_detail_mode') as 'drawer' | 'popup') || 'drawer';
  });

  const handleToggleDetailMode = () => {
    setDetailMode((prev) => {
      const next = prev === 'drawer' ? 'popup' : 'drawer';
      localStorage.setItem('misraices_detail_mode', next);
      return next;
    });
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
  };

  useEffect(() => {
    if (id) {
      const arbol = arboles.find((a) => a.id === id);
      if (arbol) {
        setSelectedArbol(arbol);
      } else if (!loading && arboles.length > 0) {
        navigate('/');
      }
    }
  }, [id, arboles, loading, setSelectedArbol, navigate]);

  // Preseleccionar como Punto de Vista a Esteban si no se ha elegido ninguno
  useEffect(() => {
    if (!focalPersonId && personas.length > 0) {
      const esteban = personas.find((p) => p.nombres && p.nombres.toLowerCase().includes('esteban'));
      if (esteban) {
        setFocalPersonId(esteban.id);
      }
    }
  }, [personas, focalPersonId]);

  const focalPerson = useMemo(
    () => personas.find((p) => p.id === focalPersonId),
    [personas, focalPersonId]
  );

  // Alerta proactiva de cumpleaños más próximo
  const nearestBirthdayPerson = useMemo(() => {
    let best: { persona: Persona; info: NonNullable<ReturnType<typeof getBirthdayInfo>> } | null = null;
    for (const p of personas) {
      if (p.fecha_fallecimiento || !p.fecha_nacimiento) continue;
      const info = getBirthdayInfo(p.fecha_nacimiento);
      if (info && info.daysLeft <= 14) {
        if (!best || info.daysLeft < (best.info?.daysLeft ?? 999)) {
          best = { persona: p, info };
        }
      }
    }
    return best;
  }, [personas]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Árbol Genealógico: ${selectedArbol?.nombre || 'Mi Árbol'}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace de exploración copiado al portapapeles!');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* =====================================================================
          1. ENCABEZADO PRINCIPAL COMPACTO Y ÚNICO (60px de alto, 1 sola fila)
          ===================================================================== */}
      <header className="h-[60px] shrink-0 z-40 flex items-center justify-between px-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Izquierda: Logo + Breadcrumb muy discreto + Indicador de Punto de Vista */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Volver a mis árboles"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 shrink-0">
            <span>Mis Raíces</span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
            <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[180px]">
              {selectedArbol?.nombre || 'Mi Árbol'}
            </span>
          </div>

          {/* Indicador discreto del Punto de Vista actual */}
          {focalPerson && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shrink-0">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Punto de vista: <strong>{focalPerson.nombres}</strong></span>
            </div>
          )}

          {/* Banner proactivo de cumpleaños próximo */}
          {nearestBirthdayPerson && viewMode !== 'birthdays' && (
            <button
              onClick={() => {
                setViewMode('birthdays');
                setSelectedPersonForDetail(nearestBirthdayPerson.persona);
              }}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/80 dark:border-amber-700/80 text-amber-800 dark:text-amber-200 text-xs font-semibold hover:scale-102 transition-all shadow-xs shrink-0"
            >
              <Cake className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              <span>
                {nearestBirthdayPerson.info.isToday ? '¡Hoy cumple' : 'Pronto cumple'}{' '}
                <strong>{nearestBirthdayPerson.persona.nombres}</strong>
              </span>
            </button>
          )}
        </div>

        {/* Centro / Derecha: Selector minimalista tipo pestañas + Acciones rápidas */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Selector de Vista Segmentado Minimalista */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'diagram'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Árbol</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>

            <button
              onClick={() => setViewMode('birthdays')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'birthdays'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Cumpleaños</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Compartir */}
          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Compartir árbol"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Cambio de Tema Claro/Oscuro */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cambiar tema claro/oscuro"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Configuración */}
          <button
            onClick={() => {}}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Perfil de Usuario */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100 dark:ring-slate-800 cursor-pointer">
            E
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. CANVAS INFINITO DE PANTALLA COMPLETA (85%-90%+ DEL ALTO)
          ===================================================================== */}
      <main className="h-[calc(100vh-60px)] w-full relative overflow-hidden flex">
        <div className="flex-1 h-full w-full relative">
          {viewMode === 'diagram' && (
            <TreeDiagram
              personas={personas}
              relaciones={relaciones}
              focalPersonId={focalPersonId}
              onSelectFocalPerson={(id) => setFocalPersonId(id)}
              onSelectPersonForDetail={(persona) => setSelectedPersonForDetail(persona)}
            />
          )}

          {viewMode === 'grid' && (
            <TreeCardsView
              personas={personas}
              relaciones={relaciones}
              focalPersonId={focalPersonId}
              onSelectPersonForDetail={(persona) => setSelectedPersonForDetail(persona)}
            />
          )}

          {viewMode === 'table' && (
            <TreeTableView
              personas={personas}
              relaciones={relaciones}
              focalPersonId={focalPersonId}
              onSelectPersonForDetail={(persona) => setSelectedPersonForDetail(persona)}
            />
          )}

          {viewMode === 'birthdays' && (
            <BirthdaysView
              personas={personas}
              relaciones={relaciones}
              focalPersonId={focalPersonId}
              onSelectPersonForDetail={(persona: Persona) => setSelectedPersonForDetail(persona)}
            />
          )}
        </div>

        {/* =====================================================================
            3. DRAWER LATERAL DERECHO (Inspector de Ficha, 420px)
            ===================================================================== */}
        <PersonDetailModal
          persona={selectedPersonForDetail}
          focalPersonId={focalPersonId}
          personas={personas}
          relaciones={relaciones}
          mode={detailMode}
          onToggleMode={handleToggleDetailMode}
          onClose={() => setSelectedPersonForDetail(null)}
          onSelectRelative={(p) => setSelectedPersonForDetail(p)}
          onSetFocalPerson={(id) => setFocalPersonId(id)}
        />
      </main>
    </div>
  );
}
