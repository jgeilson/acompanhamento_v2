import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes
app.post('/api/gemini/assist-lesson', async (req, res) => {
  try {
    const { rawText, subject, classGroup, methodology } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: 'O texto de rascunho é obrigatório.' });
    }

    const prompt = `
Você é um especialista em coordenação pedagógica e metodologia de ensino da Educação Básica brasileira (alinhado à BNCC).
Sua tarefa é pegar as anotações brutas de um professor e transformá-las em um registro formal e estruturado de diário de classe.

Dados da aula:
- Disciplina: ${subject || 'Geral'}
- Turma: ${classGroup || 'Não informada'}
- Metodologia pretendida: ${methodology || 'Aula Expositiva'}
- Anotações brutas do professor: "${rawText}"

Retorne uma resposta estritamente no formato JSON com a seguinte estrutura:
{
  "formalSummary": "Resumo formal, claro e pedagógico do conteúdo ministrado em linguagem acadêmica/escolar.",
  "bnccAlignment": "Habilidades ou códigos da BNCC alinhados ao conteúdo (ex: EM13MAT101 - Interpretar funções...)",
  "suggestedHomework": "Sugestão de tarefa para casa ou atividade de fixação recomendada para os alunos",
  "pedagogicalObservation": "Observação reflexiva sobre engajamento, dúvidas frequentes ou estratégias para a próxima aula"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro na API Gemini Assist Lesson:', error);
    return res.status(500).json({ error: 'Falha ao processar auxílio pedagógico com IA.' });
  }
});

app.post('/api/gemini/analyze-syllabus', async (req, res) => {
  try {
    const { subjectName, completedCount, totalCount, recentLogs } = req.body;

    const prompt = `
Você é um auditor pedagógico experiente. Faça um diagnóstico rápido e construtivo sobre o andamento do cumprimento da ementa escolar.

Dados:
- Disciplina: ${subjectName}
- Tópicos Concluídos: ${completedCount} de ${totalCount}
- Registros recentes: ${JSON.stringify(recentLogs || [])}

Retorne um JSON com:
{
  "healthStatus": "EM_DIA" | "ATENCAO" | "ATRASADO",
  "completionPercentage": 0,
  "diagnosis": "Breve diagnóstico do ritmo de aulas",
  "recommendations": ["Sugestão 1", "Sugestão 2"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Erro na API Gemini Analyze Syllabus:', error);
    return res.status(500).json({ error: 'Falha ao analisar ementa.' });
  }
});

// Google Sheets Integration API Routes
import { testAndSetupSheets, appendMeetingsToSheet, readDataFromSheet, syncAllToSheets, readAllFromSheets } from './server/sheets.js';

app.get('/api/sheets/status', (req, res) => {
  const isConfigured = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEET_ID
  );
  return res.json({
    isConfigured,
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    spreadsheetId: process.env.GOOGLE_SHEET_ID || ''
  });
});

app.post('/api/sheets/test-connection', async (req, res) => {
  try {
    const { clientEmail, privateKey, spreadsheetId } = req.body || {};
    const result = await testAndSetupSheets({ clientEmail, privateKey, spreadsheetId });
    return res.json(result);
  } catch (error: any) {
    console.error('Erro na conexão com Google Sheets:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Falha ao conectar com a Planilha Google.'
    });
  }
});

app.post('/api/sheets/sync-all', async (req, res) => {
  try {
    const { data, config } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'Dados não fornecidos para sincronização.' });
    }

    const result = await syncAllToSheets(data, config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao sincronizar todos os dados na Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao salvar dados na Planilha Google.'
    });
  }
});

app.post('/api/sheets/load-all', async (req, res) => {
  try {
    const { config } = req.body || {};
    const result = await readAllFromSheets(config);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erro ao carregar dados da Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao carregar dados da Planilha Google.'
    });
  }
});

app.post('/api/sheets/sync', async (req, res) => {
  try {
    const { meetings, config } = req.body || {};
    if (!Array.isArray(meetings) || meetings.length === 0) {
      return res.status(400).json({ error: 'Nenhuma reunião informada para sincronização.' });
    }

    const result = await appendMeetingsToSheet(meetings, config);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erro ao sincronizar com Google Sheets:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao enviar registros para a Planilha Google.'
    });
  }
});

app.post('/api/sheets/fetch', async (req, res) => {
  try {
    const { config } = req.body || {};
    const data = await readDataFromSheet(config);
    return res.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Erro ao ler da Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao buscar dados da Planilha Google.'
    });
  }
});

// Vite Middleware for development & static file serving for production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

setupServer();
