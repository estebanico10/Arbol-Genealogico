export interface Arbol {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  created_at: string;
}

export interface Persona {
  id: string;
  arbol_id: string;
  nombres: string | null;
  apellidos: string;
  foto: string | null;
  cedula: string | null;
  fecha_nacimiento: string | null;
  lugar_nacimiento: string | null;
  fecha_fallecimiento: string | null;
  lugar_fallecimiento: string | null;
  telefono: string | null;
  celular: string | null;
  email: string | null;
  biografia: string | null;
  created_at: string;
}

export type TipoRelacion = 'padre' | 'madre' | 'hijo' | 'hija' | 'esposo' | 'esposa' | 'conyuge' | 'hermano' | 'hermana' | 'pareja';

export interface Relacion {
  id: string;
  arbol_id: string;
  persona_id_1: string;
  persona_id_2: string;
  tipo_relacion: TipoRelacion;
  created_at: string;
}
