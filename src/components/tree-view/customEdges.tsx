import { getSmoothStepPath, getStraightPath, EdgeProps, BaseEdge } from '@xyflow/react';
import { memo } from 'react';

export const ParentChildEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 24, // Suave radio de giro
  });

  return (
    <BaseEdge 
      id={id} 
      path={edgePath} 
      className="animate-fade-in"
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: selected ? 3 : 2,
        stroke: selected ? '#3b82f6' : '#94A3B8', // blue-500 on select, slate-400 normally
        transition: 'stroke 0.3s, stroke-width 0.3s',
      }}
    />
  );
});

export const SpouseEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  selected,
}: EdgeProps) => {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge 
      id={id} 
      path={edgePath} 
      className="animate-fade-in"
      style={{
        ...style,
        strokeWidth: selected ? 2.5 : 1.5,
        stroke: selected ? '#3b82f6' : '#cbd5e1', // slate-300
        transition: 'stroke 0.3s, stroke-width 0.3s',
      }}
    />
  );
});

export const SiblingEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge 
      id={id} 
      path={edgePath} 
      className="animate-fade-in"
      style={{
        ...style,
        strokeWidth: selected ? 2.5 : 1.5,
        stroke: selected ? '#3b82f6' : '#cbd5e1', // slate-300
        strokeDasharray: '4 4', // Dashed for siblings
        transition: 'stroke 0.3s, stroke-width 0.3s',
      }}
    />
  );
});
