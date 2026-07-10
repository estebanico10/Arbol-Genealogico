import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
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
  LogOut,
  Shield,
  Edit3,
  X,
  Check,
  Maximize2,
  PanelRight,
  Home,
  Sliders,
  Loader2,
  Users,
  Download,
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
  const { user, signOut } = useAuth();

  // Modales y menús en cabecera
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  // Preseleccionar como Punto de Vista automático si no se ha elegido ninguno
  useEffect(() => {
    if (!focalPersonId && personas.length > 0) {
      // 1. Intentar hacer match con el email del usuario logueado
      const userEmailPrefix = user?.email?.split('@')[0].toLowerCase();
      const userPerson = user?.email 
        ? personas.find((p) => 
            p.email?.toLowerCase() === user.email?.toLowerCase() || 
            (userEmailPrefix && p.nombres?.toLowerCase().includes(userEmailPrefix))
          ) 
        : null;
      
      if (userPerson) {
        setFocalPersonId(userPerson.id);
      } else {
        // 2. Si no, elegir a la persona con más relaciones (el nodo más "central")
        const counts = new Map<string, number>();
        relaciones.forEach(r => {
          counts.set(r.persona_id_1, (counts.get(r.persona_id_1) || 0) + 1);
          counts.set(r.persona_id_2, (counts.get(r.persona_id_2) || 0) + 1);
        });
        
        let maxCount = -1;
        let rootId = personas[0].id;
        
        counts.forEach((count, id) => {
          if (count > maxCount) {
            maxCount = count;
            rootId = id;
          }
        });
        
        setFocalPersonId(rootId);
      }
    }
  }, [personas, relaciones, focalPersonId, user]);

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

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    if (viewMode !== 'diagram') {
      alert('Cambia a la vista de "Árbol" para poder exportarlo.');
      return;
    }
    
    setIsExporting(true);
    try {
      const el = document.querySelector('.react-flow') as HTMLElement;
      if (!el) throw new Error('No se encontró el lienzo del árbol');
      
      const dataUrl = await toPng(el, {
        backgroundColor: isDark ? '#020617' : '#F8FAFC', // slate-950 or slate-50
        filter: (node) => {
          // No incluir UI controls en el PNG
          if (node?.classList?.contains('react-flow__minimap')) return false;
          if (node?.classList?.contains('react-flow__controls')) return false;
          if (node?.classList?.contains('react-flow__panel')) return false;
          return true;
        }
      });
      
      const a = document.createElement('a');
      a.setAttribute('download', `arbol-${selectedArbol?.nombre?.replace(/\s+/g, '-').toLowerCase() || 'genealogico'}.png`);
      a.setAttribute('href', dataUrl);
      a.click();
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Hubo un problema al exportar el árbol. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
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
            onClick={handleExport}
            disabled={isExporting || viewMode !== 'diagram'}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Descargar PNG del árbol"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>

          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Compartir enlace"
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
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Ajustes y Configuración de Vista"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Perfil de Usuario con menú emergente */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100 dark:ring-slate-800 hover:ring-blue-400 transition-all cursor-pointer"
              title="Menú de cuenta"
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : 'E'}
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 top-11 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-3 z-50 animate-fade-in space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {user?.email ? user.email.charAt(0).toUpperCase() : 'E'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {user?.email || 'Esteban David Nicola'}
                        </p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                          {user ? 'Administrador' : 'Explorador'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate(user ? '/admin' : '/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>{user ? 'Panel de Control Admin' : 'Acceso Administrador'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Preferencias de Vista</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Home className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Volver a Mis Árboles</span>
                    </button>

                    {user && (
                      <button
                        onClick={async () => {
                          await signOut();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Cerrar Sesión</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. CANVAS INFINITO DE PANTALLA COMPLETA (85%-90%+ DEL ALTO)
          ===================================================================== */}
      <main className="h-[calc(100vh-60px)] w-full relative overflow-hidden flex">
        <div className="flex-1 h-full w-full relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm z-10 animate-fade-in">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando árbol genealógico...</p>
            </div>
          ) : personas.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 z-10 animate-fade-in px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Árbol vacío</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
                Este árbol genealógico aún no tiene familiares registrados. Comienza añadiendo a la primera persona.
              </p>
              <button
                onClick={() => navigate(user ? `/admin/tree/${selectedArbol?.id}` : '/login')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Agregar Familiares</span>
              </button>
            </div>
          ) : (
            <>
              {viewMode === 'diagram' && (
            <>
              <TreeDiagram
                personas={personas}
                relaciones={relaciones}
                focalPersonId={focalPersonId}
                onSelectPersonForDetail={(persona) => setSelectedPersonForDetail(persona)}
                onSelectFocalPerson={setFocalPersonId}
              />
              
              {/* Panel de Estadísticas Flotante (Bottom Bar) */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>{personas.length} <span className="text-slate-500 font-normal">personas</span></span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Network className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{relaciones.length} <span className="text-slate-500 font-normal">conexiones</span></span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Cake className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {(() => {
                      let total = 0, count = 0;
                      personas.forEach(p => {
                        if (p.fecha_nacimiento && !p.fecha_fallecimiento) {
                          const year = parseInt(p.fecha_nacimiento.split('-')[0], 10);
                          if (!isNaN(year)) {
                            total += (new Date().getFullYear() - year);
                            count++;
                          }
                        }
                      });
                      return count > 0 ? Math.round(total / count) : 0;
                    })()} <span className="text-slate-500 font-normal">años prom.</span>
                  </span>
                </div>
              </div>
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
            </>
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

      {/* =====================================================================
          MODAL DE CONFIGURACIÓN / AJUSTES DE VISTA
          ===================================================================== */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in pointer-events-auto"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configuración y Visualización
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Sección 1: Tipo de Ficha */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Apertura de Ficha de Familiar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setDetailMode('drawer');
                      localStorage.setItem('misraices_detail_mode', 'drawer');
                    }}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all text-left ${
                      detailMode === 'drawer'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <PanelRight className="w-4 h-4 text-blue-500" />
                      {detailMode === 'drawer' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className="text-xs font-bold">Panel Lateral</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Anclado a la derecha (420px)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setDetailMode('popup');
                      localStorage.setItem('misraices_detail_mode', 'popup');
                    }}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all text-left ${
                      detailMode === 'popup'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Maximize2 className="w-4 h-4 text-blue-500" />
                      {detailMode === 'popup' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className="text-xs font-bold">Ventana Pop-up</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Flotante en el centro
                    </span>
                  </button>
                </div>
              </div>

              {/* Sección 2: Tema de la Aplicación */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Apariencia
                </label>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Modo Oscuro / Claro
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isDark ? 'Tema oscuro activo' : 'Tema claro activo'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>

              {/* Sección 3: Gestión del Árbol */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Gestión del Árbol y Miembros
                </label>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Puedes editar el nombre del árbol, agregar familiares, fotos y conexiones desde el panel administrativo.
                  </p>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      if (selectedArbol) {
                        navigate(user ? `/admin/tree/${selectedArbol.id}` : '/login');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Miembros de este Árbol</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
