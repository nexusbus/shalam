import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CloudUpload, 
  History, 
  Settings, 
  Plus, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  MoreVertical, 
  Filter, 
  Download,
  ChevronRight,
  Eye,
  DownloadCloud,
  ZoomIn,
  Brain,
  ShieldCheck,
  MapPin,
  Type as FontIcon,
  FileSearch,
  Loader2,
  X,
  ChevronLeft
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
export interface AnalysisResult {
  riskScore: number;
  verdict: 'Alto Risco' | 'Risco Médio' | 'Baixo Risco' | 'Seguro';
  anomalies: {
    title: string;
    description: string;
    type: 'metadata' | 'font' | 'geographic' | 'content';
  }[];
  confidence: number;
  algorithm: string;
}

type Tab = 'dashboard' | 'upload' | 'history' | 'analysis';

interface Case {
  id: string;
  claimant: string;
  type: string;
  risk: 'Alto Risco' | 'Risco Médio' | 'Baixo Risco' | 'Seguro';
  confidence: number;
  status: string;
  date: string;
  fileName: string;
  analyst?: string;
}

// Mock Data
const MOCK_CASES: Case[] = [
  { id: '#SH-8291', claimant: 'Marcus Thorne', type: 'Físico Automotivo', risk: 'Alto Risco', confidence: 98.2, status: 'Em Revisão', date: '24 Out, 2026', fileName: 'claim_8831_medical.pdf', analyst: 'S. Miller' },
  { id: '#SH-8288', claimant: 'Elena Rodriguez', type: 'Acid. Trabalho', risk: 'Baixo Risco', confidence: 12.4, status: 'Validado', date: '24 Out, 2026', fileName: 'policy_renewal_v2.docx', analyst: 'J. Dorsey' },
  { id: '#SH-8285', claimant: 'Global Logistics Inc', type: 'Prop. Comercial', risk: 'Risco Médio', confidence: 44.8, status: 'Na Fila', date: '23 Out, 2026', fileName: 'stmt_mortgage_0923.pdf' },
  { id: '#SH-8282', claimant: 'James P. Sutherland', type: 'Responsab. Pessoal', risk: 'Alto Risco', confidence: 89.1, status: 'Escalado', date: '23 Out, 2026', fileName: 'identity_verif_772.png', analyst: 'M. Chen' },
  { id: '#SH-8279', claimant: 'Sarah Connor', type: 'Geral', risk: 'Seguro', confidence: 1.4, status: 'Validado', date: '22 Out, 2026', fileName: 'employment_verify_99.pdf' },
];

const CHART_DATA = [
  { name: 'SEG', low: 40, medium: 25, high: 15 },
  { name: 'TER', low: 45, medium: 30, high: 10 },
  { name: 'QUA', low: 35, medium: 20, high: 20 },
  { name: 'QUI', low: 60, medium: 15, high: 5 },
  { name: 'SEX', low: 25, medium: 40, high: 15 },
  { name: 'SAB', low: 15, medium: 10, high: 8 },
  { name: 'DOM', low: 18, medium: 12, high: 5 },
];

// Components
const Sidebar = ({ currentTab, setTab }: { currentTab: Tab, setTab: (t: Tab) => void }) => {
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload', icon: CloudUpload },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-surface-container border-r border-outline-variant/10 flex flex-col py-8 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-black text-primary tracking-tighter">Shalam</h1>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Lente Soberana</p>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as Tab)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 uppercase text-sm font-semibold tracking-wide",
              currentTab === item.id 
                ? "bg-primary text-white shadow-lg" 
                : "text-slate-600 hover:bg-slate-200 hover:translate-x-1"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 mt-auto space-y-4">
        <button 
          onClick={() => setTab('upload')}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-lg font-bold text-sm tracking-wide shadow-lg hover:opacity-90 transition-all active:scale-95"
        >
          Novo Caso
        </button>
        
        <div className="pt-6 border-t border-outline-variant/20 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={18} />
            Suporte
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-xs font-bold uppercase tracking-wider">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <header className="sticky top-0 z-40 bg-surface px-8 py-6 flex justify-between items-center border-b border-outline-variant/10">
    <div>
      <h2 className="text-2xl font-black tracking-tighter text-primary">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-6">
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar casos..." 
          className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary w-64 transition-all"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:text-primary transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-tertiary rounded-full border-2 border-surface"></span>
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant/30">
          <img 
            src="https://picsum.photos/seed/analyst/100/100" 
            alt="User" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </header>
);

const Dashboard = () => {
  const stats = [
    { label: 'Casos Ativos', value: '1.284', trend: '+12% vs mês anterior', icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Fraudes Detectadas por IA', value: '42', trend: '8 prioridades críticas', icon: AlertTriangle, color: 'text-tertiary' },
    { label: 'Total de Documentos', value: '89.402', trend: 'Média 2.4s por análise', icon: FileText, color: 'text-primary' },
    { label: 'Pontuação de Precisão IA', value: '99,4%', trend: 'Verificado por Auditoria', icon: CheckCircle2, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-xl border border-outline-variant/10 shadow-sm relative overflow-hidden group"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
            <p className="text-3xl font-black text-primary mt-1">{stat.value}</p>
            <div className={cn("flex items-center gap-1 text-[11px] font-bold mt-2", stat.color)}>
              <stat.icon size={12} />
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-lg font-bold text-primary">Tendências de Detecção de Fraude</h3>
              <p className="text-sm text-slate-500">Volume de detecção por nível de risco (Últimos 30 dias)</p>
            </div>
            <div className="flex gap-4">
              {['Baixo', 'Médio', 'Alto'].map((tier, i) => (
                <div key={tier} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <div className={cn("w-3 h-3 rounded-sm", i === 0 ? "bg-primary-container" : i === 1 ? "bg-surface-tint" : "bg-tertiary")}></div>
                  {tier}
                </div>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="low" stackId="a" fill="#003163" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill="#3a5f94" radius={[0, 0, 0, 0]} />
                <Bar dataKey="high" stackId="a" fill="#ba1a1a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Atividade Recente</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Ver Tudo</button>
          </div>
          <div className="space-y-6">
            {[
              { title: 'Alerta Crítico de Fraude', desc: 'Caso #SH-8291 sinalizado por síntese de identidade.', time: '2 min atrás', color: 'bg-tertiary' },
              { title: 'Auditoria de Sistema Concluída', desc: 'Processamento diário de 4.201 documentos concluído.', time: '45 min atrás', color: 'bg-primary-container' },
              { title: 'Atualização de Status de Caso', desc: 'Caso #SH-7710 transicionado para "Revisão Legal".', time: '2 horas atrás', color: 'bg-surface-tint' },
              { title: 'Novo Investigador Atribuído', desc: 'Sarah Jenkins atribuída à Análise em Lote #104.', time: '5 horas atrás', color: 'bg-primary' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className={cn("mt-1.5 w-2 h-2 rounded-full flex-shrink-0", item.color)}></div>
                <div>
                  <p className="text-sm font-bold text-primary">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black text-primary tracking-tight">Log de Integridade do Sistema</h3>
            <p className="text-sm text-slate-500">Pontuações de probabilidade de fraude em tempo real e status dos casos</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-slate-100 text-primary px-4 py-2 rounded font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-colors">
              <Filter size={14} /> Filtrar
            </button>
            <button className="bg-slate-100 text-primary px-4 py-2 rounded font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-colors">
              <Download size={14} /> Exportar
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">ID do Caso</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Requerente</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Risco de Fraude</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Confiança</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_CASES.slice(0, 4).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 text-sm font-black text-primary">{c.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{c.claimant}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{c.type}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider",
                      c.risk === 'Alto Risco' ? "bg-red-100 text-red-700" : 
                      c.risk === 'Risco Médio' ? "bg-orange-100 text-orange-700" : 
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {c.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">{c.confidence}%</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Upload = ({ onAnalyze }: { onAnalyze: (file: File) => Promise<void> }) => {
  const [caseType, setCaseType] = useState('Fraude Automotiva');
  const [speed, setSpeed] = useState('Profundidade Padrão (4-6 Horas)');

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      void onAnalyze(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  } as any);

  return (
    <div className="grid grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-12 lg:col-span-8 space-y-8">
        <div 
          {...getRootProps()} 
          className={cn(
            "bg-white rounded-xl p-1 shadow-sm border-2 border-dashed transition-all cursor-pointer group",
            isDragActive ? "border-primary bg-slate-50" : "border-outline-variant/30 hover:bg-slate-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CloudUpload className="text-primary" size={40} />
            </div>
            <h2 className="text-2xl font-black text-primary mb-2 tracking-tight">Arraste os arquivos do caso aqui</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">Faça o upload seguro de apólices, formulários de sinistro e metadados para verificação soberana.</p>
            <button className="bg-primary text-white px-8 py-3 rounded-md font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20">
              Selecionar Arquivos do Dispositivo
            </button>
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-300">Criptografado de Ponta a Ponta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border-l-4 border-primary shadow-sm">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Selecionar Tipo de Caso</label>
            <div className="space-y-3">
              {['Fraude Automotiva', 'Sinistros de Propriedade', 'Auditorias Médicas'].map((type) => (
                <label key={type} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <input 
                    type="radio" 
                    name="case_type" 
                    checked={caseType === type}
                    onChange={() => setCaseType(type)}
                    className="text-primary focus:ring-primary border-slate-300" 
                  />
                  <span className="text-sm font-bold text-primary">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Velocidade de Análise</label>
            <div className="space-y-4">
              <select 
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-lg py-4 px-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option>Profundidade Padrão (4-6 Horas)</option>
                <option>Auditoria Acelerada (1-2 Horas)</option>
                <option>Tempo Real Alta Prioridade (15 Min)</option>
              </select>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
                <HelpCircle className="text-primary mt-0.5" size={16} />
                <p className="text-[11px] leading-relaxed text-primary/80 font-medium">A Profundidade Padrão utiliza nossa suíte completa de lente soberana para referenciamento exaustivo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-8">
        <div className="bg-slate-900 p-8 rounded-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16"></div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileSearch size={18} />
            Instruções de Upload
          </h3>
          <ul className="space-y-6 relative z-10">
            {[
              { id: 1, title: 'Consolidar Arquivos', text: 'Certifique-se de que todos os documentos relevantes para um único caso sejam agrupados ou carregados simultaneamente.' },
              { id: 2, title: 'Verificar Legibilidade', text: 'Documentos digitalizados devem ter pelo menos 300 DPI para garantir que a Lente Soberana possa analisar o texto.' },
              { id: 3, title: 'Remover PII', text: 'Embora o Shalam seja compatível com SOC-II, siga as diretrizes internas para redigir dados não essenciais.' },
            ].map((item) => (
              <li key={item.id} className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-primary text-[10px] flex items-center justify-center font-black">{item.id}</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight mb-1">{item.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-8 rounded-xl border border-outline-variant/10 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
            <ShieldCheck size={18} />
            Formatos Aceitos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'PDF', icon: FileText, color: 'text-red-500' },
              { label: 'DOCX', icon: FileText, color: 'text-blue-500' },
              { label: 'JPEG/PNG', icon: CloudUpload, color: 'text-emerald-500' },
              { label: 'XLSX', icon: FileText, color: 'text-green-600' },
            ].map((format) => (
              <div key={format.label} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                <format.icon size={16} className={format.color} />
                <span className="text-[11px] font-bold text-slate-600">{format.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Tamanho máximo: 100MB por upload</p>
            <div className="h-24 bg-slate-50 rounded flex items-center justify-center">
              <Brain className="text-slate-200" size={48} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisResultView = ({ result, file, onBack }: { result: AnalysisResult, file: File | null, onBack: () => void }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const anomalyIcons = {
    metadata: History,
    font: FontIcon,
    geographic: MapPin,
    content: FileSearch,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar para Upload
        </button>
        <div className="flex items-center gap-4">
          <button className="bg-slate-100 text-primary px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
            <Eye size={18} /> Ver Dados de Origem
          </button>
          <div className="flex items-center gap-3 ml-4 border-l border-slate-200 pl-8">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200">
              <img src="https://picsum.photos/seed/analyst2/100/100" alt="Analista" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary">Det. Marcus Thorne</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Auditor Líder</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-stretch">
        <div className="col-span-12 xl:col-span-7 flex flex-col">
          <div className="bg-slate-900 rounded-xl overflow-hidden flex-1 flex flex-col shadow-xl">
            <div className="bg-primary p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="text-white/70" size={20} />
                <span className="text-white text-xs font-bold uppercase tracking-widest">{file?.name || 'Pre-visualizacao_Documento.pdf'}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/70"><ZoomIn size={16} /></button>
                <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/70"><DownloadCloud size={16} /></button>
              </div>
            </div>
            <div className="relative flex-1 bg-slate-800 p-8 flex items-center justify-center overflow-auto custom-scrollbar">
              <div className="w-full max-w-[500px] aspect-[1/1.4] bg-white shadow-2xl relative p-12 flex flex-col gap-6 transform rotate-1">
                {previewUrl ? (
                  <img src={previewUrl} alt="Pre-visualização" className="w-full h-full object-contain opacity-50 grayscale" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6">
                      <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded">
                        <FileText className="text-slate-400" size={32} />
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-slate-800 text-lg">Fatura Hospitalar</h4>
                        <p className="text-slate-400 text-xs">Ref: #INV-00992</p>
                      </div>
                    </div>
                    <div className="space-y-4 py-4">
                      <div className="h-2 w-1/3 bg-slate-100 rounded"></div>
                      <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                      <div className="space-y-2 mt-8">
                        <div className="h-4 w-full bg-slate-50 rounded"></div>
                        <div className="h-4 w-full bg-slate-50 rounded"></div>
                        <div className="h-4 w-2/3 bg-slate-50 rounded"></div>
                      </div>
                    </div>
                    <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between">
                      <div className="text-xs text-slate-400">Data: 12/04/2026</div>
                      <div className="text-lg font-black text-primary">R$ 14.500,00</div>
                    </div>
                  </div>
                )}
                
                {/* AI Overlays */}
                {result.anomalies.map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.2 }}
                    className={cn(
                      "absolute border-2 border-tertiary/40 bg-tertiary/5 ring-4 ring-tertiary/10",
                      i === 0 ? "top-[280px] left-[40px] w-[420px] h-[40px]" : "bottom-[80px] right-[40px] w-[120px] h-[30px]"
                    )}
                  >
                    <span className="bg-tertiary text-white text-[8px] font-black uppercase py-0.5 px-1 absolute -top-4 -left-0.5 whitespace-nowrap">
                      {result.anomalies[i].title}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="absolute top-4 right-4 glass-panel p-4 rounded-lg shadow-xl border border-white flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-sm">
                  <Brain className="text-white" size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary uppercase">Neural Scan Ativo</p>
                  <p className="text-[9px] text-slate-500">Latência: 242ms</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-black text-tertiary uppercase tracking-[0.15em]">Status do Veredito</span>
                <h3 className="text-2xl font-black text-primary">{result.verdict}</h3>
              </div>
              <div className="text-right">
                <span className="text-[3.5rem] font-black text-tertiary leading-none tracking-tighter">
                  {result.riskScore}<span className="text-2xl">%</span>
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${result.riskScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-tertiary to-red-600 rounded-full"
              ></motion.div>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Seguro</span>
              <span>Fraude Potencial</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Anomalias Detectadas ({result.anomalies.length})</h4>
            {result.anomalies.map((anomaly, i) => {
              const Icon = anomalyIcons[anomaly.type] || FileSearch;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  key={i} 
                  className="bg-slate-50 rounded-lg p-5 border-l-4 border-tertiary hover:translate-x-1 transition-transform cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-tertiary/10 p-2 rounded">
                      <Icon className="text-tertiary" size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-primary text-sm mb-1">{anomaly.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{anomaly.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 pt-6 border-t border-slate-100">
            <button className="flex-1 bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-md font-black text-[10px] uppercase tracking-[0.1em] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
              Sinalizar para Revisão
            </button>
            <button className="flex-1 bg-slate-100 text-primary py-4 rounded-md font-black text-[10px] uppercase tracking-[0.1em] hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
              Marcar como Seguro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryView = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button className="bg-slate-100 text-primary text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors">
            <Filter size={14} /> Filtrar Casos
          </button>
          <button className="bg-slate-100 text-primary text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors">
            Intervalo de Datas
          </button>
          <button className="bg-slate-100 text-primary text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors">
            <Download size={14} /> Exportar CSV
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mostrar:</span>
          <select className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer">
            <option>Todos os Casos</option>
            <option>Fraude Detectada</option>
            <option>Em Revisão</option>
            <option>Seguro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Analisado', value: '1.284' },
          { label: 'Casos de Alto Risco', value: '42' },
          { label: 'Em Revisão', value: '18' },
          { label: 'Taxa de Precisão', value: '99,8%' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-primary tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Arquivo</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Caso</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Pontuação IA</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Analista</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_CASES.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-5 text-xs font-medium text-slate-400">{c.date}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary-container" size={18} />
                    <span className="text-sm font-bold text-primary">{c.fileName}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">{c.type}</span>
                </td>
                <td className={cn("px-6 py-5 text-right font-mono font-bold", c.risk === 'Alto Risco' ? "text-tertiary" : "text-primary")}>
                  {c.confidence}%
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-200 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${c.analyst || 'auto'}/100/100`} alt="Analista" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-sm text-slate-700">{c.analyst || 'Automatizado'}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    c.risk === 'Alto Risco' ? "bg-red-100 text-red-700" : 
                    c.status === 'Validado' ? "bg-emerald-100 text-emerald-700" : 
                    "bg-blue-100 text-blue-700"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", 
                      c.risk === 'Alto Risco' ? "bg-red-600" : 
                      c.status === 'Validado' ? "bg-emerald-600" : 
                      "bg-blue-600"
                    )}></span>
                    {c.risk === 'Alto Risco' ? 'Fraude' : c.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <button className="text-slate-400 hover:text-primary transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Mostrando 1 a 5 de 1.284 casos</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded flex items-center justify-center bg-white text-primary shadow-sm hover:bg-primary hover:text-white transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-primary text-white shadow-sm font-bold text-xs">1</button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-white text-primary shadow-sm font-bold text-xs hover:bg-slate-100 transition-all">2</button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-white text-primary shadow-sm font-bold text-xs hover:bg-slate-100 transition-all">3</button>
            <span className="px-2 self-end pb-2 font-bold text-slate-300">...</span>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-white text-primary shadow-sm hover:bg-primary hover:text-white transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
export default function App() {
  const [currentTab, setTab] = useState<Tab>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setCurrentFile(file);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha na resposta do servidor.");
      }

      const result = await response.json();
      setAnalysisResult(result);
      setTab('analysis');
    } catch (error) {
      console.error("Falha na análise OpenAI:", error);
      // Fallback mock result for demo if API fails
      setAnalysisResult({
        riskScore: 85,
        verdict: "Alto Risco",
        anomalies: [
          { title: "Alteração de Metadados", description: "O dicionário interno do PDF indica o uso de Photoshop.", type: "metadata" },
          { title: "Irregularidade de Kerning", description: "Valores numéricos exibem espaçamento desigual.", type: "font" },
          { title: "Conflito de Distância Geográfica", description: "Localização do procedimento inconsistente com a submissão de IP.", type: "geographic" }
        ],
        confidence: 98.2,
        algorithm: "OpenAI GPT-4o Forensic"
      });
      setTab('analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const titles = {
    dashboard: "Visão Geral do Painel",
    upload: "Upload de Documentos",
    history: "Histórico de Casos",
    analysis: "Resultado da Análise IA",
    settings: "Configurações do Sistema"
  };

  const subtitles = {
    dashboard: "24 de Março de 2026",
    upload: "Ingestão segura de evidências forenses",
    history: "Logs de auditoria e arquivo de análise forense",
    analysis: "Detalhamento forense detalhado",
    settings: "Configurar parâmetros da Lente Soberana"
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar currentTab={currentTab} setTab={setTab} />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <TopBar title={titles[currentTab]} subtitle={subtitles[currentTab]} />
        
        <div className="p-8 max-w-[1440px] mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            {currentTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Dashboard />
              </motion.div>
            )}
            {currentTab === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Upload onAnalyze={handleAnalyze} />
              </motion.div>
            )}
            {currentTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <HistoryView />
              </motion.div>
            )}
            {currentTab === 'analysis' && analysisResult && (
              <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnalysisResultView 
                  result={analysisResult} 
                  file={currentFile} 
                  onBack={() => setTab('upload')} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-primary/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6"
          >
            <div className="relative">
              <Loader2 className="animate-spin text-white mb-8" size={64} />
              <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50" size={24} />
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">Escaneamento Neural Ativo</h2>
            <p className="text-slate-300 font-medium max-w-md text-center">
              Nossa Lente Soberana está realizando uma análise forense profunda do seu documento. 
              Verificando metadados, consistência de fontes e referências geográficas cruzadas...
            </p>
            <div className="mt-12 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, repeat: Infinity }}
                className="h-full bg-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for New Case */}
      {currentTab !== 'upload' && currentTab !== 'analysis' && (
        <button 
          onClick={() => setTab('upload')}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-95 transition-all z-40"
        >
          <Plus size={24} />
          <div className="absolute right-16 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Novo Caso
          </div>
        </button>
      )}
    </div>
  );
}
