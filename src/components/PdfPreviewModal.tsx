import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { WikiArticle } from '../types';
import {
  exportArticleToStructuredPdf,
  cleanWikitextForPdf,
  preprocessArticleWikitextForPdf,
  parseArticleIntoStructuredSections,
} from '../utils/pdfExport';
import { parseWikitext } from '../utils/wikitextParser';
import { WIKIWORLDWEB_STANDARD_LOGO_DATA_URL } from '../utils/pdfStandardLogoAsset';

interface PdfPreviewModalProps {
  article: WikiArticle;
  pageName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  article,
  pageName = 'WikiWorldWeb Enciclopédia',
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const expandedWikitext = useMemo(() => {
    return preprocessArticleWikitextForPdf(article.descricao || '', article.titulo);
  }, [article.descricao, article.titulo]);

  // Parse do wikitext para renderizar a estrutura exata do documento no preview
  const parseResult = useMemo(() => {
    return parseWikitext(expandedWikitext, undefined, article.titulo);
  }, [expandedWikitext, article.titulo]);

  const rawCleanText = useMemo(() => {
    return cleanWikitextForPdf(expandedWikitext);
  }, [expandedWikitext]);

  const wordsCount = useMemo(() => {
    return rawCleanText.trim() ? rawCleanText.trim().split(/\s+/).length : 0;
  }, [rawCleanText]);

  const readingTimeMin = useMemo(() => {
    return Math.max(1, Math.ceil(wordsCount / 200));
  }, [wordsCount]);

  // Seções estruturadas para o preview idêntico ao modelo de exportação PDF
  const structuredSections = useMemo(() => {
    const parsed = parseArticleIntoStructuredSections(expandedWikitext, article.titulo);
    return parsed.map((sec) => {
      let badgeColor = 'text-blue-700 dark:text-blue-300';
      let badgeBg = 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800';
      let categoryLabel = 'DESENVOLVIMENTO & DETALHAMENTO TEMÁTICO';

      if (sec.categoryGroup === 'intro') {
        badgeColor = 'text-emerald-700 dark:text-emerald-300';
        badgeBg = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
        categoryLabel = 'INTRODUÇÃO & CONCEITO GERAL';
      } else if (sec.categoryGroup === 'analysis') {
        badgeColor = 'text-cyan-700 dark:text-cyan-300';
        badgeBg = 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800';
        categoryLabel = 'ANÁLISE, TABELAS & FÓRMULAS';
      } else if (sec.categoryGroup === 'references') {
        badgeColor = 'text-purple-700 dark:text-purple-300';
        badgeBg = 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800';
        categoryLabel = 'FONTES & REFERÊNCIAS BIBLIOGRÁFICAS';
      }

      return {
        numberStr: sec.numberStr,
        title: sec.title,
        badge: sec.badge,
        badgeColor,
        badgeBg,
        categoryLabel,
        elements: sec.elements,
      };
    });
  }, [expandedWikitext, article.titulo]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await exportArticleToStructuredPdf(article, pageName, {
        pageSize: 'a4',
        orientation: 'portrait',
        includeHeader: true,
        includeMetadata: true,
        includeReferences: true,
        includeFooter: true,
        includeLicense: true,
      });

      setSuccessMessage('PDF vetorial com cabeçalho oficial gerado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao gerar PDF a partir da pré-visualização:', err);
      setErrorMessage('Falha ao exportar documento PDF. Verifique se o conteúdo é válido.');
    } finally {
      setIsDownloading(false);
    }
  };

  const nowFormatted = new Date().toLocaleString('pt-BR');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDownloading) onClose();
      }}
    >
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Barra Superior do Modal de Pré-visualização */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pré-visualização do Documento PDF
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  Cabeçalho Padronizado
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Visualização formatada com o cabeçalho executivo 3D, métricas e estrutura editorial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de Zoom */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(75, prev - 15))}
                disabled={zoom <= 75}
                className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                title="Reduzir Zoom"
              >
                <ZoomOut size={13} />
              </button>
              <span className="font-mono font-semibold px-1 text-[11px] text-slate-700 dark:text-slate-300">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(125, prev + 15))}
                disabled={zoom >= 125}
                className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                title="Aumentar Zoom"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Imprimir */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Imprimir documento diretamente"
            >
              <Printer size={13} />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            {/* Baixar PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Fechar janela"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notificações no topo */}
        {successMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Área de Visualização da Folha do Documento (Simulando a Folha A4 do PDF) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-200/70 dark:bg-slate-950/70">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-[760px] bg-white text-slate-900 rounded-xl shadow-xl border border-slate-300 p-7 sm:p-9 space-y-6 transition-all duration-150 font-sans"
          >
            {/* 1. HERO BANNER PADRONIZADO (COM O LOGO OFICIAL 3D) */}
            <div className="border border-slate-800 rounded-xl p-4 bg-white shadow-xs flex items-center gap-4">
              {/* Logotipo Oficial 3D da WikiWorldWeb */}
              <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-slate-900">
                <img
                  src={WIKIWORLDWEB_STANDARD_LOGO_DATA_URL}
                  alt="Logotipo Oficial WikiWorldWeb"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Informações Editoriais */}
              <div className="flex-1 min-w-0">
                <div className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 mb-1">
                  DOCUMENTO ENCICLOPÉDICO & ARTIGO PADRONIZADO
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight uppercase truncate">
                  RELATÓRIO DO ARTIGO: {article.titulo || 'ARTIGO SEM TÍTULO'}
                </h1>
                <p className="text-[11px] text-slate-600 truncate mt-0.5">
                  Classificado por Estrutura Editorial: Verbete Enciclopédico, Fontes & Histórico
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Gerado em: {nowFormatted} • Emissor: WikiWorldWeb • UID: ?uid={article.id} • Coleção: {pageName}
                </p>
              </div>
            </div>

            {/* 2. OS 4 CARDS DE KPIS PADRONIZADOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/70">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block">
                  TOTAL DE PALAVRAS
                </span>
                <span className="text-base font-mono font-bold text-slate-900 block">
                  {wordsCount.toLocaleString('pt-BR')}
                </span>
                <span className="text-[9px] text-slate-500">~{readingTimeMin} min de leitura</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100/70">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-800 block">
                  SEÇÕES & TÓPICOS
                </span>
                <span className="text-base font-mono font-bold text-slate-900 block">
                  {structuredSections.length}
                </span>
                <span className="text-[9px] text-slate-500">Índice enciclopédico</span>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 block">
                  FONTES & REFERÊNCIAS
                </span>
                <span className="text-base font-mono font-bold text-slate-900 block">
                  {(parseResult.references || []).length}
                </span>
                <span className="text-[9px] text-slate-500">Citações indexadas</span>
              </div>

              <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/70">
                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 block">
                  REVISÃO & ESTADO
                </span>
                <span className="text-base font-mono font-bold text-slate-900 block">
                  v{article.versao || '3.05'}
                </span>
                <span className="text-[9px] text-slate-500">Rascunho ativo</span>
              </div>
            </div>

            {/* 3. CABEÇALHO DA SEÇÃO DE CONTEÚDO */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                CONTEÚDO ENCICLOPÉDICO & ESTRUTURA DO VERBETE
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-600">
                [{structuredSections.length} SEÇÕES]
              </span>
            </div>

            {/* 4. SEÇÕES ESTRUTURADAS EM CARDS PADRONIZADOS */}
            <div className="space-y-4">
              {structuredSections.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  {/* Faixa de Categoria */}
                  <div className="px-3 py-1 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 tracking-wide">
                      CATEGORIA: {sec.categoryLabel}
                    </span>
                  </div>

                  {/* Card da Seção */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-[10px] text-slate-800">
                          {sec.numberStr}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] border ${sec.badgeBg} ${sec.badgeColor}`}>
                          {sec.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Seção Editorial • {sec.elements.length} itens
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900">
                      {sec.title}
                    </h2>

                    {sec.elements.map((el, elIdx) => {
                      if (el.type === 'paragraph') {
                        return (
                          <p key={elIdx} className="text-xs text-slate-700 leading-relaxed text-justify">
                            {el.text}
                          </p>
                        );
                      }
                      if (el.type === 'bullet') {
                        return (
                          <div key={elIdx} className="text-xs text-slate-700 leading-snug pl-3 flex items-start gap-1.5">
                            <span className="font-bold text-slate-500">{el.marker}</span>
                            <span className="flex-1 text-justify">{el.text}</span>
                          </div>
                        );
                      }
                      if (el.type === 'quote') {
                        return (
                          <blockquote key={elIdx} className="border-l-2 border-blue-500 bg-slate-50 px-3 py-1.5 text-xs italic text-slate-600 rounded-r text-justify">
                            {el.text}
                          </blockquote>
                        );
                      }
                      if (el.type === 'callout') {
                        return (
                          <div key={elIdx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                            <div className="font-bold text-slate-800">{el.label}</div>
                            <div className="text-slate-600 mt-0.5 text-justify">{el.text}</div>
                          </div>
                        );
                      }
                      if (el.type === 'code') {
                        return (
                          <pre key={elIdx} className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto">
                            {el.text}
                          </pre>
                        );
                      }
                      if (el.type === 'infobox') {
                        return (
                          <div key={elIdx} className="border border-indigo-200 rounded-lg overflow-hidden text-[11px]">
                            <div className="bg-indigo-700 text-white font-bold px-3 py-1.5 text-center">
                              {el.data.title}
                            </div>
                            <div className="divide-y divide-slate-200">
                              {el.data.rows.map((r, rIdx) =>
                                r.isSection ? (
                                  <div key={rIdx} className="bg-indigo-50 px-3 py-1 font-bold text-indigo-900 text-center">
                                    {r.label}
                                  </div>
                                ) : (
                                  <div key={rIdx} className="grid grid-cols-3 px-3 py-1 gap-2">
                                    <span className="font-semibold text-slate-700">{r.label}</span>
                                    <span className="col-span-2 text-slate-600">{r.value}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      }
                      if (el.type === 'table') {
                        return (
                          <div key={elIdx} className="overflow-x-auto border border-slate-200 rounded-lg">
                            {el.data.caption && (
                              <div className="bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-800 text-center border-b border-slate-200">
                                {el.data.caption}
                              </div>
                            )}
                            <table className="w-full text-[11px] border-collapse">
                              {el.data.headers.length > 0 && (
                                <thead className="bg-slate-100">
                                  <tr>
                                    {el.data.headers.map((h, hIdx) => (
                                      <th key={hIdx} className="border border-slate-200 px-2 py-1 text-left font-bold text-slate-800">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody>
                                {el.data.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="border border-slate-200 px-2 py-1 text-slate-700">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 5. CITAÇÕES & REFERÊNCIAS */}
            {parseResult.references && parseResult.references.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="px-3 py-1 rounded border border-purple-200 bg-purple-50 text-[10px] font-bold text-purple-800">
                  CATEGORIA: REFERÊNCIAS, FONTES & NOTAS BIBLIOGRÁFICAS
                </div>

                <div className="space-y-1.5">
                  {parseResult.references.map((ref, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-start gap-2 text-slate-700"
                    >
                      <span className="font-mono font-bold text-purple-700 px-1 rounded bg-purple-50 shrink-0 text-[10px]">
                        [{rIdx + 1}]
                      </span>
                      <span className="text-[11px] leading-snug">{cleanWikitextForPdf(ref)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. CAIXA DE GOVERNANÇA, CÓDIGO ABERTO & AUDITORIA TÉCNICA */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1 text-slate-700 text-[11px]">
              <div className="font-bold text-slate-900 text-xs mb-1">
                Governança, Código Aberto & Rastreabilidade Técnica
              </div>
              <div>• Repositório público versionado sob a licença pública GPLv3 • https://github.com/WazzimaGiygg/Wiki-alternative</div>
              <div>• Rastreabilidade total de commits, integridade criptográfica SHA-1 e autoria auditável de código.</div>
              <div>• Em conformidade com o Marco Civil da Internet (Lei 12.965/2014) e governança de dados da LGPD (Lei 13.709/2018).</div>
              <div>• Licença Editorial: Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0).</div>
              <div>• Identificador Canônico Permanente (UID): ?uid={article.id} • Coleção: {pageName}.</div>
            </div>

            {/* 7. RODAPÉ DE PÁGINA (PADRÃO ROSE-600) */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px]">
              <span className="text-rose-600 font-medium">
                WikiWorldWeb • Documento Enciclopédico Oficial • Relatório Gerado Automaticamente
              </span>
              <span className="font-mono font-bold text-slate-600">
                Página 1 de 1 (Pré-visualização)
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal com Botões de Ação */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            ?uid={article.id} • Formato: A4 Retrato
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Baixar Documento PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
