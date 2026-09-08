import React, { useState, useEffect } from 'react';
import {
  Palette,
  Monitor,
  Smartphone,
  Tv,
  Sun,
  Moon,
  Sparkles,
  Check,
  RotateCcw,
  Type,
  Eye,
  Sliders,
  Info,
  Layers,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { AppTheme, DeviceMode, ViewMode } from '../types';

interface AppearanceSettingsViewProps {
  currentTheme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  deviceMode: DeviceMode;
  onToggleDeviceMode: (mode: DeviceMode) => void;
  onNavigate: (view: ViewMode) => void;
}

export const AppearanceSettingsView: React.FC<AppearanceSettingsViewProps> = ({
  currentTheme,
  onSetTheme,
  deviceMode,
  onToggleDeviceMode,
  onNavigate,
}) => {
  // Reading typography preferences
  const [fontScale, setFontScale] = useState<'compact' | 'normal' | 'large' | 'huge'>(() => {
    return (localStorage.getItem('wikizero_font_scale') as any) || 'normal';
  });

  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>(() => {
    return (localStorage.getItem('wikizero_font_family') as any) || 'sans';
  });

  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Apply typography adjustments to document body
  useEffect(() => {
    localStorage.setItem('wikizero_font_scale', fontScale);
    localStorage.setItem('wikizero_font_family', fontFamily);

    const body = document.body;
    // Remove previous typography classes
    body.classList.remove('font-scale-compact', 'font-scale-large', 'font-scale-huge');
    body.classList.remove('font-family-serif', 'font-family-mono');

    if (fontScale === 'compact') body.classList.add('font-scale-compact');
    if (fontScale === 'large') body.classList.add('font-scale-large');
    if (fontScale === 'huge') body.classList.add('font-scale-huge');

    if (fontFamily === 'serif') body.classList.add('font-family-serif');
    if (fontFamily === 'mono') body.classList.add('font-family-mono');
  }, [fontScale, fontFamily]);

  const handleSelectTheme = (newTheme: AppTheme) => {
    onSetTheme(newTheme);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2200);
  };

  const handleResetDefaults = () => {
    onSetTheme('light');
    setFontScale('normal');
    setFontFamily('sans');
    onToggleDeviceMode('auto');
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2200);
  };

  const themesList: {
    id: AppTheme;
    name: string;
    subtitle: string;
    description: string;
    tag: string;
    accentColor: string;
    bgPreview: string;
    badgeStyle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'light',
      name: 'WikiZero Clássico Claro',
      subtitle: 'Padrão Wikipédia & Wikimedia',
      description: 'Design enciclopédico atemporal com fundo branco/cinza claro, contraste balanceado para longas leituras e tipografia limpa.',
      tag: 'Padrão Enciclopédico',
      accentColor: '#2563eb',
      bgPreview: 'bg-white border-slate-300 text-slate-800',
      badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Sun size={18} className="text-amber-500" />,
    },
    {
      id: 'dark',
      name: 'WikiZero Modo Escuro',
      subtitle: 'Alto Contraste Noturno',
      description: 'Tons grafite e ardósia profunda que reduzem a fadiga ocular em ambientes de pouca luz, com links azuis fluorescentes de alta legibilidade.',
      tag: 'Modo Noturno',
      accentColor: '#38bdf8',
      bgPreview: 'bg-[#0b0f17] border-slate-700 text-slate-100',
      badgeStyle: 'bg-slate-800 text-sky-300 border-slate-700',
      icon: <Moon size={18} className="text-blue-400" />,
    },
    {
      id: 'google',
      name: 'Google Material You Claro',
      subtitle: 'Google Design System M3',
      description: 'Bordas arredondadas suaves, paleta multicolorida do Google (azul, vermelho, amarelo e verde), cantos arredondados modernos e sombras elegantes.',
      tag: 'Material You',
      accentColor: '#4285F4',
      bgPreview: 'bg-[#f8fafd] border-blue-200 text-slate-800',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-300',
      icon: (
        <div className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
          <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
          <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
          <span className="w-2 h-2 rounded-full bg-[#34A853]" />
        </div>
      ),
    },
    {
      id: 'google-dark',
      name: 'Google Material You Escuro',
      subtitle: 'Google Dark Charcoal',
      description: 'Visual noturno no estilo Google Dark Mode (#202124), com cartões flutuantes elevados e acentos suaves em tons pastel.',
      tag: 'Material Dark',
      accentColor: '#8ab4f8',
      bgPreview: 'bg-[#202124] border-slate-700 text-slate-100',
      badgeStyle: 'bg-[#303134] text-blue-300 border-slate-600',
      icon: (
        <div className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-[#8ab4f8]" />
          <span className="w-2 h-2 rounded-full bg-[#f28b82]" />
          <span className="w-2 h-2 rounded-full bg-[#fdd663]" />
          <span className="w-2 h-2 rounded-full bg-[#81c995]" />
        </div>
      ),
    },
    {
      id: 'win95',
      name: 'Windows 95 Retrô OS',
      subtitle: 'Nostalgia Clássica dos Anos 90',
      description: 'Visual autêntico do clássico Windows 95, com barras de título em azul marinho com gradiente, bordas chanfradas 3D (outset/inset) e cinza industrial.',
      tag: 'Nostalgia Anos 90',
      accentColor: '#000080',
      bgPreview: 'bg-[#c0c0c0] border-t-white border-l-white border-r-black border-b-black border-2 text-black font-sans',
      badgeStyle: 'bg-[#000080] text-white font-bold',
      icon: <Monitor size={18} className="text-teal-600" />,
    },
    {
      id: 'genshin',
      name: 'Genshin Impact Astral',
      subtitle: 'Teyvat Celestia & Primogem',
      description: 'Inspirado na interface do RPG Genshin Impact, com fundo azul espacial profundo (#0d111d), ornamentos dourados celestiais (#d3bc8e) e acentos de Primogemas.',
      tag: 'Teyvat Astral',
      accentColor: '#d3bc8e',
      bgPreview: 'bg-[#14192b] border-[#d3bc8e]/40 text-[#f5ebd7]',
      badgeStyle: 'bg-gradient-to-r from-[#715ae0] to-[#35a5ea] text-white border-amber-300/40',
      icon: <Sparkles size={18} className="text-amber-400 animate-pulse" />,
    },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in select-none">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <button
              onClick={() => onNavigate('hub')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition"
            >
              <ArrowLeft size={12} />
              <span>Início</span>
            </button>
            <span>/</span>
            <button
              onClick={() => onNavigate('special-pages')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Páginas Especiais
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Special:Appearance
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Palette size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-serif-heading tracking-tight flex items-center gap-2">
                <span>Aparência e Temas Visuais</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Personalize de forma centralizada o tema visual, tipografia e modo de exibição da WikiZero.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Reset & Save Notice */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {showSavedFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
              <Check size={14} />
              <span>Preferência salva!</span>
            </div>
          )}

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            title="Restaurar aparência e temas para as configurações originais da enciclopédia"
          >
            <RotateCcw size={13} />
            <span>Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {/* 2. Theme Selection Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
              Selecione o Tema da Enciclopédia
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            6 estilos disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themesList.map((t) => {
            const isSelected = currentTheme === t.id;

            return (
              <div
                key={t.id}
                id={`card-theme-${t.id}`}
                onClick={() => handleSelectTheme(t.id)}
                className={`relative rounded-xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Active Pill */}
                {isSelected && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Check size={11} />
                    <span>Tema Ativo</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Theme Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                        {t.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{t.name}</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {t.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Micro Visual Preview Box */}
                  <div className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${t.bgPreview}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] truncate">Exemplo de Artigo</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${t.badgeStyle}`}>
                        {t.tag}
                      </span>
                    </div>
                    <div className="h-1.5 w-3/4 rounded-full bg-current opacity-30" />
                    <div className="h-1.5 w-full rounded-full bg-current opacity-20" />
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] underline font-semibold opacity-90">Wikilink</span>
                      <span className="text-[10px] opacity-70">| Ref. [1]</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {/* Footer Action Button */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                    ID: {t.id}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTheme(t.id);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check size={12} />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <span>Ativar</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Reading Typography & Accessibility Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Type size={18} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
            Tipografia & Conforto Visual de Leitura
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Font Family Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Família da Fonte dos Artigos
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFontFamily('sans')}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1 ${
                  fontFamily === 'sans'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-sans">Sans-Serif</span>
                <span className="text-[10px] text-slate-400 font-normal">Moderna & Limpa</span>
              </button>

              <button
                onClick={() => setFontFamily('serif')}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1 ${
                  fontFamily === 'serif'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-serif">Serifada</span>
                <span className="text-[10px] text-slate-400 font-normal">Estilo Enciclopédia</span>
              </button>

              <button
                onClick={() => setFontFamily('mono')}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1 ${
                  fontFamily === 'mono'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-mono">Monoespaçada</span>
                <span className="text-[10px] text-slate-400 font-normal">Código & Técnica</span>
              </button>
            </div>
          </div>

          {/* Font Scale Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tamanho do Texto (Escala)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setFontScale('compact')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'compact'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-[11px] font-bold">85%</span>
                <span className="text-[9px] text-slate-400">Compacto</span>
              </button>

              <button
                onClick={() => setFontScale('normal')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'normal'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">100%</span>
                <span className="text-[9px] text-slate-400">Padrão</span>
              </button>

              <button
                onClick={() => setFontScale('large')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'large'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-sm font-bold">115%</span>
                <span className="text-[9px] text-slate-400">Confortável</span>
              </button>

              <button
                onClick={() => setFontScale('huge')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'huge'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-base font-bold">130%</span>
                <span className="text-[9px] text-slate-400">Acessível</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Display Density & Device Mode */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
            Modo de Densidade & Dispositivo
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Você pode forçar a interface da enciclopédia a adotar a diagramação ideal para computadores, dispositivos móveis ou televisores.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => onToggleDeviceMode('auto')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'auto'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
              <Eye size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Automático</div>
              <div className="text-[10px] text-slate-400">Responsivo</div>
            </div>
          </button>

          <button
            onClick={() => onToggleDeviceMode('desktop')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'desktop'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
              <Monitor size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Computador</div>
              <div className="text-[10px] text-slate-400">Menu fixo</div>
            </div>
          </button>

          <button
            onClick={() => onToggleDeviceMode('mobile')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'mobile'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
              <Smartphone size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Versão Móvel</div>
              <div className="text-[10px] text-slate-400">Otimizado touch</div>
            </div>
          </button>

          <button
            onClick={() => {
              onToggleDeviceMode('tv');
              onNavigate('smart-tv');
            }}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'tv'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 shrink-0">
              <Tv size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Modo Smart TV</div>
              <div className="text-[10px] text-slate-400">Interface 10-Foot</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Live Interactive Encyclopedia Preview Sandbox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
              Pré-Visualização em Tempo Real
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Tema ativo: <strong className="text-blue-600 dark:text-blue-400 uppercase">{currentTheme}</strong>
          </span>
        </div>

        {/* Live Mock Article Container with current theme styling */}
        <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Enciclopédia Digital Livre
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Origem: WikiZero, a enciclopédia aberta e descentralizada.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                Artigo Destacado ✦
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Main Article Mock Body */}
            <div className="md:col-span-2 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Uma <strong>enciclopédia</strong> é uma coletânea de conhecimento humano estruturado de forma
                acessível. A WikiZero utiliza arquitetura em nuvem com sincronização direta via{' '}
                <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
                  Cloud Firestore
                </span>
                {' '}e tecnologia multilíngue instantânea.
              </p>

              <blockquote className="border-l-4 border-blue-500 pl-3 py-1 text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900/80 rounded-r">
                "O conhecimento deve ser aberto, preservado de forma perene e acessível sob qualquer plataforma ou dispositivo."
              </blockquote>

              <p>
                Esta caixa de exemplo demonstra exatamente como parágrafos, ligações internas{' '}
                <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
                  [Wikilinks]
                </span>
                , citações e tabelas se comportam com as preferências atuais de cor e fonte.
              </p>

              {/* Sample Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden mt-2">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2">Recurso</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Compatibilidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="p-2 font-medium">Temas Visuais Centralizados</td>
                      <td className="p-2 text-emerald-600 font-bold">✓ Operacional</td>
                      <td className="p-2">Todos os navegadores</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Persistência Local (LocalStorage)</td>
                      <td className="p-2 text-emerald-600 font-bold">✓ Ativo</td>
                      <td className="p-2">Desktop, Mobile, TV</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mock Infobox */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-center font-bold text-slate-800 dark:text-slate-200">
                Ficha Técnica: WikiZero
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                  <span className="text-slate-400">Tipo:</span>
                  <span className="font-semibold">Enciclopédia Livre</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                  <span className="text-slate-400">Licença:</span>
                  <span className="font-semibold">CC BY-SA 4.0</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                  <span className="text-slate-400">Temas:</span>
                  <span className="font-semibold">6 Opções Nativas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conformidade:</span>
                  <span className="font-semibold text-emerald-600">LGPD & Marco Civil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
