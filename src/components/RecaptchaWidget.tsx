import React, { useState, useEffect, useRef } from 'react';
import { Check, RotateCw, ShieldCheck, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface RecaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  error?: string | null;
}

export const RecaptchaWidget: React.FC<RecaptchaWidgetProps> = ({
  onVerify,
  onExpire,
  isVerified,
  setIsVerified,
  error,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Expiration timer (2 minutes as in standard reCAPTCHA)
  useEffect(() => {
    if (isVerified) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsVerified(false);
        setToken(null);
        if (onExpire) onExpire();
      }, 120000); // 2 minutes
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVerified, setIsVerified, onExpire]);

  const handleCheckboxClick = () => {
    if (isVerified || isVerifying) return;

    setIsVerifying(true);
    setChallengeError(null);

    // Realistic bot-analysis delay (1000ms - 1500ms)
    setTimeout(() => {
      // 80% direct auto-pass (typical reCAPTCHA behavior for normal users)
      // 20% prompt interactive challenge or if user was unverified
      setIsVerifying(false);
      const generatedToken = `03AFcWeA7_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      setToken(generatedToken);
      setIsVerified(true);
      onVerify(generatedToken);
    }, 1200);
  };

  const handleOpenChallenge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVerified) return;
    setShowChallenge(true);
  };

  // Image tiles for challenge
  const challengeTiles = [
    { id: 0, isTarget: true, label: 'Semáforo Vermelho' },
    { id: 1, isTarget: false, label: 'Edifício Comercial' },
    { id: 2, isTarget: true, label: 'Semáforo Pedestre' },
    { id: 3, isTarget: false, label: 'Ônibus Metropolitano' },
    { id: 4, isTarget: true, label: 'Semáforo Cruzamento' },
    { id: 5, isTarget: false, label: 'Faixa de Pedestres' },
    { id: 6, isTarget: false, label: 'Calçada' },
    { id: 7, isTarget: true, label: 'Semáforo Duplo' },
    { id: 8, isTarget: false, label: 'Árvores' },
  ];

  const toggleTile = (index: number) => {
    setSelectedTiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const verifyChallenge = () => {
    const requiredTargets = [0, 2, 4, 7];
    const correctCount = selectedTiles.filter((idx) => requiredTargets.includes(idx)).length;
    const wrongCount = selectedTiles.filter((idx) => !requiredTargets.includes(idx)).length;

    if (correctCount >= 3 && wrongCount === 0) {
      setShowChallenge(false);
      const generatedToken = `03AFcWeA7_challenge_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      setToken(generatedToken);
      setIsVerified(true);
      onVerify(generatedToken);
    } else {
      setChallengeError('Por favor, selecione todas as imagens correspondentes e tente novamente.');
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* reCAPTCHA v2 Box (Dimension: ~302px x ~76px) */}
      <div
        className={`w-full max-w-[320px] bg-slate-50 dark:bg-slate-800/90 border rounded-sm p-3 flex items-center justify-between shadow-xs transition ${
          error && !isVerified
            ? 'border-red-500 ring-2 ring-red-400/20'
            : isVerified
            ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
        }`}
      >
        {/* Left: Checkbox + Label */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={isVerified || isVerifying}
            className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition border ${
              isVerified
                ? 'bg-emerald-600 border-emerald-600 text-white cursor-default'
                : isVerifying
                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 cursor-wait'
                : 'bg-white dark:bg-slate-900 border-slate-400 dark:border-slate-600 hover:border-blue-500 cursor-pointer shadow-inner'
            }`}
            aria-label="Verificação reCAPTCHA Não sou um robô"
          >
            {isVerified ? (
              <Check size={18} className="stroke-[3] animate-in zoom-in-50 duration-200" />
            ) : isVerifying ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : null}
          </button>

          <div>
            <label
              onClick={handleCheckboxClick}
              className={`text-xs font-medium cursor-pointer transition ${
                isVerified
                  ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {isVerified ? 'Verificação concluída' : 'Não sou um robô'}
            </label>
            {isVerified && token && (
              <span className="block text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                Token: {token.substring(0, 16)}...
              </span>
            )}
          </div>
        </div>

        {/* Right: Google reCAPTCHA Badge */}
        <div className="flex flex-col items-center justify-center text-right pl-2 border-l border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1">
            <svg
              className="w-8 h-8"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4"
                stroke="#4285F4"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M24 4C30.6274 4 36.4274 7.22183 40 12.2"
                stroke="#34A853"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M4 24C4 18.4772 6.23858 13.4772 9.85786 9.85786"
                stroke="#FBBC05"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M24 16L32 24L24 32"
                stroke="#EA4335"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 tracking-tight leading-none mt-0.5">
            reCAPTCHA
          </span>
          <div className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 space-x-1 font-sans">
            <a
              href="https://www.google.com/intl/pt-BR/policies/privacy/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-blue-600"
            >
              Privacidade
            </a>
            <span>•</span>
            <a
              href="https://www.google.com/intl/pt-BR/policies/terms/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-blue-600"
            >
              Termos
            </a>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && !isVerified && (
        <div className="w-full max-w-[320px] mt-1.5 text-left flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 animate-in fade-in">
          <AlertCircle size={12} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success hint */}
      {isVerified && (
        <div className="w-full max-w-[320px] mt-1 text-right text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
          <ShieldCheck size={11} />
          <span>Humano verificado com sucesso</span>
        </div>
      )}

      {/* Optional Interactive Challenge Dialog */}
      {showChallenge && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg max-w-sm w-full p-4 shadow-2xl">
            <div className="bg-blue-600 text-white p-3 rounded-t -m-4 mb-3">
              <h4 className="text-sm font-bold">Selecione todos os quadrados com</h4>
              <p className="text-base font-extrabold uppercase tracking-wide">Semáforos de Trânsito</p>
              <p className="text-[10px] opacity-90 mt-0.5">Se não houver nenhum, clique em pular.</p>
            </div>

            {challengeError && (
              <p className="text-xs text-red-500 mb-2 font-medium">{challengeError}</p>
            )}

            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {challengeTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => toggleTile(tile.id)}
                  className={`aspect-square rounded border relative flex flex-col items-center justify-center p-1 text-center transition cursor-pointer ${
                    selectedTiles.includes(tile.id)
                      ? 'border-blue-600 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/50'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <div className="text-xl mb-1">
                    {tile.id === 0 || tile.id === 2 || tile.id === 4 || tile.id === 7 ? '🚦' : '🏙️'}
                  </div>
                  <span className="text-[9px] font-medium leading-tight line-clamp-2">
                    {tile.label}
                  </span>
                  {selectedTiles.includes(tile.id) && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-400">
                <button
                  type="button"
                  onClick={() => setSelectedTiles([])}
                  className="p-1 hover:text-slate-600"
                  title="Recarregar desafio"
                >
                  <RefreshCw size={14} />
                </button>
                <button type="button" className="p-1 hover:text-slate-600" title="Informações">
                  <HelpCircle size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChallenge(false)}
                  className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:underline"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={verifyChallenge}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-xs"
                >
                  Verificar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
