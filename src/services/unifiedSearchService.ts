/**
 * @file unifiedSearchService.ts
 * @description Serviço de Busca Unificada com suporte a prefixos e tags por setor (Requisito 3.05.6.c).
 *
 * Setores e Prefixos Suportados:
 * - "User:" (ou "Usuário:")      -> Busca por Usuários cadastrados, editores e burocratas.
 * - "Skin:" (ou "Theme:", "Tema:", "Aparência:") -> Busca por Aparências, Skins e Temas visuais.
 * - "Diff:" (ou "Commit:", "Mudança:")           -> Busca por Diffs de código, commits do GitHub e patches de versão.
 * - "Collection:" (ou "Coleção:")                -> Busca por Coleções temáticas e hubs da enciclopédia.
 * - "Article:" (ou "Artigo:")                    -> Busca restrita a artigos enciclopédicos.
 * - Sem prefixo (Tudo)                          -> Busca unificada simultânea em todos os setores com agrupamento inteligente.
 */

import { WikiArticle, WikiPage, UserProfile, AppTheme, SystemUpdateEntry } from '../types';
import { GitHubCommitSummary } from './githubDiffService';

export type SearchSector = 'all' | 'user' | 'skin' | 'diff' | 'collection' | 'article';

export interface SearchSectorInfo {
  id: SearchSector;
  prefix: string;
  aliases: string[];
  label: string;
  shortLabel: string;
  description: string;
  badgeColor: string;
  iconName: string;
}

export const SEARCH_SECTORS: Record<SearchSector, SearchSectorInfo> = {
  all: {
    id: 'all',
    prefix: '',
    aliases: ['tudo', 'all'],
    label: 'Busca Global Unificada',
    shortLabel: 'Tudo',
    description: 'Pesquise simultaneamente em artigos, usuários, skins, diffs e coleções',
    badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    iconName: 'Globe',
  },
  user: {
    id: 'user',
    prefix: 'User:',
    aliases: ['user:', 'usuário:', 'usuario:', 'u:', 'autor:', 'editor:'],
    label: 'Usuários & Perfis',
    shortLabel: 'User: Usuários',
    description: 'Encontre editores, burocratas, administradores e membros da comunidade',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    iconName: 'User',
  },
  skin: {
    id: 'skin',
    prefix: 'Skin:',
    aliases: ['skin:', 'theme:', 'tema:', 'aparência:', 'aparencia:', 'estilo:', 's:'],
    label: 'Aparências & Temas (Skins)',
    shortLabel: 'Skin: Temas',
    description: 'Descubra e ative temas retrôs, modernos e interfaces personalizadas',
    badgeColor: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    iconName: 'Palette',
  },
  diff: {
    id: 'diff',
    prefix: 'Diff:',
    aliases: ['diff:', 'commit:', 'mudança:', 'mudanca:', 'patch:', 'log:', 'd:'],
    label: 'Diffs de Código & Commits',
    shortLabel: 'Diff: Commits',
    description: 'Inspecione histórico de código, commits do GitHub e notas de atualização',
    badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    iconName: 'GitCommit',
  },
  collection: {
    id: 'collection',
    prefix: 'Collection:',
    aliases: ['collection:', 'coleção:', 'colecao:', 'hub:', 'tópico:', 'topico:', 'c:'],
    label: 'Coleções & Hubs Temáticos',
    shortLabel: 'Collection: Coleções',
    description: 'Navegue por tópicos editoriais, categorias estruturadas e acervos',
    badgeColor: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    iconName: 'Folder',
  },
  article: {
    id: 'article',
    prefix: 'Article:',
    aliases: ['article:', 'artigo:', 'página:', 'pagina:', 'a:'],
    label: 'Artigos da Enciclopédia',
    shortLabel: 'Article: Artigos',
    description: 'Verbetes enciclopédicos, resumos, biografias e produções acadêmicas',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    iconName: 'FileText',
  },
};

/**
 * Catálogo canônico de temas e skins pesquisáveis
 */
export interface ThemeCatalogItem {
  id: AppTheme;
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  accentColor: string;
  category: 'classic' | 'retro' | 'gaming' | 'modern' | 'minimal';
  era?: string;
  features?: string[];
}

export const THEME_SEARCH_CATALOG: ThemeCatalogItem[] = [
  {
    id: 'light',
    name: 'WikiWorldWeb Clássico Claro',
    subtitle: 'Padrão Wikipédia & Wikimedia',
    description: 'Design enciclopédico atemporal com fundo branco, contraste balanceado para leitura e tipografia limpa.',
    tags: ['clássico', 'padrão', 'claro', 'wikipedia', 'wikimedia', 'light'],
    accentColor: '#2563eb',
    category: 'classic',
    era: 'Moderna',
    features: ['Alto contraste', 'Leitura prolongada', 'Padrão enciclopédico'],
  },
  {
    id: 'dark',
    name: 'WikiWorldWeb Modo Escuro',
    subtitle: 'Alto Contraste Noturno',
    description: 'Tons grafite e ardósia profunda que reduzem a fadiga ocular em ambientes de pouca luz.',
    tags: ['escuro', 'noturno', 'dark', 'preto', 'oled', 'grafite'],
    accentColor: '#38bdf8',
    category: 'classic',
    era: 'Moderna',
    features: ['Descanso visual', 'Economia de bateria', 'OLED Friendly'],
  },
  {
    id: 'google',
    name: 'Google Material You Claro',
    subtitle: 'Google Design System M3',
    description: 'Paleta multicolorida do Google (azul, vermelho, amarelo e verde) com cantos arredondados suaves e sombras elegantes.',
    tags: ['google', 'material you', 'm3', 'colorido', 'moderno'],
    accentColor: '#4285F4',
    category: 'modern',
    era: '2024+',
    features: ['Material Design 3', 'Paleta Tetracromática Google', 'Cantos circulares'],
  },
  {
    id: 'google-dark',
    name: 'Google Material You Escuro',
    subtitle: 'Google Dark Charcoal',
    description: 'Visual noturno no estilo Google Dark (#202124), com cartões flutuantes elevados e acentos suaves.',
    tags: ['google', 'dark', 'material you', 'escuro', 'noturno'],
    accentColor: '#8ab4f8',
    category: 'modern',
    era: '2024+',
    features: ['Google Charcoal #202124', 'Acentos pastéis suaves', 'Efeito elevação'],
  },
  {
    id: 'win1',
    name: 'Windows 1.0 (1985)',
    subtitle: 'MS-DOS Executive & Paleta EGA 1985',
    description: 'A histórica primeira versão do Windows de 1985: janelas lado a lado sem sobreposição, barra de título azul sólido (#0000aa) com caixa [-] e fundo teal.',
    tags: ['windows 1.0', 'win1', '1985', 'ms-dos', 'ega', 'retrô', 'vintage'],
    accentColor: '#0000aa',
    category: 'retro',
    era: '1985',
    features: ['Janelas lado a lado', 'Paleta EGA autêntica', 'MS-DOS Executive'],
  },
  {
    id: 'win31',
    name: 'Windows 3.1 (1992)',
    subtitle: 'Program Manager & Paleta VGA 16 Cores',
    description: 'A interface histórica do Windows 3.1: Program Manager (PROGMAN.EXE), janelas chanfradas 3D, fundo teal (#008080) e fanfarra TADA.WAV.',
    tags: ['windows 3.1', 'win31', '1992', 'vga', 'tada', 'program manager', 'retrô'],
    accentColor: '#000080',
    category: 'retro',
    era: '1992',
    features: ['Boot TADA.WAV', 'Janelas 3D chanfradas', 'Ícones clássicos 16 cores'],
  },
  {
    id: 'win95',
    name: 'Windows 95 Retrô OS',
    subtitle: 'Nostalgia dos Anos 90 com Clippy Bot',
    description: 'Visual autêntico do clássico Windows 95, com barras de título azul marinho, bordas 3D chanfradas, botão Iniciar e o Assistente Clippy integrado.',
    tags: ['windows 95', 'win95', '1995', 'clippy', 'botão iniciar', 'nostalgia', 'retrô'],
    accentColor: '#000080',
    category: 'retro',
    era: '1995',
    features: ['Clippy Bot animado', 'Barra de tarefas clássica', 'Sons de inicialização'],
  },
  {
    id: 'winxp',
    name: 'Windows XP Luna Blue (2001)',
    subtitle: 'Nostalgia do Windows XP, Luna & Bliss',
    description: 'A lendária interface Luna Blue do Windows XP: barras azuis brilhantes, botão fechar vermelho, botão Iniciar verde e papel de parede Bliss.',
    tags: ['windows xp', 'winxp', '2001', 'luna', 'bliss', 'nostalgia', 'azul'],
    accentColor: '#0055ea',
    category: 'retro',
    era: '2001',
    features: ['Luna Blue Design', 'Boot clássico XP', 'Wallpapers Bliss'],
  },
  {
    id: 'win7',
    name: 'Windows 7 Aero Glass (2009)',
    subtitle: 'Aero Glass, Transparências & Reflexos',
    description: 'O aclamado design Aero Glass do Windows 7: vidros translúcidos foscos, reflexos diagonais, cantos arredondados suaves e sombras profundas.',
    tags: ['windows 7', 'win7', '2009', 'aero', 'aero glass', 'vidro', 'transparência'],
    accentColor: '#0066cc',
    category: 'retro',
    era: '2009',
    features: ['Transparência Aero Glass', 'Reflexos de luz realistas', 'Janelas translúcidas'],
  },
  {
    id: 'win10',
    name: 'Windows 10 Fluent Slate',
    subtitle: 'Metro & Fluent Design System',
    description: 'Visual minimalista escuro do Windows 10 com bordas retas sem raio, tipografia Segoe UI e paleta escura (#121620).',
    tags: ['windows 10', 'win10', 'fluent', 'metro', 'escuro', 'moderno'],
    accentColor: '#00adef',
    category: 'modern',
    era: '2015+',
    features: ['Bordas retas flat', 'Segoe UI', 'Paleta azul elétrica'],
  },
  {
    id: 'wikidiota',
    name: 'Wikidiota (Wikiomite Engine)',
    subtitle: 'Humor & Paródia Enciclopédica (Desciclopédia/Uncyclopedia)',
    description: 'Paródia irreverente das enciclopédias wiki, com tipografia desajeitada, avisos sarcásticos e estética da Uncyclopedia.',
    tags: ['wikidiota', 'desciclopedia', 'uncyclopedia', 'humor', 'paródia', 'sarcasmo'],
    accentColor: '#54595d',
    category: 'classic',
    era: 'Comédia',
    features: ['Avisos irônicos', 'Visual Uncyclopedia', 'Estilo paródia'],
  },
  {
    id: 'genshin',
    name: 'Genshin Impact (Teyvat)',
    subtitle: 'Estética de Fantasia & Sete Elementos',
    description: 'Inspirado na interface do RPG de fantasia Teyvat: tons dourados ornamentados, bordas de pedra estelar e símbolos elementais.',
    tags: ['genshin', 'genshin impact', 'teyvat', 'rpg', 'anime', 'dourado', 'fantasia'],
    accentColor: '#d3bc8e',
    category: 'gaming',
    era: 'Fantasia',
    features: ['7 Elementos de Teyvat', 'Ornatos dourados', 'Fontes de fantasia'],
  },
  {
    id: 'android15',
    name: 'Android 15 Vanilla Ice Cream',
    subtitle: 'Google Mobile Material You 2025',
    description: 'Interface móvel moderna com barras de status, cantos superelípticos arredondados e paleta dinâmica pastel.',
    tags: ['android 15', 'android', 'vanilla ice cream', 'mobile', 'smartphone'],
    accentColor: '#3ddc84',
    category: 'modern',
    era: '2025',
    features: ['Cantos superelípticos', 'Barra de status mobile', 'Verde Android'],
  },
  {
    id: 'android23',
    name: 'Android 2.3 Gingerbread (2010)',
    subtitle: 'Nostalgia do Android Clássico dos Anos 2010',
    description: 'A clássica interface Gingerbread: fundo preto, detalhes verde cítrico brilhante, controles táteis e menus retrô.',
    tags: ['android 2.3', 'gingerbread', '2010', 'android clássico', 'verde néon'],
    accentColor: '#a4c639',
    category: 'retro',
    era: '2010',
    features: ['Preto e verde cítrico', 'Barra superior clássica', 'Widgets 2010'],
  },
  {
    id: 'stardew',
    name: 'Stardew Valley (Vale da Estrela)',
    subtitle: 'Nostalgia Rural Pixel Art & Junimos',
    description: 'Inspirado na vida pacata na fazenda: bordas em textura de madeira rústica, pergaminhos de papel quente e Junimos amigáveis.',
    tags: ['stardew valley', 'stardew', 'fazenda', 'pixel art', 'madeira', 'junimo'],
    accentColor: '#b87333',
    category: 'gaming',
    era: 'Rural',
    features: ['Madeira rústica', 'Papel pergaminho', 'Junimo mascot'],
  },
  {
    id: 'repo',
    name: 'R.E.P.O. Terminal Semiwork',
    subtitle: 'Ficção Científica Industrial & CRT Néon',
    description: 'Terminal industrial militar sci-fi com linhas de varredura CRT, texto ciano elétrico e interface de extração de sucata.',
    tags: ['repo', 'sci-fi', 'terminal', 'crt', 'ciano', 'cyberpunk', 'industrial'],
    accentColor: '#22d3ee',
    category: 'gaming',
    era: 'Sci-Fi',
    features: ['Varredura CRT', 'Monospace elétrico', 'Modo terminal'],
  },
  {
    id: 'minecraft',
    name: 'Minecraft Biomas Retrô',
    subtitle: 'Blocos Cúbicos, Texturas de Pedra & Grama',
    description: 'A estética icônica do universo voxel: botões em textura de pedra, fontes pixeladas e cabeçalhos em estilo terra/grama.',
    tags: ['minecraft', 'voxel', 'blocos', 'pixel', 'pedra', 'grama', 'biomas'],
    accentColor: '#5b8c32',
    category: 'gaming',
    era: 'Voxel',
    features: ['Botões texturizados', 'Fonte pixelada', 'Bordas de pedra'],
  },
  {
    id: 'roblox',
    name: 'Roblox Classic Creator',
    subtitle: 'Interface Moderna de Experiências & Avatares',
    description: 'Design limpo inspirado no ecossistema Roblox, com preto carvão, botões verdes arredondados e cartões em grade.',
    tags: ['roblox', 'creator', 'games', 'verde', 'escuro', 'moderno'],
    accentColor: '#00b06f',
    category: 'gaming',
    era: 'Metaverso',
    features: ['Verde Roblox', 'Cards flat limpos', 'Estilo estúdio'],
  },
  {
    id: 'nokia3310',
    name: 'Nokia 3310 Monocromático (2000)',
    subtitle: 'Display LCD Verde-Oliva Monocromático',
    description: 'A tela indestrutível do clássico Nokia 3310: matriz de pontos monocromática verde-oliva (#c4d69f) e fontes bitmap.',
    tags: ['nokia 3310', 'nokia', 'monocromático', 'snake', '2000', 'celular retrô'],
    accentColor: '#1f281b',
    category: 'retro',
    era: '2000',
    features: ['Display verde-oliva', 'Matriz de pontos', 'Fonte Snake LCD'],
  },
  {
    id: 'halflife',
    name: 'Half-Life Black Mesa λ (1998)',
    subtitle: 'Instalação de Pesquisa Científica Black Mesa',
    description: 'Interface de monitoramento de incidentes da Black Mesa: acentos âmbar radioativo (#ff9900), terminais cinza chumbo e o símbolo Lambda λ.',
    tags: ['half-life', 'halflife', 'black mesa', 'lambda', '1998', 'valve', 'laranja'],
    accentColor: '#ff9900',
    category: 'gaming',
    era: '1998',
    features: ['Terminal Lambda λ', 'Âmbar radioativo', 'Black Mesa Research'],
  },
];

/**
 * Item de resultado de diff
 */
export interface DiffSearchResultItem {
  id: string;
  type: 'github_commit' | 'system_release';
  title: string;
  summary: string;
  sha?: string;
  version?: string;
  author: string;
  date: string;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  highlights?: string[];
  category?: string;
}

/**
 * Estrutura agregada do resultado de busca unificada
 */
export interface UnifiedSearchResult {
  sector: SearchSector;
  rawTag: string;
  cleanQuery: string;
  totalMatches: number;
  articles: WikiArticle[];
  users: UserProfile[];
  themes: ThemeCatalogItem[];
  diffs: DiffSearchResultItem[];
  collections: WikiPage[];
  counts: {
    all: number;
    user: number;
    skin: number;
    diff: number;
    collection: number;
    article: number;
  };
}

export class UnifiedSearchService {
  /**
   * Analisa a string de entrada para extrair a tag/prefixo inicial do setor e o termo limpo.
   * Exemplo:
   * "User: pedro" -> { sector: 'user', rawTag: 'User:', cleanQuery: 'pedro' }
   * "Skin: win95" -> { sector: 'skin', rawTag: 'Skin:', cleanQuery: 'win95' }
   * "Diff: 3.05"  -> { sector: 'diff', rawTag: 'Diff:', cleanQuery: '3.05' }
   * "Collection: ciencia" -> { sector: 'collection', rawTag: 'Collection:', cleanQuery: 'ciencia' }
   * "inteligência artificial" -> { sector: 'all', rawTag: '', cleanQuery: 'inteligência artificial' }
   */
  public static parseQuery(input: string): {
    sector: SearchSector;
    rawTag: string;
    cleanQuery: string;
  } {
    const trimmed = (input || '').trim();
    if (!trimmed) {
      return { sector: 'all', rawTag: '', cleanQuery: '' };
    }

    // 1. User: / Usuário: / Usuario:
    if (/^(user|usuário|usuario|u):\s*/i.test(trimmed)) {
      const clean = trimmed.replace(/^(user|usuário|usuario|u):\s*/i, '').trim();
      return { sector: 'user', rawTag: 'User:', cleanQuery: clean };
    }

    // 2. Skin: / Theme: / Tema: / Aparência: / Aparencia:
    if (/^(skin|theme|tema|aparência|aparencia|s):\s*/i.test(trimmed)) {
      const clean = trimmed.replace(/^(skin|theme|tema|aparência|aparencia|s):\s*/i, '').trim();
      return { sector: 'skin', rawTag: 'Skin:', cleanQuery: clean };
    }

    // 3. Diff: / Commit: / Mudança: / Mudanca: / Patch:
    if (/^(diff|commit|mudança|mudanca|patch|d):\s*/i.test(trimmed)) {
      const clean = trimmed.replace(/^(diff|commit|mudança|mudanca|patch|d):\s*/i, '').trim();
      return { sector: 'diff', rawTag: 'Diff:', cleanQuery: clean };
    }

    // 4. Collection: / Coleção: / Colecao: / Hub: / Topic:
    if (/^(collection|coleção|colecao|hub|topic|tópico|topico|c):\s*/i.test(trimmed)) {
      const clean = trimmed.replace(/^(collection|coleção|colecao|hub|topic|tópico|topico|c):\s*/i, '').trim();
      return { sector: 'collection', rawTag: 'Collection:', cleanQuery: clean };
    }

    // 5. Article: / Artigo:
    if (/^(article|artigo|a):\s*/i.test(trimmed)) {
      const clean = trimmed.replace(/^(article|artigo|a):\s*/i, '').trim();
      return { sector: 'article', rawTag: 'Article:', cleanQuery: clean };
    }

    return { sector: 'all', rawTag: '', cleanQuery: trimmed };
  }

  /**
   * Constrói a query com o prefixo apropriado do setor
   */
  public static formatQueryWithSector(sector: SearchSector, term: string): string {
    const clean = term.replace(/^(user|usuário|usuario|u|skin|theme|tema|aparência|aparencia|s|diff|commit|mudança|mudanca|patch|d|collection|coleção|colecao|hub|topic|c|article|artigo|a):\s*/i, '').trim();
    if (sector === 'all') return clean;
    const prefix = SEARCH_SECTORS[sector]?.prefix || '';
    return clean ? `${prefix} ${clean}` : `${prefix} `;
  }

  /**
   * Normaliza texto para comparações sem acento e em minúsculas
   */
  private static normalizeText(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Busca em Usuários
   */
  public static searchUsers(users: UserProfile[], query: string): UserProfile[] {
    const q = this.normalizeText(query);
    if (!q) return users.slice(0, 20);

    const words = q.split(/\s+/).filter(Boolean);

    return users
      .filter((u) => {
        if (!u) return false;
        const nameNorm = this.normalizeText(u.displayName || '');
        const userNorm = this.normalizeText(u.username || '');
        const emailNorm = this.normalizeText(u.email || '');
        const roleNorm = this.normalizeText(u.role || '');
        const groupNorm = this.normalizeText(u.group || '');
        const bioNorm = this.normalizeText(u.bio || '');

        return words.every(
          (w) =>
            nameNorm.includes(w) ||
            userNorm.includes(w) ||
            emailNorm.includes(w) ||
            roleNorm.includes(w) ||
            groupNorm.includes(w) ||
            bioNorm.includes(w)
        );
      })
      .slice(0, 30);
  }

  /**
   * Busca em Skins e Temas
   */
  public static searchThemes(query: string): ThemeCatalogItem[] {
    const q = this.normalizeText(query);
    if (!q) return THEME_SEARCH_CATALOG;

    const words = q.split(/\s+/).filter(Boolean);

    return THEME_SEARCH_CATALOG.filter((t) => {
      const nameNorm = this.normalizeText(t.name);
      const subNorm = this.normalizeText(t.subtitle);
      const descNorm = this.normalizeText(t.description);
      const idNorm = this.normalizeText(t.id);
      const tagsNorm = t.tags.map((tag) => this.normalizeText(tag)).join(' ');

      return words.every(
        (w) =>
          nameNorm.includes(w) ||
          subNorm.includes(w) ||
          descNorm.includes(w) ||
          idNorm.includes(w) ||
          tagsNorm.includes(w)
      );
    });
  }

  /**
   * Busca em Diffs e Commits
   */
  public static searchDiffs(
    commits: GitHubCommitSummary[],
    updates: SystemUpdateEntry[],
    query: string
  ): DiffSearchResultItem[] {
    const q = this.normalizeText(query);
    const words = q ? q.split(/\s+/).filter(Boolean) : [];

    const results: DiffSearchResultItem[] = [];

    // 1. Commits do GitHub
    (commits || []).forEach((c) => {
      if (!c) return;
      const shaNorm = (c.sha || '').toLowerCase();
      const msgNorm = this.normalizeText(c.message || '');
      const authorNorm = this.normalizeText(c.authorName || c.authorLogin || (c as any).author?.name || '');
      const filesNorm = (c.files || []).map((f) => this.normalizeText(f.filename)).join(' ');

      const matches =
        words.length === 0 ||
        words.every(
          (w) =>
            shaNorm.includes(w) ||
            msgNorm.includes(w) ||
            authorNorm.includes(w) ||
            filesNorm.includes(w)
        );

      if (matches) {
        results.push({
          id: `git-${c.sha}`,
          type: 'github_commit',
          title: (c.message || '').split('\n')[0],
          summary: c.message || '',
          sha: c.sha,
          author: c.authorName || c.authorLogin || (c as any).author?.name || 'Desenvolvedor',
          date: c.date,
          additions: c.stats?.additions,
          deletions: c.stats?.deletions,
          filesChanged: c.filesCount || c.stats?.total || c.files?.length,
        });
      }
    });

    // 2. Releases do Sistema
    (updates || []).forEach((u) => {
      if (!u) return;
      const verNorm = this.normalizeText(u.version || '');
      const titleNorm = this.normalizeText(u.title || '');
      const sumNorm = this.normalizeText(u.summary || '');
      const highNorm = (u.highlights || []).map((h) => this.normalizeText(h)).join(' ');
      const compNorm = (u.affectedComponents || []).map((c) => this.normalizeText(c)).join(' ');

      const matches =
        words.length === 0 ||
        words.every(
          (w) =>
            verNorm.includes(w) ||
            titleNorm.includes(w) ||
            sumNorm.includes(w) ||
            highNorm.includes(w) ||
            compNorm.includes(w)
        );

      if (matches) {
        results.push({
          id: `rel-${u.id || u.version}`,
          type: 'system_release',
          title: `${u.version}: ${u.title}`,
          summary: u.summary,
          version: u.version,
          author: u.author || 'Administração WikiZero',
          date: u.date,
          highlights: u.highlights,
          category: u.category,
        });
      }
    });

    // Ordena mais recentes primeiro
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return results.slice(0, 30);
  }

  /**
   * Busca em Coleções
   */
  public static searchCollections(pages: WikiPage[], query: string): WikiPage[] {
    const q = this.normalizeText(query);
    if (!q) return pages.slice(0, 25);

    const words = q.split(/\s+/).filter(Boolean);

    return pages
      .filter((p) => {
        if (!p) return false;
        const titleNorm = this.normalizeText(p.titulo || '');
        const descNorm = this.normalizeText(p.descricao || '');
        const catNorm = this.normalizeText(p.categoria || '');
        const tagsNorm = (p.tags || []).map((t) => this.normalizeText(t)).join(' ');

        return words.every(
          (w) =>
            titleNorm.includes(w) ||
            descNorm.includes(w) ||
            catNorm.includes(w) ||
            tagsNorm.includes(w)
        );
      })
      .slice(0, 25);
  }

  /**
   * Executa busca unificada completa
   */
  public static searchAll(params: {
    query: string;
    articles: WikiArticle[];
    pages: WikiPage[];
    users: UserProfile[];
    commits: GitHubCommitSummary[];
    updates: SystemUpdateEntry[];
    explicitSector?: SearchSector;
  }): UnifiedSearchResult {
    const { query, articles, pages, users, commits, updates, explicitSector } = params;

    const parsed = this.parseQuery(query);
    const activeSector: SearchSector = explicitSector || parsed.sector;
    const cleanQuery = parsed.cleanQuery;

    // Se um setor específico foi detectado
    const matchedUsers =
      activeSector === 'all' || activeSector === 'user'
        ? this.searchUsers(users, cleanQuery)
        : [];

    const matchedThemes =
      activeSector === 'all' || activeSector === 'skin'
        ? this.searchThemes(cleanQuery)
        : [];

    const matchedDiffs =
      activeSector === 'all' || activeSector === 'diff'
        ? this.searchDiffs(commits, updates, cleanQuery)
        : [];

    const matchedCollections =
      activeSector === 'all' || activeSector === 'collection'
        ? this.searchCollections(pages, cleanQuery)
        : [];

    // Artigos
    let matchedArticles: WikiArticle[] = [];
    if (activeSector === 'all' || activeSector === 'article') {
      const q = this.normalizeText(cleanQuery);
      const words = q ? q.split(/\s+/).filter(Boolean) : [];

      if (!q) {
        matchedArticles = (articles || []).slice(0, 25);
      } else {
        matchedArticles = (articles || []).filter((art) => {
          if (!art) return false;
          const titNorm = this.normalizeText(art.titulo || '');
          const descNorm = this.normalizeText(art.descricao || '');
          const sumNorm = this.normalizeText(art.resumo || '');
          const catNorm = this.normalizeText(art.categoria || '');
          const tagsNorm = (art.tags || []).map((t) => this.normalizeText(t)).join(' ');

          return words.every(
            (w) =>
              titNorm.includes(w) ||
              descNorm.includes(w) ||
              sumNorm.includes(w) ||
              catNorm.includes(w) ||
              tagsNorm.includes(w)
          );
        });
      }
    }

    const counts = {
      all:
        matchedArticles.length +
        matchedUsers.length +
        matchedThemes.length +
        matchedDiffs.length +
        matchedCollections.length,
      user: matchedUsers.length,
      skin: matchedThemes.length,
      diff: matchedDiffs.length,
      collection: matchedCollections.length,
      article: matchedArticles.length,
    };

    return {
      sector: activeSector,
      rawTag: parsed.rawTag,
      cleanQuery,
      totalMatches: counts.all,
      articles: matchedArticles,
      users: matchedUsers,
      themes: matchedThemes,
      diffs: matchedDiffs,
      collections: matchedCollections,
      counts,
    };
  }
}
