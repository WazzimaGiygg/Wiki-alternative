import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FolderDown,
  FolderUp,
  Shield,
  Database,
  Layers,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  FileCheck,
  Info,
  Flame,
  ArrowRight,
  HardDrive,
  FileText,
} from 'lucide-react';
import { UserProfile } from '../types';
import { firebaseBackupDispatchService } from '../services/firebaseBackupDispatchService';
import { ACTIVE_FIREBASE_CONFIG } from '../config/firebaseCustomConfig';

interface FirebaseJsonDispatchManagerProps {
  currentUser: UserProfile | null;
  onDataRestored?: () => void;
}

export const FirebaseJsonDispatchManager: React.FC<FirebaseJsonDispatchManagerProps> = ({
  currentUser,
  onDataRestored,
}) => {
  // Loading states
  const [loadingAllExport, setLoadingAllExport] = useState(false);
  const [loadingAllImport, setLoadingAllImport] = useState(false);
  const [loadingRulesExport, setLoadingRulesExport] = useState(false);
  const [loadingRulesImport, setLoadingRulesImport] = useState(false);
  const [loadingCollectionsExport, setLoadingCollectionsExport] = useState(false);
  const [loadingCollectionsImport, setLoadingCollectionsImport] = useState(false);

  // Status and feedback
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    details?: any;
  } | null>(null);

  // JSON Preview state
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Paste JSON modal/drawer state
  const [pasteModalMode, setPasteModalMode] = useState<'all' | 'rules' | 'collections' | null>(null);
  const [pastedJsonText, setPastedJsonText] = useState('');

  // Hidden File Inputs
  const fileInputAllRef = useRef<HTMLInputElement>(null);
  const fileInputRulesRef = useRef<HTMLInputElement>(null);
  const fileInputCollectionsRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // 3.05.9.a: Despacho e Download de TODAS as informações em JSON
  // -------------------------------------------------------------------------
  const handleExportAll = async () => {
    setLoadingAllExport(true);
    setProgressMsg('Consolidando todas as páginas, verbetes, coleções, regras e dados locais...');
    setFeedback(null);

    try {
      const result = await firebaseBackupDispatchService.exportAllSystemInformationJSON(currentUser);
      setFeedback({
        type: 'success',
        title: 'Despacho Completo Concluído com Sucesso!',
        message: `Arquivo "${result.filename}" gerado e baixado no computador.`,
        details: result.summary,
      });
      setPreviewTitle('Manifesto do Despacho Completo (3.05.9.a)');
      setPreviewContent(JSON.stringify(result.payload, null, 2));
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Falha no Despacho Completo',
        message: err?.message || 'Erro ao gerar o backup completo de todas as informações.',
      });
    } finally {
      setLoadingAllExport(false);
      setProgressMsg(null);
    }
  };

  // -------------------------------------------------------------------------
  // 3.05.9.b: Upload de TODAS as informações em JSON do computador
  // -------------------------------------------------------------------------
  const handleImportAllFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Deseja restaurar e despachar todas as informações contidas no arquivo "${file.name}" para o Wiki-Site?`)) {
      e.target.value = '';
      return;
    }

    setLoadingAllImport(true);
    setFeedback(null);
    setProgressMsg('Lendo arquivo JSON do computador...');

    try {
      const text = await file.text();
      const res = await firebaseBackupDispatchService.importAllSystemInformationJSON(text, (msg) => {
        setProgressMsg(msg);
      });

      setFeedback({
        type: 'success',
        title: 'Informações Restauradas com Sucesso!',
        message: res.message,
        details: res.stats,
      });

      if (onDataRestored) {
        onDataRestored();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Erro no Upload do Backup Completo',
        message: err?.message || 'Arquivo JSON incompatível ou corrompido.',
      });
    } finally {
      setLoadingAllImport(false);
      setProgressMsg(null);
      e.target.value = '';
    }
  };

  // -------------------------------------------------------------------------
  // 3.05.9.c: Download de todas as regras do Firebase em JSON
  // -------------------------------------------------------------------------
  const handleExportRules = async () => {
    setLoadingRulesExport(true);
    setProgressMsg('Extraindo regras ativas firestore.rules do Firebase...');
    setFeedback(null);

    try {
      const result = await firebaseBackupDispatchService.downloadFirebaseRulesJSON();
      setFeedback({
        type: 'success',
        title: 'Regras do Firebase Exportadas!',
        message: `Arquivo "${result.filename}" (${result.payload.rulesLinesCount} linhas) baixado com sucesso no formato JSON.`,
        details: {
          arquivo: result.filename,
          linhas: result.payload.rulesLinesCount,
          projeto: result.payload.projectId,
          banco: result.payload.firestoreDatabaseId,
        },
      });
      setPreviewTitle('Regras do Firebase em JSON (3.05.9.c)');
      setPreviewContent(JSON.stringify(result.payload, null, 2));
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Falha ao Baixar Regras',
        message: err?.message || 'Erro ao exportar as regras do Firebase.',
      });
    } finally {
      setLoadingRulesExport(false);
      setProgressMsg(null);
    }
  };

  // -------------------------------------------------------------------------
  // 3.05.9.d: Upload de todas as regras do Firebase em JSON
  // -------------------------------------------------------------------------
  const handleImportRulesFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Deseja atualizar as regras de segurança do Firebase a partir do arquivo "${file.name}"?`)) {
      e.target.value = '';
      return;
    }

    setLoadingRulesImport(true);
    setFeedback(null);
    setProgressMsg('Validando e aplicando regras do Firebase...');

    try {
      const text = await file.text();
      const res = await firebaseBackupDispatchService.uploadFirebaseRulesJSON(text);

      setFeedback({
        type: 'success',
        title: 'Regras do Firebase Atualizadas!',
        message: res.message,
        details: { linhasAtualizadas: res.linesCount },
      });
      setPreviewTitle('Regras Atualizadas no Servidor');
      setPreviewContent(res.rulesContent);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Falha no Upload de Regras',
        message: err?.message || 'O JSON de regras não pôde ser aplicado.',
      });
    } finally {
      setLoadingRulesImport(false);
      setProgressMsg(null);
      e.target.value = '';
    }
  };

  // -------------------------------------------------------------------------
  // 3.05.9.e: Download de todas as coleções do Firebase em JSON
  // -------------------------------------------------------------------------
  const handleExportCollections = async () => {
    setLoadingCollectionsExport(true);
    setFeedback(null);

    try {
      const result = await firebaseBackupDispatchService.downloadFirebaseCollectionsJSON((msg) => {
        setProgressMsg(msg);
      });

      setFeedback({
        type: 'success',
        title: 'Coleções do Firebase Exportadas!',
        message: `Arquivo "${result.filename}" (${result.stats.totalDocuments} documentos em ${result.stats.collectionsCount} coleções) baixado no computador.`,
        details: result.stats.byCollection,
      });
      setPreviewTitle('Coleções do Firebase em JSON (3.05.9.e)');
      setPreviewContent(JSON.stringify(result.payload, null, 2));
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Falha ao Exportar Coleções',
        message: err?.message || 'Erro ao consultar documentos no Cloud Firestore.',
      });
    } finally {
      setLoadingCollectionsExport(false);
      setProgressMsg(null);
    }
  };

  // -------------------------------------------------------------------------
  // 3.05.9.f: Upload de todas as coleções do Firebase em JSON
  // -------------------------------------------------------------------------
  const handleImportCollectionsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Deseja importar e despachar os documentos do arquivo "${file.name}" para o Cloud Firestore?`)) {
      e.target.value = '';
      return;
    }

    setLoadingCollectionsImport(true);
    setFeedback(null);
    setProgressMsg('Lendo arquivo JSON de coleções...');

    try {
      const text = await file.text();
      const res = await firebaseBackupDispatchService.uploadFirebaseCollectionsJSON(text, (msg) => {
        setProgressMsg(msg);
      });

      setFeedback({
        type: 'success',
        title: 'Coleções Gravadas com Sucesso no Firebase!',
        message: res.message,
        details: res.stats,
      });

      if (onDataRestored) {
        onDataRestored();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Falha no Upload de Coleções',
        message: err?.message || 'Não foi possível gravar as coleções no Firebase.',
      });
    } finally {
      setLoadingCollectionsImport(false);
      setProgressMsg(null);
      e.target.value = '';
    }
  };

  // Submeter JSON colado manualmente
  const handleProcessPastedJson = async () => {
    if (!pastedJsonText.trim()) return;
    const mode = pasteModalMode;
    setPasteModalMode(null);

    if (mode === 'all') {
      setLoadingAllImport(true);
      try {
        const res = await firebaseBackupDispatchService.importAllSystemInformationJSON(pastedJsonText, setProgressMsg);
        setFeedback({ type: 'success', title: 'Backup Completo Restaurado!', message: res.message, details: res.stats });
        if (onDataRestored) onDataRestored();
      } catch (e: any) {
        setFeedback({ type: 'error', title: 'Erro ao Processar JSON', message: e?.message });
      } finally {
        setLoadingAllImport(false);
        setProgressMsg(null);
        setPastedJsonText('');
      }
    } else if (mode === 'rules') {
      setLoadingRulesImport(true);
      try {
        const res = await firebaseBackupDispatchService.uploadFirebaseRulesJSON(pastedJsonText);
        setFeedback({ type: 'success', title: 'Regras Atualizadas!', message: res.message });
      } catch (e: any) {
        setFeedback({ type: 'error', title: 'Erro ao Aplicar Regras', message: e?.message });
      } finally {
        setLoadingRulesImport(false);
        setPastedJsonText('');
      }
    } else if (mode === 'collections') {
      setLoadingCollectionsImport(true);
      try {
        const res = await firebaseBackupDispatchService.uploadFirebaseCollectionsJSON(pastedJsonText, setProgressMsg);
        setFeedback({ type: 'success', title: 'Coleções Importadas no Firestore!', message: res.message, details: res.stats });
        if (onDataRestored) onDataRestored();
      } catch (e: any) {
        setFeedback({ type: 'error', title: 'Erro ao Importar Coleções', message: e?.message });
      } finally {
        setLoadingCollectionsImport(false);
        setProgressMsg(null);
        setPastedJsonText('');
      }
    }
  };

  const copyPreviewToClipboard = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hidden File Inputs para os Uploads nativos */}
      <input
        type="file"
        ref={fileInputAllRef}
        onChange={handleImportAllFile}
        accept=".json,application/json"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRulesRef}
        onChange={handleImportRulesFile}
        accept=".json,application/json"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputCollectionsRef}
        onChange={handleImportCollectionsFile}
        accept=".json,application/json"
        className="hidden"
      />

      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <FolderDown size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold font-serif-heading">
                  Despacho & Backup em JSON do Sistema e Firebase
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                  Update 3.05.9
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1 max-w-3xl leading-relaxed">
                Central oficial de despacho, download e upload de dados em arquivos JSON para o computador:
                backup integral do site, regras de segurança do Firebase e árvore de coleções do Cloud Firestore.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono">
              <span className="text-slate-400 block text-[9px] uppercase">Firestore Ativo</span>
              <span className="text-amber-400 font-bold truncate max-w-[200px] block" title={ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId}>
                {ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Notification Bar */}
      {progressMsg && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-3 animate-pulse">
          <RefreshCw size={16} className="animate-spin text-blue-600 shrink-0" />
          <span className="font-medium font-mono">{progressMsg}</span>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs shadow-xs transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm">{feedback.title}</h4>
                <p className="mt-0.5">{feedback.message}</p>
                {feedback.details && (
                  <div className="mt-2.5 p-2 rounded bg-black/10 dark:bg-black/30 font-mono text-[11px] overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(feedback.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. Os Três Pares de Ações dos Requisitos (6 Funcionalidades) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* =========================================================================
            PAR 1: TODAS AS INFORMAÇÕES (3.05.9.a & 3.05.9.b)
        ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <HardDrive size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Requisitos 3.05.9.a & 3.05.9.b
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Todas as Informações (Full Backup)
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Despacha e consolida absolutamente tudo: artigos enciclopédicos, tópicos, usuários, dados locais, Firestore, histórico de auditoria, regras e configurações em um único arquivo JSON.
            </p>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-300 mb-4">
              <div className="flex items-center justify-between">
                <span>• Verbetes & Coleções:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Completo</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Cloud Firestore:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Todas Coleções</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Regras & Config:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Incluso</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 3.05.9.a: Download de todas as informações */}
            <button
              type="button"
              onClick={handleExportAll}
              disabled={loadingAllExport}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="3.05.9.a - Adicionar despacho de todas às informações e backup em download de toda às informações em JSON para o computador"
            >
              {loadingAllExport ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>{loadingAllExport ? 'Despachando...' : 'Baixar Todas Informações em JSON (3.05.9.a)'}</span>
            </button>

            {/* 3.05.9.b: Upload de todas as informações */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputAllRef.current?.click()}
                disabled={loadingAllImport}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                title="3.05.9.b - Adicionar upload de todas às informações em JSON do computador"
              >
                {loadingAllImport ? (
                  <RefreshCw size={14} className="animate-spin text-indigo-600" />
                ) : (
                  <Upload size={14} className="text-indigo-600" />
                )}
                <span>Subir JSON do Computador (3.05.9.b)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasteModalMode('all');
                  setPastedJsonText('');
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="Colar JSON manualmente"
              >
                Colar
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PAR 2: REGRAS DO FIREBASE (3.05.9.c & 3.05.9.d)
        ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-600 transition">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Shield size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Requisitos 3.05.9.c & 3.05.9.d
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Regras do Firebase (firestore.rules)
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Controle de acesso granular (RBAC), funções autenticadas e proteção de integridade do Firestore. Permite exportar e importar o conjunto formal de regras em JSON.
            </p>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-300 mb-4">
              <div className="flex items-center justify-between">
                <span>• Versão das Regras:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">rules_version = '2'</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Formato do Arquivo:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">JSON com Schema</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Coleções Protegidas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">12+ Paths</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 3.05.9.c: Download de todas as regras */}
            <button
              type="button"
              onClick={handleExportRules}
              disabled={loadingRulesExport}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="3.05.9.c - Adicionar download de todas às regras do FIrebase para o computador em JSON"
            >
              {loadingRulesExport ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>{loadingRulesExport ? 'Baixando...' : 'Baixar Regras do Firebase em JSON (3.05.9.c)'}</span>
            </button>

            {/* 3.05.9.d: Upload de todas as regras */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRulesRef.current?.click()}
                disabled={loadingRulesImport}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                title="3.05.9.d - Adicionar upload de todas às regras do FIrebase do computador em JSON"
              >
                {loadingRulesImport ? (
                  <RefreshCw size={14} className="animate-spin text-emerald-600" />
                ) : (
                  <Upload size={14} className="text-emerald-600" />
                )}
                <span>Subir Regras em JSON (3.05.9.d)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasteModalMode('rules');
                  setPastedJsonText('');
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="Colar regras JSON manualmente"
              >
                Colar
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PAR 3: COLEÇÕES DO FIREBASE (3.05.9.e & 3.05.9.f)
        ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600 transition">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Database size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Requisitos 3.05.9.e & 3.05.9.f
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Coleções do Cloud Firestore
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Extração e injeção direta de todos os documentos e subcoleções do banco de dados na nuvem (documentos, artigos, logs, usuários, extensões e telemetria) em formato JSON.
            </p>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-300 mb-4">
              <div className="flex items-center justify-between">
                <span>• Coleção /documentos:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Páginas & Subcoleções</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Coleção /users:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Perfis & Permissões</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Método de Gravação:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Batch com Merge Seguro</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 3.05.9.e: Download de todas as coleções */}
            <button
              type="button"
              onClick={handleExportCollections}
              disabled={loadingCollectionsExport}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="3.05.9.e - Adicionar download de todas às coleções do FIrebase para o computador em JSON"
            >
              {loadingCollectionsExport ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>{loadingCollectionsExport ? 'Extraindo da Nuvem...' : 'Baixar Coleções do Firebase em JSON (3.05.9.e)'}</span>
            </button>

            {/* 3.05.9.f: Upload de todas as coleções */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputCollectionsRef.current?.click()}
                disabled={loadingCollectionsImport}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                title="3.05.9.f - Adicionar upload de todas às coleções do FIrebase do computador em JSON"
              >
                {loadingCollectionsImport ? (
                  <RefreshCw size={14} className="animate-spin text-amber-600" />
                ) : (
                  <Upload size={14} className="text-amber-600" />
                )}
                <span>Subir Coleções em JSON (3.05.9.f)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasteModalMode('collections');
                  setPastedJsonText('');
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="Colar coleções JSON manualmente"
              >
                Colar
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Modal / Área para Colar JSON Manualmente */}
      {pasteModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode size={16} className="text-indigo-600" />
                <span>
                  {pasteModalMode === 'all'
                    ? 'Colar JSON do Despacho Completo (3.05.9.b)'
                    : pasteModalMode === 'rules'
                    ? 'Colar JSON de Regras do Firebase (3.05.9.d)'
                    : 'Colar JSON de Coleções do Firebase (3.05.9.f)'}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setPasteModalMode(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕ Fechar
              </button>
            </div>

            <textarea
              rows={10}
              value={pastedJsonText}
              onChange={(e) => setPastedJsonText(e.target.value)}
              placeholder="Cole aqui a estrutura JSON copiada do seu computador..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasteModalMode(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessPastedJson}
                disabled={!pastedJsonText.trim()}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Upload size={13} />
                <span>Processar e Restaurar JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Pré-visualizador e Inspetor JSON */}
      {previewContent && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                {previewTitle || 'Pré-visualização do Arquivo JSON'}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyPreviewToClipboard}
                className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
              >
                {copiedPreview ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedPreview ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewContent(null)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Ocultar
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800">
            {previewContent}
          </pre>
        </div>
      )}

    </div>
  );
};
export default FirebaseJsonDispatchManager;
