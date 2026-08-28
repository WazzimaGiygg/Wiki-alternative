import React from 'react';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';

interface BannedOverlayProps {
  reason?: string;
  onLogout: () => void;
}

export const BannedOverlay: React.FC<BannedOverlayProps> = ({
  reason = 'Violação das diretrizes editoriais ou vandalismo na WikiZero.',
  onLogout,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-red-500 rounded p-6 text-center text-white shadow-xl animate-in zoom-in-95 text-xs">
        <div className="w-12 h-12 mx-auto rounded bg-red-950/80 border border-red-500 flex items-center justify-center text-red-500 mb-3">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-lg font-bold text-red-500 font-serif-heading font-mono uppercase tracking-wider">
          Conta Suspensa
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Sua conta foi suspensa do sistema WikiZero.
        </p>

        <div className="mt-3 p-2.5 bg-red-950/40 border border-red-800/60 rounded text-[11px] text-red-200 text-left font-mono">
          <span className="font-bold block mb-0.5 uppercase text-red-400">Motivo:</span>
          {reason}
        </div>

        <p className="text-[11px] text-slate-400 mt-3 leading-normal">
          Para contestar esta punição conforme o Marco Civil e LGPD, contate o DPO:
        </p>

        <a
          href="mailto:pedrohenriquecardonaperes@gmail.com"
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 underline font-mono"
        >
          <Mail size={12} />
          pedrohenriquecardonaperes@gmail.com
        </a>

        <div className="mt-5">
          <button
            onClick={onLogout}
            className="w-full py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <LogOut size={14} />
            Desconectar da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
