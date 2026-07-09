import { useMemo } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Persona, Relacion } from '../../types/database';
import dagre from 'dagre';

interface TreeDiagramProps {
  personas: Persona[];
  relaciones: Relacion[];
}

export default function TreeDiagram({ personas, relaciones }: TreeDiagramProps) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 200;
  const nodeHeight = 100;

  const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = 'top' as any;
      node.sourcePosition = 'bottom' as any;
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
      return node;
    });

    return { nodes, edges };
  };

  const initialNodes: Node[] = personas.map((p) => ({
    id: p.id,
    data: { 
      label: (
        <div className="flex flex-col items-center p-2 text-sm text-center">
          {p.foto ? (
            <img src={p.foto} alt="foto" className="w-12 h-12 rounded-full mb-2 object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full mb-2 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl">👤</div>
          )}
          <strong className="text-gray-800 dark:text-gray-100">{p.nombres} {p.apellidos}</strong>
          <span className="text-xs opacity-70 text-gray-600 dark:text-gray-400">
            {p.fecha_nacimiento ? new Date(p.fecha_nacimiento).getFullYear() : '?'} - {p.fecha_fallecimiento ? new Date(p.fecha_fallecimiento).getFullYear() : '...'}
          </span>
        </div>
      ) 
    },
    position: { x: 0, y: 0 },
    style: { 
      background: 'var(--color-surface-light)',
      border: '1px solid var(--color-primary)',
      borderRadius: '8px',
      width: nodeWidth,
      height: nodeHeight
    },
  }));

  const initialEdges: Edge[] = relaciones.map((r) => ({
    id: r.id,
    source: r.persona_id_1,
    target: r.persona_id_2,
    label: r.tipo_relacion,
    animated: true,
    style: { stroke: 'var(--color-primary)' },
  }));

  const layouted = useMemo(() => getLayoutedElements(initialNodes, initialEdges), [personas, relaciones]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges);

  useEffect(() => {
    const freshLayout = getLayoutedElements(initialNodes, initialEdges);
    setNodes(freshLayout.nodes);
    setEdges(freshLayout.edges);
  }, [personas, relaciones]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
