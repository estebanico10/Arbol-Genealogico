import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  ArrowLeft,
  Compass,
  Search,
  Tag,
  LayoutGrid,
  Share2,
  Settings,
  Cake,
  Network,
  CreditCard,
  TableProperties,
  X,
  ChevronRight,
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

  // Modo de vista principal (Diagrama SaaS por defecto)
  const [viewMode, setViewMode] = useState<'diagram' | 'grid' | 'table' | 'birthdays'>('diagram');
  const [focalPersonId, setFocalPersonId] = useState<string | null>(null);

  // Estados de Toolbar del Árbol SaaS
  const [orientation, setOrientation] = useState<'TB' | 'LR'>('TB');
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Inspector de detalles como Panel Lateral Derecho (Drawer)
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState<Persona | null>(null);

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

  // Resultados del buscador instantáneo
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return personas
      .filter(
        (p) =>
          p.nombres?.toLowerCase().includes(q) ||
          p.apellidos?.toLowerCase().includes(q) ||
          p.profesion?.toLowerCase().includes(q) ||
          p.lugar_nacimiento?.toLowerCase().includes(q) ||
          p.biografia?.toLowerCase().includes(q) ||
          p.apodo?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [personas, searchQuery]);

  if (loading || !selectedArbol) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F8FAFC] dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const focalPerson = personas.find((p) => p.id === focalPersonId);

  // Alerta proactiva de cumpleaños más próximo
  const nearestBirthdayPerson = (() => {
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
  })();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedArbol.nombre,
        text: `Explora el árbol genealógico familiar: ${selectedArbol.nombre}`,
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
          1. HEADER ULTRA-LIMPIO (SaaS 2026 / Linear style)
          ===================================================================== */}
      <header className="shrink-0 z-20 flex items-center justify-between px-6 py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Breadcrumb & Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Volver a mis árboles"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Mis Raíces</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {selectedArbol.nombre}
            </span>
          </div>

          {/* Cápsula de Punto de Vista */}
          {focalPerson && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Punto de vista: <strong>{focalPerson.nombres}</strong></span>
            </div>
          )}
        </div>

        {/* Banner discreto de cumpleaños si hay uno próximo */}
        {nearestBirthdayPerson && viewMode !== 'birthdays' && (
          <button
            onClick={() => {
              setViewMode('birthdays');
              setSelectedPersonForDetail(nearestBirthdayPerson.persona);
            }}
            className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/80 dark:border-amber-700/80 text-amber-800 dark:text-amber-200 text-xs font-semibold hover:scale-102 transition-all shadow-xs"
          >
            <Cake className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span>
              {nearestBirthdayPerson.info.isToday ? '¡Hoy cumple años' : 'Pronto cumple'} {' '}
              <strong>{nearestBirthdayPerson.persona.nombres}</strong> (
              {nearestBirthdayPerson.info.nextAge} años)
            </span>
          </button>
        )}

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher estilo segment control de Apple */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'diagram'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Lienzo</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'birthdays'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Cumpleaños</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Compartir */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Compartir árbol"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Ajustes */}
          <button
            onClick={() => {}}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Configuración del árbol"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. CANVAS INFINITO / ÁREA DE VISTAS (Con Toolbar Flotante en Diagrama)
          ===================================================================== */}
      <main className="flex-1 relative overflow-hidden flex">
        {/* Área del Lienzo o Vista */}
        <div className="flex-1 h-full relative">
          {viewMode === 'diagram' && (
            <>
              {/* TOOLBAR FLOTANTE INFERIOR O SUPERIOR (Estilo Figma / Linear 18px blur) */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl transition-all">
                {/* Selector flotante de Punto de Vista */}
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                  <select
                    value={focalPersonId || ''}
                    onChange={(e) => setFocalPersonId(e.target.value || null)}
                    className="text-xs font-semibold bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border-none outline-none cursor-pointer hover:bg-slate-200/70 transition-colors"
                  >
                    <option value="">Sin Punto de Vista</option>
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Buscador Inteligente en Toolbar */}
                <div className="relative">
                  <div
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 cursor-pointer text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar persona..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchOpen(true)}
                      className="bg-transparent text-xs font-medium w-28 md:w-40 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery('');
                        }}
                        className="p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
                      >
                        <X className="w-3 h-3 text-slate-500" />
                      </button>
                    )}
                  </div>

                  {/* Resultados Desplegables Inteligentes */}
                  {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setFocalPersonId(p.id);
                            setSelectedPersonForDetail(p);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          {p.foto ? (
                            <img src={p.foto} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                              {p.nombres?.[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {p.nombres} {p.apellidos}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {p.profesion || p.lugar_nacimiento || 'Miembro familiar'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Toggle Mostrar Etiquetas de Línea */}
                <button
                  onClick={() => setShowEdgeLabels((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    showEdgeLabels
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80'
                  }`}
                  title="Alternar etiquetas en las conexiones"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Etiquetas</span>
                </button>

                {/* Toggle Orientación Horizontal / Vertical */}
                <button
                  onClick={() => setOrientation((prev) => (prev === 'TB' ? 'LR' : 'TB'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 transition-colors"
                  title="Cambiar orientación vertical/horizontal"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden sm:inline">
                    {orientation === 'TB' ? 'Vertical' : 'Horizontal'}
                  </span>
                </button>
              </div>

              {/* COMPONENTE PRINCIPAL DEL ÁRBOL */}
              <TreeDiagram
                personas={personas}
                relaciones={relaciones}
                focalPersonId={focalPersonId}
                onSelectFocalPerson={(id) => setFocalPersonId(id)}
                onSelectPersonForDetail={(persona) => setSelectedPersonForDetail(persona)}
                orientation={orientation}
                showEdgeLabels={showEdgeLabels}
              />
            </>
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
            3. PANEL LATERAL DERECHO ESTILO LINEAR / HIG (Drawer 420px)
            ===================================================================== */}
        <PersonDetailModal
          persona={selectedPersonForDetail}
          focalPersonId={focalPersonId}
          personas={personas}
          relaciones={relaciones}
          onClose={() => setSelectedPersonForDetail(null)}
          onSelectRelative={(relPersona) => setSelectedPersonForDetail(relPersona)}
          onSetFocalPerson={(newId) => setFocalPersonId(newId)}
        />
      </main>
    </div>
  );
}
