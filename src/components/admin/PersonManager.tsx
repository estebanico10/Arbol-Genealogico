import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import { Persona } from '../../types/database';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface PersonManagerProps {
  arbolId: string;
}

export default function PersonManager({ arbolId }: PersonManagerProps) {
  const { personas, fetchDataForArbol } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Persona | null>(null);
  const [activeTab, setActiveTab] = useState<'basicos' | 'fechas' | 'contacto'>('basicos');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State (100% controlado)
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [apodo, setApodo] = useState('');
  const [cedula, setCedula] = useState('');
  const [foto, setFoto] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [lugarNacimiento, setLugarNacimiento] = useState('');
  const [fechaFallecimiento, setFechaFallecimiento] = useState('');
  const [lugarFallecimiento, setLugarFallecimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [profesion, setProfesion] = useState('');
  const [biografia, setBiografia] = useState('');

  useEffect(() => {
    fetchDataForArbol(arbolId);
  }, [arbolId, fetchDataForArbol]);

  const filteredPersonas = useMemo(() => {
    if (!searchQuery.trim()) return personas;
    const q = searchQuery.toLowerCase();
    return personas.filter(
      (p) =>
        (p.nombres && p.nombres.toLowerCase().includes(q)) ||
        p.apellidos.toLowerCase().includes(q) ||
        (p.apodo && p.apodo.toLowerCase().includes(q))
    );
  }, [personas, searchQuery]);

  const openModal = (person?: Persona) => {
    if (person) {
      setEditingPerson(person);
      setNombres(person.nombres || '');
      setApellidos(person.apellidos || '');
      setApodo(person.apodo || '');
      setCedula(person.cedula || '');
      setFoto(person.foto || '');
      setFechaNacimiento(person.fecha_nacimiento || '');
      setLugarNacimiento(person.lugar_nacimiento || '');
      setFechaFallecimiento(person.fecha_fallecimiento || '');
      setLugarFallecimiento(person.lugar_fallecimiento || '');
      setTelefono(person.telefono || '');
      setCelular(person.celular || '');
      setEmail(person.email || '');
      setProfesion(person.profesion || '');
      setBiografia(person.biografia || '');
    } else {
      setEditingPerson(null);
      setNombres('');
      setApellidos('');
      setApodo('');
      setCedula('');
      setFoto('');
      setFechaNacimiento('');
      setLugarNacimiento('');
      setFechaFallecimiento('');
      setLugarFallecimiento('');
      setTelefono('');
      setCelular('');
      setEmail('');
      setProfesion('');
      setBiografia('');
    }
    setActiveTab('basicos');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apellidos.trim()) {
      return alert('Los apellidos son obligatorios');
    }
    setSaving(true);

    const data: Record<string, any> = {
      arbol_id: arbolId,
      nombres: nombres.trim() || null,
      apellidos: apellidos.trim(),
      foto: foto.trim() || null,
      cedula: cedula.trim() || null,
      fecha_nacimiento: fechaNacimiento || null,
      lugar_nacimiento: lugarNacimiento.trim() || null,
      fecha_fallecimiento: fechaFallecimiento || null,
      lugar_fallecimiento: lugarFallecimiento.trim() || null,
      telefono: telefono.trim() || null,
      celular: celular.trim() || null,
      email: email.trim() || null,
      biografia: biografia.trim() || null,
    };

    if (editingPerson) {
      const { error } = await supabase.from('personas').update(data).eq('id', editingPerson.id);
      if (error) {
        alert('Error al actualizar persona: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchDataForArbol(arbolId);
      }
    } else {
      const { error } = await supabase.from('personas').insert([data]);
      if (error) {
        alert('Error al crear persona: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchDataForArbol(arbolId);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta persona y todas sus relaciones?')) {
      const { error } = await supabase.from('personas').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar persona: ' + error.message);
      } else {
        fetchDataForArbol(arbolId);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado Personas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Miembros / Personas</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total: {personas.length} {personas.length === 1 ? 'persona' : 'personas'}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Persona</span>
        </button>
      </div>

      {/* Buscador de Personas */}
      {personas.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o apodo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Tabla de Personas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredPersonas.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            {personas.length === 0
              ? 'No hay personas en este árbol aún. Haz clic en "Agregar Persona".'
              : 'No se encontraron personas con esa búsqueda.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Persona</th>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Fechas</th>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Lugar</th>
                  <th className="p-3.5 font-semibold text-right text-gray-700 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPersonas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {p.foto ? (
                          <img src={p.foto} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {(p.nombres?.[0] || '').toUpperCase()}{(p.apellidos?.[0] || '').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {p.nombres} {p.apellidos}
                          </div>
                          {p.apodo && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">"{p.apodo}"</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-gray-600 dark:text-gray-300">
                      <div>n. {p.fecha_nacimiento || '—'}</div>
                      {p.fecha_fallecimiento && <div className="text-gray-400">f. {p.fecha_fallecimiento}</div>}
                    </td>
                    <td className="p-3.5 text-xs text-gray-600 dark:text-gray-300">
                      {p.lugar_nacimiento || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openModal(p)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar todos los campos"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar persona"
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

      {/* Modal Editar / Crear Persona */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {editingPerson ? `Editar: ${editingPerson.nombres || ''} ${editingPerson.apellidos}` : 'Nueva Persona'}
              </h3>
            </div>

            {/* Pestañas de secciones para que sea claro y organizado */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 gap-6 bg-gray-50/50 dark:bg-gray-900/40 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('basicos')}
                className={`py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'basicos'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Datos Básicos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fechas')}
                className={`py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'fechas'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Fechas y Lugares
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contacto')}
                className={`py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'contacto'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Contacto y Biografía
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {activeTab === 'basicos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Nombres
                      </label>
                      <input
                        type="text"
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        placeholder="ej: Esteban"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        required
                        placeholder="ej: Nicola"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Apodo / Nombre Cariñoso
                      </label>
                      <input
                        type="text"
                        value={apodo}
                        onChange={(e) => setApodo(e.target.value)}
                        placeholder="ej: Tío Este"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Cédula / Documento ID
                      </label>
                      <input
                        type="text"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        placeholder="ej: 1712345678"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      URL de Foto
                    </label>
                    <input
                      type="url"
                      value={foto}
                      onChange={(e) => setFoto(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'fechas' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Lugar de Nacimiento
                      </label>
                      <input
                        type="text"
                        value={lugarNacimiento}
                        onChange={(e) => setLugarNacimiento(e.target.value)}
                        placeholder="ej: Quito, Ecuador"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Fecha de Defunción (Si aplica)
                      </label>
                      <input
                        type="date"
                        value={fechaFallecimiento}
                        onChange={(e) => setFechaFallecimiento(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Lugar de Defunción
                      </label>
                      <input
                        type="text"
                        value={lugarFallecimiento}
                        onChange={(e) => setLugarFallecimiento(e.target.value)}
                        placeholder="ej: Guayaquil, Ecuador"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contacto' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ej: correo@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Profesión / Ocupación
                      </label>
                      <input
                        type="text"
                        value={profesion}
                        onChange={(e) => setProfesion(e.target.value)}
                        placeholder="ej: Arquitecto / Ingeniero"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Teléfono Fijo
                      </label>
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="ej: 02-234-5678"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Teléfono Móvil / Celular
                      </label>
                      <input
                        type="text"
                        value={celular}
                        onChange={(e) => setCelular(e.target.value)}
                        placeholder="ej: +593 99 123 4567"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Biografía / Notas Personales
                    </label>
                    <textarea
                      rows={4}
                      value={biografia}
                      onChange={(e) => setBiografia(e.target.value)}
                      placeholder="Historia, anécdotas o detalles biográficos de la persona..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                    ></textarea>
                  </div>
                </div>
              )}

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
                  {saving ? 'Guardando...' : 'Guardar Persona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
