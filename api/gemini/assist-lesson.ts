import { GoogleGenAI } from '@google/genai';

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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { rawText, subject, classGroup, methodology } = req.body || {};
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
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Erro na API Gemini Assist Lesson:', error);
    return res.status(500).json({ error: 'Falha ao processar auxílio pedagógico com IA.' });
  }
}
