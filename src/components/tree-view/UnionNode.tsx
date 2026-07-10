import { Handle, Position } from '@xyflow/react';
import { Heart } from 'lucide-react';
import { memo } from 'react';

const UnionNode = ({ data }: { data?: { index?: number } }) => {
  return (
    <>
      {/* Handles to connect parents (from their sides or bottoms to the union's top/sides) */}
      <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="right" className="opacity-0" />
      
      <div
        className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer animate-fade-in"
        style={{ animationDelay: `${((data?.index) || 0) * 0.05}s` }}
        title="Unión / Matrimonio"
      >
        <Heart className="w-3.5 h-3.5 fill-slate-200 dark:fill-slate-800 transition-colors" />
      </div>

      {/* Handle to connect down to children */}
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
    </>
  );
};

export default memo(UnionNode);
