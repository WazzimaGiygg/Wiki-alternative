import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignora se não suportado na versão
}
import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of GoogleGenAI client to avoid crashes if GEMINI_API_KEY is not yet set
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('A chave GEMINI_API_KEY não foi encontrada nas variáveis de ambiente.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Fallback resiliente para garantir disponibilidade contra indisponibilidade ou picos temporários
async function generateWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  params: {
    contents: any;
    config?: any;
  }
) {
  // Modelo estável e de resposta ultra-rápida (2s) no Google AI Studio
  const requested = primaryModel || 'gemini-2.5-flash';
  // Sanitiza modelos descontinuados que retornam 404 (como gemini-2.5-flash-lite ou pro)
  const safePrimary = (requested.includes('lite') || requested.includes('pro'))
    ? 'gemini-2.5-flash'
    : requested;

  const modelsToTry = [
    safePrimary,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastErr: any = null;
  for (const modelName of modelsToTry) {
    try {
      // Timeout seguro de 14s por modelo para não travar a experiência do usuário
      const response = await Promise.race([
        ai.models.generateContent({
          ...params,
          model: modelName,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tempo limite excedido ao comunicar com ${modelName}`)), 14000)
        ),
      ]);
      return { response: response as any, usedModel: modelName };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Tentativa com modelo ${modelName} falhou:`, err?.message || err);
      lastErr = err;
    }
  }
  throw lastErr;
}

// -------------------------------------------------------------
// API Routes: Gemini Chatbot (Google AI Studio)
// -------------------------------------------------------------

// 1. Status do Chatbot Gemini
app.get('/api/gemini/status', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    defaultModel: 'gemini-2.5-flash',
    appletId: '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
    provider: 'Google AI Studio & Gemini API',
  });
});

// 2. Chatbot Geral & Assistente de Criação de Conteúdo com Identidade de Usuário, Imagens e Oferta de Planos
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      context = {},
      chatbotId = '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      customSystemInstruction,
      model = 'gemini-2.5-flash',
      image = null,
      userId = null,
      userEmail = null,
      userDisplayName = null,
      userRole = 'visitante',
      isGuest = false,
      isPremium = false,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem obrigatória.' });
    }

    const ai = getGemini();

    // Monta a instrução de sistema adaptada para a WikiZero, AI Studio e identidade do usuário
    let systemInstruction = `Você é o Chatbot Assistente Oficial da WikiZero, alimentado pelo Google AI Studio (Chatbot ID: "${chatbotId}").
Sua principal função é auxiliar leitores, redatores e administradores na enciclopédia WikiZero em:
1. Criação e estruturação de coleções de artigos (páginas WikiPage com título, UID slug, descrição, categoria, emoji de ícone e tags).
2. Criação, expansão, revisão e redação de artigos enciclopédicos completos usando formatação sintática MediaWiki / Wikitext.
3. Fornecer explicações neutras, verificáveis, com tom enciclopédico de alta qualidade, sem alucinações.
4. Análise visual de documentos, mapas, manuscritos, infográficos e imagens enviadas pelo usuário para redação de verbetes.

Diretrizes de Formatação de Wikitext para WikiZero:
- Títulos de seções: "= Título Principal =", "== Seção Principal ==", "=== Subseção ===", "==== Tópico ====".
- Negrito: '''texto''', Itálico: ''texto''.
- Links internos da wiki: [[Nome do Artigo]] ou [[Nome do Artigo|Texto Visível]].
- Listas: * para marcadores não ordenados, # para listas numeradas.
- Caixas e destaques: use blocos limpos.
- Citações e referências: <ref>Fonte confiável</ref>.
- Seja cordial, objetivo e ofereça exemplos prontos para copiar e colar no editor.`;

    // DIRETRIZ CRÍTICA DE IDENTIDADE E AUTENTICAÇÃO DO USUÁRIO
    if (userId && !isGuest) {
      systemInstruction += `\n\n[SESSÃO AUTENTICADA - USUÁRIO LOGADO]:
- Identificador do Usuário (ID): "${userId}"
- Nome / Exibição: "${userDisplayName || 'Usuário WikiZero'}"
- E-mail: "${userEmail || 'não especificado'}"
- Papel / Função na WikiZero: "${userRole}"
- Status da Assinatura: ${isPremium ? '💎 GEMINI PREMIUM (Acesso Ilimitado a Chats, Visão Computacional e Gemini Notebook)' : 'PLANO GRATUITO (Sujeito a limites diários de uso)'}

INSTRUÇÃO DE CONDUTA PARA USUÁRIO LOGADO:
Ao fazer qualquer consulta ou resposta, reconheça o usuário pelo seu ID ("${userId}") e nome quando contextualizar suas contribuições. Mantenha continuidade com o trabalho enciclopédico dele, vincule seus rascunhos à sua autoria e responda como seu copiloto pessoal de pesquisa na WikiZero.`;
    } else {
      systemInstruction += `\n\n[SESSÃO NÃO AUTENTICADA - MODO CONVIDADO / DESLOGADO]:
O usuário NÃO está conectado na WikiZero (opera em modo visitante/anônimo sem ID de usuário permanente).

INSTRUÇÃO DE CONDUTA PARA MODO NÃO LOGADO:
Aja exatamente como o Gemini opera quando um usuário não está logado na sua conta:
1. Responda às consultas e perguntas enciclopédicas com presteza e neutralidade.
2. Esteja ciente de que, por não estar logado, ele opera com cotas reduzidas de mensagens e rascunhos locais transitórios.
3. Lembre-o amigavelmente de que ele pode fazer login ou criar sua conta na WikiZero para obter seu ID permanente, ter maior cota de chats, salvar artigos na nuvem e desbloquear o Gemini Notebook.`;
    }

    // AUTORIZAÇÃO EXPLÍCITA PARA OFERECER O PLANO PAGO (GEMINI PREMIUM)
    systemInstruction += `\n\n[AUTORIZAÇÃO DE OFERTA DE PLANO PAGO]:
Você está EXPRESSAMENTE AUTORIZADO a oferecer o **Plano Gemini Premium** da WikiZero nas seguintes situações:
1. Caso o usuário pergunte sobre planos, limites ou como ter acesso ilimitado.
2. Caso o usuário mencione limite de mensagens, restrição de envio de imagens ou uso do Gemini Notebook.
3. Caso queira transcrever múltiplos documentos visuais ou gerar artigos enciclopédicos complexos em lote.
Ao oferecer o plano, apresente seus diferenciais de forma clara e amigável:
• Chats enciclopédicos ilimitados 24/7 sem restrições diárias
• Envio ilimitado de imagens com análise visual profunda
• Gemini Notebook completo integrado para compilar fontes e inserir artigos no WikiZero com 1 clique
• Prioridade nos modelos Gemini de última geração
• Selo de destaque 'Gemini Pro' no perfil
Convide o usuário a assinar ou ativar o Gemini Premium diretamente pelo botão de Upgrade da WikiZero.`;

    if (customSystemInstruction) {
      systemInstruction += `\n\nInstruções personalizadas adicionais do Administrador:\n${customSystemInstruction}`;
    }

    // Contexto dinâmico de onde o usuário está chamando
    let dynamicContext = '';
    if (context.mode === 'collection') {
      dynamicContext = `\n[CONTEXTO ATUAL]: O usuário está na tela de CRIAÇÃO DE COLEÇÃO (WikiPage). Se ele solicitar uma nova coleção, sugira a estrutura completa com Título, UID (slug em snake_case), Descrição curta, Categoria recomendada, Ícone Emoji e Lista de Tags separadas por vírgula.`;
      if (context.currentCollection) {
        dynamicContext += `\nDados já preenchidos: ${JSON.stringify(context.currentCollection)}`;
      }
    } else if (context.mode === 'article') {
      dynamicContext = `\n[CONTEXTO ATUAL]: O usuário está no EDITOR WIKITEXTO da WikiZero redigindo um artigo.
Título atual: "${context.currentArticle?.titulo || 'Novo Artigo'}"
Categoria: "${context.currentArticle?.categoria || 'Geral'}"
Coleção pertencente: "${context.currentArticle?.pageUid || 'Geral'}"
Quando o usuário pedir texto, seções ou um artigo completo, forneça sempre a sintaxe Wikitext limpa, com boa divisão de seções e infobox se aplicável.`;
    }

    // Converte o histórico no formato esperado pelo Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    // Adiciona o histórico recente (limite de 8 mensagens para manter agilidade)
    const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'model') {
        const parts: any[] = [{ text: msg.content }];
        if (msg.imageUrl && msg.imageUrl.startsWith('data:')) {
          const mime = msg.imageMimeType || 'image/jpeg';
          const base64Data = msg.imageUrl.includes(';base64,') ? msg.imageUrl.split(';base64,')[1] : msg.imageUrl;
          parts.push({
            inlineData: {
              mimeType: mime,
              data: base64Data,
            },
          });
        }
        contents.push({
          role: msg.role,
          parts,
        });
      }
    }

    // Mensagem atual com o contexto e imagem multimodal opcional
    const currentParts: any[] = [{ text: message + (dynamicContext ? `\n\n${dynamicContext}` : '') }];

    if (image && image.data) {
      const mime = image.mimeType || 'image/jpeg';
      const base64Data = image.data.includes(';base64,') ? image.data.split(';base64,')[1] : image.data;
      currentParts.push({
        inlineData: {
          mimeType: mime,
          data: base64Data,
        },
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const { response, usedModel } = await generateWithFallback(
      ai,
      model || 'gemini-2.5-flash',
      {
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      }
    );

    const reply = response.text || 'Sem resposta gerada pelo assistente.';

    // Se o contexto for 'collection', tenta extrair sugestão estruturada caso haja
    let suggestedData: any = null;
    if (context.mode === 'collection' && (reply.includes('UID') || reply.includes('slug') || reply.includes('{'))) {
      const jsonMatch = reply.match(/\{[\s\S]*"titulo"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          suggestedData = JSON.parse(jsonMatch[0]);
        } catch {
          // parse falhou silenciosamente
        }
      }
    }

    // Detecta se a resposta oferece o plano pago
    const mentionsPremium = reply.toLowerCase().includes('gemini premium') || reply.toLowerCase().includes('plano pago');

    res.json({
      reply,
      chatbotId,
      model: usedModel || model,
      suggestedData,
      offerPremium: mentionsPremium,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/chat:', err);
    res.status(500).json({
      error: err.message || 'Erro ao processar solicitação com o Chatbot Gemini.',
      details: err.toString(),
    });
  }
});

// 2.1 Rota especializada: Gemini Notebook - Síntese e Inserção de Artigos no Wiki
app.post('/api/gemini/notebook-synthesize', async (req: Request, res: Response) => {
  try {
    const {
      sources = [],
      action = 'full_article',
      customPrompt = '',
      targetArticleTitle = '',
      userId = null,
      userEmail = null,
      userDisplayName = null,
      isGuest = false,
      isPremium = false,
    } = req.body;

    const ai = getGemini();

    let sourcesText = '';
    if (Array.isArray(sources) && sources.length > 0) {
      sourcesText = sources
        .map((s: any, idx: number) => {
          return `--- FONTE [${idx + 1}]: "${s.title || 'Sem título'}" (Tipo: ${s.type || 'texto'}) ---\n${s.content || ''}\n`;
        })
        .join('\n\n');
    } else {
      sourcesText = 'Nenhuma fonte externa fornecida; utilize a base enciclopédica geral do Gemini com rigor de neutralidade e factualidade.';
    }

    let actionInstruction = '';
    if (action === 'full_article') {
      actionInstruction = `Gere um ARTIGO ENCICLOPÉDICO COMPLETO em Wikitext formatado para a WikiZero, com Introdução rica, Seções enciclopédicas (= Título =, == Seção ==, === Subseção ===), Infobox se couber, e referências com <ref>...</ref>.`;
    } else if (action === 'section') {
      actionInstruction = `Gere uma SEÇÃO APROFUNDADA em sintaxe Wikitext, pronta para ser inserida como nova seção no artigo "${targetArticleTitle || 'do artigo'}".`;
    } else if (action === 'infobox') {
      actionInstruction = `Extraia todos os dados quantitativos e factuais das fontes e gere uma TABELA / INFOBOX estruturada em sintaxe Wikitext ({| class="wikitable" ... |}).`;
    } else if (action === 'timeline') {
      actionInstruction = `Construa uma LINHA DO TEMPO / CRONOLOGIA histórica detalhada e verificável baseada nas fontes fornecidas, formatada com listas e datas precisas em Wikitext.`;
    } else if (action === 'fact_check') {
      actionInstruction = `Faça uma AUDITORIA FACTUAL E VERIFICAÇÃO DE FONTES, destacando dados confirmados, incongruências e grau de confiabilidade para a enciclopédia WikiZero.`;
    } else {
      actionInstruction = customPrompt || `Sintetize as informações das fontes em sintaxe Wikitext limpa e verificável para a enciclopédia WikiZero.`;
    }

    const systemInstruction = `Você é o motor de IA do GEMINI NOTEBOOK integrado à WikiZero (Google AI Studio).
Sua missão é atuar como pesquisador enciclopédico e assistente editorial sênior.
Você analisa múltiplas fontes de pesquisa (artigos WikiZero, transcrições, textos externos, dados de imagens), cruza as informações com rigor factual e gera conteúdo enciclopédico impecável em WIKITEXT.
${userId ? `[USUÁRIO REGISTRADO]: ${userDisplayName || 'Usuário'} (ID: ${userId})` : `[MODO VISITANTE / NÃO AUTENTICADO]`}
${isPremium ? `[PLANO GEMINI PREMIUM: SÍNTESE PROFUNDA SEM RESTRIÇÕES]` : `[PLANO GRATUITO]`}

DIRETRIZES DE WIKITEXT:
- Utilize cabeçalhos formais: == Seção ==, === Subseção ===
- Utilize links internos no padrão MediaWiki: [[Nome do Artigo]] ou [[Nome do Artigo|Texto]]
- Negrito com 3 apóstrofos ('''termo''') e itálico com 2 (''termo'')
- Listas com * ou #
- Infoboxes ou tabelas com {| class="wikitable" ... |}

Ao final da resposta, inclua um bloco delimitado estritamente com um resumo em português:
###RESUMO###
(Resumo de 2 a 3 frases explicando o que foi sintetizado e as fontes utilizadas)
###FIM_RESUMO###`;

    const prompt = `FONTES DE PESQUISA DO CADERNO:
${sourcesText}

INSTRUÇÃO EDITORIAL:
${actionInstruction}
${customPrompt ? `\nInstruções extras do usuário: "${customPrompt}"` : ''}
${targetArticleTitle ? `\nArtigo de destino na WikiZero: "${targetArticleTitle}"` : ''}`;

    const { response, usedModel } = await generateWithFallback(
      ai,
      'gemini-2.5-flash',
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      }
    );

    const fullOutput = response.text || '';
    let wikitext = fullOutput;
    let summary = '';

    const resumoMatch = fullOutput.match(/###RESUMO###([\s\S]*?)###FIM_RESUMO###/);
    if (resumoMatch) {
      summary = resumoMatch[1].trim();
      wikitext = fullOutput.replace(/###RESUMO###[\s\S]*?###FIM_RESUMO###/, '').trim();
    } else {
      summary = 'Síntese gerada com sucesso pelo Gemini Notebook a partir das fontes fornecidas.';
    }

    res.json({
      wikitext,
      summary,
      suggestedTitle: targetArticleTitle || 'Novo Artigo do Gemini Notebook',
      suggestedCategory: 'Geral',
      model: usedModel,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/notebook-synthesize:', err);
    res.status(500).json({
      error: err.message || 'Erro ao processar síntese no Gemini Notebook.',
      details: err.toString(),
    });
  }
});

// 3. Rota especializada: Gerador de Artigo Completo em Wikitext
app.post('/api/gemini/generate-article', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      category = 'Geral',
      keywords = '',
      language = 'Português',
      chatbotId = '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      userInstructions = '',
    } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'O tema do artigo é obrigatório.' });
    }

    const ai = getGemini();

    const prompt = `Você é o redator enciclopédico sênior da WikiZero e assistente de IA do Google AI Studio (Chatbot ID: "${chatbotId}").
Por favor, redija um artigo enciclopédico COMPLETO, neutro, detalhado e estruturado sobre o tema: "${topic}".

Parâmetros adicionais:
- Categoria: ${category}
- Idioma: ${language}
- Palavras-chave / Foco: ${keywords || 'Abrangente'}
${userInstructions ? `- Instruções extras: ${userInstructions}` : ''}

ESTRUTURA OBRIGATÓRIA EM SINTAXE WIKITEXT:
1. Título principal: = ${topic} =
2. Parágrafo introdutório de definição clara em negrito (ex: '''${topic}''' é...).
3. Seção: == Contexto e Origem == ou == História ==
4. Seção: == Características Principais == ou == Descrição Técnica ==
5. Seção com lista com marcadores (* item) detalhando aspectos essenciais.
6. Seção: == Impacto e Relevância Cultural / Científica ==
7. Seção: == Veja Também == com links no formato [[Artigo Relacionado]]
8. Seção: == Referências e Fontes Confiáveis ==

Responda APENAS com o texto em wikitext formatado, sem preâmbulos e sem blocos de código com crases triplas se não forem necessários, para ser inserido diretamente no editor.`;

    const { response, usedModel } = await generateWithFallback(
      ai,
      'gemini-2.5-flash',
      {
        contents: prompt,
        config: {
          temperature: 0.6,
        },
      }
    );

    const wikitext = response.text || '';

    res.json({
      title: topic,
      wikitext,
      category,
      chatbotId,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/generate-article:', err);
    res.status(500).json({
      error: err.message || 'Erro ao gerar artigo enciclopédico com Gemini.',
    });
  }
});

// 4. Rota especializada: Gerador Estruturado de Coleção de Páginas
app.post('/api/gemini/generate-collection', async (req: Request, res: Response) => {
  try {
    const {
      theme,
      chatbotId = '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      userInstructions = '',
    } = req.body;

    if (!theme || typeof theme !== 'string') {
      return res.status(400).json({ error: 'O tema da coleção é obrigatório.' });
    }

    const ai = getGemini();

    const prompt = `Você é o arquiteto de conhecimento da WikiZero configurado pelo Google AI Studio (Chatbot ID: "${chatbotId}").
O usuário quer criar uma nova COLEÇÃO TEMÁTICA (WikiPage) na WikiZero com base no tema: "${theme}".
${userInstructions ? `Instruções adicionais: ${userInstructions}` : ''}

Retorne um JSON válido e estrito com a seguinte estrutura:
{
  "titulo": "Nome elegante e formal da Coleção",
  "uid": "identificador_unico_em_snake_case_sem_acentos",
  "descricao": "Uma descrição sintética de 1 a 2 parágrafos explicando o escopo enciclopédico desta coleção de páginas.",
  "categoria": "Uma categoria geral apropriada (ex: Ciência, Tecnologia, História, Geografia, Jogos, Transporte, etc.)",
  "icon": "Um único emoji temático representativo (ex: 🚀, 📚, 🚇, 🎮, 🌿)",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Retorne APENAS o JSON puro, sem crases de markdown e sem texto antes ou depois.`;

    const { response, usedModel } = await generateWithFallback(
      ai,
      'gemini-2.5-flash',
      {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      }
    );

    const raw = response.text || '{}';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      // Fallback
      data = {
        titulo: theme,
        uid: theme.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        descricao: `Coleção enciclopédica sobre ${theme}.`,
        categoria: 'Geral',
        icon: '📄',
        tags: [theme.toLowerCase()],
      };
    }

    res.json({
      collection: data,
      chatbotId,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/generate-collection:', err);
    res.status(500).json({
      error: err.message || 'Erro ao gerar coleção com Gemini.',
    });
  }
});

// -------------------------------------------------------------
// Servidor Vite / Estático
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WikiZero] Servidor rodando em http://0.0.0.0:${PORT} com suporte a Gemini API e AI Studio`);
  });
}

startServer();
