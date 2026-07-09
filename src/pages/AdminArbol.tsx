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
  const { arboles, selectedArbol, setSelectedArbol, loading: dataLoading } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id) {
      const arbol = arboles.find(a => a.id === id);
      if (arbol) {
        setSelectedArbol(arbol);
      }
    }
  }, [id, arboles, setSelectedArbol]);

  if (authLoading || dataLoading || !selectedArbol) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link to="/admin" className="inline-flex items-center text-sm font-medium opacity-70 hover:opacity-100 hover:text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-primary">Gestionar: {selectedArbol.nombre}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PersonManager arbolId={selectedArbol.id} />
        <RelationManager arbolId={selectedArbol.id} />
      </div>
    </div>
  );
}
