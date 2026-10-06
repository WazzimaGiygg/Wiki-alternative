import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calculator,
  Clock,
  Keyboard,
  Globe,
  Sun,
  Moon,
  RotateCcw,
  Copy,
  Check,
  Search,
  Sparkles,
  History,
  CheckCircle2,
  Info,
  ArrowRight,
  Sliders,
  Calendar,
  Volume2,
  Trash2,
  ExternalLink,
  Laptop,
  CheckCircle,
  AlertCircle,
  CloudSun,
  GraduationCap,
  Monitor,
  Puzzle,
  Lock,
  Shield,
  Wrench,
} from 'lucide-react';
import { AppTheme, CustomToolConfig, UserProfile } from '../types';
import { WeatherTool } from './WeatherTool';
import { GoogleScholarTool } from './GoogleScholarTool';
import { ChromeAppTool } from './ChromeAppTool';
import { CalculatorTool } from './CalculatorTool';
import { WorldClockTool } from './WorldClockTool';
import { GeminiAssistantTool } from './GeminiAssistantTool';
import { CustomInteractiveToolRunner } from './CustomInteractiveToolRunner';
import { ExtensionManager } from '../core/ExtensionManager';

interface ToolsViewProps {
  theme?: AppTheme;
  initialTab?: ToolTab;
  onNavigateHome?: () => void;
  onOpenEditor?: (title?: string) => void;
  onNavigateToExtensions?: () => void;
  currentUser?: UserProfile | null;
  onOpenNotebook?: () => void;
  onOpenPremiumModal?: (quotaType?: 'chats' | 'images' | 'notebook') => void;
}

export type ToolTab = 'weather' | 'scholar' | 'calculator' | 'world-clock' | 'keyboard-checker' | 'chrome-app' | 'gemini-assistant' | string;

// ==========================================
// AVISO DE EXTENSÃO DE FERRAMENTA DESATIVADA
// ==========================================
interface DeactivatedToolNoticeProps {
  toolName: string;
  extensionName: string;
  icon: React.ReactNode;
  onNavigateToExtensions?: () => void;
}

const DeactivatedToolNotice: React.FC<DeactivatedToolNoticeProps> = ({
  toolName,
  extensionName,
  icon,
  onNavigateToExtensions,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
        {icon}
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Lock size={12} />
          <span>Extensão Ferramenta Desativada</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold font-serif-heading text-slate-900 dark:text-white">
          A ferramenta "{toolName}" está suspensa
        </h3>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
          Esta funcionalidade é modular e pertence à extensão oficial{' '}
          <strong className="font-mono text-purple-700 dark:text-purple-300">{extensionName}</strong> (tipo: <em>ferramenta</em>).
          Ela foi desativada por deliberação do Conselho de Burocratas da enciclopédia.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <Shield size={14} className="text-purple-600 dark:text-purple-400" />
          <span>Regra de Segurança e Governança</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
          Apenas usuários com a prerrogativa de <strong>Burocrata</strong> possuem autorização para ativar, desativar, instalar ou remover extensões do sistema.
        </p>
      </div>

      {onNavigateToExtensions && (
        <button
          onClick={onNavigateToExtensions}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition active:scale-98"
        >
          <Puzzle size={15} />
          <span>Gerenciar Extensões (Painel de Burocratas)</span>
        </button>
      )}
    </div>
  );
};

// ==========================================
// VERIFICADOR DE TIPO DE TECLADO & TESTER
// ==========================================

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  location: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  timestamp: string;
}

const KeyboardCheckerTab: React.FC<{ theme?: AppTheme }> = () => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  const [lastKeyInfo, setLastKeyInfo] = useState<KeyInfo | null>(null);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);
  const [testText, setTestText] = useState<string>('');
  const [detectedLayout, setDetectedLayout] = useState<{
    type: 'ABNT2' | 'US-International' | 'ISO' | 'Indeterminado';
    confidence: string;
    details: string;
    hasCedilla: boolean;
    hasAltGr: boolean;
    hasSlashQuestionKey: boolean;
  }>({
    type: 'ABNT2',
    confidence: 'Estimado',
    details: 'Padrão brasileiro ABNT2 com tecla física Ç e AltGr para terceira função.',
    hasCedilla: false,
    hasAltGr: false,
    hasSlashQuestionKey: false,
  });

  // Ouve teclas globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });

      setTestedKeys((prev) => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });

      // Detecção de Caps Lock
      if (typeof e.getModifierState === 'function') {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }

      // Detecção de layout em tempo de execução
      if (e.code === 'Semicolon' && e.key.toLowerCase() === 'ç') {
        setDetectedLayout((prev) => ({
          ...prev,
          type: 'ABNT2',
          confidence: 'Confirmado (100%)',
          details: 'A tecla física Ç foi pressionada diretamente, confirmando o layout nacional ABNT2.',
          hasCedilla: true,
        }));
      } else if (e.code === 'IntlRo' || (e.code === 'Slash' && e.key === ';')) {
        setDetectedLayout((prev) => ({
          ...prev,
          hasSlashQuestionKey: true,
          type: 'ABNT2',
          confidence: 'Confirmado (ABNT2 Tecla /?)',
          details: 'Detectada a tecla de barra/interrogação dedicada ao lado do Shift direito do padrão ABNT2.',
        }));
      } else if (e.code === 'AltRight' && e.altKey) {
        setDetectedLayout((prev) => ({
          ...prev,
          hasAltGr: true,
          details: `${prev.details} AltGr detectado com sucesso.`,
        }));
      }

      setLastKeyInfo({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        location: e.location,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleResetTester = () => {
    setPressedKeys(new Set());
    setTestedKeys(new Set());
    setLastKeyInfo(null);
    setTestText('');
  };

  // Representação visual compacta das principais teclas
  const KEYBOARD_ROWS = [
    ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
    ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
    ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
    ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'IntlRo', 'ShiftRight'],
    ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ContextMenu', 'ControlRight'],
  ];

  const getKeyLabel = (code: string) => {
    if (code === 'IntlRo') return '/ ?';
    if (code === 'Semicolon') return 'Ç';
    if (code === 'Backquote') return "' \"";
    if (code === 'Minus') return '- _';
    if (code === 'Equal') return '= +';
    if (code === 'BracketLeft') return '´ `';
    if (code === 'BracketRight') return '[ {';
    if (code === 'Quote') return '~ ^';
    if (code === 'Backslash') return '] }';
    if (code === 'Slash') return '; :';
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    return code;
  };

  return (
    <div className="space-y-6">
      {/* Resumo do Diagnóstico de Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Layout Identificado</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{detectedLayout.confidence}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{detectedLayout.type === 'ABNT2' ? '🇧🇷 ABNT2 (Brasil)' : '🇺🇸 US-International'}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {detectedLayout.details}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Teclas Especiais ABNT2</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">Diagnóstico</span>
          </div>
          <div className="space-y-1.5 mt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Tecla Ç física (ao lado do L):</span>
              <span className={`font-mono font-bold ${detectedLayout.hasCedilla ? 'text-emerald-500' : 'text-slate-400'}`}>
                {detectedLayout.hasCedilla ? 'Detectada ✓' : 'Aguardando toque'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Tecla dedicada / ? (IntlRo):</span>
              <span className={`font-mono font-bold ${detectedLayout.hasSlashQuestionKey ? 'text-emerald-500' : 'text-slate-400'}`}>
                {detectedLayout.hasSlashQuestionKey ? 'Detectada ✓' : 'Aguardando toque'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Tecla AltGr (terceira função):</span>
              <span className={`font-mono font-bold ${detectedLayout.hasAltGr ? 'text-emerald-500' : 'text-slate-400'}`}>
                {detectedLayout.hasAltGr ? 'Ativa ✓' : 'Não pressionada'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Status do Teste</span>
            <button
              onClick={handleResetTester}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw size={12} /> Limpar
            </button>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {testedKeys.size} <span className="text-xs text-slate-500 font-normal">teclas testadas</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs">
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${capsLockActive ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              Caps Lock: {capsLockActive ? 'LIGADO' : 'DESLIGADO'}
            </span>
          </div>
        </div>
      </div>

      {/* Mapa Visual do Teclado */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Keyboard size={16} className="text-blue-500" />
            <span>Mapa Tátil de Teclas Pressionadas em Tempo Real</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Pressionada Agora
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300"></span> Testada OK
            </span>
          </div>
        </div>

        <div className="min-w-[700px] space-y-1.5 pt-2">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 justify-center">
              {row.map((code) => {
                const isPressed = pressedKeys.has(code);
                const isTested = testedKeys.has(code);
                const label = getKeyLabel(code);

                return (
                  <div
                    key={code}
                    className={`h-9 px-1.5 min-w-[36px] flex items-center justify-center rounded-lg font-mono text-[11px] font-semibold transition-all select-none border ${
                      isPressed
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-95'
                        : isTested
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Caixa de Digitação de Teste Livre & Último Evento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Área de Digitação de Teste Livre (Verifique acentuação e Ç)
          </label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Clique aqui e digite qualquer texto para testar acentuação: ação, coração, pontuação, / ?, AltGr..."
            rows={4}
            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Telemetria do Último Evento de Teclado
          </div>
          {lastKeyInfo ? (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Tecla (key):</span>
                <strong className="text-slate-900 dark:text-white">{lastKeyInfo.key}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Código Físico (code):</span>
                <strong className="text-blue-600 dark:text-blue-400">{lastKeyInfo.code}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">KeyCode / ASCII:</span>
                <strong className="text-slate-700 dark:text-slate-300">{lastKeyInfo.keyCode}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Horário do Toque:</span>
                <span className="text-slate-500">{lastKeyInfo.timestamp}</span>
              </div>
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              Pressione qualquer tecla para inspecionar os parâmetros técnicos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL TOOLSVIEW
// ==========================================

export const ToolsView: React.FC<ToolsViewProps> = ({
  theme,
  initialTab = 'weather',
  onNavigateHome,
  onOpenEditor,
  onNavigateToExtensions,
  currentUser,
  onOpenNotebook,
  onOpenPremiumModal,
}) => {
  const [activeTab, setActiveTab] = useState<ToolTab>(initialTab);

  // Monitoramento dinâmico em tempo real das extensões de ferramentas
  const extensionManager = ExtensionManager.getInstance();

  const [isCalculatorActive, setIsCalculatorActive] = useState<boolean>(() =>
    extensionManager.isExtensionLoaded('CalculatorToolExtension')
  );
  const [isWorldClockActive, setIsWorldClockActive] = useState<boolean>(() =>
    extensionManager.isExtensionLoaded('WorldClockToolExtension')
  );
  const [isWeatherActive, setIsWeatherActive] = useState<boolean>(() =>
    extensionManager.isExtensionLoaded('WeatherForecastToolExtension')
  );
  const [isGeminiAssistantActive, setIsGeminiAssistantActive] = useState<boolean>(() =>
    extensionManager.isExtensionLoaded('GeminiAssistantToolExtension')
  );

  const [customTools, setCustomTools] = useState<CustomToolConfig[]>(() =>
    extensionManager.getActiveTools().filter(
      (t) => !['calculator', 'world-clock', 'weather', 'gemini-assistant'].includes(t.toolId)
    )
  );

  useEffect(() => {
    const checkStates = () => {
      setIsCalculatorActive(extensionManager.isExtensionLoaded('CalculatorToolExtension'));
      setIsWorldClockActive(extensionManager.isExtensionLoaded('WorldClockToolExtension'));
      setIsWeatherActive(extensionManager.isExtensionLoaded('WeatherForecastToolExtension'));
      setIsGeminiAssistantActive(extensionManager.isExtensionLoaded('GeminiAssistantToolExtension'));
      setCustomTools(
        extensionManager.getActiveTools().filter(
          (t) => !['calculator', 'world-clock', 'weather', 'gemini-assistant'].includes(t.toolId)
        )
      );
    };

    checkStates();
    const unsubscribe = extensionManager.subscribe(checkStates);
    return () => {
      unsubscribe();
    };
  }, [extensionManager]);

  // Sincroniza se a aba inicial mudar externamente por URL router
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div id="tools-view" className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho da Página de Ferramentas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={15} />
              <span>WikiWorldWeb Utilities & Academic Tools</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Ferramentas Comuns de Uso
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Utilitários essenciais e rápidos para o dia a dia da enciclopédia: previsão meteorológica completa, calculadora multiuso com histórico, fusos horários mundiais (módulos gerenciados por extensões) e ferramentas acadêmicas nativas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToExtensions && (
              <button
                onClick={onNavigateToExtensions}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition flex items-center gap-1.5 shadow-2xs"
                title="Acessar o gerenciamento de extensões restrito aos burocratas"
              >
                <Puzzle size={14} />
                <span>Extensões</span>
              </button>
            )}

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Voltar ao Início
              </button>
            )}
          </div>
        </div>

        {/* Seletor das Ferramentas com Indicadores de Extensão */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Aba 1: Previsão do Tempo (Extensão) */}
          <button
            id="tab-btn-weather"
            onClick={() => setActiveTab('weather')}
            className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
              activeTab === 'weather'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  activeTab === 'weather'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <CloudSun size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Previsão do Tempo</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    ext
                  </span>
                  <span>{isWeatherActive ? 'Ao Vivo' : 'Desativada'}</span>
                </div>
              </div>
            </div>
            {!isWeatherActive && (
              <span title="Extensão desativada pelo burocrata" className="text-amber-500 shrink-0">
                <Lock size={12} />
              </span>
            )}
          </button>

          {/* Aba 2: Google Acadêmico */}
          <button
            id="tab-btn-scholar"
            onClick={() => setActiveTab('scholar')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'scholar'
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'scholar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Google Acadêmico</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Pesquisa Científica
              </div>
            </div>
          </button>

          {/* Aba 3: Calculadora (Extensão) */}
          <button
            id="tab-btn-calculator"
            onClick={() => setActiveTab('calculator')}
            className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
              activeTab === 'calculator'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  activeTab === 'calculator'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Calculator size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Calculadora</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    ext
                  </span>
                  <span>{isCalculatorActive ? 'Científica' : 'Desativada'}</span>
                </div>
              </div>
            </div>
            {!isCalculatorActive && (
              <span title="Extensão desativada pelo burocrata" className="text-amber-500 shrink-0">
                <Lock size={12} />
              </span>
            )}
          </button>

          {/* Aba 4: Horário Certo Mundial (Extensão) */}
          <button
            id="tab-btn-worldclock"
            onClick={() => setActiveTab('world-clock')}
            className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
              activeTab === 'world-clock'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  activeTab === 'world-clock'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Clock size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Horário Mundial</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    ext
                  </span>
                  <span>{isWorldClockActive ? 'Fusos' : 'Desativada'}</span>
                </div>
              </div>
            </div>
            {!isWorldClockActive && (
              <span title="Extensão desativada pelo burocrata" className="text-amber-500 shrink-0">
                <Lock size={12} />
              </span>
            )}
          </button>

          {/* Aba 5: Verificador de Teclado */}
          <button
            id="tab-btn-keyboard"
            onClick={() => setActiveTab('keyboard-checker')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'keyboard-checker'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'keyboard-checker'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Keyboard size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Teclado Físico</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                ABNT2/ANSI e Teste
              </div>
            </div>
          </button>

          {/* Aba 6: App Chrome & Computador */}
          <button
            id="tab-btn-chrome-app"
            onClick={() => setActiveTab('chrome-app')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'chrome-app'
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'chrome-app'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Monitor size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">App Chrome/PC</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Web Store & Desktop
              </div>
            </div>
          </button>

          {/* Aba 7: Assistente IA Gemini Studio (Extensão de Ferramenta) */}
          <button
            id="tab-btn-gemini-assistant"
            onClick={() => setActiveTab('gemini-assistant')}
            className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
              activeTab === 'gemini-assistant'
                ? 'border-purple-500 bg-gradient-to-r from-purple-50/90 to-indigo-50/70 dark:from-purple-950/40 dark:to-indigo-950/30 text-purple-950 dark:text-purple-100 ring-2 ring-purple-400/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  activeTab === 'gemini-assistant'
                    ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-xs'
                    : 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                }`}
              >
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate flex items-center gap-1">
                  <span>Gemini Studio IA</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    ext
                  </span>
                  <span>{isGeminiAssistantActive ? 'Google AI' : 'Desativada'}</span>
                </div>
              </div>
            </div>
            {!isGeminiAssistantActive && (
              <span title="Extensão desativada pelo burocrata" className="text-amber-500 shrink-0">
                <Lock size={12} />
              </span>
            )}
          </button>

          {/* Abas Dinâmicas de Ferramentas de Extensões Instaladas */}
          {customTools.map((ct) => {
            const isSelected = activeTab === ct.toolId || activeTab === `custom-${ct.toolId}`;
            return (
              <button
                key={ct.toolId}
                id={`tab-btn-custom-${ct.toolId}`}
                onClick={() => setActiveTab(ct.toolId)}
                className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-100 ring-2 ring-cyan-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {ct.icon ? <span className="text-sm">{ct.icon}</span> : <Wrench size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{ct.title || ct.toolId}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        ext
                      </span>
                      <span>{ct.badge || 'Módulo'}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Ferramenta Selecionada (com verificação de extensão ativa) */}
      {activeTab === 'weather' && (
        isWeatherActive ? (
          <WeatherTool theme={theme} />
        ) : (
          <DeactivatedToolNotice
            toolName="Previsão do Tempo"
            extensionName="WeatherForecastToolExtension"
            icon={<CloudSun size={32} />}
            onNavigateToExtensions={onNavigateToExtensions}
          />
        )
      )}

      {activeTab === 'scholar' && <GoogleScholarTool theme={theme} onOpenEditor={onOpenEditor} />}

      {activeTab === 'calculator' && (
        isCalculatorActive ? (
          <CalculatorTool theme={theme} />
        ) : (
          <DeactivatedToolNotice
            toolName="Calculadora Multiuso"
            extensionName="CalculatorToolExtension"
            icon={<Calculator size={32} />}
            onNavigateToExtensions={onNavigateToExtensions}
          />
        )
      )}

      {activeTab === 'world-clock' && (
        isWorldClockActive ? (
          <WorldClockTool theme={theme} />
        ) : (
          <DeactivatedToolNotice
            toolName="Horário Certo Mundial"
            extensionName="WorldClockToolExtension"
            icon={<Clock size={32} />}
            onNavigateToExtensions={onNavigateToExtensions}
          />
        )
      )}

      {activeTab === 'keyboard-checker' && <KeyboardCheckerTab theme={theme} />}
      {activeTab === 'chrome-app' && <ChromeAppTool theme={theme} />}

      {/* Renderização do Assistente IA Gemini Studio (com verificação de extensão ativa) */}
      {activeTab === 'gemini-assistant' && (
        isGeminiAssistantActive ? (
          <GeminiAssistantTool
            theme={theme}
            currentUser={currentUser}
            onOpenEditor={onOpenEditor}
            onOpenNotebook={onOpenNotebook}
            onOpenPremiumModal={onOpenPremiumModal}
            onNavigateToExtensions={onNavigateToExtensions}
          />
        ) : (
          <DeactivatedToolNotice
            toolName="Assistente IA Gemini Studio"
            extensionName="GeminiAssistantToolExtension"
            icon={<Sparkles size={32} />}
            onNavigateToExtensions={onNavigateToExtensions}
          />
        )
      )}

      {/* Renderização de Ferramentas Customizadas de Extensão */}
      {customTools.map((ct) => {
        if (activeTab === ct.toolId || activeTab === `custom-${ct.toolId}`) {
          return (
            <CustomInteractiveToolRunner
              key={ct.toolId}
              tool={ct}
              theme={theme}
              onNavigateToExtensions={onNavigateToExtensions}
            />
          );
        }
        return null;
      })}
    </div>
  );
};
