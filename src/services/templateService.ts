/**
 * @file templateService.ts
 * @description Serviço central para gerenciar, armazenar, validar e expandir pré-definições (templates)
 * no padrão MediaWiki ({{Nome|params}} -> {{{1}}}, {{{param|padrão}}}, <noinclude>, <includeonly>).
 * Persiste no Firestore (coleção `templates`) com cache local reativo e fallback offline.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getAuthSafe, handleFirestoreError, OperationType } from './firebase';
import { WikiTemplate, CreateTemplateInput, UpdateTemplateInput } from '../types';

const COLLECTION_NAME = 'templates';
const LOCAL_STORAGE_KEY = 'wikizero_templates_cache_v1';
const DELETED_SEEDS_STORAGE_KEY = 'wikizero_deleted_seed_templates_v1';

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  extractedParameters: string[];
}

/**
 * Nomes reservados pelo parser nativo de wikitexto (wikitextParser.ts).
 * Durante a expansão de transclusão {{...}}, estes continuam sendo renderizados
 * diretamente pelos renderizadores nativos do parser.
 */
const BUILTIN_PARSER_TEMPLATES = new Set<string>([
  'infobox',
  'ficha',
  'aviso',
  'alerta',
  'warning',
  'nota',
  'info',
  'destaque',
  'highlight',
  'esboco',
  'stub',
  'citacao',
  'quote',
  'cita',
  'userbox',
  'artigo principal',
  'ver artigo principal',
  'main',
  'ver tambem',
  'see also',
  'carece de fontes',
  'citacao necessaria',
  'cn',
  'citation needed',
  'ambox',
  'sem-fontes',
  'sem fontes',
  'mais fontes',
  'mais-fontes',
  'em construcao',
  'em edicao',
  'revisao',
  'reciclagem',
  'parcial',
  'controverso',
  'desatualizado',
  'fusao',
  'evento atual',
  'spoiler',
  'navbox',
  'caixa de navegacao',
  'portal',
  'portais',
  'hatnote',
  'nota de desambiguacao',
  'ver desambiguacao',
  'colunas',
  'columns',
  'div col',
  'desambiguacao',
  'desambig',
  'citar web',
  'cite web',
  'citar livro',
  'cite book',
  'citar jornal',
  'cite journal',
  'collapsible',
  'oculto',
  'expandir',
  'caixa expansivel',
  'reflist',
  'referencias',
]);

// Templates iniciais reutilizáveis (seed para quando o banco estiver vazio ou offline)
const SEED_TEMPLATES: WikiTemplate[] = [
  {
    id: 'tpl-dica',
    name: 'Dica',
    description: 'Bloco reutilizável para dicas rápidas e boas práticas em artigos.',
    content: `<noinclude>Uso: <code>{{Dica|título=Dica Rápida|texto=Sua orientação aqui}}</code></noinclude>{{Nota|'''{{{título|{{{1|Dica Editorial}}}}}}''' — {{{texto|{{{2|Adicione aqui uma recomendação útil para o leitor.}}}}}}}`,
    parameters: ['título', '1', 'texto', '2'],
    category: 'Formatação',
    authorName: 'Sistema WikiWorldWeb',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-cartao',
    name: 'Cartão',
    description: 'Cartão de resumo reutilizável com título, ícone e conteúdo em wikitexto.',
    content: `{{Ambox|tipo=noticia|icone={{{icone|📌}}}|título={{{título|{{{1|Cartão Informativo}}}}}}|texto={{{texto|{{{2|Escreva o conteúdo do cartão usando wikitexto normal.}}}}}}}`,
    parameters: ['icone', 'título', '1', 'texto', '2'],
    category: 'Caixas',
    authorName: 'Sistema WikiWorldWeb',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-ficha-rapida',
    name: 'FichaRápida',
    description: 'Tabela compacta de dois campos para destacar metadados no meio do artigo.',
    content: `{| class="wikitable"
! {{{rotulo1|Item}}} !! {{{rotulo2|Descrição}}}
|-
| '''{{{campo1|{{{1|Assunto}}}}}}''' || {{{valor1|{{{2|Detalhe principal}}}}}}
|}`,
    parameters: ['rotulo1', 'rotulo2', 'campo1', '1', 'valor1', '2'],
    category: 'Tabelas',
    authorName: 'Sistema WikiWorldWeb',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-aviso',
    name: 'Aviso',
    description: 'Caixa de alerta informativa personalizável para páginas estruturadas.',
    content: `<div class="my-4 p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
  <div class="flex items-center gap-2 font-bold text-sm">
    <span>⚠️</span>
    <span>{{{titulo|Aviso Importante}}}</span>
  </div>
  <div class="mt-1 text-xs text-amber-800 dark:text-amber-300">
    {{{texto|{{{content|Este artigo está passando por revisões comunitárias.}}}}}}
  </div>
</div>`,
    parameters: ['titulo', 'texto', 'content'],
    category: 'Avisos',
    authorName: 'Sistema WikiWorldWeb',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

type TemplatesListener = (templates: WikiTemplate[]) => void;

export class TemplateService {
  private static listeners = new Set<TemplatesListener>();
  private static hasSyncedFirestore = false;
  private static syncPromise: Promise<WikiTemplate[]> | null = null;

  /**
   * Normaliza o nome de exibição do template (remove prefixos Template: / Predefinição:).
   */
  public static normalizeTemplateName(name: string): string {
    return (name || '')
      .replace(/^(?:Predefini[çc][ãa]o|Template|MW)\s*:\s*/i, '')
      .trim();
  }

  /**
   * Chave canônica para comparação case-insensitive e sem acentos.
   */
  public static toLookupKey(name: string): string {
    return this.normalizeTemplateName(name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Verifica se o nome corresponde a uma predefinição nativa do parser.
   */
  public static isBuiltInParserTemplate(name: string): boolean {
    const key = this.toLookupKey(name);
    if (BUILTIN_PARSER_TEMPLATES.has(key)) return true;
    return (
      key.startsWith('infobox ') ||
      key.startsWith('infobox/') ||
      key.startsWith('info/') ||
      key.startsWith('ficha ') ||
      key.startsWith('ficha/')
    );
  }

  /**
   * Valida estrutura, nome, sintaxe MediaWiki e segurança de uma pré-definição
   * antes do armazenamento ou edição.
   */
  public static validateTemplate(input: {
    name: string;
    content: string;
    description?: string;
    allowBuiltInName?: boolean;
  }): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const cleanName = this.normalizeTemplateName(input.name || '');
    const content = input.content || '';

    if (!cleanName) {
      errors.push('O nome da pré-definição não pode ser vazio.');
    } else {
      if (cleanName.length > 100) {
        errors.push('O nome da pré-definição deve ter no máximo 100 caracteres.');
      }
      if (/[{}[\]|#<>]/.test(cleanName)) {
        errors.push('O nome da pré-definição não pode conter os caracteres { } [ ] | # < >.');
      }
      if (!input.allowBuiltInName && this.isBuiltInParserTemplate(cleanName)) {
        errors.push(
          `O nome "${cleanName}" é reservado por uma pré-definição nativa do MediaWiki. Escolha outro nome.`
        );
      }
    }

    if (!content.trim()) {
      errors.push('O conteúdo da pré-definição é obrigatório.');
    } else {
      if (content.length > 50000) {
        errors.push('O conteúdo da pré-definição excede o limite de 50.000 caracteres.');
      }
      // Segurança contra XSS em templates
      if (/<script[\s>]|javascript:|on\w+\s*=/i.test(content)) {
        errors.push('Scripts ou atributos de evento inline não são permitidos em pré-definições.');
      }

      // Verifica balanceamento de chaves {{ }} e {{{ }}}
      let braceBalance = 0;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') braceBalance++;
        else if (content[i] === '}') braceBalance--;
        if (braceBalance < 0) break;
      }
      if (braceBalance !== 0) {
        errors.push('Chaves {{ }} ou parâmetros {{{ }}} desbalanceados no conteúdo da pré-definição.');
      }

      // Verifica balanceamento básico de <noinclude> e <includeonly>
      const noincludeOpens = (content.match(/<noinclude>/gi) || []).length;
      const noincludeCloses = (content.match(/<\/noinclude>/gi) || []).length;
      if (noincludeOpens !== noincludeCloses) {
        warnings.push('Tags <noinclude> e </noinclude> parecem desbalanceadas.');
      }
      const includeonlyOpens = (content.match(/<includeonly>/gi) || []).length;
      const includeonlyCloses = (content.match(/<\/includeonly>/gi) || []).length;
      if (includeonlyOpens !== includeonlyCloses) {
        warnings.push('Tags <includeonly> e </includeonly> parecem desbalanceadas.');
      }
    }

    const extractedParameters = this.extractParameters(content);
    if (extractedParameters.length === 0 && content.trim().length > 0) {
      warnings.push('Nenhum parâmetro dinâmico ({{{1}}} ou {{{chave}}}) detectado; a pré-definição será estática.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      extractedParameters,
    };
  }

  /**
   * Extrai a lista de nomes de parâmetros presentes em um conteúdo de template.
   * Suporta parâmetros nomeados ({{{titulo|padrão}}}) e posicionais ({{{1|padrão}}}).
   */
  public static extractParameters(templateContent: string): string[] {
    if (!templateContent) return [];
    const regex = /\{\{\{([a-zA-ZÀ-ÿ0-9_\-\s]+?)(?:\||\}\}\})/g;
    const params = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(templateContent)) !== null) {
      const clean = match[1].trim();
      if (clean) params.add(clean);
    }
    return Array.from(params);
  }

  /**
   * Gera um snippet pronto para inserção no editor wikitexto.
   * Ex: {{MeuModelo|título=...|texto=...}} ou {{MeuModelo|valor1|valor2}}
   */
  public static buildInvocationSnippet(template: WikiTemplate): string {
    const cleanName = this.normalizeTemplateName(template.name);
    const params = template.parameters?.length
      ? template.parameters
      : this.extractParameters(template.content);

    const visibleParams = params.filter((p) => p !== 'content');
    if (visibleParams.length === 0) {
      return `{{${cleanName}}}`;
    }

    const namedParams = visibleParams.filter((p) => !/^\d+$/.test(p));
    if (namedParams.length > 0) {
      const pairs = namedParams.map((p) => `${p}=Valor de ${p}`);
      return `{{${cleanName}|${pairs.join('|')}}}`;
    }

    const positional = visibleParams
      .sort((a, b) => Number(a) - Number(b))
      .map((p) => `Parâmetro ${p}`);
    return `{{${cleanName}|${positional.join('|')}}}`;
  }

  /**
   * Substitui os parâmetros {{{param}}} ou {{{param|default}}} no conteúdo do template,
   * com suporte a aninhamento ({{{a|{{{b|padrão}}}}}}) e parâmetros posicionais ({{{1}}}).
   */
  public static render(
    templateContent: string,
    params: Record<string, string> = {},
    fallbackContent: string = ''
  ): string {
    const combinedParams: Record<string, string> = {
      content: fallbackContent,
      ...params,
    };

    const normalizedLookup = new Map<string, string>();
    Object.entries(combinedParams).forEach(([k, v]) => {
      normalizedLookup.set(k.trim(), v);
      normalizedLookup.set(this.toLookupKey(k), v);
    });

    // Resolve de dentro para fora para suportar {{{a|{{{b|padrão}}}}}}
    let output = templateContent;
    for (let pass = 0; pass < 6; pass++) {
      let changed = false;
      output = output.replace(
        /\{\{\{([^{}|]+?)(?:\|([^{}]*))?\}\}\}/g,
        (_match, rawName: string, defaultValue?: string) => {
          changed = true;
          const exactKey = rawName.trim();
          const normKey = this.toLookupKey(exactKey);
          const resolved =
            normalizedLookup.get(exactKey) ?? normalizedLookup.get(normKey);

          if (resolved !== undefined && resolved !== '') {
            return resolved;
          }
          if (defaultValue !== undefined) {
            return defaultValue;
          }
          return `{{{${exactKey}}}}`;
        }
      );
      if (!changed) break;
    }

    return output;
  }

  /**
   * Analisa os argumentos após o primeiro `|` em {{Nome|arg1|chave=valor}},
   * respeitando pipes dentro de [[...]] e {{...}}.
   */
  private static parseInvocationArgs(body: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!body || !body.trim()) return result;

    const parts: string[] = [];
    let current = '';
    let linkDepth = 0;
    let braceDepth = 0;

    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      const next = body[i + 1];
      if (ch === '[' && next === '[') {
        linkDepth++;
        current += '[[';
        i++;
        continue;
      }
      if (ch === ']' && next === ']' && linkDepth > 0) {
        linkDepth--;
        current += ']]';
        i++;
        continue;
      }
      if (ch === '{' && next === '{') {
        braceDepth++;
        current += '{{';
        i++;
        continue;
      }
      if (ch === '}' && next === '}' && braceDepth > 0) {
        braceDepth--;
        current += '}}';
        i++;
        continue;
      }
      if (ch === '|' && linkDepth === 0 && braceDepth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    parts.push(current);

    let positionalIndex = 1;
    for (const rawPart of parts) {
      const trimmed = rawPart.trim();
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const rawKey = trimmed.substring(0, eqIdx).trim();
        if (/^[a-zA-ZÀ-ÿ0-9_\-\s]{1,40}$/.test(rawKey)) {
          result[rawKey] = trimmed.substring(eqIdx + 1).trim();
          continue;
        }
      }
      result[String(positionalIndex)] = trimmed;
      positionalIndex++;
    }

    return result;
  }

  /**
   * Processa o wikitexto de um artigo para expandir pré-definições {{Nome|params}}
   * antes da renderização final no ArticleViewer ou WikitextEditor.
   */
  public static processWikitext(
    wikitext: string,
    customTemplates?: WikiTemplate[],
    maxDepth: number = 5
  ): string {
    return this.expandWikitextTemplates(wikitext, customTemplates, maxDepth);
  }

  /**
   * Expande invocações de pré-definições customizadas {{NomeDaPredefinição|parâmetro}}
   * em um texto wikitexto, com suporte a recursão controlada, parâmetros posicionais/nomeados
   * e diretivas MediaWiki <noinclude> / <includeonly>.
   */
  public static expandWikitextTemplates(
    wikitext: string,
    customTemplates?: WikiTemplate[],
    maxDepth: number = 5
  ): string {
    if (!wikitext || !wikitext.includes('{{')) return wikitext;

    const templates = customTemplates ?? this.getCachedTemplatesSync();
    if (!templates || templates.length === 0) return wikitext;

    const templateMap = new Map<string, WikiTemplate>();
    for (const tpl of templates) {
      if (!tpl || !tpl.name) continue;
      const key = this.toLookupKey(tpl.name);
      if (!this.isBuiltInParserTemplate(key)) {
        templateMap.set(key, tpl);
      }
    }

    if (templateMap.size === 0) return wikitext;

    const expandPass = (input: string, depth: number, activeStack: Set<string>): string => {
      if (depth >= maxDepth || !input.includes('{{')) return input;

      let result = '';
      let i = 0;

      while (i < input.length) {
        if (input[i] === '<') {
          const lowerTail = input.slice(i, i + 18).toLowerCase();
          if (lowerTail.startsWith('<nowiki>')) {
            const closeIdx = input.toLowerCase().indexOf('</nowiki>', i + 8);
            if (closeIdx !== -1) {
              result += input.slice(i, closeIdx + 9);
              i = closeIdx + 9;
              continue;
            }
          } else if (/^<(?:pre|syntaxhighlight)(?:\s|>)/i.test(lowerTail)) {
            const tagName = lowerTail.startsWith('<pre') ? 'pre' : 'syntaxhighlight';
            const closeIdx = input.toLowerCase().indexOf(`</${tagName}>`, i + tagName.length + 1);
            if (closeIdx !== -1) {
              const endPos = closeIdx + tagName.length + 3;
              result += input.slice(i, endPos);
              i = endPos;
              continue;
            }
          }
        }

        if (input.slice(i, i + 3) === '```') {
          const closeFence = input.indexOf('```', i + 3);
          if (closeFence !== -1) {
            result += input.slice(i, closeFence + 3);
            i = closeFence + 3;
            continue;
          }
        }

        if (input[i] === '`') {
          const nlIdx = input.indexOf('\n', i + 1);
          const closeTick = input.indexOf('`', i + 1);
          if (closeTick !== -1 && (nlIdx === -1 || closeTick < nlIdx)) {
            result += input.slice(i, closeTick + 1);
            i = closeTick + 1;
            continue;
          }
        }

        if (input[i] === '{' && input[i + 1] === '{' && input[i + 2] === '{') {
          result += '{{{';
          i += 3;
          continue;
        }

        if (input[i] === '{' && input[i + 1] === '{') {
          let braceDepth = 1;
          let j = i + 2;
          while (j < input.length && braceDepth > 0) {
            if (input[j] === '{' && input[j + 1] === '{') {
              braceDepth++;
              j += 2;
            } else if (input[j] === '}' && input[j + 1] === '}') {
              braceDepth--;
              j += 2;
            } else {
              j++;
            }
          }

          if (braceDepth === 0) {
            const inner = input.substring(i + 2, j - 2);
            const firstPipe = inner.indexOf('|');
            const rawName = (firstPipe === -1 ? inner : inner.substring(0, firstPipe)).trim();
            const rawBody = firstPipe === -1 ? '' : inner.substring(firstPipe + 1);

            if (!rawName.startsWith('#')) {
              const lookupKey = this.toLookupKey(rawName);
              const matched = templateMap.get(lookupKey);

              if (matched && !activeStack.has(lookupKey)) {
                const args = this.parseInvocationArgs(rawBody);
                // Na transclusão MediaWiki: remove <noinclude>...</noinclude> e mantém <includeonly>...</includeonly>
                let transcludedBody = matched.content
                  .replace(/<noinclude>[\s\S]*?<\/noinclude>/gi, '')
                  .replace(/<\/?includeonly>/gi, '');

                transcludedBody = this.render(transcludedBody, args, args['1'] || '');

                const nextStack = new Set(activeStack);
                nextStack.add(lookupKey);
                result += expandPass(transcludedBody, depth + 1, nextStack);
                i = j;
                continue;
              }
            }

            if (firstPipe !== -1 && rawBody.includes('{{')) {
              const expandedBody = expandPass(rawBody, depth + 1, activeStack);
              result += `{{${rawName}|${expandedBody}}}`;
            } else {
              result += input.substring(i, j);
            }
            i = j;
            continue;
          }
        }

        result += input[i];
        i++;
      }

      return result;
    };

    return expandPass(wikitext, 0, new Set<string>());
  }

  /**
   * Retorna imediatamente a lista de templates em cache local (para uso síncrono no parser).
   */
  public static getCachedTemplatesSync(): WikiTemplate[] {
    return this.getFromLocalCache();
  }

  /**
   * Inscreve um componente React para receber atualizações sempre que templates forem
   * carregados do Firestore ou criados/editados/excluídos.
   */
  public static subscribe(listener: TemplatesListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    const snapshot = this.getFromLocalCache();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch {
        // ignore listener errors
      }
    });
  }

  /**
   * Sincroniza os templates do Firestore uma vez (ou sob demanda) e notifica os ouvintes.
   */
  public static async refreshFromFirestore(force: boolean = false): Promise<WikiTemplate[]> {
    if (this.hasSyncedFirestore && !force) {
      return this.getFromLocalCache();
    }
    if (this.syncPromise && !force) {
      return this.syncPromise;
    }

    this.syncPromise = this.listTemplates()
      .then((list) => {
        this.hasSyncedFirestore = true;
        this.notifyListeners();
        return list;
      })
      .finally(() => {
        this.syncPromise = null;
      });

    return this.syncPromise;
  }

  /**
   * Cria um novo template na coleção do Firestore (com validação e cache local imediato).
   */
  public static async createTemplate(input: CreateTemplateInput): Promise<WikiTemplate> {
    const validation = this.validateTemplate({
      name: input.name,
      content: input.content,
      description: input.description,
    });
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    const cleanName = this.normalizeTemplateName(input.name);
    const templateId = `tpl-${this.toLookupKey(cleanName).replace(/[^a-z0-9_-]/g, '-')}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const auth = getAuthSafe();
    const currentUser = auth?.currentUser;

    const newTemplate: WikiTemplate = {
      id: templateId,
      name: cleanName,
      content: input.content,
      description: (input.description || '').trim(),
      parameters: validation.extractedParameters,
      category: input.category || 'Geral',
      authorUid: input.authorUid || currentUser?.uid || 'anonymous',
      authorName: input.authorName || currentUser?.displayName || 'Editor WikiWorldWeb',
      createdAt: now,
      updatedAt: now,
    };

    this.unmarkSeedDeleted(newTemplate.id, newTemplate.name);
    this.saveToLocalCache(newTemplate);
    this.notifyListeners();

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, templateId);
      await setDoc(docRef, {
        ...newTemplate,
        _serverTimestamp: serverTimestamp(),
      });
      return newTemplate;
    } catch (error) {
      console.warn('[templateService] Erro ao salvar template no Firestore, mantido em cache local:', error);
      return newTemplate;
    }
  }

  /**
   * Obtém um template pelo ID ou pelo Nome (busca exata ou case-insensitive).
   */
  public static async getTemplate(nameOrId: string): Promise<WikiTemplate | null> {
    if (!nameOrId || !nameOrId.trim()) return null;

    const normalizedKey = this.toLookupKey(nameOrId);

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, nameOrId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as WikiTemplate;
        this.saveToLocalCache(data);
        return data;
      }

      const q = query(collection(db, COLLECTION_NAME), where('name', '==', nameOrId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const data = querySnap.docs[0].data() as WikiTemplate;
        this.saveToLocalCache(data);
        return data;
      }
    } catch (error) {
      console.warn('[templateService] Erro ao buscar template no Firestore, consultando cache:', error);
    }

    const cachedList = this.getFromLocalCache();
    const found = cachedList.find(
      (t) => t.id === nameOrId || this.toLookupKey(t.name) === normalizedKey
    );

    return found || null;
  }

  /**
   * Atualiza um template existente no Firestore e no cache local (com validação).
   */
  public static async updateTemplate(id: string, input: UpdateTemplateInput): Promise<WikiTemplate> {
    const existing = await this.getTemplate(id);
    if (!existing) {
      throw new Error(`Predefinição com ID "${id}" não foi encontrada.`);
    }

    const updatedName = input.name ? this.normalizeTemplateName(input.name) : existing.name;
    const updatedContent = input.content !== undefined ? input.content : existing.content;

    const validation = this.validateTemplate({
      name: updatedName,
      content: updatedContent,
      description: input.description ?? existing.description,
      allowBuiltInName: this.isBuiltInParserTemplate(existing.name),
    });
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    const updatedTemplate: WikiTemplate = {
      ...existing,
      name: updatedName,
      content: updatedContent,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      category: input.category !== undefined ? input.category : existing.category,
      parameters: validation.extractedParameters,
      updatedAt: new Date().toISOString(),
    };

    this.saveToLocalCache(updatedTemplate);
    this.notifyListeners();

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      const auth = getAuthSafe();
      const currentUser = auth?.currentUser;
      try {
        await updateDoc(docRef, {
          name: updatedTemplate.name,
          content: updatedTemplate.content,
          description: updatedTemplate.description,
          category: updatedTemplate.category,
          parameters: updatedTemplate.parameters,
          updatedAt: updatedTemplate.updatedAt,
          _serverTimestamp: serverTimestamp(),
        });
      } catch (updateErr) {
        const errCode = (updateErr as { code?: string })?.code;
        if (errCode === 'not-found' || (updateErr instanceof Error && updateErr.message.includes('No document to update'))) {
          await setDoc(docRef, {
            ...updatedTemplate,
            authorUid: updatedTemplate.authorUid || currentUser?.uid || 'anonymous',
            _serverTimestamp: serverTimestamp(),
          });
        } else {
          throw updateErr;
        }
      }
      return updatedTemplate;
    } catch (error) {
      console.warn('[templateService] Erro ao atualizar template no Firestore, mantido em cache local:', error);
      return updatedTemplate;
    }
  }

  /**
   * Exclui um template pelo ID.
   */
  public static async deleteTemplate(id: string): Promise<boolean> {
    const existing = this.getFromLocalCache().find((t) => t && t.id === id);
    this.markSeedDeleted(id, existing?.name);
    this.deleteFromLocalCache(id);
    this.notifyListeners();

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.warn('[templateService] Erro ao excluir template no Firestore:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
      }
      return true;
    }
  }

  /**
   * Restaura as pré-definições padrão do sistema que tenham sido removidas localmente.
   */
  public static async restoreDefaultTemplates(): Promise<WikiTemplate[]> {
    try {
      localStorage.removeItem(DELETED_SEEDS_STORAGE_KEY);
    } catch {
      // ignore
    }
    for (const seed of SEED_TEMPLATES) {
      const exists = this.getFromLocalCache().some(
        (t) => t && (t.id === seed.id || this.toLookupKey(t.name) === this.toLookupKey(seed.name))
      );
      if (!exists) {
        this.saveToLocalCache(seed);
      }
    }
    this.notifyListeners();
    return this.getFromLocalCache();
  }

  /**
   * Retorna quantos modelos padrão do sistema foram removidos e podem ser restaurados.
   */
  public static getDeletedDefaultSeedsCount(): number {
    const deletedKeys = this.getDeletedSeedKeys();
    if (deletedKeys.size === 0) return 0;
    return SEED_TEMPLATES.filter(
      (seed) => deletedKeys.has(seed.id) || deletedKeys.has(this.toLookupKey(seed.name))
    ).length;
  }

  /**
   * Lista todos os templates registrados (mesclando Firestore + cache local/seeds),
   * opcionalmente filtrando por categoria.
   */
  public static async listTemplates(category?: string): Promise<WikiTemplate[]> {
    try {
      const db = getDb();
      let q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
      if (category) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('category', '==', category),
          orderBy('name', 'asc')
        );
      }

      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteTemplates = snap.docs.map((d) => ({
          ...(d.data() as WikiTemplate),
          id: (d.data() as WikiTemplate).id || d.id,
        }));
        remoteTemplates.forEach((t) => this.saveToLocalCache(t));
      }
    } catch (error) {
      console.warn('[templateService] Erro ao listar templates do Firestore, usando cache:', error);
    }

    const local = this.getFromLocalCache();
    if (category) {
      return (local || []).filter((t) => t && t.category?.toLowerCase() === category.toLowerCase());
    }
    return Array.isArray(local) ? local : SEED_TEMPLATES;
  }

  // ==========================================
  // MÉTODOS PRIVADOS DE CACHE LOCAL
  // ==========================================

  private static getDeletedSeedKeys(): Set<string> {
    try {
      const raw = localStorage.getItem(DELETED_SEEDS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed.filter((item): item is string => typeof item === 'string'));
        }
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  }

  private static markSeedDeleted(id: string, name?: string): void {
    const matchingSeed = SEED_TEMPLATES.find(
      (s) => s.id === id || (name ? this.toLookupKey(s.name) === this.toLookupKey(name) : false)
    );
    if (!matchingSeed) return;
    const keys = this.getDeletedSeedKeys();
    keys.add(matchingSeed.id);
    keys.add(this.toLookupKey(matchingSeed.name));
    try {
      localStorage.setItem(DELETED_SEEDS_STORAGE_KEY, JSON.stringify(Array.from(keys)));
    } catch {
      // ignore
    }
  }

  private static unmarkSeedDeleted(id: string, name?: string): void {
    const keys = this.getDeletedSeedKeys();
    if (keys.size === 0) return;
    let changed = keys.delete(id);
    if (name && keys.delete(this.toLookupKey(name))) {
      changed = true;
    }
    if (changed) {
      try {
        localStorage.setItem(DELETED_SEEDS_STORAGE_KEY, JSON.stringify(Array.from(keys)));
      } catch {
        // ignore
      }
    }
  }

  private static getFromLocalCache(): WikiTemplate[] {
    const deletedSeeds = this.getDeletedSeedKeys();
    const activeSeeds = SEED_TEMPLATES.filter(
      (seed) => !deletedSeeds.has(seed.id) && !deletedSeeds.has(this.toLookupKey(seed.name))
    );

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const merged = [...parsed];
          for (const seed of activeSeeds) {
            if (!merged.some((t) => t && this.toLookupKey(t.name) === this.toLookupKey(seed.name))) {
              merged.push(seed);
            }
          }
          return merged;
        }
      }
    } catch {
      // Ignora erro de JSON
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activeSeeds));
    } catch {
      // ignore
    }
    return [...activeSeeds];
  }

  private static saveToLocalCache(template: WikiTemplate): void {
    const list = [...this.getFromLocalCache()];
    const idx = list.findIndex(
      (t) => t && (t.id === template.id || this.toLookupKey(t.name) === this.toLookupKey(template.name))
    );
    if (idx >= 0) {
      list[idx] = template;
    } else {
      list.push(template);
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore storage quota errors
    }
  }

  private static deleteFromLocalCache(id: string): void {
    const list = (this.getFromLocalCache() || []).filter((t) => t && t.id !== id);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

/**
 * Instância singleton conveniente para importação como `import { templateService } from '../services/templateService'`
 */
export const templateService = {
  normalizeTemplateName: (name: string) => TemplateService.normalizeTemplateName(name),
  toLookupKey: (name: string) => TemplateService.toLookupKey(name),
  isBuiltInParserTemplate: (name: string) => TemplateService.isBuiltInParserTemplate(name),
  validateTemplate: (input: Parameters<typeof TemplateService.validateTemplate>[0]) =>
    TemplateService.validateTemplate(input),
  extractParameters: (templateContent: string) => TemplateService.extractParameters(templateContent),
  buildInvocationSnippet: (template: WikiTemplate) => TemplateService.buildInvocationSnippet(template),
  render: (templateContent: string, params?: Record<string, string>, fallbackContent?: string) =>
    TemplateService.render(templateContent, params, fallbackContent),
  processWikitext: (wikitext: string, customTemplates?: WikiTemplate[], maxDepth?: number) =>
    TemplateService.processWikitext(wikitext, customTemplates, maxDepth),
  expandWikitextTemplates: (wikitext: string, customTemplates?: WikiTemplate[], maxDepth?: number) =>
    TemplateService.expandWikitextTemplates(wikitext, customTemplates, maxDepth),
  getCachedTemplatesSync: () => TemplateService.getCachedTemplatesSync(),
  subscribe: (listener: TemplatesListener) => TemplateService.subscribe(listener),
  refreshFromFirestore: (force?: boolean) => TemplateService.refreshFromFirestore(force),
  createTemplate: (input: CreateTemplateInput) => TemplateService.createTemplate(input),
  getTemplate: (nameOrId: string) => TemplateService.getTemplate(nameOrId),
  updateTemplate: (id: string, input: UpdateTemplateInput) => TemplateService.updateTemplate(id, input),
  deleteTemplate: (id: string) => TemplateService.deleteTemplate(id),
  listTemplates: (category?: string) => TemplateService.listTemplates(category),
  restoreDefaultTemplates: () => TemplateService.restoreDefaultTemplates(),
  getDeletedDefaultSeedsCount: () => TemplateService.getDeletedDefaultSeedsCount(),
};

export default templateService;
