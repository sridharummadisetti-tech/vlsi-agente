import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Position, useNodesState, useEdgesState, Handle } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Layers, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

export interface LogicDiagramData {
  nodes: { id: string; type: string; label: string }[];
  edges: { source: string; target: string }[];
}

interface LogicDiagramViewerProps {
  data: LogicDiagramData | any | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

const nodeWidth = 120;
const nodeHeight = 80;

// Topological DAG Layout Engine
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  const rankSep = 140;
  const nodeSep = 90;

  // Build adjacency and compute in-degrees
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  
  nodes.forEach(n => {
    inDegree[n.id] = 0;
    adj[n.id] = [];
  });

  edges.forEach(e => {
    if (adj[e.source]) adj[e.source].push(e.target);
    if (inDegree[e.target] !== undefined) inDegree[e.target]++;
  });

  // Assign ranks (layers)
  const rank: Record<string, number> = {};
  const queue: string[] = [];

  nodes.forEach(n => {
    if (inDegree[n.id] === 0) {
      rank[n.id] = 0;
      queue.push(n.id);
    }
  });

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currRank = rank[curr] || 0;
    (adj[curr] || []).forEach(next => {
      rank[next] = Math.max(rank[next] || 0, currRank + 1);
      inDegree[next]--;
      if (inDegree[next] <= 0 && !queue.includes(next)) {
        queue.push(next);
      }
    });
  }

  // Fallback for unvisited nodes (e.g. outputs or cycles)
  nodes.forEach(n => {
    if (rank[n.id] === undefined) {
      if (n.type === 'output') rank[n.id] = 3;
      else if (n.type === 'input') rank[n.id] = 0;
      else rank[n.id] = 1;
    }
  });

  // Group nodes by rank
  const layers: Record<number, Node[]> = {};
  nodes.forEach(n => {
    const r = rank[n.id] || 0;
    if (!layers[r]) layers[r] = [];
    layers[r].push(n);
  });

  // Compute (x, y) coordinates
  const newNodes = nodes.map(node => {
    const r = rank[node.id] || 0;
    const layerNodes = layers[r] || [node];
    const indexInLayer = layerNodes.findIndex(n => n.id === node.id);
    const totalInLayer = layerNodes.length;
    const offsetFromCenter = (indexInLayer - (totalInLayer - 1) / 2) * nodeSep;

    const x = isHorizontal ? r * rankSep + 60 : offsetFromCenter + 200;
    const y = isHorizontal ? offsetFromCenter + 180 : r * rankSep + 60;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y }
    };
  });

  return { nodes: newNodes, edges };
};

// --- Custom Nodes ---

const InputNode = ({ data }: { data: any }) => (
  <div className="px-3 py-1.5 bg-[#064e3b] border border-[#10b981] rounded text-white text-xs font-mono shadow-sm whitespace-nowrap">
    {data.label}
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-emerald-400 border-none" />
  </div>
);

const OutputNode = ({ data }: { data: any }) => (
  <div className="px-3 py-1.5 bg-[#7f1d1d] border border-[#ef4444] rounded text-white text-xs font-mono shadow-sm whitespace-nowrap">
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-red-400 border-none" />
    {data.label}
  </div>
);

const GateNode = ({ data }: { data: any }) => {
  const { type, label } = data;
  const t = (type || 'gate').toLowerCase();
  
  let svgContent = null;
  
  const stroke = "#3b82f6";
  const fill = "#1e3a8a";
  const strokeWidth = 2;

  if (t === 'and') {
    svgContent = <path d="M 10,5 L 25,5 A 15,15 0 0,1 25,35 L 10,35 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  } else if (t === 'or') {
    svgContent = <path d="M 10,5 Q 25,5 40,20 Q 25,35 10,35 Q 17,20 10,5 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  } else if (t === 'not' || t === 'inv' || t === 'inverter') {
    svgContent = (
      <>
        <path d="M 15,5 L 35,20 L 15,35 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx="39" cy="20" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </>
    );
  } else if (t === 'nand') {
    svgContent = (
      <>
        <path d="M 5,5 L 20,5 A 15,15 0 0,1 20,35 L 5,35 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx="39" cy="20" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </>
    );
  } else if (t === 'nor') {
    svgContent = (
      <>
        <path d="M 5,5 Q 20,5 35,20 Q 20,35 5,35 Q 12,20 5,5 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx="39" cy="20" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </>
    );
  } else if (t === 'xor') {
    svgContent = (
      <>
        <path d="M 12,5 Q 27,5 42,20 Q 27,35 12,35 Q 19,20 12,5 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <path d="M 7,5 Q 14,20 7,35" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
      </>
    );
  } else if (t === 'xnor') {
    svgContent = (
      <>
        <path d="M 10,5 Q 25,5 40,20 Q 25,35 10,35 Q 17,20 10,5 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <path d="M 5,5 Q 12,20 5,35" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx="44" cy="20" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </>
    );
  } else if (t === 'dff' || t === 'register' || t === 'flipflop') {
    svgContent = (
      <>
        <rect x="5" y="5" width="40" height="30" fill="#7e22ce" stroke="#a855f7" strokeWidth={strokeWidth} rx="4" />
        <path d="M 5,30 L 10,25 L 5,20" fill="none" stroke="#a855f7" strokeWidth={strokeWidth} />
        <text x="25" y="24" fill="#fff" fontSize="10" textAnchor="middle" fontFamily="monospace">DFF</text>
      </>
    );
  } else if (t === 'mux') {
    svgContent = (
      <>
        <path d="M 10,5 L 40,10 L 40,30 L 10,35 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <text x="25" y="24" fill="#fff" fontSize="10" textAnchor="middle" fontFamily="monospace">MUX</text>
      </>
    );
  } else {
    // Fallback block
    svgContent = (
      <>
        <rect x="5" y="5" width="40" height="30" fill="#374151" stroke="#9ca3af" strokeWidth={strokeWidth} rx="4" />
        <text x="25" y="24" fill="#fff" fontSize="10" textAnchor="middle" fontFamily="monospace">{(t || 'GATE').substring(0, 4).toUpperCase()}</text>
      </>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-gray-400 border-none" />
      <svg width="50" height="40" viewBox="0 0 50 40" className="drop-shadow-md cursor-pointer hover:scale-110 transition-transform">
        {svgContent}
      </svg>
      <div className="absolute -bottom-5 text-[9px] text-gray-400 font-mono whitespace-nowrap bg-[#0a0a0a]/80 px-1 rounded border border-white/10 pointer-events-none">
        {label}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-gray-400 border-none" />
    </div>
  );
};

const nodeTypes = {
  gate: GateNode,
  input: InputNode,
  output: OutputNode,
};

// --- Main LogicDiagramViewer Component ---

export function LogicDiagramViewer({ data, onGenerate, isGenerating }: LogicDiagramViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [gateInputs, setGateInputs] = useState<boolean[]>([false, false]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setGateInputs([false, false]);
  }, []);

  const computeGateOutput = (type: string, inputs: boolean[]) => {
    const t = (type || '').toLowerCase();
    const a = inputs[0];
    const b = inputs[1];
    switch (t) {
      case 'and': return a && b;
      case 'or': return a || b;
      case 'not':
      case 'inv':
      case 'inverter': return !a;
      case 'nand': return !(a && b);
      case 'nor': return !(a || b);
      case 'xor': return a !== b;
      case 'xnor': return a === b;
      default: return false;
    }
  };

  useEffect(() => {
    // If no data provided yet, provide a sensible default circuit (AND gate)
    const activeData = data && (data.nodes?.length || data.moduleName) 
      ? data 
      : {
          nodes: [
            { id: 'in_a', type: 'input', label: 'A (Input)' },
            { id: 'in_b', type: 'input', label: 'B (Input)' },
            { id: 'gate_and', type: 'and', label: '2-Input AND Gate' },
            { id: 'out_y', type: 'output', label: 'Y (Output)' }
          ],
          edges: [
            { source: 'in_a', target: 'gate_and' },
            { source: 'in_b', target: 'gate_and' },
            { source: 'gate_and', target: 'out_y' }
          ]
        };

    // Support both { nodes, edges } and legacy { moduleName, inputs, outputs, submodules }
    let rawNodes: { id: string; type: string; label: string }[] = [];
    let rawEdges: { source: string; target: string }[] = [];

    if (Array.isArray(activeData.nodes) && activeData.nodes.length > 0) {
      rawNodes = activeData.nodes;
      rawEdges = activeData.edges || [];
    } else if (activeData.moduleName) {
      // Convert legacy block diagram data to gate-level nodes
      const d = (activeData.moduleName || '').toLowerCase();
      let gateType = 'and';
      if (d.includes('or_gate') || d.includes('or')) gateType = 'or';
      else if (d.includes('not') || d.includes('inv')) gateType = 'not';
      else if (d.includes('nand')) gateType = 'nand';
      else if (d.includes('nor')) gateType = 'nor';
      else if (d.includes('xnor')) gateType = 'xnor';
      else if (d.includes('xor')) gateType = 'xor';
      else if (d.includes('adder')) gateType = 'xor';
      else if (d.includes('counter') || d.includes('dff')) gateType = 'dff';
      else if (d.includes('mux')) gateType = 'mux';

      (activeData.inputs || ['a', 'b']).forEach((inName: string) => {
        rawNodes.push({ id: `in_${inName}`, type: 'input', label: inName });
        rawEdges.push({ source: `in_${inName}`, target: 'gate_main' });
      });

      rawNodes.push({ id: 'gate_main', type: gateType, label: `${activeData.moduleName || 'Logic Gate'}` });

      (activeData.outputs || ['y']).forEach((outName: string) => {
        rawNodes.push({ id: `out_${outName}`, type: 'output', label: outName });
        rawEdges.push({ source: 'gate_main', target: `out_${outName}` });
      });
    }

    const initialNodes: Node[] = rawNodes.map((n) => {
      let nodeType = 'gate';
      if (n.type === 'input') nodeType = 'input';
      if (n.type === 'output') nodeType = 'output';

      return {
        id: n.id,
        type: nodeType,
        position: { x: 0, y: 0 },
        data: { 
          label: n.label,
          type: n.type
        },
      };
    });

    const initialEdges: Edge[] = rawEdges.map((e, i) => ({
      id: `e-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 1.5 }
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [data, setNodes, setEdges]);

  return (
    <ErrorBoundary>
      <div className="w-full h-full flex bg-[#0a0a0a] relative overflow-hidden select-none min-h-[500px]">
        <div className={`flex-1 relative transition-all duration-300 ${selectedNode ? 'w-2/3 border-r border-white/10' : 'w-full'} h-full min-h-[450px]`}>
          <div className="absolute top-4 left-4 z-10 text-emerald-400 font-mono text-xs bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-lg flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Logic Diagram (Click any gate to simulate logic)</span>
          </div>

          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="absolute top-4 right-4 z-10 p-2 bg-[#151619]/90 hover:bg-[#1A1C20] text-gray-300 hover:text-emerald-400 border border-white/10 rounded-lg shadow-lg flex items-center space-x-1.5 text-xs font-mono transition-colors cursor-pointer"
              title="Re-synthesize Logic Diagram"
            >
              <RefreshCw size={13} className={isGenerating ? 'animate-spin text-emerald-400' : ''} />
              <span>{isGenerating ? 'Synthesizing...' : 'Re-synthesize'}</span>
            </button>
          )}

          <div className="w-full h-full" style={{ width: '100%', height: '100%' }}>
            <ReactFlow 
              nodes={nodes} 
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              colorMode="dark"
            >
              <Background color="#222" gap={16} />
              <Controls className="bg-[#151619] border-white/10 fill-white" />
              <MiniMap nodeColor="#1A1C20" maskColor="rgba(0,0,0,0.5)" />
            </ReactFlow>
          </div>
        </div>

        {selectedNode && (
          <div className="w-1/3 min-w-[350px] h-full bg-[#0a0a0a] flex flex-col relative overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 z-30 p-2 bg-black/50 text-gray-400 hover:text-white rounded-full border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="p-6 border-b border-white/10 bg-[#151619]">
              <h2 className="text-2xl font-bold text-emerald-400 font-mono mb-1 uppercase">{(selectedNode.data.type as string) || 'Logic'} Gate</h2>
              <p className="text-gray-400 text-sm font-mono">Node ID: {selectedNode.id}</p>
            </div>

            <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
              {['input', 'output'].includes(selectedNode.data.type as string) ? (
                <div className="text-center text-gray-400 mt-10">
                  <p className="font-mono text-sm">This is an <strong className="text-emerald-400">{selectedNode.data.type as string}</strong> port.</p>
                  <p className="text-xs text-gray-500 mt-2">Select a logic gate in the schematic to simulate its interactive behavior.</p>
                </div>
              ) : (
                <div className="w-full max-w-sm flex flex-col items-center">
                  <div className="font-mono text-emerald-400 mb-8 text-lg border-b border-emerald-500/30 pb-2 w-full text-center">
                    Gate Simulator
                  </div>
                  
                  <div className="flex space-x-8 items-center mt-4">
                    {/* Inputs */}
                    <div className="flex flex-col space-y-4">
                      <h4 className="text-gray-400 text-sm font-mono text-center mb-2 border-b border-white/10 pb-1">INPUTS</h4>
                      <div className="flex items-center space-x-3">
                        <span className="text-emerald-400 font-mono w-4 text-right">A</span>
                        <button
                          onClick={() => setGateInputs([!gateInputs[0], gateInputs[1]])}
                          className={`w-12 h-8 rounded-md font-mono font-bold transition-colors cursor-pointer ${gateInputs[0] ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#151619] border border-white/20 text-gray-500'}`}
                        >
                          {gateInputs[0] ? '1' : '0'}
                        </button>
                      </div>
                      {selectedNode.data.type !== 'not' && selectedNode.data.type !== 'inv' && selectedNode.data.type !== 'inverter' && (
                        <div className="flex items-center space-x-3">
                          <span className="text-emerald-400 font-mono w-4 text-right">B</span>
                          <button
                            onClick={() => setGateInputs([gateInputs[0], !gateInputs[1]])}
                            className={`w-12 h-8 rounded-md font-mono font-bold transition-colors cursor-pointer ${gateInputs[1] ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#151619] border border-white/20 text-gray-500'}`}
                          >
                            {gateInputs[1] ? '1' : '0'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Gate Symbol */}
                    <div className="w-24 h-24 bg-[#151619] border-2 border-emerald-500/50 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center relative">
                       <span className="text-lg font-bold text-emerald-400 tracking-widest font-mono uppercase">{selectedNode.data.type as string}</span>
                    </div>

                    {/* Output */}
                    <div className="flex flex-col space-y-4">
                      <h4 className="text-gray-400 text-sm font-mono text-center mb-2 border-b border-white/10 pb-1">OUT</h4>
                      <div className="flex items-center space-x-3 mt-2">
                        <div
                          className={`w-12 h-8 rounded-md font-mono font-bold flex items-center justify-center transition-colors ${computeGateOutput(selectedNode.data.type as string, gateInputs) ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-[#151619] border border-white/20 text-gray-500'}`}
                        >
                          {computeGateOutput(selectedNode.data.type as string, gateInputs) ? '1' : '0'}
                        </div>
                        <span className="text-blue-400 font-mono w-4">Y</span>
                      </div>
                    </div>
                  </div>

                  {/* Truth Table */}
                  <div className="mt-12 w-full">
                    <h4 className="text-gray-400 text-sm font-mono text-center mb-4 border-b border-white/10 pb-1">TRUTH TABLE</h4>
                    <table className="w-full text-sm font-mono text-center border-collapse">
                      <thead>
                        <tr className="bg-[#151619] text-emerald-400">
                          <th className="border border-white/10 p-2">A</th>
                          {selectedNode.data.type !== 'not' && selectedNode.data.type !== 'inv' && selectedNode.data.type !== 'inverter' && <th className="border border-white/10 p-2">B</th>}
                          <th className="border border-white/10 p-2 text-blue-400">Y</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          [false, false],
                          [false, true],
                          [true, false],
                          [true, true]
                        ].slice(0, ['not', 'inv', 'inverter'].includes(selectedNode.data.type as string) ? 2 : 4).map((inputs, i) => (
                          <tr key={i} className={`${gateInputs[0] === inputs[0] && (['not', 'inv', 'inverter'].includes(selectedNode.data.type as string) || gateInputs[1] === inputs[1]) ? 'bg-emerald-500/20' : ''}`}>
                            <td className="border border-white/10 p-2 text-gray-300">{inputs[0] ? '1' : '0'}</td>
                            {!['not', 'inv', 'inverter'].includes(selectedNode.data.type as string) && <td className="border border-white/10 p-2 text-gray-300">{inputs[1] ? '1' : '0'}</td>}
                            <td className="border border-white/10 p-2 text-blue-400 font-bold">{computeGateOutput(selectedNode.data.type as string, inputs) ? '1' : '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
