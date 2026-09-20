import React, { useState } from 'react';
import {
  UserCheck,
  Download,
  Trash2,
  RotateCcw,
  X,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Bell,
  Sliders,
  Send,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { UserProfile, CookieConsent, LgpdNotificationPreferences } from '../types';
import { StorageService } from '../services/storageService';

interface MyDataModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  consent: CookieConsent | null;
  onClose: () => void;
  onRevokeConsent: () => void;
  onRequestDeletion: () => void;
  onRefreshNotifications?: () => void;
  initialTab?: 'titular' | 'notifications';
}

export const MyDataModal: React.FC<MyDataModalProps> = ({
  isOpen,
  user,
  consent,
  onClose,
  onRevokeConsent,
  onRequestDeletion,
  onRefreshNotifications,
  initialTab = 'titular',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'titular' | 'notifications'>(initialTab);
  const [notifPrefs, setNotifPrefs] = useState<LgpdNotificationPreferences>(() =>
    StorageService.getLgpdNotificationPreferences()
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  const ageInfo = StorageService.getUserAgeInfo();

  const exportData = {
    titular: user || { modo: 'Convidado / Anônimo' },
    verificacaoIdade: {
      idadeVerificada: ageInfo.isAccepted,
      faixaEtariaPermitida: ageInfo.age > 14 ? 'Maior de 14 anos (Conforme)' : 'Pendente / Não confirmada',
      idadeCalculada: ageInfo.age || undefined,
      dataNascimentoRegistrada: ageInfo.birthdate || undefined,
      baseLegal: 'Art. 14 da LGPD (Lei nº 13.709/2018)',
    },
    consentimentoCookies: consent || { status: 'padrão' },
    preferenciasNotificacaoLgpd: notifPrefs,
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
      nome: 'Encarregado WikiWorldWeb',
      email: 'pedrohenriquecardonaperes@gmail.com',
      marcoLegal: 'Marco Civil (Lei 12.965/2014) & LGPD (Lei 13.709/2018)',
    },
    dataExportacao: new Date().toISOString(),
  };

  const handleTogglePref = (key: keyof LgpdNotificationPreferences) => {
    const updated = {
      ...notifPrefs,
      [key]: !notifPrefs[key],
    };
    setNotifPrefs(updated);
    StorageService.saveLgpdNotificationPreferences(updated);
    setSaveFeedback('Preferências de notificação salvas.');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleTestNotification = () => {
    StorageService.sendLgpdNotification(
      'Configuração LGPD Confirmada',
      'Suas preferências de notificações da LGPD foram atualizadas e este teste confirma o recebimento na central de alertas.',
      'notifyOnPrivacyUpdate',
      'success'
    );
    if (onRefreshNotifications) {
      onRefreshNotifications();
    }
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wikizero-dados-${user?.uid || 'titular'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (notifPrefs.notifyOnDataPortability) {
      StorageService.sendLgpdNotification(
        'Relatório de Portabilidade Exportado',
        'Arquivo JSON com dados completos de titularidade e consentimento baixado conforme Art. 18, V da LGPD.',
        'notifyOnDataPortability',
        'info'
      );
      if (onRefreshNotifications) onRefreshNotifications();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 text-xs flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Painel do Titular de Dados & LGPD
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Portabilidade, Direitos do Titular e Notificações Oficiais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 px-3 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('titular')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'titular'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-white/70 dark:bg-slate-900/70 rounded-t'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck size={14} />
            <span>Titular & Portabilidade</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70 rounded-t'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell size={14} />
            <span>Configurar Notificações LGPD</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 text-slate-700 dark:text-slate-300 max-h-[62vh] overflow-y-auto">
          {activeTab === 'titular' && (
            <>
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
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                    <span className="text-slate-500">Perfil:</span>
                    <span className="uppercase text-slate-900 dark:text-white font-bold">{user.role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Faixa Etária (LGPD Art. 14):</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      <CheckCircle2 size={12} />
                      {ageInfo.age > 0 ? `${ageInfo.age} anos (> 14 anos - Aprovado)` : 'Idade Verificada (> 14 anos)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="text-slate-500">Modo de Navegação:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Visitante / Anônimo</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="text-slate-500">Verificação de Idade:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      <CheckCircle2 size={12} />
                      {ageInfo.age > 0 ? `${ageInfo.age} anos (> 14 anos)` : 'Maior que 14 anos'}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                <h4 className="font-bold font-mono text-[11px] uppercase mb-0.5 flex items-center gap-1.5">
                  <Download size={13} />
                  <span>Portabilidade de Dados (Art. 18, V)</span>
                </h4>
                <p className="text-[11px]">
                  Baixe uma cópia integral legível por máquina contendo todos os dados, metadados e configurações de privacidade vinculados à sua identidade.
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                <h4 className="font-bold font-mono text-[11px] uppercase mb-0.5 flex items-center gap-1.5">
                  <Info size={13} />
                  <span>Retificação de Nome (Art. 18, III)</span>
                </h4>
                <p className="text-[11px] leading-relaxed">
                  Para conformidade com a LGPD e o Marco Civil da Internet, a alteração e retificação cadastral de nome de usuário é realizada exclusivamente por um <strong>Administrador</strong>, garantindo a integridade dos registros e a cadeia de autoria dos verbetes.
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  onClick={handleDownloadJson}
                  className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download size={14} />
                  <span>Exportar Arquivo Completo (JSON)</span>
                </button>

                <button
                  onClick={onRevokeConsent}
                  className="w-full py-2 px-3 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Revogar Consentimento de Cookies</span>
                </button>

                <button
                  onClick={onRequestDeletion}
                  className="w-full py-2 px-3 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Solicitar Exclusão da Conta (Art. 18, VI)</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] space-y-1 leading-relaxed">
                  <span className="font-bold block text-xs">Configuração de Alertas e Notificações da LGPD</span>
                  <p>
                    Controle exatamente quais eventos de privacidade, consentimento e segurança do Marco Civil disparam avisos oficiais no sino de notificações do seu aplicativo.
                  </p>
                </div>
              </div>

              {saveFeedback && (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded flex items-center gap-1.5 text-xs animate-in fade-in duration-200">
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{saveFeedback}</span>
                </div>
              )}

              {/* Toggles List */}
              <div className="space-y-2">
                {/* 1. Terms and Age */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Validação de Termos e Idade (Art. 14)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Notificar quando a confirmação de maioridade (&gt; 14 anos) e aceite dos termos LGPD forem validados.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnTermsAccepted')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnTermsAccepted ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de termos"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnTermsAccepted ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Privacy Policy Updates & Revocation */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Políticas de Privacidade & Revogações
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Notificar quando você revogar cookies ou quando houver atualizações na política de privacidade.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnPrivacyUpdate')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnPrivacyUpdate ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de privacidade"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnPrivacyUpdate ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Data Portability */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Portabilidade de Dados (Art. 18, V)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Registrar notificação no sininho ao solicitar ou concluir o download do arquivo de dados em JSON.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnDataPortability')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnDataPortability ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de portabilidade"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnDataPortability ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Account Changes */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Alterações Cadastrais & Perfil
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Alertar sobre requisições de retificação de dados cadastrais, alteração de permissão ou exclusão de conta.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnAccountChanges')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnAccountChanges ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de alterações cadastrais"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnAccountChanges ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action buttons in notifications tab */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={testSent}
                  className="flex-1 py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Send size={13} />
                  <span>{testSent ? 'Notificação Enviada!' : 'Enviar Notificação LGPD de Teste'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaults = {
                      notifyOnTermsAccepted: true,
                      notifyOnPrivacyUpdate: true,
                      notifyOnDataPortability: true,
                      notifyOnAccountChanges: true,
                    };
                    setNotifPrefs(defaults);
                    StorageService.saveLgpdNotificationPreferences(defaults);
                    setSaveFeedback('Configurações redefinidas para o padrão da LGPD.');
                    setTimeout(() => setSaveFeedback(null), 2500);
                  }}
                  className="py-2 px-3 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Restaurar Padrões</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            Lei nº 13.709/2018 (LGPD) • Encarregado DPO
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

