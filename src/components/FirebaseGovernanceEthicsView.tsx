import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileCheck2,
  FileText,
  Flame,
  Gavel,
  Globe,
  Lock,
  Presentation,
  Scale,
  Search,
  ServerOff,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';
import { IrregularidadesDossierModal, DossierDocType } from './IrregularidadesDossierModal';

export type FirebaseGovernanceTabKey =
  | 'firebase_ethics'
  | 'firebase_terms'
  | 'no_wikimedia'
  | 'chronus_abuses'
  | 'checklist';

interface FirebaseGovernanceEthicsViewProps {
  user: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
  initialTab?: FirebaseGovernanceTabKey;
}

interface GovernanceRuleItem {
  code: string;
  section: 'firebase' | 'firebase_terms' | 'wikimedia' | 'chronus';
  title: string;
  classification: 'obrigatorio' | 'proibido' | 'documentado';
  summary: string;
  details: string;
}

const GOVERNANCE_RULES: GovernanceRuleItem[] = [
  {
    code: 'FB-01',
    section: 'firebase',
    title: 'Menor Privilégio, RBAC e Regras Estritas do Firestore',
    classification: 'obrigatorio',
    summary:
      'O acesso às coleções do Cloud Firestore obedece ao princípio do menor privilégio e validação por perfil.',
    details:
      'Contas comuns não acessam coleções administrativas, trilhas de auditoria ou registros internos de CheckUser. Toda operação privilegiada no banco exige autenticação válida, verificação de papel (Administrador, Burocrata ou Conselheiro) e observância das regras de segurança declaradas em firestore.rules.',
  },
  {
    code: 'FB-02',
    section: 'firebase',
    title: 'Minimização, Não Uso de Nomes Reais e Alinhamento Absoluto à LGPD',
    classification: 'obrigatorio',
    summary:
      'Nenhum nome civil de pessoa real privada ou dado sensível sem base legal pode ser gravado no Firebase.',
    details:
      'Em alinhamento absoluto com os Arts. 5º, 6º, 14 e 18 da LGPD (Lei nº 13.709/2018) e o GDPR europeu, documentos enciclopédicos e logs administrativos devem empregar pseudônimos e nunca expor nomes civis privados, CPF, endereços ou dados de menores. Titulares possuem direito imediato de exportação (Special:MyData) e remoção definitiva (Special:DataRemovalRequests).',
  },
  {
    code: 'FB-03',
    section: 'firebase',
    title: 'Uso Responsável de Cotas, Leituras, Escritas e Armazenamento',
    classification: 'proibido',
    summary:
      'É proibido provocar loops de gravação, raspagem automatizada ou sobrecarga artificial nos serviços Firebase.',
    details:
      'A infraestrutura em Cloud Firestore (banco dedicado da instância) deve ser utilizada com parcimônia e eficiência, utilizando cache local quando pertinente e monitoramento contínuo via telemetria de uso para evitar indisponibilidade e desperdício de recursos públicos do projeto.',
  },
  {
    code: 'FB-04',
    section: 'firebase',
    title: 'Auditabilidade e Vedação à Adulteração Clandestina de Logs',
    classification: 'proibido',
    summary:
      'É terminantemente proibido apagar, mascarar ou manipular silenciosamente registros de banimentos, recursos ou auditoria.',
    details:
      'Toda sanção, desbloqueio, sincronização de extensões ou alteração de permissão executada no painel administrativo Firebase deve preservar vínculo de autoria, justificativa formal e registro verificável, impedindo arbitrariedades ocultas.',
  },
  {
    code: 'FB-05',
    section: 'firebase',
    title: 'Higiene de Credenciais, Segredos e Gatekeeper de Segurança',
    classification: 'obrigatorio',
    summary:
      'Nenhuma chave privada de conta de serviço, token administrativo ou credencial sensível pode ser exposta no código-fonte ou no navegador.',
    details:
      'A proteção de sessão e o isolamento de extensões operam em conjunto com o WikiSecurityGatekeeper e o verificador de segurança de rede, mantendo separação rigorosa entre configurações públicas de inicialização e segredos de servidor.',
  },
  {
    code: 'FB-06',
    section: 'firebase',
    title: 'Portabilidade, Backups JSON Auditáveis e Independência Aberta',
    classification: 'obrigatorio',
    summary:
      'Os dados públicos da enciclopédia mantêm portabilidade integral sob licença livre CC BY-SA 4.0 e GNU GPL v3.0.',
    details:
      'O uso do Firebase como camada de persistência não gera aprisionamento proprietário (vendor lock-in): o sistema dispõe de exportação estruturada em JSON e Wikitexto, garantindo soberania comunitária sobre todo o acervo.',
  },
  {
    code: 'TF-01',
    section: 'firebase_terms',
    title: 'Objeto e Finalidade dos Serviços Google Firebase na Plataforma',
    classification: 'obrigatorio',
    summary:
      'Os serviços Firebase (Cloud Firestore, Authentication e recursos auxiliares) operam exclusivamente para o funcionamento enciclopédico, controle de sessão e cumprimento da LGPD.',
    details:
      'É vedado utilizar a infraestrutura Firebase vinculada à WikiWorldWeb para fins comerciais alheios ao projeto, hospedagem de malware, mineração, envio de spam ou armazenamento de arquivos ilícitos.',
  },
  {
    code: 'TF-02',
    section: 'firebase_terms',
    title: 'Uso Aceitável, Proteção de Cotas e Proibição de Bypass de Regras',
    classification: 'proibido',
    summary:
      'É proibido sobrecarregar cotas de leitura/gravação, realizar varreduras automatizadas ou tentar burlar as regras do firestore.rules.',
    details:
      'Qualquer tentativa de engenharia reversa abusiva, enumeração de UIDs, injeção de payload ou automação não autorizada sobre os endpoints do Cloud Firestore resulta em bloqueio imediato e revogação de credenciais.',
  },
  {
    code: 'TF-03',
    section: 'firebase_terms',
    title: 'Proibição de Gravar Nomes Civis Reais e Dados Privados nas Coleções',
    classification: 'proibido',
    summary:
      'O usuário compromete-se a não gravar nomes civis de pessoas reais privadas, documentos pessoais ou dados de menores em artigos ou registros do Firebase.',
    details:
      'Violações às normas de proteção de dados e vedação a nomes reais (Special:NoRealNamesLGPD) submetem-se ao expurgo definitivo (Oversight) no Firestore e às sanções disciplinares previstas nos Termos de Uso (Special:Terms).',
  },
  {
    code: 'TF-04',
    section: 'firebase_terms',
    title: 'Suspensão, Revogação de Acesso e Direito ao Contraditório',
    classification: 'obrigatorio',
    summary:
      'Contas que violem os Termos de Uso do Firebase têm acesso suspenso mediante justificativa registrada em trilha auditável.',
    details:
      'Diferentemente de bloqueios arbitrários sem defesa, toda restrição técnica aplicada por violação de uso conta com via formal de revisão e contestação em Special:UnblockRequests e Special:Arbitration.',
  },
  {
    code: 'TF-05',
    section: 'firebase_terms',
    title: 'Disponibilidade, Manutenção do Provedor e Backups Comunitários',
    classification: 'obrigatorio',
    summary:
      'A continuidade do serviço segue a disponibilidade técnica do provedor Google Cloud / Firebase, complementada por exportações JSON auditáveis.',
    details:
      'Não há garantia de operação ininterrupta em casos de força maior ou janelas de manutenção de nuvem; contudo, os artigos sob CC BY-SA 4.0 permanecem livres e exportáveis para preservar a continuidade do conhecimento.',
  },
  {
    code: 'TF-06',
    section: 'firebase_terms',
    title: 'Independência Contratual e Operacional frente à Wikimedia Foundation',
    classification: 'obrigatorio',
    summary:
      'Os Termos de Uso dos serviços Firebase da WikiWorldWeb não possuem vínculo nem subordinam dados à Wikimedia Foundation Inc.',
    details:
      'Fica vedada qualquer importação de bancos de usuários, listas globais de bloqueio ou registros de CheckUser oriundos da Wikimedia Foundation para o banco de dados do projeto.',
  },
  {
    code: 'WMF-01',
    section: 'wikimedia',
    title: 'Recusa da Wikimedia Foundation em Cumprir LGPD, GDPR e Marco Civil',
    classification: 'documentado',
    summary:
      'Não utilizamos dados nem infraestrutura da Wikimedia Foundation devido à recusa reiterada de submissão às garantias legais de proteção de dados.',
    details:
      'A Wikimedia Foundation Inc. (San Francisco, EUA) não possui representação jurídica nem Encarregado de Dados (DPO) no Brasil nos termos do Art. 41 da LGPD, invocando a Seção 230 e a Primeira Emenda dos EUA para rejeitar ordens extrajudiciais de retificação ou anonimização e expor pedidos de titulares ao "Efeito Streisand" em votações comunitárias públicas.',
  },
  {
    code: 'WMF-02',
    section: 'wikimedia',
    title: 'Bloqueio Técnico Preventivo de Faixas de IP e Contas WMF (AS14907)',
    classification: 'documentado',
    summary:
      'Conexões originadas nos blocos de rede da Wikimedia Foundation e identificadores de seus operadores são bloqueadas por diretriz de independência.',
    details:
      'Conforme implementado no fluxo de autenticação (LoginModal), a WikiWorldWeb bloqueia sessões oriundas do AS14907 e bloqueia a importação de credenciais de administradores e burocratas da WMF para resguardar a neutralidade editorial contra interferências externas e retaliações coordenadas.',
  },
  {
    code: 'WMF-03',
    section: 'wikimedia',
    title: 'Zero Espelhamento de Dumps, Logs Punitivos e Registros de CheckUser',
    classification: 'documentado',
    summary:
      'A WikiWorldWeb não importa dumps XML da Wikipédia nem replica históricos de bloqueios globais ou pedidos a verificadores.',
    details:
      'Espelhar bases da Wikipédia importaria etiquetas difamatórias, históricos unilaterais de reversões e registros de CheckUser usados em perseguições administrativas. Todo verbete da WikiWorldWeb nasce de autoria limpa ou curadoria independente.',
  },
  {
    code: 'WMF-04',
    section: 'wikimedia',
    title: 'Arquitetura Nativa Independente de Stewards e Panelas Burocráticas',
    classification: 'documentado',
    summary:
      'Nossa infraestrutura React + Cloud Firestore elimina a dependência do legado MediaWiki e de instâncias globais sem accountability local.',
    details:
      'Ao manter código-fonte próprio (GNU GPL v3.0) e base de dados autônoma, a WikiWorldWeb assegura que decisões editoriais e disciplinares respondam a regras claras, público direito ao contraditório e comitês revisores independentes.',
  },
  {
    code: 'CHR-01',
    section: 'chronus',
    title: 'Crimes contra a Honra: Calúnia, Difamação e Injúria (Arts. 138 a 140 CP)',
    classification: 'documentado',
    summary:
      'Documentação jurídica dos ataques reputacionais e imputações falsas atribuídas ao administrador Chronus contra Pedro Henrique Cardona Peres (WazzimaGiygg).',
    details:
      'Conforme auditado no dossiê "Calúnia por parte de Chronus V2" (47 páginas), o administrador e burocrata da Wikipédia Lusófona Chronus proferiu acusações infundadas de condutas ilícitas informáticas e fraude editorial sem lastro probatório, com ampla exposição pública e majorante de alcance na internet (Art. 141, §2º do Código Penal).',
  },
  {
    code: 'CHR-02',
    section: 'chronus',
    title: 'Perseguição Sistemática / Cyberstalking (Art. 147-A do Código Penal)',
    classification: 'documentado',
    summary:
      'Vigilância continuada do histórico de edições, reversões em lote e hostilização reiterada após divergências editoriais legítimas.',
    details:
      'O dossiê aponta acompanhamento hostil contínuo das contribuições do usuário, desfazimento sistemático de edições respaldadas por fontes acadêmicas e emprego de rótulos depreciativos para inviabilizar a permanência do pesquisador no ambiente colaborativo.',
  },
  {
    code: 'CHR-03',
    section: 'chronus',
    title: 'Instrumentalização de Ferramentas Administrativas e CheckUser',
    classification: 'documentado',
    summary:
      'Acúmulo simultâneo dos papéis de acusador, juiz e executor, com uso punitivo de ferramentas técnicas sem perícia ou transparência em log.',
    details:
      'Conflitos editoriais regulares foram enquadrados unilateralmente como "vandalismo" ou "sockpuppetry" sem prova técnica em log auditável, acompanhados de quebra de sigilo telemático e bloqueios abrangentes de faixas de rede (ASNs).',
  },
  {
    code: 'CHR-04',
    section: 'chronus',
    title: 'Supressão do Contraditório, Ratificação por Panela e Omissão da WMF',
    classification: 'documentado',
    summary:
      'Bloqueios infinitos em minutos, trancamento de página de discussão e ausência de instância imparcial de recurso (ArbCom).',
    details:
      'Além do bloqueio sumário e da censura a links externos de defesa, recursos apresentados enfrentaram ratificação corporativa por burocratas pares (como Teles, Érico e Little Sunshine), agravada pela inexistência de ArbCom ativo na Wikipédia Lusófona e pela omissão do WMF Trust & Safety.',
  },
  {
    code: 'CHR-05',
    section: 'chronus',
    title: 'Infrações Diretas ao Código Universal de Conduta (UCoC) da WMF',
    classification: 'documentado',
    summary:
      'Desrespeito frontal às Seções 3.1, 3.2, 3.3 e 4 do próprio Código Universal de Conduta da Wikimedia Foundation.',
    details:
      'As condutas documentadas violam os deveres de respeito mútuo (Seção 3.1), proibição de assédio e perseguição (Seção 3.2), vedação ao abuso de ferramentas administrativas para intimidação (Seção 3.3) e proteção contra retaliação a denunciantes (Seção 4).',
  },
];

export const FirebaseGovernanceEthicsView: React.FC<FirebaseGovernanceEthicsViewProps> = ({
  user,
  onNavigate,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<FirebaseGovernanceTabKey>(
    initialTab || 'firebase_ethics'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierDoc, setDossierDoc] = useState<DossierDocType>('chronus');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean | null>>({
    f1_least_privilege: null,
    f2_no_sensitive_pii: null,
    f3_quota_responsibility: null,
    f4_no_wmf_imports: null,
    f5_no_unilateral_abuse: null,
  });

  const filteredRules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return GOVERNANCE_RULES.filter(
      (rule) =>
        rule.code.toLowerCase().includes(q) ||
        rule.title.toLowerCase().includes(q) ||
        rule.summary.toLowerCase().includes(q) ||
        rule.details.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const openDossier = (doc: DossierDocType) => {
    setDossierDoc(doc);
    setIsDossierModalOpen(true);
  };

  const handleCopyShareUrl = () => {
    const url = `${window.location.origin}/?uid=Special:FirebaseEthics`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    });
  };

  const resetChecklist = () => {
    setChecklistAnswers({
      f1_least_privilege: null,
      f2_no_sensitive_pii: null,
      f3_quota_responsibility: null,
      f4_no_wmf_imports: null,
      f5_no_unilateral_abuse: null,
    });
  };

  const isChecklistComplete = Object.values(checklistAnswers).every((v) => v !== null);
  const isChecklistApproved =
    checklistAnswers.f1_least_privilege === true &&
    checklistAnswers.f2_no_sensitive_pii === true &&
    checklistAnswers.f3_quota_responsibility === true &&
    checklistAnswers.f4_no_wmf_imports === true &&
    checklistAnswers.f5_no_unilateral_abuse === true;

  const isAdminStaff =
    user &&
    ['admin', 'bureaucrat', 'arbcom', 'council'].includes((user.role || '').toLowerCase());

  const firebaseRules = GOVERNANCE_RULES.filter((r) => r.section === 'firebase');
  const firebaseTermsRules = GOVERNANCE_RULES.filter((r) => r.section === 'firebase_terms');
  const wmfRules = GOVERNANCE_RULES.filter((r) => r.section === 'wikimedia');
  const chronusRules = GOVERNANCE_RULES.filter((r) => r.section === 'chronus');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Cabeçalho Editorial Institucional */}
      <header className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Flame size={22} aria-hidden="true" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                  Special:FirebaseEthics
                </span>
                <span aria-hidden="true">·</span>
                <span>Governança Firebase &amp; Independência</span>
                <span aria-hidden="true">·</span>
                <span>LGPD, GDPR, Marco Civil &amp; Caso Chronus</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                Ética do Firebase, Independência da Wikimedia Foundation e Abusos do Administrador Chronus
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Marco normativo sobre o uso ético e seguro dos serviços Google Firebase na WikiWorldWeb, os fundamentos jurídicos e técnicos pelos quais não utilizamos dados da Wikimedia Foundation e o registro documental dos abusos atribuídos ao administrador Chronus.
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
              onClick={() => openDossier('chronus')}
              className="px-4 py-2 min-h-[40px] rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Scale size={14} />
              <span>Abrir Dossiê Chronus</span>
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
              placeholder="Filtrar regras (ex.: Firestore, LGPD, WMF, Chronus, UCoC)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Infraestrutura própria auditável, sem vínculo com bancos ou sanções da WMF.</span>
          </div>
        </div>
      </header>

      {/* Resultado de busca instantânea */}
      {searchQuery.trim().length > 0 && (
        <section
          aria-label="Resultados do filtro nas diretrizes Firebase e Governança"
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
              Nenhum item encontrado para o termo informado. Tente pesquisar &ldquo;Firestore&rdquo;, &ldquo;LGPD&rdquo;, &ldquo;Wikimedia&rdquo; ou &ldquo;Chronus&rdquo;.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRules.map((rule) => (
                <article key={rule.code} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400">
                      {rule.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{rule.title}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span
                      className={`font-medium ${
                        rule.classification === 'proibido'
                          ? 'text-rose-700 dark:text-rose-400'
                          : rule.classification === 'obrigatorio'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {rule.classification === 'proibido'
                        ? 'Conduta vedada'
                        : rule.classification === 'obrigatorio'
                          ? 'Obrigação normativa'
                          : 'Registro documental'}
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

      {/* Navegação por Abas */}
      <nav
        aria-label="Seções de Governança Firebase, Wikimedia e Caso Chronus"
        className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
      >
        <button
          type="button"
          onClick={() => setActiveTab('firebase_ethics')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'firebase_ethics'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database size={14} />
          <span>01. Ética de Uso do Firebase</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('firebase_terms')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'firebase_terms'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={14} />
          <span>02. Termos de Uso do Firebase</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('no_wikimedia')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'no_wikimedia'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ServerOff size={14} />
          <span>03. Não Uso de Dados da WMF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chronus_abuses')}
          className={`px-3.5 py-2 min-h-[40px] rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'chronus_abuses'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert size={14} />
          <span>04. Abusos de Chronus</span>
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
          <span>05. Autoverificação Firebase</span>
        </button>
      </nav>

      {/* ABA 1: ÉTICA DE USO DOS SERVIÇOS DO FIREBASE */}
      {activeTab === 'firebase_ethics' && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Diretrizes de Ética e Segurança para Uso do Google Firebase
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                A WikiWorldWeb utiliza o Cloud Firestore e serviços auxiliares do Firebase exclusivamente para persistência transparente do acervo enciclopédico, controle de acesso legítimo e atendimento aos direitos dos titulares de dados. O uso abusivo, opaco ou intrusivo da nuvem é incompatível com o projeto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                  <Lock size={17} aria-hidden="true" />
                  <h3>Segurança Baseada em Menor Privilégio</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Regras de acesso em Cloud Firestore isolam documentos públicos enciclopédicos de coleções restritas de moderação e solicitações LGPD. Nenhuma permissão administrativa é concedida sem validação explícita de função.
                </p>
              </article>

              <article className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <h3>Soberania do Titular (LGPD &amp; GDPR)</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Diferentemente de modelos que eternizam registros punitivos, todo usuário pode inspecionar, corrigir, exportar ou solicitar eliminação de dados pessoais via <span className="font-mono text-xs">Special:MyData</span> e <span className="font-mono text-xs">Special:DataRemovalRequests</span>.
                </p>
              </article>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-2">
              {firebaseRules.map((rule) => (
                <article key={rule.code} className="py-4 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400">
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
                      {rule.classification === 'proibido' ? 'Conduta proibida' : 'Requisito obrigatório'}
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

            {isAdminStaff && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Membros da administração podem auditar coleções, backups JSON e cotas diretamente no painel técnico.
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-firebase')}
                  className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Database size={14} />
                  <span>Acessar Special:AdminFirebase</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ABA 2: TERMOS DE USO DOS SERVIÇOS DO FIREBASE */}
      {activeTab === 'firebase_terms' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Termos de Uso dos Serviços do Firebase na WikiWorldWeb
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Condições contratuais, operacionais e legais aplicáveis a todos os usuários, editores e administradores que interagem com os serviços do Google Firebase (Cloud Firestore, Authentication e camada de dados em nuvem) vinculados a este Wiki-site.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {firebaseTermsRules.map((rule) => (
              <article key={rule.code} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400">
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
                    {rule.classification === 'proibido' ? 'Conduta proibida' : 'Cláusula vinculante'}
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

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Estes termos integram os Termos de Uso Gerais da plataforma (<span className="font-mono">Special:Terms</span>).
            </span>
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileText size={14} />
              <span>Abrir Termos de Uso Completos</span>
            </button>
          </div>
        </section>
      )}

      {/* ABA 2: POR QUE NÃO USAMOS DADOS DA WIKIMEDIA FOUNDATION */}
      {activeTab === 'no_wikimedia' && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Por que a WikiWorldWeb Não Utiliza Dados da Wikimedia Foundation
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                Esta enciclopédia mantém separação jurídica, técnica e editorial absoluta em relação à Wikimedia Foundation, Inc. (WMF) e à Wikipédia. Não sincronizamos bancos de usuários, não importamos dumps XML e bloqueamos conexões originadas na rede da fundação.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {wmfRules.map((rule) => (
                <article key={rule.code} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-bold tabular-nums text-rose-700 dark:text-rose-400">
                      {rule.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{rule.title}</h3>
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

            {/* Tabela Comparativa Direta */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      Critério de Soberania &amp; Dados
                    </th>
                    <th className="py-3 px-4 font-semibold text-emerald-800 dark:text-emerald-400">
                      WikiWorldWeb (Infraestrutura Própria)
                    </th>
                    <th className="py-3 px-4 font-semibold text-rose-800 dark:text-rose-400">
                      Wikimedia Foundation / Wikipédia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Submissão à LGPD &amp; Marco Civil
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      Cumprimento integral com DPO designado, exportação e remoção efetiva.
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      Alega imunidade jurisdicional dos EUA (Seção 230) e carece de DPO no Brasil.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Pedidos de Remoção ou Retificação
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      Análise privada em <span className="font-mono">Special:DataRemovalRequests</span> sem exposição pública.
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      Frequentemente expostos em votações públicas ("Efeito Streisand").
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Autenticação &amp; Redes WMF
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      Bloqueio ativo do bloco <span className="font-mono">AS14907</span> e de contas WMF no login.
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      Centralização global com histórico público perpétuo de bloqueios e IPs.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDossier('irregularidades')}
                  className="px-4 py-2 min-h-[40px] rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <FileText size={14} />
                  <span>Ler Dossiê: Irregularidades da Wikipédia e WMF</span>
                </button>
                <a
                  href="/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf"
                  download="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"
                  className="px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Download size={14} />
                  <span>Baixar PDF</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('security')}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Política de Segurança e LGPD</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ABA 3: CITAÇÃO DOS ABUSOS DO ADMINISTRADOR CHRONUS */}
      {activeTab === 'chronus_abuses' && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-rose-700 dark:text-rose-400">
                <span>ACCOUNTABILITY DOCUMENTAL</span>
                <span aria-hidden="true">·</span>
                <span>WIKIPÉDIA LUSÓFONA</span>
                <span aria-hidden="true">·</span>
                <span>ADMINISTRADOR &amp; BUROCRATA CHRONUS</span>
              </div>
              <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Registro dos Abusos Atribuídos ao Administrador Chronus
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                A consolidação da governança ética e independente da WikiWorldWeb decorre diretamente das violações documentadas nos dossiês <em>&ldquo;Calúnia por parte de Chronus V2&rdquo;</em> e <em>&ldquo;Wikimedia Institutional Accountability Dossier&rdquo;</em> envolvendo o administrador e burocrata Chronus na Wikipédia em língua portuguesa contra o pesquisador Pedro Henrique Cardona Peres (WazzimaGiygg).
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {chronusRules.map((rule) => (
                <article key={rule.code} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-bold tabular-nums text-rose-700 dark:text-rose-400">
                      {rule.code}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{rule.title}</h3>
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

            {/* Como a WikiWorldWeb previne abusos semelhantes */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gavel size={16} className="text-emerald-700 dark:text-emerald-400" />
                <span>Salvaguardas Estruturais da WikiWorldWeb contra o &ldquo;Modelo Chronus&rdquo;</span>
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <li>
                  <strong>Separação de Poderes:</strong> Quem acusa ou diverge editorialmente nunca julga nem executa o bloqueio em causa própria.
                </li>
                <li>
                  <strong>ArbCom &amp; Conselho Ativos:</strong> Recursos independentes permanentes em <span className="font-mono">Special:Arbitration</span> e <span className="font-mono">Special:AdminCouncil</span>.
                </li>
                <li>
                  <strong>Ampla Defesa Garantida:</strong> Nenhum usuário é impedido de contestar sanções via <span className="font-mono">Special:UnblockRequests</span>.
                </li>
                <li>
                  <strong>Sanção a Abuso de Ferramentas:</strong> Qualquer uso persecutório de CheckUser ou bloqueio de ASN é passível de denúncia em <span className="font-mono">Special:UCoC</span>.
                </li>
              </ul>
            </div>

            {/* Ações Diretas para Dossiês e PDFs */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => openDossier('chronus')}
                className="px-4 py-2 min-h-[40px] rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Scale size={14} />
                <span>Ler Dossiê Chronus V2 (Modal)</span>
              </button>

              <button
                type="button"
                onClick={() => openDossier('apresentacao')}
                className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Presentation size={14} />
                <span>Ver Apresentação Accountability (15 Slides)</span>
              </button>

              <a
                href="/Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf"
                download="Calúnia por parte de Chronus V2.pdf"
                className="px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Download size={14} />
                <span>PDF Chronus V2 (47 p.)</span>
              </a>

              <a
                href="/Wikimedia_Institutional_Accountability_Dossier.pdf"
                download="Wikimedia_Institutional_Accountability_Dossier.pdf"
                className="px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Download size={14} />
                <span>PDF Accountability Dossier</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ABA 4: AUTOVERIFICAÇÃO DE GOVERNANÇA FIREBASE */}
      {activeTab === 'checklist' && (
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Checklist de Conformidade Firebase &amp; Governança Independente
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Valide os cinco critérios abaixo antes de operar coleções no Cloud Firestore, importar fontes externas ou aplicar medidas administrativas.
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
                key: 'f1_least_privilege',
                label:
                  '1. A operação respeita o menor privilégio e as regras de acesso em firestore.rules (sem expor coleções internas)?',
              },
              {
                key: 'f2_no_sensitive_pii',
                label:
                  '2. Confirmei que nenhum dado pessoal sensível de terceiros, CPF, endereço ou dado de menor está sendo persistido sem base legal?',
              },
              {
                key: 'f3_quota_responsibility',
                label:
                  '3. A rotina evita loops de leitura/escrita e preserva a integridade das cotas e da trilha de auditoria do Firebase?',
              },
              {
                key: 'f4_no_wmf_imports',
                label:
                  '4. O conteúdo e os registros provêm de criação independente, sem importar dumps punitivos ou dados privados da Wikimedia Foundation?',
              },
              {
                key: 'f5_no_unilateral_abuse',
                label:
                  '5. Em decisões de moderação, foram respeitados o contraditório, a imparcialidade (não atuar como juiz em causa própria) e o UCoC?',
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
                    ? 'Operação em conformidade com a Ética Firebase e Soberania WikiWorldWeb.'
                    : 'Pendência normativa identificada antes da execução.'}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {isChecklistApproved
                  ? 'Os critérios de menor privilégio, minimização LGPD/GDPR, independência da Wikimedia Foundation e devido processo legal foram atendidos.'
                  : 'Revise os itens marcados como "Não": garanta que não haja importação de dados da WMF, exposição de dados privados, abuso de cotas do Firestore ou sanção unilateral sem contraditório.'}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Rodapé de Integração com Políticas Relacionadas */}
      <footer className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5 text-slate-600 dark:text-slate-400">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Globe size={15} className="text-amber-600 dark:text-amber-400" />
            <span>Governança e Recursos Institucionais</span>
          </div>
          <p>
            Conheça também as diretrizes de Ética de Edição, Ética de Uso da IA, UCoC e o Comitê de Arbitragem independente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Termos de Uso (Special:Terms)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('editing-ethics')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Ética de Edição (LGPD)
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
            onClick={() => onNavigate('real-names-lgpd')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Sem Nomes Reais &amp; LGPD
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ucoc')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Código de Conduta (UCoC)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('arbitration')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            Arbitragem (ArbCom)
          </button>
        </div>
      </footer>

      {/* Modal Integrado de Leitura dos Dossiês */}
      <IrregularidadesDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        initialDocument={dossierDoc}
      />
    </div>
  );
};
