import { useCallback, useMemo, useState, useEffect, useTransition } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Persona, Relacion } from '../../types/database';
import dagre from 'dagre';
import { calculateAllKinships } from '../../utils/kinshipCalculator';
import PersonNode from './PersonNode';
import UnionNode from './UnionNode';
import { ParentChildEdge, SpouseEdge, SiblingEdge } from './customEdges';
import {
  Compass,
  Search,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  Focus,
  Target,
  Layers,
  Image as ImageIcon,
  Tag,
  ArrowUpDown,
  ArrowLeftRight,
  X,
} from 'lucide-react';

interface TreeDiagramProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson: (id: string | null) => void;
  onSelectPersonForDetail: (persona: Persona) => void;
}

/* =========================================================================
   BARRA FLOTANTE INTELIGENTE ESTILO FIGMA / MIRO (36x36px botones, radio 10px)
   ========================================================================= */
function FloatingSmartToolbar({
  personas,
  focalPersonId,
  onSelectFocalPerson,
  onSelectPersonForDetail,
  orientation,
  setOrientation,
  showLabels,
  setShowLabels,
  showPhotos,
  setShowPhotos,
  showGenerations,
  setShowGenerations,
}: {
  personas: Persona[];
  focalPersonId: string | null;
  onSelectFocalPerson: (id: string | null) => void;
  onSelectPersonForDetail: (persona: Persona) => void;
  orientation: 'TB' | 'LR';
  setOrientation: React.Dispatch<React.SetStateAction<'TB' | 'LR'>>;
  showLabels: boolean;
  setShowLabels: React.Dispatch<React.SetStateAction<boolean>>;
  showPhotos: boolean;
  setShowPhotos: React.Dispatch<React.SetStateAction<boolean>>;
  showGenerations: boolean;
  setShowGenerations: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { zoomIn, zoomOut, fitView, setCenter, getNode } = useReactFlow();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCenterOnFocal = () => {
    if (focalPersonId) {
      const node = getNode(focalPersonId);
      if (node) {
        setCenter(node.position.x + 135, node.position.y + 47, { zoom: 1, duration: 600 });
        return;
      }
    }
    fitView({ duration: 600, padding: 0.15 });
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return personas
      .filter(
        (p) =>
          p.nombres?.toLowerCase().includes(q) ||
          p.apellidos?.toLowerCase().includes(q) ||
          p.apodo?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [personas, searchQuery]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      {/* 1. Buscar Persona */}
      <div className="relative">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`w-9 h-9 flex items-center justify-center rounded-[10px] transition-all ${
            isSearchOpen
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Buscar persona en el árbol"
          aria-label="Buscar persona en el árbol"
        >
          <Search className="w-4 h-4" />
        </button>

        {isSearchOpen && (
          <div className="absolute bottom-12 left-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Buscar miembro
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Cerrar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Nombre o apellido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
              aria-label="Buscar por nombre o apellido"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPersonForDetail(p);
                      const n = getNode(p.id);
                      if (n) {
                        setCenter(n.position.x + 135, n.position.y + 47, { zoom: 1.1, duration: 600 });
                      }
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectPersonForDetail(p);
                        const n = getNode(p.id);
                        if (n) setCenter(n.position.x + 135, n.position.y + 47, { zoom: 1.1, duration: 600 });
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.nombres} {p.apellidos}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">Ver</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Selector de Punto de Vista */}
      <div className="relative flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-[10px] px-2.5 h-9">
        <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-1.5" />
        <select
          value={focalPersonId || ''}
          onChange={(e) => {
            const val = e.target.value || null;
            onSelectFocalPerson(val);
            if (val) {
              const n = getNode(val);
              if (n) {
                setCenter(n.position.x + 135, n.position.y + 47, { zoom: 1.05, duration: 600 });
              }
            }
          }}
          className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-200 border-none outline-none cursor-pointer pr-1 max-w-[130px] truncate"
          aria-label="Seleccionar punto de vista principal"
        >
          <option value="">Vista General</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos}
            </option>
          ))}
        </select>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* 3. Orientación Vertical / Horizontal */}
      <button
        onClick={() => setOrientation((prev) => (prev === 'TB' ? 'LR' : 'TB'))}
        className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={`Orientación: ${orientation === 'TB' ? 'Vertical' : 'Horizontal'}`}
        aria-label={`Orientación: ${orientation === 'TB' ? 'Vertical' : 'Horizontal'}`}
      >
        {orientation === 'TB' ? <ArrowUpDown className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
      </button>

      {/* 4. Mostrar etiquetas de parentesco (OFF por defecto) */}
      <button
        onClick={() => setShowLabels(!showLabels)}
        className={`w-9 h-9 flex items-center justify-center rounded-[10px] transition-all ${
          showLabels
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={showLabels ? 'Ocultar etiquetas de relación' : 'Mostrar etiquetas de relación'}
        aria-label={showLabels ? 'Ocultar etiquetas de relación' : 'Mostrar etiquetas de relación'}
      >
        <Tag className="w-4 h-4" />
      </button>

      {/* 5. Mostrar fotografías */}
      <button
        onClick={() => setShowPhotos(!showPhotos)}
        className={`w-9 h-9 flex items-center justify-center rounded-[10px] transition-all ${
          showPhotos
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Mostrar fotografías en nodos"
        aria-label="Mostrar fotografías en nodos"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* 6. Mostrar generaciones */}
      <button
        onClick={() => setShowGenerations(!showGenerations)}
        className={`w-9 h-9 flex items-center justify-center rounded-[10px] transition-all ${
          showGenerations
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Mostrar indicador de generación"
        aria-label="Mostrar indicador de generación"
      >
        <Layers className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* 7. Zoom In */}
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Acercar zoom"
        aria-label="Acercar zoom"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* 8. Zoom Out */}
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Alejar zoom"
        aria-label="Alejar zoom"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* 9. Ajustar al contenido (Fit to Screen) */}
      <button
        onClick={() => fitView({ duration: 600, padding: 0.15 })}
        className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Ajustar al contenido"
        aria-label="Ajustar al contenido"
      >
        <Focus className="w-4 h-4" />
      </button>

      {/* 10. Centrar en Punto de Vista */}
      <button
        onClick={handleCenterOnFocal}
        className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Centrar en Punto de Vista"
        aria-label="Centrar en Punto de Vista"
      >
        <Target className="w-4 h-4" />
      </button>

      {/* 11. Pantalla Completa */}
      <button
        onClick={toggleFullscreen}
        className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL DEL LIENZO (REDISEÑO MINIMALISTA PURO)
   ========================================================================= */
export default function TreeDiagram({
  personas,
  relaciones,
  focalPersonId,
  onSelectFocalPerson,
  onSelectPersonForDetail,
}: TreeDiagramProps) {
  const [orientation, setOrientation] = useState<'TB' | 'LR'>('TB');
  // LAS PALABRAS PADRE, MADRE, ESPOSA, HERMANO DESAPARECEN POR DEFECTO
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [showPhotos, setShowPhotos] = useState<boolean>(true);
  const [showGenerations, setShowGenerations] = useState<boolean>(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ person: PersonNode, union: UnionNode }), []);
  const edgeTypes = useMemo(() => ({ parentChild: ParentChildEdge, spouse: SpouseEdge, sibling: SiblingEdge }), []);

  // Mapeo de parientes directos para Focus Mode
  const directRelativesMap = useMemo(() => {
    const map = new Set<string>();
    if (!focalPersonId) return map;

    map.add(focalPersonId);
    relaciones.forEach((r) => {
      if (r.persona_id_1 === focalPersonId) map.add(r.persona_id_2);
      if (r.persona_id_2 === focalPersonId) map.add(r.persona_id_1);
    });
    return map;
  }, [focalPersonId, relaciones]);

  // Cálculo jerárquico con Dagre
  const getLayoutedElements = useCallback(
    (nodes: Node[], edges: Edge[], dir: 'TB' | 'LR') => {
      const g = new dagre.graphlib.Graph();
      g.setGraph({
        rankdir: dir,
        nodesep: 90,
        ranksep: 110,
      });
      g.setDefaultEdgeLabel(() => ({}));

      const defaultWidth = 270;
      const defaultHeight = 95;

      nodes.forEach((node) => {
        const w = node.style?.width ? Number(node.style.width) : defaultWidth;
        const h = node.style?.height ? Number(node.style.height) : defaultHeight;
        g.setNode(node.id, { width: w, height: h });
      });

      edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      dagre.layout(g);

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        const w = node.style?.width ? Number(node.style.width) : defaultWidth;
        const h = node.style?.height ? Number(node.style.height) : defaultHeight;

        return {
          ...node,
          position: {
            x: nodeWithPosition ? nodeWithPosition.x - w / 2 : 0,
            y: nodeWithPosition ? nodeWithPosition.y - h / 2 : 0,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  /* =========================================================================
     ESTRUCTURA NORMALIZADA: UNIÓN SUPERIOR DE PADRES & BUS COMPARTIDO DE HERMANOS
     ========================================================================= */
  const normalizedStructure = useMemo(() => {
    const parentMap = new Map<string, Set<string>>(); // childId -> Set<parentId>
    personas.forEach((p) => parentMap.set(p.id, new Set()));

    const coupleSet = new Set<string>(); // "p1|p2"
    const spousePairs: Array<[string, string]> = [];

    // 1. Cargar relaciones directas
    relaciones.forEach((r) => {
      const { persona_id_1: p1, persona_id_2: p2, tipo_relacion: t } = r;
      if (t === 'padre' || t === 'madre') {
        parentMap.get(p2)?.add(p1);
      } else if (t === 'hijo' || t === 'hija') {
        parentMap.get(p1)?.add(p2);
      } else if (t === 'conyuge' || t === 'esposo' || t === 'esposa' || t === 'pareja' || t === 'novia' || t === 'novio') {
        const k = p1 < p2 ? `${p1}|${p2}` : `${p2}|${p1}`;
        if (!coupleSet.has(k)) {
          coupleSet.add(k);
          spousePairs.push(p1 < p2 ? [p1, p2] : [p2, p1]);
        }
      }
    });

    // 2. Propagar padres entre hermanos (para que compartan la misma línea común)
    relaciones.forEach((r) => {
      const { persona_id_1: p1, persona_id_2: p2, tipo_relacion: t } = r;
      if (t === 'hermano' || t === 'hermana') {
        const parents1 = parentMap.get(p1);
        const parents2 = parentMap.get(p2);
        if (parents1 && parents2) {
          parents1.forEach((parentId) => parents2.add(parentId));
          parents2.forEach((parentId) => parents1.add(parentId));
        }
      }
    });

    // 3. Identificar parejas de padres por hijos compartidos
    personas.forEach((child) => {
      const parents = Array.from(parentMap.get(child.id) || []);
      if (parents.length >= 2) {
        for (let i = 0; i < parents.length; i++) {
          for (let j = i + 1; j < parents.length; j++) {
            const pa = parents[i];
            const pb = parents[j];
            const k = pa < pb ? `${pa}|${pb}` : `${pb}|${pa}`;
            if (!coupleSet.has(k)) {
              coupleSet.add(k);
              spousePairs.push(pa < pb ? [pa, pb] : [pb, pa]);
            }
          }
        }
      }
    });

    return { parentMap, spousePairs };
  }, [personas, relaciones]);

  // Nodos del lienzo (Personas + Nodos de Unión Superior de Pareja ♡)
  const initialNodes: Node[] = useMemo(() => {
    const activeCenterId = hoveredNodeId || focalPersonId;
    const result: Node[] = [];
    
    // O(N) map computation
    const kinshipsMap = calculateAllKinships(focalPersonId, personas, relaciones);

    // 1. Nodos de Persona
    personas.forEach((p) => {
      const isFocal = focalPersonId === p.id;
      const isDirectRelative = directRelativesMap.has(p.id);

      let isDimmed = false;
      if (activeCenterId && !isDirectRelative && p.id !== activeCenterId) {
        isDimmed = true;
      }

      const kinData = kinshipsMap.get(p.id);
      const kinship = kinData?.kinship || null;
      const generationValue = kinData?.generation;
      
      const badgeRole = isFocal ? 'Yo' : kinship || 'Familiar';
      const genString = generationValue !== undefined ? 
        (generationValue > 0 ? `Gen +${generationValue}` : generationValue < 0 ? `Gen ${generationValue}` : 'Misma Gen') : null;

      result.push({
        id: p.id,
        type: 'person',
        data: {
          persona: p,
          isFocal,
          kinship,
          badgeRole,
          showPhotos,
          showGenerations,
          showLabels,
          isDimmed,
          generation: genString,
          onSelect: onSelectPersonForDetail,
          onSetFocal: onSelectFocalPerson,
          onHover: setHoveredNodeId,
          index: result.length // passed for staggered animation
        },
        position: { x: 0, y: 0 },
        style: {
          width: 270,
          height: 95,
          background: 'transparent',
          border: 'none',
        },
      });
    });

    // 2. Nodos de Unión de Pareja (Matrimonio / Padres combinados) -> Alianza / Corazón en el centro
    normalizedStructure.spousePairs.forEach(([p1, p2]) => {
      const unionId = `union-${p1}-${p2}`;
      result.push({
        id: unionId,
        type: 'union',
        data: { index: result.length },
        position: { x: 0, y: 0 },
        style: {
          width: 32,
          height: 32,
          background: 'transparent',
          border: 'none',
        },
      });
    });

    return result;
  }, [
    personas,
    relaciones,
    focalPersonId,
    hoveredNodeId,
    directRelativesMap,
    showPhotos,
    showGenerations,
    showLabels,
    normalizedStructure,
    onSelectFocalPerson,
    onSelectPersonForDetail,
  ]);

  // Aristas limpias con customEdges
  const initialEdges: Edge[] = useMemo(() => {
    const edgesList: Edge[] = [];
    const { parentMap, spousePairs } = normalizedStructure;

    // 1. Conectar Parejas al Nodo de Unión Superior (PADRE -> ♡ <- MADRE)
    spousePairs.forEach(([p1, p2]) => {
      const unionId = `union-${p1}-${p2}`;
      edgesList.push(
        {
          id: `e-${p1}-${unionId}`,
          source: p1,
          target: unionId,
          type: 'spouse',
        },
        {
          id: `e-${p2}-${unionId}`,
          source: p2,
          target: unionId,
          type: 'spouse',
        }
      );
    });

    // 2. Conectar Hijos y Hermanos desde la Unión Superior Compartida
    personas.forEach((child) => {
      const parents = Array.from(parentMap.get(child.id) || []);

      if (parents.length >= 2) {
        const pa = parents[0];
        const pb = parents[1];
        const unionId = pa < pb ? `union-${pa}-${pb}` : `union-${pb}-${pa}`;
        edgesList.push({
          id: `e-${unionId}-${child.id}`,
          source: unionId,
          target: child.id,
          type: 'parentChild',
        });
      } else if (parents.length === 1) {
        // Un solo padre conocido en la base de datos
        edgesList.push({
          id: `e-${parents[0]}-${child.id}`,
          source: parents[0],
          target: child.id,
          type: 'parentChild',
        });
      }
    });

    // 3. Alinear esposos (Si P1 tiene padres y P2 no tiene, anclar P2 al nivel de P1)
    spousePairs.forEach(([p1, p2]) => {
      const p1Parents = Array.from(parentMap.get(p1) || []);
      const p2Parents = Array.from(parentMap.get(p2) || []);
      
      // Si p1 tiene padres y p2 no, añadimos un enlace invisible desde la unión de padres de p1 hasta p2
      if (p1Parents.length >= 1 && p2Parents.length === 0) {
        const sourceId = p1Parents.length >= 2 
          ? (p1Parents[0] < p1Parents[1] ? `union-${p1Parents[0]}-${p1Parents[1]}` : `union-${p1Parents[1]}-${p1Parents[0]}`)
          : p1Parents[0];
          
        edgesList.push({
          id: `dummy-align-${sourceId}-${p2}`,
          source: sourceId,
          target: p2,
          type: 'default',
          style: { stroke: 'transparent', opacity: 0 },
          animated: false,
        });
      }
      // Lo mismo a la inversa
      else if (p2Parents.length >= 1 && p1Parents.length === 0) {
        const sourceId = p2Parents.length >= 2 
          ? (p2Parents[0] < p2Parents[1] ? `union-${p2Parents[0]}-${p2Parents[1]}` : `union-${p2Parents[1]}-${p2Parents[0]}`)
          : p2Parents[0];
          
        edgesList.push({
          id: `dummy-align-${sourceId}-${p1}`,
          source: sourceId,
          target: p1,
          type: 'default',
          style: { stroke: 'transparent', opacity: 0 },
          animated: false,
        });
      }
    });

    // 4. Hermanos sin padres registrados en la base de datos
    relaciones.forEach((r) => {
      const { persona_id_1: p1, persona_id_2: p2, tipo_relacion: t } = r;
      if (t === 'hermano' || t === 'hermana') {
        const parents1 = parentMap.get(p1);
        const parents2 = parentMap.get(p2);
        if ((!parents1 || parents1.size === 0) && (!parents2 || parents2.size === 0)) {
          edgesList.push({
            id: `e-sib-${r.id}`,
            source: p1,
            target: p2,
            type: 'sibling',
          });
        }
      }
    });

    return edgesList;
  }, [personas, relaciones, normalizedStructure]);

  const layouted = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges, orientation),
    [initialNodes, initialEdges, orientation, getLayoutedElements]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      const freshLayout = getLayoutedElements(initialNodes, initialEdges, orientation);
      setNodes(freshLayout.nodes);
      setEdges(freshLayout.edges);
    });
  }, [initialNodes, initialEdges, orientation, setNodes, setEdges, getLayoutedElements]);

  return (
    <div className="w-full h-full relative bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Calculando layout...
            </span>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15, duration: 400 }}
        minZoom={0.15}
        maxZoom={2.2}
        className="w-full h-full"
      >
        <FloatingSmartToolbar
          personas={personas}
          focalPersonId={focalPersonId}
          onSelectFocalPerson={onSelectFocalPerson}
          onSelectPersonForDetail={onSelectPersonForDetail}
          orientation={orientation}
          setOrientation={setOrientation}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          showPhotos={showPhotos}
          setShowPhotos={setShowPhotos}
          showGenerations={showGenerations}
          setShowGenerations={setShowGenerations}
        />

        <MiniMap
          zoomable
          pannable
          className="!bg-white/70 dark:!bg-slate-900/70 !border-slate-200/60 dark:!border-slate-800/60 !shadow-lg !rounded-xl !top-6 !right-6 opacity-60 hover:opacity-100 transition-opacity"
          maskColor="rgba(241, 245, 249, 0.4)"
        />

        <Background variant={BackgroundVariant.Cross} gap={30} size={1} color="#CBD5E1" className="opacity-40" />
      </ReactFlow>
    </div>
  );
}
