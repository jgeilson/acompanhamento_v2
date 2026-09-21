import { google } from 'googleapis';

export interface GoogleSheetsConfig {
  clientEmail?: string;
  privateKey?: string;
  spreadsheetId?: string;
}

/**
 * Clean and format Google Service Account private key for OpenSSL PEM parser.
 */
export function cleanPrivateKey(rawKey: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim();

  // If key is wrapped in quotes, unwrap it
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
  }

  // Replace escaped newlines and carriage returns
  key = key
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '');

  key = key.trim();

  // If key doesn't have BEGIN/END headers, attempt to wrap it
  if (!key.includes('BEGIN PRIVATE KEY')) {
    const base64Clean = key.replace(/[\s\n\r]/g, '');
    const lines = base64Clean.match(/.{1,64}/g) || [base64Clean];
    key = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
  } else {
    // Standardize headers
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';

    // Extract content between headers if possible
    const headerIdx = key.indexOf(header);
    const footerIdx = key.indexOf(footer);

    if (headerIdx !== -1 && footerIdx !== -1 && footerIdx > headerIdx) {
      const body = key.substring(headerIdx + header.length, footerIdx).trim();
      const cleanBody = body
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .join('\n');
      key = `${header}\n${cleanBody}\n${footer}\n`;
    } else {
      key = key.replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n');
      key = key.replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');
    }
  }

  return key;
}

/**
 * Extract credentials from config or process.env, handling full JSON pastes and URL inputs.
 */
export function extractCredentials(config?: GoogleSheetsConfig) {
  let email = config?.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  let key = config?.privateKey || process.env.GOOGLE_PRIVATE_KEY || '';
  let spreadsheetId = config?.spreadsheetId || process.env.GOOGLE_SHEET_ID || '';

  // Helper to parse JSON string if user pasted full credentials JSON
  const tryParseJson = (str: string) => {
    if (!str) return null;
    const trimmed = str.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
    return null;
  };

  const parsedKey = tryParseJson(key);
  const parsedEmail = tryParseJson(email);
  const parsedSheet = tryParseJson(spreadsheetId);
  const json = parsedKey || parsedEmail || parsedSheet;

  if (json) {
    if (json.client_email) email = json.client_email;
    if (json.private_key) key = json.private_key;
    if (json.spreadsheet_id) spreadsheetId = json.spreadsheet_id;
  }

  // Extract ID if full Google Sheets URL was pasted
  if (spreadsheetId.includes('/spreadsheets/d/')) {
    const match = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      spreadsheetId = match[1];
    }
  }

  email = email.trim();
  spreadsheetId = spreadsheetId.trim();

  if (!email || !key || !spreadsheetId) {
    throw new Error('Credenciais da Planilha Google incompletas. Verifique E-mail de Serviço, Chave Privada e ID da Planilha.');
  }

  const formattedKey = cleanPrivateKey(key);

  return { email, key: formattedKey, spreadsheetId };
}

export function getSheetsClient(config?: GoogleSheetsConfig) {
  const { email, key, spreadsheetId } = extractCredentials(config);

  try {
    const auth = new google.auth.JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId };
  } catch (err: any) {
    if (err.message && (err.message.includes('1E08010C') || err.message.includes('DECODER') || err.message.includes('unsupported'))) {
      throw new Error('Formato de Chave Privada inválido. Certifique-se de copiar o conteúdo completo do campo "private_key" do arquivo JSON da Conta de Serviço (incluindo -----BEGIN PRIVATE KEY----- e -----END PRIVATE KEY-----).');
    }
    throw err;
  }
}

/**
  * Verifies connection to Google Sheets and ensures required sheets/tabs exist.
  */
export async function testAndSetupSheets(config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);

  // Read metadata to check tab names
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const existingSheetNames = (res.data.sheets || []).map(s => s.properties?.title || '');
  
  const requiredTabs = ['Professores', 'Turmas', 'Disciplinas', 'Planejamento', 'Reuniões', 'Encaminhamentos'];
  const missingTabs = requiredTabs.filter(tab => !existingSheetNames.includes(tab));

  if (missingTabs.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missingTabs.map(title => ({
          addSheet: {
            properties: { title }
          }
        }))
      }
    });
  }

  // Ensure headers exist on each tab
  await ensureSheetHeaders(sheets, spreadsheetId);

  return {
    success: true,
    title: res.data.properties?.title || 'Planilha Google',
    tabs: [...existingSheetNames, ...missingTabs].filter(Boolean),
  };
}

async function ensureSheetHeaders(sheets: any, spreadsheetId: string) {
  const headers = [
    {
      tab: 'Professores',
      range: 'Professores!A1:F1',
      values: [['ID Professor', 'Nome', 'Email', 'Foto URL', 'IDs Disciplinas', 'IDs Turmas']]
    },
    {
      tab: 'Turmas',
      range: 'Turmas!A1:D1',
      values: [['ID Turma', 'Nome da Turma', 'Turno', 'Qtd Alunos']]
    },
    {
      tab: 'Disciplinas',
      range: 'Disciplinas!A1:E1',
      values: [['ID Disciplina', 'Nome da Disciplina', 'Código', 'Cor Hex', 'Carga Horária (h)']]
    },
    {
      tab: 'Planejamento',
      range: 'Planejamento!A1:M1',
      values: [['ID Planejamento', 'ID Prof', 'ID Disciplina', 'ID Turma', 'Bimestre', 'Ano', 'Quinzena', 'Título Período', 'ID Tópico', 'Título Tópico', 'Código BNCC', 'Carga Horária (h)', 'Unidade Temática']]
    },
    {
      tab: 'Reuniões',
      range: 'Reuniões!A1:O1',
      values: [['ID Reunião', 'Data', 'ID Prof', 'Professor', 'ID Disciplina', 'Disciplina', 'ID Turma', 'Turma', 'Bimestre', 'Periodicidade', 'Quinzena', 'Razão Fator', 'Contexto Pedagógico', 'Tópicos Concluídos', 'Qtd Encaminhamentos']]
    },
    {
      tab: 'Encaminhamentos',
      range: 'Encaminhamentos!A1:M1',
      values: [['ID Encaminhamento', 'ID Reunião', 'ID Prof', 'Professor', 'ID Disciplina', 'Disciplina', 'ID Turma', 'Turma', 'Descrição da Ação', 'Categoria', 'Data Criação', 'Previsão Quinzena', 'Status']]
    }
  ];

  for (const h of headers) {
    // Check if header row exists
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${h.tab}!A1:Z1`
    }).catch(() => ({ data: { values: [] } }));

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: h.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: h.values }
      }).catch(() => {});
    }
  }
}

/**
 * Overwrites or populates all 6 sheets with state data (Teachers, Classes, Subjects, Plans, Meetings, Actions)
 */
export async function syncAllToSheets(data: {
  teachers?: any[];
  classGroups?: any[];
  subjects?: any[];
  bimonthlyPlans?: any[];
  meetings?: any[];
  actions?: any[];
}, config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);

  // 1. Professores
  if (data.teachers && data.teachers.length > 0) {
    const rows = data.teachers.map(t => [
      t.id,
      t.name,
      t.email,
      t.avatarUrl || '',
      (t.subjects || []).join(','),
      (t.classes || []).join(',')
    ]);
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Professores!A2:Z1000' }).catch(() => {});
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Professores!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  // 2. Turmas
  if (data.classGroups && data.classGroups.length > 0) {
    const rows = data.classGroups.map(c => [
      c.id,
      c.name,
      c.shift,
      c.totalStudents
    ]);
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Turmas!A2:Z1000' }).catch(() => {});
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Turmas!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  // 3. Disciplinas
  if (data.subjects && data.subjects.length > 0) {
    const rows = data.subjects.map(s => [
      s.id,
      s.name,
      s.code,
      s.color,
      s.totalWorkloadHours
    ]);
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Disciplinas!A2:Z1000' }).catch(() => {});
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Disciplinas!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  // 4. Planejamentos
  if (data.bimonthlyPlans && data.bimonthlyPlans.length > 0) {
    const planRows: any[] = [];
    data.bimonthlyPlans.forEach(p => {
      (p.periods || []).forEach((per: any) => {
        (per.topics || []).forEach((top: any) => {
          planRows.push([
            p.id,
            p.teacherId,
            p.subjectId,
            p.classGroupId,
            p.bimester,
            p.year,
            per.fortnightNumber,
            per.periodTitle,
            top.id,
            top.title,
            top.bnccCode || '',
            top.estimatedHours || 0,
            top.unitTitle || ''
          ]);
        });
      });
    });
    if (planRows.length > 0) {
      await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Planejamento!A2:Z2000' }).catch(() => {});
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Planejamento!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: planRows }
      });
    }
  }

  // 5. Reuniões
  if (data.meetings && data.meetings.length > 0) {
    const meetingRows = data.meetings.map(m => [
      m.id,
      m.meetingDate,
      m.teacherId,
      m.teacherName,
      m.subjectId,
      m.subjectName,
      m.classGroupId,
      m.classGroupName,
      m.bimester,
      m.periodicity || 'QUINZENAL',
      m.fortnightPeriod,
      m.primaryReason || (m.pedagogicalReasons || []).join(', '),
      m.pedagogicalContextNotes,
      (m.topicProgress || []).filter((t: any) => t.status === 'CONCLUIDO').length,
      (m.newActions || []).length
    ]);
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Reuniões!A2:Z2000' }).catch(() => {});
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Reuniões!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: meetingRows }
    });
  }

  // 6. Encaminhamentos
  if (data.actions && data.actions.length > 0) {
    const actionRows = data.actions.map(act => [
      act.id,
      act.meetingId || '',
      act.teacherId || '',
      act.teacherName || '',
      act.subjectId || '',
      act.subjectName || '',
      act.classGroupId || '',
      act.classGroupName || '',
      act.description,
      act.category,
      act.createdDate,
      act.targetMeetingPeriod,
      act.status || 'PENDENTE'
    ]);
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Encaminhamentos!A2:Z2000' }).catch(() => {});
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Encaminhamentos!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: actionRows }
    });
  }

  return { success: true };
}

/**
 * Appends meetings and actions to the Google Sheet
 */
export async function appendMeetingsToSheet(meetings: any[], config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);

  const meetingRows = meetings.map(m => [
    m.id,
    m.meetingDate,
    m.teacherName,
    m.subjectName,
    m.classGroupName,
    m.periodicity || 'QUINZENAL',
    (m.pedagogicalReasons || [m.primaryReason]).join(', '),
    m.pedagogicalContextNotes,
    (m.topicProgress || []).filter((t: any) => t.status === 'CONCLUIDO').length,
    (m.newActions || []).length
  ]);

  if (meetingRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Reuniões!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: meetingRows
      }
    });
  }

  // Also collect new actions to append
  const actionRows: any[] = [];
  meetings.forEach(m => {
    (m.newActions || []).forEach((act: any) => {
      actionRows.push([
        act.id,
        m.teacherName,
        m.classGroupName,
        act.category,
        act.description,
        act.targetMeetingPeriod,
        act.status || 'PENDENTE',
        m.meetingDate
      ]);
    });
  });

  if (actionRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Encaminhamentos!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: actionRows
      }
    });
  }

  return {
    appendedMeetings: meetingRows.length,
    appendedActions: actionRows.length
  };
}

/**
 * Reads all 6 tabs from Google Sheet and parses them into domain entities.
 */
export async function readAllFromSheets(config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);

  const getTabValues = async (tab: string, range: string) => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!${range}`
    }).catch(() => ({ data: { values: [] } }));
    return res.data.values || [];
  };

  const [rawTeachers, rawClasses, rawSubjects, rawPlans, rawMeetings, rawActions] = await Promise.all([
    getTabValues('Professores', 'A2:F500'),
    getTabValues('Turmas', 'A2:D500'),
    getTabValues('Disciplinas', 'A2:E500'),
    getTabValues('Planejamento', 'A2:M2000'),
    getTabValues('Reuniões', 'A2:O2000'),
    getTabValues('Encaminhamentos', 'A2:M2000')
  ]);

  // Parse Teachers
  const teachers = rawTeachers.map((row: any[]) => ({
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    avatarUrl: row[3] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    subjects: (row[4] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    classes: (row[5] || '').split(',').map((c: string) => c.trim()).filter(Boolean)
  })).filter(t => t.id && t.name);

  // Parse Classes
  const classGroups = rawClasses.map((row: any[]) => ({
    id: row[0] || '',
    name: row[1] || '',
    shift: row[2] || 'Matutino',
    totalStudents: parseInt(row[3] || '30', 10)
  })).filter(c => c.id && c.name);

  // Parse Subjects
  const subjects = rawSubjects.map((row: any[]) => ({
    id: row[0] || '',
    name: row[1] || '',
    code: row[2] || '',
    color: row[3] || '#2563eb',
    totalWorkloadHours: parseInt(row[4] || '80', 10)
  })).filter(s => s.id && s.name);

  // Parse Bimonthly Plans
  const plansMap = new Map<string, any>();
  rawPlans.forEach((row: any[]) => {
    const planId = row[0];
    if (!planId) return;

    if (!plansMap.has(planId)) {
      plansMap.set(planId, {
        id: planId,
        teacherId: row[1] || '',
        subjectId: row[2] || '',
        classGroupId: row[3] || '',
        bimester: parseInt(row[4] || '3', 10),
        year: parseInt(row[5] || '2026', 10),
        periodsMap: new Map<number, any>()
      });
    }

    const plan = plansMap.get(planId);
    const fortnightNum = parseInt(row[6] || '1', 10);
    const periodTitle = row[7] || `${fortnightNum}ª Quinzena`;

    if (!plan.periodsMap.has(fortnightNum)) {
      plan.periodsMap.set(fortnightNum, {
        fortnightNumber: fortnightNum,
        periodTitle,
        topics: []
      });
    }

    const period = plan.periodsMap.get(fortnightNum);
    if (row[8]) { // topicId
      period.topics.push({
        id: row[8],
        title: row[9] || '',
        bnccCode: row[10] || '',
        estimatedHours: parseInt(row[11] || '6', 10),
        unitTitle: row[12] || ''
      });
    }
  });

  const bimonthlyPlans = Array.from(plansMap.values()).map(p => ({
    id: p.id,
    teacherId: p.teacherId,
    subjectId: p.subjectId,
    classGroupId: p.classGroupId,
    bimester: p.bimester,
    year: p.year,
    periods: Array.from(p.periodsMap.values())
  }));

  // Parse Actions
  const actions = rawActions.map((row: any[]) => ({
    id: row[0] || '',
    meetingId: row[1] || '',
    teacherId: row[2] || '',
    teacherName: row[3] || '',
    subjectId: row[4] || '',
    subjectName: row[5] || '',
    classGroupId: row[6] || '',
    classGroupName: row[7] || '',
    description: row[8] || '',
    category: row[9] || 'OUTROS',
    createdDate: row[10] || new Date().toISOString().split('T')[0],
    targetMeetingPeriod: row[11] || 'Próxima Quinzena',
    status: row[12] || 'PENDENTE'
  })).filter(a => a.id && a.description);

  // Parse Meetings
  const meetings = rawMeetings.map((row: any[]) => ({
    id: row[0] || '',
    meetingDate: row[1] || '',
    teacherId: row[2] || '',
    teacherName: row[3] || '',
    subjectId: row[4] || '',
    subjectName: row[5] || '',
    classGroupId: row[6] || '',
    classGroupName: row[7] || '',
    bimester: parseInt(row[8] || '3', 10),
    periodicity: row[9] || 'QUINZENAL',
    fortnightPeriod: row[10] || '',
    primaryReason: row[11] || 'RITMO_ADEQUADO',
    pedagogicalContextNotes: row[12] || '',
    topicProgress: [],
    previousActionsVerification: [],
    newActions: actions.filter(a => a.meetingId === row[0])
  })).filter(m => m.id && m.teacherName);

  return {
    teachers,
    classGroups,
    subjects,
    bimonthlyPlans,
    meetings,
    actions,
    rawCounts: {
      teachers: teachers.length,
      classGroups: classGroups.length,
      subjects: subjects.length,
      bimonthlyPlans: bimonthlyPlans.length,
      meetings: meetings.length,
      actions: actions.length
    }
  };
}

/**
 * Reads data from Google Sheet
 */
export async function readDataFromSheet(config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);

  const meetingsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Reuniões!A2:J1000'
  }).catch(() => ({ data: { values: [] } }));

  const actionsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Encaminhamentos!A2:H1000'
  }).catch(() => ({ data: { values: [] } }));

  return {
    rawMeetings: meetingsRes.data.values || [],
    rawActions: actionsRes.data.values || []
  };
}

