import { appendClassToSheet } from '../../server/sheets.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { classGroup, config } = req.body || {};
    if (!classGroup) {
      return res.status(400).json({ error: 'Turma não fornecida.' });
    }

    const result = await appendClassToSheet(classGroup, config);
    return res.status(200).json({ ...result });
  } catch (error: any) {
    console.error('Erro ao salvar turma na Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao registrar turma na Planilha Google.',
    });
  }
}
