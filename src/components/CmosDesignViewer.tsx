import React, { useState, useMemo } from 'react';
import { Cpu, Zap, Activity, ShieldCheck, Download, Copy, Check, Layers, Sliders, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export interface MosTransistor {
  id: string;
  type: 'PMOS' | 'NMOS';
  name: string;
  gate: string;
  drain: string;
  source: string;
  bulk: string;
  width: number; // in um or nm
  length: number; // in nm
  x: number;
  y: number;
}

export interface CmosDesignData {
  cellName: string;
  description: string;
  transistors: MosTransistor[];
  punDescription: string;
  pdnDescription: string;
  spiceNetlist: string;
  eulerPath?: string;
  sizingRecommendations: {
    pmosWidth: string;
    nmosWidth: string;
    mobilityRatio: string;
    tpLH: string;
    tpHL: string;
  };
}

interface CmosDesignViewerProps {
  data: CmosDesignData | null;
}

export function CmosDesignViewer({ data }: CmosDesignViewerProps) {
  const [inputStates, setInputStates] = useState<Record<string, '0' | '1'>>({ a: '0', b: '0' });
  const [activeSubTab, setActiveSubTab] = useState<'TRANSISTORS' | 'SPICE' | 'STICK_LAYOUT' | 'SIZING'>('TRANSISTORS');
  const [copied, setCopied] = useState(false);

  const defaultData: CmosDesignData = data || {
    cellName: 'CMOS_NAND2_X1',
    description: '2-Input Complementary CMOS NAND Standard Cell',
    punDescription: 'Parallel PMOS transistors (M1 || M2) pulled up to VDD',
    pdnDescription: 'Series NMOS transistors (M3 - M4) pulled down to VSS',
    sizingRecommendations: {
      pmosWidth: '1.2 μm (2x NMOS for symmetric drive)',
      nmosWidth: '0.6 μm (Series chain requires low Ron)',
      mobilityRatio: 'μn / μp ≈ 2.5 : 1',
      tpLH: '14.2 ps',
      tpHL: '13.8 ps'
    },
    transistors: [
      { id: 'm1', type: 'PMOS', name: 'MP1', gate: 'A', drain: 'Y', source: 'VDD', bulk: 'VDD', width: 1.2, length: 45, x: 120, y: 70 },
      { id: 'm2', type: 'PMOS', name: 'MP2', gate: 'B', drain: 'Y', source: 'VDD', bulk: 'VDD', width: 1.2, length: 45, x: 260, y: 70 },
      { id: 'm3', type: 'NMOS', name: 'MN1', gate: 'A', drain: 'Y', source: 'N_INT', bulk: 'VSS', width: 0.6, length: 45, x: 190, y: 220 },
      { id: 'm4', type: 'NMOS', name: 'MN2', gate: 'B', drain: 'N_INT', source: 'VSS', bulk: 'VSS', width: 0.6, length: 45, x: 190, y: 320 }
    ],
    eulerPath: 'VDD → MP1/MP2 (Parallel) → Y → MN1 → MN2 → VSS (Continuous Diffusion Path: A - B)',
    spiceNetlist: `* SPICE Netlist for 2-Input CMOS NAND
.SUBCKT NAND2_X1 A B Y VDD VSS
* Pull-Up Network (PMOS)
M1 Y A VDD VDD PMOS W=1.2u L=45n
M2 Y B VDD VDD PMOS W=1.2u L=45n

* Pull-Down Network (NMOS)
M3 Y A N_INT VSS NMOS W=0.6u L=45n
M4 N_INT B VSS VSS NMOS W=0.6u L=45n

* Load Capacitance
CL Y VSS 15fF
.ENDS NAND2_X1`
  };

  const toggleInput = (inp: string) => {
    setInputStates(prev => ({
      ...prev,
      [inp]: prev[inp] === '1' ? '0' : '1'
    }));
  };

  const copySpice = () => {
    navigator.clipboard.writeText(defaultData.spiceNetlist);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute live transistor states based on input
  const transistorConductivity = useMemo(() => {
    const states: Record<string, boolean> = {};
    defaultData.transistors.forEach(t => {
      const gateVal = inputStates[t.gate.toLowerCase()] || '0';
      if (t.type === 'PMOS') {
        states[t.id] = gateVal === '0'; // PMOS conducts when gate is 0
      } else {
        states[t.id] = gateVal === '1'; // NMOS conducts when gate is 1
      }
    });
    return states;
  }, [defaultData.transistors, inputStates]);

  // Compute output state
  const isOutputPulledUp = defaultData.transistors.some(t => t.type === 'PMOS' && transistorConductivity[t.id]);
  const isOutputPulledDown = defaultData.transistors.filter(t => t.type === 'NMOS').every(t => transistorConductivity[t.id]);
  const outputVoltage = isOutputPulledUp && !isOutputPulledDown ? 'VDD (1.0V)' : isOutputPulledDown ? 'VSS (0.0V)' : 'Floating (High-Z)';

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d12] text-gray-200 overflow-y-auto select-none">
      {/* Top Banner Controls */}
      <div className="p-4 bg-[#111620] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Cpu size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 flex items-center space-x-2">
              <span>Transistor-Level CMOS Circuit: {defaultData.cellName}</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">
                PUN/PDN Dual Topology
              </span>
            </h2>
            <p className="text-xs text-gray-400">{defaultData.description}</p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveSubTab('TRANSISTORS')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSubTab === 'TRANSISTORS' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Schematic
          </button>
          <button
            onClick={() => setActiveSubTab('SPICE')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSubTab === 'SPICE' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            SPICE Netlist
          </button>
          <button
            onClick={() => setActiveSubTab('STICK_LAYOUT')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSubTab === 'STICK_LAYOUT' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Stick Diagram
          </button>
          <button
            onClick={() => setActiveSubTab('SIZING')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSubTab === 'SIZING' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            W/L Sizing
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 items-center justify-center">
        
        {/* VIEW 1: TRANSISTORS SCHEMATIC */}
        {activeSubTab === 'TRANSISTORS' && (
          <div className="flex flex-col xl:flex-row gap-6 w-full items-center justify-center">
            {/* SVG Schematic Canvas */}
            <div className="bg-[#131924] border border-white/10 rounded-2xl p-6 shadow-2xl relative flex items-center justify-center">
              <svg width="460" height="460">
                {/* VDD Supply Rail Top */}
                <line x1="40" y1="30" x2="420" y2="30" stroke="#ef4444" strokeWidth="4" />
                <text x="50" y="22" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">VDD (1.0V)</text>

                {/* VSS Ground Rail Bottom */}
                <line x1="40" y1="430" x2="420" y2="430" stroke="#38bdf8" strokeWidth="4" />
                <text x="50" y="446" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">VSS (GND)</text>

                {/* PUN vs PDN Division Line */}
                <line x1="40" y1="160" x2="420" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                <text x="360" y="152" fill="#a855f7" fontSize="9" fontWeight="bold">PULL-UP (PUN)</text>
                <text x="350" y="176" fill="#3b82f6" fontSize="9" fontWeight="bold">PULL-DOWN (PDN)</text>

                {/* Transistors */}
                {defaultData.transistors.map(t => {
                  const isConducting = transistorConductivity[t.id];
                  const isPmos = t.type === 'PMOS';
                  const gateVal = inputStates[t.gate.toLowerCase()] || '0';

                  return (
                    <g key={t.id} transform={`translate(${t.x}, ${t.y})`} className="cursor-pointer">
                      {/* Transistor Body */}
                      <rect
                        x="-35"
                        y="-20"
                        width="70"
                        height="40"
                        rx="6"
                        fill={isConducting ? (isPmos ? '#701a75' : '#1e3a8a') : '#1e293b'}
                        stroke={isConducting ? (isPmos ? '#f472b6' : '#60a5fa') : '#475569'}
                        strokeWidth="1.5"
                      />

                      {/* Inversion Bubble for PMOS Gate */}
                      {isPmos && (
                        <circle cx="-42" cy="0" r="4" fill="#131924" stroke="#f472b6" strokeWidth="1.5" />
                      )}

                      {/* Transistor Label */}
                      <text x="0" y="-3" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {t.name} ({t.type})
                      </text>
                      <text x="0" y="10" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        W={t.width}μ L={t.length}n
                      </text>

                      {/* Gate Pin Input Label */}
                      <text x={isPmos ? "-52" : "-44"} y="4" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                        {t.gate}={gateVal}
                      </text>

                      {/* Conducting Status Indicator */}
                      <circle cx="28" cy="-14" r="3.5" fill={isConducting ? '#10b981' : '#64748b'} />
                    </g>
                  );
                })}

                {/* Output Net Line (Y) */}
                <line x1="190" y1="130" x2="380" y2="130" stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx="380" cy="130" r="5" fill="#f59e0b" />
                <text x="392" y="134" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  OUTPUT Y = {outputVoltage.includes('VDD') ? '1' : '0'}
                </text>
              </svg>
            </div>

            {/* Interactive Signal Controls & State Matrix */}
            <div className="w-full xl:w-80 flex flex-col space-y-4 text-xs">
              {/* Live Input Controls */}
              <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200">Interactive Inputs</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Live Probing</span>
                </div>
                <div className="flex items-center space-x-3">
                  {Object.keys(inputStates).map(inp => (
                    <button
                      key={inp}
                      onClick={() => toggleInput(inp)}
                      className={`flex-1 py-2 px-3 rounded-lg font-mono font-bold flex items-center justify-between transition-all cursor-pointer ${
                        inputStates[inp] === '1'
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                          : 'bg-[#1e293b] text-gray-300 hover:bg-[#334155]'
                      }`}
                    >
                      <span className="uppercase">{inp}:</span>
                      <span className="text-sm">{inputStates[inp]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Result */}
              <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-gray-400">
                  <span>Output Node (Y):</span>
                  <span className="text-amber-400 font-bold">{outputVoltage}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>PUN Status:</span>
                  <span className={isOutputPulledUp ? 'text-emerald-400' : 'text-gray-500'}>
                    {isOutputPulledUp ? 'Conducting (ON)' : 'Open (OFF)'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>PDN Status:</span>
                  <span className={isOutputPulledDown ? 'text-blue-400' : 'text-gray-500'}>
                    {isOutputPulledDown ? 'Conducting (ON)' : 'Open (OFF)'}
                  </span>
                </div>
              </div>

              {/* Network Descriptions */}
              <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-2 text-[11px]">
                <div className="font-bold text-purple-400">Pull-Up Network (PUN)</div>
                <p className="text-gray-400">{defaultData.punDescription}</p>
                <div className="font-bold text-blue-400 pt-1">Pull-Down Network (PDN)</div>
                <p className="text-gray-400">{defaultData.pdnDescription}</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SPICE NETLIST */}
        {activeSubTab === 'SPICE' && (
          <div className="w-full max-w-3xl bg-[#131924] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu size={18} className="text-purple-400" />
                <span className="font-bold text-sm text-gray-200">HSPICE / Spectre Subcircuit Netlist</span>
              </div>
              <button
                onClick={copySpice}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium rounded-md border border-white/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy SPICE'}</span>
              </button>
            </div>
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 overflow-x-auto">
              <pre className="whitespace-pre">{defaultData.spiceNetlist}</pre>
            </div>
          </div>
        )}

        {/* VIEW 3: STICK DIAGRAM & EULER PATH */}
        {activeSubTab === 'STICK_LAYOUT' && (
          <div className="w-full max-w-3xl bg-[#131924] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Layers size={18} className="text-purple-400" />
              <span className="font-bold text-sm text-gray-200">CMOS Stick Diagram & Continuous Diffusion Sharing</span>
            </div>

            {/* Visual Stick Layers */}
            <div className="bg-[#0b0f19] p-6 rounded-xl border border-white/5 flex items-center justify-center">
              <svg width="480" height="240" className="font-mono text-[10px]">
                {/* VDD Metal Rail (Blue) */}
                <line x1="30" y1="30" x2="450" y2="30" stroke="#3b82f6" strokeWidth="6" />
                <text x="40" y="24" fill="#93c5fd">Metal 1 (VDD)</text>

                {/* P-Diffusion Active Region (Yellow/Orange) */}
                <rect x="70" y="60" width="340" height="30" rx="4" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="80" y="80" fill="#fde68a">P-Diffusion (PMOS)</text>

                {/* Polysilicon Gate Stripes (Red) */}
                <rect x="150" y="45" width="12" height="150" rx="2" fill="#ef4444" />
                <text x="144" y="210" fill="#fca5a5" fontWeight="bold">Gate A</text>

                <rect x="290" y="45" width="12" height="150" rx="2" fill="#ef4444" />
                <text x="284" y="210" fill="#fca5a5" fontWeight="bold">Gate B</text>

                {/* N-Diffusion Active Region (Green) */}
                <rect x="70" y="150" width="340" height="30" rx="4" fill="#10b981" fillOpacity="0.4" stroke="#10b981" strokeWidth="1.5" />
                <text x="80" y="170" fill="#a7f3d0">N-Diffusion (NMOS)</text>

                {/* VSS Metal Rail (Blue) */}
                <line x1="30" y1="210" x2="450" y2="210" stroke="#3b82f6" strokeWidth="6" />
                <text x="40" y="230" fill="#93c5fd">Metal 1 (VSS)</text>
              </svg>
            </div>

            {/* Euler Path Info */}
            <div className="bg-[#161b22] p-4 rounded-xl border border-white/10 space-y-1.5 text-xs">
              <div className="font-bold text-purple-400">Euler Graph Analysis & Shared Diffusion</div>
              <p className="text-gray-300 font-mono text-[11px]">{defaultData.eulerPath}</p>
            </div>
          </div>
        )}

        {/* VIEW 4: W/L SIZING & PROPAGATION DELAY */}
        {activeSubTab === 'SIZING' && (
          <div className="w-full max-w-3xl bg-[#131924] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Sliders size={18} className="text-purple-400" />
              <span className="font-bold text-sm text-gray-200">Transistor Sizing & Delay Metrics</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#161b22] p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-purple-400 font-bold font-sans">PMOS Sizing Ratio</span>
                <p className="text-gray-200 font-bold text-sm">{defaultData.sizingRecommendations.pmosWidth}</p>
                <p className="text-[11px] text-gray-400 font-sans">Compensates for hole mobility deficit.</p>
              </div>

              <div className="bg-[#161b22] p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-blue-400 font-bold font-sans">NMOS Sizing Ratio</span>
                <p className="text-gray-200 font-bold text-sm">{defaultData.sizingRecommendations.nmosWidth}</p>
                <p className="text-[11px] text-gray-400 font-sans">Calculated for series resistance matching.</p>
              </div>

              <div className="bg-[#161b22] p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-emerald-400 font-bold font-sans">Propagation Delay (tpLH)</span>
                <p className="text-gray-200 font-bold text-sm">{defaultData.sizingRecommendations.tpLH}</p>
                <p className="text-[11px] text-gray-400 font-sans">Low-to-High rise delay with 15fF load.</p>
              </div>

              <div className="bg-[#161b22] p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-amber-400 font-bold font-sans">Propagation Delay (tpHL)</span>
                <p className="text-gray-200 font-bold text-sm">{defaultData.sizingRecommendations.tpHL}</p>
                <p className="text-[11px] text-gray-400 font-sans">High-to-Low fall delay through PDN stack.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
