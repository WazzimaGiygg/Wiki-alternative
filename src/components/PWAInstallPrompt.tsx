import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Smartphone, 
  Download, 
  Share2, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  HardDrive, 
  Zap, 
  QrCode, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface PWAInstallPromptProps {
  buttonStyle?: 'compact' | 'full' | 'header';
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ buttonStyle = 'header' }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'features' | 'qr'>('android');
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://wikizero.app';
  // Generate a clean QR code URL via public QR image service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(currentUrl)}`;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setShowModal(false);
        return;
      }
    }
    // If not directly triggerable via beforeinstallprompt (e.g. within iframe or already prompt dismissed), show the guide modal
    setShowModal(true);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <>
      {/* Install Button Trigger */}
      {!isInstalled ? (
        buttonStyle === 'header' ? (
          <button
            id="pwa-header-install-btn"
            onClick={handleInstallClick}
            aria-label="Instalar aplicativo WikiZero no Android"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar App Android</span>
            <span className="sm:hidden">App</span>
          </button>
        ) : buttonStyle === 'compact' ? (
          <button
            id="pwa-compact-install-btn"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Instalar no Celular</span>
          </button>
        ) : (
          <button
            id="pwa-full-install-btn"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-lg">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Instalar Aplicativo Android</div>
                <div className="text-xs text-blue-100">Acesso rápido, ícone nativo e modo offline</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-200" />
          </button>
        )
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">App Instalado</span>
        </span>
      )}

      {/* Guide & Installation Modal */}
      {showModal && (
        <div 
          id="pwa-install-modal" 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with App Branding */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white relative">
              <button
                id="close-pwa-modal-btn"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0">
                  <img 
                    src="/pwa-192x192.png" 
                    alt="WikiZero Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <Smartphone className="w-8 h-8 text-blue-600 hidden [only-child]:block" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">WikiZero para Android</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/40 text-blue-100 border border-blue-400/30">
                      PWA Nativo
                    </span>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">
                    Instale o app oficial no seu smartphone com ícone na tela inicial e acesso veloz.
                  </p>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex gap-2 mt-5 border-t border-white/15 pt-3 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'android' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  📱 Passo a Passo Android
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'qr' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  📲 Abrir no Celular (QR Code)
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'features' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  ✨ Vantagens do App
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-700">
              {activeTab === 'android' && (
                <div className="space-y-4">
                  {isInstallable && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-blue-900 text-sm">Pronto para Instalação Direta!</div>
                        <div className="text-xs text-blue-700">Seu navegador oferece suporte ao clique único.</div>
                      </div>
                      <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Instalar Agora
                      </button>
                    </div>
                  )}

                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Como instalar no Google Chrome ou Samsung Internet no Android:
                  </div>

                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      1
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900">Abra o menu de opções</div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        No navegador do Android (Chrome, Samsung Internet, Edge ou Brave), toque no botão de menu de <strong>três pontinhos (⋮)</strong> no canto superior direito.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      2
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900">Selecione "Instalar aplicativo"</div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Procure pela opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      3
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900">Confirme a instalação</div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Toque em <strong>"Instalar"</strong>. O Android criará o aplicativo WebAPK automaticamente na sua gaveta de apps com o ícone do WikiZero.
                      </p>
                    </div>
                  </div>

                  {isIOS && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                        <Share2 className="w-3.5 h-3.5" /> No iPhone / iPad (Safari):
                      </div>
                      <p className="mt-1">
                        Toque no botão de <strong>Compartilhar</strong> (quadrado com seta) e selecione <strong>"Adicionar à Tela de Início"</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'qr' && (
                <div className="flex flex-col items-center text-center space-y-3 py-2">
                  <p className="text-xs text-slate-600 max-w-sm">
                    Aponte a câmera do seu smartphone Android para o QR Code abaixo para abrir o WikiZero no celular e instalar:
                  </p>

                  <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code WikiZero" 
                      className="w-48 h-48 rounded-lg"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full max-w-sm mt-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUrl} 
                      className="flex-1 text-xs bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 truncate select-all focus:outline-hidden"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition cursor-pointer shrink-0"
                    >
                      {copiedLink ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs">
                      <Zap className="w-4 h-4" /> Velocidade Máxima
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Abre instantaneamente sem carregar barras ou controles desnecessários do navegador.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
                      <HardDrive className="w-4 h-4" /> Leve e Eficiente
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Consome menos de 3 MB de armazenamento, economizando espaço e memória no aparelho.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs">
                      <ShieldCheck className="w-4 h-4" /> Totalmente Seguro
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Criptografia HTTPS completa, conformidade LGPD e nenhuma permissão invasiva requerida.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs">
                      <Sparkles className="w-4 h-4" /> Cache Offline
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Artigos e fontes consultadas ficam guardados no aparelho para leitura sem internet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Compatível com Android 8.0+ e navegadores modernos
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
