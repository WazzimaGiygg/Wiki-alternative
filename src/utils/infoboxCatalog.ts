import { UserProfile, UserRole } from '../types';

export type InfoboxCategory =
  | 'Todos'
  | 'Usuário & Comunidade'
  | 'Enciclopédia & Geografia'
  | 'Tecnologia & Software'
  | 'Cultura & Mídia'
  | 'Ciência & Academia'
  | 'Organizações & Eventos';

export interface InfoboxTemplatePreset {
  id: string;
  templateName: string;
  label: string;
  category: Exclude<InfoboxCategory, 'Todos'>;
  description: string;
  defaultColor: string;
  buildSnippet: (title?: string) => string;
}

export interface InfoboxVariableDoc {
  name: string;
  aliases: string;
  example: string;
  description: string;
}

export const INFOBOX_THEME_COLORS: Record<
  string,
  { headerClass: string; barClass: string }
> = {
  azul: {
    headerClass: 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white',
    barClass: 'bg-blue-600',
  },
  indigo: {
    headerClass: 'bg-gradient-to-r from-indigo-800 to-indigo-600 text-white',
    barClass: 'bg-indigo-600',
  },
  esmeralda: {
    headerClass: 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white',
    barClass: 'bg-emerald-600',
  },
  verde: {
    headerClass: 'bg-gradient-to-r from-green-700 to-green-600 text-white',
    barClass: 'bg-green-600',
  },
  ambar: {
    headerClass: 'bg-gradient-to-r from-amber-700 to-amber-600 text-white',
    barClass: 'bg-amber-600',
  },
  roxo: {
    headerClass: 'bg-gradient-to-r from-purple-700 to-violet-600 text-white',
    barClass: 'bg-purple-600',
  },
  vermelho: {
    headerClass: 'bg-gradient-to-r from-red-700 to-rose-600 text-white',
    barClass: 'bg-red-600',
  },
  ciano: {
    headerClass: 'bg-gradient-to-r from-cyan-700 to-sky-600 text-white',
    barClass: 'bg-cyan-600',
  },
  teal: {
    headerClass: 'bg-gradient-to-r from-teal-700 to-teal-600 text-white',
    barClass: 'bg-teal-600',
  },
  rosa: {
    headerClass: 'bg-gradient-to-r from-pink-700 to-rose-600 text-white',
    barClass: 'bg-pink-600',
  },
  ardosia: {
    headerClass: 'bg-gradient-to-r from-slate-800 to-slate-700 text-white',
    barClass: 'bg-slate-700',
  },
};

export const INFOBOX_VARIABLES_REFERENCE: InfoboxVariableDoc[] = [
  {
    name: 'Nome',
    aliases: 'Titulo, Title, Name',
    example: '| Nome = Nome da Entidade',
    description: 'Título principal exibido no cabeçalho colorido do infobox.',
  },
  {
    name: 'Subtítulo',
    aliases: 'Subtitle, Categoria_Topo',
    example: '| Subtítulo = Conta Oficial · WikiWorldWeb',
    description: 'Linha secundária abaixo do título principal no cabeçalho.',
  },
  {
    name: 'Cor',
    aliases: 'Tema, Cor_Cabecalho, Color',
    example: '| Cor = esmeralda',
    description:
      'Define o esquema de cor do cabeçalho e barras: azul, indigo, esmeralda, verde, ambar, roxo, vermelho, ciano, teal, rosa ou ardosia.',
  },
  {
    name: 'Ícone',
    aliases: 'Icone, Icon, Emblema',
    example: '| Ícone = 🌐',
    description: 'Exibe um símbolo ou emblema curto ao lado do título do cabeçalho.',
  },
  {
    name: 'Imagem',
    aliases: 'Image, Foto, Avatar, Capa, Logo, Bandeira',
    example: '| Imagem = /logo.png  (ou Arquivo:Foto.png)',
    description: 'Exibe uma imagem centralizada no topo do infobox. Aceita URLs seguras e nomes de arquivos enviados à Wiki.',
  },
  {
    name: 'Imagem_Forma',
    aliases: 'Avatar_Forma, Forma_Imagem',
    example: '| Imagem_Forma = circulo',
    description: 'Define o recorte da imagem: padrao (retangular) ou circulo (ideal para avatares de usuário).',
  },
  {
    name: 'Imagem_Largura',
    aliases: 'Tamanho_Imagem, Image_Size',
    example: '| Imagem_Largura = 160px',
    description: 'Controla a largura máxima da imagem em pixels (entre 64px e 320px).',
  },
  {
    name: 'Legenda',
    aliases: 'Caption, Imagem_Legenda',
    example: '| Legenda = Logotipo oficial do projeto',
    description: 'Texto descritivo em itálico exibido logo abaixo da imagem.',
  },
  {
    name: 'Alinhamento',
    aliases: 'Align, Posicao',
    example: '| Alinhamento = direita  (esquerda | centro)',
    description: 'Controla o posicionamento do infobox em relação ao texto do verbete.',
  },
  {
    name: 'Largura',
    aliases: 'Width',
    example: '| Largura = padrao  (compacto | largo | 340px)',
    description: 'Ajusta a largura da caixa lateral (compacto = 260px, padrão = 320px, largo = 384px).',
  },
  {
    name: 'Seção1 ... SeçãoN',
    aliases: 'Secao1, Header1, Subsecao1',
    example: '| Seção1 = Identificação da Conta',
    description: 'Cria uma barra divisória de seção para agrupar campos relacionados dentro da tabela.',
  },
  {
    name: 'Status',
    aliases: 'Estado, Estado_Conta',
    example: '| Status = Ativo',
    description: 'Destaca o estado atual (Ativo, Verificado, Em desenvolvimento, Arquivado, Suspenso) com rótulo claro.',
  },
  {
    name: 'Progresso',
    aliases: 'Porcentagem, Completude',
    example: '| Progresso = 85%',
    description: 'Renderiza uma barra de progresso limpa com valor numérico tabular (0% a 100%).',
  },
  {
    name: 'Site',
    aliases: 'Website, Portal, Repositorio',
    example: '| Site = https://wikiworldweb.org',
    description: 'Formata automaticamente links externos seguros com indicador de abertura em nova aba.',
  },
  {
    name: 'Coordenadas',
    aliases: 'Coord',
    example: '| Coordenadas = 23°33′S 46°38′W',
    description: 'Formata coordenadas geográficas em fonte monoespaçada tabular.',
  },
  {
    name: 'Tags',
    aliases: 'Idiomas, Areas_Interesse, Palavras_Chave',
    example: '| Idiomas = Português, Inglês, Espanhol',
    description: 'Separa automaticamente itens separados por vírgula com divisores tipográficos limpos (·).',
  },
  {
    name: 'Avaliação',
    aliases: 'Nota, Rating, Pontuacao',
    example: '| Avaliação = 4.8/5  (ou 9/10)',
    description: 'Exibe a nota em dígitos tabulares acompanhada de uma barra de pontuação proporcional.',
  },
  {
    name: 'Selo',
    aliases: 'Destaque_Topo, Etiqueta',
    example: '| Selo = Verificado · Revisão Comunitária',
    description: 'Exibe uma faixa discreta de identificação logo abaixo do cabeçalho principal.',
  },
  {
    name: 'Estilo',
    aliases: 'Borda, Variante',
    example: '| Estilo = destaque  (padrao | minimalista | destaque)',
    description: 'Alterna o acabamento visual da moldura do infobox (padrão, borda destacada ou minimalista).',
  },
  {
    name: 'Compacto',
    aliases: 'Densidade',
    example: '| Compacto = sim',
    description: 'Reduz o espaçamento vertical das linhas para fichas extensas com muitas variáveis.',
  },
  {
    name: 'Fonte',
    aliases: 'Citar, Referencia_Ficha',
    example: '| Fonte = IBGE (2025)',
    description: 'Adiciona uma linha dedicada de atribuição de fonte verificável acima do rodapé.',
  },
  {
    name: 'Rodapé',
    aliases: 'Rodape, Footer, Notas',
    example: '| Rodapé = Perfil protegido conforme a LGPD',
    description: 'Exibe uma nota de rodapé discreta na base do infobox.',
  },
  {
    name: 'Campos Personalizados',
    aliases: 'Qualquer nome de variável',
    example: '| Fundador = Comunidade Aberta',
    description: 'Qualquer par "| Rótulo = Valor" vira automaticamente uma linha da tabela com suporte a links [[...]], negrito e itálico.',
  },
];

export const INFOBOX_TEMPLATES: InfoboxTemplatePreset[] = [
  {
    id: 'usuario',
    templateName: 'Info/Usuário',
    label: 'Usuário (Perfil)',
    category: 'Usuário & Comunidade',
    description: 'Cartão oficial de identificação para páginas de usuários e editores da WikiWorldWeb.',
    defaultColor: 'azul',
    buildSnippet: (title) => `{{Info/Usuário
| Nome = ${title || 'Seu Pseudônimo'}
| Subtítulo = Conta Oficial · WikiWorldWeb
| Cor = azul
| Ícone = 👤
| Imagem_Forma = circulo
| Seção1 = Identificação da Conta
| Cargo = Editor(a)
| Status = Ativo
| Localização = Brasil
| Membro desde = ${new Date().toLocaleDateString('pt-BR')}
| Seção2 = Colaboração
| Idiomas = Português
| Áreas de interesse = Enciclopédia Livre, Ciência, Tecnologia
| Rodapé = Identificação pública conforme diretrizes LGPD da WikiWorldWeb
}}`,
  },
  {
    id: 'geral',
    templateName: 'Infobox',
    label: 'Infobox Geral',
    category: 'Enciclopédia & Geografia',
    description: 'Modelo versátil para qualquer verbete enciclopédico com seções, cor e rodapé.',
    defaultColor: 'azul',
    buildSnippet: (title) => `{{Infobox
| Nome = ${title || 'Título do Artigo'}
| Subtítulo = Resumo Enciclopédico
| Cor = azul
| Alinhamento = direita
| Largura = padrao
| Imagem = /logo.png
| Legenda = Ilustração representativa do tema
| Seção1 = Dados Principais
| Categoria = Conhecimento Geral
| Origem = Brasil
| Status = Ativo
| Site = https://wikiworldweb.org
| Rodapé = Fonte verificada pela comunidade WikiWorldWeb
}}`,
  },
  {
    id: 'biografia',
    templateName: 'Info/Biografia',
    label: 'Biografia (Figura Pública)',
    category: 'Enciclopédia & Geografia',
    description: 'Ficha biográfica para personalidades históricas ou figuras públicas com fontes verificáveis.',
    defaultColor: 'indigo',
    buildSnippet: (title) => `{{Info/Biografia
| Nome = ${title || 'Nome da Personalidade'}
| Subtítulo = Personalidade Histórica
| Cor = indigo
| Seção1 = Dados Biográficos
| Nascimento = 1879
| Falecimento = 1955
| Nacionalidade = Alemã
| Ocupação = Físico teórico
| Obras notáveis = Teoria da Relatividade
| Prêmios = Prêmio Nobel de Física (1921)
| Rodapé = Apenas figuras históricas ou públicas com fontes verificáveis (LGPD)
}}`,
  },
  {
    id: 'pais',
    templateName: 'Info/País',
    label: 'País / Território',
    category: 'Enciclopédia & Geografia',
    description: 'Dados geopolíticos, capital, idioma oficial, moeda, população e coordenadas.',
    defaultColor: 'esmeralda',
    buildSnippet: (title) => `{{Info/País
| Nome = ${title || 'República Federativa do Brasil'}
| Subtítulo = País da América do Sul
| Cor = esmeralda
| Ícone = 🌍
| Seção1 = Geografia e Governo
| Capital = Brasília
| Idioma oficial = Português
| Governo = República federativa presidencialista
| Coordenadas = 15°47′S 47°52′W
| Seção2 = Indicadores
| Área total = 8.510.417 km²
| População = ~203 milhões
| Moeda = Real (BRL)
| Fuso horário = UTC−5 a UTC−2
}}`,
  },
  {
    id: 'cidade',
    templateName: 'Info/Cidade',
    label: 'Cidade / Município',
    category: 'Enciclopédia & Geografia',
    description: 'Ficha municipal com estado, fundação, população, área, altitude e coordenadas.',
    defaultColor: 'teal',
    buildSnippet: (title) => `{{Info/Cidade
| Nome = ${title || 'São Paulo'}
| Subtítulo = Município Brasileiro
| Cor = teal
| Seção1 = Localização
| País = Brasil
| Estado = São Paulo
| Coordenadas = 23°33′S 46°38′W
| Fundação = 25 de janeiro de 1554
| Seção2 = Demografia
| População = 11.451.999 hab.
| Área = 1.521,2 km²
| Altitude = 760 m
}}`,
  },
  {
    id: 'software',
    templateName: 'Info/Software',
    label: 'Software / Tecnologia',
    category: 'Tecnologia & Software',
    description: 'Ficha técnica para aplicativos, frameworks, linguagens e projetos open source.',
    defaultColor: 'ciano',
    buildSnippet: (title) => `{{Info/Software
| Nome = ${title || 'WikiWorldWeb'}
| Subtítulo = Plataforma Enciclopédica Aberta
| Cor = ciano
| Ícone = 💻
| Seção1 = Especificações
| Desenvolvedor = Comunidade WikiWorldWeb
| Lançamento = 2026
| Versão estável = 4.1
| Linguagem = TypeScript, React
| Licença = GNU GPL v3.0
| Status = Ativo
| Site = https://wikiworldweb.org
}}`,
  },
  {
    id: 'jogo',
    templateName: 'Info/Jogo',
    label: 'Jogo Eletrônico',
    category: 'Cultura & Mídia',
    description: 'Ficha para videogames com desenvolvedora, plataformas, gênero, motor gráfico e ano.',
    defaultColor: 'roxo',
    buildSnippet: (title) => `{{Info/Jogo
| Nome = ${title || 'Nome do Jogo'}
| Subtítulo = Jogo Eletrônico
| Cor = roxo
| Seção1 = Produção
| Desenvolvedora = Estúdio Independente
| Publicadora = Publicadora Oficial
| Lançamento = 2025
| Gênero = Aventura, Sandbox
| Plataformas = PC, Consoles, Mobile
| Modos de jogo = Um jogador, Multijogador
| Motor gráfico = Engine 3D
}}`,
  },
  {
    id: 'filme',
    templateName: 'Info/Filme',
    label: 'Filme / Série',
    category: 'Cultura & Mídia',
    description: 'Ficha cinematográfica com direção, roteiro, duração, gênero, país e ano de estreia.',
    defaultColor: 'ardosia',
    buildSnippet: (title) => `{{Info/Filme
| Nome = ${title || 'Título do Filme'}
| Subtítulo = Longa-metragem
| Cor = ardosia
| Seção1 = Ficha Técnica
| Direção = Nome da Direção
| Roteiro = Nome do Roteiro
| Gênero = Ficção científica, Drama
| Duração = 128 min
| País = Brasil
| Idioma = Português
| Lançamento = 2025
}}`,
  },
  {
    id: 'livro',
    templateName: 'Info/Livro',
    label: 'Livro / Obra Literária',
    category: 'Cultura & Mídia',
    description: 'Ficha bibliográfica com autor, editora, ano, páginas, gênero, idioma e ISBN.',
    defaultColor: 'ambar',
    buildSnippet: (title) => `{{Info/Livro
| Nome = ${title || 'Título da Obra'}
| Subtítulo = Obra Literária / Referência
| Cor = ambar
| Seção1 = Dados Editoriais
| Autor = Nome do Autor
| Editora = Editora Aberta
| Lançamento = 2024
| Idioma = Português
| Páginas = 312
| Gênero = Ensaio, Divulgação Científica
| ISBN = 978-0-00-000000-0
}}`,
  },
  {
    id: 'musica',
    templateName: 'Info/Música',
    label: 'Álbum / Música',
    category: 'Cultura & Mídia',
    description: 'Ficha musical com artista, álbum, gênero, gravadora, duração e data de lançamento.',
    defaultColor: 'rosa',
    buildSnippet: (title) => `{{Info/Música
| Nome = ${title || 'Nome do Álbum ou Faixa'}
| Subtítulo = Álbum de Estúdio
| Cor = rosa
| Seção1 = Informações Musicais
| Artista = Nome do Artista
| Lançamento = 2024
| Gênero = MPB, Rock Alternativo
| Duração = 42:18
| Gravadora = Selo Independente
| Produtor = Produção Musical
}}`,
  },
  {
    id: 'empresa',
    templateName: 'Info/Empresa',
    label: 'Empresa / Organização',
    category: 'Organizações & Eventos',
    description: 'Ficha institucional para empresas, fundações, cooperativas e entidades sem fins lucrativos.',
    defaultColor: 'azul',
    buildSnippet: (title) => `{{Info/Empresa
| Nome = ${title || 'Nome da Organização'}
| Subtítulo = Organização / Instituição
| Cor = azul
| Seção1 = Dados Institucionais
| Tipo = Organização aberta
| Fundação = 2024
| Sede = São Paulo, Brasil
| Setor = Tecnologia e Educação
| Status = Ativo
| Site = https://wikiworldweb.org
}}`,
  },
  {
    id: 'evento',
    templateName: 'Info/Evento',
    label: 'Evento Histórico',
    category: 'Organizações & Eventos',
    description: 'Linha do tempo de acontecimentos históricos, científicos ou conferências.',
    defaultColor: 'vermelho',
    buildSnippet: (title) => `{{Info/Evento
| Nome = ${title || 'Nome do Evento'}
| Subtítulo = Marco Histórico
| Cor = vermelho
| Seção1 = Registro Histórico
| Data = 15 de novembro de 1889
| Local = Rio de Janeiro, Brasil
| Causas = Contexto político e institucional
| Consequências = Mudança de regime constitucional
| Participantes = Representantes civis e instituições
}}`,
  },
  {
    id: 'ciencia',
    templateName: 'Info/Ciência',
    label: 'Ciência / Elemento / Espécie',
    category: 'Ciência & Academia',
    description: 'Ficha científica para conceitos, elementos químicos, fenômenos físicos ou taxonomia.',
    defaultColor: 'esmeralda',
    buildSnippet: (title) => `{{Info/Ciência
| Nome = ${title || 'Carbono (C)'}
| Subtítulo = Elemento Químico · Ciência
| Cor = esmeralda
| Seção1 = Propriedades
| Símbolo = C
| Número atômico = 6
| Massa atômica = 12,011 u
| Estado físico = Sólido
| Descoberta = Antiguidade
| Tags = Química Orgânica, Não-metal, Tabela Periódica
}}`,
  },
  {
    id: 'transporte',
    templateName: 'Info/Transporte',
    label: 'Transporte / Linha / Estação',
    category: 'Organizações & Eventos',
    description: 'Ficha para linhas ferroviárias, metrôs, estações, rodovias e sistemas de mobilidade.',
    defaultColor: 'indigo',
    buildSnippet: (title) => `{{Info/Transporte
| Nome = ${title || 'Linha 1-Azul'}
| Subtítulo = Sistema Metroviário
| Cor = indigo
| Seção1 = Operação
| Cidade = São Paulo
| Inauguração = 14 de setembro de 1974
| Estações = 23
| Extensão = 20,2 km
| Status = Ativo
| Progresso = 100%
}}`,
  },
  {
    id: 'animal',
    templateName: 'Info/Animal',
    label: 'Animal / Taxonomia',
    category: 'Ciência & Academia',
    description: 'Ficha taxonômica completa com classificação biológica, habitat e estado de conservação.',
    defaultColor: 'verde',
    buildSnippet: (title) => `{{Info/Animal
| Nome = ${title || 'Onça-pintada'}
| Subtítulo = Panthera onca · Taxonomia
| Cor = verde
| Selo = Classificação Biológica
| Seção1 = Taxonomia
| Reino = Animalia
| Filo = Chordata
| Classe = Mammalia
| Ordem = Carnivora
| Família = Felidae
| Gênero = Panthera
| Seção2 = Ecologia
| Habitat = Florestas tropicais e Pantanal
| Conservação = Quase ameaçada (IUCN)
| Fonte = IUCN Red List
}}`,
  },
  {
    id: 'planeta',
    templateName: 'Info/Planeta',
    label: 'Planeta / Astro',
    category: 'Ciência & Academia',
    description: 'Ficha astronômica para planetas, estrelas, luas e exoplanetas com dados orbitais.',
    defaultColor: 'indigo',
    buildSnippet: (title) => `{{Info/Planeta
| Nome = ${title || 'Marte'}
| Subtítulo = Planeta Rochoso · Sistema Solar
| Cor = indigo
| Ícone = 🪐
| Seção1 = Características Orbitais
| Sistema = Sistema Solar
| Período orbital = 687 dias terrestres
| Satélites naturais = 2 (Fobos e Deimos)
| Seção2 = Características Físicas
| Diâmetro equatorial = 6.792 km
| Gravidade superficial = 3,72 m/s²
| Atmosfera = CO₂ (95%), N₂, Ar
| Fonte = NASA Planetary Fact Sheet
}}`,
  },
  {
    id: 'hardware',
    templateName: 'Info/Hardware',
    label: 'Hardware / Dispositivo',
    category: 'Tecnologia & Software',
    description: 'Ficha técnica de computadores, consoles, processadores e dispositivos eletrônicos.',
    defaultColor: 'ardosia',
    buildSnippet: (title) => `{{Info/Hardware
| Nome = ${title || 'Nome do Dispositivo'}
| Subtítulo = Hardware / Eletrônica
| Cor = ardosia
| Seção1 = Especificações Técnicas
| Fabricante = Fabricante Oficial
| Lançamento = 2025
| Processador = Arquitetura 64-bit
| Memória = 16 GB RAM
| Sistema operacional = Linux / Multiplataforma
| Conectividade = USB-C, Wi-Fi 6E, Bluetooth 5.3
| Avaliação = 4.6/5
}}`,
  },
  {
    id: 'personagem',
    templateName: 'Info/Personagem',
    label: 'Personagem Ficcional',
    category: 'Cultura & Mídia',
    description: 'Ficha para personagens de literatura, jogos, cinema, quadrinhos e animações.',
    defaultColor: 'roxo',
    buildSnippet: (title) => `{{Info/Personagem
| Nome = ${title || 'Nome do Personagem'}
| Subtítulo = Personagem Ficcional
| Cor = roxo
| Seção1 = Origem
| Obra = Título da Obra
| Criador = Nome do Criador
| Primeira aparição = Capítulo 1 (2024)
| Seção2 = Perfil
| Afiliação = Grupo ou Facção
| Ocupação = Papel na narrativa
| Habilidades = Estratégia, Investigação
| Status = Ativo
}}`,
  },
  {
    id: 'esporte',
    templateName: 'Info/Esporte',
    label: 'Clube / Esporte',
    category: 'Organizações & Eventos',
    description: 'Ficha esportiva para clubes, seleções, campeonatos ou modalidades olímpicas.',
    defaultColor: 'esmeralda',
    buildSnippet: (title) => `{{Info/Esporte
| Nome = ${title || 'Clube Esportivo'}
| Subtítulo = Modalidade Esportiva
| Cor = esmeralda
| Seção1 = Dados do Clube
| Modalidade = Futebol
| Fundação = 1930
| Sede = São Paulo, Brasil
| Estádio = Arena Principal
| Seção2 = Conquistas
| Principais títulos = Campeonatos Nacionais e Continentais
| Status = Ativo
}}`,
  },
  {
    id: 'universidade',
    templateName: 'Info/Universidade',
    label: 'Universidade / Instituição',
    category: 'Ciência & Academia',
    description: 'Ficha institucional para universidades, faculdades, institutos de pesquisa e escolas.',
    defaultColor: 'azul',
    buildSnippet: (title) => `{{Info/Universidade
| Nome = ${title || 'Universidade Pública'}
| Subtítulo = Instituição de Ensino Superior
| Cor = azul
| Seção1 = Dados Acadêmicos
| Tipo = Pública · Pesquisa e Ensino
| Fundação = 1934
| Localização = Brasil
| Estudantes = ~90.000
| Campi = Campus Central e Unidades Regionais
| Site = https://wikiworldweb.org
| Fonte = Dados Institucionais Públicos
}}`,
  },
  {
    id: 'idioma',
    templateName: 'Info/Idioma',
    label: 'Idioma / Língua',
    category: 'Enciclopédia & Geografia',
    description: 'Ficha linguística com família, número de falantes, sistema de escrita e código ISO.',
    defaultColor: 'teal',
    buildSnippet: (title) => `{{Info/Idioma
| Nome = ${title || 'Língua Portuguesa'}
| Subtítulo = Idioma · Linguística
| Cor = teal
| Seção1 = Classificação
| Família = Indo-europeia (Românica)
| Falantes = ~260 milhões
| Regiões = Brasil, Portugal, PALOP, Timor-Leste
| Sistema de escrita = Alfabeto latino
| Código ISO 639-1 = pt
}}`,
  },
  {
    id: 'alimento',
    templateName: 'Info/Alimento',
    label: 'Alimento / Culinária',
    category: 'Cultura & Mídia',
    description: 'Ficha gastronômica com origem cultural, ingredientes principais, tipo e características.',
    defaultColor: 'ambar',
    buildSnippet: (title) => `{{Info/Alimento
| Nome = ${title || 'Pão de Queijo'}
| Subtítulo = Culinária Tradicional
| Cor = ambar
| Seção1 = Características
| Origem = Minas Gerais, Brasil
| Tipo = Assado / Lanche
| Ingredientes = Polvilho, queijo curado, ovos, leite
| Temperatura = Quente
| Avaliação = 4.9/5
}}`,
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador(a) · Burocrata',
  moderador: 'Moderador(a)',
  editor: 'Editor(a) Verificado(a)',
  leitor: 'Leitor(a) Registrado(a)',
  convidado: 'Visitante',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'ambar',
  moderador: 'indigo',
  editor: 'azul',
  leitor: 'teal',
  convidado: 'ardosia',
};

export function formatUserRoleLabel(role?: UserRole): string {
  if (!role) return 'Editor(a)';
  return ROLE_LABELS[role] || 'Editor(a)';
}

/**
 * Verifica se um texto Wikitexto já contém um bloco de Infobox.
 */
export function hasInfoboxInWikitext(wikitext?: string | null): boolean {
  if (!wikitext) return false;
  return /\{\{\s*(?:infobox(?:\s+[^|}]*)?|info\/[^|}]*|ficha[^|}]*)/i.test(wikitext);
}

/**
 * Gera o bloco Wikitexto padronizado {{Info/Usuário ...}} para identificação de qualquer conta.
 */
export function buildDefaultUserInfoboxWikitext(user: {
  uid: string;
  displayName?: string;
  username?: string;
  role?: UserRole;
  photoURL?: string;
  avatarRemovedByAdmin?: boolean;
  location?: string;
  createdAt?: string;
  isBanned?: boolean;
  editsCount?: number;
  reputationScore?: number;
}): string {
  const displayName = (user.displayName || user.username || 'Editor WikiWorldWeb').trim();
  const username = (user.username || displayName.replace(/\s+/g, '_')).trim();
  const role: UserRole = user.role || 'editor';
  const roleLabel = formatUserRoleLabel(role);
  const themeColor = ROLE_COLORS[role] || 'azul';
  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const statusLabel = user.isBanned ? 'Suspenso' : 'Ativo';
  const location = user.location || 'Brasil';
  const imageLine =
    user.photoURL && !user.avatarRemovedByAdmin
      ? `\n| Imagem = ${user.photoURL}\n| Imagem_Forma = circulo\n| Imagem_Largura = 112px\n| Legenda = Avatar de ${displayName}`
      : '';

  return `{{Info/Usuário
| Nome = ${displayName}
| Subtítulo = Identificação de Usuário · WikiWorldWeb
| Cor = ${themeColor}
| Ícone = 👤${imageLine}
| Seção1 = Identificação da Conta
| Usuário = @${username}
| Cargo = ${roleLabel}
| Status = ${statusLabel}
| Identificador UID = \`${user.uid}\`
| Seção2 = Perfil Comunitário
| Localização = ${location}
| Membro desde = ${createdDate}
| Idiomas = Português
| Áreas de interesse = Conhecimento Livre, Revisão Editorial
| Página Pública = [[User:${user.uid}|Link Permanente]]
| Rodapé = Edite sua página de usuário para personalizar este infobox
}}`;
}

/**
 * Gera a biografia inicial completa de uma nova conta já equipada com {{Info/Usuário}}.
 */
export function buildDefaultUserBioWikitext(user: {
  uid: string;
  displayName?: string;
  username?: string;
  role?: UserRole;
  photoURL?: string;
  avatarRemovedByAdmin?: boolean;
  location?: string;
  createdAt?: string;
  isBanned?: boolean;
}): string {
  const displayName = (user.displayName || user.username || 'Editor WikiWorldWeb').trim();
  const createdDateFormatted = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const infoboxBlock = buildDefaultUserInfoboxWikitext(user);

  return `${infoboxBlock}

= ${displayName} =
Editor(a) e colaborador(a) da enciclopédia livre '''WikiWorldWeb'''.

== Apresentação ==
Esta é a página oficial do(a) usuário(a) '''${displayName}'''.
Conta registrada e disponibilizada publicamente em ${createdDateFormatted}.

== Rastreio & Atividades Comunitárias ==
* '''Status do Usuário:''' ${user.isBanned ? 'Suspenso(a)' : 'Ativo(a)'}
* '''Identificador Único Google/Sistema (UID):''' \`${user.uid}\`
* '''Rastreabilidade:''' Todas as alterações de rastreio, edições e verbetes criados são automaticamente inseridos nesta página de usuário pública.
* '''Link Permanente Público (UID):''' Disponível para consulta por qualquer usuário através do link permanente [[User:${user.uid}]].
* '''Link Alternativo por Nome:''' [[User:${displayName}]].

== Caixas de Usuário ==
{{Userbox|🌐|Colaborador(a) da WikiWorldWeb Enciclopédia Aberta}}
{{Userbox|✏️|Editor(a) com rastreamento ativo de edições}}
{{Userbox|🛡️|Comprometido(a) com a veracidade das informações}}`;
}
