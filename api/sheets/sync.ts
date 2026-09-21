import { appendMeetingsToSheet } from '../../server/sheets.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { meetings, config } = req.body || {};
    if (!Array.isArray(meetings) || meetings.length === 0) {
      return res.status(400).json({ error: 'Nenhuma reunião informada para sincronização.' });
    }

    const result = await appendMeetingsToSheet(meetings, config);
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erro ao sincronizar com Google Sheets:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao enviar registros para a Planilha Google.',
    });
  }
}
