import { useMemo, useEffect, useState } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Persona, Relacion } from '../../types/database';
import dagre from 'dagre';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { Compass, LayoutGrid, Eye, RotateCcw } from 'lucide-react';

interface TreeDiagramProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectFocalPerson: (id: string | null) => void;
}

export default function TreeDiagram({
  personas,
  relaciones,
  focalPersonId,
  onSelectFocalPerson,
}: TreeDiagramProps) {
  const [orientation, setOrientation] = useState<'TB' | 'LR'>('TB');

  const nodeWidth = 240;
  const nodeHeight = 190;

  const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 70, ranksep: 100 });

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
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                isFocal
                  ? 'bg-blue-50/90 dark:bg-blue-950/80 ring-2 ring-blue-500 shadow-lg'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg'
              }`}
            >
              {/* Kinship Badge */}
              {kinship && (
                <div
                  className={`mb-2 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                    isFocal
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200'
                  }`}
                >
                  {kinship}
                </div>
              )}

              {/* Avatar */}
              {p.foto ? (
                <img
                  src={p.foto}
                  alt={p.nombres || ''}
                  className="w-16 h-16 rounded-full mb-2 object-cover shadow-sm ring-2 ring-blue-500/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mb-2 bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-2xl shadow-sm ring-2 ring-blue-500/30">
                  👤
                </div>
              )}

              {/* Nombre */}
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight text-center">
                {p.nombres} {p.apellidos}
              </h4>

              {/* Años */}
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {p.fecha_nacimiento ? new Date(p.fecha_nacimiento).getFullYear() : '?'} —{' '}
                {p.fecha_fallecimiento ? new Date(p.fecha_fallecimiento).getFullYear() : 'Presente'}
              </p>

              {/* Detalles de contacto breves */}
              {(p.celular || p.email) && (
                <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 w-full border-t border-slate-100 dark:border-slate-700/60 pt-1.5 truncate">
                  {p.celular && <p className="truncate">📱 {p.celular}</p>}
                  {p.email && <p className="truncate">✉️ {p.email}</p>}
                </div>
              )}

              {/* Botón Ver desde aquí */}
              {!isFocal && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFocalPerson(p.id);
                  }}
                  className="mt-2 w-full py-1 px-2 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  title="Establecer como Punto de Vista"
                >
                  <Eye className="w-3 h-3" /> Ver desde aquí
                </button>
              )}
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
  }, [personas, relaciones, focalPersonId, onSelectFocalPerson]);

  const initialEdges: Edge[] = useMemo(() => {
    return relaciones.map((r) => ({
      id: r.id,
      source: r.persona_id_1,
      target: r.persona_id_2,
      label: r.tipo_relacion.toUpperCase(),
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      labelBgStyle: { fill: 'var(--color-surface-light, #ffffff)', fillOpacity: 0.8 },
    }));
  }, [relaciones]);

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
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
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
