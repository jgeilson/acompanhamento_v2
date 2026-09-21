import { syncAllToSheets } from '../../server/sheets.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { data, config } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'Dados não fornecidos para sincronização.' });
    }

    const result = await syncAllToSheets(data, config);
    return res.status(200).json({ ...result });
  } catch (error: any) {
    console.error('Erro ao sincronizar todos os dados na Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao salvar dados na Planilha Google.',
    });
  }
}
