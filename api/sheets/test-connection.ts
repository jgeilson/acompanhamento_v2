import { testAndSetupSheets } from '../../server/sheets.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { clientEmail, privateKey, spreadsheetId } = req.body || {};
    const result = await testAndSetupSheets({ clientEmail, privateKey, spreadsheetId });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro na conexão com Google Sheets:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Falha ao conectar com a Planilha Google.',
    });
  }
}
