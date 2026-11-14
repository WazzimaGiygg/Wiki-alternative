import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Eye,
  FileCheck2,
  Lock,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';

export type AIEthicsTabKey = 'principles' | 'rules' | 'privacy' | 'checklist';

interface AIEthicsViewProps {
  user: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
  onOpenEditor: () => void;
  initialTab?: AIEthicsTabKey;
}

interface AIRuleItem {
  code: string;
  title: string;
  category: 'supervisao' | 'verificabilidade' | 'privacidade' | 'transparencia' | 'conduta';
  status: 'permitido' | 'proibido' | 'obrigatorio';
  summary: string;
  details: string;
}

const AI_ETHICS_RULES: AIRuleItem[] = [
  {
    code: 'IA-01',
    title: 'Supervisão Humana Obrigatória (Human-in-the-Loop)',
    category: 'supervisao',
    status: 'obrigatorio',
    summary: 'Nenhum conteúdo gerado por IA pode ser publicado sem leitura integral e validação humana.',
    details:
      'Ferramentas como o Assistente Gemini e o Gemini Notebook atuam exclusivamente como apoio à redação e síntese. A responsabilidade factual, jurídica e estilística sobre cada edição é integralmente do colaborador humano que a publica.',
  },
  {
    code: 'IA-02',
    title: 'Vedação a Alucinações e Referências Fabricadas',
    category: 'verificabilidade',
    status: 'proibido',
    summary: 'É proibido publicar citações, links, DOIs, ISBNs, datas ou estatísticas geradas por IA sem conferência na fonte original.',
    details:
      'Modelos de linguagem podem inventar títulos de artigos científicos, autores ou números plausíveis. Toda referência inserida em um verbete deve ser aberta e verificada manualmente pelo editor antes de salvar.',
  },
  {
    code: 'IA-03',
    title: 'Transparência e Declaração no Resumo de Edição',
    category: 'transparencia',
    status: 'obrigatorio',
    summary: 'Contribuições com síntese relevante de IA devem informar o apoio utilizado no resumo da edição.',
    details:
      'Ao utilizar rascunhos, traduções ou reestruturações assistidas por IA, indique de forma clara no campo de resumo da edição (ex.: "Revisão estrutural assistida por Gemini com conferência manual das fontes") para preservar a auditabilidade do histórico.',
  },
  {
    code: 'IA-04',
    title: 'Higiene de Prompts e Proteção de Dados (LGPD / GDPR)',
    category: 'privacidade',
    status: 'proibido',
    summary: 'Nunca insira dados pessoais privados, CPF, endereços, segredos de justiça ou dados de menores em prompts de IA.',
    details:
      'O envio de informações privadas ou sigilosas de terceiros para processamento automatizado viola os princípios de minimização e finalidade da LGPD (Lei nº 13.709/2018) e do GDPR (Regulamento UE 2016/679).',
  },
  {
    code: 'IA-05',
    title: 'Proibição de Enxurrada Automatizada e Spam Enciclopédico',
    category: 'conduta',
    status: 'proibido',
    summary: 'É vedada a criação em massa de artigos genéricos, repetitivos ou sem curadoria editorial.',
    details:
      'Publicar dezenas de verbetes gerados automaticamente sem relevância enciclopédica, sem fontes independentes ou com texto superficial compromete a integridade do acervo e resulta em reversão e sanção administrativa.',
  },
  {
    code: 'IA-06',
    title: 'Rigor Reforçado em Biografias de Pessoas Vivas (BPV)',
    category: 'verificabilidade',
    status: 'obrigatorio',
    summary: 'Afirmações sobre pessoas vivas sugeridas por IA exigem dupla verificação em fontes secundárias confiáveis.',
    details:
      'Modelos generativos frequentemente misturam homônimos ou atribuem cargos e processos incorretos. Em biografias de pessoas vivas, qualquer erro pode configurar difamação ou violação de honra.',
  },
  {
    code: 'IA-07',
    title: 'Apoio Estrutural, Revisão Linguística e Acessibilidade',
    category: 'supervisao',
    status: 'permitido',
    summary: 'É permitido usar IA para formatar wikitexto, corrigir gramática, organizar tabelas e traduzir rascunhos revisados.',
    details:
      'O uso ético inclui converter notas próprias do editor em sintaxe wikitexto, melhorar clareza de texto autoral, gerar textos alternativos descritivos para acessibilidade e sintetizar fontes já carregadas no Gemini Notebook.',
  },
  {
    code: 'IA-08',
    title: 'Respeito a Direitos Autorais e Rotulagem de Mídia Sintética',
    category: 'transparencia',
    status: 'obrigatorio',
    summary: 'Não utilize IA para burlar direitos autorais e identifique claramente qualquer imagem sintética.',
    details:
      'Paráfrases mecânicas de obras protegidas não substituem pesquisa independente e são incompatíveis com a licença CC BY-SA 4.0. Imagens geradas ou alteradas por IA devem trazer legenda explícita informando sua origem sintética, em alinhamento com o EU AI Act.',
  },
];

export const AIEthicsView: React.FC<AIEthicsViewProps> = ({
  onNavigate,
  onOpenEditor,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<AIEthicsTabKey>(initialTab || 'principles');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean | null>>({
    c1_human_review: null,
    c2_sources_checked: null,
    c3_no_private_prompt: null,
    c4_neutral_tone: null,
    c5_transparency: null,
  });

  const filteredRules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return AI_ETHICS_RULES;
    return AI_ETHICS_RULES.filter(
      (rule) =>
        rule.code.toLowerCase().includes(q) ||
        rule.title.toLowerCase().includes(q) ||
        rule.summary.toLowerCase().includes(q) ||
        rule.details.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCopyShareUrl = () => {
    const url = `${window.location.origin}/?uid=Special:AIEthics`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    });
  };

  const resetChecklist = () => {
    setChecklistAnswers({
      c1_human_review: null,
      c2_sources_checked: null,
      c3_no_private_prompt: null,
      c4_neutral_tone: null,
      c5_transparency: null,
    });
  };

  const isChecklistComplete = Object.values(checklistAnswers).every((v) => v !== null);
  const isChecklistApproved =
    checklistAnswers.c1_human_review === true &&
    checklistAnswers.c2_sources_checked === true &&
    checklistAnswers.c3_no_private_prompt === true &&
    checklistAnswers.c4_neutral_tone === true &&
    checklistAnswers.c5_transparency === true;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Cabeçalho Editorial Institucional */}
      <header className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Cpu size={22} aria-hidden="true" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                  Special:AIEthics
                </span>
                <span aria-hidden="true">·</span>
                <span>Governança de Inteligência Artificial</span>
                <span aria-hidden="true">·</span>
                <span>LGPD, GDPR &amp; EU AI Act</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                Ética de Uso da Inteligência Artificial
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Diretrizes oficiais para o uso responsável, transparente e verificável de ferramentas de IA na WikiWorldWeb — incluindo o Assistente Gemini, o Gemini Notebook e recursos externos de apoio editorial.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Copiar link permanente da política de ética de IA"
            >
              {copiedUrl ? (
                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
              <span>{copiedUrl ? 'Link copiado' : 'Compartilhar'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenEditor}
              className="px-4 py-2 min-h-[40px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Abrir Editor</span>
            </button>
          </div>
        </div>

        {/* Busca rápida nas regras de IA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar regras de IA (ex.: alucinação, LGPD, fontes, BPV)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>A autoria e a responsabilidade editorial pertencem sempre ao colaborador humano.</span>
          </div>
        </div>
      </header>

      {/* Resultado instantâneo quando há termo de busca */}
      {searchQuery.trim().length > 0 && (
        <section
          aria-label="Resultados da busca nas regras de IA"
          className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Resultados para &ldquo;{searchQuery}&rdquo; ({filteredRules.length})
            </h2>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Limpar filtro
            </button>
          </div>

          {filteredRules.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              Nenhuma regra corresponde ao termo pesquisado. Tente palavras como &ldquo;fontes&rdquo;, &ldquo;privacidade&rdquo;, &ldquo;supervisão&rdquo; ou &ldquo;transparência&rdquo;.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRules.map((rule) => (
                <article key={rule.code} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold tabular-nums text-indigo-700 dark:text-indigo-400">
                      {rule.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{rule.title}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span
                      className={`font-medium ${
                        rule.status === 'proibido'
                          ? 'text-rose-700 dark:text-rose-400'
                          : rule.status === 'permitido'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {rule.status === 'proibido'
                        ? 'Uso proibido'
                        : rule.status === 'permitido'
                          ? 'Permitido com revisão'
                          : 'Requisito obrigatório'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {rule.summary}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rule.details}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Barra de Navegação por Abas */}
      <nav
        aria-label="Seções de Ética de Uso da IA"
        className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
      >
        <button
          type="button"
          onClick={() => setActiveTab('principles')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'principles'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen size={14} />
          <span>01. Princípios Fundamentais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Scale size={14} />
          <span>02. Regras (Permitido vs. Proibido)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock size={14} />
          <span>03. Privacidade, LGPD &amp; AI Act</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCheck2 size={14} />
          <span>04. Autoverificação de IA</span>
        </button>
      </nav>

      {/* ABA 1: PRINCÍPIOS FUNDAMENTAIS */}
      {activeTab === 'principles' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Os Quatro Pilares do Uso Ético de IA na Enciclopédia
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              A Inteligência Artificial integrada à WikiWorldWeb existe para ampliar a capacidade de organização e pesquisa dos editores, jamais para substituir o discernimento humano ou degradar a confiabilidade do conhecimento público.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                <UserCheck size={17} aria-hidden="true" />
                <h3>01. Supervisão Humana Integral</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Sistemas generativos não têm compromisso intrínseco com a verdade factual. Todo texto sugerido pelo Assistente Gemini ou pelo Gemini Notebook deve ser lido linha a linha, corrigido e validado pelo editor humano antes da publicação.
              </p>
            </article>

            <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <ShieldCheck size={17} aria-hidden="true" />
                <h3>02. Verificabilidade Antes da Velocidade</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Cada dado numérico, citação bibliográfica, decisão judicial ou vínculo institucional sugerido por IA precisa ser conferido em fontes secundárias independentes. Se você não abriu a fonte para confirmar, não publique.
              </p>
            </article>

            <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
                <Eye size={17} aria-hidden="true" />
                <h3>03. Transparência Editorial</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A comunidade tem direito de saber quando um conteúdo teve síntese ou tradução assistida por IA. O registro transparente no resumo da edição fortalece a confiança e facilita revisões colaborativas futuras.
              </p>
            </article>

            <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                <Scale size={17} aria-hidden="true" />
                <h3>04. Neutralidade e Controle de Viés</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Modelos de IA tendem a produzir linguagem excessivamente elogiosa, adjetivações vazias ou visões majoritárias sem nuances. O editor deve reescrever o texto no padrão enciclopédico neutro (NPOV) da WikiWorldWeb.
              </p>
            </article>
          </div>
        </section>
      )}

      {/* ABA 2: REGRAS (PERMITIDO VS. PROIBIDO) */}
      {activeTab === 'rules' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm pb-3 border-b border-slate-200 dark:border-slate-800">
                <CheckCircle2 size={18} aria-hidden="true" />
                <h2>Práticas Permitidas (com revisão humana)</h2>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <li>Organizar notas de pesquisa próprias em estrutura de seções e wikitexto.</li>
                <li>Corrigir ortografia, concordância e clareza sem alterar o sentido das fontes.</li>
                <li>Sintetizar artigos ou documentos já validados e carregados no Gemini Notebook.</li>
                <li>Gerar tabelas comparativas e infoboxes a partir de dados conferidos pelo editor.</li>
                <li>Traduzir trechos de referência com revisão terminológica manual.</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm pb-3 border-b border-slate-200 dark:border-slate-800">
                <XCircle size={18} aria-hidden="true" />
                <h2>Práticas Estritamente Proibidas</h2>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <li>Publicar texto gerado por IA sem leitura completa e conferência factual.</li>
                <li>Manter citações, URLs, leis ou estatísticas sugeridas sem verificar sua existência real.</li>
                <li>Criar dezenas de verbetes automáticos em série (spam ou conteúdo sintético sem curadoria).</li>
                <li>Submeter dados pessoais privados de terceiros (CPF, endereço, telefone) em prompts.</li>
                <li>Utilizar bots ou contas automatizadas para simular consenso em discussões ou votações.</li>
              </ul>
            </div>
          </div>

          {/* Tabela / Lista Normativa IA-01 a IA-08 */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              Código Normativo de Uso da IA (IA-01 a IA-08)
            </h2>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {AI_ETHICS_RULES.map((rule) => (
                <div key={rule.code} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono font-bold tabular-nums text-indigo-700 dark:text-indigo-400">
                        {rule.code}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {rule.title}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        rule.status === 'proibido'
                          ? 'text-rose-700 dark:text-rose-400'
                          : rule.status === 'permitido'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {rule.status === 'proibido'
                        ? 'Proibido'
                        : rule.status === 'permitido'
                          ? 'Permitido com revisão'
                          : 'Obrigatório'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {rule.summary}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rule.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ABA 3: PRIVACIDADE, LGPD, GDPR & EU AI ACT */}
      {activeTab === 'privacy' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Conformidade Jurídica: LGPD, Marco Civil, GDPR e EU AI Act
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              O uso de Inteligência Artificial na WikiWorldWeb submete-se integralmente às garantias de proteção de dados pessoais, direitos autorais e transparência algorítmica.
            </p>
          </div>

          <dl className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
            <div className="p-4 sm:p-5 space-y-1.5">
              <dt className="font-semibold text-slate-900 dark:text-white">
                LGPD (Lei nº 13.709/2018) — Minimização e Revisão de Decisões Automatizadas (Art. 20)
              </dt>
              <dd className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Os colaboradores estão proibidos de inserir dados pessoais sensíveis ou sigilosos em solicitações à IA. Ademais, nenhuma sanção editorial ou bloqueio comunitário definitivo é imposto exclusivamente por ferramenta automatizada sem direito à revisão humana pelo Conselho ou Burocrata.
              </dd>
            </div>

            <div className="p-4 sm:p-5 space-y-1.5">
              <dt className="font-semibold text-slate-900 dark:text-white">
                EU AI Act (Regulamento UE 2024/1689) — Transparência de Conteúdo Sintético (Art. 50)
              </dt>
              <dd className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                O usuário é sempre informado quando interage com o Assistente Gemini ou com o Gemini Notebook. Imagens, diagramas ou áudios gerados ou manipulados por IA devem informar expressamente sua natureza sintética na legenda do arquivo.
              </dd>
            </div>

            <div className="p-4 sm:p-5 space-y-1.5">
              <dt className="font-semibold text-slate-900 dark:text-white">
                Direitos Autorais, Plágio e Licença Livre (CC BY-SA 4.0)
              </dt>
              <dd className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Não utilize modelos de linguagem para reproduzir ou parafrasear livros, artigos acadêmicos ou reportagens protegidas por direitos autorais. Antes de publicar textos longos ou acadêmicos, recomenda-se validar a originalidade na ferramenta Anti-Plágio do Wiki-site.
              </dd>
            </div>

            <div className="p-4 sm:p-5 space-y-1.5">
              <dt className="font-semibold text-slate-900 dark:text-white">
                Prevenção de Danos e Respeito à Dignidade Humana
              </dt>
              <dd className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                É terminantemente proibido empregar ferramentas de IA da plataforma para gerar assédio, discursos de ódio, desinformação deliberada, calúnias contra pessoas vivas ou exposição de crianças e adolescentes.
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* ABA 4: AUTOVERIFICAÇÃO ÉTICA DE IA */}
      {activeTab === 'checklist' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Autoverificação Antes de Publicar Conteúdo com Apoio de IA
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Confirme os cinco critérios abaixo sempre que usar o Assistente Gemini, Gemini Notebook ou outra IA em uma edição.
              </p>
            </div>
            <button
              type="button"
              onClick={resetChecklist}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline cursor-pointer self-start sm:self-auto"
            >
              Reiniciar respostas
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                key: 'c1_human_review',
                label: '1. Li integralmente e revisei manualmente cada parágrafo sugerido pela IA?',
              },
              {
                key: 'c2_sources_checked',
                label: '2. Abri e conferi todas as fontes, datas, citações e links na origem real (sem confiar cegamente na IA)?',
              },
              {
                key: 'c3_no_private_prompt',
                label: '3. Garanti que nenhum dado pessoal privado, sigiloso ou de menor de idade foi enviado no prompt?',
              },
              {
                key: 'c4_neutral_tone',
                label: '4. Removi adjetivos promocionais ou parciais, mantendo o Ponto de Vista Neutro (NPOV)?',
              },
              {
                key: 'c5_transparency',
                label: '5. Informarei o uso de apoio de IA no resumo da edição (ou na legenda, se houver mídia sintética)?',
              },
            ].map((item) => {
              const value = checklistAnswers[item.key];
              return (
                <div
                  key={item.key}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setChecklistAnswers((prev) => ({ ...prev, [item.key]: true }))
                      }
                      className={`px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                        value === true
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setChecklistAnswers((prev) => ({ ...prev, [item.key]: false }))
                      }
                      className={`px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                        value === false
                          ? 'bg-rose-700 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {isChecklistComplete && (
            <div
              role="status"
              className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
                isChecklistApproved
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {isChecklistApproved ? (
                  <CheckCircle2 size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-rose-700 dark:text-rose-400 shrink-0" />
                )}
                <span>
                  {isChecklistApproved
                    ? 'Contribuição apta segundo a Ética de Uso da IA.'
                    : 'Revisão necessária antes de publicar no Wiki-site.'}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {isChecklistApproved
                  ? 'Seu fluxo atende aos princípios de supervisão humana, verificabilidade, privacidade (LGPD/GDPR) e transparência.'
                  : 'Corrija os pontos marcados como "Não": verifique as fontes originais, revise o texto manualmente, proteja dados privados e registre o apoio de IA no resumo.'}
              </p>
              {isChecklistApproved && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenEditor}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Seguir para o Editor</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Rodapé de Integração com Outras Políticas do Wiki-site */}
      <footer className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5 text-slate-600 dark:text-slate-400">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Bot size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Políticas relacionadas da WikiWorldWeb</span>
          </div>
          <p>
            A Ética de Uso da IA complementa as Regras de Ética de Edição, o verificador Anti-Plágio e o Código de Conduta Universal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('editing-ethics')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Ética de Edição (LGPD/GDPR)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('firebase-ethics')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Ética Firebase &amp; Caso Chronus
          </button>
          <button
            type="button"
            onClick={() => onNavigate('antiplagio')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Anti-Plágio
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ucoc')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Código de Conduta (UCoC)
          </button>
        </div>
      </footer>
    </div>
  );
};
