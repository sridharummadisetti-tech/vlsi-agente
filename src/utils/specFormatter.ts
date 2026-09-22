export interface ComponentClassification {
  id: string;
  name: string;
  typeName: string;
  logicClass: string;
  subType: string;
  pkg: string;
  pinCount: number;
  description: string;
  family: string;
}

export interface MatchingIC {
  IC: string;
  name: string;
  description: string;
  type: string;
}

const IC_DATABASE: Record<string, ComponentClassification> = {
  '7400': {
    id: '7400',
    name: 'Quad 2-Input NAND Gate',
    typeName: 'Quad 2-Input NAND',
    logicClass: 'Combinational Logic',
    subType: 'Universal Gate',
    pkg: 'DIP-14 / SOIC-14',
    pinCount: 14,
    description: 'Contains four independent 2-input positive-NAND gates. Key building block for CMOS and TTL circuits.',
    family: '7400 Series TTL'
  },
  '7402': {
    id: '7402',
    name: 'Quad 2-Input NOR Gate',
    typeName: 'Quad 2-Input NOR',
    logicClass: 'Combinational Logic',
    subType: 'Universal Gate',
    pkg: 'DIP-14 / SOIC-14',
    pinCount: 14,
    description: 'Four independent 2-input NOR gates with active-high inputs and active-low OR functionality.',
    family: '7400 Series TTL'
  },
  '7404': {
    id: '7404',
    name: 'Hex Inverter (NOT Gates)',
    typeName: 'Hex Inverter',
    logicClass: 'Combinational Logic',
    subType: 'Inverting Buffer',
    pkg: 'DIP-14 / SOIC-14',
    pinCount: 14,
    description: 'Six independent inverting gates providing basic Boolean negation and signal inversion.',
    family: '7400 Series TTL'
  },
  '7408': {
    id: '7408',
    name: 'Quad 2-Input AND Gate',
    typeName: 'Quad 2-Input AND',
    logicClass: 'Combinational Logic',
    subType: 'Logic Conjunction',
    pkg: 'DIP-14 / SOIC-14',
    pinCount: 14,
    description: 'Four independent 2-input AND gates performing Boolean logical multiplication.',
    family: '7400 Series TTL'
  },
  '7432': {
    id: '7432',
    name: 'Quad 2-Input OR Gate',
    typeName: 'Quad 2-Input OR',
    logicClass: 'Combinational Logic',
    subType: 'Logic Disjunction',
    pkg: 'DIP-14 / SOIC-14',
    pinCount: 14,
    description: 'Four independent 2-input OR gates performing Boolean logical addition.',
    family: '7400 Series TTL'
  },
  '7486': {
    id: '7486',
    name: 'Quad 2-Input XOR Gate',
    typeName: 'Quad 2-Input XOR',
    logicClass: 'Arithmetic & Parity',
    subType: 'Exclusive OR Gate',
    pkg: 'DIP-14 / SOIC-14',
    pinCount: 14,
    description: 'Four independent 2-input Exclusive-OR gates essential for adders, comparators, and parity checkers.',
    family: '7400 Series TTL'
  },
  '7474': {
    id: '7474',
    name: 'Dual D-Type Positive-Edge-Triggered Flip-Flop',
    typeName: 'Dual D Flip-Flop',
    logicClass: 'Sequential Logic',
    subType: 'Edge-Triggered Storage',
    pkg: 'DIP-14 / SOIC-14',
    pinCount: 14,
    description: 'Dual D-type flip-flop with individual Clock, Data, Preset, and Clear inputs for pipeline registers.',
    family: '7400 Series TTL'
  },
  '7476': {
    id: '7476',
    name: 'Dual JK Flip-Flop with Set and Reset',
    typeName: 'Dual JK Flip-Flop',
    logicClass: 'Sequential Logic',
    subType: 'Master-Slave Storage',
    pkg: 'DIP-16 / SOIC-16',
    pinCount: 16,
    description: 'Dual JK flip-flops supporting Toggle, Set, Reset, and Hold modes for synchronous state machines.',
    family: '7400 Series TTL'
  },
  '74138': {
    id: '74138',
    name: '3-to-8 Line Decoder / Demultiplexer',
    typeName: '3-to-8 Decoder',
    logicClass: 'Data Routing',
    subType: 'Address Decoder',
    pkg: 'DIP-16 / SOIC-16',
    pinCount: 16,
    description: 'Decodes three binary weighted inputs into one of eight active-low mutually exclusive outputs.',
    family: '7400 Series TTL'
  },
  '74151': {
    id: '74151',
    name: '8-to-1 Line Data Selector / Multiplexer',
    typeName: '8-to-1 Multiplexer',
    logicClass: 'Data Routing',
    subType: 'Multiplexer (MUX)',
    pkg: 'DIP-16 / SOIC-16',
    pinCount: 16,
    description: 'Selects one of eight binary data sources based on a 3-bit address code to complementary outputs.',
    family: '7400 Series TTL'
  },
  '74283': {
    id: '74283',
    name: '4-Bit Binary Full Adder with Fast Carry',
    typeName: '4-Bit Full Adder',
    logicClass: 'Arithmetic Logic',
    subType: 'Lookahead Carry Adder',
    pkg: 'DIP-16 / SOIC-16',
    pinCount: 16,
    description: 'High-speed 4-bit binary full adder with internal look-ahead carry generation across all four bits.',
    family: '7400 Series TTL'
  },
  'full_adder': {
    id: 'full_adder',
    name: '1-Bit Static CMOS Full Adder (28T)',
    typeName: 'Full Adder Core',
    logicClass: 'Arithmetic Logic',
    subType: 'Static CMOS Mirror Cell',
    pkg: 'ASIC Standard Cell / DIP-14',
    pinCount: 14,
    description: 'Computes Sum = A ^ B ^ Cin and Cout = (A & B) | (Cin & (A ^ B)) in 28 complementary MOSFET transistors.',
    family: 'ASIC StdCell'
  },
  'alu': {
    id: 'alu',
    name: '4-Bit Arithmetic Logic Unit (ALU)',
    typeName: '4-Bit ALU Core',
    logicClass: 'Datapath / Processing',
    subType: 'Multi-Function ALU',
    pkg: 'DIP-24 / ASIC Macro',
    pinCount: 24,
    description: 'Performs arithmetic operations (ADD, SUB, INC, DEC) and logical operations (AND, OR, XOR, NOT, PASS).',
    family: 'ASIC Macro'
  }
};

export function findMatchingIC(query: string): MatchingIC | null {
  if (!query) return null;
  const q = query.toLowerCase();

  // Match 74xx numbers
  const numMatch = q.match(/(?:74|sn74|74ls|74hc|74hct)(\d{2,4})/i);
  if (numMatch && numMatch[1]) {
    const num = numMatch[1];
    for (const key of Object.keys(IC_DATABASE)) {
      if (key.includes(num)) {
        const item = IC_DATABASE[key];
        return {
          IC: key,
          name: item.name,
          description: item.description,
          type: item.typeName
        };
      }
    }
  }

  // Keyword matchers
  if (q.includes('full adder') || (q.includes('adder') && !q.includes('half'))) {
    return { IC: 'full_adder', name: '1-Bit Full Adder', description: IC_DATABASE['full_adder'].description, type: 'Full Adder' };
  }
  if (q.includes('nand')) {
    return { IC: '7400', name: '7400 Quad NAND', description: IC_DATABASE['7400'].description, type: 'Quad 2-Input NAND' };
  }
  if (q.includes('nor')) {
    return { IC: '7402', name: '7402 Quad NOR', description: IC_DATABASE['7402'].description, type: 'Quad 2-Input NOR' };
  }
  if (q.includes('not') || q.includes('inverter')) {
    return { IC: '7404', name: '7404 Hex Inverter', description: IC_DATABASE['7404'].description, type: 'Hex Inverter' };
  }
  if (q.includes('and')) {
    return { IC: '7408', name: '7408 Quad AND', description: IC_DATABASE['7408'].description, type: 'Quad 2-Input AND' };
  }
  if (q.includes('xor')) {
    return { IC: '7486', name: '7486 Quad XOR', description: IC_DATABASE['7486'].description, type: 'Quad 2-Input XOR' };
  }
  if (q.includes('or')) {
    return { IC: '7432', name: '7432 Quad OR', description: IC_DATABASE['7432'].description, type: 'Quad 2-Input OR' };
  }
  if (q.includes('d flip') || q.includes('dff')) {
    return { IC: '7474', name: '7474 Dual D Flip-Flop', description: IC_DATABASE['7474'].description, type: 'Dual D-FF' };
  }
  if (q.includes('jk')) {
    return { IC: '7476', name: '7476 Dual JK Flip-Flop', description: IC_DATABASE['7476'].description, type: 'Dual JK-FF' };
  }
  if (q.includes('decoder') || q.includes('138')) {
    return { IC: '74138', name: '74138 3:8 Decoder', description: IC_DATABASE['74138'].description, type: '3-to-8 Decoder' };
  }
  if (q.includes('mux') || q.includes('multiplexer') || q.includes('151')) {
    return { IC: '74151', name: '74151 8:1 MUX', description: IC_DATABASE['74151'].description, type: '8-to-1 Multiplexer' };
  }
  if (q.includes('alu')) {
    return { IC: 'alu', name: '4-Bit ALU', description: IC_DATABASE['alu'].description, type: '4-Bit ALU' };
  }

  return null;
}

export function getComponentClassification(queryOrIc: string): ComponentClassification {
  const match = findMatchingIC(queryOrIc);
  if (match && IC_DATABASE[match.IC]) {
    return IC_DATABASE[match.IC];
  }
  if (IC_DATABASE[queryOrIc]) {
    return IC_DATABASE[queryOrIc];
  }

  // Fallback dynamic classification
  const safeName = queryOrIc.trim().slice(0, 32) || 'Custom Digital Circuit';
  return {
    id: `custom_${Date.now()}`,
    name: safeName,
    typeName: 'Custom Digital Module',
    logicClass: 'Custom Digital Logic',
    subType: 'Synthesizable ASIC Block',
    pkg: 'QFN-32 / ASIC Macro',
    pinCount: 16,
    description: `User-specified digital hardware logic unit: ${safeName}.`,
    family: 'Custom RTL Flow'
  };
}
