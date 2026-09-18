import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getAuthSafe } from './firebase';
import {
  LibraryItem,
  LibraryReview,
  LibraryItemType,
  PhysicalCirculationStatus,
  PhysicalConservationState,
  LibraryFilterOptions,
} from '../types';

const STORAGE_KEY_LIBRARY_ITEMS = 'wiki_library_items_cache_v1';
const STORAGE_KEY_LIBRARY_REVIEWS = 'wiki_library_reviews_cache_v1';
const COLLECTION_ITEMS = 'library_items';
const COLLECTION_REVIEWS = 'library_reviews';

export const DEWEY_CLASSES: { code: string; label: string; icon: string }[] = [
  { code: '000', label: '000 - Ciência da Computação, Informação e Obras Gerais', icon: '💻' },
  { code: '100', label: '100 - Filosofia e Psicologia', icon: '🧠' },
  { code: '200', label: '200 - Religião e Teologia', icon: '🕊️' },
  { code: '300', label: '300 - Ciências Sociais, Direito e Educação', icon: '⚖️' },
  { code: '400', label: '400 - Línguas, Linguística e Dicionários', icon: '🗣️' },
  { code: '500', label: '500 - Ciências Puras (Matemática, Física, Biologia)', icon: '🔬' },
  { code: '600', label: '600 - Tecnologia e Ciências Aplicadas (Engenharia, Saúde)', icon: '⚙️' },
  { code: '700', label: '700 - Artes, Arquitetura, Música e Esportes', icon: '🎨' },
  { code: '800', label: '800 - Literatura, Poesia e Retórica', icon: '📖' },
  { code: '900', label: '900 - História, Geografia, Viagens e Biografias', icon: '🌍' },
];

export const INITIAL_LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'lib-item-001',
    tipo: 'livro',
    titulo: 'Dom Casmurro',
    subtitulo: 'Memórias de Bento Santiago',
    autores: ['Assis, Machado de'],
    editora: 'Garnier',
    localPublicacao: 'Rio de Janeiro, RJ - Brasil',
    anoPublicacao: 1899,
    edicao: 'Edição Crítica Comemorativa',
    isbn: '978-85-359-1066-8',
    cdd: '869.3',
    cdu: '821.134.3(81)-3',
    cutter: 'A848d',
    codigoBarras: '789123456001',
    assuntos: ['Literatura Brasileira', 'Romance Psicológico', 'Realismo', 'Ciúme na Ficção', 'Rio de Janeiro Século XIX'],
    paginas: 256,
    dimensoesCm: '21 cm',
    ilustrado: false,
    idioma: 'Português',
    sinopse: 'Narrado em primeira pessoa por Bento Santiago (Bentinho), o livro reconstrói sua juventude e seu relacionamento com Capitu. Uma das obras-primas da literatura universal, célebre pela dúvida eterna sobre a traição com Escobar.',
    sumarioOuNotas: 'Contém prefácio crítico, notas explicativas de vocabulário e cronologia da vida do autor.',
    localizacao: {
      predio: 'Biblioteca Central WikiWorldWeb',
      andar: '2º Pavimento',
      secao: 'Literatura Brasileira e Lusófona',
      estante: 'Estante L-04',
      prateleira: 'Prateleira 2',
      codigoChamada: '869.3 A848d 1899',
      tomboPatrimonial: 'TOMBO-2026-0042',
    },
    exemplaresTotais: 4,
    exemplaresDisponiveis: 3,
    estadoConservacao: 'excelente',
    statusCirculacao: 'disponivel',
    artigoWikiVinculadoTitulo: 'Dom Casmurro',
    dataCadastro: '2026-01-15T10:00:00.000Z',
    mediaAvaliacoes: 4.9,
    totalAvaliacoes: 18,
    visualizacoes: 420,
  },
  {
    id: 'lib-item-002',
    tipo: 'periodico',
    titulo: 'Revista Brasileira de História da Ciência',
    subtitulo: 'Publicação Oficial da Sociedade Brasileira de História da Ciência (SBHC)',
    autores: ['Sociedade Brasileira de História da Ciência (SBHC)'],
    organizadores: ['Alfonso-Goldfarb, Ana Maria', 'Ferraz, Márcia Helena'],
    editora: 'SBHC / FAPESP',
    localPublicacao: 'São Paulo, SP - Brasil',
    anoPublicacao: 2024,
    volume: 'v. 17',
    fasciculoNumero: 'n. 1 (Semestral)',
    mesAnoPeriodico: 'Janeiro/Junho 2024',
    issn: '2176-3275',
    doi: '10.53727/rbhc.v17i1',
    cdd: '509',
    cutter: 'R454b',
    assuntos: ['História da Ciência', 'Epistemologia', 'Ciência no Brasil', 'Astronomia Histórica', 'História Natural'],
    paginas: 184,
    dimensoesCm: '28 cm',
    ilustrado: true,
    idioma: 'Português / Inglês',
    sinopse: 'Periódico arbitrado dedicado à difusão de pesquisas originais e documentos sobre a história das ciências exatas, biológicas, humanas e da medicina no Brasil e na América Latina.',
    sumarioOuNotas: 'Dossiê: O Observatório Nacional e a transição republicana; Artigos livres de história da medicina.',
    localizacao: {
      predio: 'Biblioteca Central WikiWorldWeb',
      andar: '1º Pavimento',
      secao: 'Hemeroteca & Periódicos Científicos',
      estante: 'Estante P-08',
      prateleira: 'Prateleira 1',
      codigoChamada: 'PER 509 R454b v.17 n.1',
      tomboPatrimonial: 'PER-2024-0891',
    },
    exemplaresTotais: 2,
    exemplaresDisponiveis: 2,
    estadoConservacao: 'novo',
    statusCirculacao: 'consulta_local',
    dataCadastro: '2026-02-10T14:30:00.000Z',
    mediaAvaliacoes: 4.8,
    totalAvaliacoes: 7,
    visualizacoes: 185,
  },
  {
    id: 'lib-item-003',
    tipo: 'livro',
    titulo: 'Os Sertões',
    subtitulo: 'Campanha de Canudos',
    autores: ['Cunha, Euclides da'],
    editora: 'Laemmert & C.',
    localPublicacao: 'Rio de Janeiro, RJ - Brasil',
    anoPublicacao: 1902,
    edicao: '1ª edição fac-similar comentada',
    isbn: '978-85-7480-456-9',
    cdd: '981.05',
    cutter: 'C972s',
    assuntos: ['Guerra de Canudos', 'História do Brasil República', 'Sociologia do Sertão', 'Geografia do Nordeste', 'Antônio Conselheiro'],
    paginas: 650,
    dimensoesCm: '24 cm',
    ilustrado: true,
    idioma: 'Português',
    sinopse: 'Dividido em "A Terra", "O Homem" e "A Luta", a obra funde jornalismo de guerra, tratado geográfico, estudo sociológico e epopeia literária sobre o massacre da comunidade de Canudos.',
    localizacao: {
      predio: 'Biblioteca Central WikiWorldWeb',
      andar: '2º Pavimento',
      secao: 'História do Brasil & Coleção Especial',
      estante: 'Estante H-02',
      prateleira: 'Prateleira 3',
      codigoChamada: '981.05 C972s 1902',
      tomboPatrimonial: 'TOMBO-2026-0115',
    },
    exemplaresTotais: 3,
    exemplaresDisponiveis: 1,
    estadoConservacao: 'bom',
    statusCirculacao: 'disponivel',
    dataCadastro: '2026-02-18T09:15:00.000Z',
    mediaAvaliacoes: 5.0,
    totalAvaliacoes: 12,
    visualizacoes: 310,
  },
  {
    id: 'lib-item-004',
    tipo: 'tese',
    titulo: 'Modelagem de Sistemas de Conhecimento Colaborativo em Ambientes Wiki Descentralizados',
    subtitulo: 'Arquiteturas resilientes para enciclopédias digitais abertas',
    autores: ['Peres, Pedro Henrique Cardona'],
    editora: 'Universidade de São Paulo (USP) - Escola Politécnica',
    localPublicacao: 'São Paulo, SP - Brasil',
    anoPublicacao: 2025,
    cdd: '004.678',
    cdu: '004.738.5:001.92',
    cutter: 'P437m',
    assuntos: ['Sistemas Distribuídos', 'Wikis', 'Gestão do Conhecimento', 'Bancos de Dados NoSQL', 'Indexação em Tempo Real'],
    paginas: 210,
    dimensoesCm: '30 cm',
    ilustrado: true,
    idioma: 'Português',
    sinopse: 'Tese acadêmica investigando mecanismos de persistência híbrida, integridade de dados e arquitetura de enciclopédias sem censura utilizando nós locais e computação em nuvem.',
    localizacao: {
      predio: 'Biblioteca Central WikiWorldWeb',
      andar: '3º Pavimento',
      secao: 'Teses e Dissertações Acadêmicas',
      estante: 'Estante T-01',
      prateleira: 'Prateleira 4',
      codigoChamada: 'TES 004.678 P437m 2025',
      tomboPatrimonial: 'TES-2025-0019',
    },
    exemplaresTotais: 2,
    exemplaresDisponiveis: 2,
    estadoConservacao: 'novo',
    statusCirculacao: 'consulta_local',
    dataCadastro: '2026-03-01T11:00:00.000Z',
    mediaAvaliacoes: 5.0,
    totalAvaliacoes: 5,
    visualizacoes: 290,
  },
];

export const INITIAL_REVIEWS: LibraryReview[] = [
  {
    id: 'rev-001',
    itemId: 'lib-item-001',
    userId: 'user-pedro-admin',
    userName: 'Pedro Henrique (Bibliotecário)',
    rating: 5,
    reviewTitle: 'Obra fundamental com riqueza psicológica inesgotável',
    reviewText: 'Dom Casmurro permanece como a mais fina ironia da literatura brasileira. O exemplar físico da biblioteca conta com excelente encadernação e notas de rodapé indispensáveis.',
    clarityRating: 5,
    rigorRating: 5,
    createdAt: '2026-01-20T16:00:00.000Z',
    recommends: true,
    likesCount: 8,
  },
  {
    id: 'rev-002',
    itemId: 'lib-item-002',
    userId: 'user-pesquisador-1',
    userName: 'Dra. Helena Martins (Historiadora)',
    rating: 5,
    reviewTitle: 'Dossiê impecável sobre a ciência brasileira',
    reviewText: 'Artigos rigorosos e documentação primária farta. Fundamental para quem pesquisa o desenvolvimento da astronomia e geodesia no Brasil.',
    clarityRating: 5,
    rigorRating: 5,
    createdAt: '2026-02-15T19:30:00.000Z',
    recommends: true,
    likesCount: 4,
  },
];

export const LibraryService = {
  // === RECUPERAÇÃO DE ITENS DO ACERVO ===
  async getLibraryItems(): Promise<LibraryItem[]> {
    let local: LibraryItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY_ITEMS);
      if (raw) {
        local = JSON.parse(raw);
      }
    } catch {
      local = [];
    }

    if (!Array.isArray(local) || local.length === 0) {
      local = [...INITIAL_LIBRARY_ITEMS];
      try {
        localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(local));
      } catch {
        // ignora erro de quota
      }
    }

    const db = getDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_ITEMS));
        if (!snap.empty) {
          const remoteList: LibraryItem[] = [];
          snap.forEach((d) => {
            const data = d.data();
            remoteList.push({
              id: data.id || d.id,
              tipo: data.tipo || 'livro',
              titulo: data.titulo || 'Sem título',
              subtitulo: data.subtitulo || undefined,
              autores: Array.isArray(data.autores) ? data.autores : ['Autor Desconhecido'],
              organizadores: Array.isArray(data.organizadores) ? data.organizadores : undefined,
              tradutores: Array.isArray(data.tradutores) ? data.tradutores : undefined,
              editora: data.editora || 'Editora Independente',
              localPublicacao: data.localPublicacao || 'Brasil',
              anoPublicacao: Number(data.anoPublicacao) || new Date().getFullYear(),
              edicao: data.edicao || undefined,
              volume: data.volume || undefined,
              fasciculoNumero: data.fasciculoNumero || undefined,
              mesAnoPeriodico: data.mesAnoPeriodico || undefined,
              isbn: data.isbn || undefined,
              issn: data.issn || undefined,
              doi: data.doi || undefined,
              codigoBarras: data.codigoBarras || undefined,
              cdd: data.cdd || undefined,
              cdu: data.cdu || undefined,
              cutter: data.cutter || undefined,
              assuntos: Array.isArray(data.assuntos) ? data.assuntos : [],
              paginas: data.paginas ? Number(data.paginas) : undefined,
              dimensoesCm: data.dimensoesCm || undefined,
              ilustrado: !!data.ilustrado,
              capaUrl: data.capaUrl || undefined,
              idioma: data.idioma || 'Português',
              idiomaOriginal: data.idiomaOriginal || undefined,
              sinopse: data.sinopse || '',
              sumarioOuNotas: data.sumarioOuNotas || undefined,
              localizacao: data.localizacao || {
                secao: 'Acervo Geral',
                estante: 'Estante Geral',
                prateleira: 'Prateleira 1',
                codigoChamada: '000',
              },
              exemplaresTotais: Number(data.exemplaresTotais) || 1,
              exemplaresDisponiveis: Number(data.exemplaresDisponiveis) || 1,
              estadoConservacao: data.estadoConservacao || 'bom',
              statusCirculacao: data.statusCirculacao || 'disponivel',
              artigoWikiVinculadoId: data.artigoWikiVinculadoId || undefined,
              artigoWikiVinculadoTitulo: data.artigoWikiVinculadoTitulo || undefined,
              cadastradoPorUid: data.cadastradoPorUid || undefined,
              cadastradoPorNome: data.cadastradoPorNome || undefined,
              dataCadastro: data.dataCadastro || new Date().toISOString(),
              ultimaModificacao: data.ultimaModificacao || undefined,
              visualizacoes: Number(data.visualizacoes) || 0,
              mediaAvaliacoes: Number(data.mediaAvaliacoes) || 0,
              totalAvaliacoes: Number(data.totalAvaliacoes) || 0,
            });
          });

          // Atualiza o cache local
          try {
            localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(remoteList));
          } catch {
            // ignora erro
          }
          return remoteList;
        } else {
          // Se o banco remoto estiver vazio, realiza o seed inicial no Firestore em background
          this.seedInitialItemsToFirestore(db, local).catch((err) =>
            console.warn('[LibraryService] Aviso ao propagar semente para o Firestore:', err)
          );
        }
      } catch (err) {
        console.warn('[LibraryService] Operando com cache local de itens bibliográficos:', err);
      }
    }

    return local;
  },

  async seedInitialItemsToFirestore(db: ReturnType<typeof getDb>, items: LibraryItem[]): Promise<void> {
    if (!db) return;
    for (const item of items) {
      try {
        await setDoc(doc(db, COLLECTION_ITEMS, item.id), {
          ...item,
          _serverCreated: serverTimestamp(),
        });
      } catch {
        // silencia se offline
      }
    }
  },

  subscribeToLibraryItems(callback: (items: LibraryItem[]) => void): () => void {
    const db = getDb();
    if (!db) {
      this.getLibraryItems().then(callback);
      return () => {};
    }

    try {
      const q = collection(db, COLLECTION_ITEMS);
      return onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list: LibraryItem[] = [];
            snap.forEach((d) => list.push(d.data() as LibraryItem));
            try {
              localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(list));
            } catch {
              // quota
            }
            callback(list);
          } else {
            this.getLibraryItems().then(callback);
          }
        },
        (error) => {
          if (error?.code === 'unavailable') return;
          console.warn('[LibraryService] Aviso no listener de library_items:', error);
          this.getLibraryItems().then(callback);
        }
      );
    } catch {
      this.getLibraryItems().then(callback);
      return () => {};
    }
  },

  async saveLibraryItem(itemData: Partial<LibraryItem> & { titulo: string; tipo: LibraryItemType }): Promise<LibraryItem> {
    const currentList = await this.getLibraryItems();
    const id = itemData.id || `lib-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const existingIndex = currentList.findIndex((i) => i.id === id);
    const existing = existingIndex >= 0 ? currentList[existingIndex] : null;

    const auth = getAuthSafe();
    const user = auth?.currentUser;

    const fullItem: LibraryItem = {
      id,
      tipo: itemData.tipo,
      titulo: itemData.titulo.trim(),
      subtitulo: itemData.subtitulo?.trim() || undefined,
      autores: Array.isArray(itemData.autores) && itemData.autores.length > 0 ? itemData.autores : ['Autor Desconhecido'],
      organizadores: itemData.organizadores || undefined,
      tradutores: itemData.tradutores || undefined,
      editora: itemData.editora?.trim() || 'Editora não informada',
      localPublicacao: itemData.localPublicacao?.trim() || 'Local não informado',
      anoPublicacao: Number(itemData.anoPublicacao) || new Date().getFullYear(),
      edicao: itemData.edicao?.trim() || undefined,
      volume: itemData.volume?.trim() || undefined,
      fasciculoNumero: itemData.fasciculoNumero?.trim() || undefined,
      mesAnoPeriodico: itemData.mesAnoPeriodico?.trim() || undefined,
      isbn: itemData.isbn?.trim() || undefined,
      issn: itemData.issn?.trim() || undefined,
      doi: itemData.doi?.trim() || undefined,
      codigoBarras: itemData.codigoBarras?.trim() || undefined,
      cdd: itemData.cdd?.trim() || undefined,
      cdu: itemData.cdu?.trim() || undefined,
      cutter: itemData.cutter?.trim() || undefined,
      assuntos: Array.isArray(itemData.assuntos) ? itemData.assuntos : [],
      paginas: itemData.paginas ? Number(itemData.paginas) : undefined,
      dimensoesCm: itemData.dimensoesCm?.trim() || undefined,
      ilustrado: !!itemData.ilustrado,
      capaUrl: itemData.capaUrl?.trim() || undefined,
      idioma: itemData.idioma?.trim() || 'Português',
      idiomaOriginal: itemData.idiomaOriginal?.trim() || undefined,
      sinopse: itemData.sinopse?.trim() || '',
      sumarioOuNotas: itemData.sumarioOuNotas?.trim() || undefined,
      localizacao: itemData.localizacao || {
        secao: 'Acervo Geral',
        estante: 'Estante 1',
        prateleira: 'Prateleira 1',
        codigoChamada: itemData.cdd ? `${itemData.cdd} ${itemData.cutter || ''}`.trim() : '000',
      },
      exemplaresTotais: Number(itemData.exemplaresTotais) || 1,
      exemplaresDisponiveis: Number(itemData.exemplaresDisponiveis) || 1,
      estadoConservacao: itemData.estadoConservacao || 'bom',
      statusCirculacao: itemData.statusCirculacao || 'disponivel',
      artigoWikiVinculadoId: itemData.artigoWikiVinculadoId || undefined,
      artigoWikiVinculadoTitulo: itemData.artigoWikiVinculadoTitulo || undefined,
      cadastradoPorUid: existing?.cadastradoPorUid || user?.uid || 'anonimo',
      cadastradoPorNome: existing?.cadastradoPorNome || user?.displayName || 'Colaborador WikiWorldWeb',
      dataCadastro: existing?.dataCadastro || now,
      ultimaModificacao: now,
      visualizacoes: existing?.visualizacoes || 0,
      mediaAvaliacoes: existing?.mediaAvaliacoes || 0,
      totalAvaliacoes: existing?.totalAvaliacoes || 0,
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = fullItem;
    } else {
      currentList.unshift(fullItem);
    }

    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(currentList));
    } catch {
      // quota
    }

    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_ITEMS, id), {
          ...fullItem,
          _updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[LibraryService] Aviso ao persistir item no Firestore:', err);
      }
    }

    return fullItem;
  },

  async deleteLibraryItem(id: string): Promise<boolean> {
    const currentList = await this.getLibraryItems();
    const filtered = currentList.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(filtered));
    } catch {
      // quota
    }

    const db = getDb();
    if (db) {
      try {
        await deleteDoc(doc(db, COLLECTION_ITEMS, id));
      } catch (err) {
        console.warn('[LibraryService] Aviso ao deletar item no Firestore:', err);
      }
    }
    return true;
  },

  // === AVALIAÇÕES & RESENHAS CRÍTICAS ===
  async getLibraryReviews(itemId?: string): Promise<LibraryReview[]> {
    let local: LibraryReview[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY_REVIEWS);
      if (raw) {
        local = JSON.parse(raw);
      }
    } catch {
      local = [];
    }

    if (!Array.isArray(local) || local.length === 0) {
      local = [...INITIAL_REVIEWS];
      try {
        localStorage.setItem(STORAGE_KEY_LIBRARY_REVIEWS, JSON.stringify(local));
      } catch {
        // quota
      }
    }

    const db = getDb();
    if (db) {
      try {
        const q = itemId
          ? query(collection(db, COLLECTION_REVIEWS), where('itemId', '==', itemId))
          : collection(db, COLLECTION_REVIEWS);
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: LibraryReview[] = [];
          snap.forEach((d) => list.push(d.data() as LibraryReview));
          return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (err) {
        console.warn('[LibraryService] Fallback de reviews para cache local:', err);
      }
    }

    if (itemId) {
      return local.filter((r) => r.itemId === itemId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  subscribeToLibraryReviews(itemId: string, callback: (reviews: LibraryReview[]) => void): () => void {
    const db = getDb();
    if (!db) {
      this.getLibraryReviews(itemId).then(callback);
      return () => {};
    }

    try {
      const q = query(collection(db, COLLECTION_REVIEWS), where('itemId', '==', itemId));
      return onSnapshot(
        q,
        (snap) => {
          const list: LibraryReview[] = [];
          snap.forEach((d) => list.push(d.data() as LibraryReview));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(list);
        },
        (err) => {
          if (err?.code === 'unavailable') return;
          console.warn('[LibraryService] Aviso no listener de reviews:', err);
          this.getLibraryReviews(itemId).then(callback);
        }
      );
    } catch {
      this.getLibraryReviews(itemId).then(callback);
      return () => {};
    }
  },

  async addLibraryReview(reviewData: Omit<LibraryReview, 'id' | 'createdAt'>): Promise<LibraryReview> {
    const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newReview: LibraryReview = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };

    // Atualiza cache local de avaliações
    let localReviews: LibraryReview[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY_REVIEWS);
      localReviews = raw ? JSON.parse(raw) : [...INITIAL_REVIEWS];
    } catch {
      localReviews = [];
    }
    localReviews.unshift(newReview);
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_REVIEWS, JSON.stringify(localReviews));
    } catch {
      // quota
    }

    // Grava no Firestore
    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_REVIEWS, id), {
          ...newReview,
          _createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[LibraryService] Aviso ao gravar review no Firestore:', err);
      }
    }

    // Recalcula média de avaliações do item
    const itemReviews = localReviews.filter((r) => r.itemId === reviewData.itemId);
    const total = itemReviews.length;
    const avg = total > 0 ? Number((itemReviews.reduce((acc, cur) => acc + cur.rating, 0) / total).toFixed(1)) : 0;

    const items = await this.getLibraryItems();
    const targetItem = items.find((i) => i.id === reviewData.itemId);
    if (targetItem) {
      targetItem.mediaAvaliacoes = avg;
      targetItem.totalAvaliacoes = total;
      await this.saveLibraryItem(targetItem);
    }

    return newReview;
  },

  // === GERADORES DE CITAÇÃO BIBLIOGRÁFICA ===
  /**
   * Citação no padrão ABNT NBR 6023
   * Ex: ASSIS, Machado de. Dom Casmurro: Memórias de Bento Santiago. Edição Crítica. Rio de Janeiro: Garnier, 1899. 256 p.
   */
  formatAbntCitation(item: LibraryItem): string {
    const primaryAuthor = item.autores[0] || 'AUTOR NÃO IDENTIFICADO';
    const otherAuthors = item.autores.slice(1);
    
    let authorsStr = primaryAuthor.toUpperCase();
    if (otherAuthors.length === 1) {
      authorsStr += `; ${otherAuthors[0].toUpperCase()}`;
    } else if (otherAuthors.length > 1) {
      authorsStr += ' et al.';
    }

    let citation = `${authorsStr}. ${item.titulo}`;
    if (item.subtitulo) {
      citation += `: ${item.subtitulo}`;
    }
    citation += '.';

    if (item.edicao) {
      citation += ` ${item.edicao}.`;
    }

    citation += ` ${item.localPublicacao}: ${item.editora}, ${item.anoPublicacao}.`;

    if (item.tipo === 'periodico') {
      if (item.volume) citation += ` ${item.volume},`;
      if (item.fasciculoNumero) citation += ` ${item.fasciculoNumero},`;
      if (item.mesAnoPeriodico) citation += ` ${item.mesAnoPeriodico}.`;
      if (item.issn) citation += ` ISSN ${item.issn}.`;
    } else {
      if (item.paginas) citation += ` ${item.paginas} p.`;
      if (item.isbn) citation += ` ISBN ${item.isbn}.`;
    }

    if (item.cdd) {
      citation += ` CDD: ${item.cdd}.`;
    }

    return citation;
  },

  /**
   * Citação no padrão APA 7th Edition
   * Ex: Assis, M. d. (1899). Dom Casmurro: Memórias de Bento Santiago. Garnier.
   */
  formatApaCitation(item: LibraryItem): string {
    const authorsStr = item.autores.join(', ');
    let citation = `${authorsStr} (${item.anoPublicacao}). ${item.titulo}`;
    if (item.subtitulo) {
      citation += `: ${item.subtitulo}`;
    }
    citation += `. ${item.editora}.`;
    if (item.doi) {
      citation += ` https://doi.org/${item.doi}`;
    } else if (item.isbn) {
      citation += ` ISBN: ${item.isbn}`;
    }
    return citation;
  },

  /**
   * Entrada BibTeX pronta para LaTeX e softwares de gerenciamento bibliográfico
   */
  formatBibtexCitation(item: LibraryItem): string {
    const bibKey = `${(item.autores[0] || 'autor').split(',')[0].toLowerCase().replace(/\s+/g, '')}${item.anoPublicacao}`;
    const bibType = item.tipo === 'periodico' ? 'article' : item.tipo === 'tese' ? 'phdthesis' : 'book';

    return `@${bibType}{${bibKey},
  title = {${item.titulo}${item.subtitulo ? ': ' + item.subtitulo : ''}},
  author = {${item.autores.join(' and ')}},
  publisher = {${item.editora}},
  address = {${item.localPublicacao}},
  year = {${item.anoPublicacao}},
  ${item.isbn ? `isbn = {${item.isbn}},` : ''}
  ${item.issn ? `issn = {${item.issn}},` : ''}
  ${item.cdd ? `note = {CDD: ${item.cdd}, Chamada: ${item.localizacao.codigoChamada}},` : ''}
}`;
  },

  /**
   * Gera código Cutter aproximado para notação de autor
   */
  generateCutterCode(author: string, title: string): string {
    if (!author) return 'A100a';
    const cleanAuthor = author.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const firstLetter = cleanAuthor[0] || 'A';
    
    // Hash determinístico simples de 3 dígitos
    let hash = 0;
    for (let i = 0; i < cleanAuthor.length; i++) {
      hash = (hash * 31 + cleanAuthor.charCodeAt(i)) % 900;
    }
    const cutterNumber = 100 + hash;
    const titleLetter = (title || 'a').trim()[0]?.toLowerCase() || 'a';

    return `${firstLetter}${cutterNumber}${titleLetter}`;
  },

  /**
   * Validação de formato de ISBN (10 ou 13 dígitos com hifens opcionais)
   */
  validateIsbn(isbn: string): boolean {
    const clean = isbn.replace(/[^0-9X]/gi, '');
    return clean.length === 10 || clean.length === 13;
  },

  /**
   * Validação de formato de ISSN (8 dígitos, com ou sem hífen)
   */
  validateIssn(issn: string): boolean {
    const clean = issn.replace(/[^0-9X]/gi, '');
    return clean.length === 8;
  },
};
