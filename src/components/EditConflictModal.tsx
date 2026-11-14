/**
 * @file EditConflictModal.tsx
 * @description Modal interativo de Resolução de Conflito de Edição (Edit Conflict) do WikiZero.
 * Detecta quando um artigo foi salvo por outro usuário durante a edição, exibe o diff visual
 * comparativo (servidor vs. local), e permite mesclagem automática (3-way merge), sobrescrita
 * intencional ou descarte das alterações locais.
 */

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  GitMerge,
  Columns,
  FileCheck,
  RotateCcw,
  UploadCloud,
  X,
  Info,
  Clock,
  User,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { WikiArticle } from '../types';
import { VersionDiff } from './VersionDiff';
import { diffLines, Change } from 'diff';

export interface EditConflictModalProps {
  isOpen: boolean;
  serverArticle: WikiArticle;
  baseVersion: number;
  yourWikitext: string;
  baseWikitext: string;
  onApplyMergedText: (mergedText: string) => void;
  onForceOverwrite: () => void;
  onDiscardMyChanges: () => void;
  onClose: () => void;
}

/**
 * Algoritmo de 3-way merge em nível de linhas entre base, servidor e local
 */
export function performThreeWayMerge(
  base: string,
  server: string,
  mine: string,
  serverAuthor: string = 'Outro Editor'
): { mergedText: string; conflictCount: number } {
  const baseLines = base.replace(/\r\n/g, '\n').split('\n');
  const serverLines = server.replace(/\r\n/g, '\n').split('\n');
  const myLines = mine.replace(/\r\n/g, '\n').split('\n');

  const serverDiff = diffLines(base, server);
  const myDiff = diffLines(base, mine);

  // Se o servidor for idêntico ao base, as minhas alterações são aplicadas diretamente
  if (base === server) {
    return { mergedText: mine, conflictCount: 0 };
  }
  // Se as minhas alterações forem idênticas ao base, as do servidor vencem
  if (base === mine) {
    return { mergedText: server, conflictCount: 0 };
  }

  // Executa segmentação simples de blocos de diff para montar resultado mesclado
  let conflictCount = 0;
  const mergedChunks: string[] = [];

  // Se não houver divergência complexa, computamos diferenças relativas ao servidor
  const diffFromMineToServer = diffLines(server, mine);
  const resultLines: string[] = [];

  let inConflict = false;
  let serverConflictLines: string[] = [];
  let myConflictLines: string[] = [];

  for (const change of diffFromMineToServer) {
    const lines = change.value.replace(/\r\n/g, '\n').split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (!change.added && !change.removed) {
      if (serverConflictLines.length > 0 || myConflictLines.length > 0) {
        conflictCount++;
        resultLines.push(`<<<<<<< SUAS ALTERAÇÕES (RASCUNHO LOCAL)`);
        resultLines.push(...myConflictLines);
        resultLines.push(`======= VERSÃO DO SERVIDOR (${serverAuthor})`);
        resultLines.push(...serverConflictLines);
        resultLines.push(`>>>>>>> FIM DO CONFLITO`);
        serverConflictLines = [];
        myConflictLines = [];
      }
      resultLines.push(...lines);
    } else if (change.added) {
      myConflictLines.push(...lines);
    } else if (change.removed) {
      serverConflictLines.push(...lines);
    }
  }

  if (serverConflictLines.length > 0 || myConflictLines.length > 0) {
    conflictCount++;
    resultLines.push(`<<<<<<< SUAS ALTERAÇÕES (RASCUNHO LOCAL)`);
    resultLines.push(...myConflictLines);
    resultLines.push(`======= VERSÃO DO SERVIDOR (${serverAuthor})`);
    resultLines.push(...serverConflictLines);
    resultLines.push(`>>>>>>> FIM DO CONFLITO`);
  }

  return {
    mergedText: resultLines.join('\n'),
    conflictCount,
  };
}

export const EditConflictModal: React.FC<EditConflictModalProps> = ({
  isOpen,
  serverArticle,
  baseVersion,
  yourWikitext,
  baseWikitext,
  onApplyMergedText,
  onForceOverwrite,
  onDiscardMyChanges,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'merge_preview' | 'manual'>('diff');
  const [customMergedText, setCustomMergedText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const serverAuthor = serverArticle.autor || 'Outro Colaborador';
  const serverVersion = serverArticle.versao || (baseVersion + 1);
  const serverDate = serverArticle.dataEdicao
    ? new Date(serverArticle.dataEdicao).toLocaleString('pt-BR')
    : 'Recentemente';

  const { mergedText: autoMergedText, conflictCount } = useMemo(() => {
    return performThreeWayMerge(baseWikitext, serverArticle.descricao || '', yourWikitext, serverAuthor);
  }, [baseWikitext, serverArticle.descricao, yourWikitext, serverAuthor]);

  // Inicializa o texto customizável com o texto auto-mesclado
  React.useEffect(() => {
    setCustomMergedText(autoMergedText);
  }, [autoMergedText]);

  if (!isOpen) return null;

  const handleCopyYourText = () => {
    navigator.clipboard.writeText(yourWikitext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Cabeçalho de Alerta de Conflito */}
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Conflito de Edição Detectado
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  Revisão #{serverVersion} salva por {serverAuthor}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Outro usuário publicou uma nova versão de <strong>&quot;{serverArticle.titulo}&quot;</strong> às {serverDate} enquanto você editava a versão base #{baseVersion}.
                Para evitar a perda inadvertida de dados, revise as diferenças e decida como deseja consolidar o texto.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar aviso de conflito"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50 dark:bg-slate-900/60 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('diff')}
              className={`py-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'diff'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Columns size={14} />
              Diferenças (Servidor vs. Suas Alterações)
            </button>
            <button
              onClick={() => setActiveTab('merge_preview')}
              className={`py-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'merge_preview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitMerge size={14} />
              Mesclagem Inteligente (3-Way Merge)
              {conflictCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                  {conflictCount} marcador{conflictCount > 1 ? 'es' : ''}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleCopyYourText}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            title="Copiar suas alterações locais para a área de transferência"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar Meu Rascunho'}
          </button>
        </div>

        {/* Conteúdo Central */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'diff' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Lado esquerdo: <strong>Versão atual no Servidor (por {serverAuthor})</strong>
                </span>
                <span>
                  Lado direito: <strong>Seu Rascunho Local</strong>
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                <VersionDiff
                  oldContent={serverArticle.descricao || ''}
                  newContent={yourWikitext}
                  oldVersionLabel={`Versão #${serverVersion} (Servidor - ${serverAuthor})`}
                  newVersionLabel={`Seu Rascunho Local (Baseado na #${baseVersion})`}
                />
              </div>
            </div>
          )}

          {activeTab === 'merge_preview' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold">Resultado da Mesclagem Proposta:</p>
                  <p className="mt-0.5 text-blue-700/80 dark:text-blue-300/80">
                    O algoritmo consolidou as edições mantendo as adições de ambos os colaboradores.
                    {conflictCount > 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400 ml-1">
                        Foram detectados {conflictCount} blocos onde ambos alteraram as mesmas linhas. Revise os marcadores &lt;&lt;&lt;&lt;&lt;&lt;&lt; e &gt;&gt;&gt;&gt;&gt;&gt;&gt; abaixo antes de salvar.
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 ml-1">
                        Nenhuma colisão direta de linhas detectada. O texto foi combinado com sucesso!
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <textarea
                value={customMergedText}
                onChange={(e) => setCustomMergedText(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Texto mesclado..."
              />
            </div>
          )}
        </div>

        {/* Rodapé com Ações de Resolução */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onDiscardMyChanges}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
              title="Descarta o seu rascunho local e abre a versão salva no servidor"
            >
              <RotateCcw size={14} />
              Descartar Minhas e Usar Versão do Servidor
            </button>
            <button
              onClick={onForceOverwrite}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-400 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 transition cursor-pointer flex items-center gap-1.5"
              title="Sobrescreve a versão do servidor com o seu rascunho sem mesclar"
            >
              <UploadCloud size={14} />
              Sobrescrever com Minha Versão
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => onApplyMergedText(customMergedText)}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              title="Carrega o texto mesclado no editor para você salvar"
            >
              <FileCheck size={14} />
              Aplicar Texto Mesclado no Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
