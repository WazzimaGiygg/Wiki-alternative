import { WikiArticle, WikiPage, NotificationItem } from '../types';

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
