import { updateActionStatusInSheet } from '../../server/sheets.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { actionId, newStatus, config } = req.body || {};
    if (!actionId || !newStatus) {
      return res.status(400).json({ error: 'Parâmetros incompletos.' });
    }

    const result = await updateActionStatusInSheet(actionId, newStatus, config);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro ao atualizar status na Planilha Google:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao atualizar encaminhamento na Planilha Google.',
    });
  }
}
