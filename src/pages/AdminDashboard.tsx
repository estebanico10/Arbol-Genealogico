import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { Plus, Settings, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { arboles, fetchArboles } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const handleCreateArbol = async () => {
    const nombre = prompt('Ingresa el nombre del nuevo árbol (ej: Familia Nicola)');
    if (!nombre) return;
    
    const { error } = await supabase.from('arboles').insert({ nombre });
    if (error) {
      alert('Error al crear árbol: ' + error.message);
    } else {
      fetchArboles();
    }
  };

  const handleDeleteArbol = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este árbol y todas sus personas? Esta acción no se puede deshacer.')) {
      const { error } = await supabase.from('arboles').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar árbol: ' + error.message);
      } else {
        fetchArboles();
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
          <p className="opacity-70 mt-1">Gestiona los árboles genealógicos y sus miembros</p>
        </div>
        <button 
          onClick={handleCreateArbol}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Árbol</span>
        </button>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold">Tus Árboles</h2>
        </div>
        
        {arboles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tienes árboles creados aún. Haz clic en "Nuevo Árbol" para empezar.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {arboles.map(arbol => (
              <li key={arbol.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div>
                  <h3 className="font-bold text-lg">{arbol.nombre}</h3>
                  <p className="text-sm opacity-70">
                    Creado el {new Date(arbol.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/tree/${arbol.id}`)}
                    className="p-2 text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Ver árbol"
                  >
                    Ver
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/tree/${arbol.id}`)}
                    className="p-2 opacity-70 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Configurar Personas/Relaciones"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteArbol(arbol.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Eliminar árbol"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
