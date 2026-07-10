import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PersonManager from '../components/admin/PersonManager';
import RelationManager from '../components/admin/RelationManager';
import { ArrowLeft } from 'lucide-react';

export default function AdminArbol() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { arboles, selectedArbol, setSelectedArbol, fetchArbolById } = useData();
  const navigate = useNavigate();
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let active = true;
    const initTree = async () => {
      if (!id) return;
      setInitLoading(true);

      // Verificar si ya está seleccionado
      if (selectedArbol && selectedArbol.id === id) {
        setInitLoading(false);
        return;
      }

      // Buscar en array en memoria primero
      const foundInArray = arboles.find((a) => a.id === id);
      if (foundInArray) {
        setSelectedArbol(foundInArray);
        setInitLoading(false);
        return;
      }

      // Si no está en memoria (ej: acceso directo por URL o recarga rápida), buscar directamente
      const fetched = await fetchArbolById(id);
      if (active) {
        if (fetched) {
          setSelectedArbol(fetched);
        }
        setInitLoading(false);
      }
    };

    initTree();
    return () => {
      active = false;
    };
  }, [id, arboles, selectedArbol, setSelectedArbol, fetchArbolById]);

  if (authLoading || initLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-8 w-72 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedArbol) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl max-w-md border border-red-100 dark:border-red-900/50 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Árbol no encontrado</h2>
          <p className="text-sm mb-6 opacity-90">
            El árbol que intentas administrar no existe o no tienes permisos para acceder a él.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link to="/admin" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Gestionar: <span className="text-primary">{selectedArbol.nombre}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PersonManager arbolId={selectedArbol.id} />
        <RelationManager arbolId={selectedArbol.id} />
      </div>
    </div>
  );
}
