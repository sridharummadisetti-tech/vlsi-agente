import React, { useState } from 'react';
import { Layers, Box, Cpu, Grid, Maximize2, Shield, Sliders } from 'lucide-react';

export interface MacroBlock {
  id: string;
  name: string;
  type: 'SRAM' | 'ROM' | 'PLL' | 'DSP' | 'ANALOG';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface FloorplanData {
  dieWidth: number; // in um
  dieHeight: number;
  coreMargin: number;
  utilization: number; // 0 to 100
  macros: MacroBlock[];
  ioPadCount: number;
  targetTech: string; // e.g., "TSMC 7nm FinFET"
}

interface FloorplanViewerProps {
  data: FloorplanData | null;
}

export function FloorplanViewer({ data }: FloorplanViewerProps) {
  const [selectedMacro, setSelectedMacro] = useState<MacroBlock | null>(null);
  const [showRows, setShowRows] = useState(true);
  const [showHalos, setShowHalos] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1.0);

  const defaultData: FloorplanData = data || {
    dieWidth: 800,
    dieHeight: 800,
    coreMargin: 40,
    utilization: 68.4,
    targetTech: 'TSMC N7 FinFET',
    ioPadCount: 64,
    macros: [
      { id: 'm1', name: 'SRAM_DATA_64KB', type: 'SRAM', x: 60, y: 60, width: 180, height: 140, color: '#3b82f6' },
      { id: 'm2', name: 'SRAM_INST_64KB', type: 'SRAM', x: 260, y: 60, width: 180, height: 140, color: '#3b82f6' },
      { id: 'm3', name: 'PLL_CLK_GEN', type: 'PLL', x: 60, y: 320, width: 100, height: 100, color: '#8b5cf6' },
      { id: 'm4', name: 'DSP_MAC_ARRAY', type: 'DSP', x: 480, y: 280, width: 160, height: 160, color: '#ec4899' },
    ]
  };

  const scale = 0.55;
  const dieW = defaultData.dieWidth * scale;
  const dieH = defaultData.dieHeight * scale * (1 / aspectRatio);
  const margin = defaultData.coreMargin * scale;

  const coreW = dieW - margin * 2;
  const coreH = dieH - margin * 2;

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d12] text-gray-200 overflow-y-auto">
      {/* Top Banner Controls */}
      <div className="p-4 bg-[#111620] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 flex items-center space-x-2">
              <span>ASIC Floorplan & Physical Design</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                {defaultData.targetTech}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Core area, macro placement, IO pad ring & row utilization</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showRows} 
              onChange={e => setShowRows(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-0"
            />
            <span className="text-gray-300">Std Cell Rows</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showHalos} 
              onChange={e => setShowHalos(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-0"
            />
            <span className="text-gray-300">Keep-out Halos</span>
          </label>
          <div className="flex items-center space-x-2 border-l border-white/10 pl-3">
            <span className="text-gray-400">Aspect Ratio:</span>
            <select 
              value={aspectRatio} 
              onChange={e => setAspectRatio(parseFloat(e.target.value))}
              className="bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none"
            >
              <option value="1.0">1:1 (Square)</option>
              <option value="1.33">4:3</option>
              <option value="0.75">3:4</option>
              <option value="1.6">16:10</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 items-center justify-center">
        {/* Visual Floorplan Canvas */}
        <div className="bg-[#131924] border border-white/10 rounded-2xl p-6 shadow-2xl relative flex items-center justify-center">
          <svg width={dieW + 80} height={dieH + 80} className="select-none">
            {/* IO Pad Ring (Outer Ring) */}
            <rect
              x="20"
              y="20"
              width={dieW + 40}
              height={dieH + 40}
              rx="12"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2"
            />

            {/* IO Pads along edges */}
            {Array.from({ length: 14 }).map((_, i) => (
              <g key={`top-${i}`}>
                <rect x={50 + i * (dieW / 14)} y="24" width="16" height="12" rx="2" fill="#38bdf8" />
                <rect x={50 + i * (dieW / 14)} y={dieH + 44} width="16" height="12" rx="2" fill="#38bdf8" />
              </g>
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <g key={`side-${i}`}>
                <rect x="24" y={50 + i * (dieH / 12)} width="12" height="16" rx="2" fill="#38bdf8" />
                <rect x={dieW + 44} y={50 + i * (dieH / 12)} width="12" height="16" rx="2" fill="#38bdf8" />
              </g>
            ))}

            {/* Core Boundary */}
            <rect
              x={40 + margin}
              y={40 + margin}
              width={coreW}
              height={coreH}
              rx="6"
              fill="#0f172a"
              stroke="#3b82f6"
              strokeWidth="1.5"
            />

            {/* Standard Cell Rows Pattern */}
            {showRows && Array.from({ length: Math.floor(coreH / 12) }).map((_, i) => (
              <line
                key={`row-${i}`}
                x1={40 + margin}
                y1={40 + margin + i * 12}
                x2={40 + margin + coreW}
                y2={40 + margin + i * 12}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            ))}

            {/* Standard Cell Placement Cloud */}
            <rect
              x={40 + margin + 10}
              y={40 + margin + 10}
              width={coreW - 20}
              height={coreH - 20}
              fill="url(#std-cell-pattern)"
              opacity="0.3"
            />

            {/* Hard Macro Blocks */}
            {defaultData.macros.map((macro) => {
              const mx = 40 + margin + macro.x * scale;
              const my = 40 + margin + macro.y * scale;
              const mw = macro.width * scale;
              const mh = macro.height * scale;
              const isSelected = selectedMacro?.id === macro.id;

              return (
                <g 
                  key={macro.id}
                  onClick={() => setSelectedMacro(macro)}
                  className="cursor-pointer transition-transform"
                >
                  {/* Keepout Halo */}
                  {showHalos && (
                    <rect
                      x={mx - 8}
                      y={my - 8}
                      width={mw + 16}
                      height={mh + 16}
                      rx="4"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.6"
                    />
                  )}

                  {/* Macro Box */}
                  <rect
                    x={mx}
                    y={my}
                    width={mw}
                    height={mh}
                    rx="6"
                    fill={macro.color}
                    fillOpacity={isSelected ? 0.9 : 0.75}
                    stroke={isSelected ? '#ffffff' : '#1e3a8a'}
                    strokeWidth={isSelected ? 2.5 : 1}
                  />

                  {/* Macro Label */}
                  <text
                    x={mx + mw / 2}
                    y={my + mh / 2 - 4}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none font-mono"
                  >
                    {macro.name}
                  </text>
                  <text
                    x={mx + mw / 2}
                    y={my + mh / 2 + 10}
                    fill="#cbd5e1"
                    fontSize="8"
                    textAnchor="middle"
                    className="pointer-events-none font-mono"
                  >
                    {macro.width} x {macro.height} μm
                  </text>
                </g>
              );
            })}

            {/* Orientation Marker / Compass */}
            <g transform={`translate(${dieW + 20}, 40)`}>
              <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#475569" />
              <text x="0" y="3" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">N</text>
            </g>
          </svg>
        </div>

        {/* Floorplan Stats & Inspection Panel */}
        <div className="w-full xl:w-80 flex flex-col space-y-4 text-xs font-sans">
          {/* Utilization Bar */}
          <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-gray-300 font-semibold">
              <span>Core Utilization</span>
              <span className="text-emerald-400 font-mono font-bold">{defaultData.utilization}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${defaultData.utilization}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400">Target density optimal for timing & routability.</p>
          </div>

          {/* Physical Dimensions */}
          <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-2.5 font-mono text-[11px]">
            <h3 className="text-gray-200 font-bold font-sans text-xs border-b border-white/10 pb-1.5 flex items-center space-x-1.5">
              <Box size={14} className="text-blue-400" />
              <span>Die Geometry</span>
            </h3>
            <div className="flex justify-between text-gray-400">
              <span>Die Dimension:</span>
              <span className="text-gray-200">{defaultData.dieWidth} × {defaultData.dieHeight} μm</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Total Die Area:</span>
              <span className="text-emerald-400">{((defaultData.dieWidth * defaultData.dieHeight) / 1e6).toFixed(3)} mm²</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Core Margin:</span>
              <span className="text-gray-200">{defaultData.coreMargin} μm</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>IO Pad Count:</span>
              <span className="text-blue-400">{defaultData.ioPadCount} Pads</span>
            </div>
          </div>

          {/* Macro Block Inspector */}
          {selectedMacro ? (
            <div className="bg-[#131924] p-4 rounded-xl border border-blue-500/40 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-1.5 font-sans">
                <span className="font-bold text-blue-400">Macro Inspector</span>
                <button onClick={() => setSelectedMacro(null)} className="text-gray-400 hover:text-white">×</button>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Macro Name:</span>
                <span className="text-gray-100 font-bold">{selectedMacro.name}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Class:</span>
                <span className="text-purple-400">{selectedMacro.type} Memory</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Dimensions:</span>
                <span className="text-gray-200">{selectedMacro.width} × {selectedMacro.height} μm</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Placement (X,Y):</span>
                <span className="text-emerald-400">({selectedMacro.x}, {selectedMacro.y})</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#131924] p-4 rounded-xl border border-white/10 text-gray-500 text-center italic text-xs">
              Click any Macro Block to inspect physical bounds & orientation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
