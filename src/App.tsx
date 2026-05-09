import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Send, 
  Code2, 
  Play, 
  Layers, 
  Package, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen,
  Terminal,
  History,
  Check,
  Copy,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { generateCode } from './services/gemini';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: Date;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Build context from history
      const history = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = `History:\n${history}\n\nNew Request: ${input}\n\nPlease generate the full React code for this request.`;
      
      const code = await generateCode(prompt);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Eu gerei o código para você. Você pode vê-lo na aba de código ou no preview.",
        code,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentCode(code);
      setActiveTab('preview');
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Houve um erro ao gerar o código. Verifique sua conexão ou a chave de API.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock initial state
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Olá! Como posso ajudar você a construir seu aplicativo hoje? Descreva o que você precisa e eu gerarei o código React completo para você.",
          timestamp: new Date(),
        }
      ]);
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#050505] font-sans text-[#E2E2E2] selection:bg-emerald-500/30 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col border-r border-white/5 bg-zinc-950 relative z-10 shadow-2xl shadow-black/50"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between glass-panel">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center accent-glow">
                  <span className="text-black font-black text-xs">Λ</span>
                </div>
                <h1 className="serif-title text-xl tracking-tight text-white leading-none">Nova</h1>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-zinc-500 hover:text-white"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth custom-scrollbar">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-4 block">Generation Session</label>
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col gap-2 max-w-[95%]",
                    msg.role === 'user' ? "ml-auto" : "mr-auto"
                  )}
                >
                  <div 
                    className={cn(
                      "px-4 py-3 rounded-xl text-[13px] leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? "bg-zinc-800 text-white border border-white/5" 
                        : "bg-white/[0.03] text-zinc-300 border border-white/5"
                    )}
                  >
                    <div className="markdown-body">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-700 font-mono mt-1 opacity-60 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isGenerating && (
                <div className="flex flex-col gap-2 mr-auto max-w-[90%]">
                  <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-xl animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-5 border-t border-white/5 bg-zinc-950/50">
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe your vision..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none transition-all placeholder:text-zinc-700 h-24"
                />
                <button 
                  onClick={handleSend}
                  disabled={isGenerating || !input.trim()}
                  className="absolute right-3 bottom-3 w-8 h-8 bg-emerald-600 text-black rounded-lg flex items-center justify-center font-bold hover:bg-emerald-500 disabled:opacity-20 transition-all accent-glow"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {['Add Section', 'Modify Colors', 'Import Data'].map((tag) => (
                  <button key={tag} className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold hover:text-emerald-500 transition-colors pointer-events-none">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col relative h-full bg-[#0C0C0E] overflow-hidden">
        {/* Toggle Sidebar Button (when closed) */}
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute left-6 top-6 z-20 p-2 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-lg shadow-2xl"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Top Header */}
        <header className="h-14 border-b border-white/5 bg-[#050505] flex items-center justify-between px-6 z-10 glass-panel">
          <div className="flex items-center gap-6">
            {!sidebarOpen && (
               <div className="flex items-center gap-3 mr-4">
                 <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center accent-glow">
                    <span className="text-black font-black text-[10px]">Λ</span>
                  </div>
                 <h1 className="serif-title text-lg tracking-tight text-white">Nova</h1>
               </div>
            )}
            <div className="h-4 w-[1px] bg-white/10 hidden md:block"></div>
            <div className="flex bg-black/40 p-0.5 rounded-full border border-white/5">
              <button 
                onClick={() => setActiveTab('preview')}
                className={cn(
                  "px-4 py-1 rounded-full text-[11px] font-medium transition-all",
                  activeTab === 'preview' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Desktop
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={cn(
                  "px-4 py-1 rounded-full text-[11px] font-medium transition-all ml-1",
                  activeTab === 'code' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Code
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 mr-2">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-[#050505] flex items-center justify-center text-[9px] text-zinc-400 font-bold">JD</div>
              <div className="w-7 h-7 rounded-full bg-emerald-900 border border-[#050505] flex items-center justify-center text-[9px] text-emerald-400 font-bold">AI</div>
            </div>
            
            <button 
              onClick={copyToClipboard}
              className="p-2 border border-white/5 text-zinc-500 hover:text-white rounded-lg transition-colors group relative bg-white/5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold rounded-full transition-all accent-glow whitespace-nowrap">
              Deploy App
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative p-8 md:p-12 lg:p-16 overflow-hidden data-grid-bg flex flex-col">
          <div className="flex-1 app-preview-mask rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
            {/* Mock Viewport Header */}
            <div className="h-7 bg-[#141416] flex items-center px-4 gap-1.5 border-b border-white/5">
              <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
              <div className="mx-auto text-[9px] text-zinc-600 font-mono tracking-wider">PREVIEW_SANDBOX://RENDER.BIN</div>
            </div>

            {/* Display Area */}
            <div className="flex-1 relative bg-zinc-950 overflow-hidden">
              {activeTab === 'preview' ? (
                <div className="w-full h-full">
                  {currentCode ? (
                    <div className="w-full h-full animate-in fade-in duration-1000">
                      <PreviewFrame code={currentCode} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="mb-6 opacity-20">
                          <Sparkles className="w-16 h-16 text-emerald-500" />
                        </div>
                        <h2 className="serif-title text-4xl text-white mb-3 opacity-80">Aethelgard Engine</h2>
                        <p className="text-zinc-600 text-sm max-w-sm mx-auto leading-relaxed">
                          Your generative vision will manifest here in real-time as you weave the description.
                        </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-zinc-950 overflow-auto custom-scrollbar">
                  {currentCode ? (
                    <SyntaxHighlighter 
                      language="tsx" 
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '32px',
                        fontSize: '12px',
                        background: 'transparent',
                        fontFamily: '"JetBrains Mono", monospace',
                        lineHeight: '1.6'
                      }}
                    >
                      {currentCode}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-10">
                      <Terminal className="w-16 h-16" />
                      <p className="font-mono text-xs tracking-[0.4em] uppercase">Null Pointer Exception</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <footer className="h-8 border-t border-white/5 bg-black flex items-center justify-between px-6 z-10 text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
              SYSTEM ONLINE
            </span>
            <span className="hidden sm:inline">LATENCY: 14MS</span>
          </div>
          <div className="flex gap-6">
            <span className="text-emerald-900 border-x border-white/5 px-4 hidden md:inline">EMERALD_DEV_4.0.2</span>
            <span>ENGINE: PRO-V3.1</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Special component to handle dynamic rendering via Iframe
function PreviewFrame({ code }: { code: string }) {
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    // This is a simplified bundle. In a real environment, we'd use a true bundler service.
    // Here we inject the necessary scripts for React and Tailwind.
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; background: transparent; }
            #root { height: 100vh; width: 100vw; overflow: auto; }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: #18181b; }
            ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            ${code.replace(/import\s+.*\s+from\s+['"].*['"];?/g, '')}
            
            // Mocking motion for simple renders if it was used
            if (typeof window.motion === 'undefined') {
              window.motion = { div: (props) => <div {...props} />, section: (props) => <section {...props} /> };
            }

            const rootElement = document.getElementById('root');
            const root = ReactDOM.createRoot(rootElement);
            root.render(<App />);
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [code]);

  if (!blobUrl) return null;

  return (
    <iframe 
      src={blobUrl} 
      className="w-full h-full border-none bg-white rounded-sm shadow-2xl"
      title="Preview"
    />
  );
}
