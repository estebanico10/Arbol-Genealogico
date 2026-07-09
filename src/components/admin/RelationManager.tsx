import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import { TipoRelacion, Relacion } from '../../types/database';
import { Plus, Trash2, Edit2, ArrowRight } from 'lucide-react';

interface RelationManagerProps {
  arbolId: string;
}

const TIPO_RELACIONES: { value: TipoRelacion; label: string }[] = [
  { value: 'padre', label: 'Es Padre de' },
  { value: 'madre', label: 'Es Madre de' },
  { value: 'hijo', label: 'Es Hijo de' },
  { value: 'hija', label: 'Es Hija de' },
  { value: 'esposo', label: 'Es Esposo / Cónyuge de' },
  { value: 'esposa', label: 'Es Esposa / Cónyuge de' },
  { value: 'hermano', label: 'Es Hermano de' },
  { value: 'hermana', label: 'Es Hermana de' },
];

export default function RelationManager({ arbolId }: RelationManagerProps) {
  const { personas, relaciones, fetchDataForArbol } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelacion, setEditingRelacion] = useState<Relacion | null>(null);

  // Form state
  const [personaId1, setPersonaId1] = useState('');
  const [personaId2, setPersonaId2] = useState('');
  const [tipoRelacion, setTipoRelacion] = useState<TipoRelacion>('padre');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDataForArbol(arbolId);
  }, [arbolId, fetchDataForArbol]);

  const openModal = (rel?: Relacion) => {
    if (rel) {
      setEditingRelacion(rel);
      setPersonaId1(rel.persona_id_1);
      setPersonaId2(rel.persona_id_2);
      setTipoRelacion(rel.tipo_relacion);
    } else {
      setEditingRelacion(null);
      setPersonaId1('');
      setPersonaId2('');
      setTipoRelacion('padre');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personaId1 || !personaId2 || !tipoRelacion) {
      return alert('Todos los campos son obligatorios');
    }
    if (personaId1 === personaId2) {
      return alert('Una persona no puede relacionarse consigo misma');
    }

    setSaving(true);
    const data = {
      arbol_id: arbolId,
      persona_id_1: personaId1,
      persona_id_2: personaId2,
      tipo_relacion: tipoRelacion,
    };

    if (editingRelacion) {
      const { error } = await supabase.from('relaciones').update(data).eq('id', editingRelacion.id);
      if (error) {
        alert('Error al actualizar relación: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchDataForArbol(arbolId);
      }
    } else {
      const { error } = await supabase.from('relaciones').insert([data]);
      if (error) {
        alert('Error al crear relación: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchDataForArbol(arbolId);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta relación del árbol?')) {
      const { error } = await supabase.from('relaciones').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar relación: ' + error.message);
      } else {
        fetchDataForArbol(arbolId);
      }
    }
  };

  const getPersonName = (id: string) => {
    const p = personas.find((p) => p.id === id);
    return p ? `${p.nombres || ''} ${p.apellidos}`.trim() : 'Persona no encontrada';
  };

  const getRelationLabel = (tipo: TipoRelacion) => {
    const found = TIPO_RELACIONES.find((t) => t.value === tipo);
    return found ? found.label : tipo;
  };

  return (
    <div className="space-y-4">
      {/* Encabezado Relaciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Conexiones Familiares</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total: {relaciones.length} {relaciones.length === 1 ? 'conexión' : 'conexiones'}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 text-sm transition-colors shadow-sm"
          disabled={personas.length < 2}
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Conexión</span>
        </button>
      </div>

      {personas.length < 2 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-xl text-xs border border-yellow-200 dark:border-yellow-800/40">
          Debes crear al menos dos personas para poder establecer conexiones de parentesco.
        </div>
      )}

      {/* Tabla de Relaciones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {relaciones.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            No hay relaciones ni conexiones familiares definidas aún.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Persona Origen</th>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300 text-center">Parentesco</th>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Persona Destino</th>
                  <th className="p-3.5 font-semibold text-right text-gray-700 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {relaciones.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3.5 font-medium text-gray-900 dark:text-gray-100">
                      {getPersonName(r.persona_id_1)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-xs font-semibold rounded-full">
                        <span>{getRelationLabel(r.tipo_relacion)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-gray-900 dark:text-gray-100">
                      {getPersonName(r.persona_id_2)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openModal(r)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar conexión"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar conexión"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Relación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {editingRelacion ? 'Editar Conexión Familiar' : 'Nueva Conexión Familiar'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Persona Origen *
                </label>
                <select
                  value={personaId1}
                  onChange={(e) => setPersonaId1(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Selecciona una persona...</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombres} {p.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Relación de Parentesco *
                </label>
                <select
                  value={tipoRelacion}
                  onChange={(e) => setTipoRelacion(e.target.value as TipoRelacion)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {TIPO_RELACIONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  De (Persona Destino) *
                </label>
                <select
                  value={personaId2}
                  onChange={(e) => setPersonaId2(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Selecciona la persona vinculada...</option>
                  {personas
                    .filter((p) => p.id !== personaId1)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos}
                      </option>
                    ))}
                </select>
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
                  {saving ? 'Guardando...' : 'Guardar Conexión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
