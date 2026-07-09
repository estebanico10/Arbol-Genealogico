import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft } from 'lucide-react';
import TreeDiagram from '../components/tree-view/TreeDiagram';

export default function TreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { arboles, selectedArbol, setSelectedArbol, loading, personas, relaciones } = useData();
  const [viewMode, setViewMode] = useState<'diagram' | 'grid' | 'table'>('diagram');

  useEffect(() => {
    if (id) {
      const arbol = arboles.find(a => a.id === id);
      if (arbol) {
        setSelectedArbol(arbol);
      } else if (!loading && arboles.length > 0) {
        navigate('/');
      }
    }
  }, [id, arboles, loading, setSelectedArbol, navigate]);

  if (loading || !selectedArbol) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/" className="inline-flex items-center text-sm font-medium opacity-70 hover:opacity-100 hover:text-primary transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a árboles
          </Link>
          <h1 className="text-3xl font-bold text-primary">{selectedArbol.nombre}</h1>
        </div>
        
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button 
            onClick={() => setViewMode('diagram')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'diagram' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'opacity-70 hover:opacity-100'}`}
          >
            Diagrama
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'opacity-70 hover:opacity-100'}`}
          >
            Tarjetas
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'opacity-70 hover:opacity-100'}`}
          >
            Tabla
          </button>
        </div>
      </div>

      <div className="flex-1 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
        {personas.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-xl font-medium mb-2">Este árbol está vacío</p>
              <p className="opacity-70">Ingresa como administrador para empezar a añadir personas.</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'diagram' && <TreeDiagram personas={personas} relaciones={relaciones} />}
            {viewMode === 'grid' && <div className="p-8 text-center text-xl">Grid (Pendiente)</div>}
            {viewMode === 'table' && <div className="p-8 text-center text-xl">Tabla (Pendiente)</div>}
          </>
        )}
      </div>
    </div>
  );
}
