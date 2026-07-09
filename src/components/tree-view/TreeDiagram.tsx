import { useMemo, useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Persona, Relacion } from '../../types/database';
import dagre from 'dagre';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { Compass } from 'lucide-react';

interface TreeDiagramProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson: (id: string | null) => void;
  onSelectPersonForDetail: (persona: Persona) => void;
  orientation?: 'TB' | 'LR';
  showEdgeLabels?: boolean;
}

export default function TreeDiagram({
  personas,
  relaciones,
  focalPersonId,
  onSelectFocalPerson,
  onSelectPersonForDetail,
  orientation = 'TB',
  showEdgeLabels = false,
}: TreeDiagramProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Dimensiones SaaS 2026 horizontales minimalistas (270x95px)
  const nodeWidth = 270;
  const nodeHeight = 95;

  // Cálculo de parientes directos para Focus dinámico en Hover o Selección
  const directRelativesMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    personas.forEach((p) => map.set(p.id, new Set<string>()));

    relaciones.forEach((r) => {
      map.get(r.persona_id_1)?.add(r.persona_id_2);
      map.get(r.persona_id_2)?.add(r.persona_id_1);
    });
    return map;
  }, [personas, relaciones]);

  const getLayoutedElements = useCallback(
    (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR') => {
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({ rankdir: direction, nodesep: 75, ranksep: 115 });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'TB' ? ('top' as any) : ('left' as any);
        node.sourcePosition = direction === 'TB' ? ('bottom' as any) : ('right' as any);
        node.position = {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        };
      });

      return { nodes, edges };
    },
    []
  );

  const initialNodes: Node[] = useMemo(() => {
    const activeCenterId = hoveredNodeId || focalPersonId;

    return personas.map((p) => {
      const isFocal = focalPersonId === p.id;
      const isHovered = hoveredNodeId === p.id;

      // Calcular atenuación si hay un centro activo y no es pariente directo ni el propio nodo
      let isDimmed = false;
      if (activeCenterId && activeCenterId !== p.id) {
        const relatives = directRelativesMap.get(activeCenterId);
        if (!relatives?.has(p.id)) {
          isDimmed = true;
        }
      }

      const kinshipRaw = focalPersonId ? calculateKinship(focalPersonId, p.id, personas, relaciones) : null;
      const badgeRole = isFocal ? 'YO' : kinshipRaw || 'FAMILIAR';

      // Fechas reducidas y minimalistas (ej: 1999 — Presente o 1942 — 2023)
      const getYearOnly = (dateStr?: string | null) => {
        if (!dateStr) return null;
        const yearMatch = dateStr.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : null;
      };

      const birthYear = getYearOnly(p.fecha_nacimiento);
      const deathYear = getYearOnly(p.fecha_fallecimiento);
      const dateDisplay = birthYear
        ? `${birthYear} — ${deathYear || 'Presente'}`
        : deathYear
        ? `† ${deathYear}`
        : 'Familia';

      return {
        id: p.id,
        data: {
          label: (
            <div
              onMouseEnter={() => setHoveredNodeId(p.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onDoubleClick={() => onSelectFocalPerson(p.id)}
              onClick={() => onSelectPersonForDetail(p)}
              style={{ width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
              className={`group cursor-pointer relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-250 select-none ${
                isDimmed ? 'opacity-40 grayscale-[30%]' : 'opacity-100'
              } ${
                isHovered ? 'scale-[1.02] shadow-lg' : 'scale-100'
              } ${
                isFocal
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-600 dark:border-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.18)]'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Contenido principal: Avatar + Nombre + Fecha */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar circular grande (48px) */}
                {p.foto ? (
                  <img
                    src={p.foto}
                    alt={p.nombres || ''}
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-base tracking-tight shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-xs">
                    {(p.nombres?.[0] || '').toUpperCase()}{(p.apellidos?.[0] || '').toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1 text-left">
                  {/* Nombre: peso 600, 16px, máx 2 líneas */}
                  <h4 className="font-semibold text-[15px] text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                    {p.nombres} {p.apellidos}
                  </h4>
                  {/* Fecha de vida minimalista */}
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight">
                    {dateDisplay}
                  </p>
                </div>
              </div>

              {/* Badge del Rol (cápsula tenue derecha superior) y Botón de Punto de Vista */}
              <div className="flex flex-col items-end justify-between h-full pl-2 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    isFocal
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {badgeRole}
                </span>

                {!isFocal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFocalPerson(p.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Establecer como Punto de Vista"
                  >
                    <Compass className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          width: nodeWidth,
          height: nodeHeight,
          background: 'transparent',
          border: 'none',
        },
      };
    });
  }, [
    personas,
    relaciones,
    focalPersonId,
    hoveredNodeId,
    directRelativesMap,
    onSelectFocalPerson,
    onSelectPersonForDetail,
  ]);

  const initialEdges: Edge[] = useMemo(() => {
    const activeCenterId = hoveredNodeId || focalPersonId;

    return relaciones.map((r) => {
      // Por defecto gris claro sobrio (#CBD5E1 en light, #334155 en dark)
      let strokeColor = '#CBD5E1';
      let strokeWidth = 2;

      // Si uno de los nodos conectados es el Punto de Vista, se ilumina en azul
      if (focalPersonId && (r.persona_id_1 === focalPersonId || r.persona_id_2 === focalPersonId)) {
        strokeColor = '#2563EB';
        strokeWidth = 2.5;
      }

      // Si está en hover el nodo conectado, también le damos un toque azulado
      if (hoveredNodeId && (r.persona_id_1 === hoveredNodeId || r.persona_id_2 === hoveredNodeId)) {
        strokeColor = '#3B82F6';
        strokeWidth = 2.5;
      }

      // Atenuación de líneas lejanas en Focus Mode
      let opacity = 1;
      if (activeCenterId && r.persona_id_1 !== activeCenterId && r.persona_id_2 !== activeCenterId) {
        opacity = 0.35;
      }

      const relType = r.tipo_relacion;
      const isConyuge =
        relType === 'conyuge' || relType === 'esposo' || relType === 'esposa' || relType === 'pareja';

      return {
        id: r.id,
        source: r.persona_id_1,
        target: r.persona_id_2,
        type: 'smoothstep',
        animated: isConyuge && !!focalPersonId,
        label: showEdgeLabels ? relType.toUpperCase() : undefined,
        style: {
          stroke: strokeColor,
          strokeWidth,
          opacity,
          transition: 'all 0.25s ease-in-out',
        },
        labelBgStyle: { fill: 'var(--color-surface-light, #ffffff)', fillOpacity: 0.95 },
        labelStyle: { fontSize: 9, fontWeight: 700, fill: '#64748B' },
      };
    });
  }, [relaciones, focalPersonId, hoveredNodeId, showEdgeLabels]);

  const layouted = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges, orientation),
    [initialNodes, initialEdges, orientation, getLayoutedElements]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges);

  useEffect(() => {
    const freshLayout = getLayoutedElements(initialNodes, initialEdges, orientation);
    setNodes(freshLayout.nodes);
    setEdges(freshLayout.edges);
  }, [initialNodes, initialEdges, orientation, setNodes, setEdges, getLayoutedElements]);

  return (
    <div className="w-full h-full relative bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 300 }}
        minZoom={0.15}
        maxZoom={2}
        className="w-full h-full"
      >
        <Controls
          showInteractive={false}
          className="!bg-white dark:!bg-slate-900 !border-slate-200/80 dark:!border-slate-800 !shadow-lg !rounded-2xl overflow-hidden"
        />
        <MiniMap
          zoomable
          pannable
          className="!bg-white/80 dark:!bg-slate-900/80 !border-slate-200/80 dark:!border-slate-800 !shadow-lg !rounded-2xl"
          maskColor="rgba(241, 245, 249, 0.6)"
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#CBD5E1" />
      </ReactFlow>
    </div>
  );
}
