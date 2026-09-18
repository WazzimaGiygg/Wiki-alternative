import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import {
  AcademicPublication,
  AcademicPeerReview,
  ResearcherProfile,
  AcademicPublicationType,
} from '../types/academic';

const COLLECTION_PUBLICATIONS = 'academic_publications';
const COLLECTION_PEER_REVIEWS = 'academic_peer_reviews';

const STORAGE_KEY_PUBLICATIONS = 'wiki_academic_publications_cache_v1';
const STORAGE_KEY_PEER_REVIEWS = 'wiki_academic_peer_reviews_cache_v1';
const PURGE_SPECULATIVE_FLAG = 'wiki_academic_purged_speculative_v1';

export function purgeSpeculativeAcademicData(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(PURGE_SPECULATIVE_FLAG)) {
    try {
      localStorage.removeItem(STORAGE_KEY_PUBLICATIONS);
      localStorage.removeItem(STORAGE_KEY_PEER_REVIEWS);
    } catch {
      // ignora
    }
    localStorage.setItem(PURGE_SPECULATIVE_FLAG, 'true');
  }
}

function normalizePublication(id: string, data: any): AcademicPublication {
  return {
    id: data.id || id,
    tipo: data.tipo || 'artigo_periodico',
    titulo: data.titulo || 'Sem título acadêmico',
    subtitulo: data.subtitulo || undefined,
    tituloIngles: data.tituloIngles || undefined,
    autores: Array.isArray(data.autores) && data.autores.length > 0
      ? data.autores
      : [{ nome: 'Autor Não Identificado' }],
    orientadores: Array.isArray(data.orientadores) ? data.orientadores : undefined,
    bancaExaminadora: Array.isArray(data.bancaExaminadora) ? data.bancaExaminadora : undefined,
    universidadeOuInstituicao: data.universidadeOuInstituicao || 'Instituição Acadêmica',
    programaPosGraduacao: data.programaPosGraduacao || undefined,
    periodicoOuEvento: data.periodicoOuEvento || undefined,
    volume: data.volume || undefined,
    fasciculo: data.fasciculo || undefined,
    paginas: data.paginas || undefined,
    anoPublicacao: Number(data.anoPublicacao) || new Date().getFullYear(),
    dataPublicacao: data.dataPublicacao || undefined,
    doi: data.doi || undefined,
    arxivId: data.arxivId || undefined,
    pubmedId: data.pubmedId || undefined,
    handleUri: data.handleUri || undefined,
    issn: data.issn || undefined,
    isbn: data.isbn || undefined,
    resumo: data.resumo || '',
    resumoIngles: data.resumoIngles || undefined,
    palavrasChave: Array.isArray(data.palavrasChave) ? data.palavrasChave : [],
    palavrasChaveIngles: Array.isArray(data.palavrasChaveIngles) ? data.palavrasChaveIngles : undefined,
    areaConhecimentoCnpq: data.areaConhecimentoCnpq || 'Multidisciplinar',
    classificacaoJelAcm: data.classificacaoJelAcm || undefined,
    agenciaFomento: data.agenciaFomento || undefined,
    processoFomento: data.processoFomento || undefined,
    statusAcesso: data.statusAcesso || 'open_access',
    licenca: data.licenca || 'Creative Commons CC-BY 4.0',
    pdfUrl: data.pdfUrl || undefined,
    repositorioUrl: data.repositorioUrl || undefined,
    codigoOuDadosUrl: data.codigoOuDadosUrl || undefined,
    totalCitacoes: Number(data.totalCitacoes) || 0,
    citacoesLista: Array.isArray(data.citacoesLista) ? data.citacoesLista : [],
    visualizacoes: Number(data.visualizacoes) || 0,
    downloads: Number(data.downloads) || 0,
    statusRevisao: data.statusRevisao || 'peer_reviewed',
    artigoWikiVinculadoTitulo: data.artigoWikiVinculadoTitulo || undefined,
    submittedByUid: data.submittedByUid || undefined,
    submittedByName: data.submittedByName || undefined,
    dataCriacao: data.dataCriacao || new Date().toISOString(),
    dataAtualizacao: data.dataAtualizacao || undefined,
  };
}

function normalizePeerReview(id: string, data: any): AcademicPeerReview {
  return {
    id: data.id || id,
    publicationId: data.publicationId,
    reviewerUid: data.reviewerUid || 'anonimo',
    reviewerName: data.reviewerName || 'Revisor Acadêmico',
    reviewerFiliacao: data.reviewerFiliacao || undefined,
    tituloParecer: data.tituloParecer || 'Parecer de Avaliação',
    parecerTexto: data.parecerTexto || '',
    parecerDecisao: data.parecerDecisao || 'recomendado',
    notaRigorMetodologico: Number(data.notaRigorMetodologico) || 5,
    notaOriginalidade: Number(data.notaOriginalidade) || 5,
    notaClareza: Number(data.notaClareza) || 5,
    notaRelevancia: Number(data.notaRelevancia) || 5,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

export const AcademicService = {
  /**
   * Recupera todas as publicações cadastradas no Cloud Firestore
   */
  async getPublications(): Promise<AcademicPublication[]> {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_PUBLICATIONS));
        const list: AcademicPublication[] = [];
        snap.forEach((d) => {
          list.push(normalizePublication(d.id, d.data()));
        });

        // Ordena por ano decrescente e data de criação
        list.sort((a, b) => b.anoPublicacao - a.anoPublicacao || new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());

        try {
          localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(list));
        } catch {
          // ignora quota
        }
        return list;
      } catch (err) {
        console.warn('[AcademicService] Erro ao consultar Firestore:', err);
      }
    }

    // Fallback local
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PUBLICATIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignora
    }
    return [];
  },

  /**
   * Importação manual e sincronização imediata com Firestore
   */
  async importFromFirebase(): Promise<{ publications: AcademicPublication[]; reviews: AcademicPeerReview[]; count: number }> {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (!db) {
      throw new Error('Cloud Firestore não está acessível no momento.');
    }

    const snapPubs = await getDocs(collection(db, COLLECTION_PUBLICATIONS));
    const pubs: AcademicPublication[] = [];
    snapPubs.forEach((d) => {
      pubs.push(normalizePublication(d.id, d.data()));
    });
    pubs.sort((a, b) => b.anoPublicacao - a.anoPublicacao || new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());

    const snapReviews = await getDocs(collection(db, COLLECTION_PEER_REVIEWS));
    const reviews: AcademicPeerReview[] = [];
    snapReviews.forEach((d) => {
      reviews.push(normalizePeerReview(d.id, d.data()));
    });

    try {
      localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(pubs));
      localStorage.setItem(STORAGE_KEY_PEER_REVIEWS, JSON.stringify(reviews));
    } catch {
      // ignora quota
    }

    return { publications: pubs, reviews, count: pubs.length };
  },

  /**
   * Subscrição em tempo real aos documentos acadêmicos do Firestore
   */
  subscribeToPublications(callback: (pubs: AcademicPublication[]) => void): () => void {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (!db) {
      this.getPublications().then(callback);
      return () => {};
    }

    try {
      return onSnapshot(
        collection(db, COLLECTION_PUBLICATIONS),
        (snap) => {
          const list: AcademicPublication[] = [];
          snap.forEach((d) => list.push(normalizePublication(d.id, d.data())));
          list.sort((a, b) => b.anoPublicacao - a.anoPublicacao || new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
          try {
            localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(list));
          } catch {
            // ignora
          }
          callback(list);
        },
        (error) => {
          console.warn('[AcademicService] Snapshot error:', error);
          this.getPublications().then(callback);
        }
      );
    } catch {
      this.getPublications().then(callback);
      return () => {};
    }
  },

  /**
   * Salva ou atualiza uma publicação científica no Firestore
   */
  async savePublication(
    data: Partial<AcademicPublication> & { titulo: string; tipo: AcademicPublicationType; anoPublicacao: number; resumo: string }
  ): Promise<AcademicPublication> {
    purgeSpeculativeAcademicData();
    const currentList = await this.getPublications();
    const id = data.id || `acad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const existing = currentList.find((p) => p.id === id);
    const existingIndex = currentList.findIndex((p) => p.id === id);

    const fullPub: AcademicPublication = {
      id,
      tipo: data.tipo,
      titulo: data.titulo.trim(),
      subtitulo: data.subtitulo?.trim() || undefined,
      tituloIngles: data.tituloIngles?.trim() || undefined,
      autores: Array.isArray(data.autores) && data.autores.length > 0 ? data.autores : [{ nome: 'Autor Desconhecido' }],
      orientadores: data.orientadores || undefined,
      bancaExaminadora: data.bancaExaminadora || undefined,
      universidadeOuInstituicao: data.universidadeOuInstituicao?.trim() || 'Instituição Acadêmica',
      programaPosGraduacao: data.programaPosGraduacao?.trim() || undefined,
      periodicoOuEvento: data.periodicoOuEvento?.trim() || undefined,
      volume: data.volume?.trim() || undefined,
      fasciculo: data.fasciculo?.trim() || undefined,
      paginas: data.paginas?.trim() || undefined,
      anoPublicacao: Number(data.anoPublicacao) || new Date().getFullYear(),
      dataPublicacao: data.dataPublicacao || undefined,
      doi: data.doi?.trim().replace(/^https?:\/\/doi\.org\//, '') || undefined,
      arxivId: data.arxivId?.trim() || undefined,
      pubmedId: data.pubmedId?.trim() || undefined,
      handleUri: data.handleUri?.trim() || undefined,
      issn: data.issn?.trim() || undefined,
      isbn: data.isbn?.trim() || undefined,
      resumo: data.resumo.trim(),
      resumoIngles: data.resumoIngles?.trim() || undefined,
      palavrasChave: Array.isArray(data.palavrasChave) ? data.palavrasChave : [],
      palavrasChaveIngles: Array.isArray(data.palavrasChaveIngles) ? data.palavrasChaveIngles : undefined,
      areaConhecimentoCnpq: data.areaConhecimentoCnpq?.trim() || 'Ciência da Computação',
      classificacaoJelAcm: data.classificacaoJelAcm?.trim() || undefined,
      agenciaFomento: data.agenciaFomento?.trim() || undefined,
      processoFomento: data.processoFomento?.trim() || undefined,
      statusAcesso: data.statusAcesso || 'open_access',
      licenca: data.licenca?.trim() || 'Creative Commons CC-BY 4.0',
      pdfUrl: data.pdfUrl?.trim() || undefined,
      repositorioUrl: data.repositorioUrl?.trim() || undefined,
      codigoOuDadosUrl: data.codigoOuDadosUrl?.trim() || undefined,
      totalCitacoes: Number(data.totalCitacoes ?? existing?.totalCitacoes ?? 0),
      citacoesLista: data.citacoesLista || existing?.citacoesLista || [],
      visualizacoes: Number(data.visualizacoes ?? existing?.visualizacoes ?? 0),
      downloads: Number(data.downloads ?? existing?.downloads ?? 0),
      statusRevisao: data.statusRevisao || 'peer_reviewed',
      artigoWikiVinculadoTitulo: data.artigoWikiVinculadoTitulo?.trim() || undefined,
      submittedByUid: data.submittedByUid || existing?.submittedByUid,
      submittedByName: data.submittedByName || existing?.submittedByName,
      dataCriacao: existing?.dataCriacao || now,
      dataAtualizacao: now,
    };

    // 1. Grava no Cloud Firestore
    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_PUBLICATIONS, id), {
          ...fullPub,
          _serverModified: serverTimestamp(),
        });
      } catch (err) {
        console.error('[AcademicService] Erro ao persistir no Firestore:', err);
      }
    }

    // 2. Atualiza cache local
    if (existingIndex >= 0) {
      currentList[existingIndex] = fullPub;
    } else {
      currentList.unshift(fullPub);
    }
    try {
      localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(currentList));
    } catch {
      // ignora quota
    }

    return fullPub;
  },

  /**
   * Deleta uma publicação do Firestore
   */
  async deletePublication(id: string): Promise<boolean> {
    const db = getDb();
    if (db) {
      try {
        await deleteDoc(doc(db, COLLECTION_PUBLICATIONS, id));
      } catch (err) {
        console.error('[AcademicService] Erro ao deletar no Firestore:', err);
      }
    }

    const currentList = await this.getPublications();
    const filtered = currentList.filter((p) => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(filtered));
    } catch {
      // ignora
    }
    return true;
  },

  /**
   * Registra uma citação a uma publicação
   */
  async addCitation(publicationId: string, citation: { titulo: string; ano: number; veiculo: string; autores?: string; doi?: string }): Promise<void> {
    const list = await this.getPublications();
    const pub = list.find((p) => p.id === publicationId);
    if (!pub) return;

    const citacoesLista = pub.citacoesLista ? [...pub.citacoesLista] : [];
    citacoesLista.push(citation);
    const totalCitacoes = (pub.totalCitacoes || 0) + 1;

    await this.savePublication({
      ...pub,
      totalCitacoes,
      citacoesLista,
    });
  },

  /**
   * Pareceres Acadêmicos e Revisão por Pares Aberta
   */
  async getPeerReviews(publicationId?: string): Promise<AcademicPeerReview[]> {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (db) {
      try {
        const q = publicationId
          ? query(collection(db, COLLECTION_PEER_REVIEWS), where('publicationId', '==', publicationId))
          : collection(db, COLLECTION_PEER_REVIEWS);
        const snap = await getDocs(q);
        const list: AcademicPeerReview[] = [];
        snap.forEach((d) => list.push(normalizePeerReview(d.id, d.data())));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      } catch (err) {
        console.warn('[AcademicService] Erro ao carregar pareceres do Firestore:', err);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PEER_REVIEWS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (publicationId) return parsed.filter((r) => r.publicationId === publicationId);
          return parsed;
        }
      }
    } catch {
      // ignora
    }
    return [];
  },

  async addPeerReview(reviewData: Omit<AcademicPeerReview, 'id' | 'createdAt'>): Promise<AcademicPeerReview> {
    purgeSpeculativeAcademicData();
    const id = `rev-acad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newReview: AcademicPeerReview = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_PEER_REVIEWS, id), {
          ...newReview,
          _serverCreated: serverTimestamp(),
        });
      } catch (err) {
        console.error('[AcademicService] Erro ao salvar parecer no Firestore:', err);
      }
    }

    const reviews = await this.getPeerReviews();
    reviews.unshift(newReview);
    try {
      localStorage.setItem(STORAGE_KEY_PEER_REVIEWS, JSON.stringify(reviews));
    } catch {
      // ignora
    }

    return newReview;
  },

  /**
   * Computa perfis acadêmicos (estilo Google Acadêmico):
   * Calcula h-index, i10-index, total de citações e histórico anual por autor
   */
  computeResearcherProfiles(publications: AcademicPublication[]): ResearcherProfile[] {
    const authorMap = new Map<string, { filiacao: string; orcid?: string; pubs: AcademicPublication[]; areas: Set<string> }>();

    for (const pub of publications) {
      for (const author of pub.autores) {
        const name = author.nome.trim();
        if (!name) continue;

        if (!authorMap.has(name)) {
          authorMap.set(name, {
            filiacao: author.filiacao || pub.universidadeOuInstituicao || 'Universidade / Instituto',
            orcid: author.orcid,
            pubs: [],
            areas: new Set(),
          });
        }
        const entry = authorMap.get(name)!;
        entry.pubs.push(pub);
        if (author.orcid && !entry.orcid) entry.orcid = author.orcid;
        if (pub.areaConhecimentoCnpq) entry.areas.add(pub.areaConhecimentoCnpq);
      }
    }

    const profiles: ResearcherProfile[] = [];

    authorMap.forEach((entry, authorName) => {
      const pubs = entry.pubs;
      const totalCitations = pubs.reduce((sum, p) => sum + (p.totalCitacoes || 0), 0);

      // Cálculo do Índice h (h-index): h publicações com pelo menos h citações
      const sortedCitations = pubs.map((p) => p.totalCitacoes || 0).sort((a, b) => b - a);
      let hIndex = 0;
      for (let i = 0; i < sortedCitations.length; i++) {
        if (sortedCitations[i] >= i + 1) {
          hIndex = i + 1;
        } else {
          break;
        }
      }

      // Cálculo do Índice i10 (i10-index): publicações com pelo menos 10 citações
      const i10Index = sortedCitations.filter((c) => c >= 10).length;

      // Citações por ano de publicação
      const citacoesPorAno: Record<number, number> = {};
      for (const p of pubs) {
        const year = p.anoPublicacao;
        citacoesPorAno[year] = (citacoesPorAno[year] || 0) + (p.totalCitacoes || 0);
      }

      profiles.push({
        nome: authorName,
        filiacao: entry.filiacao,
        orcid: entry.orcid,
        totalPublicacoes: pubs.length,
        totalCitacoes: totalCitations,
        indiceH: hIndex,
        indiceI10: i10Index,
        citacoesPorAno,
        areasInteresse: Array.from(entry.areas),
        publicacoes: pubs.sort((a, b) => (b.totalCitacoes || 0) - (a.totalCitacoes || 0)),
      });
    });

    // Ordena os pesquisadores pelo maior número de citações
    return profiles.sort((a, b) => b.totalCitacoes - a.totalCitacoes || b.totalPublicacoes - a.totalPublicacoes);
  },
};
