import React, { useEffect } from 'react';
import {
  Check,
  X,
  ShieldCheck,
  Zap,
  EyeOff,
  Sparkles,
  ArrowRight,
  BookOpen,
  Edit3,
  Globe2,
  Tv,
  HelpCircle,
  Award,
  Layers,
  HeartHandshake,
  Bot,
  BookMarked,
  Cpu,
  FileText,
} from 'lucide-react';
import { ViewMode } from '../types';
import { updateSEO } from '../utils/seoManager';

interface WikiCompetitorComparisonViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenEditor: () => void;
  onOpenGeminiChatbot?: () => void;
  onOpenGeminiNotebook?: () => void;
}

interface FeatureComparison {
  name: string;
  category: string;
  wikizero: boolean | string;
  wikipedia: boolean | string;
  fandom: boolean | string;
  mediawiki: boolean | string;
  wikidot: boolean | string;
  highlight?: boolean;
}

const COMPARISON_FEATURES: FeatureComparison[] = [
  {
    name: 'Gemini Notebook: Síntese Multifontes para Criação de Artigos',
    category: 'Inteligência Artificial & Pesquisa',
    wikizero: 'Nativo (Multifontes & Síntese)',
    wikipedia: 'Não (Processo Manual Rígido)',
    fandom: false,
    mediawiki: 'Não (Inexistente)',
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Assistente Gemini IA (Google AI Studio) Integrado',
    category: 'Inteligência Artificial & Redação',
    wikizero: 'Nativo (Chat, Wikitexto & Fatos)',
    wikipedia: 'Bloqueado por Burocracia',
    fandom: false,
    mediawiki: 'Inexistente',
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Zero Anúncios Invasivos e Sem Vídeos Autoplay',
    category: 'Experiência de Leitura',
    wikizero: true,
    wikipedia: true,
    fandom: false,
    mediawiki: true,
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Carregamento Ultrarrápido (SPA Moderna & PWA)',
    category: 'Performance',
    wikizero: true,
    wikipedia: false,
    fandom: false,
    mediawiki: false,
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Temas Visuais Customizados (Minecraft, Roblox, REPO, Win95, etc.)',
    category: 'Personalização & Acessibilidade',
    wikizero: '11 Temas Nativos',
    wikipedia: 'Apenas Claro/Escuro',
    fandom: 'Tema Fixo Fandom',
    mediawiki: 'Skins Complexas PHP',
    wikidot: 'CSS Legado Rígido',
    highlight: true,
  },
  {
    name: 'Editor Wikitexto com Pré-visualização Instantânea',
    category: 'Edição & Colaboração',
    wikizero: true,
    wikipedia: 'Lento / Recarrega',
    fandom: 'Cheio de Banners',
    mediawiki: 'Requer Servidor LAMP',
    wikidot: 'Sintaxe Proprietária',
  },
  {
    name: 'Transparência Editorial e ArbCom Público Imparcial',
    category: 'Governança & Liberdade',
    wikizero: true,
    wikipedia: 'Panelas Históricas',
    fandom: 'Corporativo Centralizado',
    mediawiki: 'Depende do Admin Local',
    wikidot: 'Abandonado',
    highlight: true,
  },
  {
    name: 'Modo Offline Nativo com Leitura Sem Conexão',
    category: 'Acessibilidade & Mobilidade',
    wikizero: true,
    wikipedia: 'Apenas App Dedicado',
    fandom: false,
    mediawiki: false,
    wikidot: false,
  },
  {
    name: 'Suporte Nativo a Smart TVs (Interface 10-Foot)',
    category: 'Compatibilidade de Dispositivos',
    wikizero: true,
    wikipedia: false,
    fandom: false,
    mediawiki: false,
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Conformidade Rigorosa com LGPD e Privacidade',
    category: 'Segurança & Dados',
    wikizero: true,
    wikipedia: 'Parcial',
    fandom: 'Rastreamento Pesado',
    mediawiki: 'Variável',
    wikidot: 'Desatualizado',
  },
  {
    name: 'Busca Sem Rastreamento de Perfil Comercial',
    category: 'Privacidade',
    wikizero: true,
    wikipedia: true,
    fandom: false,
    mediawiki: true,
    wikidot: false,
  },
  {
    name: 'Sincronização em Nuvem em Tempo Real (Firestore)',
    category: 'Infraestrutura Tecnológica',
    wikizero: true,
    wikipedia: false,
    fandom: false,
    mediawiki: false,
    wikidot: false,
  },
];

export const WikiCompetitorComparisonView: React.FC<WikiCompetitorComparisonViewProps> = ({
  onNavigate,
  onOpenEditor,
  onOpenGeminiChatbot,
  onOpenGeminiNotebook,
}) => {
  useEffect(() => {
    updateSEO({
      view: 'comparison',
      title: 'Comparativo: WikiWorldWeb vs Wikipédia, MediaWiki, Wikidot e Fandom',
      description:
        'Compare a WikiWorldWeb diretamente com a Wikipédia, MediaWiki, Wikidot e Fandom. Descubra as vantagens do Gemini Notebook para síntese de artigos, Assistente Gemini com IA, zero anúncios e editor moderno.',
      breadcrumbs: [
        { name: 'Início', url: '/?uid=hub' },
        { name: 'Comparativo de Plataformas Wiki', url: '/?uid=comparison' },
      ],
    });
  }, []);

  const renderBadge = (val: boolean | string) => {
    if (val === true) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
          <Check size={13} className="text-emerald-600" /> Sim
        </span>
      );
    }
    if (val === false) {
      return (
        <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
          <X size={13} className="text-rose-500" /> Não
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
        {val}
      </span>
    );
  };

  return (
    <article className="max-w-6xl mx-auto px-4 py-8 space-y-10 font-sans">
      {/* Hero Header Section */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Award size={14} />
          <span>Análise Competitiva de Plataformas de Conhecimento</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          WikiWorldWeb vs Wikipédia, MediaWiki, Wikidot e Fandom
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Descubra por que a <strong>WikiWorldWeb</strong> representa a evolução natural das enciclopédias colaborativas:
          uma plataforma moderna, sem poluição de anúncios invasivos, com liberdade editorial transparente e tecnologia de ponta.
        </p>
      </header>

      {/* Quick Value Pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookMarked size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Gemini Notebook Nativo</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              Exclusivo
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Reúna artigos, anotações e links externos. O Gemini cruza as fontes e gera verbetes enciclopédicos completos com sumário e referências.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Assistente Gemini IA</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              Google AI
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Co-piloto inteligente integrado ao editor e à leitura. Ajuda a redigir infoboxes, ajustar o tom neutro (NPOV) e esclarecer dúvidas em tempo real.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <EyeOff size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Zero Anúncios Poluentes</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Diferente do Fandom e Wikidot, na WikiWorldWeb você não é bombardeado por anúncios em vídeo ou banners que consomem seus dados.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Zap size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Performance Instantânea</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Arquitetura moderna SPA em React que carrega páginas em milissegundos, superando o peso e lentidão do MediaWiki clássico em PHP.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">11 Temas Visuais Nativos</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Personalize sua experiência com temas exclusivos inspirados em Minecraft, Roblox, R.E.P.O., Stardew Valley, Genshin e Win95.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Governança Transparente</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Sem panelas burocráticas ou perseguições como na Wikipédia. Conselho de Arbitragem (ArbCom) com registros públicos e auditáveis.
          </p>
        </div>
      </section>

      {/* Comprehensive Feature Comparison Matrix */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Matriz Comparativa de Recursos e Funcionalidades</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comparativo detalhado item por item entre as principais ferramentas enciclopédicas e plataformas de wiki do mercado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60">
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-2/5">
                  Recurso / Critério
                </th>
                <th className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 text-center">
                  WikiWorldWeb (Você Está Aqui)
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  Wikipédia
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  Fandom (Wikia)
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  MediaWiki
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  Wikidot
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {COMPARISON_FEATURES.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                    item.highlight ? 'bg-blue-50/20 dark:bg-blue-950/10 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </td>
                  <td className="py-3 px-3 text-center bg-blue-50/40 dark:bg-blue-950/20 border-x border-blue-100 dark:border-blue-900/40">
                    {renderBadge(item.wikizero)}
                  </td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.wikipedia)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.fandom)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.mediawiki)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.wikidot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deep-Dive Competitor Analysis Sections */}
      <section className="space-y-8">
        {/* 1. WikiWorldWeb vs Wikipédia */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              01
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs Wikipédia: Fim da Censura e da Burocracia de Grupos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A Wikipédia tradicional consolidou-se como referência histórica, porém sofre há mais de uma década com
            problemas crônicos de <strong>panelinhas de administradores</strong>, eliminação rápida abusiva de artigos legítimos
            e perseguição sistemática de novos contribuidores. A <strong>WikiWorldWeb</strong> foi estruturada para resolver essa falha:
            adotamos um <strong>Conselho de Arbitragem (ArbCom)</strong> com audiências públicas, auditoria imparcial de bloqueios
            (CheckUser transparente) e canais formais de recurso, garantindo que o conhecimento legítimo nunca seja apagado por caprichos pessoais.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Processo transparente
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Dossiê aberto de conformidade
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Inclusão de novas vozes
            </span>
          </div>
        </div>

        {/* 2. WikiWorldWeb vs Fandom (Wikia) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              02
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs Fandom: Leitura Limpa sem Poluição de Anúncios e Rastreamento
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            O Fandom (anteriormente Wikia) tornou-se praticamente ilegível para milhões de usuários devido a
            vídeos com reprodução automática, banners expansivos que cobrem o texto, popups persistentes e dezenas de rastreadores
            comerciais que deixam a navegação lenta e drenam a bateria de smartphones. Na <strong>WikiWorldWeb</strong>,
            a experiência de leitura é <strong>100% livre de anúncios comerciais invasivos</strong>, carregando de forma instantânea
            e respeitando a privacidade e os dados do leitor.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Zero popups de vídeo
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Economia de dados de internet
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Sem rastreadores invasivos de terceiros
            </span>
          </div>
        </div>

        {/* 3. WikiWorldWeb vs MediaWiki */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              03
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs MediaWiki: Engenharia Moderna em SPA vs Monolito PHP Legado
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            O motor de software MediaWiki foi concebido no início dos anos 2000 em PHP e requer pilhas de servidores pesadas (Apache/Nginx, MySQL, PHP-FPM)
            e recarregamentos inteiros de página a cada clique. A <strong>WikiWorldWeb</strong> foi projetada com arquitetura
            contemporânea de ponta em <strong>React + TypeScript + Tailwind CSS</strong> com banco de dados em nuvem em tempo real (Firestore).
            Oferece navegação reativa sem recarregamento de página, pré-visualização instantânea de wikitexto e suporte a PWA (Progressive Web App).
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ SPA sem recarregamentos
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Sincronização em nuvem
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Editor com atalhos modernos
            </span>
          </div>
        </div>

        {/* 4. WikiWorldWeb vs Wikidot */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
              04
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs Wikidot: Design Responsivo e Plataforma Ativa
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            O Wikidot possui uma interface congelada no tempo, sintaxe proprietária que não é compatível com o padrão internacional
            MediaWiki wikitexto e suporte técnico estagnado. A <strong>WikiWorldWeb</strong> oferece design 100% responsivo para
            qualquer tamanho de tela, compatibilidade total com sintaxe wikitexto padrão, internacionalização em múltiplos idiomas
            e desenvolvimento ativo contínuo.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Sintaxe wikitexto padronizada
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Interface fluida para celular e TV
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Comunidade acolhedora
            </span>
          </div>
        </div>

        {/* 5. WikiWorldWeb vs Outros: Vantagem do Gemini Notebook na Criação de Artigos */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/15 via-blue-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                05
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Diferencial Tecnológico Exclusivo
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Gemini Notebook: Síntese Multifontes e Criação Acelerada de Artigos
                </h2>
              </div>
            </div>
            {onOpenGeminiNotebook && (
              <button
                onClick={onOpenGeminiNotebook}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center gap-1.5 cursor-pointer"
              >
                <BookMarked size={14} />
                <span>Abrir Gemini Notebook</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Nas plataformas concorrentes como <strong>Wikipédia, MediaWiki, Fandom e Wikidot</strong>, o processo de pesquisa e criação de um novo verbete é dolorosamente arcaico: o editor precisa abrir dezenas de guias no navegador, copiar anotações manuais em blocos de notas externos, formatar wikitexto do zero e enfrentar o clássico <em>bloqueio da página em branco</em>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>1. Cruzamento de Múltiplas Fontes</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Adicione no mesmo caderno artigos existentes da WikiWorldWeb, anotações de pesquisa, links da internet e citações bibliográficas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Cpu size={14} />
                <span>2. Síntese Enciclopédica Neutra</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                O modelo Gemini analisa todo o material e sintetiza um verbete completo, com sumário temático, infobox formatada e seções equilibradas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Edit3 size={14} />
                <span>3. Inserção Direta no Editor</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Com um único clique, o texto sintetizado é enviado para o editor com pré-visualização instantânea, mantendo o controle editorial nas mãos do autor.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Pesquisa e síntese multifontes unificadas
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Redução de 80% no tempo de redação inicial
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Estruturação automática em wikitexto padrão
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Inexistente na Wikipédia, Fandom e MediaWiki
            </span>
          </div>
        </div>

        {/* 6. WikiWorldWeb vs Outros: Assistente Gemini Integrado (Google AI Studio) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/15 via-purple-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                06
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Co-Piloto Inteligente em Tempo Real
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Assistente Gemini (Google AI Studio): Redação, Revisão e Fatos
                </h2>
              </div>
            </div>
            {onOpenGeminiChatbot && (
              <button
                onClick={onOpenGeminiChatbot}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Bot size={14} />
                <span>Abrir Assistente Gemini</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Na Wikipédia e no ecossistema MediaWiki tradicional, o uso de inteligência artificial é frequentemente alvo de <strong>hostilidade burocrática</strong>, reversões automáticas em massa e ameaças de bloqueio por administradores, sem que os editores recebam ferramentas amigáveis de suporte. Na <strong>WikiWorldWeb</strong>, abraçamos o futuro da tecnologia: o <strong>Assistente Gemini</strong> funciona como um co-piloto transparente e solícito, projetado para elevar a qualidade do conhecimento livre.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Geração de Infoboxes</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Cria tabelas de metadados padronizadas ({`{{Info/...}}`}) com parâmetros formatados em wikitexto automaticamente.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-purple-600 dark:text-purple-400">Auditoria de Neutralidade</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Identifica adjetivos parciais e reescreve trechos de acordo com o Princípio do Ponto de Vista Neutro (NPOV).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Revisão Gramatical</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Corrige concordâncias, pontuações e ortografia sem apagar o estilo do autor ou comprometer o sentido original.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Suporte ao Leitor</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Disponível na barra lateral para responder dúvidas de leitores sobre temas densos e resumir artigos extensos.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Modelos Gemini 2.5 Flash de alta velocidade
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Auxílio na redação sem perda do controle humano
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Inserção de wikitexto com 1 clique no editor
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Zero perseguição burocrática a editores inovadores
            </span>
          </div>
        </div>
      </section>

      {/* SEO FAQ Section (Targeting Search Engine Rich Snippets) */}
      <section className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Perguntas Frequentes sobre a WikiWorldWeb e Alternativas
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Como o Gemini Notebook auxilia na criação de artigos na WikiWorldWeb?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              O Gemini Notebook permite agrupar múltiplos artigos existentes da WikiWorldWeb, anotações de estudo e fontes externas em um ambiente de pesquisa integrado. Em seguida, a inteligência artificial do Google sintetiza um rascunho enciclopédico estruturado em wikitexto com seções, infobox e sumário, pronto para ser refinado no editor com 1 clique.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Qual a vantagem do Assistente Gemini em relação a editar na Wikipédia ou MediaWiki?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Na Wikipédia e no MediaWiki, novos usuários enfrentam bloqueios rígidos e uma curva de aprendizado íngreme para sintaxe de tabelas e infoboxes. Na WikiWorldWeb, o Assistente Gemini auxilia a redigir parâmetros, sugerir ligações internas, auditar o tom neutro e tirar dúvidas dos leitores, democratizando a produção do saber livre.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              A WikiWorldWeb é gratuita para ler e editar?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Sim! A WikiWorldWeb é 100% gratuita para leitura, pesquisa, criação de novos verbetes e edição colaborativa, sob licença livre Creative Commons e GNU GPL.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Por que a WikiWorldWeb não possui anúncios como o Fandom?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Acreditamos que o conhecimento enciclopédico deve ser limpo, rápido e acessível sem mercantilização intrusiva. A WikiWorldWeb foi desenvolvida com foco no leitor e na velocidade de consulta.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Como funciona o Conselho de Arbitragem (ArbCom) da WikiWorldWeb?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Diferente da Wikipédia, os casos de arbitragem na WikiWorldWeb contam com registros públicos transparentes, permitindo que usuários apresentem evidências e garantam julgamentos imparciais contra abusos de poder ou disputas de edição.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Box */}
      <footer className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-md">
        <h2 className="text-xl sm:text-2xl font-black">
          Junte-se à Revolução do Conhecimento Livre & Inteligente
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl mx-auto">
          Crie artigos de alta qualidade com o auxílio do Gemini Notebook e do Assistente Gemini, ou explore nossa enciclopédia sem anúncios e com liberdade editorial.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenGeminiNotebook && (
            <button
              onClick={onOpenGeminiNotebook}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <BookMarked size={15} />
              <span>Experimentar Gemini Notebook</span>
            </button>
          )}
          {onOpenGeminiChatbot && (
            <button
              onClick={onOpenGeminiChatbot}
              className="px-4 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Bot size={15} />
              <span>Abrir Assistente Gemini</span>
            </button>
          )}
          <button
            onClick={() => onOpenEditor()}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Edit3 size={15} />
            <span>Criar Artigo no Editor</span>
          </button>
          <button
            onClick={() => onNavigate('hub')}
            className="px-4 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <BookOpen size={15} />
            <span>Explorar Enciclopédia</span>
          </button>
        </div>
      </footer>
    </article>
  );
};
