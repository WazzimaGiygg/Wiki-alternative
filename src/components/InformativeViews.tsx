import React, { useState } from 'react';
import {
  Shield,
  Heart,
  Lock,
  FileText,
  Sparkles,
  WifiOff,
  CheckCircle,
  Mail,
  Copy,
  ExternalLink,
  Check,
  Zap,
  Layers,
  Database,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react';
import { UserProfile, WikiPage, WikiArticle } from '../types';

interface InformativeViewsProps {
  user: UserProfile | null;
  pages: WikiPage[];
  articles: WikiArticle[];
  onNavigateToArticle: (id: string) => void;
  onOpenEditor: () => void;
}

// === 1. SECURITY VIEW ===
export const SecurityView: React.FC<InformativeViewsProps> = ({ user }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Segurança e Integridade da Plataforma
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Protocolos de proteção de identidade, moderação editorial e defesa contra abusos.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase">
              <Lock size={13} className="text-teal-600" /> Status da Sua Sessão
            </h3>
            {user ? (
              <div className="space-y-1 text-xs">
                <p>Identidade conectada: <strong>{user.email}</strong></p>
                <p>Status de moderação: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● Conta Regular (Sem Restrições)</span></p>
                <p>Nível de permissão: <span className="uppercase font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded text-[10px]">{user.role}</span></p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Você está em modo visitante. Faça login com o Google para ter acesso à auditoria de edições.
              </p>
            )}
          </div>

          <h3 className="font-bold text-sm text-slate-900 dark:text-white pt-2 font-serif-heading">
            Mecanismos Ativos de Proteção:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">🛡️ Sanitização de Wikitext</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Prevenção rigorosa contra injeção de scripts (XSS) e renderização estrita de tags MediaWiki.
              </p>
            </div>
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">🛑 Moderação e Bloqueio</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Coleção de banimento (`banned_users`) para suspender contas que praticam vandalismo editorial.
              </p>
            </div>
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">📜 Auditoria Imutável</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Registro de alterações e histórico de versões para restauração instantânea.
              </p>
            </div>
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">🔐 Criptografia em Trânsito</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Tráfego cifrado via TLS 1.3 / HTTPS com cabeçalhos HSTS de alta segurança.
              </p>
            </div>
          </div>

          {/* Official Support & Tickets Card */}
          <div className="p-3.5 rounded bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded bg-indigo-600 text-white flex-shrink-0 mt-0.5 sm:mt-0">
                <LifeBuoy size={16} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Central de Suporte & Abertura de Tickets WazzimaGiygg
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Reporte incidentes de segurança, solicite desbloqueios ou abra um chamado técnico para os serviços WazzimaGiygg.
                </p>
              </div>
            </div>
            <a
              href="https://support.wazzimagiygg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <span>Abrir Ticket</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// === 2. DONATION VIEW ===
export const DonationView: React.FC<InformativeViewsProps> = () => {
  const [copiedPix, setCopiedPix] = useState(false);
  const pixKey = 'pedrohenriquecardonaperes@gmail.com';

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <Heart size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Apoie o Projeto WikiZero
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mantido por voluntários e financiado pela comunidade sem anúncios comerciais invasivos.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          <p>
            A <strong>WikiZero</strong> é uma iniciativa independente dedicada a fornecer infraestrutura gratuita para o conhecimento livre. Seus donativos ajudam a cobrir custos de servidores, domínio, tráfego de dados e desenvolvimento contínuo de novas funcionalidades.
          </p>

          {/* PIX Box */}
          <div className="p-4 rounded bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 font-mono text-xs">
                <span>💸</span> Doação via PIX (Brasil)
              </h3>
              <span className="text-[10px] font-semibold bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded">
                Instantâneo
              </span>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300">
              Chave PIX Oficial (E-mail do mantenedor do repositório):
            </p>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-rose-200 dark:border-rose-800">
              <code className="font-mono text-xs text-slate-900 dark:text-slate-100 flex-1 truncate">
                {pixKey}
              </code>
              <button
                onClick={copyPix}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1 shadow-xs"
              >
                {copiedPix ? <Check size={12} /> : <Copy size={12} />}
                {copiedPix ? 'Copiado!' : 'Copiar Chave'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <a
              href="https://support.wazzimagiygg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 transition flex items-center justify-between group"
            >
              <div>
                <span className="font-bold block text-slate-900 dark:text-white text-xs flex items-center gap-1">
                  <LifeBuoy size={13} className="text-indigo-600 dark:text-indigo-400" />
                  Suporte & Tickets
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Atendimento dos serviços WazzimaGiygg</span>
              </div>
              <ExternalLink size={14} className="text-indigo-400 group-hover:text-indigo-600" />
            </a>

            <a
              href="https://github.com/WazzimaGiygg/Wiki-alternative"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition flex items-center justify-between group"
            >
              <div>
                <span className="font-bold block text-slate-900 dark:text-white text-xs">⭐ Estrela no GitHub</span>
                <span className="text-slate-500 text-[10px]">Apoie com seu feedback no código aberto</span>
              </div>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-600" />
            </a>

            <div className="p-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold block text-slate-900 dark:text-white text-xs">🤝 Contribuição Editorial</span>
              <span className="text-slate-500 text-[10px]">Crie novos artigos e expanda o acervo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// === 3. PRIVACY POLICY VIEW (LGPD) ===
export const PrivacyPolicyView: React.FC<InformativeViewsProps> = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Política de Privacidade e Proteção de Dados (LGPD)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Conformidade total com a Lei nº 13.709/2018 e Marco Civil da Internet (Lei nº 12.965/2014).
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-wiki-body">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">1. Identificação do Controlador</h3>
          <p>
            O projeto <strong>WikiZero</strong> opera sob a governança comunitária de <em>WazzimaGiygg</em>. O encarregado oficial pelo tratamento de dados pessoais (DPO) pode ser acionado diretamente no e-mail: <code>pedrohenriquecardonaperes@gmail.com</code>.
          </p>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">2. Dados Pessoais Coletados e Finalidades</h3>
          <ul className="list-disc pl-4 space-y-0.5">
            <li><strong>Autenticação Google:</strong> nome, e-mail e foto para atribuição de autoria pública e prevenção contra vandalismo.</li>
            <li><strong>Identificador Criptográfico (UID):</strong> chave primária de associação com o banco de dados Firestore.</li>
            <li><strong>Registros de Acesso (Logs):</strong> data, hora e metadados coletados conforme exigência legal do Art. 15 do Marco Civil da Internet.</li>
          </ul>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">3. Seus Direitos (Art. 18 da LGPD) e Abertura de Tickets</h3>
          <p>
            Você pode exercer a qualquer momento seus direitos de acesso, retificação, portabilidade e revogação de consentimento através do botão "Meus Dados" no menu de navegação ou abrindo um chamado direto com a equipe de privacidade na <a href="https://support.wazzimagiygg.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold underline">Central de Tickets WazzimaGiygg</a>.
          </p>

          <div className="p-3 rounded bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-2">
              <LifeBuoy size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-700 dark:text-slate-300">
                Precisa de auxílio com seus dados ou suporte aos serviços WazzimaGiygg?
              </span>
            </div>
            <a
              href="https://support.wazzimagiygg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 shadow-xs whitespace-nowrap"
            >
              <span>Tickets & Suporte</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// === 4. TERMS OF USE VIEW ===
export const TermsOfUseView: React.FC<InformativeViewsProps> = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Termos de Uso e Licenciamento
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Diretrizes editoriais e licença GNU General Public License v3.0.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-wiki-body">
          <p>
            Ao utilizar, publicar ou editar artigos na <strong>WikiZero</strong>, você concorda em cumprir com as diretrizes de convivência e licenciamento livre.
          </p>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">1. Princípio da Verificabilidade</h3>
          <p>
            Todo o conteúdo publicado deve ser redigido de forma neutra, factual e, sempre que possível, acompanhado de referências e fontes fidedignas.
          </p>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">2. Licença GNU GPL v3.0</h3>
          <p>
            O código-fonte e os módulos do software são distribuídos sob a <strong>GNU General Public License v3.0</strong>. Você é livre para estudar, modificar e redistribuir cópias do software, desde que as modificações permaneçam sob os mesmos termos de liberdade.
          </p>
        </div>
      </div>
    </div>
  );
};

// === 5. BETA 2026 MODERN MODE VIEW ===
export const BetaModeView: React.FC<InformativeViewsProps> = ({
  pages,
  articles,
  onNavigateToArticle,
  onOpenEditor,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in select-none">
      <div className="bg-[#1e293b] text-white rounded p-5 sm:p-7 shadow-xs relative overflow-hidden border border-slate-700">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold font-mono inline-flex items-center gap-1 uppercase">
            <Sparkles size={11} className="text-amber-300" /> Experiência Beta 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading tracking-tight leading-tight">
            Navegação Semântica e Hipertextual Fluida
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Visualizador interativo de grafos e conexões entre artigos com rendering instantâneo de Wikitexto.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={onOpenEditor}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Zap size={13} /> Abrir Editor Wikitexto
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic graph nodes representation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {articles.map((art) => (
          <div
            key={art.id}
            onClick={() => onNavigateToArticle(art.id)}
            className="p-3.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-blue-500 transition cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 mb-1 font-mono">
                <span>#{art.pageUid}</span>
                <span>v{art.versao || 1}.0</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-serif-heading group-hover:text-blue-600 transition">
                {art.titulo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                {art.resumo || art.descricao.slice(0, 120)}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{art.autor}</span>
              <ArrowRight size={13} className="text-blue-500 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// === 6. OFFLINE MODE VIEW ===
export const OfflineModeView: React.FC<InformativeViewsProps> = ({ articles, pages }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <WifiOff size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Modo Offline e Cache Local
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Armazenamento em memória local (LocalStorage / IndexedDB) garantindo disponibilidade contínua.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                Todos os artigos estão salvos localmente!
              </h3>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Você pode continuar navegando, lendo e criando rascunhos mesmo sem sinal de internet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Coleções em Cache:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{pages.length}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Artigos em Cache:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{articles.length}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Sincronização:</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">Ativo & Reativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
