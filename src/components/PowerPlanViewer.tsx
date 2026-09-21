import React, { useState } from 'react';
import { 
  FloorplanConfig, 
  PowerPlanConfig 
} from '../types/physicalDesign';
import { 
  simulatePowerGrid, 
  generateOpenRoadFloorplanTcl, 
  generateInnovusTcl,
  createDefaultFloorplanConfig,
  createDefaultPowerPlan
} from '../utils/physicalDesignEngine';
import { 
  Zap, 
  Layers, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Copy, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Thermometer,
  Grid
} from 'lucide-react';

export interface PowerPlanData {
  nominalVoltage?: number;
  vddRingWidth?: number;
  vssRingWidth?: number;
  strapPitch?: number;
  strapWidth?: number;
  worstCaseIrDrop?: number;
  maxCurrentDensity?: number;
  targetMargin?: string;
}

interface PowerPlanViewerProps {
  floorplan?: FloorplanConfig;
  powerPlan?: PowerPlanConfig;
  data?: any;
  onChangePowerPlan?: (newConfig: PowerPlanConfig) => void;
}

export function PowerPlanViewer({ floorplan: rawFloorplan, powerPlan: rawPowerPlan, data, onChangePowerPlan }: PowerPlanViewerProps) {
  // Safe Fallback initialization
  const defaultFloorplan = createDefaultFloorplanConfig();
  const defaultPowerPlan = createDefaultPowerPlan();

  const floorplan: FloorplanConfig = rawFloorplan || defaultFloorplan;
  const [localPowerPlan, setLocalPowerPlan] = useState<PowerPlanConfig>(rawPowerPlan || defaultPowerPlan);
  const powerPlan: PowerPlanConfig = rawPowerPlan || localPowerPlan;

  const handleUpdateConfig = (newPlan: PowerPlanConfig) => {
    setLocalPowerPlan(newPlan);
    if (onChangePowerPlan) {
      onChangePowerPlan(newPlan);
    }
  };

  // Layer visibility toggles
  const [showRings, setShowRings] = useState(true);
  const [showVStraps, setShowVStraps] = useState(true);
  const [showHStraps, setShowHStraps] = useState(true);
  const [showRails, setShowRails] = useState(true);
  const [showVias, setShowVias] = useState(true);
  const [showMacros, setShowMacros] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ x: number; y: number; voltage: number; dropPercent: number } | null>(null);

  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptType, setScriptType] = useState<'openroad' | 'innovus'>('openroad');
  const [copied, setCopied] = useState(false);

  // Run Real-time Power Grid IR Drop Simulation
  const simulation = simulatePowerGrid(floorplan, powerPlan);

  const coreW = floorplan.dieWidth - floorplan.coreMarginLeft - floorplan.coreMarginRight;
  const coreH = floorplan.dieHeight - floorplan.coreMarginTop - floorplan.coreMarginBottom;

  const handleUpdate = (field: keyof PowerPlanConfig, value: any) => {
    handleUpdateConfig({
      ...powerPlan,
      [field]: value
    });
  };

  const handleCopyScript = () => {
    const script = scriptType === 'openroad'
      ? generateOpenRoadFloorplanTcl(floorplan, powerPlan)
      : generateInnovusTcl(floorplan, powerPlan);
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color generator for IR drop heatmap
  const getHeatmapColor = (dropPercent: number) => {
    // 0% -> Emerald/Cyan, 2.5% -> Lime/Yellow, 5% -> Amber, >6% -> Crimson
    if (dropPercent < 2.0) return 'rgba(16, 185, 129, 0.45)'; // Emerald
    if (dropPercent < 3.5) return 'rgba(132, 204, 22, 0.5)';  // Lime
    if (dropPercent < 5.0) return 'rgba(245, 158, 11, 0.55)'; // Amber
    return 'rgba(239, 68, 68, 0.65)';                        // Rose/Crimson
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-gray-200 select-none overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 bg-[#151619] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Zap size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-gray-100">Power Plan Studio (PDN)</h2>
          </div>
          
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
            {powerPlan.corePowerNets?.vdd || 'VDD'} ({powerPlan.supplyVoltage.toFixed(2)}V) / {powerPlan.corePowerNets?.vss || 'VSS'} (0V)
          </span>

          {/* IR Drop Status Badge */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
            simulation.isDrcPass
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
          }`}>
            {simulation.isDrcPass ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            <span>Max IR Drop: {simulation.maxDropPercent.toFixed(2)}% ({simulation.maxDropMv.toFixed(1)} mV)</span>
          </div>
        </div>

        {/* View Toggles & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Heatmap Mode Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
              showHeatmap 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                : 'bg-[#1A1C20] text-gray-400 border-white/10 hover:text-gray-200'
            }`}
          >
            <Thermometer size={14} />
            <span>{showHeatmap ? 'IR Heatmap Active' : 'Show IR Heatmap'}</span>
          </button>

          {/* Quick Presets */}
          <button
            onClick={() => handleUpdateConfig({
              ...powerPlan,
              vStrapPitch: 50,
              hStrapPitch: 50,
              vStrapWidth: 10,
              hStrapWidth: 10,
              ringWidth: 16
            })}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs transition-colors"
            title="Dense Low-Resistance Mesh"
          >
            Dense Mesh
          </button>

          <button
            onClick={() => handleUpdateConfig({
              ...powerPlan,
              vStrapPitch: 90,
              hStrapPitch: 90,
              vStrapWidth: 6,
              hStrapWidth: 6,
              ringWidth: 12
            })}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs transition-colors"
            title="Relaxed Mesh (Save Routing Tracks)"
          >
            Relaxed Mesh
          </button>

          <button
            onClick={() => setShowScriptModal(true)}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs flex items-center space-x-1.5 transition-colors"
          >
            <FileCode size={13} />
            <span>Export PDN Script</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Interactive Power Grid Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative bg-[#0d0e12]">
          <div className="relative border border-white/10 rounded-xl bg-[#131418] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6">
            {/* Top Coordinate & Hover Info */}
            <div className="absolute top-2 left-4 right-4 text-[10px] font-mono text-gray-400 flex items-center justify-between">
              <span>POWER GRID MESH ({powerPlan.vStrapLayer} / {powerPlan.hStrapLayer})</span>
              {hoveredNode ? (
                <span className="text-amber-400 font-bold">
                  @ ({Math.round(hoveredNode.x)}, {Math.round(hoveredNode.y)}): {hoveredNode.voltage.toFixed(3)}V (-{hoveredNode.dropPercent.toFixed(2)}%)
                </span>
              ) : (
                <span className="text-gray-500">Hover canvas to inspect local voltage node</span>
              )}
            </div>

            {/* SVG Power Grid Canvas */}
            <svg
              width={560}
              height={560}
              viewBox={`0 0 ${floorplan.dieWidth} ${floorplan.dieHeight}`}
              className="overflow-visible select-none cursor-crosshair"
            >
              <defs>
                {/* Standard cell rail pattern */}
                <pattern id="m1Rails" width="100" height={powerPlan.railPitch * 2} patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="100" y2="0" stroke="#ef4444" strokeWidth={0.8} strokeOpacity={0.3} />
                  <line x1="0" y1={powerPlan.railPitch} x2="100" y2={powerPlan.railPitch} stroke="#06b6d4" strokeWidth={0.8} strokeOpacity={0.3} />
                </pattern>
              </defs>

              {/* 1. Die Background */}
              <rect
                x={0}
                y={0}
                width={floorplan.dieWidth}
                height={floorplan.dieHeight}
                fill="#15161b"
                stroke="#374151"
                strokeWidth={2}
                rx={6}
              />

              {/* 2. Core Boundary */}
              <rect
                x={floorplan.coreMarginLeft}
                y={floorplan.coreMarginTop}
                width={coreW}
                height={coreH}
                fill="#0f1015"
                stroke="#4b5563"
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />

              {/* 3. Underlying Macros */}
              {showMacros && floorplan.macros && floorplan.macros.map((macro) => {
                const absX = floorplan.coreMarginLeft + macro.x;
                const absY = floorplan.coreMarginTop + macro.y;
                return (
                  <g key={macro.id} transform={`translate(${absX}, ${absY})`} opacity={showHeatmap ? 0.35 : 0.6}>
                    <rect
                      x={0}
                      y={0}
                      width={macro.width}
                      height={macro.height}
                      fill="#1f2937"
                      stroke="#4b5563"
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={macro.width / 2}
                      y={macro.height / 2 + 4}
                      fill="#9ca3af"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {macro.name}
                    </text>
                  </g>
                );
              })}

              {/* 4. Standard Cell Rails (M1 Followpins) */}
              {showRails && (
                <rect
                  x={floorplan.coreMarginLeft}
                  y={floorplan.coreMarginTop}
                  width={coreW}
                  height={coreH}
                  fill="url(#m1Rails)"
                  pointerEvents="none"
                />
              )}

              {/* 5. Core Power Rings */}
              {showRings && powerPlan.enableRings && (
                <g>
                  {/* Outer VDD Ring */}
                  <rect
                    x={floorplan.coreMarginLeft - powerPlan.ringOffset}
                    y={floorplan.coreMarginTop - powerPlan.ringOffset}
                    width={coreW + powerPlan.ringOffset * 2}
                    height={coreH + powerPlan.ringOffset * 2}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={powerPlan.ringWidth}
                    strokeOpacity={0.85}
                    rx={4}
                  />
                  {/* Inner VSS Ring */}
                  <rect
                    x={floorplan.coreMarginLeft - powerPlan.ringOffset + powerPlan.ringWidth + powerPlan.ringSpacing}
                    y={floorplan.coreMarginTop - powerPlan.ringOffset + powerPlan.ringWidth + powerPlan.ringSpacing}
                    width={Math.max(20, coreW + (powerPlan.ringOffset - powerPlan.ringWidth - powerPlan.ringSpacing) * 2)}
                    height={Math.max(20, coreH + (powerPlan.ringOffset - powerPlan.ringWidth - powerPlan.ringSpacing) * 2)}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth={powerPlan.ringWidth}
                    strokeOpacity={0.85}
                    rx={3}
                  />
                </g>
              )}

              {/* 6. Vertical Power Straps (M6/M8) */}
              {showVStraps && powerPlan.enableVStraps && simulation.vStrapCoords.map((x, idx) => {
                const absX = floorplan.coreMarginLeft + x;
                const isVdd = idx % 2 === 0;
                const color = isVdd ? '#ef4444' : '#06b6d4';

                return (
                  <line
                    key={`v_${idx}`}
                    x1={absX}
                    y1={floorplan.coreMarginTop}
                    x2={absX}
                    y2={floorplan.coreMarginTop + coreH}
                    stroke={color}
                    strokeWidth={powerPlan.vStrapWidth}
                    strokeOpacity={0.8}
                  />
                );
              })}

              {/* 7. Horizontal Power Straps (M5/M7) */}
              {showHStraps && powerPlan.enableHStraps && simulation.hStrapCoords.map((y, idx) => {
                const absY = floorplan.coreMarginTop + y;
                const isVdd = idx % 2 === 0;
                const color = isVdd ? '#ef4444' : '#06b6d4';

                return (
                  <line
                    key={`h_${idx}`}
                    x1={floorplan.coreMarginLeft}
                    y1={absY}
                    x2={floorplan.coreMarginLeft + coreW}
                    y2={absY}
                    stroke={color}
                    strokeWidth={powerPlan.hStrapWidth}
                    strokeOpacity={0.8}
                  />
                );
              })}

              {/* 8. Via Interconnect Array Matrix */}
              {showVias && simulation.vStrapCoords.map((vx, vIdx) => {
                const isVddV = vIdx % 2 === 0;
                return simulation.hStrapCoords.map((hy, hIdx) => {
                  const isVddH = hIdx % 2 === 0;
                  // Only connect VDD-to-VDD and VSS-to-VSS
                  if (isVddV !== isVddH) return null;

                  const absX = floorplan.coreMarginLeft + vx;
                  const absY = floorplan.coreMarginTop + hy;
                  const color = isVddV ? '#fca5a5' : '#a5f3fc';

                  return (
                    <rect
                      key={`via_${vIdx}_${hIdx}`}
                      x={absX - 2.5}
                      y={absY - 2.5}
                      width={5}
                      height={5}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                    />
                  );
                });
              })}

              {/* 9. IR Drop Heatmap Grid Overlay */}
              {showHeatmap && simulation.nodes.map((node, nIdx) => {
                const absX = floorplan.coreMarginLeft + node.x;
                const absY = floorplan.coreMarginTop + node.y;
                const cellW = coreW / 19;
                const cellH = coreH / 19;

                return (
                  <rect
                    key={`heat_${nIdx}`}
                    x={absX - cellW / 2}
                    y={absY - cellH / 2}
                    width={cellW}
                    height={cellH}
                    fill={getHeatmapColor(node.dropPercent)}
                    className="transition-opacity hover:opacity-80"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  />
                );
              })}

              {/* 10. Corner Pad Bumps */}
              {floorplan.ioPads && floorplan.ioPads.filter(p => p.type === 'power' || p.type === 'ground').map(pad => {
                let px = 0;
                let py = 0;
                if (pad.side === 'top') {
                  px = pad.offset;
                  py = 10;
                } else if (pad.side === 'bottom') {
                  px = pad.offset;
                  py = floorplan.dieHeight - 10;
                } else if (pad.side === 'left') {
                  px = 10;
                  py = pad.offset;
                } else {
                  px = floorplan.dieWidth - 10;
                  py = pad.offset;
                }

                return (
                  <circle
                    key={pad.id}
                    cx={px}
                    cy={py}
                    r={6}
                    fill={pad.type === 'power' ? '#ef4444' : '#06b6d4'}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Inspector & Parameter Controls */}
        <div className="w-80 bg-[#151619] border-l border-white/10 flex flex-col h-full overflow-y-auto">
          {/* Layer Visibility Stack */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers size={13} className="text-emerald-400" />
              <span>Layer Visibility</span>
            </h4>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span>Core Rings (VDD / VSS)</span>
                </span>
                <input type="checkbox" checked={showRings} onChange={(e) => setShowRings(e.target.checked)} className="rounded accent-emerald-500" />
              </label>
              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Vertical Straps ({powerPlan.vStrapLayer})</span>
                </span>
                <input type="checkbox" checked={showVStraps} onChange={(e) => setShowVStraps(e.target.checked)} className="rounded accent-emerald-500" />
              </label>
              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  <span>Horizontal Straps ({powerPlan.hStrapLayer})</span>
                </span>
                <input type="checkbox" checked={showHStraps} onChange={(e) => setShowHStraps(e.target.checked)} className="rounded accent-emerald-500" />
              </label>
              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>Standard Cell Rails (M1)</span>
                </span>
                <input type="checkbox" checked={showRails} onChange={(e) => setShowRails(e.target.checked)} className="rounded accent-emerald-500" />
              </label>
              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
                  <span>Vias & Interconnect Array</span>
                </span>
                <input type="checkbox" checked={showVias} onChange={(e) => setShowVias(e.target.checked)} className="rounded accent-emerald-500" />
              </label>
              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block" />
                  <span>Floorplan Blocks & Macros</span>
                </span>
                <input type="checkbox" checked={showMacros} onChange={(e) => setShowMacros(e.target.checked)} className="rounded accent-emerald-500" />
              </label>
            </div>
          </div>

          {/* IR Drop Quality Metrics */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity size={13} className="text-amber-400" />
              <span>IR Drop Quality Metrics</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Nominal VDD:</span>
                <span className="font-mono text-gray-200">{powerPlan.supplyVoltage.toFixed(2)} V</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Worst-Case Voltage:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {(powerPlan.supplyVoltage - simulation.maxDropMv / 1000).toFixed(3)} V
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Peak IR Drop:</span>
                <span className={`font-mono font-bold ${simulation.isDrcPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulation.maxDropMv.toFixed(1)} mV ({simulation.maxDropPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Average IR Drop:</span>
                <span className="font-mono text-gray-200">{simulation.avgDropMv.toFixed(1)} mV</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Target Threshold:</span>
                <span className="font-mono text-gray-400">≤ {powerPlan.maxIRDropTargetPercent}%</span>
              </div>
            </div>
          </div>

          {/* Power Grid Geometry Configuration */}
          <div className="p-4 space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders size={13} className="text-emerald-400" />
              <span>Power Grid Configuration</span>
            </h4>

            {/* Voltage & Current */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Supply VDD (V)</label>
                <input
                  type="number"
                  step="0.05"
                  value={powerPlan.supplyVoltage}
                  onChange={(e) => handleUpdate('supplyVoltage', parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Sheet Res (mΩ/sq)</label>
                <input
                  type="number"
                  value={powerPlan.sheetResistanceMohm}
                  onChange={(e) => handleUpdate('sheetResistanceMohm', parseInt(e.target.value) || 40)}
                  className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                />
              </div>
            </div>

            {/* Power Ring Geometry */}
            <div className="space-y-2 text-xs pt-2 border-t border-white/5">
              <label className="text-gray-300 font-medium block">Power Rings</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 block text-[10px]">Ring Width (µm)</span>
                  <input
                    type="number"
                    value={powerPlan.ringWidth}
                    onChange={(e) => handleUpdate('ringWidth', parseInt(e.target.value) || 8)}
                    className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Ring Spacing (µm)</span>
                  <input
                    type="number"
                    value={powerPlan.ringSpacing}
                    onChange={(e) => handleUpdate('ringSpacing', parseInt(e.target.value) || 4)}
                    className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Vertical Straps */}
            <div className="space-y-2 text-xs pt-2 border-t border-white/5">
              <label className="text-gray-300 font-medium block">Vertical Straps ({powerPlan.vStrapLayer})</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 block text-[10px]">Width (µm)</span>
                  <input
                    type="number"
                    value={powerPlan.vStrapWidth}
                    onChange={(e) => handleUpdate('vStrapWidth', parseInt(e.target.value) || 4)}
                    className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Pitch (µm)</span>
                  <input
                    type="number"
                    value={powerPlan.vStrapPitch}
                    onChange={(e) => handleUpdate('vStrapPitch', parseInt(e.target.value) || 40)}
                    className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Horizontal Straps */}
            <div className="space-y-2 text-xs pt-2 border-t border-white/5">
              <label className="text-gray-300 font-medium block">Horizontal Straps ({powerPlan.hStrapLayer})</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 block text-[10px]">Width (µm)</span>
                  <input
                    type="number"
                    value={powerPlan.hStrapWidth}
                    onChange={(e) => handleUpdate('hStrapWidth', parseInt(e.target.value) || 4)}
                    className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Pitch (µm)</span>
                  <input
                    type="number"
                    value={powerPlan.hStrapPitch}
                    onChange={(e) => handleUpdate('hStrapPitch', parseInt(e.target.value) || 40)}
                    className="w-full bg-[#1A1C20] border border-white/10 rounded px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export PDN Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151619] border border-white/10 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode size={18} className="text-amber-400" />
                <h3 className="font-semibold text-gray-200 text-sm">Export Power Distribution Network (PDN) Script</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setScriptType('openroad')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${scriptType === 'openroad' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  OpenROAD PDN
                </button>
                <button
                  onClick={() => setScriptType('innovus')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${scriptType === 'innovus' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Innovus SRoute
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <pre className="text-xs font-mono text-gray-300 bg-[#0d0e12] p-4 rounded-lg border border-white/5 overflow-x-auto leading-relaxed">
                {scriptType === 'openroad' 
                  ? generateOpenRoadFloorplanTcl(floorplan, powerPlan)
                  : generateInnovusTcl(floorplan, powerPlan)}
              </pre>
            </div>

            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">Compatible with standard ASIC PDN generators</span>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyScript}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Copy size={14} />
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  onClick={() => setShowScriptModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-md text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
