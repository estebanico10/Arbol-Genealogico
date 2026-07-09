import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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
  fetchDataForArbol: (arbolId: string) => Promise<void>;
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
  fetchDataForArbol: async () => {},
  clearSelectedArbol: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArbol, setSelectedArbol] = useState<Arbol | null>(null);

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

  const fetchDataForArbol = useCallback(async (arbolId: string) => {
    setLoading(true);
    
    const [resPersonas, resRelaciones] = await Promise.all([
      supabase.from('personas').select('*').eq('arbol_id', arbolId),
      supabase.from('relaciones').select('*').eq('arbol_id', arbolId)
    ]);

    if (resPersonas.error) console.error('Error personas:', resPersonas.error);
    else setPersonas(resPersonas.data || []);

    if (resRelaciones.error) console.error('Error relaciones:', resRelaciones.error);
    else setRelaciones(resRelaciones.data || []);

    setLoading(false);
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
      fetchDataForArbol,
      clearSelectedArbol
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
