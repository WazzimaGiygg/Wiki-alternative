import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  Play,
  RotateCcw,
  Zap,
  Cpu,
  Layers,
  Info,
  ExternalLink,
  MessageSquare,
  BookOpen,
  FileCode,
  Eye,
  Check,
  Clock,
  Shield,
  Puzzle,
  AlertTriangle,
} from 'lucide-react';
import { AppTheme } from '../types';
import {
  fetchGeminiKeyStatus,
  testGeminiKeyPing,
  GeminiKeyStatusResponse,
  GeminiTestPingResponse,
  RECOMMENDED_GEMINI_MODELS,
} from '../extensions/gemini-api-key/config';

interface GeminiApiKeyToolProps {
  theme?: AppTheme;
  onNavigateToExtensions?: () => void;
  onOpenChatbot?: () => void;
  onOpenNotebook?: () => void;
  onOpenEditor?: () => void;
}

export const GeminiApiKeyTool: React.FC<GeminiApiKeyToolProps> = ({
  theme = 'light',
  onNavigateToExtensions,
  onOpenChatbot,
  onOpenNotebook,
  onOpenEditor,
}) => {
  const [keyStatus, setKeyStatus] = useState<GeminiKeyStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [testPrompt, setTestPrompt] = useState<string>(
    'Responda em uma frase curta confirmando que a variável GEMINI_API_KEY está ativa e funcionando no servidor da Wiki.'
  );
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<GeminiTestPingResponse | null>(null);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    const status = await fetchGeminiKeyStatus();
    setKeyStatus(status);
    setIsLoadingStatus(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunPingTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiKeyPing(testPrompt);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        variable: 'GEMINI_API_KEY',
        error: err?.message || 'Falha na requisição.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* 1. Header do Painel da Extensão GEMINI_API_KEY */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-blue-900/90 text-white shadow-lg border border-purple-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
              <Key size={13} className="text-purple-300" />
              <span>Extensão Nativa • Requisito 3.05.3.ag</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-serif-heading flex items-center gap-2.5">
              <span>Extensão da Variável GEMINI_API_KEY</span>
              <Sparkles size={24} className="text-amber-400 animate-pulse" />
            </h2>
            <p className="text-xs md:text-sm text-purple-100/90 max-w-2xl leading-relaxed">
              Habilita e gerencia o uso da variável de ambiente <code className="font-mono bg-purple-950/80 px-1.5 py-0.5 rounded text-amber-300 border border-purple-500/40">GEMINI_API_KEY</code> no servidor Node.js/Express para conectar o Wiki-Site aos modelos de inteligência artificial do Google Gemini.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadStatus}
              disabled={isLoadingStatus}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
              title="Recarregar status da chave"
            >
              <RotateCcw size={14} className={isLoadingStatus ? 'animate-spin' : ''} />
              <span>Atualizar Status</span>
            </button>

            {onNavigateToExtensions && (
              <button
                onClick={onNavigateToExtensions}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                title="Ir para o gerenciamento de extensões de burocrata"
              >
                <Puzzle size={14} />
                <span>Extensões</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Cartão de Status da Variável de Ambiente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status da Chave */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Variável de Ambiente
            </span>
            <Key size={16} className="text-purple-600 dark:text-purple-400" />
          </div>

          <div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>GEMINI_API_KEY</span>
              {keyStatus?.hasApiKey ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                  <CheckCircle2 size={11} />
                  Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300">
                  <AlertTriangle size={11} />
                  Não detectada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {keyStatus?.hasApiKey
                ? 'Chave carregada e validada com sucesso pelo backend Node.js.'
                : 'Chave ausente. Configure GEMINI_API_KEY nas variáveis do projeto.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
            Origem: <code>process.env.GEMINI_API_KEY</code>
          </div>
        </div>

        {/* Modelo Padrão */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Modelo Padrão da IA
            </span>
            <Cpu size={16} className="text-blue-600 dark:text-blue-400" />
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {keyStatus?.defaultModel || 'gemini-3.8-flash'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Modelo oficial recomendado do Google AI Studio para geração enciclopédica rápida e precisa.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>SDK: @google/genai v2.4.0</span>
            <span className="text-emerald-600 font-semibold">✓ Oficial</span>
          </div>
        </div>

        {/* Arquitetura & Segurança */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Segurança & Isolamento
            </span>
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>

          <div>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <Shield size={14} />
              <span>Proxy Server-Side Seguro</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              A chave nunca é enviada ao navegador do cliente. As chamadas são roteadas pelo servidor Express com telemetria oficial AI Studio.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Header: <code>User-Agent: aistudio-build</code>
          </div>
        </div>
      </div>

      {/* 3. Painel Interativo de Teste de Diagnóstico e Ping */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Teste de Conectividade em Tempo Real (Ping com GEMINI_API_KEY)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Endpoint: POST /api/gemini/test-ping</span>
        </div>

        <form onSubmit={handleRunPingTest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Prompt de Teste:
              </label>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Digite uma mensagem para testar a comunicação..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Modelo a Testar:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {RECOMMENDED_GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              O teste executa uma chamada real ao Google Gemini através da variável GEMINI_API_KEY do servidor.
            </p>

            <button
              type="submit"
              disabled={isTesting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-white shadow-xs transition cursor-pointer ${
                isTesting
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
              }`}
            >
              {isTesting ? (
                <>
                  <RotateCcw size={14} className="animate-spin" />
                  <span>Testando Conexão...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Executar Teste de Conexão</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Resultado do Teste de Diagnóstico */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5">
                {testResult.success ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Conexão com GEMINI_API_KEY estabelecida com sucesso!</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                    <span>Falha na conexão com GEMINI_API_KEY</span>
                  </>
                )}
              </div>

              {testResult.latencyMs !== undefined && (
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock size={12} />
                  <span>Latência: {testResult.latencyMs}ms</span>
                </div>
              )}
            </div>

            {testResult.reply && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-200 font-sans">
                <strong>Resposta da IA:</strong> {testResult.reply}
              </div>
            )}

            {testResult.error && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                {testResult.error}
              </div>
            )}

            <div className="text-[10px] opacity-80 flex items-center gap-2">
              <span>Modelo utilizado: {testResult.model || selectedModel}</span>
              <span>•</span>
              <span>Variável: GEMINI_API_KEY</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Matriz de Recursos Habilitados pelo Gemini no Wiki-Site */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Módulos da Wiki-Site Habilitados pela GEMINI_API_KEY
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Chatbot Assistente */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                <MessageSquare size={16} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Ativo
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chatbot Assistente</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Responde a dúvidas enciclopédicas, sugere verbetes e orienta a comunidade.
            </p>
            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <span>Abrir Chatbot</span>
                <ExternalLink size={11} />
              </button>
            )}
          </div>

          {/* Gemini Notebook */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                <BookOpen size={16} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Ativo
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Gemini Notebook</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Cruza múltiplas fontes de pesquisa e gera sínteses completas de verbetes.
            </p>
            {onOpenNotebook && (
              <button
                onClick={onOpenNotebook}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <span>Abrir Notebook</span>
                <ExternalLink size={11} />
              </button>
            )}
          </div>

          {/* Gerador Wikitext */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                <FileCode size={16} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Ativo
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Gerador de Artigos</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Cria artigos com seções formatadas, infoboxes, links e referências.
            </p>
            {onOpenEditor && (
              <button
                onClick={onOpenEditor}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <span>Abrir Editor</span>
                <ExternalLink size={11} />
              </button>
            )}
          </div>

          {/* Visão Computacional */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300">
                <Eye size={16} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Ativo
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Visão Computacional</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Transcreve manuscritos, decifra mapas e extrai dados de tabelas e fotos.
            </p>
            <span className="text-[10px] text-slate-400 font-mono">Multimodal 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
