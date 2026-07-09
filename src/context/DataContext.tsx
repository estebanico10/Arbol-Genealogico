import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Arbol, Persona, Relacion } from '../types/database';

interface DataContextType {
  arboles: Arbol[];
  personas: Persona[];
  relaciones: Relacion[];
  loading: boolean;
  selectedArbol: Arbol | null;
  setSelectedArbol: (arbol: Arbol | null) => void;
  fetchArboles: () => Promise<void>;
  fetchArbolById: (arbolId: string) => Promise<Arbol | null>;
  fetchDataForArbol: (arbolId: string, force?: boolean) => Promise<void>;
  clearSelectedArbol: () => void;
}

const DataContext = createContext<DataContextType>({
  arboles: [],
  personas: [],
  relaciones: [],
  loading: true,
  selectedArbol: null,
  setSelectedArbol: () => {},
  fetchArboles: async () => {},
  fetchArbolById: async () => null,
  fetchDataForArbol: async () => {},
  clearSelectedArbol: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArbol, setSelectedArbol] = useState<Arbol | null>(null);

  // Ref para dedespliegue de peticiones simultáneas (deduplicar llamadas a fetchDataForArbol en vuelo)
  const inflightFetchRef = useRef<{ [key: string]: Promise<void> | undefined }>({});

  const fetchArboles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('arboles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching arboles:', error);
    } else {
      setArboles(data || []);
    }
    setLoading(false);
  }, []);

  const fetchArbolById = useCallback(async (arbolId: string): Promise<Arbol | null> => {
    // Primero verificar si ya lo tenemos en el array en memoria
    const cached = arboles.find((a) => a.id === arbolId);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('arboles')
      .select('*')
      .eq('id', arbolId)
      .single();

    if (error || !data) {
      console.error('Error fetching arbol by id:', error);
      return null;
    }
    setArboles((prev) => (prev.some((a) => a.id === data.id) ? prev : [data, ...prev]));
    return data;
  }, [arboles]);

  const fetchDataForArbol = useCallback(async (arbolId: string, force = false) => {
    // Si ya hay una petición en vuelo para este mismo arbolId y no es forzada, reutilizarla
    if (!force && inflightFetchRef.current[arbolId]) {
      return inflightFetchRef.current[arbolId];
    }

    const fetchPromise = (async () => {
      setLoading(true);
      const [resPersonas, resRelaciones] = await Promise.all([
        supabase.from('personas').select('*').eq('arbol_id', arbolId).order('nombres', { ascending: true }),
        supabase.from('relaciones').select('*').eq('arbol_id', arbolId)
      ]);

      if (resPersonas.error) console.error('Error personas:', resPersonas.error);
      else setPersonas(resPersonas.data || []);

      if (resRelaciones.error) console.error('Error relaciones:', resRelaciones.error);
      else setRelaciones(resRelaciones.data || []);

      setLoading(false);
      delete inflightFetchRef.current[arbolId];
    })();

    inflightFetchRef.current[arbolId] = fetchPromise;
    return fetchPromise;
  }, []);

  const clearSelectedArbol = useCallback(() => {
    setSelectedArbol(null);
    setPersonas([]);
    setRelaciones([]);
  }, []);

  useEffect(() => {
    fetchArboles();
  }, [fetchArboles]);

  useEffect(() => {
    if (selectedArbol) {
      fetchDataForArbol(selectedArbol.id);
    } else {
      clearSelectedArbol();
    }
  }, [selectedArbol, fetchDataForArbol, clearSelectedArbol]);

  return (
    <DataContext.Provider value={{
      arboles,
      personas,
      relaciones,
      loading,
      selectedArbol,
      setSelectedArbol,
      fetchArboles,
      fetchArbolById,
      fetchDataForArbol,
      clearSelectedArbol
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
