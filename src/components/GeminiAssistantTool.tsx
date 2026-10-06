import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  FileText,
  Volume2,
  VolumeX,
  ExternalLink,
  Shield,
  Zap,
  Crown,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Maximize2,
  Code,
  Download,
  Info,
  Layers,
  Wrench,
  Search,
} from 'lucide-react';
import { AppTheme, UserProfile, GeminiChatMessage } from '../types';
import { GeminiChatbotService } from '../services/geminiChatbotService';
import { GeminiQuotaService } from '../services/geminiQuotaService';

interface GeminiAssistantToolProps {
  theme?: AppTheme;
  currentUser?: UserProfile | null;
  onOpenEditor?: (initialContent?: string) => void;
  onOpenNotebook?: () => void;
  onOpenPremiumModal?: (quotaType?: 'chats' | 'images' | 'notebook') => void;
  onNavigateToExtensions?: () => void;
}

export const GeminiAssistantTool: React.FC<GeminiAssistantToolProps> = ({
  theme,
  currentUser,
  onOpenEditor,
  onOpenNotebook,
  onOpenPremiumModal,
  onNavigateToExtensions,
}) => {
  // Histórico de conversas local
  const [messages, setMessages] = useState<GeminiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('wikizero_gemini_tool_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignora erro de parse
    }
    return [
      {
        id: 'msg-welcome-001',
        role: 'model',
        content: 'Olá! Sou o **Assistente Gemini Studio**, a extensão oficial de Inteligência Artificial da enciclopédia WikiWorldWeb alimentada pelos modelos avançados do Google AI Studio.\n\nComo posso ajudar na sua pesquisa ou redação enciclopédica hoje?\n• Redigir ou expandir verbetes com formatação Wikitext\n• Pesquisar conceitos acadêmicos e verificar fatos\n• Sugerir bibliografias, predefinições e infocaixas\n• Resumir artigos ou sintetizar notas de pesquisa',
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Modo de foco de consulta
  const [focusMode, setFocusMode] = useState<'encyclopedic' | 'wikitext' | 'research' | 'simple'>('encyclopedic');

  // Monitoramento de Quota e Assinatura
  const [quotaInfo, setQuotaInfo] = useState(() => GeminiQuotaService.getQuotaInfo(currentUser || null));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Atualiza informações de cota
  useEffect(() => {
    setQuotaInfo(GeminiQuotaService.getQuotaInfo(currentUser || null));
  }, [currentUser, messages]);

  // Persiste histórico de mensagens
  useEffect(() => {
    try {
      localStorage.setItem('wikizero_gemini_tool_history_v1', JSON.stringify(messages));
    } catch (err) {
      console.warn('[GeminiAssistantTool] Falha ao salvar histórico no localStorage:', err);
    }
  }, [messages]);

  // Rola suavemente para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Copia texto para a área de transferência
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Limpa o histórico de mensagens
  const handleClearHistory = () => {
    if (window.speechSynthesis && speakingId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
    const resetWelcome: GeminiChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: 'model',
      content: 'Histórico reiniciado. O que você gostaria de pesquisar, redigir ou estruturar na enciclopédia agora?',
      timestamp: new Date().toISOString(),
    };
    setMessages([resetWelcome]);
    setErrorMessage(null);
  };

  // Reproduz áudio da resposta usando síntese de voz nativa
  const handleToggleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(id);

    // Remove tags markdown ou wikitext para fala fluída
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[\[(.*?)\]\]/g, '$1')
      .replace(/<[^>]*>/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Exporta o diálogo em formato Markdown / Wikitext
  const handleExportDialogue = () => {
    const content = messages
      .map((m) => `### ${m.role === 'user' ? '👤 Usuário' : '✨ Gemini Studio'}\n*Data: ${new Date(m.timestamp).toLocaleString('pt-BR')}*\n\n${m.content}\n`)
      .join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dialogo-gemini-studio-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Envio de Mensagem ao Gemini
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : inputPrompt).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);

    const userMsg: GeminiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Ajusta as instruções de contexto de acordo com o modo selecionado
      let contextPrefix = '';
      if (focusMode === 'wikitext') {
        contextPrefix = '[Instrução Especial: Responda obrigatoriamente estruturando o conteúdo em sintaxe Wikitext / MediaWiki rica, com cabeçalhos = Seções =, listas, infobox se aplicável e marcas <ref>]. ';
      } else if (focusMode === 'research') {
        contextPrefix = '[Instrução Especial: Forneça fontes históricas e científicas com rigor factual, dados verificáveis e neutralidade enciclopédica]. ';
      } else if (focusMode === 'simple') {
        contextPrefix = '[Instrução Especial: Explique com analogias didáticas simples e acessíveis a iniciantes, mantendo a precisão]. ';
      }

      const res = await GeminiChatbotService.sendMessage({
        message: `${contextPrefix}${textToSend}`,
        history: messages.slice(-10), // Últimas 10 mensagens para contexto contínuo
        user: currentUser || undefined,
        context: { mode: 'general' },
      });

      const geminiMsg: GeminiChatMessage = {
        id: `gemini-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, geminiMsg]);

      // Atualiza a cota após uso
      setQuotaInfo(GeminiQuotaService.getQuotaInfo(currentUser || null));
    } catch (err: any) {
      console.error('[GeminiAssistantTool] Erro na resposta:', err);
      const errText = err?.message || 'Erro ao comunicar com o servidor do Gemini AI Studio.';
      setErrorMessage(errText);

      // Mensagem de fallback amigável
      setMessages((prev) => [
        ...prev,
        {
          id: `gemini-err-${Date.now()}`,
          role: 'model',
          content: `⚠️ **Não foi possível completar a consulta no momento.**\n\n*Detalhes:* ${errText}\n\n*Dica:* Verifique sua conexão ou tente novamente em alguns instantes. Se você atingiu o limite gratuito diário, considere conhecer o Plano Gemini Premium.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // Atalhos de teclado no textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Prompts rápidos para facilitar o uso
  const quickPrompts = [
    {
      label: 'Esboçar Novo Artigo',
      icon: '📝',
      prompt: 'Crie uma estrutura completa para um novo artigo enciclopédico sobre Inteligência Artificial Geral (AGI) em formato Wikitext, com introdução formal, história, ética e referências bibliográficas.',
    },
    {
      label: 'Verificar Neutralidade',
      icon: '⚖️',
      prompt: 'Explique quais são os três princípios fundamentais do Ponto de Vista Neutro (NPOV) na redação enciclopédica e como evitar viés em temas controversos.',
    },
    {
      label: 'Gerar Infobox Biográfica',
      icon: '👤',
      prompt: 'Gere o código wikitexto de uma predefinição {{Info/Biografia}} pronta para preenchimento, com todos os parâmetros comuns (nascimento, nacionalidade, ocupação, prêmios).',
    },
    {
      label: 'Síntese Didática',
      icon: '💡',
      prompt: 'Explique o Princípio da Incerteza de Heisenberg para um leitor leigo, utilizando analogias cotidianas simples sem perder a precisão científica.',
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* 1. Header do Assistente com Identidade Google AI Studio */}
      <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/60 dark:from-purple-950/20 dark:via-slate-900 dark:to-indigo-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base md:text-lg text-slate-900 dark:text-white">
                Assistente IA Gemini Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Extensão Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ambiente de Inteligência Artificial do Google AI Studio para redação, pesquisa e síntese de conhecimento.
            </p>
          </div>
        </div>

        {/* Status de Cota & Ações do Cabeçalho */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
          {quotaInfo.isPremium ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Crown className="w-3.5 h-3.5" />
              <span>Plano Gemini Premium Ativo</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span>
                Cota Diária: <strong className="text-purple-600 dark:text-purple-400">{quotaInfo.chatsRemaining}</strong>/{quotaInfo.chatsLimit} consultas
              </span>
              {onOpenPremiumModal && (
                <button
                  type="button"
                  onClick={() => onOpenPremiumModal('chats')}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline decoration-dotted cursor-pointer"
                >
                  Fazer Upgrade
                </button>
              )}
            </div>
          )}

          {onOpenNotebook && (
            <button
              type="button"
              onClick={onOpenNotebook}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
              title="Abrir o Gemini Notebook para síntese de múltiplas fontes"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Gemini Notebook</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportDialogue}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition cursor-pointer"
            title="Exportar diálogo em Markdown"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 rounded-xl text-xs transition cursor-pointer"
            title="Limpar histórico da conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Barra de Modos de Consulta e Prompts Rápidos */}
      <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Modos de Foco */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Foco:</span>
          </span>
          <button
            type="button"
            onClick={() => setFocusMode('encyclopedic')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              focusMode === 'encyclopedic'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Enciclopédico
          </button>
          <button
            type="button"
            onClick={() => setFocusMode('wikitext')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
              focusMode === 'wikitext'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Code className="w-3 h-3" />
            <span>Wikitext</span>
          </button>
          <button
            type="button"
            onClick={() => setFocusMode('research')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              focusMode === 'research'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Fatos & Fontes
          </button>
          <button
            type="button"
            onClick={() => setFocusMode('simple')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              focusMode === 'simple'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Didático Simples
          </button>
        </div>

        {/* Link Externo do Google AI Studio */}
        <a
          href="https://aistudio.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 ml-auto font-medium"
        >
          <span>Desenvolvido sobre Google AI Studio</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* 3. Área de Rolagem de Mensagens */}
      <div className="flex-1 min-h-[380px] max-h-[550px] p-4 md:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeaking = speakingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Balão de Mensagem */}
              <div
                className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed transition ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
                }`}
              >
                {/* Nome do Remetente & Horário */}
                <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5 dark:border-white/10 text-[10px] opacity-75 font-mono">
                  <span>{isUser ? 'Você' : 'Gemini Studio (Google AI)'}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Conteúdo com Formatação Simples */}
                <div className="whitespace-pre-wrap select-text break-words space-y-2">
                  {msg.content}
                </div>

                {/* Ações na Resposta do Assistente */}
                {!isUser && (
                  <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                      title="Copiar texto para a área de transferência"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    {onOpenEditor && (
                      <button
                        type="button"
                        onClick={() => onOpenEditor(msg.content)}
                        className="px-2 py-1 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 transition cursor-pointer border border-purple-200 dark:border-purple-800"
                        title="Carregar este conteúdo diretamente no Editor Wikitext"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Inserir no Editor Wikitext</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleSpeak(msg.id, msg.content)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                        isSpeaking
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                      }`}
                      title={isSpeaking ? 'Parar leitura por voz' : 'Ouvir resposta por voz'}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>Parar Voz</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Ouvir</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Indicador de Carregamento / Digitação */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span>O Gemini Studio está gerando a resposta enciclopédica...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Sugestões Rápidas (Chips de Ação) */}
      <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          <span>Sugestões:</span>
        </span>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendMessage(item.prompt)}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium text-slate-700 dark:text-slate-300 shrink-0 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Caixa de Entrada de Mensagem */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        {errorMessage && (
          <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl p-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Gemini: ex.: 'Redija a introdução enciclopédica sobre a Teoria dos Jogos' ou 'Gere referências formatadas'..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 outline-hidden resize-none p-1.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed"
          />

          <div className="flex items-center gap-1 pb-1 pr-1 shrink-0">
            <span className="text-[10px] text-slate-400 hidden sm:inline mr-1">
              Enter ↵ para enviar
            </span>
            <button
              type="button"
              disabled={!inputPrompt.trim() || isLoading}
              onClick={() => handleSendMessage()}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Processamento seguro via proxy do servidor • Modelo: gemini-3.8-flash</span>
          </div>
          {onNavigateToExtensions && (
            <button
              type="button"
              onClick={onNavigateToExtensions}
              className="hover:text-purple-600 dark:hover:text-purple-400 transition underline decoration-dotted cursor-pointer"
            >
              Configurar Extensão
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
