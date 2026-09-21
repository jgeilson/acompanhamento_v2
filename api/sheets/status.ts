import { extractCredentialsSafely } from '../../server/sheets.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const creds = extractCredentialsSafely();
    const isConfigured = Boolean(creds.email && creds.key && creds.spreadsheetId);
    return res.status(200).json({
      isConfigured,
      clientEmail: creds.email || '',
      spreadsheetId: creds.spreadsheetId || '',
    });
  } catch (err: any) {
    return res.status(200).json({
      isConfigured: false,
      clientEmail: '',
      spreadsheetId: '',
      error: err.message,
    });
  }
}
