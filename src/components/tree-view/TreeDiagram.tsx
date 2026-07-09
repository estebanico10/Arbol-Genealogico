import { useMemo, useEffect, useState } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Persona, Relacion } from '../../types/database';
import dagre from 'dagre';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { formatAgeDisplay } from '../../utils/ageCalculator';
import { Compass, LayoutGrid, Eye, RotateCcw, Tag } from 'lucide-react';

interface TreeDiagramProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson: (id: string | null) => void;
  onSelectPersonForDetail: (persona: Persona) => void;
}

export default function TreeDiagram({
  personas,
  relaciones,
  focalPersonId,
  onSelectFocalPerson,
  onSelectPersonForDetail,
}: TreeDiagramProps) {
  const [orientation, setOrientation] = useState<'TB' | 'LR'>('TB');
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);

  const nodeWidth = 220;
  const nodeHeight = 115;

  const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 110 });

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
  };

  const initialNodes: Node[] = useMemo(() => {
    return personas.map((p) => {
      const isFocal = focalPersonId === p.id;
      const kinship = focalPersonId ? calculateKinship(focalPersonId, p.id, personas, relaciones) : null;

      return {
        id: p.id,
        data: {
          label: (
            <div
              onClick={() => onSelectPersonForDetail(p)}
              className={`group cursor-pointer relative flex flex-col justify-between p-3 rounded-2xl transition-all duration-200 select-none ${
                isFocal
                  ? 'bg-blue-600 text-white shadow-xl ring-4 ring-blue-400/40'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              {/* Kinship Badge */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                {kinship ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase truncate max-w-[150px] ${
                      isFocal
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200'
                    }`}
                  >
                    {kinship}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Familiar</span>
                )}

                {!isFocal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFocalPerson(p.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
                    title="Centrar Punto de Vista aquí"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Contenido Resumido: Foto + Nombre */}
              <div className="flex items-center gap-2.5">
                {p.foto ? (
                  <img
                    src={p.foto}
                    alt={p.nombres || ''}
                    className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-white/40 shadow-sm"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 font-bold ${
                      isFocal
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    👤
                  </div>
                )}

                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-extrabold text-xs leading-tight truncate">
                    {p.nombres} {p.apellidos}
                  </h4>
                  <p
                    className={`mt-0.5 text-[10px] font-medium truncate ${
                      isFocal ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {formatAgeDisplay(p.fecha_nacimiento, p.fecha_fallecimiento)}
                  </p>
                </div>
              </div>

              {/* Indicador sutil de clic en hover */}
              <div className="mt-1.5 text-[9px] text-center font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400">
                👆 Clic para ver ficha
              </div>
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          width: nodeWidth,
          background: 'transparent',
          border: 'none',
        },
      };
    });
  }, [personas, relaciones, focalPersonId, onSelectFocalPerson, onSelectPersonForDetail]);

  const initialEdges: Edge[] = useMemo(() => {
    return relaciones.map((r) => {
      const relType = r.tipo_relacion;
      let strokeColor = '#3b82f6'; // Azul por defecto (padre/hijo)
      const isConyuge = relType === 'conyuge' || relType === 'esposo' || relType === 'esposa' || relType === 'pareja';
      const isHermano = relType === 'hermano' || relType === 'hermana';

      if (isConyuge) strokeColor = '#ec4899'; // Rosa para cónyuges
      if (isHermano) strokeColor = '#06b6d4'; // Cyan para hermanos

      return {
        id: r.id,
        source: r.persona_id_1,
        target: r.persona_id_2,
        type: 'smoothstep',
        animated: isConyuge,
        label: showEdgeLabels ? r.tipo_relacion.toUpperCase() : undefined,
        style: { stroke: strokeColor, strokeWidth: 2.2 },
        labelBgStyle: { fill: 'var(--color-surface-light, #ffffff)', fillOpacity: 0.9 },
        labelStyle: { fontSize: 10, fontWeight: 700, fill: '#475569' },
      };
    });
  }, [relaciones, showEdgeLabels]);

  const layouted = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges, orientation),
    [initialNodes, initialEdges, orientation]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges);

  useEffect(() => {
    const freshLayout = getLayoutedElements(initialNodes, initialEdges, orientation);
    setNodes(freshLayout.nodes);
    setEdges(freshLayout.edges);
  }, [initialNodes, initialEdges, orientation, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative">
      {/* Panel Superior de Punto de Vista y Controles */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Compass className="w-4 h-4 text-blue-500" />
          <span>Punto de Vista:</span>
        </div>

        <select
          value={focalPersonId || ''}
          onChange={(e) => onSelectFocalPerson(e.target.value || null)}
          className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Seleccionar Persona --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos}
            </option>
          ))}
        </select>

        {focalPersonId && (
          <button
            onClick={() => onSelectFocalPerson(null)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Quitar punto de vista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        <button
          onClick={() => setShowEdgeLabels((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showEdgeLabels
              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title="Alternar etiquetas en las líneas del diagrama"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{showEdgeLabels ? 'Líneas con Etiquetas' : 'Líneas Limpias'}</span>
        </button>

        <button
          onClick={() => setOrientation((prev) => (prev === 'TB' ? 'LR' : 'TB'))}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
          title="Cambiar orientación del árbol"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
          <span>{orientation === 'TB' ? 'Vertical' : 'Horizontal'}</span>
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        className="bg-slate-100/50 dark:bg-slate-900"
      >
        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-md" />
        <MiniMap
          zoomable
          pannable
          className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-md rounded-lg"
        />
        <Background gap={16} size={1} color="#94a3b8" />
      </ReactFlow>
    </div>
  );
}
