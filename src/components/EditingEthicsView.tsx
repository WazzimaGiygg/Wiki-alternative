import React, { useState, useMemo } from 'react';
import {
  Scale,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Lock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Eye,
  EyeOff,
  UserX,
  ExternalLink,
  Copy,
  Check,
  Search,
  ArrowRight,
  Gavel,
  LifeBuoy,
  HeartHandshake,
  AlertOctagon,
  Sparkles,
  Award,
  ChevronRight,
  FileWarning,
  Flame,
} from 'lucide-react';
import { UserProfile } from '../types';
import { formatExternalUrl } from '../utils/linkUtils';

interface EditingEthicsViewProps {
  user: UserProfile | null;
  onNavigate: (view: any) => void;
  onOpenEditor: () => void;
}

type TabKey = 'principles' | 'lgpd' | 'gdpr' | 'bpv' | 'enforcement' | 'checklist';

export const EditingEthicsView: React.FC<EditingEthicsViewProps> = ({
  user,
  onNavigate,
  onOpenEditor,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('principles');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Interactive Checklist State
  const [checklistAnswers, setChecklistAnswers] = useState<{ [key: string]: boolean | null }>({
    q1_source: null,
    q2_neutrality: null,
    q3_living_person: null,
    q4_private_data: null,
    q5_minors: null,
    q6_copyright: null,
  });

  const handleCopyShareUrl = () => {
    const url = `${window.location.origin}/?uid=Special:EditingEthics`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    });
  };

  const resetChecklist = () => {
    setChecklistAnswers({
      q1_source: null,
      q2_neutrality: null,
      q3_living_person: null,
      q4_private_data: null,
      q5_minors: null,
      q6_copyright: null,
    });
  };

  // Checklist score calculation
  const isChecklistComplete = Object.values(checklistAnswers).every((v) => v !== null);
  const isChecklistApproved =
    checklistAnswers.q1_source === true &&
    checklistAnswers.q2_neutrality === true &&
    checklistAnswers.q3_living_person === true &&
    checklistAnswers.q4_private_data === false && // Must NOT contain private data
    checklistAnswers.q5_minors === false && // Must NOT expose minors
    checklistAnswers.q6_copyright === true;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in select-none pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0 ring-4 ring-blue-50 dark:ring-blue-950/40">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Special:EditingEthics
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  LGPD & GDPR Compliant
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  Marco Civil da Internet
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Regras de Ética de Edição, Adição e Contribuição
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Diretrizes normativas fundamentadas na <strong>LGPD (Lei nº 13.709/2018 - Brasil)</strong>, no{' '}
                <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e no{' '}
                <strong>Regulamento Geral sobre a Proteção de Dados da União Europeia (GDPR - Regulamento UE 2016/679)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleCopyShareUrl}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/70 transition flex items-center gap-1.5 cursor-pointer"
              title="Copiar link permanente desta política"
            >
              {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedUrl ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>

            <button
              onClick={onOpenEditor}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Criar / Editar Artigo</span>
            </button>
          </div>
        </div>

        {/* Search Bar in Policies */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em regras, artigos da lei ou condutas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Válido para todos os colaboradores (anônimos, registrados e administradores).</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('principles')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'principles'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen size={14} />
          <span>1. Princípios de Contribuição</span>
        </button>

        <button
          onClick={() => setActiveTab('lgpd')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'lgpd'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck size={14} />
          <span>2. Conformidade LGPD (Brasil)</span>
        </button>

        <button
          onClick={() => setActiveTab('gdpr')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'gdpr'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock size={14} />
          <span>3. Leis Européias (GDPR)</span>
        </button>

        <button
          onClick={() => setActiveTab('bpv')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'bpv'
              ? 'bg-purple-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck size={14} />
          <span>4. Biografias de Pessoas Vivas</span>
        </button>

        <button
          onClick={() => setActiveTab('enforcement')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'enforcement'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Gavel size={14} />
          <span>5. Sanções & Moderação</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award size={14} />
          <span>6. Checklist do Editor</span>
        </button>
      </div>

      {/* TAB 1: PRINCÍPIOS FUNDAMENTAIS DE CONTRIBUIÇÃO */}
      {activeTab === 'principles' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                1. Pilares Éticos da Contribuição Enciclopédica
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A <strong>WikiWorldWeb (WazzimaGiygg)</strong> é uma enciclopédia pública colaborativa regida pelo princípio da busca desinteressada pelo conhecimento verdadeiro. Todos os usuários que submetem edições, criam novos verbetes ou participam de páginas de discussão assumem o compromisso ético de obedecer aos pilares descritos a seguir:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>Princípio da Boa-Fé Editorial</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Presume-se que os colaboradores agem com o intuito de aprimorar a enciclopédia. Discordâncias de conteúdo devem ser resolvidas com civilidade, argumentos racionais fundamentados em fontes e sem ataques ad hominem ou sarcasmo.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Scale size={16} />
                  <span>Ponto de Vista Neutro (NPOV)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Os artigos devem representar todas as visões significativas publicadas por fontes confiáveis, de forma proporcional e sem tomar partido. É estritamente vedada a utilização da enciclopédia como palanque ideológico ou ferramenta de propaganda.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <FileText size={16} />
                  <span>Verificabilidade e Fontes Confiáveis</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Qualquer afirmação controversa, biográfica ou técnica deve ser respaldada por fontes secundárias reputadas e independentes (livros acadêmicos, periódicos científicos e veículos de imprensa com conselho editorial reconhecido). É proibida a <em>pesquisa inédita</em>.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                  <AlertTriangle size={16} />
                  <span>Conflito de Interesses & Edição Paga</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Editar páginas sobre si mesmo, sua empresa, clientes ou adversários comerciais/políticos exige declaração formal de conflito de interesse. Edições promocionais veladas ou pagas não declaradas resultam em bloqueio sumário.
                </p>
              </div>
            </div>

            {/* Copyright & Open Licensing */}
            <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2 mt-2">
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 font-serif-heading">
                <HeartHandshake size={15} /> Licenciamento Livre e Direitos Autorais
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Ao publicar na WikiWorldWeb, você concorda irrevogavelmente em licenciar o seu trabalho sob a licença{' '}
                <strong>Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)</strong> e{' '}
                <strong>GNU General Public License v3.0 (GPLv3)</strong>. É estritamente proibido copiar textos protegidos por direitos autorais sem permissão explícita ou fora dos limites do direito de citação legal (Lei de Direitos Autorais nº 9.610/1998, Art. 46).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONFORMIDADE COM A LGPD (BRASIL) */}
      {activeTab === 'lgpd' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                2. Diretrizes Mandatórias sob a LGPD (Lei nº 13.709/2018)
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A Lei Geral de Proteção de Dados Pessoais (LGPD) protege os direitos fundamentais de liberdade, privacidade e o livre desenvolvimento da personalidade da pessoa natural. Todo colaborador que adiciona informações sobre cidadãos ou figuras públicas na enciclopédia está sujeito às seguintes obrigações intransponíveis:
            </p>

            <div className="space-y-3">
              {/* Art. 5: Proibição de Doxxing */}
              <div className="p-4 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                    <UserX size={16} />
                    <span>TOLERÂNCIA ZERO PARA DOXXING (Exposição de Dados Privados)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                    INFRAÇÃO GRAVÍSSIMA
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  É terminantemente proibido publicar dados pessoais identificáveis de qualquer indivíduo que não possuam relação direta e imprescindível com a sua notoriedade enciclopédica, incluindo:
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-0.5 font-mono">
                  <li>Números de documentos (CPF, RG, CNH, Passaporte, Título de Eleitor);</li>
                  <li>Endereços residenciais, condomínios ou rotas de deslocamento diário;</li>
                  <li>Telefones pessoais, números de WhatsApp ou e-mails privados;</li>
                  <li>Dados bancários, faturas, certidões de nascimento ou processos judiciais em segredo de justiça;</li>
                  <li>Placas de veículos, fotos de familiares sem notoriedade pública ou imagens íntimas.</li>
                </ul>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold pt-1">
                  A inserção de doxxing acarreta reversão imediata com expurgo de histórico (Oversight), bloqueio permanente da conta e encaminhamento de logs ao DPO e autoridades policiais conforme o Marco Civil da Internet (Art. 15).
                </p>
              </div>

              {/* Art. 11: Dados Pessoais Sensíveis */}
              <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <AlertTriangle size={16} />
                    <span>Art. 11 da LGPD: Tratamento de Dados Pessoais Sensíveis</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    RIGOR MÁXIMO
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Informações sobre <strong>origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico</strong> só podem constar na WikiWorldWeb se cumprirem cumulativamente:
                </p>
                <ol className="list-decimal pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <li>Serem objeto de <strong>declaração pública manifesta feita pelo próprio titular</strong> ou amplamente divulgadas em fontes oficiais primárias de interesse histórico comprovado;</li>
                  <li>Possuírem relevância direta para a biografia pública da personalidade retratada;</li>
                  <li>Não terem o propósito de discriminar, ultrajar ou expor desnecessariamente a intimidade pessoal do biografado.</li>
                </ol>
              </div>

              {/* Art. 14: Menores */}
              <div className="p-4 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                  <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Art. 14 da LGPD: Proteção Integral a Crianças e Adolescentes</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  O tratamento de dados de menores de 18 anos deve ser realizado com a máxima cautela e sempre no seu melhor interesse (Art. 14 da LGPD e Estatuto da Criança e do Adolescente - ECA). Filhos e parentes menores de figuras públicas não devem ser nominados ou ter suas fotos publicadas na WikiWorldWeb, a não ser que a criança ou adolescente possua notoriedade enciclopédica independente estabelecida por mérito próprio.
                </p>
              </div>

              {/* Art. 18: Direitos do Titular & Supressão de Histórico */}
              <div className="p-4 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Art. 18 da LGPD: Exercício dos Direitos do Titular e Supressão Editorial</span>
                  </div>
                  <button
                    onClick={() => onNavigate('mydata')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Abrir Painel do Titular</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Qualquer indivíduo retratado na enciclopédia tem o direito de requerer correção de dados incompletos ou inexatos, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD.
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-emerald-200 dark:border-emerald-800/80">
                  <strong>Canal Direto do Encarregado pelo Tratamento de Dados (DPO):</strong>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <code>pedrohenriquecardonaperes@gmail.com</code>
                    <span>•</span>
                    <a
                      href={formatExternalUrl("https://support.wazzimagiygg.com/")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Central de Tickets WazzimaGiygg</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEIS EUROPÉIAS DE PRIVACIDADE (GDPR) */}
      {activeTab === 'gdpr' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Lock size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                3. Padrões Europeus de Privacidade: GDPR (Regulamento UE 2016/679)
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              O Regulamento Geral sobre a Proteção de Dados da União Europeia (GDPR) impõe salvaguardas avançadas para o processamento de dados de cidadãos europeus. As contribuições à WikiWorldWeb devem observar os seguintes princípios consolidados:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Art 5(1)(c): Minimização */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <Shield size={16} />
                  <span>Art. 5(1)(c): Princípio da Minimização de Dados</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Os dados biográficos devem ser adequados, pertinentes e limitados ao que é estritamente necessário em relação às finalidades enciclopédicas (<em>"data minimisation"</em>). Detalhes supérfluos sobre a vida cotidiana, familiares ou hábitos privados de uma pessoa não devem ser adicionados.
                </p>
              </div>

              {/* Art 5(1)(d): Exatidão e Veracidade */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>Art. 5(1)(d): Princípio da Exatidão (Accuracy)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Todos os dados devem ser exatos e atualizados. Informações imprecisas ou comprovadamente falsas sobre qualquer indivíduo devem ser retificadas ou excluídas sem demora injustificada. Contribuições baseadas em boatos de redes sociais são passíveis de reversão imediata.
                </p>
              </div>

              {/* Art 17: Direito ao Esquecimento */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                  <EyeOff size={16} />
                  <span>Art. 17: Direito ao Apagamento / "Direito ao Esquecimento"</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O titular tem o direito de obter a eliminação dos seus dados quando estes deixarem de ser necessários ou quando não existir interesse público legítimo predominante. Processos criminais com absolvição transitada em julgado ou incidentes menores passados que não impactam a carreira pública não devem ser eternizados como estigma.
                </p>
              </div>

              {/* Art 85: Equilíbrio com a Liberdade de Expressão */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <Scale size={16} />
                  <span>Art. 85: Ponderação com Liberdade de Expressão e Informação</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O GDPR reconcilia a proteção de dados com a liberdade de expressão para fins jornalísticos, acadêmicos e artísticos. Figuras com histórico político, governamental ou histórico notório estão sujeitas a escrutínio público razoável, desde que respeitados os limites da dignidade humana.
                </p>
              </div>
            </div>

            {/* Directive ePrivacy & Storage */}
            <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-bold text-indigo-900 dark:text-indigo-200">
                Diretiva de Privacidade Eletrônica (ePrivacy Directive):
              </div>
              <p>
                A WikiWorldWeb não utiliza cookies invasivos de rastreamento publicitário de terceiros. As preferências locais de interface e sessão são preservadas sob estrita conformidade com as diretivas da União Europeia.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BIOGRAFIAS DE PESSOAS VIVAS (BPV) */}
      {activeTab === 'bpv' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <UserCheck size={18} className="text-purple-600 dark:text-purple-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                4. Política de Biografias de Pessoas Vivas (BPV)
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Artigos sobre indivíduos vivos exigem um grau reforçado de responsabilidade moral e jurídica. Informações negativas, controversas ou danosas à honra pessoal podem causar danos irreversíveis à vida real das pessoas e responsabilização civil aos infratores.
            </p>

            <div className="p-4 rounded-lg bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
              <h3 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider font-mono">
                Mandamentos Invioláveis para Biografias de Pessoas Vivas:
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <strong>Ônus da Prova e Remoção Imediata:</strong> O ônus da comprovação recai inteiramente sobre quem adiciona o conteúdo. Qualquer material controverso sem fonte confiável ou com fontes fracas sobre pessoas vivas deve ser <em>removido imediatamente</em> sem aguardar discussão.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <strong>Presunção de Inocência e Denúncias em Andamento:</strong> Não relate suspeitas ou investigações policiais como se fossem condenações consumadas. Noticiar processos em andamento exige citar expressamente a posição da defesa e o estado processual verificado em fontes primárias ou grande imprensa.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <strong>Pessoas de Notoriedade Acidental ou Temporária:</strong> Cidadãos comuns que se tornaram conhecidos exclusivamente por estarem envolvidos em um acidente, crime ou meme passageiro não devem ter verbetes biográficos individuais completos, devendo o fato ser descrito no contexto do evento.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    4
                  </div>
                  <div>
                    <strong>Críticas com Proporcionalidade:</strong> O espaço dedicado a polêmicas não pode desfigurar o verbete de modo a transformá-lo em peça acusatória. A crítica deve ser contextualizada e proporcional às realizações do biografado.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SANÇÕES, MODERAÇÃO & OVERSIGHT */}
      {activeTab === 'enforcement' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Gavel size={18} className="text-rose-600 dark:text-rose-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                5. Tipificação de Infrações, Consequências e Oversight
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A WikiWorldWeb adota mecanismos de resposta graduada e rigorosa moderação para proteger a enciclopédia e resguardar os direitos dos cidadãos:
            </p>

            <div className="space-y-3">
              {/* Níveis de infração */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Infração Leve</span>
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      NÍVEL 1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Erros de formatação, falta não intencional de fontes ou edições opinativas pontuais.
                  </p>
                  <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 pt-1">
                    Consequência: Reversão com aviso pedagógico na página de discussão.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Infração Grave</span>
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      NÍVEL 2
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Guerra de edições persistente, vandalismo recorrente, violação de direitos autorais ou assédio editorial.
                  </p>
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 pt-1">
                    Consequência: Bloqueio temporário (24h a 30 dias) e proteção de página.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200">Infração Gravíssima</span>
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-rose-600 text-white">
                      NÍVEL 3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Doxxing, exposição de dados de menores, difamação criminosa, ameaças de morte ou exploração ilícita de dados.
                  </p>
                  <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 pt-1">
                    Consequência: Bloqueio perpétuo, Supressão (Oversight) e denúncia criminal.
                  </p>
                </div>
              </div>

              {/* Oversight explanation */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <EyeOff size={16} className="text-rose-600" />
                  <span>Protocolo de Supressão e Expurgamento (Oversight)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ao contrário da reversão comum, a ferramenta de <strong>Supressão (Oversight)</strong> remove a versão permanentemente da visualização pública e dos registros de histórico comuns, impedindo que dados violadores de privacidade continuem acessíveis a leitores. O Oversight é acionado compulsoriamente em casos de vazamento de dados pessoais ou infrações à LGPD/GDPR.
                </p>
              </div>

              {/* Navigation links to Dispute / Emergency */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => onNavigate('emergency-contact')}
                  className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertOctagon size={13} className="text-red-600 animate-pulse" />
                  <span>Plantão de Emergência (Doxxing / Risco Iminente)</span>
                </button>

                <button
                  onClick={() => onNavigate('ucoc')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert size={13} className="text-indigo-600" />
                  <span>Canal de Denúncias Formais (UCoC)</span>
                </button>

                <button
                  onClick={() => onNavigate('arbitration')}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Gavel size={13} className="text-purple-600" />
                  <span>Conselho de Arbitragem (ArbCom)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CHECKLIST INTERATIVO DO EDITOR ÉTICO */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-600 dark:text-amber-400" />
                <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                  6. Checklist Interativo de Conformidade Editorial
                </h2>
              </div>
              <button
                onClick={resetChecklist}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reiniciar Checklist
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Antes de gravar ou publicar qualquer artigo, responda às 6 perguntas rápidas abaixo para verificar se a sua contribuição cumpre os padrões da LGPD, GDPR e integridade enciclopédica:
            </p>

            <div className="space-y-3">
              {/* Q1 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    1. Esta edição está embasada em fontes confiáveis e verificáveis (livros, jornais ou periódicos acadêmicos)?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q1_source: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q1_source === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q1_source: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q1_source === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q1_source === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Artigos sem fontes verificáveis violam a política de Verificabilidade e serão removidos.
                  </p>
                )}
              </div>

              {/* Q2 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    2. O texto foi escrito em tom estritamente neutro, sem juízos de valor nem linguagem promocional?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q2_neutrality: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q2_neutrality === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q2_neutrality: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q2_neutrality === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q2_neutrality === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Textos com viés parcial, promocional ou agressivo violam o Princípio da Neutralidade (NPOV).
                  </p>
                )}
              </div>

              {/* Q3 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    3. Se o texto menciona uma pessoa viva, as afirmações polêmicas possuem citações diretas a fontes de alto padrão?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q3_living_person: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q3_living_person === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim / Não se aplica
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q3_living_person: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q3_living_person === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q3_living_person === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Biografias de pessoas vivas (BPV) exigem rigor absoluto para evitar calúnia e difamação.
                  </p>
                )}
              </div>

              {/* Q4 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    4. O texto contém dados pessoais privados (CPF, endereço residencial, telefone pessoal ou processos sob segredo)?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q4_private_data: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q4_private_data === true
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q4_private_data: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q4_private_data === false
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q4_private_data === true && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                    🛑 ATENÇÃO: A publicação de dados privados é ilegal conforme a LGPD e resultará em bloqueio imediato e supressão de versão.
                  </p>
                )}
              </div>

              {/* Q5 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    5. O artigo expõe nomes ou imagens de crianças e adolescentes (menores de 18 anos) sem notoriedade própria?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q5_minors: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q5_minors === true
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q5_minors: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q5_minors === false
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q5_minors === true && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                    🛑 ATENÇÃO: É proibido expor menores conforme o Art. 14 da LGPD e o ECA. Remova a identificação do menor antes de salvar.
                  </p>
                )}
              </div>

              {/* Q6 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    6. O texto é de sua própria autoria ou foi reescrito com suas próprias palavras sem cópia não autorizada?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q6_copyright: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q6_copyright === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q6_copyright: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q6_copyright === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q6_copyright === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Textos copiados violam direitos autorais e licenças livres e serão apagados sumariamente.
                  </p>
                )}
              </div>
            </div>

            {/* Checklist Evaluation Verdict */}
            {isChecklistComplete && (
              <div
                className={`p-4 rounded-xl border transition animate-in fade-in ${
                  isChecklistApproved
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  {isChecklistApproved ? (
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-rose-600 shrink-0" />
                  )}
                  <h3 className="font-bold text-sm">
                    {isChecklistApproved
                      ? 'Parabéns! Sua edição atende aos padrões de ética e privacidade.'
                      : 'Atenção: A sua contribuição viola uma ou mais regras de privacidade ou integridade.'}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed">
                  {isChecklistApproved
                    ? 'Você está pronto para publicar com segurança na WikiWorldWeb em perfeita conformidade com a LGPD e o GDPR.'
                    : 'Por favor, revise o seu rascunho, remova dados sensíveis ou privados e certifique-se de que todas as alegações possuem fontes idôneas antes de submeter.'}
                </p>
                {isChecklistApproved && (
                  <div className="mt-3">
                    <button
                      onClick={onOpenEditor}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Ir para o Editor de Artigos</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Callout for Support and DPO */}
      <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <LifeBuoy size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="text-slate-700 dark:text-slate-300">
            Dúvidas sobre conformidade ou solicitações de titulares de dados? Entre em contato com o DPO:{' '}
            <code className="text-slate-900 dark:text-white font-bold">pedrohenriquecardonaperes@gmail.com</code>
          </div>
        </div>
        <a
          href={formatExternalUrl("https://support.wazzimagiygg.com/")}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shrink-0 flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer"
        >
          <span>Central de Tickets & Suporte</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
