import {
  WikiArticle,
  WikiPage,
  NotificationItem,
  UserProfile,
  UserTalkMessage,
  UserAuditLog,
  SystemUpdateEntry,
  SockpuppetCase,
  CheckUserLogEntry,
  CheckUserAccountDetails,
  UnblockRequest,
  PromotionRequest,
  PromotionVote,
  AdminContactTicket,
  AdminTicketMessage,
  ArbitrationCase,
  ArbitrationCommitteeMember,
} from '../types';

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
      canGrantBarnstars: false,
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
    uid: 'user-mafersao-1100',
    username: 'Mafersão Fantasma da Série 1100',
    displayName: 'Mafersão Fantasma da Série 1100',
    email: 'fantasma1100@ferrovia.wikizero.org',
    role: 'editor',
    isGuest: false,
    isBanned: false,
    reputationScore: 850,
    editsCount: 142,
    warningCount: 0,
    location: 'São Paulo - Ferrovia Santos-Jundiaí',
    createdAt: '2026-01-20T10:00:00Z',
    lastActive: '2026-08-31T18:45:00Z',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: false,
    },
    bio: `{{Infobox
| Nome = Mafersão Fantasma da Série 1100
| Ocupação = Pesquisador Ferroviário & Editor Histórico
| Especialidade = Trens Elétricos, EFSJ, Mafersa & Série 1100
| Status = Guardião da Memória Ferroviária
| Membro Desde = Janeiro de 2026
}}

= Mafersão Fantasma da Série 1100 =
Pesquisador e editor dedicado à preservação da memória ferroviária paulista e brasileira, com ênfase nos lendários trens-unidade elétricos (TUE) fabricados pela '''Mafersa''' e '''Budd Company''', em especial a icônica '''Série 1100''' da Estrada de Ferro Santos a Jundiaí (EFSJ) e CPTM.

== Apresentação & Propósito ==
Bem-vindo(a) à minha página pública na '''WikiZero'''! Este espaço documenta meu histórico de edições, rastreio de contribuições e artigos sobre frotas históricas de trens suburbanos e metropolitanos de aço inoxidável.

== Rastreio de Atividades ==
* '''Foco Editorial:''' Frotas Mafersa (Série 1100, 1400, 1600 e 1700), história da Linha 7-Rubi e ferrovia Santos-Jundiaí.
* '''Status de Rastreabilidade:''' Todas as alterações e contribuições constam no histórico da WikiZero e podem ser verificadas por qualquer colaborador através deste link permanente.

== Caixas de Usuário ==
{{Userbox|🚂|Especialista em Trens Mafersa e Budd Company}}
{{Userbox|⚡|Pesquisador do lendário TUE Série 1100 (O Fantasma dos Trilhos)}}
{{Userbox|📐|Engenharia Ferroviária e Truques de Aço Inox}}
{{Userbox|📜|Preservação Histórica e Documentação Aberta}}`,
    userboxes: [
      {
        id: 'ub-maf-1',
        title: '🚂 TUE Série 1100',
        text: 'Especialista na lendária frota Mafersa/Budd de 1956 da antiga EFSJ',
        icon: '🚂',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        borderClass: 'border-amber-200 dark:border-amber-800',
      },
      {
        id: 'ub-maf-2',
        title: '🛠️ Engenharia Mafersa',
        text: 'Documentador técnico de tração elétrica a 3000V DC e caixas de aço inox',
        icon: '🛠️',
        bgClass: 'bg-slate-100 dark:bg-slate-800',
        borderClass: 'border-slate-300 dark:border-slate-700',
      },
      {
        id: 'ub-maf-3',
        title: '📜 Guardião da Memória',
        text: 'Preservação da história dos transportes sobre trilhos do Brasil',
        icon: '📜',
        bgClass: 'bg-blue-50 dark:bg-blue-950/40',
        borderClass: 'border-blue-200 dark:border-blue-800',
      },
    ],
    barnstars: [
      {
        id: 'bs-maf-1',
        title: '🚂 Medalha do Ferroviário de Ouro',
        description: 'Pela dedicação ímpar e documentação histórica da Série 1100 e frotas de aço inoxidável da Mafersa.',
        icon: '🚂',
        awardedBy: 'WazzimaGiygg',
        awardedAt: '2026-03-15T14:30:00Z',
      },
      {
        id: 'bs-maf-2',
        title: '⭐ Estrela do Editor Incansável',
        description: 'Por mais de 100 edições de verificação e inclusão de fontes primárias sobre o material rodante paulista.',
        icon: '⭐',
        awardedBy: 'Metrofilo_SP',
        awardedAt: '2026-06-20T11:00:00Z',
      },
    ],
    recentActivity: [
      {
        id: 'act-maf-1',
        type: 'edit',
        articleId: 'art-metro-02',
        articleTitle: 'Frota de Trens e Material Rodante',
        pageUid: 'metro_sp',
        date: '2026-08-31T18:45:00Z',
        summary: 'Inclusão detalhada dos motores de tração General Electric e truques da Série 1100',
        deltaBytes: 640,
        isMinor: false,
      },
      {
        id: 'act-maf-2',
        type: 'create',
        articleId: 'art-cptm-1100',
        articleTitle: 'TUE Série 1100 (Budd/Mafersa)',
        pageUid: 'ferrovias',
        date: '2026-08-15T10:20:00Z',
        summary: 'Criação inicial do verbete histórico sobre os TUEs Série 1100 da Estrada de Ferro Santos a Jundiaí',
        deltaBytes: 3120,
        isMinor: false,
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
      canGrantBarnstars: false,
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
  {
    uid: 'user-vandalo-alt',
    username: 'Vandalo_Metro_Alt',
    displayName: 'Vandalo_Metro_Alt',
    email: 'puppet1@temp-mail.org',
    role: 'leitor',
    isGuest: false,
    isBanned: true,
    banType: 'permanente',
    banReason: 'Conta fantoche confirmada (Sockpuppet de Usuario_Suspeito) utilizada para evasão de bloqueio e vandalismo cruzado.',
    reputationScore: -50,
    warningCount: 3,
    createdAt: '2026-08-21T10:00:00Z',
    lastActive: '2026-08-27T19:20:00Z',
    permissions: {
      canEdit: false,
      canCreate: false,
      canTalk: false,
      canDelete: false,
      canGrantBarnstars: false,
    },
    bio: `{{Fantoche|Usuario_Suspeito}}
Esta conta foi confirmada por investigação CheckUser (#SPI-2026-08-01) como um boneco de meia (sockpuppet) utilizado para evasão de sanção editorial.`,
    barnstars: [],
  },
  {
    uid: 'user-contafantoche99',
    username: 'ContaFantoche_99',
    displayName: 'ContaFantoche_99',
    email: 'puppet2@temp-mail.org',
    role: 'leitor',
    isGuest: false,
    isBanned: true,
    banType: 'permanente',
    banReason: 'Fantoche (Sockpuppet) de Usuario_Suspeito.',
    reputationScore: -30,
    warningCount: 2,
    createdAt: '2026-08-22T14:30:00Z',
    lastActive: '2026-08-26T22:00:00Z',
    permissions: {
      canEdit: false,
      canCreate: false,
      canTalk: false,
      canDelete: false,
      canGrantBarnstars: false,
    },
    bio: `{{Fantoche|Usuario_Suspeito}}
Conta bloqueada indefinidamente por manipulação coordenada de consenso.`,
    barnstars: [],
  },
  {
    uid: 'user-promocao-sp',
    username: 'Redator_Promocional_BR',
    displayName: 'Redator_Promocional_BR',
    email: 'marketing@agenciasp.com.br',
    role: 'leitor',
    isGuest: false,
    isBanned: false,
    reputationScore: 120,
    warningCount: 1,
    location: 'São Paulo, SP',
    createdAt: '2026-07-10T14:00:00Z',
    lastActive: '2026-08-28T11:00:00Z',
    permissions: {
      canEdit: true,
      canCreate: false,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: false,
    },
    bio: `Redator focado em eventos corporativos e tecnologia na capital paulista.`,
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

export const INITIAL_CHECKUSER_LOGS: CheckUserLogEntry[] = [
  {
    id: 'culog-1',
    target: 'Usuario_Suspeito',
    targetType: 'username',
    reason: 'Investigação de contas múltiplas e reversão coordenada de edições no verbete História do Metrô (#SPI-2026-08-01)',
    performedBy: 'DevTeam',
    performedByRole: 'moderador',
    timestamp: '2026-08-28T10:15:00Z',
    resultsFound: 2,
  },
  {
    id: 'culog-2',
    target: '177.136.24.0/24',
    targetType: 'cidr',
    reason: 'Verificação de sub-rede IP sob Art. 15 do Marco Civil para apuração de vandalismo cruzado',
    performedBy: 'WazzimaGiygg',
    performedByRole: 'admin',
    timestamp: '2026-08-27T14:40:00Z',
    resultsFound: 3,
  },
  {
    id: 'culog-3',
    target: 'EditorSP',
    targetType: 'username',
    reason: 'Consulta de rotina solicitada por mediação comunitária para confirmação de boa-fé editorial',
    performedBy: 'DevTeam',
    performedByRole: 'moderador',
    timestamp: '2026-07-15T09:30:00Z',
    resultsFound: 0,
  },
];

export const INITIAL_SOCKPUPPET_CASES: SockpuppetCase[] = [
  {
    id: 'case-spi-01',
    caseNumber: 'SPI-2026-08-01',
    title: 'Investigação de Fantoches e Guerra de Edição em Transporte',
    masterAccount: 'Usuario_Suspeito',
    masterAccountUid: 'user-suspeito',
    suspectedAccounts: ['Vandalo_Metro_Alt', 'ContaFantoche_99'],
    status: 'confirmado',
    evidenceSummary: 'Coincidência direta de bloco IP (177.136.24.12 e 177.136.24.15 - Claro Fibra SP), User-Agent idêntico (Chrome 127 Linux x86_64) e edições alternadas em intervalo inferior a 3 minutos no artigo História do Metrô de São Paulo.',
    openedBy: 'DevTeam',
    openedAt: '2026-08-27T11:00:00Z',
    closedAt: '2026-08-28T12:00:00Z',
    conclusions: 'Contas identificadas inequivocamente como fantoches (sockpuppets) da conta principal Usuario_Suspeito. Aplicado bloqueio permanente e aposição da predefinição {{Fantoche}} em conformidade com as diretrizes.',
    similarityScore: 98,
    technicalMatches: {
      ipMatch: true,
      userAgentMatch: true,
      temporalMatch: true,
      stylisticMatch: true,
    },
    sharedIps: ['177.136.24.12', '177.136.24.15'],
    sharedArticles: ['art-metro-01', 'art-metro-02'],
  },
  {
    id: 'case-spi-02',
    caseNumber: 'SPI-2026-08-02',
    title: 'Suspeita de Evasão de Bloqueio e Spam Corporativo',
    masterAccount: 'Redator_Promocional_BR',
    masterAccountUid: 'user-promocao-sp',
    suspectedAccounts: ['MarketingAgencia_SP', 'EventosSP_Bot'],
    status: 'em_analise',
    evidenceSummary: 'Padrão repetitivo de inserção de links externos comerciais e formatação em negrito não enciclopédica.',
    openedBy: 'WazzimaGiygg',
    openedAt: '2026-08-28T14:30:00Z',
    conclusions: 'Em análise técnica preliminar pela moderação.',
    similarityScore: 78,
    technicalMatches: {
      ipMatch: true,
      userAgentMatch: false,
      temporalMatch: true,
      stylisticMatch: true,
    },
    sharedIps: ['189.120.45.88'],
    sharedArticles: ['art-wiki-01'],
  },
  {
    id: 'case-spi-03',
    caseNumber: 'SPI-2026-07-15',
    title: 'Verificação de Coincidência em Votação Editorial (Inocente)',
    masterAccount: 'EditorSP',
    masterAccountUid: 'user-editorsp',
    suspectedAccounts: ['Historiador_Transportes'],
    status: 'arquivado_inocente',
    evidenceSummary: 'Suspeita levantada por terceiros devido a votos semelhantes em tópicos de discussão.',
    openedBy: 'DevTeam',
    openedAt: '2026-07-15T09:00:00Z',
    closedAt: '2026-07-15T10:00:00Z',
    conclusions: 'Completamente inocentado. IPs de provedores distintos (Vivo Fibra Campinas vs. USP Rede Acadêmica), dispositivos distintos e sem padrão de evasão.',
    similarityScore: 12,
    technicalMatches: {
      ipMatch: false,
      userAgentMatch: false,
      temporalMatch: false,
      stylisticMatch: false,
    },
    sharedIps: [],
    sharedArticles: ['art-metro-01'],
  },
];

export const MOCK_CHECKUSER_ACCOUNTS: Record<string, CheckUserAccountDetails> = {
  'user-wazzima': {
    uid: 'user-wazzima',
    displayName: 'WazzimaGiygg',
    username: 'WazzimaGiygg',
    email: 'pedrohenriquecardonaperes@gmail.com',
    role: 'admin',
    isBanned: false,
    createdAt: '2026-01-15T09:00:00Z',
    lastActive: '2026-08-28T17:30:00Z',
    reputationScore: 1250,
    ipAddresses: [
      {
        ip: '201.86.112.44',
        isp: 'Vivo Fibra / Telefônica Brasil S.A.',
        location: 'São Paulo, SP, Brasil',
        lastSeen: '2026-08-28T17:30:00Z',
        usageCount: 142,
      },
      {
        ip: '201.86.112.50',
        isp: 'Vivo Fibra / Telefônica Brasil S.A.',
        location: 'São Paulo, SP, Brasil',
        lastSeen: '2026-08-20T12:10:00Z',
        usageCount: 38,
      },
    ],
    userAgents: [
      {
        browser: 'Chrome 128.0.0.0',
        os: 'Linux x86_64',
        device: 'Desktop / Workstation',
        raw: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        lastSeen: '2026-08-28T17:30:00Z',
      },
    ],
    editedArticles: [
      {
        articleId: 'art-metro-01',
        articleTitle: 'História e Expansão do Metrô de São Paulo',
        timestamp: '2026-08-28T14:30:00Z',
        summary: 'Atualização da tabela de linhas e infobox com dados de passageiros e citações bibliográficas',
      },
      {
        articleId: 'art-wiki-01',
        articleTitle: 'Sobre a WikiZero e Filosofia do Conhecimento',
        timestamp: '2026-08-28T15:00:00Z',
        summary: 'Manifesto e pilares da WikiZero: liberdade de informação, neutralidade e privacidade',
      },
    ],
  },
  'user-editorsp': {
    uid: 'user-editorsp',
    displayName: 'EditorSP',
    username: 'EditorSP',
    email: 'editorsp@comunidade.wikizero.org',
    role: 'editor',
    isBanned: false,
    createdAt: '2026-02-12T14:00:00Z',
    lastActive: '2026-08-28T16:00:00Z',
    reputationScore: 480,
    ipAddresses: [
      {
        ip: '179.184.92.10',
        isp: 'Claro NET Virtua Campinas',
        location: 'Campinas, SP, Brasil',
        lastSeen: '2026-08-28T16:00:00Z',
        usageCount: 88,
      },
    ],
    userAgents: [
      {
        browser: 'Firefox 129.0',
        os: 'Windows 11 NT 10.0',
        device: 'Desktop PC',
        raw: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
        lastSeen: '2026-08-28T16:00:00Z',
      },
    ],
    editedArticles: [
      {
        articleId: 'art-metro-01',
        articleTitle: 'História e Expansão do Metrô de São Paulo',
        timestamp: '2026-08-27T10:00:00Z',
        summary: 'Adição de detalhes sobre o sistema CBTC',
      },
    ],
  },
  'user-suspeito': {
    uid: 'user-suspeito',
    displayName: 'Usuario_Suspeito',
    username: 'Usuario_Suspeito',
    email: 'spam_test@exemplo.com',
    role: 'leitor',
    isBanned: true,
    banReason: 'Inclusão reiterada de hiperlinks promocionais e spam não verificado.',
    createdAt: '2026-06-01T15:00:00Z',
    lastActive: '2026-08-20T09:00:00Z',
    reputationScore: -10,
    ipAddresses: [
      {
        ip: '177.136.24.12',
        isp: 'Claro Fibra / AS28573',
        location: 'São Paulo, SP, Brasil (Zona Leste)',
        lastSeen: '2026-08-20T09:00:00Z',
        usageCount: 45,
      },
      {
        ip: '177.136.24.15',
        isp: 'Claro Fibra / AS28573',
        location: 'São Paulo, SP, Brasil (Zona Leste)',
        lastSeen: '2026-08-19T22:15:00Z',
        usageCount: 12,
      },
    ],
    userAgents: [
      {
        browser: 'Chrome 127.0.6533.119',
        os: 'Linux x86_64 Ubuntu',
        device: 'Desktop / PC',
        raw: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) AppleWebKit/537.36 Chrome/127.0.6533.119',
        lastSeen: '2026-08-20T09:00:00Z',
      },
    ],
    editedArticles: [
      {
        articleId: 'art-metro-01',
        articleTitle: 'História e Expansão do Metrô de São Paulo',
        timestamp: '2026-08-20T08:50:00Z',
        summary: 'Inserção de links externos não verificados',
      },
    ],
  },
  'user-vandalo-alt': {
    uid: 'user-vandalo-alt',
    displayName: 'Vandalo_Metro_Alt',
    username: 'Vandalo_Metro_Alt',
    email: 'puppet1@temp-mail.org',
    role: 'leitor',
    isBanned: true,
    isSockpuppet: true,
    sockpuppetOf: 'Usuario_Suspeito',
    banReason: 'Conta fantoche confirmada (Sockpuppet de Usuario_Suspeito) utilizada para evasão de bloqueio e vandalismo cruzado.',
    createdAt: '2026-08-21T10:00:00Z',
    lastActive: '2026-08-27T19:20:00Z',
    reputationScore: -50,
    ipAddresses: [
      {
        ip: '177.136.24.12',
        isp: 'Claro Fibra / AS28573',
        location: 'São Paulo, SP, Brasil (Zona Leste)',
        lastSeen: '2026-08-27T19:20:00Z',
        usageCount: 31,
      },
      {
        ip: '177.136.24.15',
        isp: 'Claro Fibra / AS28573',
        location: 'São Paulo, SP, Brasil (Zona Leste)',
        lastSeen: '2026-08-26T18:00:00Z',
        usageCount: 14,
      },
    ],
    userAgents: [
      {
        browser: 'Chrome 127.0.6533.119',
        os: 'Linux x86_64 Ubuntu',
        device: 'Desktop / PC',
        raw: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) AppleWebKit/537.36 Chrome/127.0.6533.119',
        lastSeen: '2026-08-27T19:20:00Z',
      },
    ],
    editedArticles: [
      {
        articleId: 'art-metro-01',
        articleTitle: 'História e Expansão do Metrô de São Paulo',
        timestamp: '2026-08-27T19:18:00Z',
        summary: 'Reversão de conteúdo e reinserção de trecho removido',
      },
    ],
    coincidingEditsWithTarget: [
      {
        articleTitle: 'História e Expansão do Metrô de São Paulo',
        targetEditTime: '2026-08-20T08:50:00Z',
        suspectEditTime: '2026-08-21T10:15:00Z',
        diffMinutes: 1525,
      },
    ],
  },
  'user-contafantoche99': {
    uid: 'user-contafantoche99',
    displayName: 'ContaFantoche_99',
    username: 'ContaFantoche_99',
    email: 'puppet2@temp-mail.org',
    role: 'leitor',
    isBanned: true,
    isSockpuppet: true,
    sockpuppetOf: 'Usuario_Suspeito',
    banReason: 'Fantoche (Sockpuppet) de Usuario_Suspeito.',
    createdAt: '2026-08-22T14:30:00Z',
    lastActive: '2026-08-26T22:00:00Z',
    reputationScore: -30,
    ipAddresses: [
      {
        ip: '177.136.24.12',
        isp: 'Claro Fibra / AS28573',
        location: 'São Paulo, SP, Brasil (Zona Leste)',
        lastSeen: '2026-08-26T22:00:00Z',
        usageCount: 19,
      },
    ],
    userAgents: [
      {
        browser: 'Chrome 127.0.6533.119',
        os: 'Linux x86_64 Ubuntu',
        device: 'Desktop / PC',
        raw: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) AppleWebKit/537.36 Chrome/127.0.6533.119',
        lastSeen: '2026-08-26T22:00:00Z',
      },
    ],
    editedArticles: [
      {
        articleId: 'art-metro-02',
        articleTitle: 'Frota de Trens e Material Rodante',
        timestamp: '2026-08-26T21:55:00Z',
        summary: 'Alteração sem fontes nos dados da Frota H',
      },
    ],
  },
  'user-devteam': {
    uid: 'user-devteam',
    displayName: 'DevTeam',
    username: 'DevTeam',
    email: 'dev@wikizero.org',
    role: 'moderador',
    isBanned: false,
    createdAt: '2026-01-10T08:00:00Z',
    lastActive: '2026-08-28T17:00:00Z',
    reputationScore: 780,
    ipAddresses: [
      {
        ip: '187.100.12.9',
        isp: 'Embratel / Claro Brasil',
        location: 'São Paulo, SP, Brasil',
        lastSeen: '2026-08-28T17:00:00Z',
        usageCount: 210,
      },
    ],
    userAgents: [
      {
        browser: 'Firefox Developer 130.0',
        os: 'Linux x86_64',
        device: 'Developer Station',
        raw: 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
        lastSeen: '2026-08-28T17:00:00Z',
      },
    ],
    editedArticles: [],
  },
  'user-historiador': {
    uid: 'user-historiador',
    displayName: 'Historiador_Transportes',
    username: 'Historiador_Transportes',
    email: 'historia@acervo.edu.br',
    role: 'leitor',
    isBanned: false,
    createdAt: '2026-03-05T11:00:00Z',
    lastActive: '2026-08-25T12:00:00Z',
    reputationScore: 190,
    ipAddresses: [
      {
        ip: '143.107.18.2',
        isp: 'USP - Universidade de São Paulo (Rede Acadêmica RNP)',
        location: 'São Paulo, SP, Brasil (Butantã)',
        lastSeen: '2026-08-25T12:00:00Z',
        usageCount: 34,
      },
    ],
    userAgents: [
      {
        browser: 'Safari 17.5',
        os: 'macOS Sonoma 14.5',
        device: 'MacBook Air Apple Silicon',
        raw: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15',
        lastSeen: '2026-08-25T12:00:00Z',
      },
    ],
    editedArticles: [],
  },
};

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
* [[TUE Série 1100 (Budd/Mafersa)|TUE Série 1100 (O Fantasma dos Trilhos)]]

[[Categoria:Transportes]]
[[Categoria:Engenharia]]`,
    historico: [
      {
        id: 'h-metro-02-2',
        data: '2026-08-31T18:45:00Z',
        autor: 'Mafersão Fantasma da Série 1100',
        autorEmail: 'fantasma1100@ferrovia.wikizero.org',
        resumo: 'Inclusão da correlação histórica com a tecnologia Budd/Mafersa e ligação à Série 1100',
        tamanho: 1420,
        deltaBytes: 310,
        versao: 2,
        isMinor: false,
        conteudo: '',
      },
    ],
  },
  {
    id: 'art-cptm-1100',
    pageUid: 'ferrovias',
    titulo: 'TUE Série 1100 (Budd/Mafersa)',
    categoria: 'Frota & Engenharia Ferroviária',
    idioma: 'Português',
    autor: 'Mafersão Fantasma da Série 1100',
    autorEmail: 'fantasma1100@ferrovia.wikizero.org',
    dataCriacao: '2026-08-15T10:20:00Z',
    dataEdicao: '2026-08-31T18:45:00Z',
    visualizacoes: 630,
    versao: 2,
    tags: ['Série 1100', 'Mafersa', 'Budd Company', 'EFSJ', 'CPTM', 'Trens'],
    resumo: 'História técnica e operacional do lendário TUE Série 1100 fabricado pela Mafersa sob licença da Budd Company.',
    descricao: `{{Infobox
| Nome = TUE Série 1100
| Fabricante = Budd Company / Mafersa
| Ano de Fabricação = 1956 - 1957
| Operadora Original = Estrada de Ferro Santos a Jundiaí (EFSJ)
| Última Operadora = CPTM (Linha 7-Rubi)
| Bitola = 1.600 mm (Larga)
| Sistema de Tração = 3.000 V DC - Chopper / Reostático
| Composição = 3 e 6 carros
| Estrutura = Aço Inoxidável Soldado Shotweld
}}

= TUE Série 1100 (Budd/Mafersa) =
A '''Série 1100''' foi uma das séries de trens-unidade elétricos (TUE) mais emblemáticas do transporte ferroviário do Brasil. Conhecido pelos ferroviários e entusiastas como o ''"Fantasma da Série 1100"'' ou simplesmente ''"Mafersão"'', marcou época pela sua durabilidade quase indestrutível com caixas de aço inoxidável austenítico estrutural fabricadas pela '''Mafersa''' sob patente da '''Budd Company''' americana.<ref>Associação Brasileira de Preservação Ferroviária (ABPF). ''Memória Histórica da Tração Elétrica na Santos-Jundiaí'', 2024.</ref>

== Origem e Fabricação ==
Encomendados na década de 1950 pelo Ministério da Viação e Obras Públicas para os serviços suburbanos da antiga Estrada de Ferro Santos a Jundiaí, os primeiros carros foram importados desmontados dos Estados Unidos e montados pela Mafersa em São Paulo. Foi o marco inicial da tecnologia ''Shotweld'' de solda por resistência elétrica em aço inox no Brasil.

== Modernização e Operação na CPTM ==
Entre 1996 e 1998, as unidades foram modernizadas nas oficinas da CPTM e consórcios industriais, recebendo novas frentes de fibra de vidro aerodinâmicas e sistemas atualizados de frenagem e sinalização ATC. Operaram com admirável confiabilidade até sua aposentadoria oficial em 2018 na Linha 7-Rubi.

== Veja Também ==
* [[Frota de Trens e Material Rodante|Frotas do Metrô e Trens Paulistas]]
* [[História do Metrô de São Paulo|Histórico do Transporte Metropolitano]]

[[Categoria:Material Rodante]]
[[Categoria:Ferrovias]]
[[Categoria:História dos Transportes]]`,
    historico: [
      {
        id: 'h-1100-2',
        data: '2026-08-31T18:45:00Z',
        autor: 'Mafersão Fantasma da Série 1100',
        autorEmail: 'fantasma1100@ferrovia.wikizero.org',
        resumo: 'Expansão dos dados técnicos sobre o processo Shotweld e modernização da CPTM',
        tamanho: 2890,
        deltaBytes: 640,
        versao: 2,
        isMinor: false,
        conteudo: '',
      },
      {
        id: 'h-1100-1',
        data: '2026-08-15T10:20:00Z',
        autor: 'Mafersão Fantasma da Série 1100',
        autorEmail: 'fantasma1100@ferrovia.wikizero.org',
        resumo: 'Criação do verbete histórico TUE Série 1100',
        tamanho: 2250,
        deltaBytes: 2250,
        versao: 1,
        isMinor: false,
        conteudo: '',
      },
    ],
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
    id: 'upd-notif-3.9.0',
    title: '🚀 WikiZero v3.9.0 - Login Seguro reCAPTCHA & Governança de Medalhas',
    message: 'Autenticação com Google e validação humana reCAPTCHA v2, concessão de medalhas restrita a Admins/Moderadores e canal de notificações exclusivo para notas de versão.',
    date: '02/09/2026',
    read: false,
    type: 'success',
    link: 'site-updates',
  },
  {
    id: 'upd-notif-3.8.0',
    title: '⚖️ WikiZero v3.8.0 - Conselho de Arbitragem (ArbCom) por Idioma',
    message: 'Suprema corte comunitária ativa com jurisdições autônomas por idioma, dossiês probatórios e deliberações vinculantes.',
    date: '30/08/2026',
    read: false,
    type: 'info',
    link: 'site-updates',
  },
  {
    id: 'upd-notif-3.7.0',
    title: '🛡️ WikiZero v3.7.0 - Ferramenta CheckUser & Investigação SPI',
    message: 'Auditoria forense de IP/User-Agent e detecção de contas fantoches (sockpuppets) para moderadores e administradores.',
    date: '20/08/2026',
    read: false,
    type: 'info',
    link: 'site-updates',
  },
  {
    id: 'upd-notif-3.6.0',
    title: '⚡ WikiZero v3.6.0 - Suporte a Predefinições & Editor Avançado',
    message: 'Implementação de predefinições dinâmicas {{Aviso}}, {{Nota}}, {{Destaque}}, notas <ref> e caixas expansíveis.',
    date: '10/08/2026',
    read: true,
    type: 'info',
    link: 'site-updates',
  },
  {
    id: 'upd-notif-3.5.0',
    title: '🔒 WikiZero v3.5.0 - Conformidade LGPD & Portabilidade de Dados',
    message: 'Termo de consentimento 2.0 ativo, verificação etária e exportação integral de dados em JSON/CSV.',
    date: '01/08/2026',
    read: true,
    type: 'info',
    link: 'site-updates',
  },
];

export const INITIAL_SYSTEM_UPDATES: SystemUpdateEntry[] = [
  {
    id: 'upd-3.9.0',
    version: 'v3.9.0',
    title: 'Login Seguro com Google & reCAPTCHA v2, Governança de Medalhas e Notificações de Versão',
    date: '2026-09-02T15:00:00Z',
    category: 'security',
    author: 'Equipe de Engenharia & Governança WikiZero',
    authorRole: 'Corpo Técnico & Administradores',
    summary: 'Novo fluxo de autenticação blindado com validação humana Google reCAPTCHA v2, restrição estrita da concessão de medalhas/barnstars aos papéis de Administrador e Moderador, simplificação da janela de login e canal de notificações dedicado exclusivamente a notas de versão.',
    badge: 'Segurança & Integridade',
    isLatest: true,
    commitHash: 'recaptcha-auth-barnstar-roles-notifs-v390',
    affectedComponents: [
      'LoginModal.tsx',
      'RecaptchaWidget.tsx',
      'UserPageView.tsx',
      'Header.tsx',
      'storageService.ts',
      'seedData.ts',
    ],
    highlights: [
      'Verificação obrigatória Google reCAPTCHA v2 na janela de autenticação para prevenir ataques de força bruta, criação de bots e edições automatizadas não autorizadas.',
      'Interface de login simplificada e segura: remoção de botões de perfis comunitários e criação arbitrária manual, consolidando o acesso direto via Conta Google oficial ou modo anônimo verificado.',
      'Governança rigorosa de condecorações: concessão de medalhas e insígnias (Barnstars) agora restrita formalmente aos papéis de Administrador e Moderador, com bloqueio em camada de serviço e ocultação de controles para editores comuns.',
      'Feed do sininho de notificações reformulado como canal oficial de Notas de Versão e Atualizações do Sistema (Changelog Oficial), eliminando ruídos operacionais de edições ou mensagens corriqueiras.',
      'Sincronização instantânea e recarga dinâmica de histórico de atualizações no log de versões da enciclopédia.',
    ],
  },
  {
    id: 'upd-3.8.0',
    version: 'v3.8.0',
    title: 'Conselho de Arbitragem (ArbCom) por Idioma & Sistema de Julgamento Comunitário',
    date: '2026-08-30T10:00:00Z',
    category: 'feature',
    author: 'WazzimaGiygg / Equipe de Governança WikiZero',
    authorRole: 'Administrador & Burocrata',
    summary: 'Implementação da suprema corte comunitária (Conselho de Arbitragem / ArbCom) com jurisdições autônomas por idioma, dossiês probatórios, deliberações secretas e acórdãos vinculantes.',
    badge: 'ArbCom Oficial',
    isLatest: false,
    commitHash: 'arbcom-jurisdiction-pt-en-es-v380',
    affectedComponents: [
      'ArbitrationCommitteeView.tsx',
      'Sidebar.tsx',
      'SpecialPagesView.tsx',
      'MobileDrawerMenu.tsx',
      'Footer.tsx',
      'storageService.ts',
    ],
    highlights: [
      'Conselhos de Arbitragem independentes por idioma (Português, Inglês, Espanhol, Francês, Alemão, etc.) com composição eleita e mandatos anuais.',
      'Gestão integral de processos disciplinares: conduta editorial, assédio, quebra reiterada de NPOV, guerras de edição e apuração de abuso de autoridade de moderadores e administradores.',
      'Rito processual completo com contraditório: representação inicial, réplicas de partes envolvidas, anexação de difs e pareceres técnicos de CheckUser.',
      'Painel exclusivo para árbitros titulados deliberarem e votarem com quórum qualificado, emitindo acórdãos fundamentados e súmulas vinculantes.',
      'Aplicação de remédios e sanções tutelares: advertências formais, restrição de edição por tópicos (topic bans), revogação de permissões administrativas (desnomeação) e bloqueio definitivo.',
      'Transparência com busca de jurisprudência, filtros por categoria, estatísticas de casos julgados e atalhos na barra lateral e rodapé.',
    ],
  },
  {
    id: 'upd-3.7.0',
    version: 'v3.7.0',
    title: 'Central de Contato com a Administração & Gestão de Chamados Técnicos',
    date: '2026-08-30T08:00:00Z',
    category: 'feature',
    author: 'Equipe de Suporte & Moderação WikiZero',
    authorRole: 'Corpo Administrativo',
    summary: 'Sistema unificado de atendimento institucional para abertura e acompanhamento de tickets diretamente com a equipe de administradores.',
    badge: 'Atendimento 24h',
    commitHash: 'admin-tickets-support-desk-v370',
    affectedComponents: [
      'AdminContactView.tsx',
      'Sidebar.tsx',
      'SpecialPagesView.tsx',
      'Footer.tsx',
      'storageService.ts',
    ],
    highlights: [
      'Abertura de chamados estruturados categorizados em: Vandalismo, Proteção de Páginas, Dúvidas de Políticas, Erros Técnicos e Privacidade/LGPD.',
      'Controle de níveis de prioridade e status de tramitação (Aberto, Em Análise, Respondido, Resolvido).',
      'Mensagens encadeadas entre o solicitante e administradores com anotações de staff e pareceres conclusivos.',
      'Histórico persistido e arquivamento seguro em conformidade com as diretrizes do Marco Civil da Internet.',
    ],
  },
  {
    id: 'upd-3.6.0',
    version: 'v3.6.0',
    title: 'Pedidos de Promoção (RfA) & Votação Democrática de Sysop com Teto de 10 Votos',
    date: '2026-08-29T23:30:00Z',
    category: 'feature',
    author: 'Comunidade WikiZero',
    authorRole: 'Governança & Eleições',
    summary: 'Módulo eleitoral comunitário para candidatura e escrutínio público de cargos de Moderador, Administrador e Burocrata.',
    badge: 'Eleições Comunitárias',
    commitHash: 'rfa-elections-quorum-10votes-v360',
    affectedComponents: [
      'PromotionRequestsView.tsx',
      'Sidebar.tsx',
      'SpecialPagesView.tsx',
      'storageService.ts',
    ],
    highlights: [
      'Submissão de candidaturas com declaração de intenções, resumo de contribuições e histórico de edições.',
      'Votação pública (A Favor / Contra) restrita a editores credenciados com teto fixo de 10 votos para decisões ágeis.',
      'Cálculo automático de taxa de aprovação necessária (60% para Moderador, 75% para Sysop e 85% para Burocrata).',
      'Homologação formal de resultados com concessão de permissões no sistema.',
    ],
  },
  {
    id: 'upd-3.5.0',
    version: 'v3.5.0',
    title: 'Central de Recursos de Bloqueio & Revisão Humana LGPD (Artigo 20)',
    date: '2026-08-29T21:00:00Z',
    category: 'compliance',
    author: 'WazzimaGiygg',
    authorRole: 'DPO & Jurídico',
    summary: 'Canal de apelação e devido processo legal para revisão de sanções editoriais e bloqueios automáticos.',
    badge: 'Garantias & LGPD',
    commitHash: 'unblock-appeals-lgpd-art20-v350',
    affectedComponents: [
      'UnblockRequestsView.tsx',
      'SpecialPagesView.tsx',
      'storageService.ts',
    ],
    highlights: [
      'Garantia do direito de revisão humana sobre decisões algorítmicas ou de moderação nos termos da Lei 13.709/2018.',
      'Formulário estruturado de justificação de recurso e termo de compromisso com as diretrizes editoriais.',
      'Anexação automática do resumo de auditoria CheckUser para apoiar a avaliação imparcial dos moderadores.',
      'Debate interno entre avaliadores e emissão de parecer de deferimento ou indeferimento fundamentado.',
    ],
  },
  {
    id: 'upd-3.4.5',
    version: 'v3.4.5',
    title: 'Diretrizes Estritas de Upload & Proibição de Importação da Wikimedia Commons',
    date: '2026-08-29T20:00:00Z',
    category: 'compliance',
    author: 'Conselho Editorial WikiZero',
    authorRole: 'Diretrizes & Propriedade Intelectual',
    summary: 'Consolidação das políticas de autonomia autoral e regras explícitas na Central de Upload vetando a importação direta de arquivos da Wikimedia Commons ou Wikipédia.',
    badge: 'Diretrizes de Mídia',
    commitHash: 'upload-policy-wikimedia-commons-ban-v345',
    affectedComponents: [
      'FileUploadModal.tsx',
      'SpecialPagesView.tsx',
      'InformativeViews.tsx',
    ],
    highlights: [
      'Aviso em destaque na Central de Upload sobre a vedação à importação ou cópia direta de mídias da Wikimedia Commons e Wikipédia sem verificação autônoma.',
      'Exigência de declaração de autoria própria ou comprovação de licença livre primária (CC-BY-SA 4.0, Domínio Público ou GNU GPL).',
      'Sanções disciplinares e remoção imediata de arquivos inseridos em desconformidade com as diretrizes.',
    ],
  },
  {
    id: 'upd-3.4.0',
    version: 'v3.4.0',
    title: 'Ferramenta Forense CheckUser (SPI) & Investigação de Contas Múltiplas',
    date: '2026-08-29T19:20:00Z',
    category: 'security',
    author: 'Sistema Antigravity / Engenharia WikiZero',
    authorRole: 'Segurança & Auditoria',
    summary: 'Painel investigativo técnico para identificação e combate a contas fantoches (sockpuppets), guerras de edição coordenadas e evasão de bloqueio.',
    badge: 'CheckUser & SPI',
    commitHash: 'checkuser-forensic-spi-investigation-v340',
    affectedComponents: [
      'CheckUserView.tsx',
      'Sidebar.tsx',
      'SpecialPagesView.tsx',
      'storageService.ts',
    ],
    highlights: [
      'Cruzamento de conexões de rede: endereços IP, blocos CIDR, operadoras ISP e análise de User-Agent de navegadores.',
      'Algoritmo heurístico de cálculo de similaridade técnica, temporal e comportamental entre contas investigadas.',
      'Dossiês de casos de fantocharia (SPI) com histórico de ações, evidências coletadas e decisões de bloqueio.',
      'Registro obrigatório e imutável de todas as consultas em conformidade com o Artigo 15 do Marco Civil da Internet.',
    ],
  },
  {
    id: 'upd-3.3.0',
    version: 'v3.3.0',
    title: 'Página Oficial de Atualizações & Registro de Melhorias do Sistema',
    date: '2026-08-29T18:40:00Z',
    category: 'feature',
    author: 'Sistema Antigravity / Engenharia WikiZero',
    authorRole: 'Sistema & Desenvolvedores',
    summary: 'Disponibilização da página oficial de registro cronológico de atualizações, notas de versão e melhorias contínuas do sistema WikiZero/WazzimaGiygg.',
    badge: 'Changelog Oficial',
    isLatest: false,
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

export const INITIAL_UNBLOCK_REQUESTS: UnblockRequest[] = [
  {
    id: 'unb-105',
    userUid: 'user-lgpd-titular',
    username: 'Advogado_Pesquisador',
    displayName: 'Dr. Roberto Mendes',
    email: 'roberto.mendes@direito.usp.br',
    userRoleAtBan: 'editor',
    blockReason: 'Filtro automático anti-abuso disparado por inserção de documento com jurisprudência.',
    blockedBy: 'Sistema Anti-Abuso WikiZero',
    blockedAt: '2026-08-29T12:00:00Z',
    requestedAt: '2026-08-29T13:40:00Z',
    category: 'revisao_lgpd_marco_civil',
    appealJustification:
      'Solicito a revisão humana de decisão automatizada nos termos do Artigo 20 da LGPD (Lei 13.709/2018). O filtro algorítmico do sistema interpretou equivocadamente links de ementas do STJ como spam promocional externo, ocasionando o bloqueio automático indevido da minha conta de editor enquanto editava o artigo sobre Legislação Metroferroviária.',
    commitmentToGuidelines:
      'Inserir referências bibliográficas formatadas segundo a ABNT NBR 6023 sem hiperlinks diretos que acionem o filtro heurístico de links brutos.',
    ipAddress: '143.107.18.22',
    status: 'pendente',
    urgency: 'alta',
    comments: [
      {
        id: 'comm-1',
        author: 'DevTeam',
        authorRole: 'moderador',
        text: 'Verifiquei o log do filtro heurístico #AF-89. Tratava-se de um falso positivo gerado por múltiplos links da base do STJ inseridos no mesmo parágrafo.',
        timestamp: '2026-08-29T14:10:00Z',
        isInternalModeratorNote: true,
      },
    ],
    checkUserSummary: {
      riskScore: 0,
      matchedAccountsCount: 0,
      sameIpAsAccounts: [],
    },
  },
  {
    id: 'unb-101',
    userUid: 'user-suspeito',
    username: 'Usuario_Suspeito',
    displayName: 'Usuario_Suspeito',
    email: 'spam_test@exemplo.com',
    userRoleAtBan: 'leitor',
    blockReason: 'Inclusão reiterada de hiperlinks promocionais e spam não verificado.',
    blockedBy: 'WazzimaGiygg',
    blockedAt: '2026-08-20T10:00:00Z',
    requestedAt: '2026-08-28T14:30:00Z',
    category: 'vandalismo_acidental',
    appealJustification:
      'Reconheço que adicionei links para blogs pessoais e sites de fãs achando que poderiam servir como fontes secundárias sobre as frotas de trem. Não tinha a intenção de praticar spam publicitário comercial. Já li integralmente o guia de Verificabilidade e Fontes Confiáveis da WikiZero.',
    commitmentToGuidelines:
      'Comprometo-me a não incluir mais links sem revisão prévia, utilizar exclusivamente fontes acadêmicas e governamentais (Metrô/CPTM/STM) e debater quaisquer alterações de relevância na página de discussão dos artigos.',
    ipAddress: '177.136.24.12',
    status: 'pendente',
    urgency: 'media',
    comments: [
      {
        id: 'comm-2',
        author: 'DevTeam',
        authorRole: 'moderador',
        text: 'O usuário demonstrou arrependimento sincero, mas notamos que seu IP coincide com contas fantoches investigadas no caso #SPI-2026-08-01. Recomendo exigir esclarecimento quanto ao IP compartilhado antes de aprovar.',
        timestamp: '2026-08-29T10:15:00Z',
        isInternalModeratorNote: true,
      },
    ],
    checkUserSummary: {
      riskScore: 78,
      matchedAccountsCount: 2,
      sameIpAsAccounts: ['Vandalo_Metro_Alt', 'ContaFantoche_99'],
    },
  },
  {
    id: 'unb-102',
    userUid: 'user-carlos-hist',
    username: 'Carlos_Historico',
    displayName: 'Carlos Historiador',
    email: 'carlos.ferrovias@gmail.com',
    userRoleAtBan: 'editor',
    blockReason: 'Guerra de edições (3RR) na página da Estrada de Ferro Santos-Jundiaí e recusa em discutir na Talk Page.',
    blockedBy: 'DevTeam',
    blockedAt: '2026-08-25T11:00:00Z',
    requestedAt: '2026-08-27T09:10:00Z',
    category: 'guerra_edicao',
    appealJustification:
      'Peço desculpas pela insistência nas reversões sucessivas em torno da datação das locomotivas a vapor da SPR. Estava com a documentação do IPHAN em mãos e me exaltei ao ver as correções sendo desfeitas sem justificativa no sumário. Compreendo agora que o procedimento correto era abrir um tópico na Discussão do Artigo.',
    commitmentToGuidelines:
      'Jamais voltarei a fazer reversões consecutivas que violem a regra das 3 reversões (3RR). Toda divergência historiográfica será documentada com citação de página e discutida com a comunidade na aba de discussão.',
    ipAddress: '201.86.110.45',
    status: 'em_analise',
    urgency: 'alta',
    comments: [
      {
        id: 'comm-3',
        author: 'WazzimaGiygg',
        authorRole: 'admin',
        text: 'Carlos é um colaborador de longa data. A suspensão temporária foi pedagógica e a justificativa foi clara e objetiva.',
        timestamp: '2026-08-28T15:00:00Z',
        isInternalModeratorNote: true,
      },
    ],
    checkUserSummary: {
      riskScore: 0,
      matchedAccountsCount: 0,
      sameIpAsAccounts: [],
    },
  },
  {
    id: 'unb-103',
    userUid: 'user-lab-escola',
    username: 'Laboratorio_IFSP',
    displayName: 'Lab Informática IFSP',
    email: 'lab.ti@ifsp.edu.br',
    userRoleAtBan: 'leitor',
    blockReason: 'Bloqueio preventivo por vandalismo massivo originado de faixa IP institucional.',
    blockedBy: 'WazzimaGiygg',
    blockedAt: '2026-08-15T16:00:00Z',
    requestedAt: '2026-08-26T14:00:00Z',
    category: 'bloqueio_ip_compartilhado',
    appealJustification:
      'Somos o setor de TI do campus. Alunos utilizaram o laboratório coletivo para realizar edições de teste que foram interpretadas como vandalismo. Implementamos restrição de rede interna e solicitamos isenção de bloqueio de IP para as contas de pesquisa dos professores.',
    commitmentToGuidelines:
      'Supervisão contínua das atividades nos laboratórios e bloqueio interno de acessos não acadêmicos.',
    ipAddress: '200.144.120.5',
    status: 'aprovado',
    urgency: 'alta',
    reviewedBy: 'WazzimaGiygg',
    reviewedByRole: 'admin',
    reviewedAt: '2026-08-27T10:30:00Z',
    resolutionDecision: 'unblock_full',
    resolutionNotes:
      'Recurso procedente. Bloqueio automático de rede revogado e concedida isenção para a conta institucional do IFSP. Caso venha a ocorrer novo vandalismo localizado, aplicar bloqueio individual em vez de bloquear toda a sub-rede /24 do campus.',
    comments: [],
    checkUserSummary: {
      riskScore: 10,
      matchedAccountsCount: 0,
      sameIpAsAccounts: [],
    },
  },
  {
    id: 'unb-104',
    userUid: 'user-vandalo-alt',
    username: 'Vandalo_Metro_Alt',
    displayName: 'Vandalo_Metro_Alt',
    email: 'puppet1@temp-mail.org',
    userRoleAtBan: 'leitor',
    blockReason: 'Conta fantoche confirmada (Sockpuppet) utilizada para evasão de bloqueio.',
    blockedBy: 'WazzimaGiygg',
    blockedAt: '2026-08-27T20:00:00Z',
    requestedAt: '2026-08-28T18:00:00Z',
    category: 'fantoche_falso_positivo',
    appealJustification:
      'Não sou conta fantoche de ninguém, apenas usei a mesma rede Wi-Fi da faculdade que outros usuários também utilizam.',
    commitmentToGuidelines: 'Não vou mais editar os mesmos artigos.',
    ipAddress: '177.136.24.12',
    status: 'recusado',
    urgency: 'baixa',
    reviewedBy: 'DevTeam',
    reviewedByRole: 'moderador',
    reviewedAt: '2026-08-29T11:00:00Z',
    resolutionDecision: 'rejected',
    resolutionNotes:
      'Recurso indeferido. A investigação CheckUser (#SPI-2026-08-01) demonstrou correlação de 100% de User-Agent e padrão exato de edição cruzada em menos de 4 minutos da suspensão da conta principal. Permanência do bloqueio por evasão deliberada.',
    comments: [],
    checkUserSummary: {
      riskScore: 100,
      matchedAccountsCount: 2,
      sameIpAsAccounts: ['Usuario_Suspeito', 'ContaFantoche_99'],
    },
  },
];

export const INITIAL_PROMOTION_REQUESTS: PromotionRequest[] = [
  {
    id: 'rfa-2026-01',
    candidateUid: 'user-metrolog',
    candidateUsername: 'MetroLog',
    candidateDisplayName: 'MetroLog',
    candidateEmail: 'metrolog@wikizero.org',
    currentRole: 'editor',
    targetRole: 'moderador',
    nominatedBy: 'MetroLog',
    nominatedByUid: 'user-metrolog',
    isSelfNomination: true,
    statement:
      'Olá a todos da comunidade WikiZero! Venho por meio deste RFA submeter minha candidatura ao estatuto de Moderador. Estou ativo diariamente patrulhando Mudanças Recentes, combatendo spam e auxiliando novos editores na formatação de infoboxes e normas de neutralidade (NPOV). Como moderador, pretendo focar na agilidade no atendimento de pedidos de proteção de páginas e mediação de guerras de edição na seção de mobilidade urbana e tecnologia.',
    contributionsSummary:
      'Membro ativo há 7 meses, mais de 450 edições válidas, 32 artigos criados ou substancialmente expandidos (incluindo as páginas da Linha 1-Azul e Linha 4-Amarela), 3 Barnstars de mérito comunitário recebidos e histórico 100% limpo sem advertências.',
    requestedAt: '2026-08-25T14:30:00Z',
    status: 'em_votacao',
    maxVotes: 10,
    requiredApprovalRate: 60,
    votes: [
      {
        id: 'vote-01',
        voterUid: 'user-wazzima',
        voterUsername: 'WazzimaGiygg',
        voterDisplayName: 'WazzimaGiygg',
        voterRole: 'admin',
        vote: 'a_favor',
        reason:
          'A favor com convicção. Editor extremamente dedicado, atento às Mudanças Recentes e sempre respeitoso nas páginas de discussão.',
        timestamp: '2026-08-25T16:00:00Z',
      },
      {
        id: 'vote-02',
        voterUid: 'user-devteam',
        voterUsername: 'DevTeam',
        voterDisplayName: 'DevTeam',
        voterRole: 'moderador',
        vote: 'a_favor',
        reason:
          'Apoio integralmente. Já demonstra grande discernimento técnico e postura madura em reversões de vandalismo.',
        timestamp: '2026-08-25T18:15:00Z',
      },
      {
        id: 'vote-03',
        voterUid: 'user-ferrovia',
        voterUsername: 'FerroviaSp',
        voterDisplayName: 'Ferrovia SP',
        voterRole: 'editor',
        vote: 'a_favor',
        reason:
          'Excelente colega de edição, sempre nos orienta com paciência nas infoboxes ferroviárias. Terá ótimo proveito das ferramentas.',
        timestamp: '2026-08-26T09:40:00Z',
      },
      {
        id: 'vote-04',
        voterUid: 'user-urbanista',
        voterUsername: 'Urbanista_BR',
        voterDisplayName: 'Urbanista_BR',
        voterRole: 'editor',
        vote: 'contra',
        reason:
          'Contra no momento. Reconheço a boa vontade, mas acredito que o candidato deveria participar mais ativamente das discussões na Esplanada geral antes de assumir moderação formal.',
        timestamp: '2026-08-26T13:20:00Z',
      },
      {
        id: 'vote-05',
        voterUid: 'user-cidadania',
        voterUsername: 'CidadaniaDigital',
        voterDisplayName: 'CidadaniaDigital',
        voterRole: 'editor',
        vote: 'a_favor',
        reason:
          'A favor. O volume de contribuições e a rapidez na correção de erros factuais comprovam a prontidão para o cargo.',
        timestamp: '2026-08-27T11:05:00Z',
      },
      {
        id: 'vote-06',
        voterUid: 'user-critico',
        voterUsername: 'EditorCritico',
        voterDisplayName: 'EditorCritico',
        voterRole: 'editor',
        vote: 'contra',
        reason:
          'Contra. Em uma discussão anterior sobre o artigo do VLT de Santos houve reversão precipitada sem prévio diálogo na página de discussão.',
        timestamp: '2026-08-28T08:50:00Z',
      },
      {
        id: 'vote-07',
        voterUid: 'user-brasilia',
        voterUsername: 'BrasilMetro',
        voterDisplayName: 'BrasilMetro',
        voterRole: 'editor',
        vote: 'a_favor',
        reason:
          'A favor. O incidente isolado já foi superado e o candidato pediu desculpas na época. É o tipo de moderador ativo que a WikiZero precisa.',
        timestamp: '2026-08-29T14:10:00Z',
      },
    ],
  },
  {
    id: 'rfa-2026-02',
    candidateUid: 'user-devteam',
    candidateUsername: 'DevTeam',
    candidateDisplayName: 'DevTeam',
    candidateEmail: 'devteam@wikizero.org',
    currentRole: 'moderador',
    targetRole: 'admin',
    nominatedBy: 'WazzimaGiygg',
    nominatedByUid: 'user-wazzima',
    isSelfNomination: false,
    statement:
      'Proponho a promoção do moderador DevTeam ao estatuto de Administrador (Sysop). O usuário atua há mais de 8 meses na mediação de conflitos, gestão de filtros de proteção e auditoria de contas suspeitas com total imparcialidade e rigor técnico. A ampliação para o cargo de Administrador permitirá executar manutenções estruturais no banco de dados e gestão de permissões avançadas.',
    contributionsSummary:
      'Mais de 900 ações de moderação executadas com êxito, 1.200 edições na enciclopédia, autor de diretrizes sobre verificabilidade e sem qualquer sanção no histórico.',
    requestedAt: '2026-08-27T10:00:00Z',
    status: 'em_votacao',
    maxVotes: 10,
    requiredApprovalRate: 75,
    votes: [
      {
        id: 'vote-101',
        voterUid: 'user-wazzima',
        voterUsername: 'WazzimaGiygg',
        voterDisplayName: 'WazzimaGiygg',
        voterRole: 'admin',
        vote: 'a_favor',
        reason:
          'Proponente e totalmente a favor. Confiança plena na maturidade técnica e equilíbrio ético para atuar como administrador.',
        timestamp: '2026-08-27T10:10:00Z',
      },
      {
        id: 'vote-102',
        voterUid: 'user-metrolog',
        voterUsername: 'MetroLog',
        voterDisplayName: 'MetroLog',
        voterRole: 'editor',
        vote: 'a_favor',
        reason:
          'A favor! Excelente trabalho na resolução de incidentes e sempre pronto a esclarecer dúvidas técnicas da comunidade.',
        timestamp: '2026-08-27T15:30:00Z',
      },
      {
        id: 'vote-103',
        voterUid: 'user-ferrovia',
        voterUsername: 'FerroviaSp',
        voterDisplayName: 'Ferrovia SP',
        voterRole: 'editor',
        vote: 'a_favor',
        reason:
          'Apoio firme. Sua atuação na proteção de páginas contra bots de spam foi exemplar.',
        timestamp: '2026-08-28T12:00:00Z',
      },
      {
        id: 'vote-104',
        voterUid: 'user-brasilia',
        voterUsername: 'BrasilMetro',
        voterDisplayName: 'BrasilMetro',
        voterRole: 'editor',
        vote: 'a_favor',
        reason:
          'A favor. Já desempenha funções equivalentes com maestria e ética irrepreensível.',
        timestamp: '2026-08-29T16:40:00Z',
      },
    ],
  },
  {
    id: 'rfa-2026-00',
    candidateUid: 'user-wazzima',
    candidateUsername: 'WazzimaGiygg',
    candidateDisplayName: 'WazzimaGiygg',
    candidateEmail: 'pedrohenriquecardonaperes@gmail.com',
    currentRole: 'moderador',
    targetRole: 'admin',
    nominatedBy: 'Comunidade WikiZero',
    isSelfNomination: false,
    statement:
      'Candidatura comunitária inaugural para confirmação de mandato de Administrador & Burocrata da WikiZero.',
    contributionsSummary:
      'Fundador do repositório de dados, autor de dezenas de páginas seminais sobre mobilidade e conformidade LGPD.',
    requestedAt: '2026-08-10T10:00:00Z',
    closedAt: '2026-08-14T18:00:00Z',
    closedBy: 'Conselho Editorial WikiZero',
    closedByRole: 'admin',
    status: 'aprovada',
    maxVotes: 10,
    requiredApprovalRate: 75,
    resolutionNotes:
      'Votação comunitária encerrada por atingimento do teto de 10 votos válidos com 100% de apoio favorável (10 votos a favor, 0 contra). Estatuto de Administrador homologado.',
    votes: [
      {
        id: 'vote-init-01',
        voterUid: 'user-devteam',
        voterUsername: 'DevTeam',
        voterDisplayName: 'DevTeam',
        voterRole: 'moderador',
        vote: 'a_favor',
        reason: 'Apoio total. Liderança técnica indispensável para a evolução da enciclopédia.',
        timestamp: '2026-08-10T11:00:00Z',
      },
      {
        id: 'vote-init-02',
        voterUid: 'user-metrolog',
        voterUsername: 'MetroLog',
        voterDisplayName: 'MetroLog',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'A favor. Dedicação exemplar ao projeto desde o primeiro dia.',
        timestamp: '2026-08-10T12:00:00Z',
      },
      {
        id: 'vote-init-03',
        voterUid: 'user-ferrovia',
        voterUsername: 'FerroviaSp',
        voterDisplayName: 'Ferrovia SP',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'A favor da consolidação do corpo administrativo.',
        timestamp: '2026-08-11T09:00:00Z',
      },
      {
        id: 'vote-init-04',
        voterUid: 'user-urbanista',
        voterUsername: 'Urbanista_BR',
        voterDisplayName: 'Urbanista_BR',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'A favor. Excelente gestão das diretrizes de formatação.',
        timestamp: '2026-08-11T14:30:00Z',
      },
      {
        id: 'vote-init-05',
        voterUid: 'user-cidadania',
        voterUsername: 'CidadaniaDigital',
        voterDisplayName: 'CidadaniaDigital',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'A favor. Compromisso indiscutível com a privacidade e o código aberto.',
        timestamp: '2026-08-12T10:15:00Z',
      },
      {
        id: 'vote-init-06',
        voterUid: 'user-brasilia',
        voterUsername: 'BrasilMetro',
        voterDisplayName: 'BrasilMetro',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'A favor. Conhecimento amplo de gestão e boa comunicação.',
        timestamp: '2026-08-12T17:00:00Z',
      },
      {
        id: 'vote-init-07',
        voterUid: 'user-critico',
        voterUsername: 'EditorCritico',
        voterDisplayName: 'EditorCritico',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'A favor. Postura sempre aberta a críticas e revisões.',
        timestamp: '2026-08-13T11:20:00Z',
      },
      {
        id: 'vote-init-08',
        voterUid: 'user-nordeste',
        voterUsername: 'NordesteTrilhos',
        voterDisplayName: 'NordesteTrilhos',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'A favor sem restrições.',
        timestamp: '2026-08-13T15:40:00Z',
      },
      {
        id: 'vote-init-09',
        voterUid: 'user-sul',
        voterUsername: 'SulFerrovias',
        voterDisplayName: 'SulFerrovias',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: 'Apoio à nomeação.',
        timestamp: '2026-08-14T10:00:00Z',
      },
      {
        id: 'vote-init-10',
        voterUid: 'user-geo',
        voterUsername: 'GeoBrasil',
        voterDisplayName: 'GeoBrasil',
        voterRole: 'editor',
        vote: 'a_favor',
        reason: '10º voto a favor confirmando o quórum integral.',
        timestamp: '2026-08-14T16:30:00Z',
      },
    ],
  },
];

export const INITIAL_ADMIN_TICKETS: AdminContactTicket[] = [
  {
    id: 'ticket-101',
    subject: 'Denúncia de Vandalismo Recorrente e Inserção de Links Promocionais em Linha 1-Azul',
    category: 'vandalismo',
    priority: 'alta',
    status: 'resolvido',
    userUid: 'user-ferrovia',
    userUsername: 'PaulistaTrilhos',
    userDisplayName: 'PaulistaTrilhos',
    userEmail: 'paulista.trilhos@wikizero.org',
    userRole: 'editor',
    relatedArticleTitle: 'Linha 1 do Metrô de São Paulo',
    relatedArticleId: 'art-linha-1-azul',
    description: 'Um endereço IP anônimo tem insistido em apagar a tabela de dados técnicos da frota e adicionar links externos de afiliados de sites de apostas na seção de referências. Já reverti duas vezes hoje.',
    evidenceLinks: ['https://wikizero.org/wiki/Linha_1_do_Metro_de_Sao_Paulo?diff=latest'],
    createdAt: '2026-08-25T14:20:00Z',
    updatedAt: '2026-08-25T15:10:00Z',
    closedAt: '2026-08-25T15:10:00Z',
    assignedAdmin: 'WazzimaGiygg',
    assignedAdminUid: 'user-wazzima',
    resolutionSummary: 'Página semiprotegida temporariamente por 7 dias contra edições não cadastradas e IP bloqueado no firewall.',
    messages: [
      {
        id: 'msg-101-1',
        senderUid: 'user-ferrovia',
        senderName: 'PaulistaTrilhos',
        senderRole: 'editor',
        isStaff: false,
        message: 'Prezada administração, solicito intervenção rápida no artigo Linha 1 do Metrô de São Paulo. O usuário anônimo está usando script para reinserir links suspeitos.',
        timestamp: '2026-08-25T14:20:00Z',
      },
      {
        id: 'msg-101-2',
        senderUid: 'user-wazzima',
        senderName: 'WazzimaGiygg',
        senderRole: 'admin',
        isStaff: true,
        message: 'Olá PaulistaTrilhos! Verifiquei o histórico de reversões. O IP de origem foi temporariamente bloqueado e ativei o filtro de semiproteção para impedir edições anônimas no artigo durante a próxima semana. Obrigado pelo patrulhamento!',
        timestamp: '2026-08-25T15:10:00Z',
      },
    ],
  },
  {
    id: 'ticket-102',
    subject: 'Solicitação de Semiproteção para a Página Metrô de São Paulo',
    category: 'protecao_pagina',
    priority: 'normal',
    status: 'em_analise',
    userUid: 'user-carlos',
    userUsername: 'CarlosMobilidade',
    userDisplayName: 'Carlos Eduardo',
    userEmail: 'carlos.mobilidade@sp.gov.br',
    userRole: 'moderador',
    relatedArticleTitle: 'Metrô de São Paulo',
    relatedArticleId: 'art-metro-sp-geral',
    description: 'Devido à grande visibilidade recente e sucessivas edições contendo especulações sobre novas linhas sem fontes oficiais publicadas pela STM, sugiro proteger a edição para usuários com mais de 10 edições comprovadas.',
    evidenceLinks: ['https://wikizero.org/wiki/Metro_de_Sao_Paulo'],
    createdAt: '2026-08-28T09:15:00Z',
    updatedAt: '2026-08-28T10:30:00Z',
    assignedAdmin: 'WazzimaGiygg',
    assignedAdminUid: 'user-wazzima',
    messages: [
      {
        id: 'msg-102-1',
        senderUid: 'user-carlos',
        senderName: 'Carlos Eduardo',
        senderRole: 'moderador',
        isStaff: true,
        message: 'Estamos notando um aumento de edições não referenciadas no artigo principal do Metrô. Seria prudente avaliarmos o nível de proteção.',
        timestamp: '2026-08-28T09:15:00Z',
      },
      {
        id: 'msg-102-2',
        senderUid: 'user-wazzima',
        senderName: 'WazzimaGiygg',
        senderRole: 'admin',
        isStaff: true,
        message: 'Em análise. Estou monitorando os logs de edições das últimas 48 horas para definir se aplicamos semiproteção leve ou apenas adicionamos aviso de política de verificabilidade na página de edição.',
        timestamp: '2026-08-28T10:30:00Z',
      },
    ],
  },
  {
    id: 'ticket-103',
    subject: 'Dúvida Jurídica: Compatibilidade de Licença GNU GPL v3.0 e Creative Commons BY-SA',
    category: 'duvida_politicas',
    priority: 'baixa',
    status: 'respondido',
    userUid: 'user-mariana',
    userUsername: 'MarianaSilva',
    userDisplayName: 'Mariana Silva',
    userEmail: 'mariana.silva@usp.br',
    userRole: 'editor',
    description: 'Gostaria de confirmar se é permitido importar diagramas esquemáticos publicados no repositório Wikimedia Commons sob CC-BY-SA 4.0 para os verbetes de infraestrutura da WikiZero sem conflito de licenciamento.',
    createdAt: '2026-08-27T16:45:00Z',
    updatedAt: '2026-08-27T18:00:00Z',
    assignedAdmin: 'WazzimaGiygg',
    assignedAdminUid: 'user-wazzima',
    resolutionSummary: 'Esclarecido que materiais CC-BY-SA 4.0 são compatíveis desde que haja a devida atribuição de autoria na página de descrição do arquivo.',
    messages: [
      {
        id: 'msg-103-1',
        senderUid: 'user-mariana',
        senderName: 'Mariana Silva',
        senderRole: 'editor',
        isStaff: false,
        message: 'Olá equipe de administração! Estou organizando os mapas vetoriais das linhas de trem metropolitano e gostaria de tirar uma dúvida sobre a importação de mídias CC-BY-SA.',
        timestamp: '2026-08-27T16:45:00Z',
      },
      {
        id: 'msg-103-2',
        senderUid: 'user-wazzima',
        senderName: 'WazzimaGiygg',
        senderRole: 'admin',
        isStaff: true,
        message: 'Olá Mariana! Sim, a WikiZero aceita materiais CC-BY-SA e GNU GPL. Basta incluir na legenda ou no rodapé do artigo a menção ao autor original com o link correspondente para a fonte primária, respeitando os termos de atribuição.',
        timestamp: '2026-08-27T18:00:00Z',
      },
    ],
  },
  {
    id: 'ticket-104',
    subject: 'Bug na Renderização de Infoboxes em Modo Escuro no Safari Mobile',
    category: 'erro_tecnico',
    priority: 'normal',
    status: 'aberto',
    userUid: 'user-geo',
    userUsername: 'GeoBrasil',
    userDisplayName: 'GeoBrasil',
    userEmail: 'geo.brasil@wikizero.org',
    userRole: 'editor',
    description: 'Ao navegar no iPhone com tema escuro ativado, as caixas de informação (Infobox) de estações ferroviárias estão com o contraste da borda superior ligeiramente desalinhado com o container principal.',
    createdAt: '2026-08-29T11:00:00Z',
    updatedAt: '2026-08-29T11:00:00Z',
    messages: [
      {
        id: 'msg-104-1',
        senderUid: 'user-geo',
        senderName: 'GeoBrasil',
        senderRole: 'editor',
        isStaff: false,
        message: 'Relato técnico para os desenvolvedores e admins: verifiquei que em telas menores de 390px, a tag de cabeçalho do infobox precisa de padding-top compensatório no iOS.',
        timestamp: '2026-08-29T11:00:00Z',
      },
    ],
  },
  {
    id: 'ticket-105',
    subject: 'Revisão DPO / LGPD: Solicitação de Anonimização de E-mail de Registro Antigo',
    category: 'lgpd_privacidade',
    priority: 'alta',
    status: 'resolvido',
    userUid: 'user-oldeditor',
    userUsername: 'EditorAnonimo2026',
    userDisplayName: 'Editor Anonimizado',
    userEmail: 'antigo.contato@provedor.com',
    userRole: 'leitor',
    description: 'Solicito a desvinculação do meu endereço de e-mail corporativo dos registros de auditoria antigos em conformidade com o Artigo 18 da LGPD.',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T11:45:00Z',
    closedAt: '2026-08-20T11:45:00Z',
    assignedAdmin: 'WazzimaGiygg',
    assignedAdminUid: 'user-wazzima',
    resolutionSummary: 'Anonimização de identificador e limpeza de cache executadas com sucesso pelo DPO.',
    messages: [
      {
        id: 'msg-105-1',
        senderUid: 'user-oldeditor',
        senderName: 'Editor Anonimizado',
        senderRole: 'leitor',
        isStaff: false,
        message: 'Prezado Encarregado de Dados (DPO), formalizo o pedido de anonimização do meu endereço de e-mail constante no histórico de cadastro.',
        timestamp: '2026-08-20T10:00:00Z',
      },
      {
        id: 'msg-105-2',
        senderUid: 'user-wazzima',
        senderName: 'WazzimaGiygg',
        senderRole: 'admin',
        isStaff: true,
        message: 'Solicitação atendida integralmente com base nas diretrizes de privacidade e LGPD da WikiZero. Os registros foram sanitizados e o ticket foi arquivado com sucesso.',
        timestamp: '2026-08-20T11:45:00Z',
      },
    ],
  },
];

// ========================================================
// CONSELHO DE ARBITRAGEM (ARBCOM) - MEMBROS POR IDIOMA
// ========================================================

export const INITIAL_ARBITRATION_MEMBERS: ArbitrationCommitteeMember[] = [
  // Português (pt / pt-BR)
  {
    id: 'arb-pt-1',
    langCode: 'pt',
    username: 'JurisprudenciaZero',
    displayName: 'Dr. Celso Arbitragem',
    role: 'Presidente do Conselho',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 18,
    bio: 'Editor experiente em mediação de conflitos e direito digital. Mandato eleito por escrutínio público da comunidade lusófona.',
  },
  {
    id: 'arb-pt-2',
    langCode: 'pt',
    username: 'ClioHistorica',
    displayName: 'Clio Histórica',
    role: 'Árbitro Titular',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 14,
    bio: 'Pesquisadora em história da ciência e neutralidade de ponto de vista (NPOV). Especialista em análise de difs e contraditório.',
  },
  {
    id: 'arb-pt-3',
    langCode: 'pt',
    username: 'LexDigitalis',
    displayName: 'Lex Digitalis',
    role: 'Árbitro Titular',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 12,
    bio: 'Foco em conformidade com as regras institucionais e combate ao abuso de prerrogativas administrativas.',
  },
  {
    id: 'arb-pt-4',
    langCode: 'pt',
    username: 'MinervaPaz',
    displayName: 'Minerva Conciliadora',
    role: 'Árbitro Suplente',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 6,
    bio: 'Suplente eleita para casos em que houver suspeição ou impedimento de árbitros titulares.',
  },

  // Português de Portugal (pt-PT)
  {
    id: 'arb-ptpt-1',
    langCode: 'pt-PT',
    username: 'LusitaniaLex',
    displayName: 'Lusitânia Lex',
    role: 'Presidente do Conselho',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 8,
    bio: 'Árbitro da edição portuguesa com foco na preservação das normas linguísticas e deontologia.',
  },

  // English (en)
  {
    id: 'arb-en-1',
    langCode: 'en',
    username: 'JusticeSeeker',
    displayName: 'Hon. Justice Seeker',
    role: 'Presidente do Conselho',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 32,
    bio: 'Chief arbitrator for WikiZero English edition. Focus on civility, conduct enforcement, and sysop accountability.',
  },
  {
    id: 'arb-en-2',
    langCode: 'en',
    username: 'EquitasWiki',
    displayName: 'Equitas',
    role: 'Árbitro Titular',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 24,
    bio: 'Senior editor and arbitrator. Specializes in complex canvassing, 3RR violations, and administrator overreach cases.',
  },
  {
    id: 'arb-en-3',
    langCode: 'en',
    username: 'SolonArbitrator',
    displayName: 'Solon',
    role: 'Árbitro Suplente',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 9,
    bio: 'Alternate member ready to step in when recusal occurs.',
  },

  // Spanish (es)
  {
    id: 'arb-es-1',
    langCode: 'es',
    username: 'TribunalHispano',
    displayName: 'Magistrado Hispano',
    role: 'Presidente do Conselho',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 16,
    bio: 'Presidente del Comité de Arbitraje para la edición en español de WikiZero.',
  },
  {
    id: 'arb-es-2',
    langCode: 'es',
    username: 'JusticiaLibre',
    displayName: 'Justicia Libre',
    role: 'Árbitro Titular',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 11,
    bio: 'Especialista en mediación y resolución pacífica de conflictos editoriales.',
  },

  // French (fr)
  {
    id: 'arb-fr-1',
    langCode: 'fr',
    username: 'ArbitreLumiere',
    displayName: 'Arbitre des Lumières',
    role: 'Presidente do Conselho',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 10,
    bio: 'Président du Comité d’Arbitrage pour l’édition francophone.',
  },

  // German (de)
  {
    id: 'arb-de-1',
    langCode: 'de',
    username: 'SchiedsrichterNord',
    displayName: 'Schiedsgericht Nord',
    role: 'Presidente do Conselho',
    mandateStart: '2026-01-01T00:00:00Z',
    mandateEnd: '2026-12-31T23:59:59Z',
    status: 'ativo',
    casesJudged: 12,
    bio: 'Vorsitzender des Schiedsgerichts der WikiZero (de).',
  },
];

// ========================================================
// PROCESSOS E CASOS DE ARBITRAGEM (AÇÕES DE USERS, MODS E ADMINS)
// ========================================================

export const INITIAL_ARBITRATION_CASES: ArbitrationCase[] = [
  // 1. CASO CONTRA AÇÃO DE ADMINISTRADOR (Português)
  {
    id: 'arb-case-101',
    caseNumber: 'ARB-PT-2026-001',
    langCode: 'pt',
    title: 'Apelação e Julgamento de Abuso de Bloqueio em Disputa de Ferrovias',
    targetType: 'administrador',
    targetUsername: 'AdminFerroviarioAntigo',
    targetUserDisplayName: 'Admin Ferroviário',
    targetUserRole: 'admin',
    targetUserUid: 'user-admin-ferro',
    requesterUsername: 'PesquisadorTrilhos',
    requesterDisplayName: 'Prof. Carlos Trilhos',
    requesterUid: 'user-carlostrilhos',
    requesterRole: 'editor',
    category: 'abuso_admin',
    summary: 'O administrador aplicou bloqueio cautelar de 14 dias diretamente ao editor que divergia de sua versão do artigo "Companhia Paulista de Estradas de Ferro", sem advertência prévia, violando a política de não atuação administrativa em conflitos nos quais é parte interessada.',
    evidenceWikitext: `=== Dossiê de Provas Submetido ===
* '''Artigo Afetado:''' [[Companhia Paulista de Estradas de Ferro]] e [[Linha 7 do Trem Metropolitano de São Paulo]].
* '''Fato:''' O administrador editava ativamente a seção de eletrificação e, após receber contraponto com fontes primárias do Acervo Histórico, utilizou as ferramentas de sysop para bloquear o interlocutor com o sumário "Perturbação do projeto".
* '''Violação Apontada:''' Violação da Regra nº 4.2 da WikiZero (Uso de ferramentas administrativas em benefício próprio / Incompatibilidade funcional).`,
    requestedRemedy: 'Anulação imediata do bloqueio, advertência formal ao administrador e imposição de restrição temática (topic ban) de 60 dias ao administrador para ferramentas de bloqueio no namespace principal.',
    defenseStatement: 'Alego que o editor estava inserindo dados sem a devida formatação de predefinição. No entanto, reconheço que deveria ter solicitado a intervenção de um terceiro moderador desinteressado em vez de aplicar a sanção de forma direta.',
    status: 'concluido',
    urgency: 'alta',
    createdAt: '2026-08-10T14:30:00Z',
    updatedAt: '2026-08-18T19:00:00Z',
    closedAt: '2026-08-18T19:00:00Z',
    relatedArticleTitles: ['Companhia Paulista de Estradas de Ferro', 'Linha 7 do Trem Metropolitano'],
    deliberations: [
      {
        id: 'delib-101-1',
        arbitratorName: 'JurisprudenciaZero',
        arbitratorUid: 'arb-pt-1',
        vote: 'sancionar',
        statement: 'A prova é incontestável. O administrador estava diretamente envolvido na disputa de conteúdo. A conduta fere a garantia de imparcialidade dos sysops.',
        recommendedRemedy: 'advertencia_formal',
        timestamp: '2026-08-16T10:00:00Z',
      },
      {
        id: 'delib-101-2',
        arbitratorName: 'ClioHistorica',
        arbitratorUid: 'arb-pt-2',
        vote: 'sancionar',
        statement: 'Voto com o relator. O bloqueio foi abusivo e deve ser removido dos registros com anotação de nulidade.',
        recommendedRemedy: 'ajustamento_conduta',
        timestamp: '2026-08-17T11:20:00Z',
      },
      {
        id: 'delib-101-3',
        arbitratorName: 'LexDigitalis',
        arbitratorUid: 'arb-pt-3',
        vote: 'sancionar',
        statement: 'Acolho o pedido com a determinação de termo de ajustamento de conduta e advertência formal no histórico do administrador.',
        recommendedRemedy: 'advertencia_formal',
        timestamp: '2026-08-18T09:15:00Z',
      },
    ],
    comments: [
      {
        id: 'comm-101-1',
        author: 'WazzimaGiygg',
        authorRole: 'admin',
        authorUid: 'user-wazzima',
        content: 'Como burocrata, endosso a necessidade do Conselho fixar jurisprudência clara: administradores nunca devem agir com ferramentas punitivas em artigos onde estejam ativamente redigindo.',
        timestamp: '2026-08-12T16:00:00Z',
        isTestimony: true,
      },
    ],
    finalRuling: {
      remedyType: 'advertencia_formal',
      rulingSummary: 'O Conselho de Arbitragem, por unanimidade (3x0), julgou procedente a representação. Foi declarada a nulidade absoluta do bloqueio e aplicada Advertência Formal com Termo de Ajustamento de Conduta ao Administrador, ficando suspenso de utilizar a ferramenta de bloqueio em disputas de conteúdo que integre por 90 dias.',
      sanctionDurationDays: 90,
      votesInFavor: 3,
      votesAgainst: 0,
      votesAbstain: 0,
      closedByArbitrator: 'JurisprudenciaZero',
      closedAt: '2026-08-18T19:00:00Z',
      formalFindings: [
        'É vedado a administradores utilizarem ferramentas de sanção quando forem partes em disputa de redação.',
        'O bloqueio aplicado ao editor PesquisadorTrilhos foi sumariamente revogado e excluído de seu prontuário.',
        'Fixa-se diretriz vinculativa de remessa a outro operador independente em caso de desavença editorial.',
      ],
    },
  },

  // 2. CASO CONTRA AÇÃO DE MODERADOR (Português)
  {
    id: 'arb-case-102',
    caseNumber: 'ARB-PT-2026-002',
    langCode: 'pt',
    title: 'Revisão de Exclusão Sumária de Página Sem Abertura de Consenso',
    targetType: 'moderador',
    targetUsername: 'ModExpedito',
    targetUserDisplayName: 'Moderador Expedito',
    targetUserRole: 'moderador',
    targetUserUid: 'user-mod-expedito',
    requesterUsername: 'SociedadeHistoriaSP',
    requesterDisplayName: 'Arquivo Histórico SP',
    requesterUid: 'user-arquivosp',
    requesterRole: 'editor',
    category: 'abuso_moderador',
    summary: 'Representação em face de moderador que eliminou de forma sumária e reiterada a página "Acervo Ferroviário de Campinas", classificando-a como sem relevância, sem conceder prazo regimental de 7 dias para argumentação e debate comunitário.',
    evidenceWikitext: `=== Registro da Ação Contestada ===
* Página eliminada em menos de 15 minutos após a criação sob etiqueta de notoriedade duvidosa.
* O autor possuía fontes de três publicações universitárias indexadas (USP e UNICAMP).
* O moderador ignorou pedidos na sua página de discussão para restauração em rascunho.`,
    requestedRemedy: 'Restauração da página para o namespace Rascunho, abertura de consulta pública e orientação ao moderador.',
    defenseStatement: 'Achei que o artigo tratava-se de divulgação institucional de associação privada, mas concordo que deveria ter aguardado a manifestação.',
    status: 'deliberacao',
    urgency: 'media',
    createdAt: '2026-08-25T11:00:00Z',
    updatedAt: '2026-08-29T16:00:00Z',
    relatedArticleTitles: ['Acervo Ferroviário de Campinas'],
    deliberations: [
      {
        id: 'delib-102-1',
        arbitratorName: 'ClioHistorica',
        arbitratorUid: 'arb-pt-2',
        vote: 'acolher',
        statement: 'A relevância enciclopédica deve ser debatida coletivamente quando houver fontes acadêmicas comprovadas.',
        recommendedRemedy: 'ajustamento_conduta',
        timestamp: '2026-08-28T14:00:00Z',
      },
      {
        id: 'delib-102-2',
        arbitratorName: 'JurisprudenciaZero',
        arbitratorUid: 'arb-pt-1',
        vote: 'acolher',
        statement: 'Restauração autorizada para subpágina de testes do usuário com prazo de 14 dias para expansão das referências.',
        recommendedRemedy: 'ajustamento_conduta',
        timestamp: '2026-08-29T10:30:00Z',
      },
    ],
    comments: [
      {
        id: 'comm-102-1',
        author: 'EduardoMetropolitano',
        authorRole: 'editor',
        content: 'O acervo de Campinas é crucial para a memória da FEPASA e da Mogiana. Apoio a restauração.',
        timestamp: '2026-08-26T18:00:00Z',
      },
    ],
  },

  // 3. CASO CONTRA AÇÃO DE USUÁRIO (Português)
  {
    id: 'arb-case-103',
    caseNumber: 'ARB-PT-2026-003',
    langCode: 'pt',
    title: 'Guerra de Edição Sistemática e Vandalismo Sub-reptício no Artigo Metrô',
    targetType: 'usuario',
    targetUsername: 'VandaloSutil',
    targetUserDisplayName: 'Usuário Conflituoso',
    targetUserRole: 'editor',
    targetUserUid: 'user-vandalo-sutil',
    requesterUsername: 'EduardoMetropolitano',
    requesterDisplayName: 'Eduardo Metrô',
    requesterUid: 'user-eduardometro',
    requesterRole: 'moderador',
    category: 'guerra_edicao_cronica',
    summary: 'O usuário investigado vem realizando sucessivas alterações de dados numéricos (extensão de linhas, frota e anos de inauguração) sem apresentar fontes fiáveis, revertendo repetidamente as correções de outros colaboradores e recusando diálogo na página de discussão.',
    evidenceWikitext: `=== Histórico de Infrações ===
* Mais de 12 reversões (violando amplamente a Regra das Três Reversões - 3RR) em intervalo de 48 horas.
* Mensagens de advertência na página de discussão do usuário ignoradas com sumários hostis.`,
    requestedRemedy: 'Bloqueio progressivo de edição de 30 dias e restrição temática no domínio Transporte.',
    defenseStatement: 'Apenas estava atualizando os dados com base na minha vivência diária nas estações.',
    status: 'em_instrucao',
    urgency: 'alta',
    createdAt: '2026-08-28T09:00:00Z',
    updatedAt: '2026-08-30T15:00:00Z',
    relatedArticleTitles: ['Metrô de São Paulo', 'Linha 1 do Metrô de São Paulo'],
    deliberations: [],
    comments: [
      {
        id: 'comm-103-1',
        author: 'ClioHistorica',
        authorRole: 'moderador',
        content: 'Fase de instrução aberta. Solicita-se que o editor comprove as fontes documentais no prazo regimental de 72 horas.',
        timestamp: '2026-08-29T08:00:00Z',
        isTestimony: true,
      },
    ],
  },

  // 4. CASO CONTRA AÇÃO DE ADMINISTRADOR (English - en)
  {
    id: 'arb-case-201',
    caseNumber: 'ARB-EN-2026-001',
    langCode: 'en',
    title: 'Appeal on Unilateral Protection of Climate Change Series by Sysop',
    targetType: 'administrador',
    targetUsername: 'GlobalSysopX',
    targetUserDisplayName: 'Global Sysop X',
    targetUserRole: 'admin',
    targetUserUid: 'user-sysop-x',
    requesterUsername: 'EcoScientist2026',
    requesterDisplayName: 'Dr. Sarah Mitchell',
    requesterUid: 'user-sarah-m',
    requesterRole: 'editor',
    category: 'abuso_admin',
    summary: 'The administrator placed indefinite full-protection on 4 core articles during an active peer-review discussion, effectively freezing the pages on their preferred grammatical style without community consensus.',
    evidenceWikitext: `=== Evidence Summary ===
* 4 articles protected indefinitely with reason "Ongoing dispute".
* Sysop participated actively in the talk page debate before locking the articles.
* Refused request for mediator unprotection.`,
    requestedRemedy: 'Downgrade to semi-protection, require consensus for major structural changes, and issue formal guidance to the administrator.',
    defenseStatement: 'The protection was done in good faith to halt edit warring during peak traffic hours.',
    status: 'concluido',
    urgency: 'alta',
    createdAt: '2026-08-05T12:00:00Z',
    updatedAt: '2026-08-14T17:00:00Z',
    closedAt: '2026-08-14T17:00:00Z',
    deliberations: [
      {
        id: 'delib-201-1',
        arbitratorName: 'JusticeSeeker',
        arbitratorUid: 'arb-en-1',
        vote: 'sancionar',
        statement: 'Full protection must not be used as an editorial weapon. The protection must be lifted to standard level.',
        recommendedRemedy: 'ajustamento_conduta',
        timestamp: '2026-08-12T14:00:00Z',
      },
      {
        id: 'delib-201-2',
        arbitratorName: 'EquitasWiki',
        arbitratorUid: 'arb-en-2',
        vote: 'sancionar',
        statement: 'Agreed. A sysop who is an active disputant must never apply page locks.',
        recommendedRemedy: 'advertencia_formal',
        timestamp: '2026-08-13T16:00:00Z',
      },
    ],
    comments: [],
    finalRuling: {
      remedyType: 'ajustamento_conduta',
      rulingSummary: 'The English Arbitration Committee unanimously ordered the reduction of page protection to standard semi-protection, with formal instruction delivered to GlobalSysopX regarding impartiality standards.',
      votesInFavor: 2,
      votesAgainst: 0,
      closedByArbitrator: 'JusticeSeeker',
      closedAt: '2026-08-14T17:00:00Z',
      formalFindings: [
        'Protection tools must remain neutral and objective.',
        'Involved administrators must defer protection actions to uninvolved sysops.',
      ],
    },
  },

  // 5. CASO CONTRA AÇÃO DE MODERADOR (Spanish - es)
  {
    id: 'arb-case-301',
    caseNumber: 'ARB-ES-2026-001',
    langCode: 'es',
    title: 'Revisión de Sanción Desproporcionada por Conflicto en Artículo de Historia',
    targetType: 'moderador',
    targetUsername: 'ModCastilla',
    targetUserDisplayName: 'Moderador Castilla',
    targetUserRole: 'moderador',
    targetUserUid: 'user-mod-castilla',
    requesterUsername: 'HistoriadorMadrid',
    requesterDisplayName: 'Alfonso Historia',
    requesterUid: 'user-alfonso-h',
    requesterRole: 'editor',
    category: 'abuso_moderador',
    summary: 'El moderador impuso una suspensión de 30 días a un editor veterano tras un desacuerdo en torno a la bibliografía citada en el artículo de la Guerra Civil, catalogándolo erróneamente como vandalismo intencionado.',
    evidenceWikitext: `=== Argumentación ===
* El editor aportó fuentes académicas contrastadas del CSIC.
* La calificación de "vandalismo" fue desproporcionada y vulneró el principio de presunción de buena fe.`,
    requestedRemedy: 'Revocación inmediata de la sanción y anulación del aviso en la ficha del usuario.',
    defenseStatement: 'Consideré que las ediciones no seguían el formato estándar, pero acepto que la calificación de vandalismo no fue acertada.',
    status: 'concluido',
    urgency: 'media',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-22T12:00:00Z',
    closedAt: '2026-08-22T12:00:00Z',
    deliberations: [
      {
        id: 'delib-301-1',
        arbitratorName: 'TribunalHispano',
        arbitratorUid: 'arb-es-1',
        vote: 'absolver',
        statement: 'El editor actuó con buena fe y rigor bibliográfico. La sanción queda anulada de pleno derecho.',
        recommendedRemedy: 'absolvicao',
        timestamp: '2026-08-20T11:00:00Z',
      },
      {
        id: 'delib-301-2',
        arbitratorName: 'JusticiaLibre',
        arbitratorUid: 'arb-es-2',
        vote: 'absolver',
        statement: 'Concordancia absoluta. Se restituyen todos los privilegios del editor de manera inmediata.',
        recommendedRemedy: 'absolvicao',
        timestamp: '2026-08-21T15:30:00Z',
      },
    ],
    comments: [],
    finalRuling: {
      remedyType: 'absolvicao',
      rulingSummary: 'El Comité Hispano revocó por unanimidad la sanción impuesta por el moderador, restableciendo el expediente limpio del editor.',
      votesInFavor: 2,
      votesAgainst: 0,
      closedByArbitrator: 'TribunalHispano',
      closedAt: '2026-08-22T12:00:00Z',
      formalFindings: [
        'Las disputas sobre bibliografía deben canalizarse mediante discusión y no mediante bloqueos sumarios.',
        'Se reafirma la vigencia plena de la Presunción de Buena Fe en la WikiZero.',
      ],
    },
  },
];


