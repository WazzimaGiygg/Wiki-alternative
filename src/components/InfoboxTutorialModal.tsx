import React, { useMemo, useState } from 'react';
import {
  X,
  BookOpen,
  LayoutTemplate,
  SlidersHorizontal,
  Copy,
  Check,
  Search,
  Plus,
  Eye,
  Code2,
} from 'lucide-react';
import {
  INFOBOX_TEMPLATES,
  INFOBOX_VARIABLES_REFERENCE,
  InfoboxCategory,
  InfoboxTemplatePreset,
} from '../utils/infoboxCatalog';
import { parseWikitext } from '../utils/wikitextParser';
import { sanitizeHtml } from '../utils/sanitizeHtml';

export type InfoboxModalTab = 'tutorial' | 'catalog' | 'variables';

interface InfoboxTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InfoboxModalTab;
  initialTemplateId?: string;
  defaultTitle?: string;
  onInsertWikitext?: (snippet: string) => void;
}

const CATEGORIES: InfoboxCategory[] = [
  'Todos',
  'Usuário & Comunidade',
  'Enciclopédia & Geografia',
  'Tecnologia & Software',
  'Cultura & Mídia',
  'Ciência & Academia',
  'Organizações & Eventos',
];

const TUTORIAL_USER_EXAMPLE = `{{Info/Usuário
| Nome = Exemplo_Editor
| Subtítulo = Conta Oficial · WikiWorldWeb
| Cor = azul
| Ícone = 👤
| Seção1 = Identificação da Conta
| Usuário = @Exemplo_Editor
| Cargo = Editor(a) Verificado(a)
| Status = Ativo
| Localização = Brasil
| Seção2 = Colaboração
| Idiomas = Português, Inglês
| Áreas de interesse = História, Ciência, Tecnologia
| Rodapé = Personalize os campos editando sua Página de Usuário
}}`;

export const InfoboxTutorialModal: React.FC<InfoboxTutorialModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'tutorial',
  initialTemplateId = 'usuario',
  defaultTitle,
  onInsertWikitext,
}) => {
  const [activeTab, setActiveTab] = useState<InfoboxModalTab>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<InfoboxCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<InfoboxTemplatePreset>(
    () => INFOBOX_TEMPLATES.find((t) => t.id === initialTemplateId) || INFOBOX_TEMPLATES[0]
  );
  const [customSnippet, setCustomSnippet] = useState<string>(() => {
    const found = INFOBOX_TEMPLATES.find((t) => t.id === initialTemplateId) || INFOBOX_TEMPLATES[0];
    return found.buildSnippet(defaultTitle);
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INFOBOX_TEMPLATES.filter((tpl) => {
      const matchesCat = selectedCategory === 'Todos' || tpl.category === selectedCategory;
      const matchesSearch =
        !q ||
        tpl.label.toLowerCase().includes(q) ||
        tpl.templateName.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const tutorialPreviewHtml = useMemo(() => {
    return sanitizeHtml(parseWikitext(TUTORIAL_USER_EXAMPLE).html);
  }, []);

  const catalogPreviewHtml = useMemo(() => {
    return sanitizeHtml(parseWikitext(customSnippet).html);
  }, [customSnippet]);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl: InfoboxTemplatePreset) => {
    setSelectedTemplate(tpl);
    setCustomSnippet(tpl.buildSnippet(defaultTitle));
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback silencioso
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInsert = (snippet: string) => {
    if (onInsertWikitext) {
      onInsertWikitext(snippet);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial e Catálogo de Infoboxes da WikiWorldWeb"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              Guia de Infoboxes &amp; Modelos da WikiWorldWeb
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aprenda como usar o Infobox de Usuário e insira fichas estruturadas com variáveis personalizadas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar guia de infoboxes"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Abas do guia de infobox"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'tutorial'}
              onClick={() => setActiveTab('tutorial')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'tutorial'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen size={14} />
              <span>Tutorial Passo a Passo</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'catalog'}
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutTemplate size={14} />
              <span>Tipos de Infobox ({INFOBOX_TEMPLATES.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'variables'}
              onClick={() => setActiveTab('variables')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'variables'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Variáveis ({INFOBOX_VARIABLES_REFERENCE.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Sintaxe MediaWiki · Compatível com Perfil e Artigos
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: TUTORIAL */}
          {activeTab === 'tutorial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Como funciona o Infobox na WikiWorldWeb
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      O <strong>Infobox</strong> é o cartão estruturado exibido na lateral de uma página de usuário ou
                      artigo enciclopédico. Toda nova conta criada recebe automaticamente um{' '}
                      <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {'{{Info/Usuário}}'}
                      </code>{' '}
                      para identificação pública clara.
                    </p>
                  </div>

                  <ol className="space-y-4 divide-y divide-slate-200 dark:divide-slate-800">
                    <li className="pt-0 space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        01. Abra e feche o bloco com chaves duplas
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Inicie com <code className="font-mono text-xs">{'{{Info/Usuário'}</code> (ou qualquer tipo como{' '}
                        <code className="font-mono text-xs">{'{{Info/Software'}</code>,{' '}
                        <code className="font-mono text-xs">{'{{Info/País'}</code>,{' '}
                        <code className="font-mono text-xs">{'{{Infobox'}</code>) e finalize com{' '}
                        <code className="font-mono text-xs">{'}}'}</code>.
                      </p>
                    </li>

                    <li className="pt-4 space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        02. Adicione variáveis no formato | Campo = Valor
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Cada linha começa com barra vertical (<code className="font-mono text-xs">|</code>). Você pode
                        usar variáveis visuais (<code className="font-mono text-xs">Cor</code>,{' '}
                        <code className="font-mono text-xs">Ícone</code>,{' '}
                        <code className="font-mono text-xs">Imagem</code>,{' '}
                        <code className="font-mono text-xs">Imagem_Forma = circulo</code>,{' '}
                        <code className="font-mono text-xs">Largura</code>,{' '}
                        <code className="font-mono text-xs">Alinhamento</code>,{' '}
                        <code className="font-mono text-xs">Rodapé</code>) e criar qualquer campo personalizado.
                      </p>
                    </li>

                    <li className="pt-4 space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        03. Organize em seções e use formatação Wikitexto
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Use <code className="font-mono text-xs">| Seção1 = Identificação</code> e{' '}
                        <code className="font-mono text-xs">| Seção2 = Colaboração</code> para criar divisórias. Os
                        valores aceitam links internos <code className="font-mono text-xs">[[Artigo]]</code>, negrito{' '}
                        <code className="font-mono text-xs">'''texto'''</code>, <code className="font-mono text-xs">Status</code>,{' '}
                        <code className="font-mono text-xs">Progresso = 80%</code> e listas separadas por vírgula em{' '}
                        <code className="font-mono text-xs">Idiomas</code> ou <code className="font-mono text-xs">Tags</code>.
                      </p>
                    </li>

                    <li className="pt-4 space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        04. Privacidade e LGPD no Infobox de Usuário
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Em conformidade com a política de proteção de dados da WikiWorldWeb, prefira seu pseudônimo de
                        editor, idiomas e áreas de interesse — nunca publique documentos civis, telefone ou endereço
                        residencial no infobox.
                      </p>
                    </li>
                  </ol>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                        <Code2 size={14} className="text-blue-600 dark:text-blue-400" />
                        <span>Exemplo completo de Info/Usuário</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy('tutorial-user', TUTORIAL_USER_EXAMPLE)}
                          className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {copiedKey === 'tutorial-user' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          <span>{copiedKey === 'tutorial-user' ? 'Copiado' : 'Copiar'}</span>
                        </button>
                        {onInsertWikitext && (
                          <button
                            type="button"
                            onClick={() => handleInsert(TUTORIAL_USER_EXAMPLE)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Plus size={12} />
                            <span>Inserir exemplo</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {TUTORIAL_USER_EXAMPLE}
                    </pre>
                  </div>
                </div>

                {/* Live rendered preview */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                    <Eye size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Resultado renderizado na página</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 flex justify-center overflow-x-auto">
                    <div
                      className="w-full flex justify-center [&_.wiki-infobox]:float-none [&_.wiki-infobox]:ml-0 [&_.wiki-infobox]:mb-0"
                      dangerouslySetInnerHTML={{ __html: tutorialPreviewHtml }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('catalog')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Explorar todos os {INFOBOX_TEMPLATES.length} modelos de Infobox →
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('variables')}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                    >
                      Ver variáveis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-5">
              {/* Filter & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar tipo de infobox..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Split View: Template List + Live Editor/Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredTemplates.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center">
                      Nenhum modelo encontrado para "{searchQuery}".
                    </div>
                  ) : (
                    filteredTemplates.map((tpl) => {
                      const isActive = tpl.id === selectedTemplate.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tpl)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                            isActive
                              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {tpl.label}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                              {tpl.templateName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                            {tpl.description}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Editable Code */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Código Wikitexto ({selectedTemplate.templateName})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCustomSnippet(selectedTemplate.buildSnippet(defaultTitle))}
                        className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                      >
                        Restaurar modelo
                      </button>
                    </div>
                    <textarea
                      value={customSnippet}
                      onChange={(e) => setCustomSnippet(e.target.value)}
                      rows={15}
                      aria-label="Código Wikitexto do infobox selecionado"
                      className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {onInsertWikitext && (
                        <button
                          type="button"
                          onClick={() => handleInsert(customSnippet)}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Plus size={14} />
                          <span>Inserir no Editor</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(`tpl-${selectedTemplate.id}`, customSnippet)}
                        className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedKey === `tpl-${selectedTemplate.id}` ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                        <span>{copiedKey === `tpl-${selectedTemplate.id}` ? 'Copiado' : 'Copiar código'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Pré-visualização em tempo real
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3 min-h-[340px] flex items-start justify-center overflow-x-auto">
                      <div
                        className="w-full flex justify-center [&_.wiki-infobox]:float-none [&_.wiki-infobox]:ml-0 [&_.wiki-infobox]:mr-0 [&_.wiki-infobox]:mb-0"
                        dangerouslySetInnerHTML={{ __html: catalogPreviewHtml }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VARIABLES REFERENCE */}
          {activeTab === 'variables' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Variáveis suportadas em todos os Infoboxes
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Todas as variáveis abaixo funcionam em{' '}
                  <code className="font-mono text-xs">{'{{Infobox}}'}</code>,{' '}
                  <code className="font-mono text-xs">{'{{Info/Usuário}}'}</code>,{' '}
                  <code className="font-mono text-xs">{'{{Info/*}}'}</code> e{' '}
                  <code className="font-mono text-xs">{'{{Ficha*}}'}</code>.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                      <th className="py-2.5 px-3 font-semibold">Variável</th>
                      <th className="py-2.5 px-3 font-semibold">Aliases aceitos</th>
                      <th className="py-2.5 px-3 font-semibold">Exemplo de uso</th>
                      <th className="py-2.5 px-3 font-semibold">Comportamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {INFOBOX_VARIABLES_REFERENCE.map((v) => (
                      <tr key={v.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                          {v.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {v.aliases}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {v.example}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                          {v.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
