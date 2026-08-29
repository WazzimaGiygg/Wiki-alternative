import React, { useState } from 'react';
import { UserCheck, Download, Trash2, RotateCcw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserProfile, CookieConsent } from '../types';

interface MyDataModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  consent: CookieConsent | null;
  onClose: () => void;
  onRevokeConsent: () => void;
  onRequestDeletion: () => void;
}

export const MyDataModal: React.FC<MyDataModalProps> = ({
  isOpen,
  user,
  consent,
  onClose,
  onRevokeConsent,
  onRequestDeletion,
}) => {
  if (!isOpen) return null;

  const exportData = {
    titular: user || { modo: 'Convidado / Anônimo' },
    consentimentoCookies: consent || { status: 'padrão' },
    direitosGarantidos: [
      'Art. 18, I - Confirmação da existência de tratamento',
      'Art. 18, II - Acesso aos dados',
      'Art. 18, III - Correção de dados incompletos',
      'Art. 18, IV - Anonimização, bloqueio ou eliminação',
      'Art. 18, V - Portabilidade dos dados',
      'Art. 18, VI - Eliminação dos dados pessoais',
      'Art. 18, IX - Revogação do consentimento',
    ],
    dpoResponsavel: {
      nome: 'Encarregado WikiZero',
      email: 'pedrohenriquecardonaperes@gmail.com',
      marcoLegal: 'Marco Civil (Lei 12.965/2014) & LGPD (Lei 13.709/2018)',
    },
    dataExportacao: new Date().toISOString(),
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wikizero-dados-${user?.uid || 'titular'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xl overflow-hidden animate-in zoom-in-95 text-xs">
        <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono">
            <UserCheck size={16} className="text-purple-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Painel do Titular de Dados
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Portabilidade e Gestão de Privacidade (LGPD)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3 text-slate-700 dark:text-slate-300 max-h-[60vh] overflow-y-auto">
          {user ? (
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                <span className="text-slate-500">Nome:</span>
                <span className="font-bold text-slate-900 dark:text-white font-sans">{user.displayName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                <span className="text-slate-500">E-mail:</span>
                <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                <span className="text-slate-500">UID:</span>
                <span className="text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{user.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perfil:</span>
                <span className="uppercase text-slate-900 dark:text-white font-bold">{user.role}</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
              Navegando em modo visitante. Apenas dados de sessão local estão armazenados neste dispositivo.
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
            <h4 className="font-bold font-mono text-[11px] uppercase mb-0.5">📦 Portabilidade (Art. 18, V)</h4>
            <p className="text-[11px]">
              Baixe uma cópia integral legível por máquina contendo todos os dados e metadados vinculados à sua identidade.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
            <h4 className="font-bold font-mono text-[11px] uppercase mb-0.5">⚖️ Retificação de Nome (Art. 18, III)</h4>
            <p className="text-[11px] leading-relaxed">
              Para conformidade com a LGPD e o Marco Civil da Internet, a alteração e retificação cadastral de nome de usuário é realizada exclusivamente por um <strong>Administrador</strong>, garantindo a integridade dos registros e a cadeia de autoria dos verbetes.
            </p>
          </div>

          <div className="pt-1 flex flex-col gap-1.5">
            <button
              onClick={handleDownloadJson}
              className="w-full py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Download size={13} />
              Exportar Arquivo Completo (JSON)
            </button>

            <button
              onClick={onRevokeConsent}
              className="w-full py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw size={13} />
              Revogar Consentimento de Cookies
            </button>

            <button
              onClick={onRequestDeletion}
              className="w-full py-1.5 px-3 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 size={13} />
              Solicitar Exclusão da Conta (Art. 18, VI)
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
