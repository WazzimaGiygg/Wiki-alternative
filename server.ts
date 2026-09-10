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

// Fallback resiliente para garantir disponibilidade contra picos temporários de demanda
async function generateWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  params: {
    contents: any;
    config?: any;
  }
) {
  // Modelos suportados pela SDK moderna: prioriza modelo solicitado, com alternativas flash de alta disponibilidade
  const modelsToTry = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastErr: any = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      return { response, usedModel: modelName };
    } catch (err: any) {
      lastErr = err;
      // Passa silenciosamente para o próximo modelo caso ocorra 503 (alta demanda) ou indisponibilidade temporária
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
    defaultModel: 'gemini-3.8-flash',
    appletId: '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
    provider: 'Google AI Studio & Gemini API',
  });
});

// 2. Chatbot Geral & Assistente de Criação de Conteúdo
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      context = {},
      chatbotId = '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      customSystemInstruction,
      model = 'gemini-3.8-flash',
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem obrigatória.' });
    }

    const ai = getGemini();

    // Monta a instrução de sistema adaptada para a WikiZero e AI Studio
    let systemInstruction = `Você é o Chatbot Assistente Oficial da WikiZero, alimentado pelo Google AI Studio (Chatbot ID: "${chatbotId}").
Sua principal função é auxiliar leitores, redatores e administradores na enciclopédia WikiZero em:
1. Criação e estruturação de coleções de artigos (páginas WikiPage com título, UID slug, descrição, categoria, emoji de ícone e tags).
2. Criação, expansão, revisão e redação de artigos enciclopédicos completos usando formatação sintática MediaWiki / Wikitext.
3. Fornecer explicações neutras, verificáveis, com tom enciclopédico de alta qualidade, sem alucinações.

Diretrizes de Formatação de Wikitext para WikiZero:
- Títulos de seções: "= Título Principal =", "== Seção Principal ==", "=== Subseção ===", "==== Tópico ====".
- Negrito: '''texto''', Itálico: ''texto''.
- Links internos da wiki: [[Nome do Artigo]] ou [[Nome do Artigo|Texto Visível]].
- Listas: * para marcadores não ordenados, # para listas numeradas.
- Caixas e destaques: use blocos limpos.
- Citações e referências: <ref>Fonte confiável</ref>.
- Seja cordial, objetivo e ofereça exemplos prontos para copiar e colar no editor.`;

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
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Adiciona o histórico recente (limite de 10 mensagens para manter agilidade)
    const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'model') {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Mensagem atual com o contexto
    contents.push({
      role: 'user',
      parts: [{ text: message + (dynamicContext ? `\n\n${dynamicContext}` : '') }],
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
      // Regex para tentar extrair JSON se o modelo tiver incluído
      const jsonMatch = reply.match(/\{[\s\S]*"titulo"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          suggestedData = JSON.parse(jsonMatch[0]);
        } catch {
          // parse falhou silenciosamente
        }
      }
    }

    res.json({
      reply,
      chatbotId,
      model: usedModel || model,
      suggestedData,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/chat:', err);
    res.status(500).json({
      error: err.message || 'Erro ao processar solicitação com o Chatbot Gemini.',
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
