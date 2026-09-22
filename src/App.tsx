import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CodeEditor } from './components/CodeEditor';
import { LogicDiagramViewer } from './components/LogicDiagramViewer';
import { WaveformViewer } from './components/WaveformViewer';
import { TruthTableViewer } from './components/TruthTableViewer';
import { VerificationReport } from './components/VerificationReport';
import { SchematicViewer, SchematicData } from './components/SchematicViewer';
import { FloorplanViewer, FloorplanData } from './components/FloorplanViewer';
import { PowerPlanViewer, PowerPlanData } from './components/PowerPlanViewer';
import { CmosDesignViewer, CmosDesignData } from './components/CmosDesignViewer';
import { ThreeDCircuitViewer, ThreeDChipData } from './components/ThreeDCircuitViewer';
import { PinDiagramViewer, PinDiagramData } from './components/PinDiagramViewer';
import { ChatInterface } from './components/ChatInterface';
import { 
  Cpu, 
  Code2, 
  FileCheck2, 
  Network, 
  Layers, 
  Activity, 
  Menu, 
  X, 
  Table, 
  Zap, 
  Box, 
  Flame, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { 
  generateRtl, 
  generateTestbench, 
  verifyRtl, 
  generateDiagram, 
  designChip, 
  generateWaveform, 
  generateTruthTable,
  generateSchematicData,
  generateFloorplanData,
  generatePowerPlanData,
  generateCmosDesignData,
  generate3DChipData,
  generatePinDiagramData
} from './services/geminiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'rtl' | 'testbench' | 'truthtable' | 'pin' | 'cmos' | 'schematic' | 'threed' | 'floorplan' | 'powerplan' | 'waveform' | 'diagram' | 'verification' | 'architecture'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTruthTablePanelOpen, setIsTruthTablePanelOpen] = useState(false);
  
  const [rtlCode, setRtlCode] = useState<string>('// Enter a description and click "Generate RTL" to start');
  const [testbenchCode, setTestbenchCode] = useState<string>('// Generate testbench from RTL');
  const [verificationReport, setVerificationReport] = useState<string>('No report generated yet.');
  const [diagramData, setDiagramData] = useState<any>(null);
  const [waveformData, setWaveformData] = useState<any>(null);
  const [truthTableData, setTruthTableData] = useState<any>(null);
  const [architectureDoc, setArchitectureDoc] = useState<string>('No architecture designed yet.');
  const [schematicData, setSchematicData] = useState<SchematicData | null>(null);
  const [floorplanData, setFloorplanData] = useState<FloorplanData | null>(null);
  const [powerPlanData, setPowerPlanData] = useState<PowerPlanData | null>(null);
  const [cmosData, setCmosData] = useState<CmosDesignData | null>(null);
  const [threeDData, setThreeDData] = useState<ThreeDChipData | null>(null);
  const [pinDiagramData, setPinDiagramData] = useState<PinDiagramData | null>(null);

  const [isGeneratingRtl, setIsGeneratingRtl] = useState(false);
  const [isGeneratingTb, setIsGeneratingTb] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false);
  const [isGeneratingTruthTable, setIsGeneratingTruthTable] = useState(false);
  const [isDesigningChip, setIsDesigningChip] = useState(false);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);

  const handleGenerateRtl = async (description: string) => {
    setIsGeneratingRtl(true);
    try {
      const code = await generateRtl(description);
      if (code) {
        setRtlCode(code);
        setActiveTab('rtl');
        
        // Auto-synthesize all views concurrently
        generateTestbench(code).then((tb) => {
          if (tb) {
            setTestbenchCode(tb);
            generateWaveform(code, tb).then((wf) => wf && setWaveformData(wf));
          }
        });
        generateDiagram(code).then((diag) => diag && setDiagramData(diag));
        generateTruthTable(code).then((tt) => tt && setTruthTableData(tt));
        verifyRtl(code).then((rep) => rep && setVerificationReport(rep));
        designChip(description || code).then((doc) => doc && setArchitectureDoc(doc));
        generateSchematicData(code).then((sch) => sch && setSchematicData(sch));
        generateFloorplanData(code).then((fp) => fp && setFloorplanData(fp));
        generatePowerPlanData(code).then((pp) => pp && setPowerPlanData(pp));
        generateCmosDesignData(code).then((cm) => cm && setCmosData(cm));
        generate3DChipData(code).then((td) => td && setThreeDData(td));
        generatePinDiagramData(code).then((pd) => pd && setPinDiagramData(pd));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingRtl(false);
    }
  };

  // Synchronize 3D, CMOS, Schematic, Pin Diagram, Logic Diagram, and Truth Table views whenever RTL code changes
  React.useEffect(() => {
    if (rtlCode && !rtlCode.startsWith('//')) {
      generate3DChipData(rtlCode).then(td => td && setThreeDData(td));
      generateTruthTable(rtlCode).then(tt => tt && setTruthTableData(tt));
      generateCmosDesignData(rtlCode).then(cm => cm && setCmosData(cm));
      generateSchematicData(rtlCode).then(sch => sch && setSchematicData(sch));
      generateFloorplanData(rtlCode).then(fp => fp && setFloorplanData(fp));
      generatePowerPlanData(rtlCode).then(pp => pp && setPowerPlanData(pp));
      generatePinDiagramData(rtlCode).then(pd => pd && setPinDiagramData(pd));
      generateDiagram(rtlCode).then(diag => diag && setDiagramData(diag));
    }
  }, [rtlCode]);

  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (rtlCode && !rtlCode.startsWith('//')) {
      if (tab === 'diagram') {
        generateDiagram(rtlCode).then(diag => diag && setDiagramData(diag));
      }
      if (tab === 'truthtable') {
        generateTruthTable(rtlCode).then(tt => tt && setTruthTableData(tt));
      }
      if (tab === 'pin') {
        generatePinDiagramData(rtlCode).then(pd => pd && setPinDiagramData(pd));
      }
      if (tab === 'cmos') {
        generateCmosDesignData(rtlCode).then(cm => cm && setCmosData(cm));
      }
      if (tab === 'threed') {
        generate3DChipData(rtlCode).then(td => td && setThreeDData(td));
      }
      if (tab === 'schematic') {
        generateSchematicData(rtlCode).then(sch => sch && setSchematicData(sch));
      }
      if (tab === 'floorplan') {
        generateFloorplanData(rtlCode).then(fp => fp && setFloorplanData(fp));
      }
      if (tab === 'powerplan') {
        generatePowerPlanData(rtlCode).then(pp => pp && setPowerPlanData(pp));
      }
    }
    if (tab === 'verification' && (!verificationReport || verificationReport === 'No report generated yet.') && rtlCode && !rtlCode.startsWith('//')) {
      handleVerifyRtl();
    }
    if (tab === 'architecture' && (!architectureDoc || architectureDoc === 'No architecture designed yet.')) {
      handleDesignChip(rtlCode.startsWith('//') ? 'Microarchitecture Specification' : rtlCode);
    }
  };

  const handleGeneratePinDiagram = async () => {
    if (!rtlCode || rtlCode.startsWith('//')) return;
    setIsGeneratingPin(true);
    try {
      const data = await generatePinDiagramData(rtlCode);
      if (data) {
        setPinDiagramData(data);
        setActiveTab('pin');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPin(false);
    }
  };


  const handleGenerateTestbench = async () => {
    if (!rtlCode || rtlCode.startsWith('//')) return;
    setIsGeneratingTb(true);
    try {
      const code = await generateTestbench(rtlCode);
      if (code) {
        setTestbenchCode(code);
        setActiveTab('testbench');
        generateWaveform(rtlCode, code).then((wf) => wf && setWaveformData(wf));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTb(false);
    }
  };

  const handleVerifyRtl = async () => {
    if (!rtlCode || rtlCode.startsWith('//')) return;
    setIsVerifying(true);
    try {
      const report = await verifyRtl(rtlCode);
      if (report) {
        setVerificationReport(report);
        setActiveTab('verification');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!rtlCode || rtlCode.startsWith('//')) return;
    setIsGeneratingDiagram(true);
    try {
      const data = await generateDiagram(rtlCode);
      if (data) {
        setDiagramData(data);
        setActiveTab('diagram');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  const handleGenerateWaveform = async () => {
    if (!rtlCode || rtlCode.startsWith('//')) return;
    setIsGeneratingWaveform(true);
    try {
      let tb = testbenchCode;
      if (!tb || tb.startsWith('//')) {
        tb = await generateTestbench(rtlCode);
        setTestbenchCode(tb);
      }
      const data = await generateWaveform(rtlCode, tb);
      if (data) {
        setWaveformData(data);
        setActiveTab('waveform');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingWaveform(false);
    }
  };

  const handleGenerateTruthTable = async () => {
    if (!rtlCode || rtlCode.startsWith('//')) return;
    setIsGeneratingTruthTable(true);
    try {
      const data = await generateTruthTable(rtlCode);
      if (data) {
        setTruthTableData(data);
        setIsTruthTablePanelOpen(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTruthTable(false);
    }
  };

  const handleDesignChip = async (description: string) => {
    setIsDesigningChip(true);
    try {
      const doc = await designChip(description);
      if (doc) {
        setArchitectureDoc(doc);
        setActiveTab('architecture');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDesigningChip(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#151619] text-gray-200 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-80 h-full shrink-0 border-r border-white/10">
        <Sidebar 
          onGenerateRtl={handleGenerateRtl} 
          isGenerating={isGeneratingRtl} 
          onDesignChip={handleDesignChip}
          isDesigning={isDesigningChip}
        />
      </div>

      {/* Sidebar - Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative w-80 max-w-[85vw] h-full bg-[#151619] flex flex-col shadow-2xl">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white z-10 bg-black/20 rounded-md"
            >
              <X size={18} />
            </button>
            <Sidebar 
              onGenerateRtl={(desc) => { handleGenerateRtl(desc); setIsSidebarOpen(false); }} 
              isGenerating={isGeneratingRtl} 
              onDesignChip={(desc) => { handleDesignChip(desc); setIsSidebarOpen(false); }}
              isDesigning={isDesigningChip}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#1A1C20] min-w-0">
        {/* Header / Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#151619] overflow-x-auto">
          <div className="flex items-center min-w-max">
            <button 
              className="md:hidden p-1.5 text-gray-400 hover:text-gray-200 bg-white/5 rounded-md border border-white/10 mr-3" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="flex space-x-1">
              <TabButton 
                active={activeTab === 'chat'} 
                onClick={() => handleSelectTab('chat')}
                icon={<Sparkles size={15} className="text-emerald-400" />}
                label="AI Chat"
              />
              <TabButton 
                active={activeTab === 'rtl'} 
                onClick={() => handleSelectTab('rtl')}
                icon={<Code2 size={15} />}
                label="RTL Code"
              />
              <TabButton 
                active={activeTab === 'truthtable'} 
                onClick={() => handleSelectTab('truthtable')}
                icon={<Table size={15} className="text-emerald-400" />}
                label="Truth Table"
              />
              <TabButton 
                active={activeTab === 'pin'} 
                onClick={() => handleSelectTab('pin')}
                icon={<Cpu size={15} className="text-emerald-400" />}
                label="Pin Diagram"
              />
              <TabButton 
                active={activeTab === 'cmos'} 
                onClick={() => handleSelectTab('cmos')}
                icon={<Cpu size={15} className="text-purple-400" />}
                label="CMOS Transistors"
              />
              <TabButton 
                active={activeTab === 'schematic'} 
                onClick={() => handleSelectTab('schematic')}
                icon={<Zap size={15} className="text-emerald-400" />}
                label="Schematic"
              />
              <TabButton 
                active={activeTab === 'threed'} 
                onClick={() => handleSelectTab('threed')}
                icon={<Box size={15} className="text-cyan-400" />}
                label="3D Silicon Stack"
              />
              <TabButton 
                active={activeTab === 'floorplan'} 
                onClick={() => handleSelectTab('floorplan')}
                icon={<Box size={15} className="text-blue-400" />}
                label="Floorplan"
              />
              <TabButton 
                active={activeTab === 'powerplan'} 
                onClick={() => handleSelectTab('powerplan')}
                icon={<Flame size={15} className="text-amber-400" />}
                label="Power Plan"
              />
              <TabButton 
                active={activeTab === 'waveform'} 
                onClick={() => handleSelectTab('waveform')}
                icon={<Activity size={15} />}
                label="Waveform"
              />
              <TabButton 
                active={activeTab === 'diagram'} 
                onClick={() => handleSelectTab('diagram')}
                icon={<Network size={15} />}
                label="Block Diagram"
              />
              <TabButton 
                active={activeTab === 'testbench'} 
                onClick={() => handleSelectTab('testbench')}
                icon={<Cpu size={15} />}
                label="Testbench"
              />
              <TabButton 
                active={activeTab === 'verification'} 
                onClick={() => handleSelectTab('verification')}
                icon={<FileCheck2 size={15} />}
                label="Verification"
              />
              <TabButton 
                active={activeTab === 'architecture'} 
                onClick={() => handleSelectTab('architecture')}
                icon={<Layers size={15} />}
                label="Architecture"
              />
            </div>
          </div>
          
          <div className="flex space-x-1.5 min-w-max ml-4">
            <ActionButton 
              onClick={handleGeneratePinDiagram} 
              loading={isGeneratingPin}
              label="Pin Diagram"
            />
            <ActionButton 
              onClick={handleGenerateTestbench} 
              loading={isGeneratingTb}
              label="TB"
            />
            <ActionButton 
              onClick={handleVerifyRtl} 
              loading={isVerifying}
              label="Verify"
            />
            <ActionButton 
              onClick={handleGenerateDiagram} 
              loading={isGeneratingDiagram}
              label="Diagram"
            />
            <ActionButton 
              onClick={handleGenerateTruthTable} 
              loading={isGeneratingTruthTable}
              label="Truth Table"
            />
            <ActionButton 
              onClick={handleGenerateWaveform} 
              loading={isGeneratingWaveform}
              label="Waveform"
            />
            <button
              onClick={() => setIsTruthTablePanelOpen(!isTruthTablePanelOpen)}
              className={`p-1.5 rounded-md border transition-colors flex items-center justify-center cursor-pointer ${isTruthTablePanelOpen ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-400 hover:text-gray-200 border-white/10'}`}
              title="Toggle Truth Table Panel"
            >
              <Table size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex">
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'chat' && (
              <ChatInterface 
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onNavigateToTab={(tabId) => {
                  if (tabId === 'icExplorer' || tabId === 'specs') {
                    handleSelectTab('pin');
                  } else if (tabId === 'logicalVerification') {
                    handleSelectTab('truthtable');
                  } else if (tabId === 'cmosTransistor') {
                    handleSelectTab('cmos');
                  } else if (tabId === 'dftVerification') {
                    handleSelectTab('verification');
                  } else {
                    handleSelectTab(tabId as any);
                  }
                }}
                onOpenStudio={() => handleSelectTab('rtl')}
                onLoadRtlCode={(code) => {
                  setRtlCode(code);
                  handleSelectTab('rtl');
                }}
                currentRtlCode={rtlCode}
                onSelectComponent={(comp) => {
                  handleGenerateRtl(comp);
                }}
              />
            )}
            {activeTab === 'rtl' && (
              <CodeEditor code={rtlCode} onChange={setRtlCode} language="verilog" />
            )}
            {activeTab === 'truthtable' && (
              <TruthTableViewer data={truthTableData} />
            )}
            {activeTab === 'pin' && (
              <PinDiagramViewer 
                data={pinDiagramData} 
                onGenerate={handleGeneratePinDiagram}
                isGenerating={isGeneratingPin}
              />
            )}
            {activeTab === 'cmos' && (
              <CmosDesignViewer data={cmosData} />
            )}
            {activeTab === 'schematic' && (
              <SchematicViewer data={schematicData} />
            )}
            {activeTab === 'threed' && (
              <ThreeDCircuitViewer data={threeDData} />
            )}
            {activeTab === 'floorplan' && (
              <FloorplanViewer 
                config={floorplanData as any} 
                onChangeConfig={(cfg) => setFloorplanData(cfg as any)}
                onResetToRtl={() => {
                  if (rtlCode && !rtlCode.startsWith('//')) {
                    generateFloorplanData(rtlCode).then(fp => fp && setFloorplanData(fp));
                  }
                }}
              />
            )}
            {activeTab === 'powerplan' && (
              <PowerPlanViewer 
                floorplan={floorplanData as any} 
                powerPlan={powerPlanData as any} 
                onChangePowerPlan={(newPlan) => setPowerPlanData(newPlan as any)}
              />
            )}
            {activeTab === 'testbench' && (
              <CodeEditor code={testbenchCode} onChange={setTestbenchCode} language="systemverilog" />
            )}
            {activeTab === 'verification' && (
              <VerificationReport report={verificationReport} />
            )}
            {activeTab === 'diagram' && (
              <LogicDiagramViewer 
                data={diagramData} 
                onGenerate={handleGenerateDiagram}
                isGenerating={isGeneratingDiagram}
              />
            )}
            {activeTab === 'waveform' && (
              <WaveformViewer data={waveformData} />
            )}
            {activeTab === 'architecture' && (
              <VerificationReport report={architectureDoc} />
            )}
          </div>
          
          {/* Truth Table Side Panel */}
          {isTruthTablePanelOpen && (
            <div className="w-1/3 min-w-[300px] max-w-[500px] border-l border-white/10 bg-[#151619] flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <div className="flex items-center space-x-2 text-gray-200 font-medium text-sm">
                  <Table size={16} className="text-emerald-400" />
                  <span>Truth Table</span>
                </div>
                <button 
                  onClick={() => setIsTruthTablePanelOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TruthTableViewer data={truthTableData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
        active 
          ? 'bg-[#1A1C20] text-emerald-400 border-t border-x border-white/10 shadow-sm' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ActionButton({ onClick, loading, label }: { onClick: () => void, loading: boolean, label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium rounded-md border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
    >
      {loading && (
        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
