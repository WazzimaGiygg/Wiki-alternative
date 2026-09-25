import React, { useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Lock,
  EyeOff,
  AlertTriangle,
  Building2,
  Share2,
  BookOpen,
  Sparkles,
  Gavel,
  UserX,
  Ban,
  Radio,
  FileCheck2,
} from 'lucide-react';

export type DossierDocType = 'irregularidades' | 'chronus';

interface IrregularidadesDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'text' | 'pdf' | 'table';
  initialDocument?: DossierDocType;
}

export const IrregularidadesDossierModal: React.FC<IrregularidadesDossierModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'text',
  initialDocument = 'irregularidades',
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DossierDocType>(initialDocument);
  const [activeTab, setActiveTab] = useState<'text' | 'pdf' | 'table'>(initialTab);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const isChronus = selectedDoc === 'chronus';

  const pdfUrl = isChronus
    ? '/Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf'
    : '/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf';

  const pdfDownloadName = isChronus
    ? 'Calúnia por parte de Chronus V2.pdf'
    : 'Irregularidades da Wikipédia e Wikimedia Foundation.pdf';

  const handleCopyCitation = () => {
    const citation = isChronus
      ? 'PERES, Pedro Henrique Cardona. Dossiê Técnico-Jurídico: Calúnia por parte de Chronus V2 — Violações ao Código Penal (Arts. 138 a 140, 147-A), Marco Civil da Internet, LGPD e UCOC Wikimedia. WikiWorldWeb Enciclopédia, 2026. Disponível em: <' +
        window.location.origin +
        pdfUrl +
        '>.'
      : 'PERES, Pedro Henrique Cardona. Dossiê Técnico-Jurídico: Irregularidades da Wikipédia e Wikimedia Foundation — Violações Sistemáticas à LGPD (Lei 13.709/2018), ao GDPR (Reg. UE 2016/679) e ao Marco Civil da Internet (Lei 12.965/2014). WikiWorldWeb Enciclopédia, 2026. Disponível em: <' +
        window.location.origin +
        pdfUrl +
        '>.';
    navigator.clipboard.writeText(citation).then(() => {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2500);
    });
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${pdfUrl}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden font-sans">
        {/* Document Switcher Tab Bar */}
        <div className="bg-slate-100 dark:bg-slate-950 px-4 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedDoc('irregularidades')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 border-t-2 ${
              selectedDoc === 'irregularidades'
                ? 'bg-white dark:bg-[#0f172a] text-blue-700 dark:text-blue-400 border-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200/60 dark:hover:bg-slate-900'
            }`}
          >
            <ShieldAlert size={14} className={selectedDoc === 'irregularidades' ? 'text-blue-600' : ''} />
            <span>Dossiê 1: Irregularidades Wikipédia (LGPD & Marco Civil)</span>
          </button>

          <button
            onClick={() => setSelectedDoc('chronus')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 border-t-2 ${
              selectedDoc === 'chronus'
                ? 'bg-white dark:bg-[#0f172a] text-rose-700 dark:text-rose-400 border-rose-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200/60 dark:hover:bg-slate-900'
            }`}
          >
            <Scale size={14} className={selectedDoc === 'chronus' ? 'text-rose-600' : ''} />
            <span className="flex items-center gap-1.5">
              <span>Dossiê 2: Calúnia por parte de Chronus V2</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                47 Págs
              </span>
            </span>
          </button>
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shadow-md shrink-0 ring-4 ${
                isChronus
                  ? 'bg-gradient-to-tr from-rose-700 via-red-600 to-amber-600 ring-rose-50 dark:ring-rose-950/40'
                  : 'bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-600 ring-blue-50 dark:ring-blue-950/40'
              }`}
            >
              {isChronus ? <Scale size={22} /> : <FileText size={22} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {isChronus ? 'Dossiê 47 Páginas (V2)' : 'PDF Oficial'}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  {isChronus ? 'Código Penal Arts. 138-140 & 147-A' : 'LGPD & Marco Civil'}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {isChronus ? 'UCOC Wikimedia Violado' : 'GDPR Compliant'}
                </span>
                {isChronus && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    DSA (UE 2022/2065)
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white leading-tight">
                {isChronus
                  ? 'Calúnia por parte de Chronus V2 — Dossiê Jurídico & Documental'
                  : 'Irregularidades da Wikipédia e Wikimedia Foundation'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isChronus
                  ? 'Análise Técnico-Jurídica de Violações: Crimes Contra a Honra, Stalking, Moderação Abusiva e Violação ao UCOC'
                  : 'Dossiê Documental sobre Violações da LGPD (Lei 13.709/18), GDPR (Reg. UE 2016/679) e Marco Civil da Internet (Lei 12.965/14)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <a
              href={pdfUrl}
              download={pdfDownloadName}
              className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isChronus ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Baixar arquivo PDF completo"
            >
              <Download size={14} />
              <span>Baixar PDF</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action & Tab Navigation Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen size={13} />
              <span>Leitura Integral</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Scale size={13} />
              <span>Quadro Comparativo</span>
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText size={13} />
              <span>Visualizador PDF Original</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCitation}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Copiar referência em formato ABNT"
            >
              {copiedCitation ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedCitation ? 'Citação Copiada' : 'Citar ABNT'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Copiar link direto para o PDF"
            >
              {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Share2 size={12} />}
              <span>{copiedLink ? 'Link Copiado' : 'Compartilhar'}</span>
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1"
              title="Abrir PDF em nova aba para impressão"
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">Abrir em Nova Aba</span>
            </a>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {/* ============================================================== */}
          {/* TAB 1: TEXT READING MODE (CHRONUS OR IRREGULARIDADES) */}
          {/* ============================================================== */}
          {activeTab === 'text' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {isChronus ? (
                /* CHRONUS V2 DOSSIER TEXT */
                <>
                  {/* Ficha Técnica Card */}
                  <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 dark:text-rose-200 uppercase font-mono text-[11px] flex items-center gap-1.5">
                        <Scale size={14} className="text-rose-600" />
                        <span>Ficha Técnica do Dossiê Calúnia por parte de Chronus V2</span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 font-semibold bg-rose-100 dark:bg-rose-900/80 px-2 py-0.5 rounded">
                        47 Páginas Analisadas
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>
                        <strong>Arquivo:</strong> <code>Calúnia por parte de Chronus V2.pdf</code>
                      </div>
                      <div>
                        <strong>Titular Ofendido:</strong> Pedro Henrique Cardona Peres (WazzimaGiygg)
                      </div>
                      <div>
                        <strong>Agente Representado:</strong> Usuário Chronus (Administrador / Burocrata na Wikipédia)
                      </div>
                      <div>
                        <strong>Entidade Solidária:</strong> Wikimedia Foundation Inc. (São Francisco, CA, EUA)
                      </div>
                      <div>
                        <strong>Legislação Penal:</strong> Arts. 138 (Calúnia), 139 (Difamação), 140 (Injúria), 147-A (Stalking)
                      </div>
                      <div>
                        <strong>Normas Digitais:</strong> Marco Civil (12.965/14), LGPD (13.709/18), UCOC WMF, DSA UE 2022/2065
                      </div>
                    </div>
                  </div>

                  {/* 1. Sumário Executivo */}
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <Gavel size={16} className="text-rose-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        1. Sumário Executivo do Caso Chronus / Wikipédia
                      </h3>
                    </div>
                    <p>
                      O documento documental de 47 páginas, intitulado <strong>"Calúnia por parte de Chronus V2"</strong>,
                      consolida provas irrefutáveis e fundamentação jurídica detalhada sobre os atos ilícitos perpetrados
                      pelo administrador <strong>Chronus</strong> no âmbito da Wikipédia Lusófona.
                    </p>
                    <p>
                      As ações do referido moderador transcendem a esfera do debate editorial enciclopédico e adentram a seara
                      do cometimento sistemático de crimes contra a honra, perseguição cibernética contínua (stalking), assédio moral,
                      violação frontal de normas cogentes brasileiras (Código Penal, Código Civil, LGPD e Marco Civil da Internet) e
                      descumprimento ostensivo do Código Universal de Conduta (UCOC) da própria Wikimedia Foundation.
                    </p>
                  </section>

                  {/* 2. Crimes Contra a Honra */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <ShieldAlert size={16} className="text-rose-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        2. Crimes Contra a Honra no Código Penal (Arts. 138, 139, 140 e 141, III)
                      </h3>
                    </div>

                    <div className="p-4 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                      <h4 className="font-bold text-rose-900 dark:text-rose-200 text-xs flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        <span>2.1. Calúnia Consumada (Art. 138 do Código Penal)</span>
                      </h4>
                      <p>
                        O administrador Chronus imputou falsamente ao titular Pedro Henrique Cardona Peres a prática de condutas
                        definidas em lei como crimes, incluindo <strong>fraude documental</strong>, <strong>invasão de dispositivo informático</strong>,
                        <strong> falsidade ideológica</strong> e <strong>adulteração ilícita de sistemas de dados</strong>.
                      </p>
                      <p>
                        Tais afirmações difamatórias foram expressas publicamente em sumários de reversão, discussões comunitárias e
                        pedidos de bloqueio administrativo, sem qualquer esteio probatório, laudo de perícia informática idônea ou ordem judicial.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <Building2 size={14} className="text-blue-600" />
                        <span>2.2. Difamação, Injúria e Causa de Aumento de Pena (Arts. 139, 140 e 141, III)</span>
                      </h4>
                      <p>
                        As ofensas veiculadas pelo administrador atacaram deliberadamente a honorabilidade, a credibilidade profissional e
                        a produção intelectual do autor. Por terem sido propagadas através da internet em um portal de alcance global indexado
                        instantaneamente pelos mecanismos do Google, incide a causa de aumento de pena do <strong>Art. 141, inciso III, do Código Penal</strong>
                        (crime cometido por meio que facilita a divulgação).
                      </p>
                    </div>
                  </section>

                  {/* 3. Perseguição Cibernética e Stalking */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <UserX size={16} className="text-amber-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        3. Perseguição Cibernética / Stalking (Art. 147-A do Código Penal)
                      </h3>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
                      <p>
                        A Lei nº 14.132/2021 estabelece que constitui crime "perseguir alguém, reiteradamente e por qualquer meio, ameaçando-lhe
                        a integridade física ou psicológica, restringindo-lhe a capacidade de locomoção ou, de qualquer forma, invadindo ou
                        perturbando sua esfera de liberdade ou privacidade".
                      </p>
                      <p>
                        O dossiê de 47 páginas descreve a conduta reiterada e obsessiva de vigilância empreendida por Chronus contra cada
                        movimentação do usuário, monitorando edições em segundos, organizando votações em massa contra conteúdos referenciados
                        e coagindo outros editores voluntários a não interagir ou colaborar com o titular.
                      </p>
                    </div>
                  </section>

                  {/* 4. Violações ao UCOC da Wikimedia */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <Ban size={16} className="text-rose-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        4. Violações ao Código Universal de Conduta da Wikimedia (UCOC)
                      </h3>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                          <strong>Seção 3.1 (Respeito Mútuo):</strong> Desrespeito à dignidade humana, emprego de adjetivos desqualificadores
                          e humilhação pública nas páginas de discussão comunitária.
                        </li>
                        <li>
                          <strong>Seção 3.2 (Abuso de Poder e Autoridade):</strong> Emprego abusivo das ferramentas técnicas de administrador
                          (bloqueio de páginas, bloqueio de contas e reversão rápida com 1 clique) para subjugar discordâncias editoriais e interesses pessoais.
                        </li>
                        <li>
                          <strong>Seção 3.3 (Assédio / Harassment):</strong> Perseguição sistemática, doxxing com exposição de metadados de conexão
                          e intimidação psicológica orquestrada.
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* 5. Erros Metodológicos e CheckUser Infundado */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <Radio size={16} className="text-indigo-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        5. Erros Metodológicos: CheckUser Infundado e Efeito Streisand
                      </h3>
                    </div>
                    <div className="p-4 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                      <p>
                        <strong>Acusações Falsas de Contas Fantoche (Sockpuppets):</strong> Chronus e moderadores afins rotularam qualquer
                        nova colaboração com estilo dissertativo formal como sendo um "fantoche ilícito", sem realizar correlação idônea de logs.
                      </p>
                      <p>
                        <strong>Bloqueio de Faixas Inteiras de Provedores Nacionais (Geo-blocking):</strong> Ao aplicar bloqueios cegos contra
                        provedores brasileiros como Claro, Vivo e TIM, milhares de cidadãos inocentes tiveram seu direito de consulta e edição
                        prejudicado coletivamente.
                      </p>
                      <p>
                        <strong>Destruição do Contraditório (CF Art. 5º, LV):</strong> A administração trancou preventivamente a página de discussão
                        do usuário e desativou a opção de envio de mensagens por e-mail, silenciando por completo a possibilidade de ampla defesa.
                      </p>
                    </div>
                  </section>

                  {/* 6. Salvaguardas WikiWorldWeb */}
                  <section className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-emerald-50 to-indigo-50 dark:from-rose-950/30 dark:via-emerald-950/30 dark:to-indigo-950/30 border border-emerald-300 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Sparkles size={16} className="text-emerald-600" />
                      <span>6. Como a WikiWorldWeb Supera e Impede esses Abusos</span>
                    </div>
                    <p>
                      A arquitetura da <strong>WikiWorldWeb</strong> foi construída especificamente para extirpar a tirania de moderadores e a impunidade:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ Presunção de Boa-Fé & Inocência</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          É vedada a imputação de crimes sem trânsito em julgado e sem perícia técnica transparente.
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ Contraditório e Ampla Defesa</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          Nenhum usuário tem seus canais de recurso ou comunicação revogados unilateralmente.
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ Proteção de IPs contra Stalking</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          IPs e metadados de conexão são criptografados sob sigilo absoluto (Marco Civil Arts. 10/15).
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ Auditoria de Moderação e DPO</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          Comitê de Auditoria e Encarregado formal para intervenção imediata contra abusos funcionais.
                        </span>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                /* IRREGULARIDADES DA WIKIPEDIA ORIGINAL DOSSIER TEXT */
                <>
                  {/* Document Overview Metadata Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[11px]">
                        Ficha Técnica do Documento
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        Documento Público e Auditado
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>
                        <strong>Arquivo:</strong> <code>Irregularidades da Wikipédia e Wikimedia Foundation.pdf</code>
                      </div>
                      <div>
                        <strong>Encarregado (DPO):</strong> Pedro Henrique Cardona Peres
                      </div>
                      <div>
                        <strong>Leis Auditadas:</strong> LGPD (13.709/18), Marco Civil (12.965/14), GDPR (UE 2016/679)
                      </div>
                      <div>
                        <strong>Entidade Investigada:</strong> Wikimedia Foundation Inc. (São Francisco, CA, EUA)
                      </div>
                    </div>
                  </div>

                  {/* 1. Sumário Executivo */}
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <Scale size={16} className="text-blue-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        1. Sumário Executivo do Dossiê
                      </h3>
                    </div>
                    <p>
                      O presente dossiê documental consolida as investigações e a análise jurídica sobre a conduta da{' '}
                      <strong>Wikimedia Foundation Inc. (WMF)</strong>, mantenedora da <strong>Wikipédia</strong>, perante a legislação brasileira e europeia de proteção de dados e direitos fundamentais no ambiente digital.
                    </p>
                    <p>
                      A Wikipédia adota uma prática sistemática de recusa à adequação às regras da <strong>LGPD (Lei nº 13.709/2018)</strong>, do <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e do <strong>GDPR europeu (Regulamento UE 2016/679)</strong>. Sob a justificativa de "abertura comunitária" e "extraterritorialidade de seus servidores nos Estados Unidos", a entidade impõe barreiras intransponíveis para que cidadãos e colaboradores exerçam seus direitos básicos de privacidade, retificação e dignidade.
                    </p>
                  </section>

                  {/* 2. Violações ao Marco Civil da Internet */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <ShieldAlert size={16} className="text-rose-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        2. Violações ao Marco Civil da Internet (Lei nº 12.965/2014)
                      </h3>
                    </div>

                    <div className="p-4 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                      <h4 className="font-bold text-rose-900 dark:text-rose-200 text-xs flex items-center gap-1.5">
                        <EyeOff size={14} />
                        <span>2.1. Exposição Pública Arbitrária de Endereços IP (Art. 10 e Art. 15)</span>
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300">
                        Na Wikipédia, qualquer internauta que colabora sem conta logada tem o seu <strong>endereço IP (IPv4 ou IPv6) gravado de forma permanente e pública</strong> no histórico de edições da enciclopédia, indexado por robôs de busca.
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        O Marco Civil da Internet (Lei nº 12.965/2014) determina, em seus Artigos 10 e 15, que os registros de conexão e de acesso a aplicações de internet <strong>devem ser mantidos sob estrito sigilo</strong>, em ambiente seguro e controlado, sendo vedada sua disponibilização a terceiros sem prévia autorização judicial motivada.
                      </p>
                      <p className="text-rose-700 dark:text-rose-300 font-semibold">
                        A prática da Wikimedia expõe o colaborador a riscos de geolocalização física (cidade, bairro, provedor), perseguição cibernética e doxxing, sem que haja consentimento livre e informado.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <Building2 size={14} className="text-blue-600" />
                        <span>2.2. Descumprimento da Jurisdição Brasileira (Art. 11)</span>
                      </h4>
                      <p>
                        O Art. 11 da Lei nº 12.965/2014 estabelece expressamente a aplicação obrigatória da lei brasileira sempre que qualquer ato de coleta, guarda ou tratamento de dados ocorra em território nacional, independentemente de a sede da pessoa jurídica estar no exterior.
                      </p>
                      <p>
                        A Wikimedia Foundation recusa rotineiramente notificações extrajudiciais e decisões emitidas por magistrados e juizados brasileiros, alegando imunidade com base na Seção 230 do <em>Communications Decency Act</em> dos EUA e demandando a expedição de cartas rogatórias internacionais, obstruindo a efetividade da Justiça brasileira.
                      </p>
                    </div>
                  </section>

                  {/* 3. Violações à LGPD */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <Lock size={16} className="text-emerald-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        3. Violações à Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)
                      </h3>
                    </div>

                    <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                        3.1. Inobservância dos Princípios Fundamentais (Art. 6º da LGPD)
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                        <li>
                          <strong>Princípio da Necessidade e Minimização (Art. 6º, III):</strong> A Wikipédia armazena dados e históricos sem qualquer mecanismo de expurgo automático de dados biográficos dispensáveis.
                        </li>
                        <li>
                          <strong>Princípio da Segurança e Prevenção (Art. 6º, VII e VIII):</strong> Inexistência de ferramentas para que editores anônimos protejam seus identificadores de conexão.
                        </li>
                        <li>
                          <strong>Princípio da Não Discriminação (Art. 6º, IX):</strong> Permissão de edição abusiva de biografias com fins de linchamento moral sem direito de resposta célere.
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
                      <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <span>3.2. Violação aos Direitos do Titular e o Perverso "Efeito Streisand" (Art. 18)</span>
                      </h4>
                      <p>
                        O Art. 18 da LGPD confere ao titular o direito inalienável de requerer a retificação, anonimização, bloqueio ou eliminação de seus dados.
                      </p>
                      <p>
                        Na Wikipédia, cidadãos que solicitam a retificação de biografias errôneas ou a exclusão de dados desnecessários são submetidos a <strong>votações comunitárias abertas (Páginas para Eliminar / PE)</strong>. Moderadores voluntários debatem a vida íntima do requerente de forma pública, gerando o <strong>Efeito Streisand</strong>: a vítima sofre um dano multiplicado, pois o debate da eliminação fica eternizado nas buscas do Google.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        3.3. Violações em Relação a Dados de Menores e Dados Sensíveis (Arts. 11 e 14)
                      </h4>
                      <p>
                        A Wikipédia publica reiteradamente nomes de crianças e adolescentes (filhos de personalidades públicas) sem autorização específica dos responsáveis e sem atentar ao melhor interesse do menor (Art. 14 da LGPD e Estatuto da Criança e do Adolescente).
                      </p>
                    </div>
                  </section>

                  {/* 4. Violações ao GDPR */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <Lock size={16} className="text-indigo-600" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                        4. Violações ao GDPR (Regulamento UE 2016/679)
                      </h3>
                    </div>

                    <div className="p-4 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                      <p>
                        <strong>Art. 17 (Direito ao Esquecimento):</strong> A Wikimedia Foundation recusa o direito ao apagamento de cidadãos europeus que foram absolvidos em julgamentos penais ou cujo interesse público cessou, alegando que o registro da enciclopédia é "patrimônio histórico inalterável".
                      </p>
                      <p>
                        <strong>Art. 25 (Privacy by Design):</strong> O código-fonte do MediaWiki não foi adaptado para respeitar a privacidade como configuração padrão.
                      </p>
                      <p>
                        <strong>Arts. 44 a 49 (Transferência Internacional):</strong> Dados de cidadãos são transferidos aos EUA sem observância dos parâmetros estritos exigidos pelo Tribunal de Justiça da UE (Caso Schrems II).
                      </p>
                    </div>
                  </section>

                  {/* 5. Soluções e Conformidade WikiWorldWeb */}
                  <section className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-emerald-50 to-indigo-50 dark:from-blue-950/30 dark:via-emerald-950/30 dark:to-indigo-950/30 border border-emerald-300 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Sparkles size={16} className="text-emerald-600" />
                      <span>5. Como a WikiWorldWeb Supera essas Violações</span>
                    </div>
                    <p>
                      A <strong>WikiWorldWeb (WazzimaGiygg)</strong> foi projetada sobre o pilar da conformidade normativa rigorosa:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ Proteção de Endereços IP</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          Nenhum IP é exposto publicamente no histórico de edições (Art. 10/15 Marco Civil).
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ DPO Oficial & Canal Direto</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          Encarregado formalmente nomeado para atendimento rápido sem exposição comunitária.
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ Painel "Meus Dados"</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          O titular retifica nome, remove fotos ou solicita exclusão total em 1 clique (Art. 18 LGPD).
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 block text-xs">✓ Supressão Oversight</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          Expurgo permanente de dados ilícitos direto do banco de dados Firebase Firestore.
                        </span>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: COMPARATIVE TABLE */}
          {/* ============================================================== */}
          {activeTab === 'table' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div
                className={`p-3.5 rounded-lg border text-xs ${
                  isChronus
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                }`}
              >
                <strong>Quadro Sinóptico Comparativo:</strong>{' '}
                {isChronus
                  ? 'Contraste direto entre a conduta criminosa e arbitrária de Chronus / Wikipédia e as diretrizes éticas e legais estritas da WikiWorldWeb.'
                  : 'Demonstração direta do abismo normativo entre a conduta infratora da Wikimedia Foundation e a conformidade plena da WikiWorldWeb.'}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 font-bold">Diretriz / Norma Legal</th>
                      <th className="p-3 font-bold text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30">
                        {isChronus ? 'Caso Chronus / Wikipédia Lusófona' : 'Wikipédia (Wikimedia Foundation)'}
                      </th>
                      <th className="p-3 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                        WikiWorldWeb (WazzimaGiygg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    {isChronus ? (
                      <>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Imputação de Crimes sem Provas (Art. 138 CP - Calúnia)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Atribuição de crimes informáticos e falsidade ideológica em discussões públicas abertas.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Presunção de inocência obrigatória; proibição absoluta de acusações criminais sem sentença.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Perseguição e Stalking (Art. 147-A CP & UCOC 3.3)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Monitoramento em tempo real de contribuições e reversões em bloco de produção autoral idônea.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Vedação estrita de perseguição de usuários; ferramentas com auditoria neutra e logs imutáveis.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Contraditório e Ampla Defesa (Art. 5º, LV CF & DSA)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Trancamento de páginas de discussão e bloqueio de e-mail do titular, eliminando qualquer defesa.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Canal permanente de defesa e contestação técnica assegurado por regulamento interno.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Uso de CheckUser e Dados Telemáticos
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Verificações manipuladas com falsas correlações em faixas de operadoras brasileiras inteiras.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Auditoria técnica pericial estrita com proteção de privacidade e sem conclusões presumidas.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Exposição Pública de IPs (Marco Civil Art. 10 e 15)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Divulgação deliberada de provedores e IPs de usuários para gerar intimidação e doxxing.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Sigilo incondicional de dados de conexão, criptografia de ponta a ponta e compliance judicial.
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Exposição de Endereço IP (Marco Civil Art. 10 e 15)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Expõe o IP completo de colaboradores não autenticados no histórico público perpétuo.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            IPs sob sigilo absoluto, criptografados e inacessíveis ao público conforme a lei.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Submissão à Jurisdição Brasileira e ANPD (Art. 3º LGPD)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Recusa. Alega extraterritorialidade e exige cartas rogatórias internacionais.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Total submissão às leis brasileiras, aos tribunais pátrios e às normas da ANPD.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Encarregado de Proteção de Dados - DPO (Art. 41 LGPD)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Inexistente para atendimento específico da comunidade e titularidade brasileira.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            DPO formalmente instituído com canal oficial: <code>pedrohenriquecardonaperes@gmail.com</code>.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Exercício dos Direitos do Titular (Art. 18 LGPD)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Votações comunitárias vexatórias ("Páginas para Eliminar") que causam Efeito Streisand.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Painel "Meus Dados" e canal de tickets seguro com atendimento ágil e confidencial.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            Direito ao Esquecimento / Apagamento (Art. 17 GDPR)
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                            Recusa formal; defende que o histórico da enciclopédia deve prevalecer absolutamente.
                          </td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
                            Protocolo de Supressão (Oversight) que expurga dados violadores definitivamente.
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: EMBEDDED PDF VIEWER */}
          {/* ============================================================== */}
          {activeTab === 'pdf' && (
            <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col">
              <div className="p-2.5 bg-slate-200 dark:bg-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold truncate max-w-md">
                  {pdfDownloadName}
                </span>
                <a
                  href={pdfUrl}
                  download={pdfDownloadName}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 text-[11px] shrink-0"
                >
                  <Download size={12} />
                  <span>Baixar Arquivo</span>
                </a>
              </div>
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="w-full flex-1 border-0"
                title={`Visualizador PDF ${pdfDownloadName}`}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>
              {isChronus
                ? 'Dossiê instrutório para medidas judiciais, cíveis, criminais e representação perante a WMF e ANPD.'
                : 'Documento emitido para instrução de cidadãos, acadêmicos e autoridades competentes (ANPD / MPF).'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={pdfUrl}
              download={pdfDownloadName}
              className={`px-4 py-1.5 rounded-lg text-white font-bold transition flex items-center gap-1.5 shadow-xs ${
                isChronus ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Download size={14} />
              <span>Baixar {pdfDownloadName}</span>
            </a>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
