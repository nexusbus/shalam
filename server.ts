import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenAI | null = null;

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada. Por favor, adicione a chave nos Segredos do AI Studio.");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getGemini() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Gemini] Chave de API não encontrada.");
      return null;
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

async function analyzeWithGemini(content: string, isImage: boolean, mimeType?: string, buffer?: Buffer) {
  const genAI = getGemini();
  if (!genAI) return null;

  const systemInstruction = `Você é um investigador especialista em fraudes de seguros. Sua tarefa é analisar o CONTEÚDO ESCRITO no documento (relatos, valores, datas, descrições de sinistros). 
  Procure por inconsistências, contradições lógicas e sinais de falsificação.
  Retorne APENAS um JSON estruturado com: riskScore (0-100), verdict, anomalies (array de objetos com title e description), confidence, algorithm ("Gemini AI Fallback").`;

  try {
    if (isImage && buffer && mimeType) {
      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: systemInstruction },
              {
                inlineData: {
                  data: buffer.toString("base64"),
                  mimeType
                }
              }
            ]
          }
        ]
      });
      const text = result.text;
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } else {
      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: systemInstruction },
              { text: `Analise o conteúdo escrito abaixo: ${content.substring(0, 30000)}` }
            ]
          }
        ]
      });
      const text = result.text;
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    }
  } catch (err) {
    console.error("[Gemini] Erro na análise:", err);
    return null;
  }
}

console.log("[Server] Iniciando servidor Express...");

async function startServer() {
  const app = express();
  const PORT = 3000;

  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Debug middleware
  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.url}`);
    }
    next();
  });

  // API routes
  app.post("/api/analyze", upload.single("file"), async (req, res) => {
    console.log("[API] Iniciando análise de arquivo...");
    let content = "";
    let mimeType = "";
    
    try {
      const openai = getOpenAI();
      
      if (!req.file) {
        console.log("[API] Erro: Nenhum arquivo enviado.");
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      console.log(`[API] Arquivo recebido: ${req.file.originalname} (${req.file.mimetype})`);

      mimeType = req.file.mimetype;

      if (mimeType === "application/pdf") {
        console.log("[API] Processando PDF...");
        try {
          const data = await pdf(req.file.buffer);
          content = data.text;
          console.log(`[API] PDF processado. Comprimento do texto: ${content.length}`);
        } catch (pdfError) {
          console.error("[API] Erro ao processar PDF:", pdfError);
          throw new Error("Falha ao extrair texto do PDF.");
        }
      } else if (mimeType.startsWith("image/")) {
        console.log("[API] Processando Imagem com GPT-4o...");
        const base64Image = req.file.buffer.toString("base64");
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Você é um investigador especialista em fraudes de seguros. Sua tarefa é analisar o CONTEÚDO ESCRITO no documento (relatos, valores, datas, descrições de sinistros). 
              Procure por:
              1. Contradições lógicas no relato do incidente.
              2. Valores ou danos que não condizem com a descrição.
              3. Linguagem excessivamente técnica ou suspeitamente vaga.
              4. Inconsistências cronológicas nos eventos descritos.
              5. Sinais de que o texto foi manipulado ou forjado para inflar o prejuízo.
              
              IGNORE metadados técnicos ou qualidade da imagem. Foque no que está ESCRITO.
              Retorne uma resposta JSON estruturada em Português.`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Analise o conteúdo escrito neste documento para identificar possíveis fraudes de seguros:" },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        });

        console.log("[API] Resposta da imagem recebida da OpenAI.");
        return res.json(JSON.parse(response.choices[0].message.content || "{}"));
      } else {
        console.log("[API] Processando arquivo de texto...");
        content = req.file.buffer.toString("utf-8");
      }

      if (!content || content.trim().length === 0) {
        console.log("[API] Erro: Conteúdo do documento está vazio.");
        return res.status(400).json({ error: "O documento parece estar vazio ou não pôde ser lido." });
      }

      console.log("[API] Enviando texto para OpenAI GPT-4o...");
      // Analysis for text content (PDF or Text)
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um investigador especialista em fraudes de seguros. Sua tarefa é analisar o CONTEÚDO ESCRITO no texto fornecido.
            Foque em identificar:
            1. Inconsistências nos fatos narrados.
            2. Reclamações de danos que parecem exageradas ou impossíveis dada a descrição do sinistro.
            3. Padrões de escrita que sugerem falsificação de documentos oficiais ou médicos.
            4. Conflitos entre datas, locais e horários mencionados no texto.
            
            Retorne uma resposta JSON estruturada em Português com o seguinte formato:
            {
              "riskScore": number (0-100),
              "verdict": "Alto Risco" | "Risco Médio" | "Baixo Risco" | "Seguro",
              "anomalies": [
                { "title": string, "description": string, "type": "content" }
              ],
              "confidence": number,
              "algorithm": "OpenAI Content Intelligence"
            }`,
          },
          {
            role: "user",
            content: `Analise o conteúdo escrito abaixo em busca de indícios de fraude de seguros: ${content.substring(0, 15000)}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      console.log("[API] Resposta de texto recebida da OpenAI.");
      res.json(JSON.parse(response.choices[0].message.content || "{}"));
    } catch (error: any) {
      console.error("[API] Erro na análise OpenAI:", error);
      
      // Fallback to Gemini if OpenAI fails due to quota or other API errors
      if (error.status === 429 || error.status === 401 || error.status === 500) {
        console.log("[API] Tentando fallback para Gemini...");
        try {
          const geminiResult = await analyzeWithGemini(
            content, 
            mimeType.startsWith("image/"), 
            mimeType, 
            req.file?.buffer
          );
          if (geminiResult) {
            console.log("[API] Análise concluída via Gemini (Fallback).");
            return res.json(geminiResult);
          }
        } catch (geminiError) {
          console.error("[API] Falha no fallback para Gemini:", geminiError);
        }
      }

      let errorMessage = "Falha na análise do documento.";
      
      if (error.status === 429) {
        errorMessage = "Cota da OpenAI excedida. Por favor, verifique seu plano na OpenAI ou use a análise padrão.";
      } else if (error.status === 401) {
        errorMessage = "Chave de API da OpenAI inválida.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(error.status || 500).json({ error: errorMessage });
    }
  });

  // API 404 handler
  app.use("/api/*", (req, res) => {
    console.log(`[API] 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `Rota API não encontrada: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[Server] Erro fatal ao iniciar o servidor:", err);
  process.exit(1);
});
