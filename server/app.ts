import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  testAndSetupSheets,
  appendMeetingsToSheet,
  appendMeetingToSheet,
  appendPlanToSheet,
  appendTeacherToSheet,
  appendClassToSheet,
  appendSubjectToSheet,
  appendActionToSheet,
  updateActionStatusInSheet,
  deleteEntityFromSheet,
  readDataFromSheet,
  syncAllToSheets,
  readAllFromSheets,
  extractCredentialsSafely,
  getServerSheetsStatus,
} from './sheets.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini suggest action route
apiRouter.post('/gemini/suggest-action', async (req, res) => {
  try {
    const { context, reason, subject, classGroup } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'O contexto pedagógico é obrigatório.' });
    }

    const prompt = `
Você é um especialista em coordenação pedagógica escolar (Brasil) e apoia professores com estratégias de recomposição de aprendizagem e acompanhamento didático.

Com base nos dados abaixo:
- Disciplina: ${subject || 'Geral'}
- Turma: ${classGroup || 'Não informada'}
- Motivo de desvio/foco: ${reason || 'Não informado'}
- Contexto da reunião/Acompanhamento: "${context}"

Gere uma única sugestão prática, construtiva e realista de encaminhamento pedagógico (máximo 2 frases) para que o professor ou a coordenação execute a fim de apoiar os alunos e superar o desafio mencionado.
A sugestão deve ser empática, clara, acionável e alinhada às melhores práticas metodológicas.

Retorne uma resposta estritamente no formato JSON com a seguinte estrutura:
{
  "suggestion": "A descrição sucinta do encaminhamento aqui."
}
`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro na API Gemini Suggest Action:', error);
    return res.status(500).json({ error: 'Falha ao processar sugestão com IA.' });
  }
});

// Gemini assist lesson route
apiRouter.post('/gemini/assist-lesson', async (req, res) => {
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

    const ai = getGeminiClient();
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

// Gemini analyze syllabus route
apiRouter.post('/gemini/analyze-syllabus', async (req, res) => {
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

    const ai = getGeminiClient();
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

// Google Sheets Routes
apiRouter.get('/sheets/status', (req, res) => {
  try {
    const status = getServerSheetsStatus();
    return res.json(status);
  } catch (err: any) {
    return res.json({
      isConfigured: false,
      hasEmail: false,
      hasKey: false,
      hasSheetId: false,
      clientEmailMasked: '',
      spreadsheetIdMasked: '',
      error: err.message,
    });
  }
});

apiRouter.post('/sheets/test-connection', async (req, res) => {
  try {
    const { clientEmail, privateKey, spreadsheetId } = req.body || {};
    // Test with server credentials by default, or with override if provided
    const result = await testAndSetupSheets(
      clientEmail && privateKey && spreadsheetId
        ? { clientEmail, privateKey, spreadsheetId }
        : undefined
    );
    return res.json(result);
  } catch (error: any) {
    console.error('Erro na conexão com Google Sheets:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Falha ao conectar com a Planilha Google.',
    });
  }
});

apiRouter.post('/sheets/sync-all', async (req, res) => {
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
      error: error.message || 'Falha ao salvar dados na Planilha Google.',
    });
  }
});

apiRouter.post('/sheets/save-meeting', async (req, res) => {
  const { meeting, config } = req.body || {};
  if (!meeting || !meeting.id) {
    return res.status(400).json({ success: false, error: 'Reunião ou ID da reunião não fornecido.', retryable: false });
  }

  try {
    const result = await appendMeetingToSheet(meeting, config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao salvar reunião na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id: meeting.id,
      error: error.message || 'Falha ao registrar reunião na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/save-plan', async (req, res) => {
  const { plan, config } = req.body || {};
  if (!plan || !plan.id) {
    return res.status(400).json({ success: false, error: 'Planejamento ou ID do planejamento não fornecido.', retryable: false });
  }

  try {
    const result = await appendPlanToSheet(plan, config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao salvar planejamento na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id: plan.id,
      error: error.message || 'Falha ao registrar planejamento na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/save-teacher', async (req, res) => {
  const { teacher, config } = req.body || {};
  if (!teacher || !teacher.id) {
    return res.status(400).json({ success: false, error: 'Professor ou ID do professor não fornecido.', retryable: false });
  }

  try {
    const result = await appendTeacherToSheet(teacher, config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao salvar professor na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id: teacher.id,
      error: error.message || 'Falha ao registrar professor na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/save-class', async (req, res) => {
  const { classGroup, config } = req.body || {};
  if (!classGroup || !classGroup.id) {
    return res.status(400).json({ success: false, error: 'Turma ou ID da turma não fornecido.', retryable: false });
  }

  try {
    const result = await appendClassToSheet(classGroup, config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao salvar turma na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id: classGroup.id,
      error: error.message || 'Falha ao registrar turma na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/save-subject', async (req, res) => {
  const { subject, config } = req.body || {};
  if (!subject || !subject.id) {
    return res.status(400).json({ success: false, error: 'Disciplina ou ID da disciplina não fornecido.', retryable: false });
  }

  try {
    const result = await appendSubjectToSheet(subject, config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao salvar disciplina na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id: subject.id,
      error: error.message || 'Falha ao registrar disciplina na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/save-action', async (req, res) => {
  const { action, config } = req.body || {};
  if (!action || !action.id) {
    return res.status(400).json({ success: false, error: 'Encaminhamento ou ID do encaminhamento não fornecido.', retryable: false });
  }

  try {
    const result = await appendActionToSheet(action, config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao salvar encaminhamento na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id: action.id,
      error: error.message || 'Falha ao registrar encaminhamento na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/update-action-status', async (req, res) => {
  const { actionId, newStatus, config } = req.body || {};
  if (!actionId || !newStatus) {
    return res.status(400).json({ success: false, error: 'Parâmetros incompletos.', retryable: false });
  }

  try {
    const result = await updateActionStatusInSheet(actionId, newStatus, config);
    return res.json(result);
  } catch (error: any) {
    console.error('Erro ao atualizar status na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id: actionId,
      error: error.message || 'Falha ao atualizar encaminhamento na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/delete-entity', async (req, res) => {
  const { entityType, id, config } = req.body || {};
  if (!entityType || !id) {
    return res.status(400).json({ success: false, error: 'Parâmetros entityType e id são obrigatórios.', retryable: false });
  }

  try {
    const result = await deleteEntityFromSheet(entityType, id, config);
    return res.json(result);
  } catch (error: any) {
    console.error('Erro ao excluir registro na Planilha Google:', error);
    const isPermanent = error?.message?.includes('invalid_grant') || error?.message?.includes('insufficient_permissions');
    return res.status(500).json({
      success: false,
      id,
      error: error.message || 'Falha ao excluir registro na Planilha Google.',
      retryable: !isPermanent
    });
  }
});

apiRouter.post('/sheets/load-all', async (req, res) => {
  try {
    const { config } = req.body || {};
    const result = await readAllFromSheets(config);
    return res.json({ ...result });
  } catch (error: any) {
    console.error('Erro ao carregar dados da Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao carregar dados da Planilha Google.',
    });
  }
});

apiRouter.post('/sheets/sync', async (req, res) => {
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
      error: error.message || 'Falha ao enviar registros para a Planilha Google.',
    });
  }
});

apiRouter.post('/sheets/fetch', async (req, res) => {
  try {
    const { config } = req.body || {};
    const data = await readDataFromSheet(config);
    return res.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Erro ao ler da Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao buscar dados da Planilha Google.',
    });
  }
});

// Mount router on both '/api' and '/' to ensure matches whether rewritten or not
app.use('/api', apiRouter);
app.use('/', apiRouter);

export { app };
export default app;
