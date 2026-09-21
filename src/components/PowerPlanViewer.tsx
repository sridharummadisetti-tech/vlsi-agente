import React, { useState } from 'react';
import { Zap, Activity, Flame, ShieldCheck, Grid, Sliders, BatteryCharging, AlertCircle } from 'lucide-react';

export interface PowerPlanData {
  nominalVoltage: number; // e.g. 0.85V
  vddRingWidth: number;   // in um
  vssRingWidth: number;
  strapPitch: number;     // in um
  strapWidth: number;
  worstCaseIrDrop: number; // in mV (e.g. 34.2 mV)
  maxCurrentDensity: number; // in mA/um
  targetMargin: string;
}

interface PowerPlanViewerProps {
  data: PowerPlanData | null;
}

export function PowerPlanViewer({ data }: PowerPlanViewerProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showRings, setShowRings] = useState(true);
  const [showStripes, setShowStripes] = useState(true);
  const [showRails, setShowRails] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'M7_VDD' | 'M6_VSS' | 'M1_RAILS'>('ALL');

  const defaultData: PowerPlanData = data || {
    nominalVoltage: 0.85,
    vddRingWidth: 16.0,
    vssRingWidth: 16.0,
    strapPitch: 80.0,
    strapWidth: 6.5,
    worstCaseIrDrop: 32.4, // mV
    maxCurrentDensity: 1.45, // mA/um
    targetMargin: '±4.2% (Pass)'
  };

  const canvasW = 460;
  const canvasH = 460;
  const ringOffset = 30;

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d12] text-gray-200 overflow-y-auto select-none">
      {/* Top Banner Controls */}
      <div className="p-4 bg-[#111620] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 flex items-center space-x-2">
              <span>Power Distribution Network (PDN) & IR Drop</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                VDD = {defaultData.nominalVoltage}V
              </span>
            </h2>
            <p className="text-xs text-gray-400">Power rings, metal straps, standard cell rails & static IR analysis</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border font-medium transition-colors ${
              showHeatmap 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-gray-200'
            }`}
          >
            <Flame size={14} />
            <span>IR Drop Heatmap</span>
          </button>
          
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showRings} 
              onChange={e => setShowRings(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-0"
            />
            <span className="text-gray-300">Power Rings</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showStripes} 
              onChange={e => setShowStripes(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-0"
            />
            <span className="text-gray-300">PDN Stripes</span>
          </label>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 items-center justify-center">
        {/* PDN Canvas */}
        <div className="bg-[#131924] border border-white/10 rounded-2xl p-6 shadow-2xl relative flex items-center justify-center">
          <svg width={canvasW} height={canvasH}>
            <defs>
              {/* Radial IR Drop Heatmap Gradient */}
              <radialGradient id="ir-drop-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.55" />
                <stop offset="75%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
              </radialGradient>
            </defs>

            {/* Die Base Area */}
            <rect
              x="10"
              y="10"
              width={canvasW - 20}
              height={canvasH - 20}
              rx="10"
              fill="#0b0f19"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* IR Drop Heatmap Overlay */}
            {showHeatmap && (
              <rect
                x={ringOffset + 15}
                y={ringOffset + 15}
                width={canvasW - (ringOffset + 15) * 2}
                height={canvasH - (ringOffset + 15) * 2}
                rx="8"
                fill="url(#ir-drop-gradient)"
              />
            )}

            {/* Standard Cell Rails (Metal 1 Horizontal Lines) */}
            {showRails && Array.from({ length: 24 }).map((_, i) => (
              <g key={`rail-${i}`}>
                <line
                  x1={ringOffset + 15}
                  y1={ringOffset + 20 + i * 16}
                  x2={canvasW - (ringOffset + 15)}
                  y2={ringOffset + 20 + i * 16}
                  stroke={i % 2 === 0 ? '#ef4444' : '#38bdf8'}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
              </g>
            ))}

            {/* Power Stripes Vertical (Metal 7 - VDD/VSS) */}
            {showStripes && Array.from({ length: 8 }).map((_, i) => {
              const xPos = ringOffset + 35 + i * 48;
              const isVdd = i % 2 === 0;

              return (
                <g key={`v-stripe-${i}`}>
                  <rect
                    x={xPos}
                    y={ringOffset}
                    width="4"
                    height={canvasH - ringOffset * 2}
                    fill={isVdd ? '#ef4444' : '#38bdf8'}
                    fillOpacity={isVdd ? 0.8 : 0.7}
                  />
                  {/* Vias to horizontal grid */}
                  {Array.from({ length: 6 }).map((_, j) => (
                    <circle
                      key={`via-${j}`}
                      cx={xPos + 2}
                      cy={ringOffset + 35 + j * 60}
                      r="2"
                      fill="#fef08a"
                    />
                  ))}
                </g>
              );
            })}

            {/* Power Stripes Horizontal (Metal 6 - VDD/VSS) */}
            {showStripes && Array.from({ length: 6 }).map((_, i) => {
              const yPos = ringOffset + 35 + i * 60;
              const isVdd = i % 2 !== 0;

              return (
                <rect
                  key={`h-stripe-${i}`}
                  x={ringOffset}
                  y={yPos}
                  width={canvasW - ringOffset * 2}
                  height="4"
                  fill={isVdd ? '#ef4444' : '#38bdf8'}
                  fillOpacity={isVdd ? 0.8 : 0.7}
                />
              );
            })}

            {/* Dual Power Rings (VDD Outer, VSS Inner) */}
            {showRings && (
              <g>
                {/* VDD Outer Ring (Red) */}
                <rect
                  x={ringOffset}
                  y={ringOffset}
                  width={canvasW - ringOffset * 2}
                  height={canvasH - ringOffset * 2}
                  rx="6"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="6"
                />
                {/* VSS Inner Ring (Blue) */}
                <rect
                  x={ringOffset + 8}
                  y={ringOffset + 8}
                  width={canvasW - (ringOffset + 8) * 2}
                  height={canvasH - (ringOffset + 8) * 2}
                  rx="4"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="6"
                />
              </g>
            )}

            {/* Legend Labels on Die */}
            <g transform="translate(40, 420)">
              <rect x="0" y="0" width="10" height="10" fill="#ef4444" />
              <text x="14" y="9" fill="#cbd5e1" fontSize="9" fontFamily="monospace">VDD (0.85V)</text>

              <rect x="110" y="0" width="10" height="10" fill="#38bdf8" />
              <text x="124" y="9" fill="#cbd5e1" fontSize="9" fontFamily="monospace">VSS (GND)</text>

              <circle cx="210" cy="5" r="3" fill="#fef08a" />
              <text x="218" y="9" fill="#cbd5e1" fontSize="9" fontFamily="monospace">Via M6-M7</text>
            </g>
          </svg>
        </div>

        {/* PDN Static IR & Electromigration Analysis Panel */}
        <div className="w-full xl:w-80 flex flex-col space-y-4 text-xs font-sans">
          {/* Worst-Case IR Drop Metric Card */}
          <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-gray-300 font-semibold">
              <span>Worst-Case IR Drop</span>
              <span className="text-amber-400 font-mono font-bold text-sm">{defaultData.worstCaseIrDrop} mV</span>
            </div>
            {/* Color Gradient Scale */}
            <div className="space-y-1">
              <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-red-500 border border-white/10" />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>0.0 mV (Ideal)</span>
                <span>Max: {defaultData.worstCaseIrDrop} mV</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px]">
              <ShieldCheck size={14} />
              <span>Meets sign-off target ({defaultData.targetMargin})</span>
            </div>
          </div>

          {/* PDN Grid Dimensions */}
          <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-2.5 font-mono text-[11px]">
            <h3 className="text-gray-200 font-bold font-sans text-xs border-b border-white/10 pb-1.5 flex items-center space-x-1.5">
              <BatteryCharging size={14} className="text-amber-400" />
              <span>PDN Specifications</span>
            </h3>
            <div className="flex justify-between text-gray-400">
              <span>Nominal Voltage:</span>
              <span className="text-emerald-400 font-bold">{defaultData.nominalVoltage} V</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Power Ring Width:</span>
              <span className="text-gray-200">{defaultData.vddRingWidth} μm (M8/M9)</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Strap Pitch / Width:</span>
              <span className="text-gray-200">{defaultData.strapPitch} / {defaultData.strapWidth} μm</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Max Current Density:</span>
              <span className="text-blue-400">{defaultData.maxCurrentDensity} mA/μm</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Electromigration (EM):</span>
              <span className="text-emerald-400 font-semibold">Pass (&lt; 2.0 mA/μm)</span>
            </div>
          </div>

          {/* Decap Recommendation */}
          <div className="bg-[#131924] p-3.5 rounded-xl border border-white/10 space-y-1.5 text-[11px] text-gray-400">
            <div className="font-semibold text-gray-200 flex items-center space-x-1.5">
              <AlertCircle size={13} className="text-amber-400" />
              <span>Decap Cells Optimization</span>
            </div>
            <p>124 Decap cells inserted near high-switching clock buffers to dampen dynamic supply ripple.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
