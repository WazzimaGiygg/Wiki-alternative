import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Database,
  EyeOff,
  FileCheck2,
  Lock,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';

export type RealNamesLgpdTabKey =
  | 'prohibition'
  | 'lgpd_alignment'
  | 'anonymization'
  | 'checklist';

interface RealNamesLgpdEthicsViewProps {
  user: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
  initialTab?: RealNamesLgpdTabKey;
}

interface RealNamesLgpdRule {
  code: string;
  section: 'prohibition' | 'lgpd';
  title: string;
  classification: 'proibido' | 'obrigatorio';
  summary: string;
  details: string;
}

const REAL_NAMES_LGPD_RULES: RealNamesLgpdRule[] = [
  {
    code: 'LGPD-01',
    section: 'prohibition',
    title: 'Vedação ao Uso de Nomes de Pessoas Reais sem Base Legal Estrita',
    classification: 'proibido',
    summary:
      'É proibido publicar, registrar ou vincular nomes civis reais de cidadãos comuns, colaboradores, familiares ou testemunhas sem base legal explícita ou consentimento inequívoco.',
    details:
      'Na WikiWorldWeb, a identidade civil de pessoas naturais não deve ser exposta em verbetes, exemplos, páginas de discussão, metadados ou registros comunitários. O sistema adota prioritariamente pseudônimos editoriais (nicknames) e identificadores técnicos criptográficos (UID).',
  },
  {
    code: 'LGPD-02',
    section: 'prohibition',
    title: 'Desvinculação Absoluta entre Pseudônimo e Identidade Civil (Anti-Doxxing / Anti-Outing)',
    classification: 'proibido',
    summary:
      'É terminantemente proibido revelar ou correlacionar o nome civil real de um editor, leitor ou denunciante a sua conta pseudônima.',
    details:
      'Inclui a proibição de publicar prenome e sobrenome, filiação, apelidos familiares, endereço residencial, local de trabalho, número de matrícula, CPF, RG, telefone ou qualquer atributo que torne a pessoa natural identificável (Art. 5º, I da LGPD).',
  },
  {
    code: 'LGPD-03',
    section: 'prohibition',
    title: 'Proibição em Prompts de IA, Coleções Firebase e Logs de Moderação',
    classification: 'proibido',
    summary:
      'Nomes completos de pessoas reais privadas não podem ser inseridos em prompts do Assistente Gemini, no Gemini Notebook, em documentos públicos do Firestore nem em justificativas de bloqueio.',
    details:
      'Mesmo ao utilizar ferramentas internas de redação, auditoria ou arbitragem, eventuais partes envolvidas sem notoriedade pública devem ser tratadas exclusivamente por identificadores anonimizados, siglas ou nomes de conta.',
  },
  {
    code: 'LGPD-04',
    section: 'prohibition',
    title: 'Substituição Imediata por Pseudonímia e Expurgo Permanente (Oversight)',
    classification: 'obrigatorio',
    summary:
      'Qualquer inclusão indevida de nome civil real exige remoção imediata e supressão integral do histórico de revisões.',
    details:
      'Diferente de uma reversão simples que mantém o nome visível no histórico antigo, violações nominais são tratadas com expurgo definitivo (Oversight) no banco de dados e no cache de busca, garantindo que o dado pessoal desapareça completamente.',
  },
  {
    code: 'LGPD-05',
    section: 'lgpd',
    title: 'Alinhamento Absoluto aos Princípios da LGPD (Arts. 1º, 2º e 6º)',
    classification: 'obrigatorio',
    summary:
      'Todo tratamento de dados na plataforma submete-se integralmente à autodeterminação informativa, finalidade, adequação, necessidade, transparência e não discriminação.',
    details:
      'Sob o princípio da necessidade (Art. 6º, III da Lei nº 13.709/2018), nenhum dado pessoal nominal pode ser coletado, exibido ou retido além do estritamente indispensável para o funcionamento legítimo e seguro do serviço.',
  },
  {
    code: 'LGPD-06',
    section: 'lgpd',
    title: 'Blindagem Total de Dados Sensíveis e de Crianças e Adolescentes (Arts. 11 e 14)',
    classification: 'proibido',
    summary:
      'É vedado vincular nomes reais a dados sensíveis privados ou identificar nominalmente menores de 18 anos sem interesse público inequívoco e proteção legal.',
    details:
      'Em alinhamento com os Arts. 11 e 14 da LGPD e com o Estatuto da Criança e do Adolescente (ECA), filhos, cônjuges ou parentes sem notoriedade pública própria jamais podem ter seus nomes citados em verbetes ou listas.',
  },
  {
    code: 'LGPD-07',
    section: 'lgpd',
    title: 'Direito Efetivo do Titular à Anonimização e Eliminação (Art. 18)',
    classification: 'obrigatorio',
    summary:
      'Qualquer cidadão tem direito garantido de exigir correção, anonimização, bloqueio ou eliminação imediata de seu nome sem exposição pública.',
    details:
      'Solicitações enviadas em Special:DataRemovalRequests ou Special:MyData são processadas em fluxo privado e sigiloso — nunca em votações públicas comunitárias — evitando o chamado Efeito Streisand e assegurando atendimento direto pelo DPO.',
  },
  {
    code: 'LGPD-08',
    section: 'lgpd',
    title: 'Governança, Canal DPO Dedicado e Cooperação com a ANPD (Arts. 41 e 52)',
    classification: 'obrigatorio',
    summary:
      'A WikiWorldWeb reconhece integralmente a jurisdição brasileira, mantém Encarregado pelo Tratamento de Dados (DPO) e aplica sanções severas a infratores.',
    details:
      'Qualquer tentativa de violação às normas de anonimato nominal ou recusa em remover nomes reais sem base legal sujeita o responsável a bloqueio perpétuo da conta e encaminhamento ao DPO e às autoridades competentes.',
  },
];

export const RealNamesLgpdEthicsView: React.FC<RealNamesLgpdEthicsViewProps> = ({
  onNavigate,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<RealNamesLgpdTabKey>(
    initialTab || 'prohibition'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean | null>>({
    n1_no_civil_names: null,
    n2_no_family_or_minors: null,
    n3_no_outing_pseudonyms: null,
    n4_no_ai_or_firebase_pii: null,
    n5_lgpd_minimization: null,
  });

  const filteredRules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return REAL_NAMES_LGPD_RULES.filter(
      (rule) =>
        rule.code.toLowerCase().includes(q) ||
        rule.title.toLowerCase().includes(q) ||
        rule.summary.toLowerCase().includes(q) ||
        rule.details.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCopyShareUrl = () => {
    const url = `${window.location.origin}/?uid=Special:NoRealNamesLGPD`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    });
  };

  const resetChecklist = () => {
    setChecklistAnswers({
      n1_no_civil_names: null,
      n2_no_family_or_minors: null,
      n3_no_outing_pseudonyms: null,
      n4_no_ai_or_firebase_pii: null,
      n5_lgpd_minimization: null,
    });
  };

  const isChecklistComplete = Object.values(checklistAnswers).every((v) => v !== null);
  const isChecklistApproved =
    checklistAnswers.n1_no_civil_names === true &&
    checklistAnswers.n2_no_family_or_minors === true &&
    checklistAnswers.n3_no_outing_pseudonyms === true &&
    checklistAnswers.n4_no_ai_or_firebase_pii === true &&
    checklistAnswers.n5_lgpd_minimization === true;

  const prohibitionRules = REAL_NAMES_LGPD_RULES.filter((r) => r.section === 'prohibition');
  const lgpdRules = REAL_NAMES_LGPD_RULES.filter((r) => r.section === 'lgpd');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Cabeçalho Editorial Institucional */}
      <header className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-slate-900 dark:bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <UserX size={22} aria-hidden="true" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  Special:NoRealNamesLGPD
                </span>
                <span aria-hidden="true">·</span>
                <span>Ética de Uso &amp; Identidade</span>
                <span aria-hidden="true">·</span>
                <span>Alinhamento Absoluto à LGPD (Lei nº 13.709/2018)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                Ética de Não Uso de Nomes de Pessoas Reais e Alinhamento Absoluto com a LGPD
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Diretriz normativa de tolerância zero à exposição de nomes civis de pessoas reais sem base legal estrita, assegurando anonimato, pseudonímia segura e conformidade integral com todos os princípios e direitos da Lei Geral de Proteção de Dados Pessoais.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Copiar link permanente desta política"
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
              onClick={() => onNavigate('mydata')}
              className="px-4 py-2 min-h-[40px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck size={14} />
              <span>Meus Dados (LGPD)</span>
            </button>
          </div>
        </div>

        {/* Busca rápida nas diretrizes */}
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
              placeholder="Filtrar regras (ex.: nome real, pseudônimo, Art. 18, Oversight)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Lock size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Nomes civis privados são substituídos por pseudônimos ou expurgados via Oversight.</span>
          </div>
        </div>
      </header>

      {/* Resultado de busca instantânea */}
      {searchQuery.trim().length > 0 && (
        <section
          aria-label="Resultados da busca nas regras de não uso de nomes reais e LGPD"
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
              Nenhuma norma corresponde ao termo pesquisado. Tente palavras como &ldquo;pseudônimo&rdquo;, &ldquo;menor&rdquo;, &ldquo;Oversight&rdquo; ou &ldquo;Art. 18&rdquo;.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRules.map((rule) => (
                <article key={rule.code} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {rule.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{rule.title}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span
                      className={`font-medium ${
                        rule.classification === 'proibido'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {rule.classification === 'proibido' ? 'Uso proibido' : 'Requisito obrigatório'}
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
        aria-label="Seções de Ética contra Uso de Nomes Reais e LGPD"
        className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
      >
        <button
          type="button"
          onClick={() => setActiveTab('prohibition')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'prohibition'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserX size={14} />
          <span>01. Vedação a Nomes Reais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lgpd_alignment')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'lgpd_alignment'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck size={14} />
          <span>02. Alinhamento Absoluto à LGPD</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('anonymization')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'anonymization'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <EyeOff size={14} />
          <span>03. Anonimização &amp; Remoção</span>
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
          <span>04. Autoverificação Nominal</span>
        </button>
      </nav>

      {/* ABA 1: VEDAÇÃO AO USO DE NOMES DE PESSOAS REAIS */}
      {activeTab === 'prohibition' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Proibição Estrita do Uso e Exposição de Nomes de Pessoas Reais
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Como princípio ético central da WikiWorldWeb, informações que identifiquem pelo nome real pessoas naturais privadas — sejam usuários, cidadãos sem notoriedade pública estrita, familiares ou terceiros citados em disputas — não devem ser publicadas, indexadas nem processadas na plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                <ShieldAlert size={17} aria-hidden="true" />
                <h3>Pseudonímia como Regra Padrão</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Contribuições, discussões, exemplos didáticos e casos administrativos devem utilizar pseudônimos, códigos neutros ou identidades fictícias. É vedado exigir ou divulgar o nome civil de quem participa sob apelido editorial.
              </p>
            </article>

            <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <UserCheck size={17} aria-hidden="true" />
                <h3>Rigor em Figuras Públicas e Consenso Legal</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Apenas personalidades com inequívoca notoriedade pública documentada em fontes secundárias independentes podem ter referências biográficas — sempre limitadas ao estrito interesse enciclopédico e sem dados íntimos ou familiares.
              </p>
            </article>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-2">
            {prohibitionRules.map((rule) => (
              <article key={rule.code} className="py-4 last:pb-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {rule.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{rule.title}</h3>
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      rule.classification === 'proibido'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {rule.classification === 'proibido' ? 'Uso proibido' : 'Requisito obrigatório'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {rule.summary}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {rule.details}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ABA 2: ALINHAMENTO ABSOLUTO COM A LGPD */}
      {activeTab === 'lgpd_alignment' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Alinhamento Absoluto com a LGPD (Lei nº 13.709/2018)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Nenhuma norma editorial, costume comunitário ou argumento de &ldquo;registro histórico imutável&rdquo; prevalece sobre os direitos fundamentais de privacidade, intimidade, honra e proteção de dados garantidos pela legislação brasileira.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {lgpdRules.map((rule) => (
              <article key={rule.code} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {rule.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{rule.title}</h3>
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      rule.classification === 'proibido'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {rule.classification === 'proibido' ? 'Conduta vedada' : 'Obrigação absoluta'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {rule.summary}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {rule.details}
                </p>
              </article>
            ))}
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-900 dark:text-white">
                Canal Privado do Encarregado pelo Tratamento de Dados (DPO)
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Solicitações de remoção imediata de nomes reais ou exercício de direitos do Art. 18 da LGPD: <span className="font-mono text-slate-900 dark:text-white">pedrohenriquecardonaperes@gmail.com</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin-data-removal')}
              className="px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Solicitações de Remoção LGPD</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      )}

      {/* ABA 3: ANONIMIZAÇÃO, SUBSTITUIÇÃO E REMOÇÃO IMEDIATA */}
      {activeTab === 'anonymization' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Padrão Prático de Anonimização e Substituição de Nomes Reais
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Ao redigir verbetes, exemplos, relatórios técnicos, prompts de IA ou documentos no Firebase, substitua obrigatoriamente qualquer referência nominal privada pelas alternativas compatíveis com a LGPD abaixo.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Contexto de Uso
                  </th>
                  <th className="py-3 px-4 font-semibold text-rose-800 dark:text-rose-400">
                    Prática Proibida (Violação LGPD)
                  </th>
                  <th className="py-3 px-4 font-semibold text-emerald-800 dark:text-emerald-400">
                    Prática Aprovada (Alinhamento Absoluto)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Contas &amp; Discussões Editoriais
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Citar o nome civil completo de um editor ou ligar sua conta ao nome real.
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Referenciar exclusivamente pelo pseudônimo/apelido da conta ou código UID.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Exemplos em Artigos &amp; Manuais
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Usar nomes, CPFs, e-mails ou históricos reais de cidadãos comuns como estudo de caso.
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Empregar nomes explicitamente fictícios (ex.: &ldquo;Colaborador A&rdquo;, &ldquo;Exemplo Fictício&rdquo;).
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Prompts de IA &amp; Registros Firebase
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Colar listas de nomes reais, documentos judiciais sigilosos ou dados de terceiros.
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Anonimizar previamente todos os nomes e remover qualquer identificador pessoal antes de enviar.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Parentes &amp; Menores de Idade
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Publicar nomes de filhos menores, cônjuges ou familiares sem notoriedade autônoma.
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    Omitir integralmente a identificação nominal ou utilizar menção genérica neutra quando estritamente necessária.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('emergency-contact')}
              className="px-4 py-2 min-h-[40px] rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <AlertTriangle size={14} />
              <span>Solicitar Remoção Urgente (Plantão Doxxing)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('mydata')}
              className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Database size={14} />
              <span>Exportar ou Excluir Meus Dados</span>
            </button>
          </div>
        </section>
      )}

      {/* ABA 4: AUTOVERIFICAÇÃO NOMINAL & LGPD */}
      {activeTab === 'checklist' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Autoverificação contra Exposição de Nomes Reais e Conformidade LGPD
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Confirme os cinco critérios abaixo antes de publicar qualquer verbete, comentário ou registro técnico no Wiki-site.
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
                key: 'n1_no_civil_names',
                label:
                  '1. Removi ou substituí por pseudônimos todos os nomes civis de pessoas reais privadas sem base legal nem notoriedade pública?',
              },
              {
                key: 'n2_no_family_or_minors',
                label:
                  '2. Garanti que nenhum menor de 18 anos ou familiar sem notoriedade própria foi identificado pelo nome (Art. 14 LGPD & ECA)?',
              },
              {
                key: 'n3_no_outing_pseudonyms',
                label:
                  '3. O conteúdo evita vincular contas pseudônimas ou apelidos editoriais à identidade civil real de qualquer colaborador?',
              },
              {
                key: 'n4_no_ai_or_firebase_pii',
                label:
                  '4. Confirmei que nenhum nome civil privado foi inserido em prompts de IA ou em registros públicos do Firebase?',
              },
              {
                key: 'n5_lgpd_minimization',
                label:
                  '5. A publicação respeita a minimização absoluta de dados e o direito imediato de anonimização do titular (Arts. 6º e 18 da LGPD)?',
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
                    ? 'Contribuição plenamente alinhada à LGPD e à proteção de identidade.'
                    : 'Revisão obrigatória: risco de exposição nominal ou desconformidade com a LGPD.'}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {isChecklistApproved
                  ? 'Nenhum nome civil privado foi exposto sem base legal e todos os princípios de minimização, anonimato e proteção a menores foram respeitados.'
                  : 'Substitua nomes civis por pseudônimos ou identificadores neutros antes de salvar e solicite supressão (Oversight) caso algum dado já tenha sido publicado.'}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Rodapé Integrado de Governança Ética */}
      <footer className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5 text-slate-600 dark:text-slate-400">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Scale size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>Ecossistema Completo de Ética e Proteção de Dados</span>
          </div>
          <p>
            Consulte também as regras de Ética de Edição, Ética de Uso da IA, Ética Firebase &amp; Caso Chronus e a Política de Privacidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('editing-ethics')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Ética de Edição
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai-ethics')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Ética de IA
          </button>
          <button
            type="button"
            onClick={() => onNavigate('firebase-ethics')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Ética Firebase &amp; Chronus
          </button>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Política LGPD
          </button>
        </div>
      </footer>
    </div>
  );
};
