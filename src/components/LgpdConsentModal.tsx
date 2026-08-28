import React, { useState } from 'react';
import { Shield, X, Check, FileCheck, Mail, AlertTriangle, Scale } from 'lucide-react';

interface LgpdConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (birthdate?: string) => void;
  onDecline: () => void;
}

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
}) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [birthdate, setBirthdate] = useState('');

  if (!isOpen) return null;

  const canAccept = consentChecked && ageChecked;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto select-none font-sans">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xl overflow-hidden my-6 animate-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono">
            <Scale size={16} className="text-blue-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Termo de Consentimento - LGPD
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
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

        {/* Modal Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded p-3">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase">
              <Shield size={13} /> Consentimento para Tratamento de Dados
            </h4>
            <p className="mb-2 text-[11px]">
              A WikiZero coleta e trata apenas os dados estritamente necessários para viabilizar sua participação na enciclopédia:
            </p>
            <ul className="space-y-1 pl-4 list-disc text-slate-800 dark:text-slate-200 text-[11px]">
              <li><strong>Nome e e-mail:</strong> fornecidos via Google Authentication para atribuição de autoria pública.</li>
              <li><strong>Identificador UID:</strong> identificador anônimo criptográfico.</li>
              <li><strong>Conteúdo gerado:</strong> artigos, edições e resumos criados publicamente.</li>
              <li><strong>Histórico de auditoria:</strong> carimbo de data/hora e metadados de edições.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 font-mono text-[11px] uppercase">
              Bases Legais do Tratamento (Art. 7º, LGPD):
            </h4>
            <ul className="space-y-0.5 pl-4 list-disc text-slate-600 dark:text-slate-400 text-[11px]">
              <li><strong>Execução de Contrato (Art. 7º, V):</strong> viabilização técnica da conta.</li>
              <li><strong>Legítimo Interesse (Art. 7º, IX):</strong> melhoria de usabilidade e integridade editorial.</li>
              <li><strong>Consentimento (Art. 7º, I):</strong> concordância expressa com este termo.</li>
            </ul>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded p-3 text-[11px]">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-0.5 font-mono text-[11px] uppercase">
              Retenção e Direito ao Esquecimento (Art. 18):
            </h4>
            <p className="text-emerald-800 dark:text-emerald-300">
              Seus dados pessoais permanecem vinculados enquanto sua conta estiver ativa. Mediante solicitação formal na aba "Meus Dados", seus dados pessoais serão anonimizados em até 30 dias.
            </p>
          </div>

          {/* Form fields for consent & birthdate */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 font-mono">
                Data de Nascimento (Verificação de idade - Art. 14)
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                Declaro que li e concordo expressamente com os termos de consentimento da WikiZero e autorizo o tratamento nos termos da LGPD.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ageChecked}
                onChange={(e) => setAgeChecked(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                Declaro que tenho pelo menos 13 anos de idade (ou estou com orientação de responsáveis legais).
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onDecline}
            className="px-3 py-1 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
          >
            Recusar e Sair
          </button>
          <button
            onClick={() => onAccept(birthdate)}
            disabled={!canAccept}
            className={`px-3.5 py-1 text-xs font-semibold rounded transition flex items-center gap-1 shadow-xs ${
              canAccept
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check size={13} />
            Aceitar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
