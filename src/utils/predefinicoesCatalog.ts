export type PredefinicaoCategoryId =
  | 'manutencao'
  | 'navegacao'
  | 'citacoes'
  | 'formatacao'
  | 'comunidade';

export interface PredefinicaoParamDoc {
  name: string;
  description: string;
  required?: boolean;
  example?: string;
}

export interface MediaWikiPredefinicao {
  id: string;
  name: string;
  aliases?: string[];
  category: PredefinicaoCategoryId;
  placement: 'block' | 'inline';
  icon: string;
  summary: string;
  snippet: string;
  params: PredefinicaoParamDoc[];
}

export const PREDEFINICAO_CATEGORIES: {
  id: PredefinicaoCategoryId;
  label: string;
  description: string;
}[] = [
  {
    id: 'manutencao',
    label: 'Manutenção & Avisos',
    description: 'Caixas de aviso no topo do artigo (estilo Ambox MediaWiki)',
  },
  {
    id: 'navegacao',
    label: 'Navegação & Hatnotes',
    description: 'Navbox, portais, desambiguação e ligações de topo',
  },
  {
    id: 'citacoes',
    label: 'Citações & Referências',
    description: 'Marcadores de fontes e citações bibliográficas estruturadas',
  },
  {
    id: 'formatacao',
    label: 'Formatação & Layout',
    description: 'Citações destacadas, blocos expansíveis, colunas e notas',
  },
  {
    id: 'comunidade',
    label: 'Comunidade & Perfil',
    description: 'Userboxes e caixas de páginas de usuário',
  },
];

export const MEDIAWIKI_PREDEFINICOES: MediaWikiPredefinicao[] = [
  // ── MANUTENÇÃO & AVISOS (AMBOX) ─────────────────────────────────────────────
  {
    id: 'sem-fontes',
    name: 'Sem-fontes',
    aliases: ['Sem fontes', 'Predefinição:Sem-fontes'],
    category: 'manutencao',
    placement: 'block',
    icon: '📚',
    summary: 'Aviso de topo (Ambox) indicando que o artigo não cita fontes confiáveis.',
    snippet: '{{Sem-fontes|data=Abril de 2025}}',
    params: [
      { name: 'data', description: 'Mês e ano da marcação', example: 'Abril de 2025' },
      { name: 'motivo', description: 'Detalhe opcional sobre o que precisa de fontes' },
    ],
  },
  {
    id: 'mais-fontes',
    name: 'Mais fontes',
    aliases: ['Mais-fontes'],
    category: 'manutencao',
    placement: 'block',
    icon: '🔎',
    summary: 'Solicita fontes adicionais para melhorar a verificabilidade do artigo.',
    snippet: '{{Mais fontes|data=Abril de 2025}}',
    params: [
      { name: 'data', description: 'Mês e ano da marcação', example: 'Abril de 2025' },
      { name: 'motivo', description: 'Seção ou trecho que precisa de referências adicionais' },
    ],
  },
  {
    id: 'em-construcao',
    name: 'Em construção',
    aliases: ['Em edição'],
    category: 'manutencao',
    placement: 'block',
    icon: '🚧',
    summary: 'Indica que o verbete está passando por edição ou expansão ativa.',
    snippet: '{{Em construção}}',
    params: [
      { name: 'motivo', description: 'Observação opcional sobre a reforma em andamento' },
    ],
  },
  {
    id: 'revisao',
    name: 'Revisão',
    aliases: ['Reciclagem'],
    category: 'manutencao',
    placement: 'block',
    icon: '🧹',
    summary: 'Sinaliza que o texto necessita de revisão de estilo, wikificação ou clareza.',
    snippet: '{{Revisão|motivo=Melhorar formatação e verificar ligações internas}}',
    params: [
      { name: 'motivo', description: 'Motivo da solicitação de revisão' },
      { name: 'data', description: 'Data da marcação' },
    ],
  },
  {
    id: 'parcial',
    name: 'Parcial',
    aliases: ['Controverso'],
    category: 'manutencao',
    placement: 'block',
    icon: '⚖️',
    summary: 'Indica que a neutralidade do artigo é contestada e precisa de equilíbrio.',
    snippet: '{{Parcial|motivo=Apresentar diferentes pontos de vista com fontes independentes}}',
    params: [
      { name: 'motivo', description: 'Explicação sobre o ponto de vista questionado' },
      { name: 'data', description: 'Data da marcação' },
    ],
  },
  {
    id: 'desatualizado',
    name: 'Desatualizado',
    category: 'manutencao',
    placement: 'block',
    icon: '🕰️',
    summary: 'Informa que o conteúdo pode conter dados antigos ou superados.',
    snippet: '{{Desatualizado|data=Abril de 2025}}',
    params: [
      { name: 'data', description: 'Data em que a desatualização foi apontada' },
      { name: 'motivo', description: 'Qual informação precisa ser atualizada' },
    ],
  },
  {
    id: 'fusao',
    name: 'Fusão',
    category: 'manutencao',
    placement: 'block',
    icon: '🔀',
    summary: 'Propõe fundir este artigo com outro verbete relacionado.',
    snippet: '{{Fusão|Artigo de Destino}}',
    params: [
      { name: '1 (destino)', description: 'Nome do artigo sugerido para fusão', required: true, example: 'Artigo de Destino' },
    ],
  },
  {
    id: 'evento-atual',
    name: 'Evento atual',
    category: 'manutencao',
    placement: 'block',
    icon: '📰',
    summary: 'Aviso de acontecimento recente ou em curso cujos dados mudam rapidamente.',
    snippet: '{{Evento atual}}',
    params: [
      { name: 'motivo', description: 'Contexto adicional opcional sobre o evento' },
    ],
  },
  {
    id: 'spoiler',
    name: 'Spoiler',
    category: 'manutencao',
    placement: 'block',
    icon: '🎬',
    summary: 'Alerta o leitor sobre revelações importantes do enredo de uma obra.',
    snippet: '{{Spoiler}}',
    params: [],
  },
  {
    id: 'esboco',
    name: 'Esboço',
    aliases: ['Stub'],
    category: 'manutencao',
    placement: 'block',
    icon: '🧩',
    summary: 'Marca o artigo como um esboço curto que pode ser expandido pela comunidade.',
    snippet: '{{Esboço|Tecnologia}}',
    params: [
      { name: '1 (tema)', description: 'Tema ou área do esboço', example: 'Tecnologia' },
    ],
  },
  {
    id: 'ambox',
    name: 'Ambox',
    category: 'manutencao',
    placement: 'block',
    icon: '📦',
    summary: 'Caixa de mensagem personalizável no padrão MediaWiki {{Ambox}}.',
    snippet: '{{Ambox|tipo=aviso|título=Aviso Personalizado|texto=Descreva aqui a orientação editorial para os leitores e editores.}}',
    params: [
      { name: 'tipo', description: 'aviso, conteudo, estilo, noticia, fusao, protecao ou exclusao', example: 'aviso' },
      { name: 'título', description: 'Cabeçalho em destaque da caixa', required: true },
      { name: 'texto', description: 'Corpo da mensagem (aceita wikitexto)', required: true },
      { name: 'data', description: 'Data opcional exibida em destaque discreto' },
    ],
  },

  // ── NAVEGAÇÃO & HATNOTES ────────────────────────────────────────────────────
  {
    id: 'navbox',
    name: 'Navbox',
    aliases: ['Caixa de navegação'],
    category: 'navegacao',
    placement: 'block',
    icon: '🧭',
    summary: 'Caixa de navegação recolhível para agrupar artigos relacionados no rodapé.',
    snippet:
      '{{Navbox\n| título = Tópicos Relacionados\n| grupo1 = Conceitos\n| lista1 = [[Artigo A]] • [[Artigo B]] • [[Artigo C]]\n| grupo2 = História\n| lista2 = [[Origem]] • [[Evolução]]\n| abaixo = Explore mais artigos na WikiWorldWeb\n}}',
    params: [
      { name: 'título', description: 'Título exibido na barra superior da Navbox', required: true },
      { name: 'grupo1..12', description: 'Rótulo lateral de cada linha de navegação' },
      { name: 'lista1..12', description: 'Links internos separados por • ou ·' },
      { name: 'acima / abaixo', description: 'Faixas opcionais de cabeçalho e rodapé' },
    ],
  },
  {
    id: 'artigo-principal',
    name: 'Artigo principal',
    aliases: ['Ver artigo principal', 'Main'],
    category: 'navegacao',
    placement: 'block',
    icon: '📄',
    summary: 'Hatnote no início de uma seção indicando o verbete principal do assunto.',
    snippet: '{{Artigo principal|História da Internet}}',
    params: [
      { name: '1 (artigo)', description: 'Título do artigo principal de destino', required: true },
    ],
  },
  {
    id: 'ver-tambem',
    name: 'Ver também',
    aliases: ['See also'],
    category: 'navegacao',
    placement: 'block',
    icon: '👉',
    summary: 'Hatnote com links diretos para artigos complementares.',
    snippet: '{{Ver também|Protocolo HTTP|World Wide Web}}',
    params: [
      { name: '1, 2, 3...', description: 'Lista de artigos separados por barra vertical |', required: true },
    ],
  },
  {
    id: 'desambiguacao',
    name: 'Desambiguação',
    aliases: ['Desambig'],
    category: 'navegacao',
    placement: 'block',
    icon: '🔀',
    summary: 'Banner identificando uma página que lista diferentes sentidos de um termo.',
    snippet: '{{Desambiguação|Nome do Termo}}',
    params: [
      { name: '1 (termo)', description: 'Termo ambíguo listado na página' },
    ],
  },
  {
    id: 'hatnote',
    name: 'Hatnote',
    aliases: ['Nota de desambiguação'],
    category: 'navegacao',
    placement: 'block',
    icon: '🎩',
    summary: 'Nota discreta em itálico no topo do artigo ou seção para orientar o leitor.',
    snippet: '{{Hatnote|Para outros significados, veja [[Termo (desambiguação)]].}}',
    params: [
      { name: '1 (texto)', description: 'Texto da nota de orientação (aceita [[links]])', required: true },
    ],
  },
  {
    id: 'portal',
    name: 'Portal',
    aliases: ['Portais'],
    category: 'navegacao',
    placement: 'block',
    icon: '🚪',
    summary: 'Caixa de ligação para um ou mais portais temáticos da enciclopédia.',
    snippet: '{{Portal|Tecnologia|Ciência}}',
    params: [
      { name: '1, 2, 3...', description: 'Nomes dos portais separados por |', required: true },
    ],
  },

  // ── CITAÇÕES & REFERÊNCIAS ──────────────────────────────────────────────────
  {
    id: 'carece-de-fontes',
    name: 'Carece de fontes',
    aliases: ['cn'],
    category: 'citacoes',
    placement: 'inline',
    icon: '❓',
    summary: 'Marcador inline [carece de fontes] colocado logo após uma afirmação sem fonte.',
    snippet: '{{Carece de fontes}}',
    params: [],
  },
  {
    id: 'citar-web',
    name: 'Citar web',
    aliases: ['Cite web'],
    category: 'citacoes',
    placement: 'inline',
    icon: '🌐',
    summary: 'Formata uma referência de página da web (ideal dentro de <ref>...</ref>).',
    snippet:
      '<ref>{{Citar web|autor=Sobrenome, Nome|titulo=Título da Página|url=https://exemplo.com|site=Nome do Site|data=2025|acessodata=20 de abril de 2025}}</ref>',
    params: [
      { name: 'titulo', description: 'Título da página citada', required: true },
      { name: 'url', description: 'Endereço completo https://...' },
      { name: 'autor', description: 'Nome do autor ou organização' },
      { name: 'site', description: 'Nome do portal ou website' },
      { name: 'data / acessodata', description: 'Data de publicação e data de acesso' },
    ],
  },
  {
    id: 'citar-livro',
    name: 'Citar livro',
    aliases: ['Cite book'],
    category: 'citacoes',
    placement: 'inline',
    icon: '📖',
    summary: 'Formata referência bibliográfica de livro com autor, editora, ano e ISBN.',
    snippet:
      '<ref>{{Citar livro|autor=Sobrenome, Nome|titulo=Título do Livro|editora=Editora Exemplo|ano=2024|paginas=42-45|isbn=978-85-00000-00-0}}</ref>',
    params: [
      { name: 'titulo', description: 'Título completo da obra', required: true },
      { name: 'autor', description: 'Autor(es) do livro' },
      { name: 'editora', description: 'Nome da editora' },
      { name: 'ano / paginas / isbn', description: 'Metadados bibliográficos' },
    ],
  },
  {
    id: 'citar-jornal',
    name: 'Citar jornal',
    aliases: ['Cite journal'],
    category: 'citacoes',
    placement: 'inline',
    icon: '🗞️',
    summary: 'Formata referência de artigo publicado em jornal ou revista científica.',
    snippet:
      '<ref>{{Citar jornal|autor=Silva, Maria|titulo=Título do Artigo|jornal=Revista Brasileira de Ciência|data=2025|paginas=12-20}}</ref>',
    params: [
      { name: 'titulo', description: 'Título do artigo', required: true },
      { name: 'jornal', description: 'Nome do jornal ou periódico', required: true },
      { name: 'autor / data / paginas', description: 'Dados de autoria e publicação' },
    ],
  },
  {
    id: 'referencias',
    name: 'Referências',
    aliases: ['Reflist'],
    category: 'citacoes',
    placement: 'block',
    icon: '📑',
    summary: 'Insere a lista numerada automática de todas as tags <ref> do artigo.',
    snippet: '== Referências ==\n{{Referências}}',
    params: [],
  },

  // ── FORMATAÇÃO & LAYOUT ─────────────────────────────────────────────────────
  {
    id: 'citacao',
    name: 'Citação',
    aliases: ['Quote', 'Cita'],
    category: 'formatacao',
    placement: 'block',
    icon: '💬',
    summary: 'Exibe uma citação textual destacada com atribuição de autor e obra.',
    snippet: '{{Citação|O conhecimento livre pertence a toda a humanidade.|Autor Exemplo|Obra de Referência}}',
    params: [
      { name: '1 (texto)', description: 'Conteúdo da citação', required: true },
      { name: '2 (autor)', description: 'Autor da frase' },
      { name: '3 (obra)', description: 'Livro, discurso ou fonte' },
    ],
  },
  {
    id: 'oculto',
    name: 'Oculto',
    aliases: ['Collapsible', 'Expandir'],
    category: 'formatacao',
    placement: 'block',
    icon: '📂',
    summary: 'Caixa expansível/recolhível para tabelas longas, provas ou detalhes extras.',
    snippet: '{{Oculto|título=Clique para ver detalhes adicionais|conteúdo=Este conteúdo fica recolhido até o leitor clicar no cabeçalho.}}',
    params: [
      { name: 'título', description: 'Texto exibido na barra clicável', required: true },
      { name: 'conteúdo', description: 'Texto interno (suporta formatação inline e links)', required: true },
    ],
  },
  {
    id: 'colunas',
    name: 'Colunas',
    aliases: ['Columns', 'Div col'],
    category: 'formatacao',
    placement: 'block',
    icon: '🧱',
    summary: 'Distribui itens ou parágrafos curtos em 2 ou 3 colunas responsivas.',
    snippet: '{{Colunas|2|• Primeiro item<br>• Segundo item<br>• Terceiro item<br>• Quarto item}}',
    params: [
      { name: '1 (colunas)', description: 'Número de colunas (2 ou 3)', example: '2' },
      { name: '2 (conteúdo)', description: 'Itens separados por <br> ou linhas', required: true },
    ],
  },
  {
    id: 'nota',
    name: 'Nota',
    aliases: ['Aviso', 'Destaque'],
    category: 'formatacao',
    placement: 'block',
    icon: 'ℹ️',
    summary: 'Caixas de destaque editorial ({{Nota}}, {{Aviso}} e {{Destaque}}).',
    snippet: '{{Nota|Esta informação complementa o conteúdo principal do artigo.}}',
    params: [
      { name: '1 (texto)', description: 'Mensagem exibida na caixa', required: true },
    ],
  },

  // ── COMUNIDADE & PERFIL ─────────────────────────────────────────────────────
  {
    id: 'userbox',
    name: 'Userbox',
    category: 'comunidade',
    placement: 'inline',
    icon: '🪪',
    summary: 'Etiqueta de perfil estilo MediaWiki para páginas de usuário.',
    snippet: '{{Userbox|🌐|Este editor colabora com artigos na \'\'\'WikiWorldWeb\'\'\'.}}',
    params: [
      { name: '1 (ícone)', description: 'Emoji ou sigla curta exibida à esquerda', example: '🌐' },
      { name: '2 (texto)', description: 'Frase descritiva do usuário', required: true },
    ],
  },
];
