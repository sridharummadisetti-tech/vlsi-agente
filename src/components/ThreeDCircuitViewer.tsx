import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Layers, 
  Rotate3d, 
  Eye, 
  EyeOff, 
  Sliders, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Compass, 
  Maximize2, 
  Minimize2,
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause,
  Info,
  Layers3,
  Image as ImageIcon,
  Cuboid,
  Download,
  Share2,
  X
} from 'lucide-react';

export interface MetalLayer3D {
  id: string;
  name: string;
  level: number;
  thickness: number; // in nm
  sheetRes: string;
  material: 'Copper (Cu)' | 'Cobalt (Co)' | 'Tungsten (W)' | 'Ruthenium (Ru)' | 'Polysilicon' | 'Silicon Fin';
  color: string;
  altitude: number; // Z-position in nm/units
  features: {
    type: 'wire' | 'via' | 'fin' | 'gate' | 'pad' | 'diffusion';
    x: number;
    y: number;
    w: number;
    h: number;
    label?: string;
  }[];
}

export interface ThreeDChipData {
  chipName: string;
  technologyNode: string;
  layers: MetalLayer3D[];
  vias?: {
    fromLayer: string;
    toLayer: string;
    x: number;
    y: number;
    size: number;
  }[];
  metrics: {
    totalHeight: string;
    gatePitch: string;
    metal1Pitch: string;
    tsvDiameter: string;
    interconnectDelay: string;
  };
}

interface ThreeDCircuitViewerProps {
  data?: ThreeDChipData | null;
}

export function ThreeDCircuitViewer({ data }: ThreeDCircuitViewerProps) {
  // Mode: 'render' (photorealistic 3D image) or 'cad' (interactive 3D CSS model)
  const [viewMode, setViewMode] = useState<'render' | 'cad'>('render');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 3D Rotation Angles
  const [rotX, setRotX] = useState(60); // Pitch
  const [rotZ, setRotZ] = useState(-35); // Yaw
  const [explosionZ, setExplosionZ] = useState(1.4); // Z-separation factor
  const [zoom, setZoom] = useState(1.0);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [showDielectric, setShowDielectric] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Record<string, boolean>>({});

  // Mouse Drag for 3D Orbiting
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (isAutoRotating && viewMode === 'cad') {
      const step = () => {
        setRotZ(prev => (prev + 0.4) % 360);
        animFrameRef.current = requestAnimationFrame(step);
      };
      animFrameRef.current = requestAnimationFrame(step);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoRotating, viewMode]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const defaultData: ThreeDChipData = data || {
    chipName: '3nm FinFET & 7-Level BEOL Multilevel Stack',
    technologyNode: '3nm GAA-FET / FinFET Technology',
    metrics: {
      totalHeight: '8.4 μm',
      gatePitch: '42 nm (CPP)',
      metal1Pitch: '28 nm (EUV)',
      tsvDiameter: '1.2 μm',
      interconnectDelay: '3.4 ps/mm'
    },
    layers: [
      {
        id: 'sub',
        name: 'P-Type Silicon Substrate',
        level: 0,
        thickness: 400,
        sheetRes: '10 Ω·cm',
        altitude: 0,
        material: 'Silicon Fin',
        color: '#1e293b',
        features: [
          { type: 'wire', x: 20, y: 20, w: 340, h: 240, label: 'Bulk P-Silicon Wafer (<100> Lattice)' }
        ]
      },
      {
        id: 'feol',
        name: 'FEOL: 3D FinFET Channels & HKMG Gate',
        level: 1,
        thickness: 65,
        sheetRes: '2.5 Ω/sq',
        altitude: 40,
        material: 'Polysilicon',
        color: '#ef4444',
        features: [
          { type: 'fin', x: 50, y: 50, w: 280, h: 20, label: 'N-Channel 3D Fin (Drain/Source)' },
          { type: 'fin', x: 50, y: 110, w: 280, h: 20, label: 'N-Channel 3D Fin (Drain/Source)' },
          { type: 'fin', x: 50, y: 170, w: 280, h: 20, label: 'P-Channel 3D Fin (Epitaxial SiGe)' },
          { type: 'gate', x: 120, y: 35, w: 24, h: 180, label: 'Gate A (High-K Metal Gate)' },
          { type: 'gate', x: 220, y: 35, w: 24, h: 180, label: 'Gate B (High-K Metal Gate)' }
        ]
      },
      {
        id: 'm1',
        name: 'Metal 1: Local Standard Cell Rails (M1)',
        level: 2,
        thickness: 45,
        sheetRes: '0.45 Ω/sq',
        altitude: 85,
        material: 'Cobalt (Co)',
        color: '#3b82f6',
        features: [
          { type: 'wire', x: 30, y: 40, w: 320, h: 18, label: 'VDD Power Rail (M1)' },
          { type: 'wire', x: 110, y: 75, w: 45, h: 90, label: 'Internal Net Y (Co Liner)' },
          { type: 'wire', x: 210, y: 75, w: 45, h: 90, label: 'Intermediate Node' },
          { type: 'wire', x: 30, y: 210, w: 320, h: 18, label: 'VSS Ground Rail (M1)' }
        ]
      },
      {
        id: 'm2',
        name: 'Metal 2: Orthogonal Routing Grid (M2)',
        level: 3,
        thickness: 55,
        sheetRes: '0.22 Ω/sq',
        altitude: 130,
        material: 'Copper (Cu)',
        color: '#10b981',
        features: [
          { type: 'wire', x: 80, y: 25, w: 22, h: 210, label: 'Input A Net' },
          { type: 'wire', x: 180, y: 25, w: 22, h: 210, label: 'Input B Net' },
          { type: 'wire', x: 270, y: 25, w: 22, h: 210, label: 'Output Y Net' }
        ]
      },
      {
        id: 'm3',
        name: 'Metal 3: Semi-Global Signal Bus (M3)',
        level: 4,
        thickness: 75,
        sheetRes: '0.12 Ω/sq',
        altitude: 180,
        material: 'Copper (Cu)',
        color: '#a855f7',
        features: [
          { type: 'wire', x: 40, y: 70, w: 300, h: 28, label: 'Clock Trunk 1.2GHz' },
          { type: 'wire', x: 40, y: 140, w: 300, h: 28, label: 'Synchronous Reset' }
        ]
      },
      {
        id: 'top',
        name: 'Top Metal 7: Global Power Mesh & TSV Bumps',
        level: 5,
        thickness: 160,
        sheetRes: '0.04 Ω/sq',
        altitude: 235,
        material: 'Copper (Cu)',
        color: '#f59e0b',
        features: [
          { type: 'pad', x: 60, y: 55, w: 70, h: 70, label: '3D TSV Microbump 1 (VDD)' },
          { type: 'pad', x: 230, y: 55, w: 70, h: 70, label: '3D TSV Microbump 2 (VSS)' },
          { type: 'wire', x: 20, y: 160, w: 340, h: 44, label: 'Global VDD Power Strap (M7 Ultra-Thick)' }
        ]
      }
    ]
  };

  const toggleLayerVisibility = (id: string) => {
    setHiddenLayerIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setRotZ(prev => prev + dx * 0.5);
      setRotX(prev => Math.min(Math.max(prev - dy * 0.5, 5), 88));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const selectedLayerData = defaultData.layers.find(l => l.id === selectedLayer);

  return (
    <div className={`w-full h-full flex flex-col bg-[#0a0d12] text-gray-200 select-none ${isFullscreen ? 'fixed inset-0 z-50 overflow-hidden' : 'overflow-y-auto'}`}>
      
      {/* Top Banner Controls */}
      <div className="p-3 bg-[#111620] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <Layers3 size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 flex items-center space-x-2">
              <span>{defaultData.chipName}</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                {defaultData.technologyNode}
              </span>
            </h2>
            <p className="text-xs text-gray-400">3D Nanometer Cross-Section • FinFET Semiconductor Channels • BEOL Interconnect Mesh</p>
          </div>
        </div>

        {/* Mode Switcher & Fullscreen Action */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-black/50 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode('render')}
              className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'render' 
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ImageIcon size={13} />
              <span>3D Render</span>
            </button>
            <button
              onClick={() => setViewMode('cad')}
              className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'cad' 
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cuboid size={13} />
              <span>Interactive CAD</span>
            </button>
          </div>

          {/* CAD-specific Controls */}
          {viewMode === 'cad' && (
            <>
              {/* Layer Explosion Slider */}
              <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                <Sliders size={13} className="text-cyan-400" />
                <span className="text-gray-400">Z-Explosion:</span>
                <input 
                  type="range" 
                  min="0.4" 
                  max="2.8" 
                  step="0.1"
                  value={explosionZ} 
                  onChange={e => setExplosionZ(parseFloat(e.target.value))}
                  className="w-18 accent-cyan-400 cursor-pointer"
                />
                <span className="text-cyan-300 w-8">{explosionZ.toFixed(1)}x</span>
              </div>

              {/* Auto Rotate Toggle */}
              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`px-2.5 py-1.5 rounded-md border transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isAutoRotating 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
                title="Auto-rotate 3D Viewport"
              >
                {isAutoRotating ? <Pause size={13} /> : <Play size={13} />}
                <span>Spin</span>
              </button>

              {/* Dielectric Toggle */}
              <button
                onClick={() => setShowDielectric(!showDielectric)}
                className={`px-2.5 py-1.5 rounded-md border transition-all flex items-center space-x-1.5 cursor-pointer ${
                  showDielectric 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                <Layers size={13} />
                <span>Oxide</span>
              </button>
            </>
          )}

          {/* Zoom Buttons */}
          <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
              className="p-1 hover:bg-white/10 text-gray-300 rounded cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] text-cyan-400 px-1 font-mono">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.15, 2.2))}
              className="p-1 hover:bg-white/10 text-gray-300 rounded cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-3 py-1.5 rounded-md border transition-all flex items-center space-x-1.5 cursor-pointer ${
              isFullscreen 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' 
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 p-4 overflow-hidden relative">
        
        {/* VIEW MODE 1: PHOTOREALISTIC 3D IMAGE RENDERING */}
        {viewMode === 'render' && (
          <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#07090e] border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl group">
            
            {/* Image Container with Zoom */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden p-2">
              <img
                src="/silicon_3d_render.jpg"
                alt="3D FinFET Silicon & Multilevel BEOL Interconnect Stack"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            {/* Bottom Overlay Info Banner */}
            <div className="absolute bottom-4 left-4 right-4 bg-[#111620]/90 backdrop-blur-md border border-white/15 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-gray-200 font-bold">3nm FinFET / GAA-FET 3D Silicon Stack Cross-Section</span>
              </div>
              <div className="flex items-center space-x-4 text-gray-400 text-[11px]">
                <span>• 3D TSV Microbumps (Top)</span>
                <span>• Ultra-Thick Power Mesh (M7)</span>
                <span>• Cu / Co Interconnects (M1-M6)</span>
                <span>• High-K Metal Gates</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: INTERACTIVE 3D CAD ORBITAL CANVAS */}
        {viewMode === 'cad' && (
          <div 
            className="flex-1 h-full flex items-center justify-center bg-[#131924]/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative cursor-grab active:cursor-grabbing"
            style={{ perspective: '1300px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Top Clean Orbit Badge */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none text-xs text-gray-300 bg-black/75 px-3 py-1.5 rounded-lg border border-white/15 font-mono flex items-center space-x-2 backdrop-blur-sm shadow-md">
              <Compass size={14} className="text-cyan-400" />
              <span>Click & Drag to Rotate Orbit</span>
              <span className="text-cyan-400 font-bold">Pitch: {Math.round(rotX)}°</span>
              <span className="text-emerald-400 font-bold">Yaw: {Math.round(rotZ)}°</span>
            </div>

            {/* Hovered Feature Tooltip */}
            {hoveredFeature && (
              <div className="absolute bottom-3 left-3 z-20 pointer-events-none text-xs text-white bg-cyan-950/95 px-3 py-1.5 rounded-lg border border-cyan-500/40 font-mono backdrop-blur-sm shadow-lg flex items-center space-x-2">
                <Zap size={14} className="text-cyan-400" />
                <span>{hoveredFeature}</span>
              </div>
            )}

            {/* 3D Stack Container */}
            <div 
              className="w-[400px] h-[300px] relative transition-transform duration-75 ease-out"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${zoom})`,
              }}
            >
              {defaultData.layers.map((layer) => {
                if (hiddenLayerIds[layer.id]) return null;
                const isSelected = selectedLayer === layer.id;
                const zVal = layer.altitude * explosionZ;

                return (
                  <div
                    key={layer.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedLayer(layer.id); }}
                    className={`absolute inset-0 rounded-2xl transition-all cursor-pointer border ${
                      isSelected 
                        ? 'border-cyan-400 bg-[#162032]/95 ring-2 ring-cyan-500/40 shadow-2xl shadow-cyan-500/25' 
                        : 'border-white/15 bg-[#121824]/85 hover:border-cyan-400/50'
                    }`}
                    style={{
                      transform: `translateZ(${zVal}px)`,
                      boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                      backdropFilter: showDielectric ? 'blur(2px)' : undefined
                    }}
                  >
                    {showDielectric && (
                      <div className="absolute inset-0 bg-cyan-900/10 rounded-2xl pointer-events-none border border-cyan-400/20" />
                    )}

                    <div className="absolute -left-28 top-2 bg-black/85 text-white text-[9px] font-mono px-2 py-0.5 rounded-md border border-white/15 flex items-center space-x-1.5 shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
                      <span>L{layer.level}: {layer.name.slice(0, 14)}</span>
                    </div>

                    <svg className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id={`grad-${layer.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={layer.color} stopOpacity="0.9" />
                          <stop offset="100%" stopColor={layer.color} stopOpacity="0.6" />
                        </linearGradient>
                      </defs>

                      {layer.features.map((feat, idx) => (
                        <g 
                          key={idx}
                          onMouseEnter={() => setHoveredFeature(`[${layer.name}] ${feat.label || feat.type.toUpperCase()}`)}
                          onMouseLeave={() => setHoveredFeature(null)}
                        >
                          <rect
                            x={feat.x}
                            y={feat.y}
                            width={feat.w}
                            height={feat.h}
                            rx={feat.type === 'pad' ? 10 : feat.type === 'fin' ? 4 : 3}
                            fill={`url(#grad-${layer.id})`}
                            stroke={isSelected ? '#38bdf8' : '#ffffff'}
                            strokeWidth={isSelected ? 1.8 : 0.8}
                            strokeOpacity={0.8}
                            className="transition-all hover:stroke-cyan-300 hover:fill-opacity-100"
                          />
                          {feat.label && (
                            <text
                              x={feat.x + feat.w / 2}
                              y={feat.y + feat.h / 2 + 3}
                              fill="#ffffff"
                              fontSize="8"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                              className="pointer-events-none select-none drop-shadow"
                            >
                              {feat.label}
                            </text>
                          )}
                        </g>
                      ))}
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right Side Inspector & Physics Metrics */}
        {!isFullscreen && (
          <div className="w-full xl:w-96 flex flex-col space-y-3.5 text-xs font-sans overflow-y-auto max-h-full">
            
            {/* Silicon & BEOL Layers List */}
            <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Layers size={15} className="text-cyan-400" />
                  <h3 className="text-gray-100 font-bold text-xs">Silicon & BEOL Layers</h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{defaultData.layers.length} Active Levels</span>
              </div>

              <div className="space-y-2">
                {defaultData.layers.slice().reverse().map((layer) => {
                  const isSelected = selectedLayer === layer.id;
                  const isHidden = hiddenLayerIds[layer.id];

                  return (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={`w-full p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer font-mono text-[11px] ${
                        isSelected 
                          ? 'bg-cyan-500/15 border-cyan-400 text-white font-bold ring-1 ring-cyan-500/30' 
                          : isHidden 
                            ? 'bg-black/20 border-white/5 text-gray-600'
                            : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
                        <span className="truncate">{layer.name}</span>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                          {layer.thickness}nm
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                          title={isHidden ? 'Show Layer' : 'Hide Layer'}
                        >
                          {isHidden ? <EyeOff size={13} className="text-gray-600" /> : <Eye size={13} className="text-cyan-400" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Layer Detailed Inspector */}
            {selectedLayerData && (
              <div className="bg-[#131924] p-4 rounded-xl border border-cyan-500/30 space-y-2.5 font-mono text-[11px] animate-fadeIn flex-shrink-0">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-cyan-300 font-bold flex items-center space-x-1.5">
                    <Info size={13} />
                    <span>Layer Details: {selectedLayerData.name}</span>
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                    Level {selectedLayerData.level}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Material:</span>
                  <span className="text-white font-bold">{selectedLayerData.material}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Physical Thickness:</span>
                  <span className="text-cyan-300">{selectedLayerData.thickness} nm</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Sheet Resistance (Rs):</span>
                  <span className="text-emerald-400 font-bold">{selectedLayerData.sheetRes}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Features Count:</span>
                  <span className="text-gray-200">{selectedLayerData.features.length} geometries</span>
                </div>
              </div>
            )}

            {/* Technology Physical Metrics Card */}
            <div className="bg-[#131924] p-4 rounded-xl border border-white/10 space-y-2.5 font-mono text-[11px] flex-shrink-0">
              <h3 className="text-gray-200 font-bold font-sans text-xs border-b border-white/10 pb-2 flex items-center space-x-1.5">
                <Zap size={14} className="text-cyan-400" />
                <span>3D Silicon Characteristics</span>
              </h3>
              <div className="flex justify-between text-gray-400">
                <span>Contacted Poly Pitch (CPP):</span>
                <span className="text-emerald-400 font-bold">{defaultData.metrics.gatePitch}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Metal 1 Track Pitch:</span>
                <span className="text-cyan-400 font-bold">{defaultData.metrics.metal1Pitch}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>3D TSV Microbump Diameter:</span>
                <span className="text-amber-400 font-bold">{defaultData.metrics.tsvDiameter}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>RC Interconnect Delay:</span>
                <span className="text-purple-400 font-bold">{defaultData.metrics.interconnectDelay}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Multilevel Height:</span>
                <span className="text-gray-200">{defaultData.metrics.totalHeight}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
