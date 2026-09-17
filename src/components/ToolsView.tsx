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
} from 'lucide-react';
import { AppTheme } from '../types';
import { WeatherTool } from './WeatherTool';
import { GoogleScholarTool } from './GoogleScholarTool';
import { ChromeAppTool } from './ChromeAppTool';

interface ToolsViewProps {
  theme?: AppTheme;
  initialTab?: ToolTab;
  onNavigateHome?: () => void;
  onOpenEditor?: (title?: string) => void;
}

export type ToolTab = 'weather' | 'scholar' | 'calculator' | 'world-clock' | 'keyboard-checker' | 'chrome-app';

// ==========================================
// 1. CALCULADORA INTERATIVA COM HISTÓRICO
// ==========================================

interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

const CalculatorTab: React.FC<{ theme?: AppTheme }> = ({ theme }) => {
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('wikizero_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isScientific, setIsScientific] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('wikizero_calc_history', JSON.stringify(history.slice(0, 30)));
    } catch {}
  }, [history]);

  // Manipulação de cliques e botões
  const handleDigit = (digit: string) => {
    if (display === '0' || display === 'Erro') {
      setDisplay(digit);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    if (display === 'Erro') {
      setDisplay('0.');
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Erro') return;
    setExpression(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    if (display === 'Erro' || display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    if (display === '0' || display === 'Erro') return;
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handlePercentage = () => {
    if (display === 'Erro') return;
    const num = parseFloat(display);
    if (!isNaN(num)) {
      setDisplay((num / 100).toString());
    }
  };

  const handleCalculate = () => {
    if (!expression && display === '0') return;
    try {
      const fullExpr = expression ? `${expression} ${display}` : display;
      // Substituição segura de operadores visuais
      const sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**');

      // Avaliação com Function segura para aritmética
      // eslint-disable-next-line no-new-func
      const calcResult = Function(`'use strict'; return (${sanitized})`)();

      if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
        // Formata resultado limitando casas decimais
        const formattedResult = Number.isInteger(calcResult)
          ? calcResult.toString()
          : parseFloat(calcResult.toFixed(8)).toString();

        const newItem: CalculationHistoryItem = {
          id: Date.now().toString(),
          expression: fullExpr,
          result: formattedResult,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setHistory((prev) => [newItem, ...prev]);
        setDisplay(formattedResult);
        setExpression('');
      } else {
        setDisplay('Erro');
      }
    } catch {
      setDisplay('Erro');
    }
  };

  // Funções científicas
  const handleScientificOp = (fn: string) => {
    const num = parseFloat(display);
    if (isNaN(num)) return;
    let res = 0;
    switch (fn) {
      case 'sqrt':
        if (num < 0) {
          setDisplay('Erro');
          return;
        }
        res = Math.sqrt(num);
        break;
      case 'sqr':
        res = Math.pow(num, 2);
        break;
      case 'cube':
        res = Math.pow(num, 3);
        break;
      case 'sin':
        res = Math.sin((num * Math.PI) / 180);
        break;
      case 'cos':
        res = Math.cos((num * Math.PI) / 180);
        break;
      case 'tan':
        res = Math.tan((num * Math.PI) / 180);
        break;
      case 'log':
        if (num <= 0) {
          setDisplay('Erro');
          return;
        }
        res = Math.log10(num);
        break;
      case 'ln':
        if (num <= 0) {
          setDisplay('Erro');
          return;
        }
        res = Math.log(num);
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      case 'inv':
        if (num === 0) {
          setDisplay('Erro');
          return;
        }
        res = 1 / num;
        break;
      default:
        return;
    }
    const formatted = parseFloat(res.toFixed(8)).toString();
    setDisplay(formatted);
  };

  // Funções de memória
  const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-') => {
    const num = parseFloat(display) || 0;
    switch (op) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(memory.toString());
        break;
      case 'M+':
        setMemory((prev) => prev + num);
        break;
      case 'M-':
        setMemory((prev) => prev - num);
        break;
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Suporte a teclado físico na calculadora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver focando em inputs de texto
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        handleDecimal();
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('−');
      } else if (e.key === '*' || e.key === 'x') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === '%') {
        handlePercentage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Corpo da Calculadora */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="text-blue-600 dark:text-blue-400" size={20} />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-serif-heading">
              Calculadora Multiuso
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScientific(!isScientific)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                isScientific
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isScientific ? 'Modo Científico Ativo' : 'Científica'}
            </button>
            <button
              onClick={handleCopyResult}
              title="Copiar resultado"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Visor */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 mb-5 text-right font-mono select-all overflow-hidden">
          <div className="text-xs text-slate-400 dark:text-slate-500 h-5 truncate tracking-wider">
            {expression || '\u00A0'}
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate mt-1">
            {display}
          </div>
          {memory !== 0 && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
              M = {memory}
            </div>
          )}
        </div>

        {/* Barra de Memória */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['MC', 'MR', 'M+', 'M-'] as const).map((mOp) => (
            <button
              key={mOp}
              onClick={() => handleMemory(mOp)}
              className="py-1.5 text-xs font-mono font-semibold rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            >
              {mOp}
            </button>
          ))}
        </div>

        {/* Botões Científicos Opcionais */}
        {isScientific && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 animate-in fade-in duration-200">
            {[
              { label: '√x', op: 'sqrt' },
              { label: 'x²', op: 'sqr' },
              { label: 'x³', op: 'cube' },
              { label: '1/x', op: 'inv' },
              { label: 'sin', op: 'sin' },
              { label: 'cos', op: 'cos' },
              { label: 'tan', op: 'tan' },
              { label: 'log₁₀', op: 'log' },
              { label: 'ln', op: 'ln' },
              { label: 'π', op: 'pi' },
              { label: 'e', op: 'e' },
              { label: '(', op: 'parenL', disabled: true },
            ].map((btn) => (
              <button
                key={btn.label}
                disabled={btn.disabled}
                onClick={() => handleScientificOp(btn.op)}
                className="py-2 text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 shadow-xs transition disabled:opacity-40"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Grade de Teclas Principal */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Linha 1 */}
          <button
            onClick={handleClear}
            className="py-3.5 text-sm font-bold rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/80 transition"
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className="py-3.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Apagar último dígito (Backspace)"
          >
            ⌫
          </button>
          <button
            onClick={handlePercentage}
            className="py-3.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            ÷
          </button>

          {/* Linha 2 */}
          <button
            onClick={() => handleDigit('7')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            9
          </button>
          <button
            onClick={() => handleOperator('×')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            ×
          </button>

          {/* Linha 3 */}
          <button
            onClick={() => handleDigit('4')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            6
          </button>
          <button
            onClick={() => handleOperator('−')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            −
          </button>

          {/* Linha 4 */}
          <button
            onClick={() => handleDigit('1')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            +
          </button>

          {/* Linha 5 */}
          <button
            onClick={handleToggleSign}
            className="py-3.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ±
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ,
          </button>
          <button
            onClick={handleCalculate}
            className="py-3.5 text-lg font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition active:scale-98"
          >
            =
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Dica: Use o teclado numérico do seu computador diretamente.</span>
          <span className="font-mono">Enter: = | Esc: AC</span>
        </div>
      </div>

      {/* Painel Lateral de Histórico */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[460px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
            <History size={16} className="text-blue-500" />
            <span>Histórico de Contas</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Limpar Histórico"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
              <Calculator size={32} className="opacity-20 mb-2" />
              <p>Nenhuma conta recente realizada.</p>
              <p className="text-[10px] text-slate-400 mt-1">Os cálculos feitos na calculadora aparecerão aqui.</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => setDisplay(item.result)}
                className="w-full text-right p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/40 transition group"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{item.timestamp}</span>
                  <span className="group-hover:text-blue-500 transition font-sans">Usar</span>
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
                  {item.expression} =
                </div>
                <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                  {item.result}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. HORÁRIO CERTO CLASSIFICADO EM TODOS OS FUSOS
// ==========================================

interface TimezoneItem {
  id: string;
  name: string;
  city: string;
  country: string;
  region: 'brasil' | 'americas' | 'europa' | 'asia' | 'oceania' | 'africa' | 'utc';
  iana: string;
  baseOffset: string;
  flag: string;
  highlight?: boolean;
}

const TIMEZONES_CATALOG: TimezoneItem[] = [
  // Brasil (todos os 4 fusos horários do Brasil)
  { id: 'br-noronha', name: 'Fernando de Noronha', city: 'Noronha', country: 'Brasil', region: 'brasil', iana: 'America/Noronha', baseOffset: 'UTC-2', flag: '🇧🇷', highlight: true },
  { id: 'br-brasilia', name: 'Brasília / Horário Oficial', city: 'Brasília, São Paulo, Rio', country: 'Brasil', region: 'brasil', iana: 'America/Sao_Paulo', baseOffset: 'UTC-3', flag: '🇧🇷', highlight: true },
  { id: 'br-manaus', name: 'Manaus / Horário Amazônico', city: 'Manaus, Cuiabá, Campo Grande', country: 'Brasil', region: 'brasil', iana: 'America/Manaus', baseOffset: 'UTC-4', flag: '🇧🇷', highlight: true },
  { id: 'br-acre', name: 'Rio Branco / Horário do Acre', city: 'Rio Branco, Cruzeiro do Sul', country: 'Brasil', region: 'brasil', iana: 'America/Rio_Branco', baseOffset: 'UTC-5', flag: '🇧🇷', highlight: true },

  // UTC Base
  { id: 'utc-zero', name: 'UTC / GMT Universal', city: 'Greenwich, Londres (Inverno)', country: 'Global', region: 'utc', iana: 'UTC', baseOffset: 'UTC±0', flag: '🌐', highlight: true },

  // Américas
  { id: 'us-newyork', name: 'Nova York (Eastern)', city: 'Nova York, Miami, Toronto', country: 'EUA / Canadá', region: 'americas', iana: 'America/New_York', baseOffset: 'UTC-5 / UTC-4', flag: '🇺🇸' },
  { id: 'us-chicago', name: 'Chicago (Central)', city: 'Chicago, Dallas, Cidade do México', country: 'EUA / México', region: 'americas', iana: 'America/Chicago', baseOffset: 'UTC-6 / UTC-5', flag: '🇺🇸' },
  { id: 'us-denver', name: 'Denver (Mountain)', city: 'Denver, Phoenix, Calgary', country: 'EUA / Canadá', region: 'americas', iana: 'America/Denver', baseOffset: 'UTC-7 / UTC-6', flag: '🇺🇸' },
  { id: 'us-la', name: 'Los Angeles (Pacific)', city: 'Los Angeles, San Francisco, Vancouver', country: 'EUA / Canadá', region: 'americas', iana: 'America/Los_Angeles', baseOffset: 'UTC-8 / UTC-7', flag: '🇺🇸' },
  { id: 'us-alaska', name: 'Alasca', city: 'Anchorage', country: 'EUA', region: 'americas', iana: 'America/Anchorage', baseOffset: 'UTC-9 / UTC-8', flag: '🇺🇸' },
  { id: 'us-hawaii', name: 'Havaí', city: 'Honolulu', country: 'EUA', region: 'americas', iana: 'Pacific/Honolulu', baseOffset: 'UTC-10', flag: '🇺🇸' },
  { id: 'ar-ba', name: 'Buenos Aires', city: 'Buenos Aires', country: 'Argentina', region: 'americas', iana: 'America/Argentina/Buenos_Aires', baseOffset: 'UTC-3', flag: '🇦🇷' },
  { id: 'cl-santiago', name: 'Santiago', city: 'Santiago', country: 'Chile', region: 'americas', iana: 'America/Santiago', baseOffset: 'UTC-4 / UTC-3', flag: '🇨🇱' },
  { id: 'co-bogota', name: 'Bogotá / Lima', city: 'Bogotá, Lima, Quito', country: 'Colômbia / Peru', region: 'americas', iana: 'America/Bogota', baseOffset: 'UTC-5', flag: '🇨🇴' },

  // Europa
  { id: 'pt-lisbon', name: 'Lisboa / Londres (WET)', city: 'Lisboa, Londres, Dublin', country: 'Portugal / Reino Unido', region: 'europa', iana: 'Europe/Lisbon', baseOffset: 'UTC±0 / UTC+1', flag: '🇵🇹' },
  { id: 'fr-paris', name: 'Paris / Berlim / Madri (CET)', city: 'Paris, Berlim, Madri, Roma', country: 'União Europeia', region: 'europa', iana: 'Europe/Paris', baseOffset: 'UTC+1 / UTC+2', flag: '🇫🇷' },
  { id: 'gr-athens', name: 'Atenas / Helsinque (EET)', city: 'Atenas, Helsinque, Kiev, Bucareste', country: 'Grécia / Finlândia', region: 'europa', iana: 'Europe/Athens', baseOffset: 'UTC+2 / UTC+3', flag: '🇬🇷' },
  { id: 'ru-moscow', name: 'Moscou', city: 'Moscou, São Petersburgo', country: 'Rússia', region: 'europa', iana: 'Europe/Moscow', baseOffset: 'UTC+3', flag: '🇷🇺' },

  // Ásia & Oriente Médio
  { id: 'ae-dubai', name: 'Dubai', city: 'Dubai, Abu Dhabi', country: 'Emirados Árabes', region: 'asia', iana: 'Asia/Dubai', baseOffset: 'UTC+4', flag: '🇦🇪' },
  { id: 'in-delhi', name: 'Índia (IST)', city: 'Nova Délhi, Mumbai, Bangalore', country: 'Índia', region: 'asia', iana: 'Asia/Kolkata', baseOffset: 'UTC+5:30', flag: '🇮🇳' },
  { id: 'th-bangkok', name: 'Bangkok / Jacarta', city: 'Bangkok, Jacarta, Hanói', country: 'Tailândia / Indonésia', region: 'asia', iana: 'Asia/Bangkok', baseOffset: 'UTC+7', flag: '🇹🇭' },
  { id: 'cn-beijing', name: 'Pequim / Xangai / Hong Kong', city: 'Pequim, Xangai, Singapura', country: 'China / Singapura', region: 'asia', iana: 'Asia/Shanghai', baseOffset: 'UTC+8', flag: '🇨🇳' },
  { id: 'jp-tokyo', name: 'Tóquio / Seul', city: 'Tóquio, Seul, Kyoto', country: 'Japão / Coreia do Sul', region: 'asia', iana: 'Asia/Tokyo', baseOffset: 'UTC+9', flag: '🇯🇵' },

  // Oceania
  { id: 'au-sydney', name: 'Sydney / Melbourne (AEST)', city: 'Sydney, Melbourne, Brisbane', country: 'Austrália', region: 'oceania', iana: 'Australia/Sydney', baseOffset: 'UTC+10 / UTC+11', flag: '🇦🇺' },
  { id: 'nz-auckland', name: 'Auckland / Wellington', city: 'Auckland, Wellington', country: 'Nova Zelândia', region: 'oceania', iana: 'Pacific/Auckland', baseOffset: 'UTC+12 / UTC+13', flag: '🇳🇿' },

  // África
  { id: 'eg-cairo', name: 'Cairo', city: 'Cairo, Alexandria', country: 'Egito', region: 'africa', iana: 'Africa/Cairo', baseOffset: 'UTC+2 / UTC+3', flag: '🇪🇬' },
  { id: 'za-johannesburg', name: 'Joanesburgo', city: 'Joanesburgo, Cidade do Cabo', country: 'África do Sul', region: 'africa', iana: 'Africa/Johannesburg', baseOffset: 'UTC+2', flag: '🇿🇦' },
  { id: 'ng-lagos', name: 'Lagos', city: 'Lagos, Abuja', country: 'Nigéria', region: 'africa', iana: 'Africa/Lagos', baseOffset: 'UTC+1', flag: '🇳🇬' },
];

const WorldClockTab: React.FC<{ theme?: AppTheme }> = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [copiedTz, setCopiedTz] = useState<string | null>(null);

  // Atualização em tempo real de segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const simulatedDate = useMemo(() => {
    const d = new Date(currentTime.getTime());
    if (timeOffsetHours !== 0) {
      d.setHours(d.getHours() + timeOffsetHours);
    }
    return d;
  }, [currentTime, timeOffsetHours]);

  const userLocalIana = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'America/Sao_Paulo';
    }
  }, []);

  const filteredTimezones = useMemo(() => {
    return TIMEZONES_CATALOG.filter((tz) => {
      if (regionFilter !== 'all' && tz.region !== regionFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchName = tz.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchCity = tz.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchCountry = tz.country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchOffset = tz.baseOffset.toLowerCase().includes(q);
      return matchName || matchCity || matchCountry || matchOffset;
    });
  }, [regionFilter, searchQuery]);

  const formatTzTime = (iana: string, date: Date) => {
    try {
      const timeStr = new Intl.DateTimeFormat('pt-BR', {
        timeZone: iana,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);

      const dateStr = new Intl.DateTimeFormat('pt-BR', {
        timeZone: iana,
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);

      // Determina hora para ícone dia/noite
      const hourOnly = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: iana,
          hour: 'numeric',
          hour12: false,
        }).format(date),
        10
      );
      const isDay = hourOnly >= 6 && hourOnly < 18;

      return { timeStr, dateStr, hourOnly, isDay };
    } catch {
      return { timeStr: '--:--:--', dateStr: 'Indisponível', hourOnly: 12, isDay: true };
    }
  };

  const handleCopyTz = (tz: TimezoneItem, timeStr: string, dateStr: string) => {
    const text = `${tz.name} (${tz.country}): ${timeStr} - ${dateStr}`;
    navigator.clipboard.writeText(text);
    setCopiedTz(tz.id);
    setTimeout(() => setCopiedTz(null), 1500);
  };

  // Horário oficial do Brasil agora
  const brasiliaInfo = formatTzTime('America/Sao_Paulo', simulatedDate);

  return (
    <div className="space-y-6">
      {/* Banner Principal de Destaque: Horário Oficial de Brasília e Local */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Horário de Brasília */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <span>🇧🇷</span> Horário Oficial do Brasil (Brasília)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px]">
              UTC-3
            </span>
          </div>
          <div className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight my-2">
            {brasiliaInfo.timeStr}
          </div>
          <div className="text-xs text-blue-100 flex items-center gap-2">
            <Calendar size={14} />
            <span className="capitalize">{brasiliaInfo.dateStr}</span>
            <span className="text-blue-300">•</span>
            <span>{brasiliaInfo.isDay ? '☀️ Dia' : '🌙 Noite'}</span>
          </div>
        </div>

        {/* Card Horário Local Detectado do Usuário */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Laptop size={14} className="text-emerald-500" />
                <span>Seu Horário Local Detectado</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                {userLocalIana}
              </span>
            </div>
            {(() => {
              const localInfo = formatTzTime(userLocalIana, simulatedDate);
              return (
                <>
                  <div className="text-4xl md:text-5xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight my-2">
                    {localInfo.timeStr}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="capitalize">{localInfo.dateStr}</span>
                    <span>•</span>
                    <span>{localInfo.isDay ? '☀️ Dia no seu local' : '🌙 Noite no seu local'}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Barra de Simulação / Conversor de Horários */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Simulador de Horário Global (Conversor)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Deslocamento:{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                {timeOffsetHours === 0 ? 'Agora (Ao Vivo)' : `${timeOffsetHours > 0 ? '+' : ''}${timeOffsetHours}h`}
              </strong>
            </span>
            {timeOffsetHours !== 0 && (
              <button
                onClick={() => setTimeOffsetHours(0)}
                className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200 transition"
              >
                Voltar ao Tempo Real
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min="-12"
          max="14"
          value={timeOffsetHours}
          onChange={(e) => setTimeOffsetHours(parseInt(e.target.value, 10))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
          <span>-12h</span>
          <span>-6h</span>
          <span className="font-bold text-slate-600 dark:text-slate-300">Tempo Presente</span>
          <span>+6h</span>
          <span>+14h</span>
        </div>
      </div>

      {/* Filtros por Região e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Abas por Continente / Região */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          {[
            { id: 'all', label: 'Todos os Fusos' },
            { id: 'brasil', label: '🇧🇷 Brasil (4 Fusos)' },
            { id: 'americas', label: '🌎 Américas' },
            { id: 'europa', label: '🇪🇺 Europa' },
            { id: 'asia', label: '🌏 Ásia' },
            { id: 'oceania', label: '🦘 Oceania' },
            { id: 'africa', label: '🌍 África' },
            { id: 'utc', label: '🌐 UTC / Padrão' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRegionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                regionFilter === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Campo de Busca de Cidades */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cidade, fuso ou país..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grade de Fusos Horários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTimezones.map((tz) => {
          const info = formatTzTime(tz.iana, simulatedDate);
          const isCopied = copiedTz === tz.id;

          return (
            <div
              key={tz.id}
              className={`p-4 rounded-2xl border transition relative group ${
                tz.highlight
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{tz.flag}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tz.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {tz.city}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                  {tz.baseOffset}
                </span>
              </div>

              {/* Horário Principal com Segundos */}
              <div className="flex items-baseline justify-between mt-3 mb-1">
                <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                  {info.timeStr}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {info.isDay ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                      <Sun size={13} /> Dia
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 text-[11px] font-medium">
                      <Moon size={13} /> Noite
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="capitalize">{info.dateStr}</span>
                <button
                  onClick={() => handleCopyTz(tz, info.timeStr, info.dateStr)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Copiar Horário"
                >
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. VERIFICADOR DE TIPO DE TECLADO & TESTER
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
      } else if (e.code === 'IntlRo' || e.code === 'Slash' && e.key === ';') {
        setDetectedLayout((prev) => ({
          ...prev,
          hasSlashQuestionKey: true,
        }));
      }

      if (e.code === 'AltRight') {
        setDetectedLayout((prev) => ({
          ...prev,
          hasAltGr: true,
        }));
      }

      setLastKeyInfo({
        key: e.key === ' ' ? 'Space' : e.key,
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

      if (typeof e.getModifierState === 'function') {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Layout visual de teclas (ABNT2 completo)
  const KEYBOARD_ROWS = [
    // F-Keys
    [
      { code: 'Escape', label: 'Esc', w: 'w-10' },
      { code: 'F1', label: 'F1' },
      { code: 'F2', label: 'F2' },
      { code: 'F3', label: 'F3' },
      { code: 'F4', label: 'F4' },
      { code: 'F5', label: 'F5' },
      { code: 'F6', label: 'F6' },
      { code: 'F7', label: 'F7' },
      { code: 'F8', label: 'F8' },
      { code: 'F9', label: 'F9' },
      { code: 'F10', label: 'F10' },
      { code: 'F11', label: 'F11' },
      { code: 'F12', label: 'F12' },
      { code: 'PrintScreen', label: 'PrtSc', w: 'w-11' },
      { code: 'Delete', label: 'Del', w: 'w-10' },
    ],
    // Number row
    [
      { code: 'Quote', label: "' \"", w: 'w-9' },
      { code: 'Digit1', label: '1 !' },
      { code: 'Digit2', label: '2 @' },
      { code: 'Digit3', label: '3 #' },
      { code: 'Digit4', label: '4 $' },
      { code: 'Digit5', label: '5 %' },
      { code: 'Digit6', label: '6 ¨' },
      { code: 'Digit7', label: '7 &' },
      { code: 'Digit8', label: '8 *' },
      { code: 'Digit9', label: '9 (' },
      { code: 'Digit0', label: '0 )' },
      { code: 'Minus', label: '- _' },
      { code: 'Equal', label: '= +' },
      { code: 'Backspace', label: 'Backspace', w: 'w-18' },
    ],
    // QWERTY row
    [
      { code: 'Tab', label: 'Tab', w: 'w-14' },
      { code: 'KeyQ', label: 'Q' },
      { code: 'KeyW', label: 'W' },
      { code: 'KeyE', label: 'E' },
      { code: 'KeyR', label: 'R' },
      { code: 'KeyT', label: 'T' },
      { code: 'KeyY', label: 'Y' },
      { code: 'KeyU', label: 'U' },
      { code: 'KeyI', label: 'I' },
      { code: 'KeyO', label: 'O' },
      { code: 'KeyP', label: 'P' },
      { code: 'BracketLeft', label: '´ `' },
      { code: 'BracketRight', label: '[ {' },
      { code: 'Enter', label: 'Enter', w: 'w-14' },
    ],
    // ASDF row
    [
      { code: 'CapsLock', label: 'Caps', w: 'w-16' },
      { code: 'KeyA', label: 'A' },
      { code: 'KeyS', label: 'S' },
      { code: 'KeyD', label: 'D' },
      { code: 'KeyF', label: 'F' },
      { code: 'KeyG', label: 'G' },
      { code: 'KeyH', label: 'H' },
      { code: 'KeyJ', label: 'J' },
      { code: 'KeyK', label: 'K' },
      { code: 'KeyL', label: 'L' },
      { code: 'Semicolon', label: 'Ç', sub: 'ABNT2' },
      { code: 'Backquote', label: '~ ^' },
      { code: 'Backslash', label: '] }' },
    ],
    // ZXCV row
    [
      { code: 'ShiftLeft', label: 'Shift', w: 'w-18' },
      { code: 'IntlBackslash', label: '\\ |' },
      { code: 'KeyZ', label: 'Z' },
      { code: 'KeyX', label: 'X' },
      { code: 'KeyC', label: 'C' },
      { code: 'KeyV', label: 'V' },
      { code: 'KeyB', label: 'B' },
      { code: 'KeyN', label: 'N' },
      { code: 'KeyM', label: 'M' },
      { code: 'Comma', label: ', <' },
      { code: 'Period', label: '. >' },
      { code: 'Slash', label: '; :' },
      { code: 'IntlRo', label: '/ ?', sub: 'ABNT2' },
      { code: 'ShiftRight', label: 'Shift', w: 'w-16' },
    ],
    // Space bar row
    [
      { code: 'ControlLeft', label: 'Ctrl', w: 'w-12' },
      { code: 'MetaLeft', label: 'Win', w: 'w-10' },
      { code: 'AltLeft', label: 'Alt', w: 'w-10' },
      { code: 'Space', label: 'Barra de Espaço', w: 'flex-1 min-w-[140px]' },
      { code: 'AltRight', label: 'AltGr', w: 'w-12' },
      { code: 'MetaRight', label: 'Win', w: 'w-10' },
      { code: 'ContextMenu', label: 'Menu', w: 'w-10' },
      { code: 'ControlRight', label: 'Ctrl', w: 'w-12' },
    ],
  ];

  const handleResetTest = () => {
    setTestedKeys(new Set());
    setPressedKeys(new Set());
    setLastKeyInfo(null);
  };

  return (
    <div className="space-y-6">
      {/* Diagnóstico do Layout Detectado */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Keyboard size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Layout Físico / Lógico Detectado:
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  {detectedLayout.type}
                </span>
                <span className="text-[10px] text-slate-400">({detectedLayout.confidence})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {detectedLayout.details}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetTest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              <RotateCcw size={13} />
              <span>Resetar Teste</span>
            </button>
          </div>
        </div>

        {/* Indicadores de Características */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                detectedLayout.hasCedilla ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400">
              Tecla Ç Dedicada: <strong>{detectedLayout.hasCedilla ? 'Confirmada' : 'Aguardando toque'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                detectedLayout.hasAltGr ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400">
              Tecla AltGr (3ª função): <strong>{detectedLayout.hasAltGr ? 'Detectada' : 'Aguardando'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                capsLockActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400">
              Caps Lock: <strong>{capsLockActive ? 'ATIVADO' : 'Desativado'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">
              Teclas Testadas: <strong>{testedKeys.size}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Teclado Visual Interativo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Pressione as teclas do seu teclado físico para iluminá-las na tela:
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Pressionada Agora
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Já Testada (OK)
            </span>
          </div>
        </div>

        <div className="space-y-1.5 min-w-[760px] select-none p-3 bg-slate-100/70 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 justify-center">
              {row.map((k) => {
                const isPressed = pressedKeys.has(k.code);
                const isTested = testedKeys.has(k.code);

                return (
                  <div
                    key={k.code}
                    className={`h-10 px-2 rounded-lg text-[11px] font-mono font-bold flex flex-col items-center justify-center transition-all ${
                      k.w || 'w-10'
                    } ${
                      isPressed
                        ? 'bg-blue-600 text-white scale-95 shadow-inner'
                        : isTested
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 shadow-xs'
                    }`}
                  >
                    <span>{k.label}</span>
                    {k.sub && (
                      <span className="text-[7px] uppercase opacity-70 leading-none">{k.sub}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Painel de Informações do Evento da Última Tecla Pressionada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">
            <Info size={16} className="text-blue-500" />
            <span>Dados Técnicos do Último Evento (Key Event)</span>
          </div>

          {lastKeyInfo ? (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">event.key:</span>
                <strong className="text-blue-600 dark:text-blue-400 text-sm">{lastKeyInfo.key}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">event.code:</span>
                <strong className="text-slate-800 dark:text-slate-200">{lastKeyInfo.code}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">keyCode / which:</span>
                <strong className="text-slate-800 dark:text-slate-200">{lastKeyInfo.keyCode}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">location:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {lastKeyInfo.location === 0 ? 'Standard (0)' : lastKeyInfo.location === 1 ? 'Left (1)' : lastKeyInfo.location === 2 ? 'Right (2)' : 'Numpad (3)'}
                </strong>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Pressione qualquer tecla para inspecionar os códigos do evento.
            </div>
          )}
        </div>

        {/* Campo de Teste Rápido de Acentuação e Digitação */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>Área de Teste de Acentuação & Teclas Mortas</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Digite palavras com acentos e caracteres especiais para confirmar se o mapa do seu sistema operacional está alinhado (ex: <code>não</code>, <code>coração</code>, <code>você</code>, <code>água</code>, <code>¹²³</code>).
            </p>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Clique aqui e digite: Ação, você, café, interrogação /?..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{testText.length} caracteres digitados</span>
            {testText && (
              <button
                onClick={() => setTestText('')}
                className="text-rose-500 hover:underline font-semibold"
              >
                Limpar
              </button>
            )}
          </div>
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
}) => {
  const [activeTab, setActiveTab] = useState<ToolTab>(initialTab);

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
              Utilitários essenciais e rápidos para o dia a dia: previsão do tempo ao vivo com radar estendido, integração completa de pesquisa ao Google Acadêmico, calculadora científica com histórico, fusos horários mundiais e verificador de teclado físico.
            </p>
          </div>

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="self-start md:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              Voltar ao Início
            </button>
          )}
        </div>

        {/* Seletor das 6 Ferramentas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Aba 1: Previsão do Tempo */}
          <button
            id="tab-btn-weather"
            onClick={() => setActiveTab('weather')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'weather'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
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
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Ao Vivo e 7 Dias
              </div>
            </div>
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

          {/* Aba 3: Calculadora */}
          <button
            id="tab-btn-calculator"
            onClick={() => setActiveTab('calculator')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'calculator'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
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
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Científica e Histórico
              </div>
            </div>
          </button>

          {/* Aba 4: Horário Certo Mundial */}
          <button
            id="tab-btn-worldclock"
            onClick={() => setActiveTab('world-clock')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'world-clock'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
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
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Fusos e Conversor
              </div>
            </div>
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
        </div>
      </div>

      {/* Conteúdo da Ferramenta Selecionada */}
      {activeTab === 'weather' && <WeatherTool theme={theme} />}
      {activeTab === 'scholar' && <GoogleScholarTool theme={theme} onOpenEditor={onOpenEditor} />}
      {activeTab === 'calculator' && <CalculatorTab theme={theme} />}
      {activeTab === 'world-clock' && <WorldClockTab theme={theme} />}
      {activeTab === 'keyboard-checker' && <KeyboardCheckerTab theme={theme} />}
      {activeTab === 'chrome-app' && <ChromeAppTool theme={theme} />}
    </div>
  );
};
