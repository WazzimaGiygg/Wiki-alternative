import { WikiArticle, WikiPage, NotificationItem, UserProfile, UserTalkMessage, UserAuditLog, SystemUpdateEntry } from '../types';

export const INITIAL_COMMUNITY_USERS: UserProfile[] = [
  {
    uid: 'user-wazzima',
    username: 'WazzimaGiygg',
    displayName: 'WazzimaGiygg',
    email: 'pedrohenriquecardonaperes@gmail.com',
    role: 'admin',
    isGuest: false,
    isBanned: false,
    reputationScore: 1250,
    warningCount: 0,
    location: 'São Paulo, Brasil',
    website: 'https://github.com/WazzimaGiygg/wiki',
    createdAt: '2026-01-15T09:00:00Z',
    lastActive: '2026-08-28T17:30:00Z',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: true,
      canGrantBarnstars: true,
    },
    bio: `{{Infobox
| Nome = WazzimaGiygg
| Cargo = Administrador & Burocrata
| Especialidade = Mobilidade Urbana, Engenharia & LGPD
| Status = Mantenedor Ativo
| Entrada = Janeiro de 2026
}}

{{Destaque|Fundador e mantenedor técnico do projeto WikiZero. Trabalhando ativamente na documentação do sistema sobre trilhos e na infraestrutura de conhecimento livre sob licença GNU GPL v3.0.}}

= Sobre o Usuário =
Olá e bem-vindo à minha página de usuário na '''WikiZero'''! Meu foco editorial principal inclui o desenvolvimento de coleções sobre infraestrutura de transporte, história de ferrovias e a garantia da privacidade dos usuários conforme a Lei Geral de Proteção de Dados (LGPD).

== Caixas de Usuário ==
{{Userbox|🚇|Entusiasta e Pesquisador de Transporte sobre Trilhos}}
{{Userbox|⚖️|Encarregado pelo Tratamento de Dados Pessoais (DPO)}}
{{Userbox|🐧|Defensor de Software Livre e Licenciamento GNU GPL}}
{{Userbox|🇧🇷|Editor em Língua Portuguesa}}

== Projetos e Diretrizes Ativas ==
* Padronização de artigos de infraestrutura com caixas de informação e referências bibliográficas.
* Implementação dos pilares de neutralidade enciclopédica (NPOV) e verificabilidade.
* Mediação de discussões e combate a práticas de vandalismo ou spam.`,
    userboxes: [
      {
        id: 'ub-1',
        title: '🚇 Mobilidade',
        text: 'Pesquisador e documentador de transporte sobre trilhos de São Paulo',
        icon: '🚇',
        bgClass: 'bg-blue-50 dark:bg-blue-950/40',
        borderClass: 'border-blue-200 dark:border-blue-800',
      },
      {
        id: 'ub-2',
        title: '⚖️ DPO / LGPD',
        text: 'Encarregado oficial de Proteção de Dados Pessoais da WikiZero',
        icon: '⚖️',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderClass: 'border-emerald-200 dark:border-emerald-800',
      },
      {
        id: 'ub-3',
        title: '📜 Software Livre',
        text: 'Apoiador de código aberto e licença GNU General Public License v3.0',
        icon: '📜',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        borderClass: 'border-amber-200 dark:border-amber-800',
      },
      {
        id: 'ub-4',
        title: '🛡️ Burocrata',
        text: 'Superintendência de governança e gestão de permissões comunitárias',
        icon: '🛡️',
        bgClass: 'bg-purple-50 dark:bg-purple-950/40',
        borderClass: 'border-purple-200 dark:border-purple-800',
      },
    ],
    barnstars: [
      {
        id: 'bs-1',
        title: '🌟 Medalha do Pioneiro da Enciclopédia',
        description: 'Concedida pela concepção inicial da WikiZero e arquitetura descentralizada.',
        icon: '🌟',
        awardedBy: 'DevTeam',
        awardedAt: '2026-02-01T12:00:00Z',
      },
      {
        id: 'bs-2',
        title: '🚇 Estrela de Ouro do Metropolitano',
        description: 'Pela redação detalhada e minuciosa dos artigos sobre o Metrô de São Paulo e frotas de trens.',
        icon: '🚇',
        awardedBy: 'Metrofilo_SP',
        awardedAt: '2026-04-18T16:20:00Z',
      },
      {
        id: 'bs-3',
        title: '🛡️ Guardião da Verificabilidade',
        description: 'Por garantir a conformidade com NPOV e citações bibliográficas rigorosas.',
        icon: '🛡️',
        awardedBy: 'EditorSP',
        awardedAt: '2026-07-10T11:00:00Z',
      },
    ],
  },
  {
    uid: 'user-editorsp',
    username: 'EditorSP',
    displayName: 'EditorSP',
    email: 'editorsp@comunidade.wikizero.org',
    role: 'editor',
    isGuest: false,
    isBanned: false,
    reputationScore: 480,
    warningCount: 0,
    location: 'Campinas, SP',
    createdAt: '2026-02-12T14:00:00Z',
    lastActive: '2026-08-28T16:00:00Z',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: true,
    },
    bio: `= EditorSP =
Colaborador assíduo com foco na história do transporte paulista e expansão das referências bibliográficas do acervo.`,
    userboxes: [
      {
        id: 'ub-esp-1',
        title: '📚 Verificabilidade',
        text: 'Comprometido com fontes primárias e secundárias confiáveis',
        icon: '📚',
        bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
        borderClass: 'border-indigo-200 dark:border-indigo-800',
      },
    ],
    barnstars: [
      {
        id: 'bs-esp-1',
        title: '⭐ Estrela do Editor Incansável',
        description: 'Por mais de 100 edições precisas de referências e citações.',
        icon: '⭐',
        awardedBy: 'WazzimaGiygg',
        awardedAt: '2026-05-10T10:00:00Z',
      },
    ],
  },
  {
    uid: 'user-metrofilosp',
    username: 'Metrofilo_SP',
    displayName: 'Metrofilo_SP',
    email: 'metrofilo@metrosp.org',
    role: 'editor',
    isGuest: false,
    isBanned: false,
    reputationScore: 390,
    warningCount: 0,
    location: 'São Paulo, SP',
    createdAt: '2026-02-20T10:00:00Z',
    lastActive: '2026-08-27T18:00:00Z',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: true,
    },
    bio: `= Metrofilo_SP =
Engenheiro civil e entusiasta da malha metroferroviária da RMSP. Monitorando obras de expansão das Linhas 2-Verde, 6-Laranja e 17-Ouro.`,
    barnstars: [],
  },
  {
    uid: 'user-devteam',
    username: 'DevTeam',
    displayName: 'DevTeam',
    email: 'dev@wikizero.org',
    role: 'moderador',
    isGuest: false,
    isBanned: false,
    reputationScore: 780,
    warningCount: 0,
    location: 'Brasil',
    createdAt: '2026-01-10T08:00:00Z',
    lastActive: '2026-08-28T17:00:00Z',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: true,
      canGrantBarnstars: true,
    },
    bio: `= DevTeam WikiZero =
Equipe técnica dedicada à estabilidade, suporte offline, sincronização em tempo real e arquitetura da interface enciclopédica.`,
    barnstars: [],
  },
  {
    uid: 'user-historiador',
    username: 'Historiador_Transportes',
    displayName: 'Historiador_Transportes',
    email: 'historia@acervo.edu.br',
    role: 'leitor',
    isGuest: false,
    isBanned: false,
    reputationScore: 190,
    warningCount: 0,
    location: 'São Paulo, Brasil',
    createdAt: '2026-03-05T11:00:00Z',
    lastActive: '2026-08-25T12:00:00Z',
    permissions: {
      canEdit: true,
      canCreate: false,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: false,
    },
    bio: `= Historiador_Transportes =
Pesquisador de arquivos do consórcio HMD e das primeiras linhas de bonde e trólebus de São Paulo.`,
    barnstars: [],
  },
  {
    uid: 'user-suspeito',
    username: 'Usuario_Suspeito',
    displayName: 'Usuario_Suspeito',
    email: 'spam_test@exemplo.com',
    role: 'leitor',
    isGuest: false,
    isBanned: true,
    banType: 'temporario',
    banReason: 'Inclusão reiterada de hiperlinks promocionais e spam não verificado.',
    banExpiresAt: '2026-09-15T00:00:00Z',
    reputationScore: -10,
    warningCount: 2,
    createdAt: '2026-06-01T15:00:00Z',
    lastActive: '2026-08-20T09:00:00Z',
    permissions: {
      canEdit: false,
      canCreate: false,
      canTalk: false,
      canDelete: false,
      canGrantBarnstars: false,
    },
    bio: `Usuário atualmente suspenso por infração às diretrizes comunitárias de conteúdo.`,
    barnstars: [],
  },
];

export const INITIAL_USER_TALK_MESSAGES: UserTalkMessage[] = [
  {
    id: 'utalk-1',
    targetUserUid: 'user-wazzima',
    targetUsername: 'WazzimaGiygg',
    senderUid: 'user-devteam',
    senderName: 'DevTeam',
    senderRole: 'moderador',
    titulo: '🎉 Parabéns pelo Lançamento do Sistema de Usuários e Discussão',
    tipo: 'boas_vindas',
    data: '2026-08-28T15:30:00Z',
    status: 'resolvido',
    conteudo: `Olá Wazzima! Parabéns pela liderança no desenvolvimento da versão 3.0 com Páginas de Usuário, Discussão de Usuário e Painel Administrativo. A interface segue com fidelidade os padrões MediaWiki e Fandom.`,
    respostas: [
      {
        id: 'reply-u1',
        autor: 'WazzimaGiygg',
        autorEmail: 'pedrohenriquecardonaperes@gmail.com',
        autorRole: 'admin',
        data: '2026-08-28T16:00:00Z',
        conteudo: 'Muito obrigado! Agora a comunidade possui ferramentas completas para comunicação interpessoal, mediação editorial e condecorações.',
        upvotes: 3,
      },
    ],
  },
  {
    id: 'utalk-2',
    targetUserUid: 'user-wazzima',
    targetUsername: 'WazzimaGiygg',
    senderUid: 'user-editorsp',
    senderName: 'EditorSP',
    senderRole: 'editor',
    titulo: '⭐ Proposta de Padronização de Citações Metroviárias',
    tipo: 'duvida',
    data: '2026-08-27T14:00:00Z',
    status: 'em_discussao',
    conteudo: `Olá! Notei que no artigo sobre a Linha 1-Azul temos múltiplas fontes do consórcio HMD. Podemos criar uma predefinição unificada para essas referências históricas?`,
    respostas: [
      {
        id: 'reply-u2',
        autor: 'WazzimaGiygg',
        autorRole: 'admin',
        data: '2026-08-27T15:10:00Z',
        conteudo: 'Excelente sugestão! Vou redigir a documentação no Guia de Edição MediaWiki para uso geral.',
        upvotes: 2,
      },
    ],
  },
  {
    id: 'utalk-3',
    targetUserUid: 'user-suspeito',
    targetUsername: 'Usuario_Suspeito',
    senderUid: 'user-wazzima',
    senderName: 'WazzimaGiygg',
    senderRole: 'admin',
    titulo: '⚠️ Advertência Oficial: Violação de Políticas contra Spam',
    tipo: 'aviso_admin',
    data: '2026-08-20T09:00:00Z',
    status: 'aberto',
    conteudo: `Prezado usuário, suas edições recentes violam os termos da política de neutralidade e combate ao spam da WikiZero. Sua conta foi temporariamente suspensa para prevenção de vandalismo. Caso deseje recorrer, responda a este tópico com suas justificativas.`,
    respostas: [],
  },
];

export const INITIAL_USER_AUDIT_LOGS: UserAuditLog[] = [
  {
    id: 'log-1',
    targetUserUid: 'user-suspeito',
    targetUsername: 'Usuario_Suspeito',
    action: 'ban_user',
    performedBy: 'WazzimaGiygg',
    performedByRole: 'admin',
    details: 'Bloqueio temporário aplicado por 26 dias. Motivo: Inclusão reiterada de spam comercial.',
    date: '2026-08-20T09:00:00Z',
  },
  {
    id: 'log-2',
    targetUserUid: 'user-editorsp',
    targetUsername: 'EditorSP',
    action: 'role_change',
    performedBy: 'WazzimaGiygg',
    performedByRole: 'admin',
    details: 'Promoção de cargo: de Leitor para Editor Verificado.',
    date: '2026-03-01T10:00:00Z',
  },
  {
    id: 'log-3',
    targetUserUid: 'user-wazzima',
    targetUsername: 'WazzimaGiygg',
    action: 'barnstar_awarded',
    performedBy: 'DevTeam',
    performedByRole: 'moderador',
    details: 'Concessão de Medalha: Medalha do Pioneiro da Enciclopédia.',
    date: '2026-02-01T12:00:00Z',
  },
];

export const INITIAL_PAGES: WikiPage[] = [
  {
    uid: 'metro_sp',
    titulo: 'Metropolitano de São Paulo',
    descricao: 'Rede de transporte sobre trilhos que atende a Região Metropolitana de São Paulo, abrangendo linhas operadas pela Companhia do Metropolitano de São Paulo e concessionárias.',
    categoria: 'Transporte & Infraestrutura',
    autor: 'WazzimaGiygg',
    criadoEm: '2026-01-15T10:00:00Z',
    atualizadoEm: '2026-08-28T14:30:00Z',
    articleCount: 4,
    icon: '🚇',
    tags: ['São Paulo', 'Mobilidade', 'Metrô', 'Trânsito', 'Trens'],
    status: 'ativo',
  },
  {
    uid: 'wikizero_info',
    titulo: 'WikiZero & Enciclopédias Livres',
    descricao: 'Histórico, arquitetura descentralizada e diretrizes editoriais do projeto WikiZero e enciclopédias colaborativas modernas.',
    categoria: 'Cultura & Tecnologia',
    autor: 'WazzimaGiygg',
    criadoEm: '2026-02-10T12:00:00Z',
    atualizadoEm: '2026-08-28T15:00:00Z',
    articleCount: 3,
    icon: '📚',
    tags: ['Wiki', 'Open Source', 'Conhecimento Livre', 'LGPD'],
    status: 'ativo',
  },
  {
    uid: 'tecnologia_web',
    titulo: 'Tecnologia Web & Sistemas Modernos',
    descricao: 'Padrões da web moderna, Single Page Applications, IndexedDB, Service Workers e frameworks reativos.',
    categoria: 'Tecnologia',
    autor: 'DevTeam',
    criadoEm: '2026-03-01T08:00:00Z',
    atualizadoEm: '2026-08-27T18:00:00Z',
    articleCount: 3,
    icon: '⚡',
    tags: ['React', 'TypeScript', 'Performance', 'PWA'],
    status: 'ativo',
  },
  {
    uid: 'direitos_digitais',
    titulo: 'Direitos Digitais & LGPD no Brasil',
    descricao: 'Guia completo sobre a Lei Geral de Proteção de Dados (Lei 13.709/2018), Marco Civil da Internet (Lei 12.965/2014) e direitos do titular.',
    categoria: 'Direito & Legislação',
    autor: 'Encarregado DPO',
    criadoEm: '2026-04-12T14:20:00Z',
    atualizadoEm: '2026-08-28T11:10:00Z',
    articleCount: 2,
    icon: '⚖️',
    tags: ['LGPD', 'Privacidade', 'Segurança', 'Marco Civil'],
    status: 'ativo',
  },
  {
    uid: 'ciencia_espaco',
    titulo: 'Astronomia & Exploração Espacial',
    descricao: 'Artigos sobre astronomia observacional, sondas interplanetárias e astrofísica estelar.',
    categoria: 'Ciência',
    autor: 'Comunidade Wiki',
    criadoEm: '2026-05-18T09:00:00Z',
    atualizadoEm: '2026-08-26T16:45:00Z',
    articleCount: 2,
    icon: '🪐',
    tags: ['Espaço', 'NASA', 'Física', 'Telescópios'],
    status: 'ativo',
  },
];

export const INITIAL_ARTICLES: WikiArticle[] = [
  {
    id: 'art-metro-01',
    pageUid: 'metro_sp',
    titulo: 'História do Metrô de São Paulo',
    categoria: 'História',
    idioma: 'Português',
    autor: 'WazzimaGiygg',
    autorEmail: 'pedrohenriquecardonaperes@gmail.com',
    dataCriacao: '2026-01-15T10:30:00Z',
    dataEdicao: '2026-08-28T14:30:00Z',
    visualizacoes: 1420,
    versao: 3,
    tags: ['São Paulo', 'História', 'Linha 1-Azul', 'Mobilidade'],
    resumo: 'Panorama histórico desde os primeiros planos na década de 1920 até a inauguração da Linha Norte-Sul em 1974.',
    descricao: `{{Infobox
| Nome = Metrô de São Paulo
| Inauguração = 14 de setembro de 1974
| Extensão = ~104 km de rede
| Linhas em operação = 6 linhas
| Passageiros / dia = ~4.5 milhões
| Operadores = Metrô SP, ViaQuatro, ViaMobilidade
}}

{{Destaque|O Metrô de São Paulo foi eleito consecutivamente um dos sistemas de transporte sobre trilhos mais pontuais e limpos do mundo segundo avaliações internacionais de mobilidade urbana.}}

= Visão Geral =
O '''Metropolitano de São Paulo''', comumente conhecido como '''Metrô de São Paulo''', é o principal sistema de transporte de alta capacidade do estado de São Paulo e o mais extenso do Brasil.<ref>Companhia do Metropolitano de São Paulo. ''Relatório Integrado de Sustentabilidade e Gestão Operacional'', 2025.</ref>

== Primeiras Propostas (1927–1966) ==
As primeiras discussões sobre transportes subterrâneos em São Paulo remontam a 1927, quando a concessionária canadense *Light* propôs um sistema de túneis no centro da cidade. Contudo, foi apenas no final da década de 1960 que os estudos coordenados pela prefeitura e o consórcio alemão-brasileiro *HMD (Hochtief-Montreal-Deconsult)* definiram as bases da malha moderna.<ref>Almeida, Roberto. ''Trilhos do Futuro: A Engenharia Subterrânea Paulistana'', Editora Técnica, 2022.</ref>

== Inauguração da Linha 1 - Azul ==
Em 14 de setembro de 1974, entrou em operação o primeiro trecho comercial entre as estações **Jabaquara** e **Vila Mariana**, operado com composições com tração elétrica controlada por chopper de tiristor, pioneiro na América Latina.

{{Nota|A viagem inaugural contou com a presença do prefeito Miguel Colassuono e do governador Laudo Natel, transportando convidados entre o Jabaquara e a Saúde.}}

=== Características Técnicas da Malha ===
* '''Bitola:''' 1.600 mm (Bitola Larga) na maioria das linhas; 1.435 mm (Bitola Internacional) nas Linhas 4-Amarela e 5-Lilás.<ref>Associação Nacional dos Transportadores de Passageiros sobre Trilhos (ANPTrilhos). ''Balanço do Setor Metroferroviário'', 2026.</ref>
* '''Alimentação Elétrica:''' Terceiro trilho (750 V CC) e Catenária rígida/flexível (1.500 V CC / 3.000 V CC).
* '''Sinalização e Controle:''' CBTC (*Communication-Based Train Control*) com operação automática GoA4 (sem condutor a bordo) nas linhas automatizadas.

== Tabela de Linhas Principais ==
{| class="wikitable"
! Linha !! Nome !! Terminais !! Extensão !! Estações
|-
| 1 || Linha 1-Azul || Tucuruvi ↔ Jabaquara || 20,2 km || 23
|-
| 2 || Linha 2-Verde || Vila Madalena ↔ Vila Prudente || 14,7 km || 14
|-
| 3 || Linha 3-Vermelha || Palmeiras-Barra Funda ↔ Corinthians-Itaquera || 22,0 km || 18
|-
| 4 || Linha 4-Amarela || Luz ↔ Vila Sônia || 12,8 km || 11
|-
| 5 || Linha 5-Lilás || Capão Redondo ↔ Chácara Klabin || 20,0 km || 17
|-
| 15 || Linha 15-Prata (Monotrilho) || Vila Prudente ↔ Jardim Colonial || 14,6 km || 11
|}

[[collapsible show="Exibir detalhes sobre obras de expansão em andamento" hide="Ocultar expansões"]]
Atualmente, encontram-se em execução as obras da **Linha 2-Verde** rumo à Penha e Dutra, a **Linha 6-Laranja** (Brasilândia ↔ São Joaquim), a **Linha 17-Ouro** (Monotrilho do Aeroporto de Congonhas) e extensões da **Linha 15-Prata** até Ipiranga e Boa Esperança.
[[/collapsible]]

== Ver Também ==
* [[Sobre a WikiZero e Filosofia do Conhecimento|Artigo sobre o WikiZero]]
* [[Frota de Trens e Material Rodante|Conheça as frotas e trens do sistema]]
* [https://www.metro.sp.gov.br Site Oficial da Companhia do Metrô]

[[Categoria:Transportes]]
[[Categoria:São Paulo]]
[[Categoria:História]]`,
    historico: [
      {
        id: 'h-1',
        data: '2026-08-28T14:30:00Z',
        autor: 'WazzimaGiygg',
        resumo: 'Atualização da tabela de linhas e infobox com dados de passageiros e citações bibliográficas',
        tamanho: 3200,
      },
      {
        id: 'h-2',
        data: '2026-03-10T11:00:00Z',
        autor: 'EditorSP',
        resumo: 'Adição de detalhes sobre o sistema CBTC',
        tamanho: 2100,
      },
      {
        id: 'h-3',
        data: '2026-01-15T10:30:00Z',
        autor: 'WazzimaGiygg',
        resumo: 'Criação inicial do artigo com sintaxe wikitexto',
        tamanho: 1450,
      },
    ],
  },
  {
    id: 'art-metro-02',
    pageUid: 'metro_sp',
    titulo: 'Frota de Trens e Material Rodante',
    categoria: 'Frota & Engenharia',
    idioma: 'Português',
    autor: 'WazzimaGiygg',
    dataCriacao: '2026-02-01T15:00:00Z',
    dataEdicao: '2026-08-25T17:10:00Z',
    visualizacoes: 890,
    versao: 2,
    tags: ['Trens', 'Engenharia', 'Frota', 'Tecnologia'],
    resumo: 'Detalhamento das frotas A, C, D, E, F, G, H, I, J, K, L, M e P do Metrô paulista.',
    descricao: `= Frotas do Metrô de São Paulo =
O Metrô de São Paulo opera com diversas frotas de composições de 6 a 7 carros, fabricadas por consórcios nacionais e internacionais como Mafersa, Cobrasma, Alstom, CAF, Hyundai Rotem e Bombardier.<ref>Revista Ferroviária. ''Anuário da Indústria Metroferroviária Brasileira'', Edição 2025.</ref>

== Frotas Históricas e Modernizadas ==
* '''Frota A (Original Mafersa/Budd):''' Entrou em serviço em 1974 na Linha 1-Azul. Foi totalmente modernizada, originando as frotas **I** e **J**.
* '''Frota C e D (Cobrasma/Mafersa):''' Operavam na Linha 3-Vermelha. Modernizadas entre 2011 e 2018, convertidas nas frotas **K** e **L**.
* '''Frota H (CAF):''' Fabricada pela empresa espanhola CAF, conta com ar condicionado digital e monitores informativos.

{{Citação|A modernização das frotas estendeu a vida útil operacional dos trens em mais 20 anos, incorporando ar-condicionado com filtros ecológicos e sistemas modernos de tração com inversores VVVF.|Engenharia de Material Rodante - Metrô SP}}

== Veja Também ==
* [[História do Metrô de São Paulo|Voltar para a história geral do Metrô]]

[[Categoria:Transportes]]
[[Categoria:Engenharia]]`,
  },
  {
    id: 'art-wiki-01',
    pageUid: 'wikizero_info',
    titulo: 'Sobre a WikiZero e Filosofia do Conhecimento',
    categoria: 'Institucional',
    idioma: 'Português',
    autor: 'WazzimaGiygg',
    autorEmail: 'pedrohenriquecardonaperes@gmail.com',
    dataCriacao: '2026-02-10T12:00:00Z',
    dataEdicao: '2026-08-28T15:00:00Z',
    visualizacoes: 2150,
    versao: 4,
    tags: ['WikiZero', 'Open Access', 'LGPD', 'GNU GPL'],
    resumo: 'Manifesto e pilares da WikiZero: liberdade de informação, neutralidade, privacidade e acessibilidade universal.',
    descricao: `{{Infobox
| Nome = WikiZero
| Tipo = Enciclopédia Colaborativa Livre
| Licença = GNU General Public License v3.0
| Conformidade = LGPD (Lei 13.709/2018)
| DPO = pedrohenriquecardonaperes@gmail.com
| Idiomas = Multi-idioma
}}

{{Aviso|A WikiZero opera sob estritas diretrizes éticas de veracidade, neutralidade enciclopédica (NPOV) e conformidade plena com a privacidade e proteção de dados.}}

= O que é a WikiZero? =
A '''WikiZero''' é uma plataforma enciclopédica colaborativa, desenvolvida para fornecer acesso desimpedido, rápido e seguro ao conhecimento humano.<ref>Fundação Conhecimento Livre. ''Manifesto pela Democratização da Enciclopédia Digital'', 2026.</ref>

== Pilares Fundamentais ==
# '''Liberdade de Criação:''' Qualquer usuário pode contribuir, editar e aprimorar artigos respeitando a veracidade factual.
# '''Respeito Rigoroso à Privacidade (LGPD):''' Total transparência quanto ao tratamento de dados, direito ao esquecimento e portabilidade total dos dados pessoais.
# '''Velocidade e Resiliência Offline:''' Arquitetura de ponta com suporte a cache local e sincronização reativa.

== Recursos Semelhantes à Wikimedia, Fandom e Wikidot ==
A WikiZero combina o melhor das principais plataformas wiki mundiais:
* '''Padrão Wikimedia:''' Páginas de discussão (\`Talk Pages\`), páginas afluentes (\`Special:WhatLinksHere\`), lista de páginas vigiadas (\`Watchlist\`) e sintaxe wikitext nativa.
* '''Padrão Fandom:''' Infoboxes portáteis, avaliação comunitária em estrelas (Community Rating) e feedback interativo dos leitores.
* '''Padrão Wikidot:''' Blocos expansíveis (\`[[collapsible]]\`), pré-visualização instantânea e categorização facetada.

== Direitos e Licenciamento ==
Todo o código-fonte da aplicação é distribuído sob a licença **GNU General Public License v3.0**, assegurando que melhorias e modificações permaneçam eternamente livres e abertas.

== Ver Mais ==
* [[Guia de Edição MediaWiki|Aprenda a editar artigos agora mesmo]]
* [[LGPD e Direitos do Titular de Dados|Consulte nossa conformidade com a LGPD]]

[[Categoria:Institucional]]
[[Categoria:Enciclopédia]]`,
  },
  {
    id: 'art-wiki-02',
    pageUid: 'wikizero_info',
    titulo: 'Guia de Edição MediaWiki',
    categoria: 'Tutoriais',
    idioma: 'Português',
    autor: 'Editor Chefe',
    dataCriacao: '2026-02-15T09:00:00Z',
    dataEdicao: '2026-08-20T10:00:00Z',
    visualizacoes: 1350,
    versao: 2,
    tags: ['Ajuda', 'MediaWiki', 'Editor', 'Sintaxe'],
    resumo: 'Manual prático de formatação para novos editores e colaboradores.',
    descricao: `= Guia Rápido de Sintaxe Wikitexto =

== 1. Títulos e Subtítulos ==
\`\`\`
= Título Principal (H1) =
== Seção Principal (H2) ==
=== Subseção (H3) ===
==== Sub-subseção (H4) ====
\`\`\`

== 2. Formatação de Texto ==
* \`'''Texto em Negrito'''\` → Gera **Texto em Negrito**
* \`''Texto em Itálico''\` → Gera *Texto em Itálico*
* \`~~Texto Riscado~~\` → Gera ~~Texto Riscado~~
* \`\`Código inline\`\` → Gera \`Código inline\`

== 3. Avisos e Predefinições ==
* \`{{Aviso|Seu texto aqui}}\` → Caixa de alerta amarela
* \`{{Nota|Seu texto aqui}}\` → Caixa informativa azul
* \`{{Destaque|Seu texto aqui}}\` → Caixa de destaque verde
* \`{{Citação|Texto da citação|Autor}}\` → Citação em bloco elegante

== 4. Referências e Notas de Rodapé ==
* Insira \`<ref>Autor, Obra, Ano</ref>\` ao lado de qualquer declaração para criar notas automáticas numeradas [1], [2].

== 5. Links Internos e Externos ==
* \`[[Nome da Página]]\` cria um link direto na wiki
* \`[[Nome da Página|Texto Exibido]]\` usa texto customizado
* \`[https://exemplo.com Descrição]\` cria um link externo seguro

== 6. Caixa de Informações (Infobox) ==
\`\`\`
{{Infobox
| Nome = Título da Caixa
| Campo 1 = Valor 1
| Campo 2 = Valor 2
}}
\`\`\`

Experimente no nosso [[Sobre a WikiZero e Filosofia do Conhecimento|Portal WikiZero]]!

[[Categoria:Tutoriais]]
[[Categoria:Ajuda]]`,
  },
  {
    id: 'art-lgpd-01',
    pageUid: 'direitos_digitais',
    titulo: 'LGPD e Direitos do Titular de Dados',
    categoria: 'Legislação',
    idioma: 'Português',
    autor: 'Encarregado DPO',
    dataCriacao: '2026-04-12T14:30:00Z',
    dataEdicao: '2026-08-28T11:10:00Z',
    visualizacoes: 980,
    versao: 2,
    tags: ['LGPD', 'Lei 13.709', 'DPO', 'Privacidade'],
    resumo: 'Resumo explicativo dos Artigos 7º, 14, 18 a 22 da Lei Geral de Proteção de Dados Pessoais.',
    descricao: `= LGPD na WikiZero =
A **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)** regulamenta o tratamento de dados pessoais no Brasil.<ref>Brasil. Presidência da República. ''Lei Federal nº 13.709 de 14 de agosto de 2018''. Diário Oficial da União.</ref>

== Bases Legais Aplicadas (Art. 7º) ==
* **Consentimento (Inciso I):** Concedido voluntariamente pelo usuário ao aceitar termos no primeiro acesso.
* **Execução de Contrato (Inciso V):** Para possibilitar a autenticação, autoria e publicação de artigos.
* **Legítimo Interesse e Segurança (Inciso IX e II):** Prevenção a abusos, spam e contas banidas por infrações.

== Direitos do Usuário (Art. 18) ==
1. Confirmação e acesso aos dados armazenados.
2. Correção de dados incompletos ou inexatos.
3. Anonimização, bloqueio ou eliminação de dados desnecessários.
4. Portabilidade dos dados (exportação em formato JSON/CSV).
5. Revogação do consentimento a qualquer instante.

== Contato com o DPO ==
O encarregado pelo tratamento de dados pessoais (DPO) pode ser contatado diretamente pelo e-mail oficial: \`pedrohenriquecardonaperes@gmail.com\`.

[[Categoria:Legislação]]
[[Categoria:Direito]]`,
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '🎉 Recursos Wikimedia, Fandom e Wikidot Ativos',
    message: 'Agora você conta com Páginas de Discussão, Páginas Afluentes, Lista de Páginas Vigiadas, Avaliação Comunitária e Referências automáticas.',
    date: 'Hoje, 16:20',
    read: false,
    type: 'success',
  },
  {
    id: 'notif-2',
    title: '⚡ Novo Editor & Predefinições Wiki',
    message: 'Suporte completo a {{Aviso}}, {{Nota}}, {{Destaque}}, {{Citação}}, notas <ref> e blocos expansíveis [[collapsible]].',
    date: 'Hoje, 15:40',
    read: false,
    type: 'info',
  },
  {
    id: 'notif-3',
    title: '🔒 Conformidade LGPD Atualizada',
    message: 'Módulos de portabilidade de dados e termo de consentimento 2.0 ativos.',
    date: 'Ontem',
    read: true,
    type: 'info',
  },
];

export const INITIAL_SYSTEM_UPDATES: SystemUpdateEntry[] = [
  {
    id: 'upd-3.3.0',
    version: 'v3.3.0',
    title: 'Página Oficial de Atualizações & Registro de Melhorias do Sistema',
    date: '2026-08-29T18:40:00Z',
    category: 'feature',
    author: 'Sistema Antigravity / Engenharia WikiZero',
    authorRole: 'Sistema & Desenvolvedores',
    summary: 'Disponibilização da página oficial de registro cronológico de atualizações, notas de versão e melhorias contínuas do sistema WikiZero/WazzimaGiygg.',
    badge: 'Mais Recente',
    isLatest: true,
    commitHash: '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
    affectedComponents: [
      'SiteUpdatesView.tsx',
      'Header.tsx',
      'Sidebar.tsx',
      'Footer.tsx',
      'MobileBottomNav.tsx',
      'storageService.ts',
    ],
    highlights: [
      'Página dedicada "Atualizações do Site" com visualização em linha do tempo das melhorias implementadas.',
      'Filtro dinâmico por categoria (Novidades, Mobile, Segurança, Backend, Interface, Desempenho e Correções).',
      'Painel para administradores e editores registrarem novas notas de versão e logs de melhoria em tempo real.',
      'Sincronização bidirecional persistente no Firebase Firestore e no armazenamento local.',
      'Estatísticas consolidadas de versão, data do último deploy e total de melhorias ativas.',
      'Atalhos de acesso integrados na barra superior, no menu lateral e no rodapé oficial.',
    ],
  },
  {
    id: 'upd-3.2.0',
    version: 'v3.2.0',
    title: 'Versão Mobile Responsiva, Navegação Touch & Sumário Flutuante',
    date: '2026-08-29T18:10:00Z',
    category: 'mobile',
    author: 'Sistema Antigravity / Engenharia WikiZero',
    authorRole: 'Engenharia Frontend',
    summary: 'Lançamento da interface móvel com ergonomia para smartphones, alinhada aos padrões Wikimedia Minerva.',
    badge: 'Mobile First',
    commitHash: 'b4244128-9091-mobile-v320',
    affectedComponents: [
      'MobileBottomNav.tsx',
      'MobileSearchModal.tsx',
      'MobileDrawerMenu.tsx',
      'MobileArticleTOC.tsx',
      'Footer.tsx',
    ],
    highlights: [
      'Barra de navegação inferior fixa (MobileBottomNav) com botões para Início, Busca, Criar Artigo, Aleatório e Menu.',
      'Modal de busca em tela cheia com ativação automática do teclado e resultados em tempo real (MobileSearchModal).',
      'Gaveta lateral touch (MobileDrawerMenu) com perfil do usuário, modo escuro/claro, seletor de idiomas e conformidade.',
      'Sumário flutuante em bottom sheet (MobileArticleTOC) com ajuste de fonte (A-/A+), leitor de voz TTS e lista de vigiados.',
      'Alternador explícito no rodapé entre "Versão móvel" e "Versão para computador".',
    ],
  },
  {
    id: 'upd-3.1.5',
    version: 'v3.1.5',
    title: 'Central de Suporte Oficial & Abertura de Tickets WazzimaGiygg',
    date: '2026-08-29T17:30:00Z',
    category: 'improvement',
    author: 'WazzimaGiygg',
    authorRole: 'Administrador & DPO',
    summary: 'Integração formal da Central de Suporte e Tickets com atendimento técnico e moderação 24h.',
    badge: 'Suporte',
    commitHash: 'sup-wazzimagiygg-support-88x31',
    affectedComponents: ['Sidebar.tsx', 'Footer.tsx', 'InformativeViews.tsx', 'FooterBadges.tsx'],
    highlights: [
      'Integração do domínio oficial https://support.wazzimagiygg.com/ em toda a plataforma.',
      'Adição do selo oficial MediaWiki 88x31px "SUPORTE • Tickets 24h" no rodapé de conformidade.',
      'Cards interativos de suporte nas seções de Segurança, LGPD e Contato com o DPO.',
      'Atalho de abertura de chamado direto na barra lateral e rodapé institucional.',
    ],
  },
  {
    id: 'upd-3.1.0',
    version: 'v3.1.0',
    title: 'Conformidade LGPD, Central Meus Dados & Marco Civil da Internet',
    date: '2026-08-28T16:00:00Z',
    category: 'compliance',
    author: 'WazzimaGiygg',
    authorRole: 'DPO & Jurídico',
    summary: 'Implementação de salvaguardas de privacidade, portabilidade de dados do titular e registro de auditoria.',
    badge: 'LGPD & Marco Civil',
    commitHash: 'lgpd-art18-marco-civil-13709',
    affectedComponents: ['MyDataModal.tsx', 'LgpdConsentModal.tsx', 'CookieBanner.tsx', 'InformativeViews.tsx'],
    highlights: [
      'Central "Meus Dados" com exportação completa de dados em arquivo estruturado JSON.',
      'Possibilidade de retificação, anonimização e exclusão de perfil conforme o Art. 18 da Lei 13.709/2018.',
      'Banner de cookies com controle granular de preferências e registro de auditoria imutável.',
      'Documento de conformidade com o Art. 15 do Marco Civil da Internet (guarda segura de registros de acesso).',
    ],
  },
  {
    id: 'upd-3.0.0',
    version: 'v3.0.0',
    title: 'Migração para Google Firebase Firestore & Autenticação Multi-Role',
    date: '2026-08-27T14:00:00Z',
    category: 'backend',
    author: 'Sistema Antigravity / Engenharia WikiZero',
    authorRole: 'Infraestrutura Cloud',
    summary: 'Migração da camada de dados para o Firebase Firestore com persistência em nuvem e autenticação Google.',
    badge: 'Cloud Firestore',
    commitHash: 'firebase-firestore-multi-role-auth',
    affectedComponents: ['storageService.ts', 'FirebaseAdminDashboard.tsx', 'AdminUsersManagementView.tsx'],
    highlights: [
      'Banco de dados distribuído Firestore para artigos, portais, discussões, histórico e usuários.',
      'Autenticação Google OAuth com suporte a papéis hierárquicos: Admin, Editor, Revisor e Membro.',
      'Painel de controle administrativo do Firebase para monitoramento de documentos e coleções.',
      'Mecanismo de fallback para armazenamento local offline com sincronização resiliente.',
    ],
  },
  {
    id: 'upd-2.8.0',
    version: 'v2.8.0',
    title: 'Editor Wikitexto Rico, Diff de Histórico & Recursos MediaWiki',
    date: '2026-08-26T11:00:00Z',
    category: 'feature',
    author: 'Sistema Antigravity / Engenharia WikiZero',
    authorRole: 'Engenharia Frontend',
    summary: 'Suporte aprimorado à sintaxe Wikitexto, comparador visual de revisões e páginas especiais da comunidade.',
    badge: 'MediaWiki Engine',
    commitHash: 'wikitext-parser-diff-special-pages',
    affectedComponents: ['WikitextEditor.tsx', 'ArticleHistoryView.tsx', 'SpecialPagesView.tsx', 'TalkPageView.tsx'],
    highlights: [
      'Parser de Wikitexto com suporte a infoboxes, predefinições {{Aviso}}, {{Destaque}}, {{Citação}} e tags <ref>.',
      'Comparador visual de versões lado a lado com realce de adições (verde) e supressões (vermelho).',
      'Páginas especiais: Páginas Órfãs, Páginas Curtas, Mudanças Recentes e Lista de Vigiados com alertas.',
      'Páginas de discussão (Talk Pages) com tópicos comunitários, réplicas encadeadas e status de resolução.',
    ],
  },
  {
    id: 'upd-2.5.0',
    version: 'v2.5.0',
    title: 'Internacionalização Multilíngue (i18n) em 10 Idiomas',
    date: '2026-08-25T09:30:00Z',
    category: 'design',
    author: 'WazzimaGiygg',
    authorRole: 'Comunidade Global',
    summary: 'Tradução da interface enciclopédica e suporte a múltiplos idiomas de leitura.',
    badge: 'i18n Global',
    commitHash: 'i18n-languages-multilingual-support',
    affectedComponents: ['LanguageContext.tsx', 'LanguageModal.tsx', 'languages.ts'],
    highlights: [
      'Suporte a 10 idiomas: Português, Inglês, Espanhol, Francês, Alemão, Italiano, Japonês, Chinês, Russo e Esperanto.',
      'Modal de seleção de idiomas rápido com busca, bandeiras e salvamento de preferência.',
      'Tradução dinâmica dos elementos de cabeçalho, barra lateral, rodapé e páginas informativas.',
    ],
  },
];
