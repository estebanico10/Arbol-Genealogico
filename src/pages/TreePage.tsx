import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Compass } from 'lucide-react';
import TreeDiagram from '../components/tree-view/TreeDiagram';
import TreeCardsView from '../components/tree-view/TreeCardsView';
import TreeTableView from '../components/tree-view/TreeTableView';

export default function TreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { arboles, selectedArbol, setSelectedArbol, loading, personas, relaciones } = useData();
  const [viewMode, setViewMode] = useState<'diagram' | 'grid' | 'table'>('diagram');
  const [focalPersonId, setFocalPersonId] = useState<string | null>(null);

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

  // Si no hay un focalPersonId por defecto y ya cargaron las personas, preseleccionar a "Esteban" o a la primera persona
  useEffect(() => {
    if (!focalPersonId && personas.length > 0) {
      const esteban = personas.find((p) => p.nombres && p.nombres.toLowerCase().includes('esteban'));
      if (esteban) {
        setFocalPersonId(esteban.id);
      }
    }
  }, [personas, focalPersonId]);

  if (loading || !selectedArbol) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const focalPerson = personas.find((p) => p.id === focalPersonId);

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-[calc(100vh-11rem)]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a árboles
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {selectedArbol.nombre}
            </h1>
            {focalPerson && (
              <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200">
                <Compass className="w-3.5 h-3.5" />
                Punto de Vista: {focalPerson.nombres}
              </span>
            )}
          </div>
        </div>

        {/* Botones de Vista */}
        <div className="flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl border border-slate-300/60 dark:border-slate-700">
          <button
            onClick={() => setViewMode('diagram')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'diagram'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Diagrama
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tabla
          </button>
        </div>
      </div>

      {/* Indicador Móvil de Punto de Vista si hay uno seleccionado */}
      {focalPerson && (
        <div className="md:hidden flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-900 text-xs">
          <span className="font-semibold text-blue-900 dark:text-blue-200">
            🎯 Punto de Vista actual: <strong className="underline">{focalPerson.nombres}</strong>
          </span>
          <button
            onClick={() => setFocalPersonId(null)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        {personas.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Este árbol está vacío</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ingresa como administrador para empezar a añadir personas y relaciones.
              </p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'diagram' && (
              <TreeDiagram
                personas={personas}
                relaciones={relaciones}
                focalPersonId={focalPersonId}
                onSelectFocalPerson={setFocalPersonId}
              />
            )}
            {viewMode === 'grid' && (
              <TreeCardsView
                personas={personas}
                relaciones={relaciones}
                focalPersonId={focalPersonId}
                onSelectFocalPerson={setFocalPersonId}
              />
            )}
            {viewMode === 'table' && (
              <TreeTableView
                personas={personas}
                relaciones={relaciones}
                focalPersonId={focalPersonId}
                onSelectFocalPerson={setFocalPersonId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
