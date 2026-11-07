/**
 * @file src/utils/standardUidRegistry.ts
 * @description Registro oficial da Aplicação Primária de UIDs Padronizados (Recurso 4.1.1.54.7)
 * Mapeamento de 161 identificadores padronizados (1.0.0-BD.001 a 1.0.0-WZ.161)
 * vinculando componentes de infraestrutura, arquivos, recursos, commits, métricas, temas e links legais.
 */

import { ViewMode } from '../types';

export type StandardUidCategory =
  | 'database'
  | 'auth'
  | 'rules'
  | 'config'
  | 'frontend'
  | 'backend'
  | 'file'
  | 'hosting'
  | 'feature'
  | 'commit'
  | 'quote'
  | 'metric'
  | 'comparison'
  | 'theme'
  | 'legal';

export interface StandardUidEntry {
  uid: string;
  name: string;
  category: StandardUidCategory;
  targetView?: ViewMode;
  targetTab?: string;
  description?: string;
}

export const STANDARD_UID_LIST: StandardUidEntry[] = [
  // 1-6: Infra & Configuração Base
  { uid: '1.0.0-BD.001', name: 'Cloud Firestore', category: 'database', targetView: 'admin-firebase', description: 'Banco de dados NoSQL distribuído em tempo real do Google Cloud.' },
  { uid: '1.0.0-FA.002', name: 'Firebase Authentication', category: 'auth', description: 'Sistema de autenticação federada com Google e credenciais anônimas.' },
  { uid: '1.0.0-FR.003', name: 'firestore.rules', category: 'rules', targetView: 'admin-firebase', description: 'Regras declarativas de segurança e controle de acesso ABAC/RBAC.' },
  { uid: '1.0.0-FB.004', name: 'firebase-blueprint.json', category: 'config', description: 'Esquema intermediário de entidades e coleções do Firestore.' },
  { uid: '1.0.0-FC.005', name: 'firebase-applet-config.json', category: 'config', description: 'Parâmetros de inicialização do projeto e chaves públicas da aplicação.' },
  { uid: '1.0.0-EN.006', name: '.env.example', category: 'config', description: 'Modelo de variáveis de ambiente do runtime.' },

  // 7-16: Framework & UI Libraries
  { uid: '1.0.0-RE.007', name: 'React 19', category: 'frontend', description: 'Biblioteca para construção de interfaces reativas baseada em componentes.' },
  { uid: '1.0.0-TS.008', name: 'TypeScript', category: 'frontend', description: 'Tipagem estática avançada e checagem de integridade em tempo de build.' },
  { uid: '1.0.0-VI.009', name: 'Vite 6', category: 'frontend', description: 'Bundler de desenvolvimento ultra-rápido com HMR e compilação ESM.' },
  { uid: '1.0.0-TW.010', name: 'Tailwind CSS 4', category: 'frontend', description: 'Framework de estilização utilitária de alto desempenho.' },
  { uid: '1.0.0-LR.011', name: 'Lucide React', category: 'frontend', description: 'Conjunto canônico de ícones SVG limpos e consistentes.' },
  { uid: '1.0.0-MO.012', name: 'Motion', category: 'frontend', description: 'Biblioteca de animações fluídas e transições de tela.' },
  { uid: '1.0.0-IN.013', name: 'index.html', category: 'file', description: 'Ponto de entrada HTML5 com metatags de SEO e script PWA.' },
  { uid: '1.0.0-PW.014', name: 'PWA (vite-plugin-pwa)', category: 'frontend', targetView: 'offline', description: 'Progressive Web App com service worker, cache offline e manifesto.' },
  { uid: '1.0.0-RC.015', name: 'Recharts', category: 'frontend', targetView: 'hub', description: 'Gráficos analíticos reativos de séries temporais e rankings editoriais.' },
  { uid: '1.0.0-CC.016', name: 'canvas-confetti', category: 'frontend', description: 'Efeitos visuais comemorativos para metas e conquistas na wiki.' },

  // 17-23: Backend & Configurações de Build
  { uid: '1.0.0-SV.017', name: 'server.ts', category: 'backend', description: 'Servidor full-stack Express que orquestra rotas de API e proxy seguro.' },
  { uid: '1.0.0-EX.018', name: 'Express', category: 'backend', description: 'Framework web HTTP para middleware e endpoints da aplicação.' },
  { uid: '1.0.0-TX.019', name: 'tsx', category: 'backend', description: 'Executor TypeScript de alto desempenho em tempo de desenvolvimento.' },
  { uid: '1.0.0-BU.020', name: 'Bun', category: 'backend', description: 'Ambiente alternativo de execução JavaScript/TypeScript e gerenciador de pacotes.' },
  { uid: '1.0.0-NO.021', name: 'Node.js 20+', category: 'backend', description: 'Ambiente de execução de JavaScript server-side com suporte LTS.' },
  { uid: '1.0.0-VC.022', name: 'vite.config.ts', category: 'config', description: 'Configuração central dos plugins Vite, Tailwind e PWA.' },
  { uid: '1.0.0-TC.023', name: 'tsconfig.json', category: 'config', description: 'Opções de compilação estrita do TypeScript.' },

  // 24-29: Integrações de IA & Utilitários de Mídia
  { uid: '1.0.0-GG.024', name: '@google/genai (Gemini)', category: 'feature', targetView: 'gemini-notebook', description: 'SDK oficial do Google Gemini para síntese de artigos e apoio pedagógico.' },
  { uid: '1.0.0-GA.025', name: 'Google AI Studio key', category: 'config', description: 'Chave de acesso gerenciada pelo servidor para invocação do modelo Gemini.' },
  { uid: '1.0.0-GV.026', name: 'googled647acff88367322.html', category: 'file', description: 'Arquivo estático de validação do Google Search Console e Reader Revenue.' },
  { uid: '1.0.0-JP.027', name: 'jsPDF', category: 'feature', description: 'Geração client-side de relatórios de auditoria e diffs em PDF.' },
  { uid: '1.0.0-HC.028', name: 'html2canvas', category: 'feature', description: 'Renderização de elementos DOM em imagens para exportação gráfica.' },
  { uid: '1.0.0-JZ.029', name: 'JSZip', category: 'feature', description: 'Descompressão e montagem de pacotes compactados de documentos.' },

  // 30-43: Estrutura de Diretórios e Metadados do Repositório
  { uid: '1.0.0-AA.030', name: 'assets/.aistudio/', category: 'file', description: 'Recursos visuais internos e artefatos de build.' },
  { uid: '1.0.0-PU.031', name: 'public/', category: 'file', description: 'Diretório público de ícones, manifesto PWA e fontes estáticas.' },
  { uid: '1.0.0-SC.032', name: 'scripts/', category: 'file', description: 'Scripts de validação e testes autônomos do motor antiplágio e sanitização.' },
  { uid: '1.0.0-SR.033', name: 'src/', category: 'file', description: 'Código-fonte principal dos componentes, serviços, hooks e extensões.' },
  { uid: '1.0.0-TE.034', name: 'tests/', category: 'file', description: 'Suíte de testes automatizados com Vitest cobrindo similaridade e rede.' },
  { uid: '1.0.0-UP.035', name: 'updates/', category: 'file', targetView: 'site-updates', description: 'Notas e documentação de versões liberadas do sistema.' },
  { uid: '1.0.0-CP.036', name: 'chora.png', category: 'file', description: 'Arte comemorativa e recurso visual da enciclopédia.' },
  { uid: '1.0.0-MD.037', name: 'MAINTAINERS.md', category: 'file', description: 'Orientações oficiais de governança, mantenedores e conselho de burocratas.' },
  { uid: '1.0.0-RM.038', name: 'README.md', category: 'file', description: 'Apresentação geral do projeto WikiWorldWeb no GitHub.' },
  { uid: '1.0.0-SE.039', name: 'SECURITY.md', category: 'file', targetView: 'security', description: 'Políticas de reporte responsável de vulnerabilidades e segurança.' },
  { uid: '1.0.0-MT.040', name: 'metadata.json', category: 'file', description: 'Metadados oficiais do applet no AI Studio.' },
  { uid: '1.0.0-GI.041', name: '.gitignore', category: 'file', description: 'Filtros de arquivos e pastas excluídos do controle de versão.' },
  { uid: '1.0.0-BL.042', name: 'bun.lock / package-lock.json', category: 'file', description: 'Bloqueio de versões exatas de dependências do ecossistema.' },
  { uid: '1.0.0-PJ.043', name: 'package.json', category: 'file', description: 'Declaração oficial de scripts, dependências e versão do projeto.' },

  // 44-47: Hospedagem e Infraestrutura
  { uid: '1.0.0-VE.044', name: 'Vercel', category: 'hosting', description: 'Plataforma de hospedagem e distribuição Edge da interface web.' },
  { uid: '1.0.0-CR.045', name: 'Cloud Run', category: 'hosting', description: 'Contêiner serverless gerenciado para o dev server e ambiente de teste.' },
  { uid: '1.0.0-FH.046', name: 'Firebase Hosting', category: 'hosting', description: 'CDN global de baixa latência para publicação estática.' },
  { uid: '1.0.0-AR.047', name: 'Arquitetura serverless', category: 'hosting', description: 'Topologia distribuída orientada a eventos e consumo sob demanda.' },

  // 48-65: Funcionalidades Centrais do Sistema
  { uid: '1.0.0-LG.048', name: 'LGPD (Lei 13.709/2018)', category: 'legal', targetView: 'privacy', description: 'Conformidade integral com a Lei Geral de Proteção de Dados Pessoais.' },
  { uid: '1.0.0-CD.049', name: 'Central de Dados (Meus Dados)', category: 'feature', targetView: 'mydata', description: 'Portal de transparência para consulta, retificação e exclusão de dados.' },
  { uid: '1.0.0-VI.050', name: 'Verificação de idade', category: 'feature', targetView: 'mydata', description: 'Mecanismo de consentimento etário e proteção da infância.' },
  { uid: '1.0.0-SM.051', name: 'Scanner de malware + quarentena', category: 'feature', targetView: 'security', description: 'Camada de auditoria antivírus e proteção de integridade de uploads.' },
  { uid: '1.0.0-AP.052', name: 'Anti-plágio', category: 'feature', targetView: 'antiplagio', description: 'Motor determinístico de contenção textual e adequação às normas ABNT.' },
  { uid: '1.0.0-EW.053', name: 'Editor de Wikitexto em tempo real', category: 'feature', targetView: 'editor', description: 'Editor visual com suporte a formatação wikitext e preview simultâneo.' },
  { uid: '1.0.0-GN.054', name: 'Gemini Notebook', category: 'feature', targetView: 'gemini-notebook', description: 'Caderno interativo de anotações e pesquisa amparado por IA generativa.' },
  { uid: '1.0.0-HN.055', name: 'Histórico de navegação', category: 'feature', description: 'Armazenamento local seguro das últimas páginas e verbetes consultados.' },
  { uid: '1.0.0-WL.056', name: 'Wiki dos Livros', category: 'feature', targetView: 'library', description: 'Acervo e catálogo bibliográfico de obras físicas e digitais.' },
  { uid: '1.0.0-WU.057', name: 'Wiki Universitário', category: 'feature', targetView: 'academic', description: 'Repositório de teses, dissertações e artigos acadêmicos indexados.' },
  { uid: '1.0.0-JW.058', name: 'Jornal WazzimaGiygg', category: 'feature', targetView: 'news', description: 'Edição jornalística aberta com cobertura comunitária e notícias da wiki.' },
  { uid: '1.0.0-TV.059', name: 'Temas visuais personalizáveis', category: 'theme', targetView: 'appearance', description: 'Motor de temas retrô e modernos aplicados instantaneamente à interface.' },
  { uid: '1.0.0-SF.060', name: 'Sincronização Cloud Firestore', category: 'database', targetView: 'admin-firebase', description: 'Replicação em tempo real de artigos, edições e configurações.' },
  { uid: '1.0.0-SR.061', name: 'Sistema de reputação + checklist diário', category: 'feature', description: 'Engajamento comunitário por meio de metas diárias de contribuição.' },
  { uid: '1.0.0-MD.062', name: 'Mensagens diretas', category: 'feature', description: 'Chat criptografado e seguro entre usuários registrados da plataforma.' },
  { uid: '1.0.0-PW.063', name: 'PWA completo', category: 'feature', targetView: 'offline', description: 'Instalação nativa em Android, Windows, Mac e iOS via navegador.' },
  { uid: '1.0.0-I1.064', name: 'Tradução universal (i18n)', category: 'feature', description: 'Suporte a mais de 30 idiomas com conversão automática de conteúdo.' },
  { uid: '1.0.0-FA.065', name: 'Ferramentas administrativas avançadas', category: 'feature', targetView: 'admin-dashboard', description: 'Painel de moderação, CheckUser, ArbCom e controle de bloqueios.' },

  // 66-76: Histórico Cronológico de Commits Relevantes
  { uid: '1.0.0-C1.066', name: 'Commit 28/08/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Marco inicial da arquitetura WikiWorldWeb.' },
  { uid: '1.0.0-C2.067', name: 'Commit 30/08/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Consolidação das primeiras coleções e páginas dinâmicas.' },
  { uid: '1.0.0-C3.068', name: 'Commit 06/09/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Implementação dos chamados de emergência e conselho gestor.' },
  { uid: '1.0.0-C4.069', name: 'Commit 14/09/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Adição de temas nostálgicos e personalização visual.' },
  { uid: '1.0.0-C5.070', name: 'Commit 18/09/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Suporte à sincronização no Firebase Firestore.' },
  { uid: '1.0.0-C6.071', name: 'Commit 03/10/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Expansão das rotas canônicas e navegação por UID.' },
  { uid: '1.0.0-C7.072', name: 'Commit 09/10/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Aprimoramento das ferramentas de auditoria e segurança.' },
  { uid: '1.0.0-C8.073', name: 'Commit 11/10/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Lançamento do Wiki dos Livros e Wiki Universitário.' },
  { uid: '1.0.0-C9.074', name: 'Commit 22/10/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Integração do Google Reader Revenue Manager.' },
  { uid: '1.0.0-C10.075', name: 'Commit 23/10/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Lançamento da edição digital do Jornal WazzimaGiygg.' },
  { uid: '1.0.0-C11.076', name: 'Commit 01/11/2026', category: 'commit', targetView: 'site-updates', targetTab: 'github-diffs', description: 'Módulo antiplágio determinístico e suíte de testes unitários.' },

  // 77-84: Identidade & Metadados da Enciclopédia
  { uid: '1.0.0-WZ.077', name: 'WikiWorldWeb / WikiZero', category: 'feature', targetView: 'hub', description: 'Enciclopédia digital livre, aberta e sem anúncios corporativos.' },
  { uid: '1.0.0-WZ.078', name: 'WIKIZERO v3.05', category: 'feature', targetView: 'site-updates', description: 'Versão estável legada com sistema de extensões em nuvem.' },
  { uid: '1.0.0-WZ.079', name: 'WikiZero V4.1', category: 'feature', targetView: 'site-updates', description: 'Versão principal com módulo antiplágio e telemetria de conectividade.' },
  { uid: '1.0.0-WZ.080', name: 'GNU GPL v3.0', category: 'legal', targetView: 'terms', description: 'Licença pública de software livre que assegura liberdade de uso e modificação.' },
  { uid: '1.0.0-WZ.081', name: '🇧🇷 Português (Brasil)', category: 'feature', description: 'Idioma primário oficial da redação e comunidade da Wiki.' },
  { uid: '1.0.0-WZ.082', name: '«Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»', category: 'quote', targetView: 'hub', description: 'Lema filosófico fundador gravado em grego clássico.' },
  { uid: '1.0.0-WZ.083', name: '"Não, o Tempo não é o senhor do conhecimento!"', category: 'quote', targetView: 'hub', description: 'Tradução lusófona oficial do lema fundador da WikiWorldWeb.' },
  { uid: '1.0.0-WZ.084', name: 'Enciclopédia aberta', category: 'feature', targetView: 'hub', description: 'Modelo enciclopédico comunitário sem restrições de leitura.' },

  // 85-89: Métricas em Destaque & Padrão Editorial
  { uid: '1.0.0-WZ.085', name: 'Coleções Ativas = 0', category: 'metric', targetView: 'hub', description: 'Contador de coleções e livros criados no ecossistema.' },
  { uid: '1.0.0-WZ.086', name: 'Artigos Publicados = 9', category: 'metric', targetView: 'hub', description: 'Total de verbetes e artigos de referência publicados.' },
  { uid: '1.0.0-WZ.087', name: 'Leituras Totais = 43,292', category: 'metric', targetView: 'hub', description: 'Volume acumulado de visualizações de artigos auditadas.' },
  { uid: '1.0.0-WZ.088', name: 'Licença Pública', category: 'legal', targetView: 'terms', description: 'Garantia de distribuição livre e citação acadêmica.' },
  { uid: '1.0.0-WZ.089', name: 'Padrão Ouro • Score 79/100', category: 'metric', targetView: 'hub', description: 'Índice de conformidade editorial, referências e rigor enciclopédico.' },

  // 90-103: Ficha e Metadados do Artigo em Destaque
  { uid: '1.0.0-WZ.090', name: 'Data do destaque', category: 'metric', targetView: 'hub', description: 'Data de publicação do verbete em evidência na página inicial.' },
  { uid: '1.0.0-WZ.091', name: 'Categoria do destaque', category: 'metric', targetView: 'hub', description: 'Classificação temática do verbete de destaque.' },
  { uid: '1.0.0-WZ.092', name: 'Idioma do destaque', category: 'metric', targetView: 'hub', description: 'Idioma em que o verbete destacado foi redigido.' },
  { uid: '1.0.0-WZ.093', name: 'Tempo de leitura', category: 'metric', targetView: 'hub', description: 'Estimativa de minutos para leitura atenta do verbete.' },
  { uid: '1.0.0-WZ.094', name: 'Leituras do destaque', category: 'metric', targetView: 'hub', description: 'Métrica de audiência do artigo principal.' },
  { uid: '1.0.0-WZ.095', name: 'Título do destaque', category: 'metric', targetView: 'hub', description: 'Título principal do verbete em evidência.' },
  { uid: '1.0.0-WZ.096', name: 'Resumo do destaque', category: 'metric', targetView: 'hub', description: 'Síntese introdutória e contextualização do artigo.' },
  { uid: '1.0.0-WZ.097', name: 'Ponto em destaque 1', category: 'metric', targetView: 'hub', description: 'Primeiro aspecto analítico essencial ressaltado.' },
  { uid: '1.0.0-WZ.098', name: 'Ponto em destaque 2', category: 'metric', targetView: 'hub', description: 'Segundo aspecto analítico de evidência.' },
  { uid: '1.0.0-WZ.099', name: 'Ponto em destaque 3', category: 'metric', targetView: 'hub', description: 'Terceiro ponto crítico ressaltado na introdução.' },
  { uid: '1.0.0-WZ.100', name: 'Tópicos do destaque', category: 'metric', targetView: 'hub', description: 'Seções temáticas que estruturam o verbete em destaque.' },
  { uid: '1.0.0-WZ.101', name: 'Ficha do Artigo', category: 'metric', targetView: 'hub', description: 'Metadados condensados de autoria, revisão e fontes.' },
  { uid: '1.0.0-WZ.102', name: 'Autor principal', category: 'metric', targetView: 'hub', description: 'Identificação do colaborador que originou a redação.' },
  { uid: '1.0.0-WZ.103', name: 'Índice Editorial', category: 'metric', targetView: 'hub', description: 'Navegação rápida pelos capítulos do texto enciclopédico.' },

  // 104-125: Painel Analítico de Estatísticas (WikiStatisticsPanel)
  { uid: '1.0.0-WZ.104', name: 'Firebase Firestore Ativo', category: 'database', targetView: 'admin-firebase', description: 'Status em tempo real da conexão persistente com o banco.' },
  { uid: '1.0.0-WZ.105', name: 'Database ID', category: 'database', targetView: 'admin-firebase', description: 'Identificador do banco de dados na nuvem Google Cloud.' },
  { uid: '1.0.0-WZ.106', name: 'Total de Artigos', category: 'metric', targetView: 'hub', description: 'Soma global de artigos registrados no sistema.' },
  { uid: '1.0.0-WZ.107', name: 'Visualizações Totais', category: 'metric', targetView: 'hub', description: 'Total consolidado de leituras em todas as páginas.' },
  { uid: '1.0.0-WZ.108', name: 'Média de views', category: 'metric', targetView: 'hub', description: 'Visualizações médias computadas por artigo publicado.' },
  { uid: '1.0.0-WZ.109', name: 'Crescimento Diário', category: 'metric', targetView: 'hub', description: 'Percentual de variação de novos artigos e leitores nas últimas 24h.' },
  { uid: '1.0.0-WZ.110', name: 'Pico', category: 'metric', targetView: 'hub', description: 'Maior marca histórica de leituras simultâneas.' },
  { uid: '1.0.0-WZ.111', name: 'Categorias Ativas', category: 'metric', targetView: 'hub', description: 'Número de nichos editoriais com artigos cadastrados.' },
  { uid: '1.0.0-WZ.112', name: 'Categoria líder', category: 'metric', targetView: 'hub', description: 'Categoria temática com maior engajamento e publicações.' },
  { uid: '1.0.0-WZ.113', name: 'Edições & Autores', category: 'metric', targetView: 'hub', description: 'Relação quantitativa de revisões e colaboradores ativos.' },
  { uid: '1.0.0-WZ.114', name: 'Gráfico de crescimento', category: 'metric', targetView: 'hub', description: 'Série temporal acumulada de expansão do acervo da Wiki.' },
  { uid: '1.0.0-WZ.115', name: 'Gráfico de distribuição', category: 'metric', targetView: 'hub', description: 'Distribuição proporcional de leituras por categoria temática.' },
  { uid: '1.0.0-WZ.116', name: 'Gráfico de ranking', category: 'metric', targetView: 'hub', description: 'Classificação visual dos verbetes mais acessados.' },
  { uid: '1.0.0-WZ.117', name: 'Gráfico comparativo', category: 'metric', targetView: 'hub', description: 'Comparativo analítico entre métricas de leitura e edição.' },
  { uid: '1.0.0-WZ.118', name: 'Ranking #1', category: 'metric', targetView: 'hub', description: 'Primeiro verbete mais consultado na enciclopédia.' },
  { uid: '1.0.0-WZ.119', name: 'Ranking #2', category: 'metric', targetView: 'hub', description: 'Segundo verbete mais lido no ranking de audiência.' },
  { uid: '1.0.0-WZ.120', name: 'Ranking #3', category: 'metric', targetView: 'hub', description: 'Terceiro artigo mais consultado.' },
  { uid: '1.0.0-WZ.121', name: 'Ranking #4', category: 'metric', targetView: 'hub', description: 'Quarto verbete em volume de leituras.' },
  { uid: '1.0.0-WZ.122', name: 'Ranking #5', category: 'metric', targetView: 'hub', description: 'Quinto verbete com maior número de visualizações.' },
  { uid: '1.0.0-WZ.123', name: 'Ranking #6', category: 'metric', targetView: 'hub', description: 'Sexto verbete em audiência acumulada.' },
  { uid: '1.0.0-WZ.124', name: 'Ranking #7', category: 'metric', targetView: 'hub', description: 'Sétimo verbete em alcance comunitário.' },
  { uid: '1.0.0-WZ.125', name: 'Ranking #8', category: 'metric', targetView: 'hub', description: 'Oitavo artigo com leitura contínua auditada.' },

  // 126-136: Coleções, Comparativos & Projetos Oficiais
  { uid: '1.0.0-WZ.126', name: 'Nenhuma coleção cadastrada', category: 'metric', targetView: 'hub', description: 'Estado vazio seguro de coleções na ausência de registros remotos.' },
  { uid: '1.0.0-WZ.127', name: 'Coleção persistente', category: 'feature', targetView: 'hub', description: 'Estrutura persistente de agrupamento temático de verbetes.' },
  { uid: '1.0.0-WZ.128', name: 'WikiWorldWeb vs Wikipédia', category: 'comparison', targetView: 'comparison', description: 'Quadro comparativo frente às políticas e modelo da Wikipédia.' },
  { uid: '1.0.0-WZ.129', name: 'WikiWorldWeb vs MediaWiki', category: 'comparison', targetView: 'comparison', description: 'Comparativo técnico de arquitetura com o software MediaWiki.' },
  { uid: '1.0.0-WZ.130', name: 'WikiWorldWeb vs Fandom', category: 'comparison', targetView: 'comparison', description: 'Diferenciais de ausência de anúncios intrusivos e leveza.' },
  { uid: '1.0.0-WZ.131', name: 'WikiWorldWeb vs Wikidot', category: 'comparison', targetView: 'comparison', description: 'Comparativo de extensibilidade e suporte a banco em nuvem.' },
  { uid: '1.0.0-WZ.132', name: 'Temas visuais exclusivos', category: 'theme', targetView: 'appearance', description: 'Acervo de temas retrô customizados inspirados em sistemas operacionais e jogos.' },
  { uid: '1.0.0-WZ.133', name: 'WazzimaGiygg: Projetos Oficiais', category: 'feature', targetView: 'wazzimagiygg', description: 'Página oficial de projetos mantidos pelo burocrata WazzimaGiygg.' },
  { uid: '1.0.0-WZ.134', name: 'Caso Wikipédia', category: 'feature', targetView: 'privacy', description: 'Dossiê técnico documentado sobre neutralidade e liberdade editorial.' },
  { uid: '1.0.0-WZ.135', name: 'Changelog v3.3.0', category: 'feature', targetView: 'site-updates', description: 'Registro histórico de atualizações maiores da plataforma.' },
  { uid: '1.0.0-WZ.136', name: 'Google Reader Revenue Manager', category: 'feature', targetView: 'donation', description: 'Módulo de apoio e monetização voluntária do leitor.' },

  // 137-142: Privacidade & Telemetria do Firestore
  { uid: '1.0.0-WZ.137', name: 'Cookies (LGPD)', category: 'legal', targetView: 'privacy', description: 'Banner e consentimento granular de armazenamento local.' },
  { uid: '1.0.0-WZ.138', name: 'LGPD', category: 'legal', targetView: 'privacy', description: 'Declaração formal de respeito à privacidade do internauta.' },
  { uid: '1.0.0-WZ.139', name: 'Firebase Firestore', category: 'database', targetView: 'admin-firebase', description: 'Instância oficial de persistência da enciclopédia.' },
  { uid: '1.0.0-WZ.140', name: 'Database ID (site)', category: 'database', targetView: 'admin-firebase', description: 'Identificador do banco provisionado na nuvem.' },
  { uid: '1.0.0-WZ.141', name: 'Latência monitorada', category: 'feature', targetView: 'tools', description: 'Telemetria contínua RTT e diagnóstico de conectividade em tempo real.' },
  { uid: '1.0.0-WZ.142', name: 'Projeto Firebase', category: 'config', targetView: 'admin-firebase', description: 'Configuração do projeto em nuvem associado.' },

  // 143-156: Temas Visuais Exclusivos da Wiki
  { uid: '1.0.0-WZ.143', name: 'Tema Minecraft', category: 'theme', targetView: 'appearance', description: 'Estilização voxel com texturas clássicas em blocos.' },
  { uid: '1.0.0-WZ.144', name: 'Tema Roblox', category: 'theme', targetView: 'appearance', description: 'Interface inspirada no visual da plataforma Roblox.' },
  { uid: '1.0.0-WZ.145', name: 'Tema R.E.P.O. (Semiwork)', category: 'theme', targetView: 'appearance', description: 'Estética industrial e terminal de comando R.E.P.O.' },
  { uid: '1.0.0-WZ.146', name: 'Tema Windows 95', category: 'theme', targetView: 'appearance', description: 'Visual retrô clássico dos anos 90 com bordas chanfradas e cinza padrão.' },
  { uid: '1.0.0-WZ.147', name: 'Tema Windows 1.0 (1985)', category: 'theme', targetView: 'appearance', description: 'Paleta monocromática CGA e blocos do primeiro Windows.' },
  { uid: '1.0.0-WZ.148', name: 'Tema Windows 3.1', category: 'theme', targetView: 'appearance', description: 'Estética clássica do início da era dos computadores multimídia.' },
  { uid: '1.0.0-WZ.149', name: 'Tema Windows 7 Aero Glass', category: 'theme', targetView: 'appearance', description: 'Transparências Aero, reflexos e cantos arredondados.' },
  { uid: '1.0.0-WZ.150', name: 'Tema Windows 10', category: 'theme', targetView: 'appearance', description: 'Design limpo com menu Iniciar moderno e janelas angulares.' },
  { uid: '1.0.0-WZ.151', name: 'Tema Windows XP', category: 'theme', targetView: 'appearance', description: 'Estilo Luna em azul, verde e barra de tarefas clássica.' },
  { uid: '1.0.0-WZ.152', name: 'Tema Android 1.5', category: 'theme', targetView: 'appearance', description: 'Design vintage dos primeiros smartphones Cupcake.' },
  { uid: '1.0.0-WZ.153', name: 'Tema Android 2.3 Gingerbread', category: 'theme', targetView: 'appearance', description: 'Visual escuro e destaques em verde neon do Android 2.3.' },
  { uid: '1.0.0-WZ.154', name: 'Tema Nokia 3310 Monochrome', category: 'theme', targetView: 'appearance', description: 'Display verde fosforescente com tipografia pixelada.' },
  { uid: '1.0.0-WZ.155', name: 'Tema Half-Life (Black Mesa)', category: 'theme', targetView: 'appearance', description: 'Interface militar de pesquisa com tonalidades laranja e âmbar.' },
  { uid: '1.0.0-WZ.156', name: 'Tema Stardew Valley', category: 'theme', targetView: 'appearance', description: 'Estilo acolhedor em tons de madeira e pergaminho rural.' },

  // 157-161: Legislação, Cookies & Suporte
  { uid: '1.0.0-WZ.157', name: 'LGPD (Lei 13.709/2018)', category: 'legal', targetView: 'privacy', description: 'Artigos e garantias da lei de proteção aos dados do cidadão.' },
  { uid: '1.0.0-WZ.158', name: 'Marco Civil da Internet', category: 'legal', targetView: 'terms', description: 'Lei 12.965/2014 estabelecendo direitos, deveres e neutralidade de rede.' },
  { uid: '1.0.0-WZ.159', name: 'Cookies necessários', category: 'legal', targetView: 'privacy', description: 'Armazenamento técnico mínimo essencial para login e navegação segura.' },
  { uid: '1.0.0-WZ.160', name: 'Métricas anônimas', category: 'legal', targetView: 'privacy', description: 'Telemetria despersonalizada sem rastreadores de publicidade de terceiros.' },
  { uid: '1.0.0-WZ.161', name: 'Central de Suporte', category: 'feature', targetView: 'contact-admin', description: 'Atendimento direto aos colaboradores e suporte técnico da comunidade.' },
];

/**
 * Mapa indexado para acesso O(1) por UID canônico
 */
export const STANDARD_UID_MAP: Record<string, StandardUidEntry> = STANDARD_UID_LIST.reduce(
  (acc, item) => {
    acc[item.uid.toUpperCase()] = item;
    return acc;
  },
  {} as Record<string, StandardUidEntry>
);

/**
 * Normaliza um texto para correspondência resiliente
 */
function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Retorna a entrada padronizada de UID a partir de um identificador (ex: '1.0.0-BD.001')
 */
export function getStandardEntryByUid(uid: string | null | undefined): StandardUidEntry | undefined {
  if (!uid) return undefined;
  const clean = uid.trim().toUpperCase();
  return STANDARD_UID_MAP[clean];
}

/**
 * Busca o UID padronizado a partir do nome ou rótulo da informação
 */
export function getStandardUidByLabel(label: string): string | undefined {
  if (!label) return undefined;
  const cleanQuery = normalizeQuery(label);

  const exactMatch = STANDARD_UID_LIST.find(
    (item) => normalizeQuery(item.name) === cleanQuery
  );
  if (exactMatch) return exactMatch.uid;

  const partialMatch = STANDARD_UID_LIST.find((item) =>
    normalizeQuery(item.name).includes(cleanQuery) || cleanQuery.includes(normalizeQuery(item.name))
  );
  return partialMatch?.uid;
}

/**
 * Retorna as propriedades de dataset HTML para anexação sem impacto visual (data-uid e title)
 */
export function getStandardUidDataset(uid: string): { 'data-uid': string; 'data-uid-name': string; title: string } {
  const entry = getStandardEntryByUid(uid);
  if (!entry) {
    return {
      'data-uid': uid,
      'data-uid-name': uid,
      title: `[UID: ${uid}]`,
    };
  }
  return {
    'data-uid': entry.uid,
    'data-uid-name': entry.name,
    title: `[UID: ${entry.uid}] ${entry.name}`,
  };
}

/**
 * Verifica se um texto corresponde à sintaxe de UID padronizado (1.0.0-XX.YYY)
 */
export function isStandardUidPattern(text: string): boolean {
  if (!text) return false;
  return /^1\.0\.0-[A-Z0-9]{2,3}\.\d{3}$/i.test(text.trim());
}
