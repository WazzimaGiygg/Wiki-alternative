import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  ArrowRight,
  Film,
  FileText,
  Megaphone,
  ShieldCheck,
  Scale,
  Users,
  Globe,
  BookOpen,
  GraduationCap,
  Cpu,
  Flame,
  Subtitles,
} from 'lucide-react';
import { ViewMode } from '../types';

export type AboutWikiWorldWebTab = 'commercial' | 'script' | 'kit';

interface AboutWikiWorldWebViewProps {
  onNavigate: (view: ViewMode, initialTab?: string) => void;
  onOpenEditor?: () => void;
  initialTab?: AboutWikiWorldWebTab;
}

interface CommercialScene {
  id: number;
  code: string;
  startSec: number;
  endSec: number;
  pillar: string;
  title: string;
  onScreenHeadline: string;
  onScreenSubtext: string;
  visualDirection: string;
  narration: string;
  highlights: string[];
  targetView: ViewMode;
  targetTab?: string;
  targetLabel: string;
  accentHex: string;
}

const TOTAL_DURATION_SEC = 72;

const OFFICIAL_SCENES: CommercialScene[] = [
  {
    id: 1,
    code: 'Cena 01',
    startSec: 0,
    endSec: 12,
    pillar: 'Independência Editorial',
    title: 'O conhecimento livre não pertence a painéis fechados',
    onScreenHeadline: 'Conhecimento sem censura, sem anúncios e sem monopólio.',
    onScreenSubtext:
      'Uma alternativa aberta, rápida e auditável frente a plataformas engessadas por burocracia opaca ou publicidade invasiva.',
    visualDirection:
      'Abertura sobre fundo escuro limpo com tipografia ampla em alto contraste. Transição suave revelando o emblema oficial da WikiWorldWeb e contraste direto contra banners invasivos e bloqueios arbitrários.',
    narration:
      'Por tempo demais, o acesso ao conhecimento livre ficou preso entre páginas lentas, anúncios invasivos e decisões burocráticas sem transparência. A WikiWorldWeb nasceu para devolver a enciclopédia a quem realmente constrói saber: leitores, pesquisadores e colaboradores independentes.',
    highlights: [
      'Zero anúncios corporativos ou rastreadores publicitários',
      'Independência editorial total da Wikimedia Foundation',
      'Navegação instantânea em arquitetura SPA moderna',
    ],
    targetView: 'comparison',
    targetLabel: 'Ver Comparativo Completo',
    accentHex: '#2563EB',
  },
  {
    id: 2,
    code: 'Cena 02',
    startSec: 12,
    endSec: 24,
    pillar: 'Conhecimento Descentralizado',
    title: 'Arquitetura moderna com Wikitexto em tempo real',
    onScreenHeadline: 'Escreva em Wikitexto, visualize no mesmo segundo.',
    onScreenSubtext:
      'Editor com pré-visualização imediata, fórmulas matemáticas KaTeX, histórico versionado imutável e suporte offline via PWA.',
    visualDirection:
      'Divisão em tela cheia mostrando sintaxe Wikitexto sendo convertida instantaneamente em verbete estruturado com referências, tabelas e fórmulas científicas, seguido por ícone de instalação PWA multiplataforma.',
    narration:
      'Construída sobre uma infraestrutura moderna sem servidores legados pesados, a WikiWorldWeb combina editor Wikitexto em tempo real, fórmulas matemáticas de precisão, tradução universal e modo offline instalável no computador, celular ou Smart TV.',
    highlights: [
      'Editor Wikitexto com parser de predefinições e citações',
      'Histórico de revisões auditável com detecção de conflitos',
      'PWA instalável com leitura offline e 11+ temas visuais',
    ],
    targetView: 'editor',
    targetLabel: 'Abrir Editor Wikitexto',
    accentHex: '#0EA5E9',
  },
  {
    id: 3,
    code: 'Cena 03',
    startSec: 24,
    endSec: 36,
    pillar: 'Privacidade e LGPD',
    title: 'Alinhamento absoluto com a Lei Geral de Proteção de Dados',
    onScreenHeadline: 'Seus dados são seus. Nomes civis protegidos por regra.',
    onScreenSubtext:
      'Vedação estrita ao uso de nomes de pessoas reais sem base legal e painel completo de portabilidade, retificação e exclusão.',
    visualDirection:
      'Interface limpa destacando a política de pseudonímia obrigatória, bloqueio preventivo contra doxxing e demonstração da Central de Dados (Meus Dados) com exportação e eliminação imediata.',
    narration:
      'Privacidade não é nota de rodapé. Na WikiWorldWeb, o alinhamento absoluto com a LGPD proíbe a exposição indevida de nomes de pessoas reais, elimina rastreamento oculto e garante ao titular controle total para consultar, exportar ou excluir seus dados a qualquer momento.',
    highlights: [
      'Proibição explícita de nomes de pessoas reais sem base legal',
      'Painel do Titular (Meus Dados) conforme Art. 18 da LGPD',
      'Proteção preventiva anti-doxxing e moderação de privacidade',
    ],
    targetView: 'real-names-lgpd',
    targetLabel: 'Ler Política LGPD Absoluta',
    accentHex: '#059669',
  },
  {
    id: 4,
    code: 'Cena 04',
    startSec: 36,
    endSec: 48,
    pillar: 'Colaboração e Ciência Aberta',
    title: 'Livros, academia, jornalismo e IA sob supervisão humana',
    onScreenHeadline: 'Do verbete enciclopédico ao repositório universitário.',
    onScreenSubtext:
      'Wiki dos Livros, Wiki Universitário, analisador Antiplágio ABNT, Jornal WazzimaGiygg e IA ética com controle humano.',
    visualDirection:
      'Sequência rítmica alternando o catálogo bibliográfico da Wiki dos Livros, pareceres acadêmicos do Wiki Universitário, verificação ABNT de TCCs e o aviso de supervisão humana nas ferramentas de IA.',
    narration:
      'Mais que uma wiki isolada, a WikiWorldWeb reúne colaboração em tempo real, biblioteca de livros, repositório universitário com revisão por pares, auditoria antiplágio nas normas ABNT, jornalismo independente e inteligência artificial transparente sempre subordinada à revisão humana.',
    highlights: [
      'Wiki dos Livros e Wiki Universitário integrados',
      'Verificador Antiplágio e conformidade ABNT NBR 10520/6023',
      'Ética de Uso da IA com supervisão humana obrigatória',
    ],
    targetView: 'ai-ethics',
    targetLabel: 'Conhecer Ética de IA',
    accentHex: '#4F46E5',
  },
  {
    id: 5,
    code: 'Cena 05',
    startSec: 48,
    endSec: 60,
    pillar: 'Governança Transparente',
    title: 'Autoridade coletiva, ArbCom e Código Universal de Conduta',
    onScreenHeadline: 'Nenhuma concentração despótica de poder.',
    onScreenSubtext:
      'Conselho de Burocratas, Comitê de Arbitragem, protocolo formal de denúncias UCoC e registros públicos de auditoria.',
    visualDirection:
      'Diagrama limpo mostrando decisões colegiadas do Conselho de Burocratas, trilha de apelação transparente do ArbCom e registros imutáveis de auditoria CheckUser com justificativa obrigatória.',
    narration:
      'Onde há poder editorial sem controle, surgem abusos. Por isso, a governança da WikiWorldWeb opera com Conselho de Burocratas, Comitê de Arbitragem, Código Universal de Conduta contra assédio e calúnia, além de auditorias públicas que impedem perseguições administrativas.',
    highlights: [
      'Decisões colegiadas no Conselho de Burocratas e ArbCom',
      'Canal formal do Código Universal de Conduta (UCoC)',
      'Termos e ética estritos para uso do Cloud Firestore/Firebase',
    ],
    targetView: 'firebase-ethics',
    targetLabel: 'Ver Governança & Ética Firebase',
    accentHex: '#D97706',
  },
  {
    id: 6,
    code: 'Cena 06',
    startSec: 60,
    endSec: 72,
    pillar: 'Chamada Oficial',
    title: 'WikiWorldWeb — A Enciclopédia Livre, Rápida e Sem Anúncios',
    onScreenHeadline: 'Não, o Tempo não é o senhor do conhecimento.',
    onScreenSubtext:
      'Leia livremente, colabore com segurança jurídica e ajude a construir uma enciclopédia verdadeiramente aberta.',
    visualDirection:
      'Quadro final em alto contraste com o logotipo oficial da WikiWorldWeb, o lema fundador e a chamada direta para explorar artigos, pesquisar ou criar a primeira edição.',
    narration:
      'Não, o Tempo não é o senhor do conhecimento. Acesse a WikiWorldWeb, pesquise sem rastreadores, colabore em tempo real e faça parte de uma enciclopédia livre, rápida, sem anúncios e comprometida com a verdade documental e a privacidade.',
    highlights: [
      'Acesso aberto 24 horas sem paywalls ou anúncios',
      'Compromisso verificável com direitos digitais e LGPD',
      'Comunidade acolhedora para leitores, estudantes e editores',
    ],
    targetView: 'hub',
    targetLabel: 'Explorar a WikiWorldWeb',
    accentHex: '#2563EB',
  },
];

interface AdCopyPiece {
  id: string;
  audience: string;
  title: string;
  format: string;
  copy: string;
}

const AD_COPY_PIECES: AdCopyPiece[] = [
  {
    id: 'institutional',
    audience: 'Apresentação Oficial',
    title: 'Chamada Principal de Campanha (Site & Imprensa)',
    format: 'Manifesto curto · 65 palavras',
    copy:
      'Conheça a WikiWorldWeb: a enciclopédia livre, rápida e sem anúncios construída para preservar o conhecimento descentralizado com privacidade real. Com editor Wikitexto em tempo real, alinhamento absoluto à LGPD, proibição estrita do uso indevido de nomes civis, biblioteca universitária, verificador ABNT e governança transparente pelo Conselho de Burocratas e ArbCom, você lê e colabora com autonomia e segurança.',
  },
  {
    id: 'social',
    audience: 'Redes Sociais',
    title: 'Post Direto de Divulgação (Feed & Comunidades)',
    format: 'Texto objetivo · Pronto para publicação',
    copy:
      'Cansado de wikis lentas, cheias de anúncios invasivos ou decisões burocráticas sem transparência? Conheça a WikiWorldWeb: conhecimento aberto em tempo real, zero anúncios, modo offline (PWA), proteção rigorosa de dados pela LGPD (sem exposição de nomes de pessoas reais) e ferramentas acadêmicas integradas. Leia, edite e compartilhe com liberdade.',
  },
  {
    id: 'academic',
    audience: 'Estudantes e Pesquisadores',
    title: 'Divulgação Acadêmica (Universidades & Grupos de Estudo)',
    format: 'Foco educacional · Wiki Universitário & ABNT',
    copy:
      'Pesquisa séria exige fontes verificáveis e rigor metodológico. Na WikiWorldWeb, você conta com o Wiki dos Livros, o repositório do Wiki Universitário com revisão por pares, suporte nativo a fórmulas matemáticas KaTeX e um analisador Antiplágio alinhado às normas ABNT NBR 10520 e 6023 — tudo gratuito e sem rastreamento comercial.',
  },
  {
    id: 'developers',
    audience: 'Desenvolvedores & Software Livre',
    title: 'Convite Técnico (Comunidade Open Source)',
    format: 'Foco arquitetura · GNU GPL v3.0',
    copy:
      'A WikiWorldWeb substitui arquiteturas legadas pesadas por uma aplicação moderna em React 19, TypeScript, Cloud Firestore com regras auditadas, sistema modular de extensões com quarentena de segurança e licença livre GNU GPL v3.0. Conheça o ecossistema WikiWorldWeb e participe de uma enciclopédia desenhada para escalar com transparência.',
  },
];

const PLATFORM_PILLARS = [
  {
    number: '01',
    title: 'Conhecimento Descentralizado e Sem Anúncios',
    description:
      'Diferente de portais comerciais tomados por banners ou plataformas presas a estruturas monolíticas, a WikiWorldWeb entrega leitura limpa, carregamento instantâneo e código aberto.',
    view: 'comparison' as ViewMode,
    cta: 'Comparar plataformas',
  },
  {
    number: '02',
    title: 'Privacidade Absoluta & Zero Nomes Reais Indevidos',
    description:
      'Operamos com alinhamento integral à LGPD (Lei nº 13.709/2018), proibindo exposição gratuita de nomes civis de pessoas reais e garantindo anonimização, portabilidade e exclusão pelo próprio titular.',
    view: 'real-names-lgpd' as ViewMode,
    cta: 'Ver diretriz LGPD',
  },
  {
    number: '03',
    title: 'Inteligência Artificial com Ética e Supervisão Humana',
    description:
      'As ferramentas de apoio à redação e pesquisa seguem diretrizes públicas de transparência, verificação factual e responsabilidade editorial humana — sem publicação autônoma sem revisão.',
    view: 'ai-ethics' as ViewMode,
    cta: 'Ler Ética de IA',
  },
  {
    number: '04',
    title: 'Governança Transparente, ArbCom & Independência da WMF',
    description:
      'Conselho de Burocratas, Comitê de Arbitragem, canal formal do Código Universal de Conduta (UCoC) e uso ético e documentado do Google Firebase sem reutilizar dados da Wikimedia Foundation.',
    view: 'firebase-ethics' as ViewMode,
    cta: 'Consultar governança',
  },
  {
    number: '05',
    title: 'Ecossistema Educacional Completo em Um Só Lugar',
    description:
      'Integra enciclopédia geral, Wiki dos Livros, Wiki Universitário, analisador Antiplágio & TCC (ABNT), Jornal WazzimaGiygg, ferramentas utilitárias e suporte PWA para desktop, celular e Smart TV.',
    view: 'academic' as ViewMode,
    cta: 'Explorar acervo acadêmico',
  },
];

function formatTimecode(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export const AboutWikiWorldWebView: React.FC<AboutWikiWorldWebViewProps> = ({
  onNavigate,
  onOpenEditor,
  initialTab = 'commercial',
}) => {
  const [activeTab, setActiveTab] = useState<AboutWikiWorldWebTab>(initialTab);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customScriptNotes, setCustomScriptNotes] = useState<Record<number, string>>({});
  const lastSpokenSceneRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const currentScene = useMemo(() => {
    return (
      OFFICIAL_SCENES.find((s) => currentTime >= s.startSec && currentTime < s.endSec) ||
      OFFICIAL_SCENES[OFFICIAL_SCENES.length - 1]
    );
  }, [currentTime]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25;
        if (next >= TOTAL_DURATION_SEC) {
          setIsPlaying(false);
          return TOTAL_DURATION_SEC;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  // Optional browser speech synthesis narration when voiceEnabled is active
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!isPlaying || !voiceEnabled) {
      window.speechSynthesis.cancel();
      lastSpokenSceneRef.current = null;
      return;
    }
    if (lastSpokenSceneRef.current !== currentScene.id) {
      lastSpokenSceneRef.current = currentScene.id;
      window.speechSynthesis.cancel();
      const textToSpeak = customScriptNotes[currentScene.id] || currentScene.narration;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.02;
      window.speechSynthesis.speak(utterance);
    }
  }, [isPlaying, voiceEnabled, currentScene, customScriptNotes]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (currentTime >= TOTAL_DURATION_SEC) {
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSelectScene = (scene: CommercialScene, autoPlay = false) => {
    lastSpokenSceneRef.current = null;
    setCurrentTime(scene.startSec);
    if (autoPlay) setIsPlaying(true);
  };

  const handlePrevScene = () => {
    const idx = OFFICIAL_SCENES.findIndex((s) => s.id === currentScene.id);
    const target = OFFICIAL_SCENES[Math.max(0, idx - 1)];
    handleSelectScene(target);
  };

  const handleNextScene = () => {
    const idx = OFFICIAL_SCENES.findIndex((s) => s.id === currentScene.id);
    const target = OFFICIAL_SCENES[Math.min(OFFICIAL_SCENES.length - 1, idx + 1)];
    handleSelectScene(target);
  };

  const handleRestart = () => {
    lastSpokenSceneRef.current = null;
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const buildFullScriptText = () => {
    const header = [
      'WIKIWORLDWEB — ROTEIRO OFICIAL DE PUBLICIDADE E APRESENTAÇÃO',
      'Tema: Conhecimento Descentralizado, Privacidade com LGPD, Colaboração em Tempo Real e Governança Transparente',
      `Duração total estimada: ${formatTimecode(TOTAL_DURATION_SEC)} (6 cenas)`,
      '========================================================================',
      '',
    ].join('\n');

    const body = OFFICIAL_SCENES.map((scene) => {
      const narration = customScriptNotes[scene.id] || scene.narration;
      return [
        `${scene.code.toUpperCase()} (${formatTimecode(scene.startSec)} – ${formatTimecode(scene.endSec)}) — ${scene.pillar}`,
        `Título: ${scene.title}`,
        `Texto em Tela: "${scene.onScreenHeadline}"`,
        `Subtexto: ${scene.onScreenSubtext}`,
        `Direção Visual: ${scene.visualDirection}`,
        `Locução: ${narration}`,
        '',
      ].join('\n');
    }).join('\n------------------------------------------------------------------------\n\n');

    return `${header}${body}`;
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2200);
    }
  };

  const handleDownloadScript = () => {
    const content = buildFullScriptText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-publicidade-wikiworldweb-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / TOTAL_DURATION_SEC) * 100));
  const sceneDuration = currentScene.endSec - currentScene.startSec;
  const sceneProgress = Math.min(
    100,
    Math.max(0, ((currentTime - currentScene.startSec) / sceneDuration) * 100)
  );
  const canUseSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12 font-sans">
      {/* Hero Section */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10">
        <div className="max-w-4xl space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Conheça a WikiWorldWeb</span>
            <span aria-hidden="true">·</span>
            <span>Campanha Oficial de Apresentação</span>
            <span aria-hidden="true">·</span>
            <span>Licença Livre GNU GPL v3.0 &amp; CC BY-SA 4.0</span>
          </div>

          <h1
            className="font-serif-heading font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] max-w-3xl"
            style={{ fontSize: 'clamp(1.85rem, 3.6vw, 3rem)', textWrap: 'balance' }}
          >
            Conhecimento descentralizado, privacidade com LGPD e colaboração em tempo real.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Apresentação oficial da <strong>WikiWorldWeb</strong>: a enciclopédia livre, rápida e sem anúncios
            construída para oferecer autonomia editorial, proteção absoluta contra exposição de dados pessoais e
            governança comunitária transparente. Assista ao comercial interativo, consulte o roteiro completo ou copie
            os materiais oficiais de divulgação.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('commercial');
                handleRestart();
              }}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play size={16} />
              <span>Reproduzir Comercial Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('hub')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Explorar Enciclopédia</span>
              <ArrowRight size={15} />
            </button>

            {onOpenEditor && (
              <button
                type="button"
                onClick={onOpenEditor}
                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Criar ou Editar Artigo
              </button>
            )}
          </div>
        </div>

        {/* Quantitative / Real Platform Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">0</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Anúncios invasivos ou rastreadores de publicidade
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">6 cenas</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Roteiro audiovisual oficial (01:12 de duração)
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">100% LGPD</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Vedação a nomes reais sem base legal (Lei 13.709/2018)
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">11+ temas</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Interfaces nativas e suporte instalável PWA
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Seções de publicidade da WikiWorldWeb"
          className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'commercial'}
            onClick={() => setActiveTab('commercial')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'commercial'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Film size={15} />
            <span>Comercial Interativo</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'script'}
            onClick={() => setActiveTab('script')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'script'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText size={15} />
            <span>Estúdio de Roteiro</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'kit'}
            onClick={() => setActiveTab('kit')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'kit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Megaphone size={15} />
            <span>Kit de Publicidade</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          Campanha WikiWorldWeb · {formatTimecode(currentTime)} / {formatTimecode(TOTAL_DURATION_SEC)}
        </div>
      </div>

      {/* TAB 1: INTERACTIVE COMMERCIAL PLAYER */}
      {activeTab === 'commercial' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 16:9 Commercial Stage */}
          <div className="lg:col-span-8 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
            {/* Stage Canvas Area */}
            <div
              className="relative flex-1 min-h-[340px] sm:min-h-[420px] p-6 sm:p-10 flex flex-col justify-between"
              style={{
                background: `radial-gradient(circle at 85% 15%, ${currentScene.accentHex}26 0%, transparent 52%), linear-gradient(160deg, #090C12 0%, #0F172A 100%)`,
              }}
            >
              {/* Top Stage Bar */}
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/logo.png"
                    alt="Logotipo WikiWorldWeb"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 object-contain rounded-xs shrink-0"
                  />
                  <div className="text-xs text-slate-300 truncate">
                    <span className="font-semibold text-white">WikiWorldWeb</span>
                    <span className="mx-2 text-slate-500" aria-hidden="true">
                      /
                    </span>
                    <span>{currentScene.code}</span>
                    <span className="mx-2 text-slate-500" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-slate-400">{currentScene.pillar}</span>
                  </div>
                </div>

                <span className="text-xs font-mono tabular-nums text-slate-300 shrink-0">
                  {formatTimecode(currentScene.startSec)} – {formatTimecode(currentScene.endSec)}
                </span>
              </div>

              {/* Center Frame Content */}
              <div className="my-auto py-6 space-y-5 max-w-2xl">
                <h2
                  className="font-serif-heading font-bold text-white leading-tight tracking-tight"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.35rem)', textWrap: 'balance' }}
                >
                  {currentScene.onScreenHeadline}
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {currentScene.onScreenSubtext}
                </p>

                <ul className="space-y-1.5 pt-1 text-xs sm:text-sm text-slate-200">
                  {currentScene.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: currentScene.accentHex }}
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(currentScene.targetView, currentScene.targetTab)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                    style={{ backgroundColor: currentScene.accentHex }}
                  >
                    <span>{currentScene.targetLabel}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Synchronized Caption / Narration Bar */}
              {showSubtitles && (
                <div className="rounded-lg bg-black/55 border border-white/10 px-4 py-3 text-xs sm:text-sm text-slate-100 leading-relaxed">
                  <span className="text-slate-400 font-medium mr-2">Locução:</span>
                  {customScriptNotes[currentScene.id] || currentScene.narration}
                </div>
              )}
            </div>

            {/* Scrubber & Controls */}
            <div className="bg-slate-900 border-t border-white/10 px-4 sm:px-6 py-4 space-y-3">
              {/* Clickable Timeline Bar */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min={0}
                  max={TOTAL_DURATION_SEC}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => {
                    lastSpokenSceneRef.current = null;
                    setCurrentTime(Number(e.target.value));
                  }}
                  aria-label="Linha do tempo do comercial oficial"
                  className="w-full accent-blue-500 cursor-pointer h-1.5"
                />
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                  <span>Progresso total: {Math.round(progressPercent)}%</span>
                  <span>Cena atual: {Math.round(sceneProgress)}%</span>
                </div>
              </div>

              {/* Transport Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    <span>{isPlaying ? 'Pausar' : currentTime >= TOTAL_DURATION_SEC ? 'Rever' : 'Reproduzir'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrevScene}
                    disabled={currentScene.id === 1}
                    title="Cena anterior"
                    aria-label="Cena anterior"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
                  >
                    <SkipBack size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextScene}
                    disabled={currentScene.id === OFFICIAL_SCENES.length}
                    title="Próxima cena"
                    aria-label="Próxima cena"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
                  >
                    <SkipForward size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    title="Reiniciar apresentação"
                    aria-label="Reiniciar apresentação"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubtitles((prev) => !prev)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      showSubtitles
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Subtitles size={14} />
                    <span>{showSubtitles ? 'Legendas ativas' : 'Mostrar legendas'}</span>
                  </button>

                  {canUseSpeech && (
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled((prev) => !prev)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        voiceEnabled
                          ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                          : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      <span>{voiceEnabled ? 'Narração por voz' : 'Ativar voz'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scene Selector Sidebar */}
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cenas do Comercial Oficial
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecione qualquer cena para navegar diretamente pelo roteiro interativo.
                </p>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {OFFICIAL_SCENES.map((scene) => {
                  const isActive = scene.id === currentScene.id;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => handleSelectScene(scene, true)}
                      className={`w-full text-left py-3 px-2.5 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        <span>
                          {scene.code} · {scene.pillar}
                        </span>
                        <span>{formatTimecode(scene.startSec)}</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold mt-0.5 leading-snug">
                        {scene.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('script')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Abrir Estúdio de Roteiro completo
              </button>
              <button
                type="button"
                onClick={handleDownloadScript}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                <span>Baixar .txt</span>
              </button>
            </div>
          </aside>
        </section>
      )}

      {/* TAB 2: SCRIPT STUDIO */}
      {activeTab === 'script' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Estúdio de Roteiro &amp; Decupagem Audiovisual
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Consulte ou ajuste a locução de cada cena para gravações institucionais, vídeos de apresentação e chamadas da comunidade.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyText('full-script', buildFullScriptText())}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedId === 'full-script' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedId === 'full-script' ? 'Roteiro copiado' : 'Copiar roteiro completo'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadScript}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download size={14} />
                <span>Exportar .txt</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {OFFICIAL_SCENES.map((scene) => {
              const currentNarration = customScriptNotes[scene.id] ?? scene.narration;
              const isEdited = customScriptNotes[scene.id] !== undefined && customScriptNotes[scene.id] !== scene.narration;
              return (
                <article key={scene.id} className="py-6 first:pt-0 last:pb-0 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-4 space-y-2">
                    <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {scene.code} · {formatTimecode(scene.startSec)} – {formatTimecode(scene.endSec)} · {scene.pillar}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {scene.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong>Lettering em tela:</strong> {scene.onScreenHeadline}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectScene(scene, true);
                        setActiveTab('commercial');
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Play size={12} />
                      <span>Pré-visualizar cena no player</span>
                    </button>
                  </div>

                  <div className="lg:col-span-8 space-y-3">
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-slate-100">Direção visual:</strong>{' '}
                      {scene.visualDirection}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`script-narration-${scene.id}`}
                          className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          Texto de locução (sincronizado com o player)
                        </label>
                        {isEdited && (
                          <button
                            type="button"
                            onClick={() =>
                              setCustomScriptNotes((prev) => {
                                const copy = { ...prev };
                                delete copy[scene.id];
                                return copy;
                              })
                            }
                            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                          >
                            Restaurar texto oficial
                          </button>
                        )}
                      </div>
                      <textarea
                        id={`script-narration-${scene.id}`}
                        rows={3}
                        value={currentNarration}
                        onChange={(e) =>
                          setCustomScriptNotes((prev) => ({
                            ...prev,
                            [scene.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: ADVERTISING KIT & COPY */}
      {activeTab === 'kit' && (
        <section className="space-y-6">
          {/* Official Brand Lockup & Slogans */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo.png"
                  alt="Emblema oficial da WikiWorldWeb"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Identidade e Slogans Oficiais da WikiWorldWeb
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Frases-chave aprovadas para apresentações, redes sociais, imprensa e documentação.
                  </p>
                </div>
              </div>

              <a
                href="/logo.png"
                download="wikiworldweb-logo.png"
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download size={14} />
                <span>Baixar Logotipo Oficial</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Slogan Principal da Campanha</div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  WikiWorldWeb — Conhecimento Descentralizado, Privacidade com LGPD e Colaboração em Tempo Real.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Lema Filosófico Fundador</div>
                <p className="text-base font-serif-heading italic text-slate-800 dark:text-slate-200">
                  «Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!» — "Não, o Tempo não é o senhor do conhecimento!"
                </p>
              </div>
            </div>
          </div>

          {/* Ready-to-use Ad Pieces */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AD_COPY_PIECES.map((piece) => (
              <article
                key={piece.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {piece.audience} · {piece.format}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {piece.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {piece.copy}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleCopyText(piece.id, piece.copy)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedId === piece.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedId === piece.id ? 'Copiado' : 'Copiar texto'}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Editorial Numbered Capabilities & Institutional Pillars (Always visible below workspace) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Por que apresentar e utilizar a WikiWorldWeb
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Cada ponto divulgado na campanha reflete políticas e ferramentas reais em funcionamento na plataforma.
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {PLATFORM_PILLARS.map((pillar) => (
            <div
              key={pillar.number}
              className="py-5 first:pt-2 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {pillar.number}. {pillar.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(pillar.view)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 self-start md:self-center cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{pillar.cta}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Institutional Quick Links Footer */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck size={14} />
            <span>Privacidade &amp; LGPD</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Scale size={14} />
            <span>Termos de Uso &amp; Firebase</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai-ethics')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu size={14} />
            <span>Ética de Uso da IA</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('firebase-ethics')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Flame size={14} />
            <span>Ética Firebase &amp; Independência WMF</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Wiki dos Livros</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('academic')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap size={14} />
            <span>Wiki Universitário</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin-council')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Users size={14} />
            <span>Conselho de Burocratas</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('wazzimagiygg')}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Globe size={14} />
            <span>Portal WazzimaGiygg</span>
          </button>
        </div>
      </section>
    </div>
  );
};
