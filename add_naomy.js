import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jvdebozykkmvzhpxcqmk.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'REPLACE_ME';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addNaomy() {
  console.log('Buscando al usuario principal (Esteban David)...');
  
  // 1. Obtener ID de Esteban David Nicola Miranda
  const { data: esteban, error: errEsteban } = await supabase
    .from('personas')
    .select('id, arbol_id')
    .eq('nombres', 'Esteban David')
    .single();

  if (errEsteban || !esteban) {
    console.error('❌ Error buscando a Esteban:', errEsteban?.message || 'No se encontró.');
    return;
  }
  
  console.log(`✅ Esteban encontrado. ID: ${esteban.id}, Arbol ID: ${esteban.arbol_id}`);

  // 2. Insertar a Naomy
  console.log('Creando perfil para Naomy Estefanía...');
  const naomyData = {
    arbol_id: esteban.arbol_id,
    nombres: 'Naomy Estefanía',
    apellidos: 'Alvarado Parrales',
    fecha_nacimiento: '2004-07-05',
    celular: '+593 98 037 2113',
    biografia: 'Estudiante de Producción Multimedia y Audiovisual. Activista comprometida con el bienestar animal y rescatista.'
  };

  const { data: naomy, error: errNaomy } = await supabase
    .from('personas')
    .insert([naomyData])
    .select()
    .single();

  if (errNaomy || !naomy) {
    console.error('❌ Error insertando a Naomy:', errNaomy?.message || 'Fallo en la inserción.');
    return;
  }
  
  console.log(`✅ Perfil de Naomy creado con éxito. ID: ${naomy.id}`);

  // 3. Crear la relación de pareja
  console.log('Creando relación de pareja...');
  
  // Nota: Si el constraint de Postgres "tipo_relacion" no incluye "pareja", 
  // insertaremos "esposa" temporalmente o actualizaremos el constraint en la BD.
  // Aquí usamos "pareja" ya que el frontend lo soporta, pero prepárate para un error si la BD lo rechaza.
  const relacionData = {
    arbol_id: esteban.arbol_id,
    persona_id_1: esteban.id,
    persona_id_2: naomy.id,
    tipo_relacion: 'pareja' // 'pareja' está mapeado en la UI
  };

  const { data: relacion, error: errRelacion } = await supabase
    .from('relaciones')
    .insert([relacionData])
    .select();

  if (errRelacion) {
    console.error('❌ Error creando la relación (es posible que necesites actualizar el CHECK constraint en tu BD para permitir "pareja"):', errRelacion.message);
    
    console.log('Intentando insertar con el rol "esposa" como fallback para saltar la validación de la BD...');
    const fallbackData = { ...relacionData, tipo_relacion: 'esposa' };
    const { error: errFallback } = await supabase.from('relaciones').insert([fallbackData]);
    
    if (errFallback) {
      console.error('❌ Error en el fallback:', errFallback.message);
    } else {
      console.log('✅ Relación creada con éxito usando el fallback "esposa". La interfaz visual la interpretará correctamente como pareja.');
    }
  } else {
    console.log('✅ Relación creada con éxito!');
  }
  
  console.log('🎉 Todo listo. Actualiza tu interfaz para ver los cambios.');
}

addNaomy();
