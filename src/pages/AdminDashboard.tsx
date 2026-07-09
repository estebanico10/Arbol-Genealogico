import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { Arbol } from '../types/database';
import { Plus, Settings, Trash2, Edit2, LogOut, ShieldCheck, Image as ImageIcon } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { arboles, fetchArboles } = useData();
  const navigate = useNavigate();

  // Modal State para crear/editar Árbol
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArbol, setEditingArbol] = useState<Arbol | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const openTreeModal = (arbol?: Arbol) => {
    if (arbol) {
      setEditingArbol(arbol);
      setNombre(arbol.nombre || '');
      setDescripcion(arbol.descripcion || '');
      setImagen(arbol.imagen || '');
    } else {
      setEditingArbol(null);
      setNombre('');
      setDescripcion('');
      setImagen('');
    }
    setIsModalOpen(true);
  };

  const handleSaveArbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return alert('El nombre del árbol es obligatorio');
    setSaving(true);

    const data = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      imagen: imagen.trim() || null,
    };

    if (editingArbol) {
      const { error } = await supabase.from('arboles').update(data).eq('id', editingArbol.id);
      if (error) {
        alert('Error al actualizar árbol: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchArboles();
      }
    } else {
      const { error } = await supabase.from('arboles').insert([data]);
      if (error) {
        alert('Error al crear árbol: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchArboles();
      }
    }
    setSaving(false);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Encabezado Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Sesión activa: {user.email}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Panel de Administración</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Crea, edita y administra tus árboles genealógicos, personas y conexiones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openTreeModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Árbol</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Lista de Árboles */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Árboles Genealógicos</h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            {arboles.length} {arboles.length === 1 ? 'Árbol' : 'Árboles'}
          </span>
        </div>

        {arboles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No tienes árboles creados aún en el sistema.
            </p>
            <button
              onClick={() => openTreeModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear el Primer Árbol</span>
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {arboles.map((arbol) => (
              <li
                key={arbol.id}
                className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {arbol.imagen ? (
                    <img
                      src={arbol.imagen}
                      alt={arbol.nombre}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                      {arbol.nombre}
                    </h3>
                    {arbol.descripcion && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {arbol.descripcion}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Creado el {new Date(arbol.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => navigate(`/tree/${arbol.id}`)}
                    className="px-3 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                  >
                    Ver Árbol
                  </button>
                  <button
                    onClick={() => navigate(`/admin/tree/${arbol.id}`)}
                    className="px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Administrar Miembros</span>
                  </button>
                  <button
                    onClick={() => openTreeModal(arbol)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    title="Editar datos del árbol"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteArbol(arbol.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    title="Eliminar árbol"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal Crear / Editar Árbol */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {editingArbol ? 'Editar Árbol Genealógico' : 'Crear Nuevo Árbol'}
              </h3>
            </div>
            <form onSubmit={handleSaveArbol} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Nombre del Árbol *
                </label>
                <input
                  type="text"
                  placeholder="ej: Familia Nicola y Descendientes"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Descripción / Historia de la Familia
                </label>
                <textarea
                  rows={3}
                  placeholder="Notas o breve introducción sobre el linaje..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  URL de Imagen / Escudo (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imagen}
                  onChange={(e) => setImagen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary hover:bg-blue-600 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-70"
                >
                  {saving ? 'Guardando...' : 'Guardar Árbol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
