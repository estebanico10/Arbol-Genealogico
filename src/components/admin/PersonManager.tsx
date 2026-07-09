import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import { Persona } from '../../types/database';
import { Plus, Edit2, Trash2, Search, UserPlus } from 'lucide-react';

interface PersonManagerProps {
  arbolId: string;
}

type QuickRelacionType = '' | 'es_padre' | 'es_hijo' | 'es_conyuge' | 'es_hermano';

export default function PersonManager({ arbolId }: PersonManagerProps) {
  const { personas, fetchDataForArbol } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [activeTab, setActiveTab] = useState<'basico' | 'fechas' | 'contacto'>('basico');
  const [searchTerm, setSearchTerm] = useState('');

  // Campos de Persona
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [apodo, setApodo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [lugarNacimiento, setLugarNacimiento] = useState('');
  const [fechaFallecimiento, setFechaFallecimiento] = useState('');
  const [lugarFallecimiento, setLugarFallecimiento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('');
  const [profesion, setProfesion] = useState('');
  const [biografia, setBiografia] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [cedula, setCedula] = useState('');
  const [saving, setSaving] = useState(false);

  // Creador Familiar Rápido (1-Click Family Builder)
  const [quickFamiliarId, setQuickFamiliarId] = useState('');
  const [quickRelacion, setQuickRelacion] = useState<QuickRelacionType>('');

  useEffect(() => {
    fetchDataForArbol(arbolId);
  }, [arbolId, fetchDataForArbol]);

  const resetForm = () => {
    setNombres('');
    setApellidos('');
    setApodo('');
    setFechaNacimiento('');
    setLugarNacimiento('');
    setFechaFallecimiento('');
    setLugarFallecimiento('');
    setEmail('');
    setTelefono('');
    setCelular('');
    setProfesion('');
    setBiografia('');
    setFotoUrl('');
    setCedula('');
    setQuickFamiliarId('');
    setQuickRelacion('');
    setActiveTab('basico');
  };

  const openModal = (persona?: Persona, familiarVinculadoId?: string, relacionSugerida?: QuickRelacionType) => {
    if (persona) {
      setEditingPersona(persona);
      setNombres(persona.nombres || '');
      setApellidos(persona.apellidos || '');
      setApodo(persona.apodo || '');
      setFechaNacimiento(persona.fecha_nacimiento || '');
      setLugarNacimiento(persona.lugar_nacimiento || '');
      setFechaFallecimiento(persona.fecha_fallecimiento || '');
      setLugarFallecimiento(persona.lugar_fallecimiento || '');
      setEmail(persona.email || '');
      setTelefono(persona.telefono || '');
      setCelular(persona.celular || '');
      setProfesion(persona.profesion || '');
      setBiografia(persona.biografia || '');
      setFotoUrl(persona.foto || '');
      setCedula(persona.cedula || '');
      setQuickFamiliarId('');
      setQuickRelacion('');
    } else {
      setEditingPersona(null);
      resetForm();
      if (familiarVinculadoId && relacionSugerida) {
        setQuickFamiliarId(familiarVinculadoId);
        setQuickRelacion(relacionSugerida);
      }
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres || !apellidos) {
      return alert('Nombres y Apellidos son obligatorios');
    }

    setSaving(true);
    const dataPersona = {
      arbol_id: arbolId,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      apodo: apodo.trim() || null,
      fecha_nacimiento: fechaNacimiento || null,
      lugar_nacimiento: lugarNacimiento.trim() || null,
      fecha_fallecimiento: fechaFallecimiento || null,
      lugar_fallecimiento: lugarFallecimiento.trim() || null,
      email: email.trim() || null,
      telefono: telefono.trim() || null,
      celular: celular.trim() || null,
      profesion: profesion.trim() || null,
      biografia: biografia.trim() || null,
      foto: fotoUrl.trim() || null,
      cedula: cedula.trim() || null,
    };

    if (editingPersona) {
      const { error } = await supabase
        .from('personas')
        .update(dataPersona)
        .eq('id', editingPersona.id);

      if (error) {
        alert('Error al actualizar persona: ' + error.message);
      } else {
        setIsModalOpen(false);
        await fetchDataForArbol(arbolId, true);
      }
    } else {
      // Insertar nueva persona y opcionalmente su relación en 1 clic
      const { data: newPersonas, error } = await supabase
        .from('personas')
        .insert([dataPersona])
        .select();

      if (error || !newPersonas || newPersonas.length === 0) {
        alert('Error al crear persona: ' + (error?.message || 'Error desconocido'));
      } else {
        const nuevaPersona = newPersonas[0];

        // Si el usuario eligió vincular familiar rápidamente, insertar la relación en Supabase
        if (quickFamiliarId && quickRelacion) {
          let p1 = '';
          let p2 = '';
          let tipoRel: 'padre' | 'esposo' | 'hermano' = 'padre';

          if (quickRelacion === 'es_hijo') {
            // El familiar existente es padre del nuevo miembro
            p1 = quickFamiliarId;
            p2 = nuevaPersona.id;
            tipoRel = 'padre';
          } else if (quickRelacion === 'es_padre') {
            // El nuevo miembro es padre del familiar existente
            p1 = nuevaPersona.id;
            p2 = quickFamiliarId;
            tipoRel = 'padre';
          } else if (quickRelacion === 'es_conyuge') {
            p1 = nuevaPersona.id;
            p2 = quickFamiliarId;
            tipoRel = 'esposo';
          } else if (quickRelacion === 'es_hermano') {
            p1 = nuevaPersona.id;
            p2 = quickFamiliarId;
            tipoRel = 'hermano';
          }

          if (p1 && p2) {
            const relData = {
              arbol_id: arbolId,
              persona_id_1: p1,
              persona_id_2: p2,
              tipo_relacion: tipoRel,
            };
            const relRes = await supabase.from('relaciones').insert([relData]);
            if (relRes.error) {
              console.error('Error creando relación rápida:', relRes.error);
            }
          }
        }

        setIsModalOpen(false);
        await fetchDataForArbol(arbolId, true);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar a esta persona? También se eliminarán sus relaciones del árbol.')) {
      const { error } = await supabase.from('personas').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar persona: ' + error.message);
      } else {
        await fetchDataForArbol(arbolId, true);
      }
    }
  };

  const filteredPersonas = personas.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.nombres || '').toLowerCase().includes(term) ||
      (p.apellidos || '').toLowerCase().includes(term) ||
      (p.apodo || '').toLowerCase().includes(term)
    );
  });

  const getFamiliarName = (id: string) => {
    const f = personas.find((x) => x.id === id);
    return f ? `${f.nombres} ${f.apellidos}` : '';
  };

  return (
    <div className="space-y-4">
      {/* Encabezado Miembros / Personas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Miembros / Personas</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total: {personas.length} {personas.length === 1 ? 'persona' : 'personas'}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Persona</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o apodo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Tabla de Personas con botón + Familiar directo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredPersonas.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            {searchTerm ? 'No se encontraron personas con esa búsqueda.' : 'No hay personas en este árbol todavía.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Persona</th>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Fechas</th>
                  <th className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">Lugar</th>
                  <th className="p-3.5 font-semibold text-right text-gray-700 dark:text-gray-300">Acciones Rápida y Edición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPersonas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {p.foto ? (
                            <img src={p.foto} alt={p.nombres || ''} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            `${(p.nombres || '').charAt(0)}${(p.apellidos || '').charAt(0)}`
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {p.nombres} {p.apellidos}
                          </p>
                          {p.apodo && (
                            <span className="text-xs text-primary font-medium">
                              "{p.apodo}"
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-gray-600 dark:text-gray-400">
                      <div>n. {p.fecha_nacimiento || '—'}</div>
                      {p.fecha_fallecimiento && <div>f. {p.fecha_fallecimiento}</div>}
                    </td>
                    <td className="p-3.5 text-xs text-gray-600 dark:text-gray-400">
                      {p.lugar_nacimiento || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {/* Botón rápido para vincular familiar en 1 clic */}
                        <button
                          onClick={() => openModal(undefined, p.id, 'es_hijo')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg text-xs font-semibold transition-colors"
                          title={`Agregar un hijo/a o familiar directo a ${p.nombres}`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Familiar</span>
                        </button>
                        <button
                          onClick={() => openModal(p)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar persona"
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

      {/* Modal Crear / Editar Persona */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {editingPersona ? 'Editar Miembro de la Familia' : 'Nuevo Miembro de la Familia'}
                </h3>
                {!editingPersona && quickFamiliarId && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ⚡ Creación rápida conectada con {getFamiliarName(quickFamiliarId)}
                  </p>
                )}
              </div>
            </div>

            {/* Pestañas de Navegación del Modal */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 bg-gray-50 dark:bg-gray-900/40">
              <button
                type="button"
                onClick={() => setActiveTab('basico')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'basico'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                1. Datos Básicos {(!editingPersona && quickFamiliarId) ? '& Parentesco' : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fechas')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'fechas'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                2. Fechas y Lugares
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contacto')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'contacto'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                3. Contacto y Biografía
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {activeTab === 'basico' && (
                <div className="space-y-4">
                  {/* SECCIÓN 1-CLICK FAMILY BUILDER (SOLO EN NUEVA PERSONA) */}
                  {!editingPersona && personas.length > 0 && (
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 space-y-3">
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                        🔗 Conexión Familiar Rápida (Opcional)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Familiar en el árbol
                          </label>
                          <select
                            value={quickFamiliarId}
                            onChange={(e) => setQuickFamiliarId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                          >
                            <option value="">-- Sin conexión automática --</option>
                            {personas.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombres} {p.apellidos}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            ¿Qué es de este familiar?
                          </label>
                          <select
                            value={quickRelacion}
                            onChange={(e) => setQuickRelacion(e.target.value as QuickRelacionType)}
                            disabled={!quickFamiliarId}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50"
                          >
                            <option value="es_hijo">Es Hijo / Hija de {getFamiliarName(quickFamiliarId)}</option>
                            <option value="es_padre">Es Padre / Madre de {getFamiliarName(quickFamiliarId)}</option>
                            <option value="es_conyuge">Es Cónyuge / Pareja de {getFamiliarName(quickFamiliarId)}</option>
                            <option value="es_hermano">Es Hermano / Hermana de {getFamiliarName(quickFamiliarId)}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        required
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        placeholder="Ej: David Daniel"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        required
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        placeholder="Ej: Nicola Olvera"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Apodo / Nombre Cariñoso
                      </label>
                      <input
                        type="text"
                        value={apodo}
                        onChange={(e) => setApodo(e.target.value)}
                        placeholder="Ej: Dany"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Cédula / Identificador
                      </label>
                      <input
                        type="text"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        placeholder="Ej: 1712345678"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      URL de Foto de Perfil
                    </label>
                    <input
                      type="url"
                      value={fotoUrl}
                      onChange={(e) => setFotoUrl(e.target.value)}
                      placeholder="https://ejemplo.com/foto.jpg"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'fechas' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Lugar de Nacimiento
                      </label>
                      <input
                        type="text"
                        value={lugarNacimiento}
                        onChange={(e) => setLugarNacimiento(e.target.value)}
                        placeholder="Ej: Quito, Ecuador"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Fecha de Fallecimiento
                      </label>
                      <input
                        type="date"
                        value={fechaFallecimiento}
                        onChange={(e) => setFechaFallecimiento(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Lugar de Fallecimiento
                      </label>
                      <input
                        type="text"
                        value={lugarFallecimiento}
                        onChange={(e) => setLugarFallecimiento(e.target.value)}
                        placeholder="Ej: Guayaquil, Ecuador"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contacto' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="familiar@ejemplo.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Profesión / Ocupación
                      </label>
                      <input
                        type="text"
                        value={profesion}
                        onChange={(e) => setProfesion(e.target.value)}
                        placeholder="Ej: Ingeniero de Sistemas"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Teléfono Fijo
                      </label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: 02-2345678"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Teléfono Celular / Móvil
                      </label>
                      <input
                        type="tel"
                        value={celular}
                        onChange={(e) => setCelular(e.target.value)}
                        placeholder="Ej: 0991234567"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Biografía / Notas
                    </label>
                    <textarea
                      rows={3}
                      value={biografia}
                      onChange={(e) => setBiografia(e.target.value)}
                      placeholder="Anécdotas, historia familiar o notas relevantes..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary text-sm"
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
                  {saving ? 'Guardando...' : editingPersona ? 'Guardar Cambios' : 'Crear Persona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
