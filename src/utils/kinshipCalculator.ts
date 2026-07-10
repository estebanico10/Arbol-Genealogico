import { Persona, Relacion } from '../types/database';

export type StepType = 'parent' | 'child' | 'spouse' | 'sibling';

interface GraphEdge {
  target: string;
  type: StepType;
}

/**
 * Infiere posible género de una persona por sus nombres o relaciones para devolver términos exactos (Padre/Madre, Hijo/Hija, etc.)
 */
function inferGender(personaId: string, personas: Persona[], relaciones: Relacion[]): 'M' | 'F' | 'unknown' {
  // 1. Revisar si aparece como 'padre', 'madre', 'hijo', 'hija', 'esposo', 'esposa', 'hermano', 'hermana' en relaciones
  for (const rel of relaciones) {
    if (rel.persona_id_1 === personaId) {
      if (['padre', 'hijo', 'esposo', 'hermano'].includes(rel.tipo_relacion)) return 'M';
      if (['madre', 'hija', 'esposa', 'hermana'].includes(rel.tipo_relacion)) return 'F';
    }
  }

  // 2. Revisar el primer nombre para heurística de género en nombres hispanos
  const p = personas.find((x) => x.id === personaId);
  if (p && p.nombres) {
    const primerNombre = p.nombres.trim().split(' ')[0].toLowerCase();
    const nombresMasculinos = ['david', 'esteban', 'juan', 'carlos', 'josé', 'luis', 'miguel', 'pedro', 'antonio', 'jorge', 'manuel', 'mario', 'andrés', 'nicolás', 'sergio', 'fernando', 'gabriel', 'roberto'];
    const nombresFemeninos = ['bertha', 'aime', 'maría', 'elizabeth', 'corina', 'ana', 'carmen', 'laura', 'sofía', 'isabel', 'paula', 'elena', 'clara', 'andrea', 'rosa', 'martha', 'lucía'];
    if (nombresMasculinos.includes(primerNombre)) return 'M';
    if (nombresFemeninos.includes(primerNombre)) return 'F';
    if (primerNombre.endsWith('a') && !['josé', 'joshua'].includes(primerNombre)) return 'F';
    if (primerNombre.endsWith('o') || primerNombre.endsWith('n') || primerNombre.endsWith('d')) return 'M';
  }

  return 'unknown';
}

/**
 * Construye grafo de adyacencia familiar con inferencia de hermanos por padres compartidos
 */
function buildKinshipGraph(personas: Persona[], relaciones: Relacion[]): Map<string, GraphEdge[]> {
  const adj = new Map<string, GraphEdge[]>();
  personas.forEach((p) => adj.set(p.id, []));

  const addEdge = (u: string, v: string, type: StepType) => {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u)!.push({ target: v, type });
  };

  for (const rel of relaciones) {
    const { persona_id_1: p1, persona_id_2: p2, tipo_relacion } = rel;
    if (tipo_relacion === 'padre' || tipo_relacion === 'madre') {
      addEdge(p1, p2, 'child');
      addEdge(p2, p1, 'parent');
    } else if (tipo_relacion === 'hijo' || tipo_relacion === 'hija') {
      addEdge(p1, p2, 'parent');
      addEdge(p2, p1, 'child');
    } else if (tipo_relacion === 'esposo' || tipo_relacion === 'esposa' || tipo_relacion === 'conyuge' || tipo_relacion === 'pareja' || tipo_relacion === 'novio' || tipo_relacion === 'novia') {
      addEdge(p1, p2, 'spouse');
      addEdge(p2, p1, 'spouse');
    } else if (tipo_relacion === 'hermano' || tipo_relacion === 'hermana') {
      addEdge(p1, p2, 'sibling');
      addEdge(p2, p1, 'sibling');
    }
  }

  // Inferir hermanos a partir de padres compartidos para asegurar transitividad en el grafo
  for (const [pId, edges] of adj.entries()) {
    const parents = edges.filter((e) => e.type === 'parent').map((e) => e.target);
    for (const [otherId, otherEdges] of adj.entries()) {
      if (pId === otherId) continue;
      const otherParents = otherEdges.filter((e) => e.type === 'parent').map((e) => e.target);
      const sharedParents = parents.filter((par) => otherParents.includes(par));
      if (sharedParents.length > 0) {
        const existing = adj.get(pId)!.some((e) => e.target === otherId);
        if (!existing) {
          addEdge(pId, otherId, 'sibling');
          addEdge(otherId, pId, 'sibling');
        }
      }
    }
  }

  return adj;
}

/**
 * Interpreta la secuencia de pasos BFS en un título de parentesco preciso en español
 */
function interpretPath(path: StepType[], targetGender: 'M' | 'F' | 'unknown'): string {
  if (path.length === 0) return 'Yo (Punto de Vista)';

  const isF = targetGender === 'F';

  // 1 paso
  if (path.length === 1) {
    const s = path[0];
    if (s === 'parent') return isF ? 'Madre' : 'Padre';
    if (s === 'child') return isF ? 'Hija' : 'Hijo';
    if (s === 'spouse') return isF ? 'Esposa' : 'Esposo';
    if (s === 'sibling') return isF ? 'Hermana' : 'Hermano';
  }

  // 2 pasos
  if (path.length === 2) {
    const [s1, s2] = path;
    // Abuelo/a: parent -> parent
    if (s1 === 'parent' && s2 === 'parent') return isF ? 'Abuela' : 'Abuelo';
    // Nieto/a: child -> child
    if (s1 === 'child' && s2 === 'child') return isF ? 'Nieta' : 'Nieto';
    // Tío/a: parent -> sibling
    if (s1 === 'parent' && s2 === 'sibling') return isF ? 'Tía' : 'Tío';
    // Sobrino/a: sibling -> child
    if (s1 === 'sibling' && s2 === 'child') return isF ? 'Sobrina' : 'Sobrino';
    // Suegro/a: spouse -> parent
    if (s1 === 'spouse' && s2 === 'parent') return isF ? 'Suegra' : 'Suegro';
    // Yerno/Nuera: child -> spouse
    if (s1 === 'child' && s2 === 'spouse') return isF ? 'Nuera' : 'Yerno';
    // Cuñado/a: spouse -> sibling OR sibling -> spouse
    if ((s1 === 'spouse' && s2 === 'sibling') || (s1 === 'sibling' && s2 === 'spouse')) {
      return isF ? 'Cuñada' : 'Cuñado';
    }
    // Hermano de padre a través de spouse temporal
    if (s1 === 'parent' && s2 === 'child') return isF ? 'Hermana' : 'Hermano';
  }

  // 3 pasos
  if (path.length === 3) {
    const [s1, s2, s3] = path;
    // Bisabuelo/a
    if (s1 === 'parent' && s2 === 'parent' && s3 === 'parent') return isF ? 'Bisabuela' : 'Bisabuelo';
    // Bisnieto/a
    if (s1 === 'child' && s2 === 'child' && s3 === 'child') return isF ? 'Bisnieta' : 'Bisnieto';
    // Primo hermano/a: parent -> sibling -> child
    if (s1 === 'parent' && s2 === 'sibling' && s3 === 'child') return isF ? 'Prima' : 'Primo';
    // Tío Abuelo/a: parent -> parent -> sibling
    if (s1 === 'parent' && s2 === 'parent' && s3 === 'sibling') return isF ? 'Tía Abuela' : 'Tío Abuelo';
    // Sobrino Nieto/a: sibling -> child -> child
    if (s1 === 'sibling' && s2 === 'child' && s3 === 'child') return isF ? 'Sobrina Nieta' : 'Sobrino Nieto';
  }

  // 4 pasos (Primos lejanos o tatarabuelos)
  if (path.length === 4) {
    const [s1, s2, s3, s4] = path;
    if (s1 === 'parent' && s2 === 'parent' && s3 === 'parent' && s4 === 'parent') {
      return isF ? 'Tatarabuela' : 'Tatarabuelo';
    }
    if (s1 === 'child' && s2 === 'child' && s3 === 'child' && s4 === 'child') {
      return isF ? 'Tataranieta' : 'Tataranieto';
    }
    // Primos segundos o lejanos
    if (s1 === 'parent' && s4 === 'child') return isF ? 'Prima Lejana' : 'Primo Lejano';
  }

  // Conteo genérico por saltos si es muy largo
  const parentsCount = path.filter((s) => s === 'parent').length;
  const childsCount = path.filter((s) => s === 'child').length;
  if (parentsCount > 0 && childsCount === 0) return `Ancestro (Gen. ${parentsCount})`;
  if (childsCount > 0 && parentsCount === 0) return `Descendiente (Gen. ${childsCount})`;

  return 'Familiar';
}

/**
 * Calcula el parentesco y generación para todas las personas desde el nodo focal en O(N)
 */
export function calculateAllKinships(
  focalPersonId: string | null | undefined,
  personas: Persona[],
  relaciones: Relacion[]
): Map<string, { kinship: string; generation: number }> {
  const result = new Map<string, { kinship: string; generation: number }>();
  if (!focalPersonId) return result;

  const adj = buildKinshipGraph(personas, relaciones);
  
  // BFS para encontrar rutas a todos los nodos
  const queue: Array<{ id: string; path: StepType[]; generation: number }> = [
    { id: focalPersonId, path: [], generation: 0 }
  ];
  const visited = new Set<string>([focalPersonId]);

  result.set(focalPersonId, { kinship: 'Yo (Punto de Vista)', generation: 0 });

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr.id) || [];
    
    for (const edge of neighbors) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        
        let nextGen = curr.generation;
        if (edge.type === 'parent') nextGen += 1;
        if (edge.type === 'child') nextGen -= 1;
        
        const newPath = [...curr.path, edge.type];
        const targetGender = inferGender(edge.target, personas, relaciones);
        const kinship = interpretPath(newPath, targetGender);
        
        result.set(edge.target, { kinship, generation: nextGen });
        
        queue.push({
          id: edge.target,
          path: newPath,
          generation: nextGen,
        });
      }
    }
  }

  // Set default for unvisited
  personas.forEach(p => {
    if (!result.has(p.id)) {
      result.set(p.id, { kinship: 'Familiar / Sin conexión', generation: 0 });
    }
  });

  return result;
}

export function calculateKinship(
  focalPersonId: string | null | undefined,
  targetPersonId: string,
  personas: Persona[],
  relaciones: Relacion[]
): string | null {
  const map = calculateAllKinships(focalPersonId, personas, relaciones);
  return map.get(targetPersonId)?.kinship || null;
}

