import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import { TipoRelacion } from '../../types/database';
import { Plus, Trash2 } from 'lucide-react';

interface RelationManagerProps {
  arbolId: string;
}

const TIPO_RELACIONES: { value: TipoRelacion; label: string }[] = [
  { value: 'padre', label: 'Es Padre de' },
  { value: 'madre', label: 'Es Madre de' },
  { value: 'hijo', label: 'Es Hijo de' },
  { value: 'hija', label: 'Es Hija de' },
  { value: 'esposo', label: 'Es Esposo de' },
  { value: 'esposa', label: 'Es Esposa de' },
  { value: 'hermano', label: 'Es Hermano de' },
  { value: 'hermana', label: 'Es Hermana de' },
];

export default function RelationManager({ arbolId }: RelationManagerProps) {
  const { personas, relaciones, fetchDataForArbol } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [personaId1, setPersonaId1] = useState('');
  const [personaId2, setPersonaId2] = useState('');
  const [tipoRelacion, setTipoRelacion] = useState<TipoRelacion>('padre');

  useEffect(() => {
    fetchDataForArbol(arbolId);
  }, [arbolId, fetchDataForArbol]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personaId1 || !personaId2 || !tipoRelacion) return alert('Todos los campos son obligatorios');
    if (personaId1 === personaId2) return alert('Una persona no puede relacionarse consigo misma');

    const data = {
      arbol_id: arbolId,
      persona_id_1: personaId1,
      persona_id_2: personaId2,
      tipo_relacion: tipoRelacion,
    };

    const { error } = await supabase.from('relaciones').insert([data]);
    if (error) alert('Error: ' + error.message);
    
    setIsModalOpen(false);
    setPersonaId1('');
    setPersonaId2('');
    fetchDataForArbol(arbolId);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta relación?')) {
      const { error } = await supabase.from('relaciones').delete().eq('id', id);
      if (error) alert('Error: ' + error.message);
      else fetchDataForArbol(arbolId);
    }
  };

  const getPersonName = (id: string) => {
    const p = personas.find(p => p.id === id);
    return p ? `${p.nombres || ''} ${p.apellidos}`.trim() : 'Desconocido';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Relaciones</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
          disabled={personas.length < 2}
        >
          <Plus className="w-4 h-4" /> Agregar Relación
        </button>
      </div>

      {personas.length < 2 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
          Debes crear al menos dos personas para poder establecer relaciones.
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {relaciones.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No hay relaciones definidas aún.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 font-semibold">Persona 1</th>
                <th className="p-3 font-semibold">Relación</th>
                <th className="p-3 font-semibold">Persona 2</th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {relaciones.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-medium">{getPersonName(r.persona_id_1)}</td>
                  <td className="p-3 opacity-70 italic">{r.tipo_relacion}</td>
                  <td className="p-3 font-medium">{getPersonName(r.persona_id_2)}</td>
                  <td className="p-3 flex justify-end gap-2">
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg">Nueva Relación</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Persona 1</label>
                <select 
                  value={personaId1} 
                  onChange={e => setPersonaId1(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-primary"
                >
                  <option value="">Selecciona una persona</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Es...</label>
                <select 
                  value={tipoRelacion} 
                  onChange={e => setTipoRelacion(e.target.value as TipoRelacion)} 
                  required 
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-primary"
                >
                  {TIPO_RELACIONES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">De Persona 2</label>
                <select 
                  value={personaId2} 
                  onChange={e => setPersonaId2(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-primary"
                >
                  <option value="">Selecciona una persona</option>
                  {personas.filter(p => p.id !== personaId1).map(p => (
                    <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 opacity-70 hover:opacity-100 font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-blue-600">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
