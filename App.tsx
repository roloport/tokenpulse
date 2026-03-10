
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { UsageEntry, Provider } from './types';
import { MODELS, INITIAL_DATA } from './constants';
import { BarChartIcon, TrendingUpIcon, WalletIcon, BrainIcon } from './components/Icons';
import { getAIInsights, extractUsageFromText } from './services/geminiService';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const App: React.FC = () => {
  const [history, setHistory] = useState<UsageEntry[]>(() => {
    const saved = localStorage.getItem('token_usage_history');
    return saved ? JSON.parse(saved) : JSON.parse(INITIAL_DATA);
  });
  
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  const [inputTokens, setInputTokens] = useState<number>(0);
  const [outputTokens, setOutputTokens] = useState<number>(0);
  const [agentName, setAgentName] = useState('');
  const [project, setProject] = useState('');
  const [smartInput, setSmartInput] = useState('');
  const [insights, setInsights] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'journey'>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  useEffect(() => {
    setSyncStatus('saving');
    localStorage.setItem('token_usage_history', JSON.stringify(history));
    const timer = setTimeout(() => setSyncStatus('synced'), 800);
    return () => clearTimeout(timer);
  }, [history]);

  const stats = useMemo(() => {
    const totalTokens = history.reduce((acc, curr) => acc + curr.inputTokens + curr.outputTokens, 0);
    const totalCost = history.reduce((acc, curr) => acc + curr.cost, 0);
    
    const providerMap = history.reduce((acc, curr) => {
      const model = MODELS.find(m => m.id === curr.modelId);
      const provider = model?.provider || 'Unknown';
      acc[provider] = (acc[provider] || 0) + curr.cost;
      return acc;
    }, {} as Record<string, number>);

    const projectMap = history.reduce((acc, curr) => {
      const p = curr.project || 'Unassigned';
      acc[p] = (acc[p] || 0) + curr.cost;
      return acc;
    }, {} as Record<string, number>);

    const providerData = Object.entries(providerMap).map(([name, value]) => ({ name, value }));
    const projectData = Object.entries(projectMap).map(([name, value]) => ({ name, value }));
    
    const dailyDataRaw = history.reduce((acc, curr) => {
      const date = new Date(curr.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + curr.cost;
      return acc;
    }, {} as Record<string, number>);

    const areaData = Object.entries(dailyDataRaw)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { totalTokens, totalCost, providerData, projectData, areaData };
  }, [history]);

  const currentModel = MODELS.find(m => m.id === selectedModelId)!;
  const projectedCost = (inputTokens * currentModel.inputPricePer1M / 1000000) + 
                       (outputTokens * currentModel.outputPricePer1M / 1000000);

  const handleAddUsage = () => {
    if (inputTokens <= 0 && outputTokens <= 0) return;

    const newEntry: UsageEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      modelId: selectedModelId,
      inputTokens,
      outputTokens,
      cost: projectedCost,
      purpose: 'Manual entry',
      project: project || 'Default',
      agentName: agentName || 'System',
      rawSource: smartInput
    };

    setHistory(prev => [newEntry, ...prev]);
    setInputTokens(0);
    setOutputTokens(0);
    setAgentName('');
    setSmartInput('');
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tokenpulse_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSmartPaste = async (val: string) => {
    setSmartInput(val);
    if (!val) return;

    try {
      const parsed = JSON.parse(val);
      const usage = parsed.usage || parsed.usage_metadata || parsed.usageMetadata || parsed.usage_stats;
      if (usage) {
        setInputTokens(usage.prompt_tokens || usage.input_tokens || usage.promptTokenCount || usage.prompt_token_count || 0);
        setOutputTokens(usage.completion_tokens || usage.output_tokens || usage.candidatesTokenCount || usage.candidates_token_count || usage.completion_token_count || 0);
        
        const possibleModel = parsed.model || parsed.model_name || parsed.id;
        if (possibleModel) {
          const matched = MODELS.find(m => possibleModel.toLowerCase().includes(m.id.toLowerCase()));
          if (matched) setSelectedModelId(matched.id);
        }
      }
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-inter">
      {/* SaaS Nav Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <TrendingUpIcon />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TokenPulse<span className="text-indigo-500">.io</span></span>
          </div>
          
          <div className="hidden lg:flex items-center gap-2">
            {[
              { id: 'dashboard', label: 'Analytics' },
              { id: 'ledger', label: 'Ledger' },
              { id: 'journey', label: 'Workflow Guide' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white/5 text-indigo-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cloud Sync Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {syncStatus === 'synced' ? 'Local Vault Secured' : 'Syncing...'}
            </span>
          </div>
          
          <button 
            onClick={exportData}
            className="hidden sm:block text-xs font-bold text-slate-500 hover:text-white transition uppercase tracking-widest"
          >
            Export
          </button>

          <button 
            onClick={async () => {
              setIsAnalyzing(true);
              const res = await getAIInsights(history);
              setInsights(res);
              setIsAnalyzing(false);
            }}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
          >
            {isAnalyzing ? <span className="animate-pulse">Thinking...</span> : <><BrainIcon /> Insights</>}
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8">
        {activeTab === 'journey' && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-12 py-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Master the Multi-LLM Economy</h2>
              <p className="text-slate-400 text-lg">Stop flying blind. See exactly where your spend goes as you scale your agentic workflows.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {[
                { step: "Step 01", title: "API Dispatch", desc: "Your software makes calls to Gemini, OpenAI, or Claude.", icon: "⚡" },
                { step: "Step 02", title: "Harvest Metadata", desc: "You intercept the 'usage' object from the response body.", icon: "📦" },
                { step: "Step 03", title: "Real-time Sync", desc: "Data is computed and cost-mapped instantly on TokenPulse.", icon: "💎" },
                { step: "Step 04", title: "Optimize & Pivot", desc: "AI Advisor tells you which models to drop or upgrade.", icon: "🚀" }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/50 border border-white/5 p-8 rounded-[32px] space-y-5 hover:bg-white/[0.02] transition-colors border-b-2 border-b-indigo-500/20">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">{item.icon}</div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">{item.step}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-slate-900/50 to-indigo-900/10 border border-white/5 p-10 rounded-[48px] flex flex-col lg:flex-row items-center gap-16">
               <div className="flex-1 space-y-8">
                 <h3 className="text-3xl font-bold text-white">How to Integrate Today?</h3>
                 <p className="text-slate-400 leading-relaxed">TokenPulse is built for the "Direct Capture" era. You don't need to change your architecture. Just log your existing usage metadata.</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { prov: "OpenAI", path: "usage" },
                      { prov: "Gemini", path: "usage_metadata" },
                      { prov: "Anthropic", path: "usage" },
                      { prov: "DeepSeek", path: "usage" }
                    ].map(i => (
                      <div key={i.prov} className="bg-black/40 px-5 py-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-300">{i.prov}</span>
                        <code className="text-[10px] text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">.{i.path}</code>
                      </div>
                    ))}
                 </div>
               </div>
               <div className="w-full lg:w-[450px] bg-black border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 blur-[100px] group-hover:bg-indigo-600/20 transition-all"></div>
                 <div className="flex items-center gap-2 mb-6">
                   <div className="w-3 h-3 rounded-full bg-red-500/30"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500/30"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
                 </div>
                 <pre className="text-[11px] text-indigo-300/80 mono leading-relaxed">
{`// Universal Extraction Hook
async function monitor(response) {
  const meta = response.usage || 
               response.usage_metadata;

  await TokenPulse.push({
    tokens: meta.total_tokens,
    model: response.model,
    agent: "CustomerSupport-V2"
  });
}`}
                 </pre>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Total Liability", val: `$${stats.totalCost.toFixed(2)}`, color: "text-emerald-400" },
                { label: "Token Volume", val: stats.totalTokens.toLocaleString(), color: "text-white" },
                { label: "Active Agents", val: [...new Set(history.map(h => h.agentName))].length, color: "text-indigo-400" },
                { label: "Efficiency Score", val: "94%", color: "text-amber-400" }
              ].map((s, i) => (
                <div key={i} className="bg-slate-950/80 border border-white/5 p-8 rounded-[32px] shadow-xl hover:bg-white/[0.02] transition group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition">{s.label}</p>
                  <p className={`text-4xl font-black mt-3 tracking-tighter ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-950 border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-8 sticky top-24">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight">Sync New Call</h2>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Metadata Stream</label>
                    <textarea 
                      value={smartInput}
                      onChange={(e) => handleSmartPaste(e.target.value)}
                      placeholder="Paste response JSON..."
                      className="w-full h-36 bg-black border border-white/5 rounded-2xl p-4 text-xs mono text-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder:text-slate-800"
                    />
                    <button 
                      onClick={async () => {
                        setIsParsing(true);
                        const res = await extractUsageFromText(smartInput);
                        if (res) {
                          setInputTokens(res.inputTokens);
                          setOutputTokens(res.outputTokens);
                          const m = MODELS.find(mod => res.modelId.toLowerCase().includes(mod.id.toLowerCase()));
                          if (m) setSelectedModelId(m.id);
                        }
                        setIsParsing(false);
                      }}
                      disabled={isParsing || !smartInput}
                      className="w-full py-3 text-[10px] font-black text-slate-400 bg-white/5 rounded-xl hover:bg-white/10 transition disabled:opacity-50 uppercase tracking-[0.2em]"
                    >
                      {isParsing ? 'Processing...' : 'Auto-Extract Intelligence'}
                    </button>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase">Provider / Model</span>
                      <select 
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xl p-3 text-sm text-white font-semibold outline-none focus:border-indigo-500/50 transition"
                      >
                        {MODELS.map(m => <option key={m.id} value={m.id}>{m.provider} - {m.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">In</span>
                        <input 
                          type="number" 
                          value={inputTokens || ''} 
                          onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)}
                          className="w-full bg-black border border-white/5 rounded-xl p-3 text-white mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Out</span>
                        <input 
                          type="number" 
                          value={outputTokens || ''} 
                          onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)}
                          className="w-full bg-black border border-white/5 rounded-xl p-3 text-white mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600/10 p-5 rounded-3xl flex justify-between items-center border border-indigo-600/20 shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Debit Impact</span>
                      <span className="text-[10px] text-slate-600 font-medium italic">Computed locally</span>
                    </div>
                    <span className="text-3xl font-black text-white mono tracking-tighter">${projectedCost.toFixed(5)}</span>
                  </div>

                  <button 
                    onClick={handleAddUsage}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all text-sm uppercase tracking-widest"
                  >
                    Commit to Pulse
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-950 border border-white/5 p-8 rounded-[40px] shadow-xl">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Portfolio Allocation</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={stats.providerData}
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {stats.providerData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px'}} />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-950 border border-white/5 p-8 rounded-[40px] shadow-xl">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Efficiency by Agent</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer>
                      <BarChart data={stats.projectData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} width={80} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '16px'}} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-white/5 p-10 rounded-[48px] h-[450px] shadow-2xl">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Token Economic Pulse</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer>
                    <AreaChart data={stats.areaData}>
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickMargin={15} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickFormatter={(v) => `$${v}`} axisLine={false} />
                      <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #1e293b', borderRadius: '16px'}} />
                      <Area type="monotone" dataKey="cost" stroke="#6366f1" fillOpacity={1} fill="url(#colorCost)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {insights && (
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-px rounded-[40px] shadow-2xl">
                  <div className="bg-black/90 p-10 rounded-[40px] h-full">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/40"><BrainIcon /></div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">AI Financial Auditor</h3>
                    </div>
                    <div className="text-slate-300 text-sm whitespace-pre-line leading-relaxed font-medium pl-6 border-l-2 border-indigo-600/50">
                      {insights}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <section className="animate-in fade-in duration-500 space-y-8">
            <div className="flex items-end justify-between px-2">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight">Financial Ledger</h2>
                <p className="text-slate-500 text-sm font-medium mt-2">Audit trail for all cross-provider token exchange.</p>
              </div>
            </div>
            
            <div className="bg-slate-950 border border-white/5 rounded-[48px] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                    <th className="px-10 py-8">Identity</th>
                    <th className="px-10 py-8">Resource Pair</th>
                    <th className="px-10 py-8 text-center">Load (In / Out)</th>
                    <th className="px-10 py-8 text-right">Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {history.map(entry => (
                    <tr key={entry.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-10 py-8">
                        <div className="font-bold text-white text-base group-hover:text-indigo-400 transition">{entry.agentName || 'System'}</div>
                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1.5">{entry.project || 'Unmapped Context'}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200">{MODELS.find(m => m.id === entry.modelId)?.name}</span>
                          <span className="text-[9px] bg-white/5 text-slate-500 px-2 py-1 rounded-lg font-black uppercase tracking-tighter">{MODELS.find(m => m.id === entry.modelId)?.provider}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-2 font-medium">{new Date(entry.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="px-10 py-8 mono">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-700 font-bold uppercase">In</span>
                            <span className="text-slate-400 font-bold">{entry.inputTokens.toLocaleString()}</span>
                          </div>
                          <div className="h-6 w-px bg-white/5"></div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-700 font-bold uppercase">Out</span>
                            <span className="text-white font-bold">{entry.outputTokens.toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="font-black text-white mono text-xl tracking-tighter">
                          <span className="text-indigo-500/50 mr-1 text-sm font-bold">$</span>
                          {entry.cost.toFixed(4)}
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase mt-1">Confirmed</div>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-32 text-center text-slate-700 font-bold text-lg italic">The Economic Ledger is Empty. Capture your first token.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="py-20 text-center border-t border-white/5 mt-20 bg-black/40">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">TokenPulse.io • High-Fidelity AI Economics</p>
          <p className="text-[9px] text-slate-800 font-medium px-8 leading-loose">Secure, local-first analytics for professional LLM orchestration. TokenPulse does not store your private metadata on our servers. All costing is computed in your browser's local sandbox.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
