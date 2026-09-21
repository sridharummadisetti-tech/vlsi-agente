import { 
  FloorplanConfig, 
  MacroBlock, 
  PhysicalDRCError, 
  IOPad, 
  PowerPlanConfig, 
  PowerGridSimulationResult, 
  PowerGridNode 
} from '../types/physicalDesign';

export function createDefaultPowerPlan(): PowerPlanConfig {
  return {
    supplyVoltage: 1.0,
    corePowerNets: {
      vdd: 'VDD',
      vss: 'VSS'
    },
    enableRings: true,
    ringWidth: 12,
    ringSpacing: 4,
    ringOffset: 12,
    enableVStraps: true,
    vStrapWidth: 8,
    vStrapPitch: 60,
    vStrapLayer: 'Metal6',
    enableHStraps: true,
    hStrapWidth: 8,
    hStrapPitch: 60,
    hStrapLayer: 'Metal5',
    enableRails: true,
    railPitch: 5.6,
    sheetResistanceMohm: 35,
    maxIRDropTargetPercent: 5.0
  };
}

export function simulatePowerGrid(floorplan: FloorplanConfig, powerPlan: PowerPlanConfig): PowerGridSimulationResult {
  const coreW = floorplan.dieWidth - floorplan.coreMarginLeft - floorplan.coreMarginRight;
  const coreH = floorplan.dieHeight - floorplan.coreMarginTop - floorplan.coreMarginBottom;

  // 1. Calculate Strap Coordinates
  const vStrapCoords: number[] = [];
  const vPitch = Math.max(15, powerPlan.vStrapPitch || 60);
  for (let x = vPitch / 2; x < coreW; x += vPitch) {
    vStrapCoords.push(Math.round(x));
  }

  const hStrapCoords: number[] = [];
  const hPitch = Math.max(15, powerPlan.hStrapPitch || 60);
  for (let y = hPitch / 2; y < coreH; y += hPitch) {
    hStrapCoords.push(Math.round(y));
  }

  // 2. Generate 19x19 Node Grid for IR Drop Heatmap & Analysis
  const gridDivs = 19;
  const nodes: PowerGridNode[] = [];
  let totalDropMv = 0;
  let maxDropPercent = 0;

  // Grid resistance & strap effectiveness factor
  const vDensity = (powerPlan.enableVStraps ? powerPlan.vStrapWidth : 1) / vPitch;
  const hDensity = (powerPlan.enableHStraps ? powerPlan.hStrapWidth : 1) / hPitch;
  const meshDensityFactor = (vDensity + hDensity) * 10;
  const ringBonus = powerPlan.enableRings ? (powerPlan.ringWidth / 12) : 0.4;
  const sheetResFactor = (powerPlan.sheetResistanceMohm || 35) / 35;
  const supplyV = powerPlan.supplyVoltage || 1.0;

  for (let gy = 0; gy < gridDivs; gy++) {
    for (let gx = 0; gx < gridDivs; gx++) {
      const x = ((gx + 0.5) / gridDivs) * coreW;
      const y = ((gy + 0.5) / gridDivs) * coreH;

      // Distance from outer power rings (edges of core)
      const distFromLeft = x;
      const distFromRight = coreW - x;
      const distFromTop = y;
      const distFromBottom = coreH - y;
      const distFromEdge = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);
      const normDistFromRing = Math.min(1.0, distFromEdge / (Math.min(coreW, coreH) / 2));

      // Check proximity to macro active power draws
      let macroCurrentLoadFactor = 1.0;
      if (floorplan.macros && floorplan.macros.length > 0) {
        for (const m of floorplan.macros) {
          if (x >= m.x && x <= m.x + m.width && y >= m.y && y <= m.y + m.height) {
            macroCurrentLoadFactor = 1.45;
            break;
          } else if (
            x >= m.x - 20 && x <= m.x + m.width + 20 &&
            y >= m.y - 20 && y <= m.y + m.height + 20
          ) {
            macroCurrentLoadFactor = 1.2;
          }
        }
      }

      // Physics model: Drop increases towards center of die, inversely proportional to strap mesh density & ring width
      const baseDrop = (1.2 + 3.8 * (1 - Math.cos(normDistFromRing * (Math.PI / 2)))) * macroCurrentLoadFactor;
      const effectiveDropPercent = Math.min(
        14.5,
        Math.max(
          0.3,
          (baseDrop * sheetResFactor * (1.2 / ringBonus)) / Math.max(0.6, meshDensityFactor)
        )
      );

      const dropMv = (effectiveDropPercent / 100) * supplyV * 1000;
      const voltage = supplyV - (dropMv / 1000);

      nodes.push({
        x: Math.round(x),
        y: Math.round(y),
        voltage: Math.round(voltage * 1000) / 1000,
        dropPercent: Math.round(effectiveDropPercent * 100) / 100
      });

      totalDropMv += dropMv;
      if (effectiveDropPercent > maxDropPercent) {
        maxDropPercent = effectiveDropPercent;
      }
    }
  }

  const maxDropMv = (maxDropPercent / 100) * supplyV * 1000;
  const avgDropMv = totalDropMv / nodes.length;
  const targetThreshold = powerPlan.maxIRDropTargetPercent || 5.0;

  return {
    vStrapCoords,
    hStrapCoords,
    nodes,
    maxDropMv: Math.round(maxDropMv * 10) / 10,
    maxDropPercent: Math.round(maxDropPercent * 100) / 100,
    avgDropMv: Math.round(avgDropMv * 10) / 10,
    isDrcPass: maxDropPercent <= targetThreshold
  };
}


export function createDefaultFloorplanConfig(): FloorplanConfig {
  const ioPads: IOPad[] = [];

  // Generate I/O Pad Ring around 700x700 die
  // Top
  ['VDD_0', 'CLK_IN', 'IN_A', 'IN_B', 'VSS_0'].forEach((name, i) => {
    ioPads.push({
      id: `pad_top_${i}`,
      name,
      type: name.startsWith('VDD') ? 'power' : name.startsWith('VSS') ? 'ground' : name.startsWith('CLK') ? 'clock' : 'input',
      side: 'top',
      offset: 120 + i * 110,
      width: 40,
      height: 20
    });
  });

  // Bottom
  ['VDD_1', 'RST_N', 'OUT_Y0', 'OUT_Y1', 'VSS_1'].forEach((name, i) => {
    ioPads.push({
      id: `pad_bot_${i}`,
      name,
      type: name.startsWith('VDD') ? 'power' : name.startsWith('VSS') ? 'ground' : name.startsWith('OUT') ? 'output' : 'input',
      side: 'bottom',
      offset: 120 + i * 110,
      width: 40,
      height: 20
    });
  });

  // Left
  ['VDD_L', 'BUS_IN0', 'BUS_IN1', 'BUS_IN2', 'VSS_L'].forEach((name, i) => {
    ioPads.push({
      id: `pad_left_${i}`,
      name,
      type: name.startsWith('VDD') ? 'power' : name.startsWith('VSS') ? 'ground' : 'input',
      side: 'left',
      offset: 120 + i * 110,
      width: 40,
      height: 20
    });
  });

  // Right
  ['VDD_R', 'BUS_OUT0', 'BUS_OUT1', 'BUS_OUT2', 'VSS_R'].forEach((name, i) => {
    ioPads.push({
      id: `pad_right_${i}`,
      name,
      type: name.startsWith('VDD') ? 'power' : name.startsWith('VSS') ? 'ground' : 'output',
      side: 'right',
      offset: 120 + i * 110,
      width: 40,
      height: 20
    });
  });

  const macros: MacroBlock[] = [
    {
      id: 'm_icache',
      name: 'I_CACHE_SRAM_8KB',
      type: 'sram',
      x: 30,
      y: 30,
      width: 200,
      height: 180,
      halo: 12,
      orientation: 'R0',
      pins: [
        { name: 'CLK', relX: 0.5, relY: 0, type: 'clock' },
        { name: 'DATA_OUT', relX: 1, relY: 0.5, type: 'output' }
      ],
      connectedPadIds: ['pad_top_1', 'pad_left_1']
    },
    {
      id: 'm_dcache',
      name: 'D_CACHE_SRAM_8KB',
      type: 'sram',
      x: 350,
      y: 30,
      width: 200,
      height: 180,
      halo: 12,
      orientation: 'R0',
      pins: [
        { name: 'CLK', relX: 0.5, relY: 0, type: 'clock' },
        { name: 'DATA_IN', relX: 0, relY: 0.5, type: 'input' }
      ],
      connectedPadIds: ['pad_top_1', 'pad_right_1']
    },
    {
      id: 'm_regfile',
      name: 'RF_32x32_DUAL_PORT',
      type: 'regfile',
      x: 30,
      y: 350,
      width: 190,
      height: 200,
      halo: 12,
      orientation: 'R0',
      pins: [
        { name: 'CLK', relX: 0.5, relY: 1, type: 'clock' },
        { name: 'RD_DATA', relX: 1, relY: 0.5, type: 'output' }
      ],
      connectedPadIds: ['pad_bot_1', 'pad_left_2']
    },
    {
      id: 'm_alu_mul',
      name: 'RV32M_MUL_DIV_UNIT',
      type: 'alu',
      x: 360,
      y: 360,
      width: 190,
      height: 190,
      halo: 12,
      orientation: 'R0',
      pins: [
        { name: 'A', relX: 0, relY: 0.3, type: 'input' },
        { name: 'B', relX: 0, relY: 0.7, type: 'input' },
        { name: 'RES', relX: 1, relY: 0.5, type: 'output' }
      ],
      connectedPadIds: ['pad_right_2', 'pad_bot_2']
    }
  ];

  return {
    dieWidth: 700,
    dieHeight: 700,
    coreMarginLeft: 50,
    coreMarginRight: 50,
    coreMarginTop: 50,
    coreMarginBottom: 50,
    stdCellRowHeight: 2.8,
    macros,
    ioPads
  };
}

export function checkFloorplanDRC(config: FloorplanConfig): PhysicalDRCError[] {
  const errors: PhysicalDRCError[] = [];
  const coreW = config.dieWidth - config.coreMarginLeft - config.coreMarginRight;
  const coreH = config.dieHeight - config.coreMarginTop - config.coreMarginBottom;

  // 1. Check Out of Core Boundary
  config.macros.forEach((m) => {
    if (m.x < 0 || m.y < 0 || m.x + m.width > coreW || m.y + m.height > coreH) {
      errors.push({
        id: `err_oob_${m.id}`,
        type: 'OUT_OF_CORE',
        severity: 'error',
        message: `Macro "${m.name}" exceeds core boundary limits (${coreW}µm × ${coreH}µm).`,
        macroIds: [m.id]
      });
    }
  });

  // 2. Check Macro Overlaps & Halo Violations
  for (let i = 0; i < config.macros.length; i++) {
    for (let j = i + 1; j < config.macros.length; j++) {
      const m1 = config.macros[i];
      const m2 = config.macros[j];

      // Physical Body Overlap
      const isOverlapX = m1.x < m2.x + m2.width && m1.x + m1.width > m2.x;
      const isOverlapY = m1.y < m2.y + m2.height && m1.y + m1.height > m2.y;

      if (isOverlapX && isOverlapY) {
        errors.push({
          id: `err_overlap_${m1.id}_${m2.id}`,
          type: 'MACRO_OVERLAP',
          severity: 'error',
          message: `Physical overlap detected between "${m1.name}" and "${m2.name}".`,
          macroIds: [m1.id, m2.id]
        });
      } else {
        // Halo Keepout Interference
        const halo1 = m1.halo || 0;
        const halo2 = m2.halo || 0;
        const reqHalo = Math.max(halo1, halo2);

        const haloOverlapX = m1.x - reqHalo < m2.x + m2.width && m1.x + m1.width + reqHalo > m2.x;
        const haloOverlapY = m1.y - reqHalo < m2.y + m2.height && m1.y + m1.height + reqHalo > m2.y;

        if (haloOverlapX && haloOverlapY) {
          errors.push({
            id: `warn_halo_${m1.id}_${m2.id}`,
            type: 'HALO_VIOLATION',
            severity: 'warning',
            message: `Placement Halo conflict (${reqHalo}µm) between "${m1.name}" and "${m2.name}".`,
            macroIds: [m1.id, m2.id]
          });
        }
      }
    }
  }

  // 3. Core Utilization Check
  const totalCoreArea = coreW * coreH;
  const macroArea = config.macros.reduce((sum, m) => sum + (m.width * m.height), 0);
  const macroUtilization = (macroArea / totalCoreArea) * 100;

  if (macroUtilization > 75) {
    errors.push({
      id: 'warn_util_high',
      type: 'ROUTABILITY',
      severity: 'warning',
      message: `High Macro Utilization (${macroUtilization.toFixed(1)}%). Core routing congestion likely during Detailed Route.`
    });
  }

  return errors;
}

export function autoArrangeMacros(config: FloorplanConfig): FloorplanConfig {
  const coreW = config.dieWidth - config.coreMarginLeft - config.coreMarginRight;
  const coreH = config.dieHeight - config.coreMarginTop - config.coreMarginBottom;
  const padSpacing = 25;

  const positions = [
    { x: padSpacing, y: padSpacing }, // Top-Left
    { x: coreW - padSpacing, y: padSpacing, alignRight: true }, // Top-Right
    { x: padSpacing, y: coreH - padSpacing, alignBottom: true }, // Bottom-Left
    { x: coreW - padSpacing, y: coreH - padSpacing, alignRight: true, alignBottom: true } // Bottom-Right
  ];

  const updatedMacros = config.macros.map((m, idx) => {
    const pos = positions[idx % positions.length];
    let newX = pos.x;
    let newY = pos.y;

    if (pos.alignRight) newX = pos.x - m.width;
    if (pos.alignBottom) newY = pos.y - m.height;

    return {
      ...m,
      x: Math.max(0, Math.min(newX, coreW - m.width)),
      y: Math.max(0, Math.min(newY, coreH - m.height))
    };
  });

  return {
    ...config,
    macros: updatedMacros
  };
}

export function generateOpenRoadFloorplanTcl(config: FloorplanConfig, pp?: any): string {
  const coreW = config.dieWidth - config.coreMarginLeft - config.coreMarginRight;
  const coreH = config.dieHeight - config.coreMarginTop - config.coreMarginBottom;

  return `# ==============================================================================
# OpenROAD Physical Design Floorplan Script
# Generated automatically by VLSI Studio Floorplan Engine
# ==============================================================================

# 1. Initialize Floorplan & Die Geometry
initialize_floorplan \\
    -die_area "0 0 ${config.dieWidth} ${config.dieHeight}" \\
    -core_area "${config.coreMarginLeft} ${config.coreMarginBottom} ${config.coreMarginLeft + coreW} ${config.coreMarginBottom + coreH}" \\
    -site "unithd"

# 2. Place Macro Blocks & Orientation Keepouts
${config.macros.map(m => {
  const absX = config.coreMarginLeft + m.x;
  const absY = config.coreMarginBottom + m.y;
  return `place_cell -inst_name "${m.name}" -origin "${absX} ${absY}" -orient "${m.orientation}" -status "PLACED"
add_halo -inst_name "${m.name}" -halo {${m.halo} ${m.halo} ${m.halo} ${m.halo}}`;
}).join('\n')}

# 3. Global Power Distribution Grid (PDN)
pdngen -config_file "pdn.cfg"

# 4. Standard Cell Row Generation & Tap Insertion
make_tracks
tapcell -endcap_master "sky130_fd_sc_hd__tapvpwrvgnd_1" -distance 14

puts "\[INFO] Floorplan completed with ${config.macros.length} placed hard macros."
`;
}

export function generateInnovusTcl(config: FloorplanConfig, pp?: any): string {
  const coreW = config.dieWidth - config.coreMarginLeft - config.coreMarginRight;
  const coreH = config.dieHeight - config.coreMarginTop - config.coreMarginBottom;

  return `# ==============================================================================
# Cadence Innovus Floorplanning Script
# Generated by VLSI Studio ASIC Backend Flow
# ==============================================================================

# 1. Specify Floorplan Size & Margins
floorPlan -d ${config.dieWidth} ${config.dieHeight} ${config.coreMarginLeft} ${config.coreMarginBottom} ${config.coreMarginRight} ${config.coreMarginTop}

# 2. Hard Macro Placement & Orientation
${config.macros.map(m => {
  const absX = config.coreMarginLeft + m.x;
  const absY = config.coreMarginBottom + m.y;
  return `dbSetInstLocation [dbGetInstByName "${m.name}"] {${absX} ${absY}}
dbSetInstOrient [dbGetInstByName "${m.name}"] "${m.orientation}"
dbSetInstFixed [dbGetInstByName "${m.name}"] 1
createHalo -inst "${m.name}" -width ${m.halo}`;
}).join('\n')}

# 3. Cut Rows & Placement Blockages under Macros
createRouteBlk -all -box {0 0 ${config.dieWidth} ${config.dieHeight}} -exceptPG
addRing -type core_rings -nets {VDD VSS} -layer {top Metal6 bottom Metal6 left Metal5 right Metal5} -width 12 -spacing 4

puts "Innovus Floorplan setup verified."
`;
}
