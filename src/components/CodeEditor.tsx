import React, { useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { Search, Replace } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: string;
}

const VERILOG_KEYWORDS = [
  'always', 'and', 'assign', 'automatic', 'begin', 'buf', 'bufif0', 'bufif1',
  'case', 'casex', 'casez', 'cell', 'cmos', 'config', 'deassign', 'default',
  'defparam', 'design', 'disable', 'edge', 'else', 'end', 'endcase', 'endconfig',
  'endfunction', 'endgenerate', 'endmodule', 'endprimitive', 'endspecify',
  'endtable', 'endtask', 'event', 'for', 'force', 'forever', 'fork', 'function',
  'generate', 'genvar', 'highz0', 'highz1', 'if', 'ifnone', 'incdir', 'include',
  'initial', 'inout', 'input', 'instance', 'integer', 'join', 'large', 'liblist',
  'library', 'localparam', 'macromodule', 'medium', 'module', 'nand', 'negedge',
  'nmos', 'nor', 'noshowcancelled', 'not', 'notif0', 'notif1', 'or', 'output',
  'parameter', 'pmos', 'posedge', 'primitive', 'pull0', 'pull1', 'pulldown',
  'pullup', 'rcmos', 'real', 'realtime', 'reg', 'release', 'repeat', 'rnmos',
  'rpmos', 'rtran', 'rtranif0', 'rtranif1', 'scalared', 'showcancelled',
  'signed', 'small', 'specify', 'specparam', 'strong0', 'strong1', 'supply0',
  'supply1', 'table', 'task', 'time', 'tran', 'tranif0', 'tranif1', 'tri',
  'tri0', 'tri1', 'triand', 'trior', 'trireg', 'unsigned', 'use', 'vectored',
  'wait', 'wand', 'weak0', 'weak1', 'while', 'wire', 'wor', 'xnor', 'xor'
];

const SV_KEYWORDS = [
  ...VERILOG_KEYWORDS,
  'alias', 'always_comb', 'always_ff', 'always_latch', 'assert', 'assume',
  'before', 'bind', 'bins', 'binsof', 'bit', 'break', 'build_coverage', 'byte',
  'chandle', 'checker', 'class', 'clocking', 'const', 'constraint', 'context',
  'continue', 'cover', 'covergroup', 'coverpoint', 'cross', 'dist', 'do',
  'endchecker', 'endclass', 'endclocking', 'endgroup', 'endinterface',
  'endpackage', 'endprogram', 'endproperty', 'endsequence', 'enum', 'expect',
  'export', 'extends', 'extern', 'final', 'first_match', 'foreach', 'forkjoin',
  'iff', 'ignore_bins', 'illegal_bins', 'implements', 'import', 'inside',
  'int', 'interface', 'intersect', 'join_any', 'join_none', 'local', 'logic',
  'longint', 'matches', 'modport', 'new', 'null', 'package', 'packed',
  'priority', 'program', 'property', 'protected', 'pure', 'rand', 'randc',
  'randcase', 'randsequence', 'ref', 'return', 'sequence', 'shortint',
  'shortreal', 'solve', 'static', 'string', 'struct', 'super', 'tagged',
  'this', 'throughout', 'timeprecision', 'timeunit', 'type', 'typedef',
  'union', 'unique', 'unique0', 'var', 'virtual', 'void', 'wait_order',
  'wildcard', 'with', 'within'
];

const SNIPPETS = [
  {
    label: 'module',
    insertText: 'module ${1:name} (\n\tinput wire ${2:clk},\n\toutput reg ${3:out}\n);\n\n\t${0}\n\nendmodule',
    documentation: 'Module declaration'
  },
  {
    label: 'always_ff',
    insertText: 'always_ff @(posedge ${1:clk} or negedge ${2:rst_n}) begin\n\tif (!${2:rst_n}) begin\n\t\t${3}\n\tend else begin\n\t\t${0}\n\tend\nend',
    documentation: 'Sequential logic block'
  },
  {
    label: 'always_comb',
    insertText: 'always_comb begin\n\t${0}\nend',
    documentation: 'Combinational logic block'
  },
  {
    label: 'initial',
    insertText: 'initial begin\n\t${0}\nend',
    documentation: 'Initial block'
  }
];

export function CodeEditor({ code, onChange, language }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const triggerFind = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.find').run();
    }
  };

  const triggerReplace = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.startFindReplaceAction').run();
    }
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('verilog-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'custom-error', foreground: 'ff0000', fontStyle: 'bold' }
      ],
      colors: {
        'editor.background': '#1A1C20',
        'editor.lineHighlightBackground': '#ffffff0a',
        'editorLineNumber.foreground': '#858585',
        'editorIndentGuide.background': '#404040',
        'editorSuggestWidget.background': '#252526',
        'editorSuggestWidget.border': '#454545',
        'editorSuggestWidget.foreground': '#d4d4d4',
        'editorSuggestWidget.selectedBackground': '#062f4a',
        'editorSuggestWidget.highlightForeground': '#18a3ff'
      }
    });

    const provider = {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          ...SV_KEYWORDS.map(k => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            range
          })),
          ...SNIPPETS.map(s => ({
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: s.documentation,
            range
          }))
        ];

        return { suggestions };
      }
    };

    monaco.languages.registerCompletionItemProvider('verilog', provider);
    monaco.languages.registerCompletionItemProvider('systemverilog', provider);
  };

  const loadingFallback = (
    <div className="w-full h-full bg-[#1A1C20] text-gray-300 font-mono text-xs p-4 overflow-auto">
      <pre className="whitespace-pre-wrap">{code}</pre>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col relative bg-[#1A1C20]">
      <div className="absolute top-4 right-6 z-10 flex space-x-2">
        <button 
          onClick={triggerFind} 
          className="p-1.5 bg-[#1A1C20] hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded border border-white/10 shadow-sm transition-colors cursor-pointer" 
          title="Find (Ctrl+F)"
        >
          <Search size={16} />
        </button>
        <button 
          onClick={triggerReplace} 
          className="p-1.5 bg-[#1A1C20] hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded border border-white/10 shadow-sm transition-colors cursor-pointer" 
          title="Replace (Ctrl+H)"
        >
          <Replace size={16} />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language === 'systemverilog' ? 'verilog' : language}
          theme="verilog-dark"
          value={code}
          loading={loadingFallback}
          onChange={(value) => onChange(value || '')}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 24,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: 'never',
              seedSearchStringFromSelection: 'always'
            }
          }}
        />
      </div>
    </div>
  );
}
