import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Lock,
  PlusCircle,
  FileCode,
  Eye,
  Info,
} from 'lucide-react';
import { GoogleDocsService, ImportedGoogleDocResult } from '../services/googleDocsService';
import { parseWikitext } from '../utils/wikitextParser';

interface GoogleDocsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: ImportedGoogleDocResult, insertMode: 'replace' | 'append' | 'new_article') => void;
  context?: 'editor' | 'notebook' | 'general';
}

export const GoogleDocsImportModal: React.FC<GoogleDocsImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  context = 'editor',
}) => {
  const [docUrlOrId, setDocUrlOrId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedDoc, setImportedDoc] = useState<ImportedGoogleDocResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'wikitext'>('preview');
  const [customTitle, setCustomTitle] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsConnected(GoogleDocsService.hasCachedToken());
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await GoogleDocsService.requestGoogleDocsAccess();
      setIsConnected(true);
    } catch (err: any) {
      console.error('Erro ao autenticar com Google Docs:', err);
      setError(err?.message || 'Falha ao conectar com o Google Docs. Tente novamente.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFetchDoc = async () => {
    if (!docUrlOrId.trim()) {
      setError('Por favor, informe a URL ou ID do seu Google Doc.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportedDoc(null);

    try {
      // If token missing, trigger auth popup first
      if (!GoogleDocsService.hasCachedToken()) {
        await GoogleDocsService.requestGoogleDocsAccess();
        setIsConnected(true);
      }

      const result = await GoogleDocsService.importGoogleDoc(docUrlOrId);
      setImportedDoc(result);
      setCustomTitle(result.title);
    } catch (err: any) {
      console.error('Erro ao importar Google Doc:', err);
      if (err?.message === 'AUTH_REQUIRED' || err?.message === 'AUTH_EXPIRED') {
        setIsConnected(false);
        setError('Sessão do Google expirada ou não autorizada. Clique em "Conectar com Google Docs" para renovar o acesso.');
      } else {
        setError(
          err?.message ||
            'Não foi possível ler o documento. Certifique-se de que o link está correto e sua Conta Google possui permissão de leitura.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    // Demo document representation for testing without private doc ID
    const sampleResult: ImportedGoogleDocResult = {
      documentId: 'demo-sample-doc-wikiworldweb-2026',
      title: 'História e Evolução das Enciclopédias Digitais',
      wikitext: `= História e Evolução das Enciclopédias Digitais =

== Resumo Executivo ==
As enciclopédias digitais representam uma das maiores transformações no acesso ao conhecimento humano coletivo. Desde as primeiras edições em CD-ROM até os sistemas colaborativos modernos em tempo real na '''WikiWorldWeb''', a democratização do saber segue em constante avanço.

== Marcos Históricos ==
* '''1993''': Lançamento da Microsoft Encarta em CD-ROM multimídia.
* '''2001''': Fundação da Wikipédia, introduzindo a edição aberta em wikitexto.
* '''2026''': Criação da '''WikiWorldWeb''', integrando inteligência artificial Gemini, sem anúncios, sem burocracia editorial e com suporte direto a documentos do Google Docs.

== Comparativo Técnico ==
{| class="wikitable"
! Plataforma !! Anúncios !! Suporte Google Docs !! Assistente de IA
|-
| '''WikiWorldWeb''' || Zero Anúncios || Sim (Nativo) || Gemini Integrado
|-
| Wikipédia || Sem Anúncios || Não || Não Oficial
|-
| Fandom || Altamente Poluído || Não || Não
|}

== Considerações Finais ==
A integração entre processadores de texto na nuvem e repositórios enciclopédicos livres permite que pesquisadores, professores e estudantes redijam seus textos no Google Docs e publiquem seus verbetes instantaneamente com preservação de estrutura e formatação.

== Fontes e Metadados ==
* ''Documento de exemplo demonstrativo importado via integração oficial Google Docs na WikiWorldWeb.''`,
      plainText: `História e Evolução das Enciclopédias Digitais\n\nResumo Executivo\nAs enciclopédias digitais representam uma das maiores transformações no acesso ao conhecimento humano coletivo...\nMarcos Históricos\n1993: Microsoft Encarta\n2001: Wikipédia\n2026: WikiWorldWeb com Google Docs e Gemini.`,
      wordCount: 178,
      charCount: 1420,
      hasTables: true,
      paragraphsCount: 9,
      importedAt: new Date().toISOString(),
    };

    setImportedDoc(sampleResult);
    setCustomTitle(sampleResult.title);
    setDocUrlOrId('https://docs.google.com/document/d/1SampleDemoEnciclopediaDigitalWikiWorldWeb/edit');
    setError(null);
  };

  const handleCopyWikitext = () => {
    if (!importedDoc) return;
    navigator.clipboard.writeText(importedDoc.wikitext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = (mode: 'replace' | 'append' | 'new_article') => {
    if (!importedDoc) return;
    const finalDoc = {
      ...importedDoc,
      title: customTitle.trim() || importedDoc.title,
    };
    onImport(finalDoc, mode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-sans tracking-tight">Importar do Google Docs</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  WikiWorldWeb
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Converta documentos do Google Docs em artigos enciclopédicos em wikitexto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* OAuth Auth Status Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isConnected
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                }`}
              >
                {isConnected ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {isConnected ? 'Conta Google Conectada (documents.readonly)' : 'Conectar com sua Conta Google'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isConnected
                    ? 'Acesso seguro em memória pronto para ler seus documentos Google Docs.'
                    : 'Permite que a WikiWorldWeb leia com segurança o texto do documento informado.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 shadow-xs ${
                isConnected
                  ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : isConnected ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Alternar Conta</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Conectar Google Docs</span>
                </>
              )}
            </button>
          </div>

          {/* URL/ID Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Link ou ID do Google Doc</span>
                <span className="text-[10px] text-slate-400 font-normal">(Ex: https://docs.google.com/document/d/...)</span>
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Carregar Exemplo de Demonstração</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={docUrlOrId}
                onChange={(e) => setDocUrlOrId(e.target.value)}
                placeholder="Cole aqui o link do seu documento do Google Docs..."
                className="flex-1 px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
              <button
                onClick={handleFetchDoc}
                disabled={isLoading || isConnecting}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition flex items-center gap-2 shadow-xs shrink-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Lendo Doc...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Importar Texto</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              <span>Dica: Certifique-se de que sua conta tem acesso ao documento ou que o link possui permissão de leitura.</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Erro ao importar</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Imported Document Preview & Confirmation */}
          {importedDoc && (
            <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Título do Artigo Wiki
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full mt-0.5 px-3 py-1.5 text-sm font-semibold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Badges / Stats */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      {importedDoc.wordCount} palavras
                    </span>
                    <span className="text-[11px] font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                      {importedDoc.paragraphsCount} seções/parágrafos
                    </span>
                    {importedDoc.hasTables && (
                      <span className="text-[11px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        Tabelas convertidas
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-b-2 -mb-px ${
                        activeTab === 'preview'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pré-visualização do Verbete</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('wikitext')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-b-2 -mb-px ${
                        activeTab === 'wikitext'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Wikitexto Gerado</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCopyWikitext}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 py-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="max-h-60 overflow-y-auto rounded-lg bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-700 text-xs">
                  {activeTab === 'preview' ? (
                    <div
                      className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{ __html: parseWikitext(importedDoc.wikitext) }}
                    />
                  ) : (
                    <pre className="font-mono text-[11px] whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-normal">
                      {importedDoc.wikitext}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancelar
          </button>

          {importedDoc ? (
            <div className="flex items-center gap-2 flex-wrap">
              {context === 'editor' && (
                <>
                  <button
                    onClick={() => handleApply('append')}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    Anexar ao Artigo Atual
                  </button>
                  <button
                    onClick={() => handleApply('replace')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Substituir Conteúdo Atual</span>
                  </button>
                </>
              )}

              <button
                onClick={() => handleApply('new_article')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Criar Novo Artigo na Wiki</span>
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cole o link do Google Docs acima e clique em &quot;Importar Texto&quot;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
