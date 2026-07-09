import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import { Persona } from '../../types/database';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface PersonManagerProps {
  arbolId: string;
}

export default function PersonManager({ arbolId }: PersonManagerProps) {
  const { personas, fetchDataForArbol } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Persona | null>(null);
  
  // Form state
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [lugarNacimiento, setLugarNacimiento] = useState('');

  // Make sure we load the right people
  useEffect(() => {
    fetchDataForArbol(arbolId);
  }, [arbolId, fetchDataForArbol]);

  const openModal = (person?: Persona) => {
    if (person) {
      setEditingPerson(person);
      setNombres(person.nombres || '');
      setApellidos(person.apellidos);
      setFechaNacimiento(person.fecha_nacimiento || '');
      setLugarNacimiento(person.lugar_nacimiento || '');
    } else {
      setEditingPerson(null);
      setNombres('');
      setApellidos('');
      setFechaNacimiento('');
      setLugarNacimiento('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apellidos) return alert('Los apellidos son obligatorios');

    const data = {
      arbol_id: arbolId,
      nombres: nombres || null,
      apellidos,
      fecha_nacimiento: fechaNacimiento || null,
      lugar_nacimiento: lugarNacimiento || null,
    };

    if (editingPerson) {
      const { error } = await supabase.from('personas').update(data).eq('id', editingPerson.id);
      if (error) alert('Error: ' + error.message);
    } else {
      const { error } = await supabase.from('personas').insert([data]);
      if (error) alert('Error: ' + error.message);
    }

    setIsModalOpen(false);
    fetchDataForArbol(arbolId);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta persona y todas sus relaciones?')) {
      const { error } = await supabase.from('personas').delete().eq('id', id);
      if (error) alert('Error: ' + error.message);
      else fetchDataForArbol(arbolId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Personas</h3>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Persona
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {personas.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No hay personas en este árbol aún.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 font-semibold">Nombre Completo</th>
                <th className="p-3 font-semibold">Nacimiento</th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {personas.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-medium">{p.nombres} {p.apellidos}</td>
                  <td className="p-3 opacity-70">
                    {p.fecha_nacimiento} {p.lugar_nacimiento && `(${p.lugar_nacimiento})`}
                  </td>
                  <td className="p-3 flex justify-end gap-2">
                    <button onClick={() => openModal(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
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
              <h3 className="font-bold text-lg">{editingPerson ? 'Editar Persona' : 'Nueva Persona'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Nombres</label>
                  <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Apellidos *</label>
                  <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} required className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Fecha Nacimiento</label>
                  <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Lugar Nacimiento</label>
                  <input type="text" value={lugarNacimiento} onChange={e => setLugarNacimiento(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-primary" />
                </div>
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
