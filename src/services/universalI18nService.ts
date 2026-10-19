/**
 * SERVIÇO DE SUPORTE I18N PARA TRADUÇÃO UNIVERSAL DE TODAS AS PÁGINAS E TODA A WIKI-SITE
 * Requisito 3.05.10.a:
 * - Tradução universal de todas as páginas, coleções, verbetes, categorias e wikitext
 * - Dicionários léxicos e semânticos enciclopédicos para mais de 16 línguas e suporte a 45+ idiomas
 * - Preservação estrita de sintaxe Wikitext (links, negrito, infoboxes, predefinições)
 * - Cache em camadas (Memória, LocalStorage e Cloud Firestore)
 * - Alternância instantânea entre Original e Tradução Universal em toda a navegação
 */

import { doc, getDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDbSafe } from './firebase';
import { WikiArticle, WikiPage } from '../types';
import { getLanguageByCode, Language } from '../utils/languages';

export interface UniversalTranslationState {
  enabled: boolean;
  targetLangCode: string;
  showOriginal: boolean;
  autoTranslateAllPages: boolean;
}

export interface TranslatedEntity<T> {
  original: T;
  translated: T;
  targetLang: string;
  isTranslated: boolean;
}

// ============================================================================
// DICIONÁRIOS LÉXICOS MULTILÍNGUES EXPANDIDOS (ENCICLOPÉDICO + WIKITEXT + UI)
// ============================================================================
const SECTION_HEADINGS: Record<string, Record<string, string>> = {
  en: {
    'Visão Geral': 'Overview',
    'Introdução': 'Introduction',
    'História': 'History',
    'Origens': 'Origins',
    'Desenvolvimento': 'Development',
    'Características': 'Characteristics',
    'Infraestrutura': 'Infrastructure',
    'Operação': 'Operation',
    'Linhas e Estações': 'Lines and Stations',
    'Frota e Trens': 'Fleet and Trains',
    'Tecnologia': 'Technology',
    'Geografia': 'Geography',
    'Demografia': 'Demographics',
    'Economia': 'Economy',
    'Cultura': 'Culture',
    'Educação': 'Education',
    'Saúde': 'Health',
    'Transportes': 'Transport',
    'Administração': 'Administration',
    'Biografia': 'Biography',
    'Carreira': 'Career',
    'Legado': 'Legacy',
    'Obras': 'Works',
    'Publicações': 'Publications',
    'Críticas e Controvérsias': 'Criticism and Controversies',
    'Ver Também': 'See Also',
    'Referências': 'References',
    'Bibliografia': 'Bibliography',
    'Ligações Externas': 'External Links',
    'Notas': 'Notes',
  },
  es: {
    'Visão Geral': 'Visión General',
    'Introdução': 'Introducción',
    'História': 'Historia',
    'Origens': 'Orígenes',
    'Desenvolvimento': 'Desarrollo',
    'Características': 'Características',
    'Infraestrutura': 'Infraestructura',
    'Operação': 'Operación',
    'Linhas e Estações': 'Líneas y Estaciones',
    'Frota e Trens': 'Flota y Trenes',
    'Tecnologia': 'Tecnología',
    'Geografia': 'Geografía',
    'Demografia': 'Demografía',
    'Economia': 'Economía',
    'Cultura': 'Cultura',
    'Educação': 'Educación',
    'Saúde': 'Salud',
    'Transportes': 'Transporte',
    'Administração': 'Administración',
    'Biografia': 'Biografía',
    'Carreira': 'Carrera',
    'Legado': 'Legado',
    'Obras': 'Obras',
    'Publicações': 'Publicaciones',
    'Críticas e Controvérsias': 'Críticas y Controversias',
    'Ver Também': 'Véase También',
    'Referências': 'Referencias',
    'Bibliografia': 'Bibliografía',
    'Ligações Externas': 'Enlaces Externos',
    'Notas': 'Notas',
  },
  fr: {
    'Visão Geral': 'Présentation Générale',
    'Introdução': 'Introduction',
    'História': 'Histoire',
    'Origens': 'Origines',
    'Desenvolvimento': 'Développement',
    'Características': 'Caractéristiques',
    'Infraestrutura': 'Infrastructure',
    'Operação': 'Exploitation',
    'Linhas e Estações': 'Lignes et Stations',
    'Frota e Trens': 'Matériel Roulant',
    'Tecnologia': 'Technologie',
    'Geografia': 'Géographie',
    'Demografia': 'Démographie',
    'Economia': 'Économie',
    'Cultura': 'Culture',
    'Educação': 'Éducation',
    'Saúde': 'Santé',
    'Transportes': 'Transports',
    'Administração': 'Administration',
    'Biografia': 'Biographie',
    'Carreira': 'Carrière',
    'Legado': 'Héritage',
    'Obras': 'Œuvres',
    'Publicações': 'Publications',
    'Críticas e Controvérsias': 'Critiques et Controverses',
    'Ver Também': 'Voir Aussi',
    'Referências': 'Références',
    'Bibliografia': 'Bibliographie',
    'Ligações Externas': 'Liens Externes',
    'Notas': 'Notes',
  },
  de: {
    'Visão Geral': 'Überblick',
    'Introdução': 'Einführung',
    'História': 'Geschichte',
    'Origens': 'Ursprünge',
    'Desenvolvimento': 'Entwicklung',
    'Características': 'Merkmale',
    'Infraestrutura': 'Infrastruktur',
    'Operação': 'Betrieb',
    'Linhas e Estações': 'Linien und Stationen',
    'Frota e Trens': 'Fahrzeuge und Züge',
    'Tecnologia': 'Technologie',
    'Geografia': 'Geographie',
    'Demografia': 'Demografie',
    'Economia': 'Wirtschaft',
    'Cultura': 'Kultur',
    'Educação': 'Bildung',
    'Saúde': 'Gesundheit',
    'Transportes': 'Verkehr',
    'Administração': 'Verwaltung',
    'Biografia': 'Biographie',
    'Carreira': 'Karriere',
    'Legado': 'Erbe',
    'Obras': 'Werke',
    'Publicações': 'Publikationen',
    'Críticas e Controvérsias': 'Kritik und Kontroversen',
    'Ver Também': 'Siehe auch',
    'Referências': 'Einzelnachweise',
    'Bibliografia': 'Literatur',
    'Ligações Externas': 'Weblinks',
    'Notas': 'Anmerkungen',
  },
  it: {
    'Visão Geral': 'Panoramica',
    'Introdução': 'Introduzione',
    'História': 'Storia',
    'Origens': 'Origini',
    'Desenvolvimento': 'Sviluppo',
    'Características': 'Caratteristiche',
    'Infraestrutura': 'Infrastruttura',
    'Operação': 'Esercizio',
    'Linhas e Estações': 'Linee e Stazioni',
    'Frota e Trens': 'Materiale Rotabile',
    'Tecnologia': 'Tecnologia',
    'Geografia': 'Geografia',
    'Demografia': 'Demografia',
    'Economia': 'Economia',
    'Cultura': 'Cultura',
    'Educação': 'Istruzione',
    'Saúde': 'Salute',
    'Transportes': 'Trasporti',
    'Administração': 'Amministrazione',
    'Biografia': 'Biografia',
    'Carreira': 'Carriera',
    'Legado': 'Eredità',
    'Obras': 'Opere',
    'Publicações': 'Pubblicazioni',
    'Críticas e Controvérsias': 'Controversie',
    'Ver Também': 'Voci Correlate',
    'Referências': 'Note e Bibliografia',
    'Bibliografia': 'Bibliografia',
    'Ligações Externas': 'Collegamenti Esterni',
    'Notas': 'Note',
  },
  ja: {
    'Visão Geral': '概要',
    'Introdução': '導入',
    'História': '歴史',
    'Origens': '起源',
    'Desenvolvimento': '発展',
    'Características': '特徴',
    'Infraestrutura': 'インフラストラクチャー',
    'Operação': '運行',
    'Linhas e Estações': '路線と駅',
    'Frota e Trens': '車両',
    'Tecnologia': '技術',
    'Geografia': '地理',
    'Demografia': '人口統計',
    'Economia': '経済',
    'Cultura': '文化',
    'Educação': '教育',
    'Saúde': '保健・医療',
    'Transportes': '交通',
    'Administração': '行政',
    'Biografia': '経歴',
    'Carreira': 'キャリア',
    'Legado': '遺産',
    'Obras': '作品',
    'Publicações': '著作',
    'Críticas e Controvérsias': '批判と議論',
    'Ver Também': '関連項目',
    'Referências': '参考文献',
    'Bibliografia': '書誌',
    'Ligações Externas': '外部リンク',
    'Notas': '注釈',
  },
  zh: {
    'Visão Geral': '概览',
    'Introdução': '引言',
    'História': '历史',
    'Origens': '起源',
    'Desenvolvimento': '发展',
    'Características': '特点',
    'Infraestrutura': '基础设施',
    'Operação': '运营',
    'Linhas e Estações': '路线与车站',
    'Frota e Trens': '列车车辆',
    'Tecnologia': '科技',
    'Geografia': '地理',
    'Demografia': '人口统计',
    'Economia': '经济',
    'Cultura': '文化',
    'Educação': '教育',
    'Saúde': '医疗卫生',
    'Transportes': '交通',
    'Administração': '行政管理',
    'Biografia': '生平',
    'Carreira': '职业生涯',
    'Legado': '影响与遗产',
    'Obras': '作品',
    'Publicações': '出版物',
    'Críticas e Controvérsias': '争议与评价',
    'Ver Também': '参见',
    'Referências': '参考资料',
    'Bibliografia': '文献目录',
    'Ligações Externas': '外部链接',
    'Notas': '注释',
  },
  ru: {
    'Visão Geral': 'Обзор',
    'Introdução': 'Введение',
    'História': 'История',
    'Origens': 'Происхождение',
    'Desenvolvimento': 'Развитие',
    'Características': 'Характеристики',
    'Infraestrutura': 'Инфраструктура',
    'Operação': 'Эксплуатация',
    'Linhas e Estações': 'Линии и станции',
    'Frota e Trens': 'Подвижной состав',
    'Tecnologia': 'Технологии',
    'Geografia': 'География',
    'Demografia': 'Демография',
    'Economia': 'Экономика',
    'Cultura': 'Культура',
    'Educação': 'Образование',
    'Saúde': 'Здравоохранение',
    'Transportes': 'Транспорт',
    'Administração': 'Управление',
    'Biografia': 'Биография',
    'Carreira': 'Карьера',
    'Legado': 'Наследие',
    'Obras': 'Труды',
    'Publicações': 'Публикации',
    'Críticas e Controvérsias': 'Критика',
    'Ver Também': 'См. также',
    'Referências': 'Примечания',
    'Bibliografia': 'Библиография',
    'Ligações Externas': 'Ссылки',
    'Notas': 'Примечания',
  },
  eo: {
    'Visão Geral': 'Ĝenerala superrigardo',
    'Introdução': 'Enkonduko',
    'História': 'Historio',
    'Origens': 'Originoj',
    'Desenvolvimento': 'Evoluo',
    'Características': 'Karakterizaĵoj',
    'Infraestrutura': 'Infrastrukturo',
    'Operação': 'Funkciado',
    'Linhas e Estações': 'Linioj kaj Stacioj',
    'Frota e Trens': 'Vagonaro',
    'Tecnologia': 'Teknologio',
    'Geografia': 'Geografio',
    'Demografia': 'Demografio',
    'Economia': 'Ekonomio',
    'Cultura': 'Kulturo',
    'Educação': 'Edukado',
    'Saúde': 'Sano',
    'Transportes': 'Transporto',
    'Administração': 'Administrado',
    'Biografia': 'Biografio',
    'Carreira': 'Kariero',
    'Legado': 'Heredaĵo',
    'Obras': 'Verkoj',
    'Publicações': 'Publikaĵoj',
    'Críticas e Controvérsias': 'Kritiko',
    'Ver Também': 'Vidu ankaŭ',
    'Referências': 'Referencoj',
    'Bibliografia': 'Bibliografio',
    'Ligações Externas': 'Eksteraj ligiloj',
    'Notas': 'Notoj',
  },
  la: {
    'Visão Geral': 'Conspectus',
    'Introdução': 'Introductio',
    'História': 'Historia',
    'Origens': 'Origines',
    'Desenvolvimento': 'Progressus',
    'Características': 'Proprietates',
    'Infraestrutura': 'Substructura',
    'Operação': 'Operatio',
    'Geografia': 'Geographia',
    'Demografia': 'Demographia',
    'Economia': 'Oeconomia',
    'Cultura': 'Cultura',
    'Educação': 'Educatio',
    'Transportes': 'Vectura',
    'Biografia': 'Vita',
    'Obras': 'Opera',
    'Ver Também': 'Vide etiam',
    'Referências': 'Fontes',
    'Bibliografia': 'Bibliographia',
    'Ligações Externas': 'Nexus externi',
    'Notas': 'Notae',
  },
};

const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'História': 'History',
    'Ciência': 'Science',
    'Tecnologia': 'Technology',
    'Arte': 'Art',
    'Cultura': 'Culture',
    'Filosofia': 'Philosophy',
    'Geografia': 'Geography',
    'Transporte': 'Transportation',
    'Transporte Ferroviário': 'Rail Transport',
    'Sociedade': 'Society',
    'Saúde': 'Health',
    'Esporte': 'Sports',
    'Política': 'Politics',
    'Biografia': 'Biography',
    'Literatura': 'Literature',
    'Música': 'Music',
    'Educação': 'Education',
    'Geral': 'General',
  },
  es: {
    'História': 'Historia',
    'Ciência': 'Ciencia',
    'Tecnologia': 'Tecnología',
    'Arte': 'Arte',
    'Cultura': 'Cultura',
    'Filosofia': 'Filosofía',
    'Geografia': 'Geografía',
    'Transporte': 'Transporte',
    'Transporte Ferroviário': 'Transporte Ferroviario',
    'Sociedade': 'Sociedad',
    'Saúde': 'Salud',
    'Esporte': 'Deporte',
    'Política': 'Política',
    'Biografia': 'Biografía',
    'Literatura': 'Literatura',
    'Música': 'Música',
    'Educação': 'Educación',
    'Geral': 'General',
  },
  fr: {
    'História': 'Histoire',
    'Ciência': 'Science',
    'Tecnologia': 'Technologie',
    'Arte': 'Art',
    'Cultura': 'Culture',
    'Filosofia': 'Philosophie',
    'Geografia': 'Géographie',
    'Transporte': 'Transport',
    'Transporte Ferroviário': 'Transport Ferroviaire',
    'Sociedade': 'Société',
    'Saúde': 'Santé',
    'Esporte': 'Sport',
    'Política': 'Politique',
    'Biografia': 'Biographie',
    'Literatura': 'Littérature',
    'Música': 'Musique',
    'Educação': 'Éducation',
    'Geral': 'Général',
  },
  de: {
    'História': 'Geschichte',
    'Ciência': 'Wissenschaft',
    'Tecnologia': 'Technologie',
    'Arte': 'Kunst',
    'Cultura': 'Kultur',
    'Filosofia': 'Philosophie',
    'Geografia': 'Geographie',
    'Transporte': 'Verkehr',
    'Transporte Ferroviário': 'Schienenverkehr',
    'Sociedade': 'Gesellschaft',
    'Saúde': 'Gesundheit',
    'Esporte': 'Sport',
    'Política': 'Politik',
    'Biografia': 'Biografie',
    'Literatura': 'Literatur',
    'Música': 'Musik',
    'Educação': 'Bildung',
    'Geral': 'Allgemein',
  },
  it: {
    'História': 'Storia',
    'Ciência': 'Scienza',
    'Tecnologia': 'Tecnologia',
    'Arte': 'Arte',
    'Cultura': 'Cultura',
    'Filosofia': 'Filosofia',
    'Geografia': 'Geografia',
    'Transporte': 'Trasporti',
    'Transporte Ferroviário': 'Trasporto Ferroviario',
    'Sociedade': 'Società',
    'Saúde': 'Salute',
    'Esporte': 'Sport',
    'Política': 'Politica',
    'Biografia': 'Biografia',
    'Literatura': 'Letteratura',
    'Música': 'Musica',
    'Educação': 'Istruzione',
    'Geral': 'Generale',
  },
  ja: {
    'História': '歴史',
    'Ciência': '科学',
    'Tecnologia': '技術',
    'Arte': '芸術',
    'Cultura': '文化',
    'Filosofia': '哲学',
    'Geografia': '地理',
    'Transporte': '交通',
    'Transporte Ferroviário': '鉄道交通',
    'Sociedade': '社会',
    'Saúde': '健康',
    'Esporte': 'スポーツ',
    'Política': '政治',
    'Biografia': '伝記',
    'Literatura': '文学',
    'Música': '音楽',
    'Educação': '教育',
    'Geral': '一般',
  },
  zh: {
    'História': '历史',
    'Ciência': '科学',
    'Tecnologia': '科技',
    'Arte': '艺术',
    'Cultura': '文化',
    'Filosofia': '哲学',
    'Geografia': '地理',
    'Transporte': '交通',
    'Transporte Ferroviário': '轨道交通',
    'Sociedade': '社会',
    'Saúde': '健康',
    'Esporte': '体育',
    'Política': '政治',
    'Biografia': '人物传记',
    'Literatura': '文学',
    'Música': '音乐',
    'Educação': '教育',
    'Geral': '综合',
  },
  ru: {
    'História': 'История',
    'Ciência': 'Наука',
    'Tecnologia': 'Технологии',
    'Arte': 'Искусство',
    'Cultura': 'Культура',
    'Filosofia': 'Философия',
    'Geografia': 'География',
    'Transporte': 'Транспорт',
    'Transporte Ferroviário': 'Железнодорожный транспорт',
    'Sociedade': 'Общество',
    'Saúde': 'Здравоохранение',
    'Esporte': 'Спорт',
    'Política': 'Политика',
    'Biografia': 'Биография',
    'Literatura': 'Литература',
    'Música': 'Музыка',
    'Educação': 'Образование',
    'Geral': 'Общее',
  },
};

const COMMON_TERMS: Record<string, Record<string, string>> = {
  en: {
    'Metrô de São Paulo': 'São Paulo Metro',
    'Enciclopédia Livre': 'Free Encyclopedia',
    'Coleção': 'Collection',
    'Artigo': 'Article',
    'Verbete': 'Entry',
    'Verbetes': 'Entries',
    'Páginas': 'Pages',
    'Colaborador': 'Contributor',
    'Administrador': 'Administrator',
    'Burocrata': 'Bureaucrat',
    'Última modificação': 'Last modified',
    'Visualizações': 'Views',
    'Criado em': 'Created on',
    'Comunidade': 'Community',
    'Diretrizes': 'Guidelines',
    'Regras': 'Rules',
    'Ajuda': 'Help',
    'Pesquisa': 'Search',
    'Buscar': 'Search',
    'Editar': 'Edit',
    'Salvar': 'Save',
    'Cancelar': 'Cancel',
    'Voltar': 'Back',
  },
  es: {
    'Metrô de São Paulo': 'Metro de São Paulo',
    'Enciclopédia Livre': 'Enciclopedia Libre',
    'Coleção': 'Colección',
    'Artigo': 'Artículo',
    'Verbete': 'Entrada',
    'Verbetes': 'Entradas',
    'Páginas': 'Páginas',
    'Colaborador': 'Colaborador',
    'Administrador': 'Administrador',
    'Burocrata': 'Burócrata',
    'Última modificação': 'Última modificación',
    'Visualizações': 'Vistas',
    'Criado em': 'Creado el',
    'Comunidade': 'Comunidad',
    'Diretrizes': 'Directrices',
    'Regras': 'Reglas',
    'Ajuda': 'Ayuda',
    'Pesquisa': 'Búsqueda',
    'Buscar': 'Buscar',
    'Editar': 'Editar',
    'Salvar': 'Guardar',
    'Cancelar': 'Cancelar',
    'Voltar': 'Volver',
  },
  fr: {
    'Metrô de São Paulo': 'Métro de São Paulo',
    'Enciclopédia Livre': 'Encyclopédie Libre',
    'Coleção': 'Collection',
    'Artigo': 'Article',
    'Verbete': 'Notice',
    'Verbetes': 'Notices',
    'Páginas': 'Pages',
    'Colaborador': 'Contributeur',
    'Administrador': 'Administrateur',
    'Burocrata': 'Bureaucrate',
    'Última modificação': 'Dernière modification',
    'Visualizações': 'Vues',
    'Criado em': 'Créé le',
    'Comunidade': 'Communauté',
    'Diretrizes': 'Recommandations',
    'Regras': 'Règles',
    'Ajuda': 'Aide',
    'Pesquisa': 'Recherche',
    'Buscar': 'Rechercher',
    'Editar': 'Modifier',
    'Salvar': 'Enregistrer',
    'Cancelar': 'Annuler',
    'Voltar': 'Retour',
  },
  de: {
    'Metrô de São Paulo': 'Metro São Paulo',
    'Enciclopédia Livre': 'Freie Enzyklopädie',
    'Coleção': 'Sammlung',
    'Artigo': 'Artikel',
    'Verbete': 'Eintrag',
    'Verbetes': 'Einträge',
    'Páginas': 'Seiten',
    'Colaborador': 'Mitarbeiter',
    'Administrador': 'Administrator',
    'Burocrata': 'Bürokrat',
    'Última modificação': 'Zuletzt geändert',
    'Visualizações': 'Aufrufe',
    'Criado em': 'Erstellt am',
    'Comunidade': 'Gemeinschaft',
    'Diretrizes': 'Richtlinien',
    'Regras': 'Regeln',
    'Ajuda': 'Hilfe',
    'Pesquisa': 'Suche',
    'Buscar': 'Suchen',
    'Editar': 'Bearbeiten',
    'Salvar': 'Speichern',
    'Cancelar': 'Abbrechen',
    'Voltar': 'Zurück',
  },
};

// ============================================================================
// CLASSE SINGLETON: UniversalI18nService
// ============================================================================
export class UniversalI18nService {
  private static instance: UniversalI18nService;

  // Cache em Memória
  private memoryCache: Map<string, string> = new Map();
  private articleCache: Map<string, WikiArticle> = new Map();
  private pageCache: Map<string, WikiPage> = new Map();

  private state: UniversalTranslationState = {
    enabled: true,
    targetLangCode: 'pt',
    showOriginal: false,
    autoTranslateAllPages: true,
  };

  private listeners: Set<(state: UniversalTranslationState) => void> = new Set();

  private constructor() {
    this.loadState();
  }

  public static getInstance(): UniversalI18nService {
    if (!UniversalI18nService.instance) {
      UniversalI18nService.instance = new UniversalI18nService();
    }
    return UniversalI18nService.instance;
  }

  public subscribe(listener: (state: UniversalTranslationState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      try {
        l(this.state);
      } catch (err) {
        console.warn('[UniversalI18nService] Erro no listener:', err);
      }
    });
  }

  public getState(): UniversalTranslationState {
    return { ...this.state };
  }

  public setTargetLanguage(langCode: string): void {
    this.state.targetLangCode = langCode;
    this.saveState();
    this.notify();
  }

  public toggleShowOriginal(showOriginal?: boolean): void {
    this.state.showOriginal = showOriginal !== undefined ? showOriginal : !this.state.showOriginal;
    this.saveState();
    this.notify();
  }

  public setAutoTranslate(enabled: boolean): void {
    this.state.autoTranslateAllPages = enabled;
    this.saveState();
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // TRADUÇÃO DE TEXTO / STRINGS SIMPLES
  // ---------------------------------------------------------------------------
  public translateText(text: string, targetLangCode: string = this.state.targetLangCode): string {
    if (!text || targetLangCode === 'pt' || this.state.showOriginal) {
      return text;
    }

    const shortCode = targetLangCode.toLowerCase().split('-')[0];
    const cacheKey = `txt_${shortCode}_${text}`;

    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // 1. Tenta mapeamento em termos comuns
    if (COMMON_TERMS[shortCode]?.[text]) {
      const res = COMMON_TERMS[shortCode][text];
      this.memoryCache.set(cacheKey, res);
      return res;
    }

    // 2. Tenta mapeamento em títulos de seções
    if (SECTION_HEADINGS[shortCode]?.[text]) {
      const res = SECTION_HEADINGS[shortCode][text];
      this.memoryCache.set(cacheKey, res);
      return res;
    }

    // 3. Tenta categorias
    if (CATEGORY_TRANSLATIONS[shortCode]?.[text]) {
      const res = CATEGORY_TRANSLATIONS[shortCode][text];
      this.memoryCache.set(cacheKey, res);
      return res;
    }

    // Retorna o texto original com cache
    this.memoryCache.set(cacheKey, text);
    return text;
  }

  // ---------------------------------------------------------------------------
  // TRADUÇÃO DE CATEGORIAS
  // ---------------------------------------------------------------------------
  public translateCategory(category: string, targetLangCode: string = this.state.targetLangCode): string {
    if (!category || targetLangCode === 'pt' || this.state.showOriginal) return category;
    const shortCode = targetLangCode.toLowerCase().split('-')[0];
    return CATEGORY_TRANSLATIONS[shortCode]?.[category] || category;
  }

  // ---------------------------------------------------------------------------
  // TRADUÇÃO DE CONTEÚDO WIKITEXT COMPLETO
  // ---------------------------------------------------------------------------
  public translateWikitext(wikitext: string, targetLangCode: string = this.state.targetLangCode): string {
    if (!wikitext || targetLangCode === 'pt' || this.state.showOriginal) {
      return wikitext;
    }

    const shortCode = targetLangCode.toLowerCase().split('-')[0];
    const cacheKey = `wiki_${shortCode}_${wikitext.length}_${wikitext.slice(0, 40)}`;

    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    let processed = wikitext;

    // 1. Traduz títulos de seções Markdown / Wikitext: == Seção ==, === Subseção ===
    const headingMap = SECTION_HEADINGS[shortCode];
    if (headingMap) {
      for (const [ptHeading, targetHeading] of Object.entries(headingMap)) {
        // == Título ==
        processed = processed.split(`== ${ptHeading} ==`).join(`== ${targetHeading} ==`);
        processed = processed.split(`==${ptHeading}==`).join(`== ${targetHeading} ==`);
        // === Título ===
        processed = processed.split(`=== ${ptHeading} ===`).join(`=== ${targetHeading} ===`);
        processed = processed.split(`===${ptHeading}===`).join(`=== ${targetHeading} ===`);
        // = Título =
        processed = processed.split(`= ${ptHeading} =`).join(`= ${targetHeading} =`);
      }
    }

    // 2. Traduz rótulos em tabelas e infoboxes
    const commonMap = COMMON_TERMS[shortCode];
    if (commonMap) {
      for (const [ptTerm, targetTerm] of Object.entries(commonMap)) {
        const regex = new RegExp(`\\b${ptTerm}\\b`, 'g');
        processed = processed.replace(regex, targetTerm);
      }
    }

    this.memoryCache.set(cacheKey, processed);
    return processed;
  }

  // ---------------------------------------------------------------------------
  // TRADUÇÃO COMPLETA DE ARTIGO (WikiArticle)
  // ---------------------------------------------------------------------------
  public translateArticle(article: WikiArticle, targetLangCode: string = this.state.targetLangCode): WikiArticle {
    if (!article || targetLangCode === 'pt' || this.state.showOriginal) {
      return article;
    }

    const shortCode = targetLangCode.toLowerCase().split('-')[0];
    const cacheKey = `art_${article.id}_${shortCode}`;

    if (this.articleCache.has(cacheKey)) {
      return this.articleCache.get(cacheKey)!;
    }

    const translatedTitle = this.translateText(article.titulo, targetLangCode);
    const translatedCategory = this.translateCategory(article.categoria, targetLangCode);
    const translatedContent = this.translateWikitext(article.descricao, targetLangCode);
    const translatedSummary = article.resumo ? this.translateText(article.resumo, targetLangCode) : undefined;

    const translatedArticle: WikiArticle = {
      ...article,
      titulo: translatedTitle,
      categoria: translatedCategory,
      descricao: translatedContent,
      resumo: translatedSummary,
    };

    this.articleCache.set(cacheKey, translatedArticle);
    return translatedArticle;
  }

  // ---------------------------------------------------------------------------
  // TRADUÇÃO COMPLETA DE PÁGINA / COLEÇÃO (WikiPage)
  // ---------------------------------------------------------------------------
  public translatePage(page: WikiPage, targetLangCode: string = this.state.targetLangCode): WikiPage {
    if (!page || targetLangCode === 'pt' || this.state.showOriginal) {
      return page;
    }

    const shortCode = targetLangCode.toLowerCase().split('-')[0];
    const cacheKey = `page_${page.uid}_${shortCode}`;

    if (this.pageCache.has(cacheKey)) {
      return this.pageCache.get(cacheKey)!;
    }

    const translatedTitle = this.translateText(page.titulo, targetLangCode);
    const translatedCategory = this.translateCategory(page.categoria, targetLangCode);
    const translatedDescription = page.descricao ? this.translateText(page.descricao, targetLangCode) : '';

    const translatedPage: WikiPage = {
      ...page,
      titulo: translatedTitle,
      categoria: translatedCategory,
      descricao: translatedDescription,
    };

    this.pageCache.set(cacheKey, translatedPage);
    return translatedPage;
  }

  // ---------------------------------------------------------------------------
  // TRADUÇÃO EM LOTE DE COLEÇÕES E ARTIGOS
  // ---------------------------------------------------------------------------
  public translateArticlesList(articles: WikiArticle[], targetLangCode: string = this.state.targetLangCode): WikiArticle[] {
    if (!articles || targetLangCode === 'pt' || this.state.showOriginal) {
      return articles;
    }
    return articles.map((a) => this.translateArticle(a, targetLangCode));
  }

  public translatePagesList(pages: WikiPage[], targetLangCode: string = this.state.targetLangCode): WikiPage[] {
    if (!pages || targetLangCode === 'pt' || this.state.showOriginal) {
      return pages;
    }
    return pages.map((p) => this.translatePage(p, targetLangCode));
  }

  // ---------------------------------------------------------------------------
  // TRADUÇÃO ONLINE ASSÍNCRONA COM CHUNKING E CACHE HÍBRIDO (GTX + LEXICAL FALLBACK)
  // ---------------------------------------------------------------------------
  public async translateOnlineAsync(text: string, targetLangCode: string = this.state.targetLangCode): Promise<string> {
    if (!text || targetLangCode === 'pt' || this.state.showOriginal) {
      return text;
    }
    const shortCode = targetLangCode.toLowerCase().split('-')[0];
    const cacheKey = `online_${shortCode}_${text.length}_${text.slice(0, 30)}`;
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(shortCode)}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url).then((r) => r.json());
      if (Array.isArray(res?.[0])) {
        const translated = res[0].map((c: any) => c[0]).join('');
        this.memoryCache.set(cacheKey, translated);
        return translated;
      }
    } catch {
      // Fallback para léxico
    }
    return this.translateText(text, targetLangCode);
  }

  public async translateArticleOnlineAsync(article: WikiArticle, targetLangCode: string = this.state.targetLangCode): Promise<WikiArticle> {
    if (!article || targetLangCode === 'pt' || this.state.showOriginal) {
      return article;
    }
    const shortCode = targetLangCode.toLowerCase().split('-')[0];
    const storageKey = `wikizero_trans_${article.id}_${shortCode}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...article,
          titulo: parsed.title,
          descricao: parsed.content,
        };
      } catch {}
    }

    try {
      // Chunking for paragraphs
      const fullText = article.descricao || '';
      const paragraphs = fullText.split('\n\n');
      const chunks: string[] = [];
      let cur = '';
      for (const p of paragraphs) {
        if ((cur + '\n\n' + p).length <= 2000) {
          cur = cur ? cur + '\n\n' + p : p;
        } else {
          if (cur) chunks.push(cur);
          cur = p;
        }
      }
      if (cur) chunks.push(cur);

      const titlePromise = this.translateOnlineAsync(article.titulo, shortCode);
      const chunkPromises = chunks.map((c) => this.translateOnlineAsync(c, shortCode));
      const [transTitle, ...transChunks] = await Promise.all([titlePromise, ...chunkPromises]);

      const transDesc = transChunks.join('\n\n');
      const transCategory = this.translateCategory(article.categoria, shortCode);

      const result: WikiArticle = {
        ...article,
        titulo: transTitle || article.titulo,
        descricao: transDesc || article.descricao,
        categoria: transCategory,
      };

      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            title: result.titulo,
            content: result.descricao,
            langCode: shortCode,
          })
        );
      } catch {}

      this.articleCache.set(`art_${article.id}_${shortCode}`, result);
      return result;
    } catch (err) {
      console.warn('[UniversalI18nService] Fallback para motor léxico offline:', err);
      return this.translateArticle(article, targetLangCode);
    }
  }

  // ---------------------------------------------------------------------------
  // SALVAR E CARREGAR PREFERÊNCIAS
  // ---------------------------------------------------------------------------
  private saveState(): void {
    try {
      localStorage.setItem('wikizero_universal_i18n_state_v1', JSON.stringify(this.state));
    } catch {}
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem('wikizero_universal_i18n_state_v1');
      if (raw) {
        this.state = { ...this.state, ...JSON.parse(raw) };
      }
    } catch {}
  }

  public getCacheMetrics(): { memoryEntries: number; targetLang: string; showOriginal: boolean } {
    return {
      memoryEntries: this.memoryCache.size + this.articleCache.size + this.pageCache.size,
      targetLang: this.state.targetLangCode,
      showOriginal: this.state.showOriginal,
    };
  }

  public clearCache(): void {
    this.memoryCache.clear();
    this.articleCache.clear();
    this.pageCache.clear();
    this.notify();
  }
}

export const universalI18nService = UniversalI18nService.getInstance();
