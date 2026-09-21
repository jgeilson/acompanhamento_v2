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

  // If key is wrapped in quotes or escaped quotes, unwrap it
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'")) ||
    (key.startsWith('`') && key.endsWith('`'))
  ) {
    key = key.substring(1, key.length - 1).trim();
  }

  // Handle double escaped newlines (e.g. \\n from Vercel env var or JSON stringification)
  key = key.replace(/\\\\n/g, '\n');
  key = key.replace(/\\n/g, '\n');
  key = key.replace(/\\r/g, '');
  key = key.replace(/\r\n/g, '\n');
  key = key.replace(/\r/g, '');

  key = key.trim();

  // If key was Base64 encoded without headers, try decoding
  if (!key.includes('BEGIN PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf-8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        key = decoded.trim();
      }
    } catch {}
  }

  // If key still doesn't have BEGIN/END headers, attempt to wrap it
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
  let email =
    config?.clientEmail ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    process.env.GOOGLE_EMAIL ||
    '';

  let key =
    config?.privateKey ||
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    '';

  let spreadsheetId =
    config?.spreadsheetId ||
    process.env.GOOGLE_SHEET_ID ||
    process.env.GOOGLE_SPREADSHEET_ID ||
    process.env.SPREADSHEET_ID ||
    process.env.SHEET_ID ||
    '';

  const rawEnvCreds =
    process.env.GOOGLE_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    '';

  // Helper to parse JSON string if user pasted full credentials JSON
  const tryParseJson = (str: string) => {
    if (!str) return null;
    const trimmed = str.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('"{') && trimmed.endsWith('}"'))) {
      try {
        const unquoted = trimmed.startsWith('"{') ? JSON.parse(trimmed) : trimmed;
        return typeof unquoted === 'object' ? unquoted : JSON.parse(unquoted);
      } catch {
        return null;
      }
    }
    // Also test base64-encoded JSON
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8').trim();
      if (decoded.startsWith('{') && decoded.endsWith('}')) {
        return JSON.parse(decoded);
      }
    } catch {}
    return null;
  };

  const parsedKey = tryParseJson(key);
  const parsedEmail = tryParseJson(email);
  const parsedSheet = tryParseJson(spreadsheetId);
  const parsedEnv = tryParseJson(rawEnvCreds);
  const json = parsedKey || parsedEmail || parsedSheet || parsedEnv;

  if (json) {
    if (json.client_email) email = json.client_email;
    if (json.private_key) key = json.private_key;
    if (json.spreadsheet_id || json.sheet_id) spreadsheetId = json.spreadsheet_id || json.sheet_id;
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

/**
 * Safe version that extracts credentials without throwing, useful for status checks.
 */
export function extractCredentialsSafely(config?: GoogleSheetsConfig) {
  try {
    return extractCredentials(config);
  } catch {
    // Collect whatever partial values are present
    let email =
      config?.clientEmail ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      process.env.GOOGLE_CLIENT_EMAIL ||
      process.env.CLIENT_EMAIL ||
      process.env.GOOGLE_EMAIL ||
      '';
    let spreadsheetId =
      config?.spreadsheetId ||
      process.env.GOOGLE_SHEET_ID ||
      process.env.GOOGLE_SPREADSHEET_ID ||
      process.env.SPREADSHEET_ID ||
      process.env.SHEET_ID ||
      '';
    return { email: email.trim(), key: '', spreadsheetId: spreadsheetId.trim() };
  }
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
      range: 'Reuniões!A1:R1',
      values: [['ID Reunião', 'Data', 'ID Prof', 'Professor', 'ID Disciplina', 'Disciplina', 'ID Turma', 'Turma', 'Bimestre', 'Periodicidade', 'Quinzena', 'Razão Principal', 'Contexto Pedagógico', 'Tópicos Concluídos', 'Qtd Encaminhamentos', 'Progresso Tópicos JSON', 'Verificação Anterior JSON', 'Coordenador']]
    },
    {
      tab: 'Encaminhamentos',
      range: 'Encaminhamentos!A1:M1',
      values: [['ID Encaminhamento', 'ID Reunião', 'ID Prof', 'Professor', 'ID Disciplina', 'Disciplina', 'ID Turma', 'Turma', 'Descrição da Ação', 'Categoria', 'Data Criação', 'Previsão Quinzena', 'Status']]
    }
  ];

  for (const h of headers) {
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

  await ensureSheetHeaders(sheets, spreadsheetId);

  // 1. Professores
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Professores!A2:Z1000' }).catch(() => {});
  if (data.teachers && data.teachers.length > 0) {
    const rows = data.teachers.map(t => [
      t.id,
      t.name,
      t.email,
      t.avatarUrl || '',
      (t.subjects || []).join(', '),
      (t.classes || []).join(', ')
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Professores!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  // 2. Turmas
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Turmas!A2:Z1000' }).catch(() => {});
  if (data.classGroups && data.classGroups.length > 0) {
    const rows = data.classGroups.map(c => [
      c.id,
      c.name,
      c.shift,
      c.totalStudents
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Turmas!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  // 3. Disciplinas
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Disciplinas!A2:Z1000' }).catch(() => {});
  if (data.subjects && data.subjects.length > 0) {
    const rows = data.subjects.map(s => [
      s.id,
      s.name,
      s.code,
      s.color,
      s.totalWorkloadHours
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Disciplinas!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  // 4. Planejamentos
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Planejamento!A2:Z3000' }).catch(() => {});
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
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Planejamento!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: planRows }
      });
    }
  }

  // 5. Reuniões
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Reuniões!A2:Z2000' }).catch(() => {});
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
      (m.newActions || []).length,
      JSON.stringify(m.topicProgress || []),
      JSON.stringify(m.previousActionsVerification || []),
      m.coordinatorName || ''
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Reuniões!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: meetingRows }
    });
  }

  // 6. Encaminhamentos
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Encaminhamentos!A2:Z2000' }).catch(() => {});
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
 * Appends a single meeting and its actions to Google Sheets
 */
export async function appendMeetingToSheet(meeting: any, config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);
  await ensureSheetHeaders(sheets, spreadsheetId);

  const meetingRow = [
    meeting.id,
    meeting.meetingDate,
    meeting.teacherId,
    meeting.teacherName,
    meeting.subjectId,
    meeting.subjectName,
    meeting.classGroupId,
    meeting.classGroupName,
    meeting.bimester,
    meeting.periodicity || 'QUINZENAL',
    meeting.fortnightPeriod,
    meeting.primaryReason || (meeting.pedagogicalReasons || []).join(', '),
    meeting.pedagogicalContextNotes,
    (meeting.topicProgress || []).filter((t: any) => t.status === 'CONCLUIDO').length,
    (meeting.newActions || []).length,
    JSON.stringify(meeting.topicProgress || []),
    JSON.stringify(meeting.previousActionsVerification || []),
    meeting.coordinatorName || ''
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Reuniões!A2',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [meetingRow]
    }
  });

  if (meeting.newActions && meeting.newActions.length > 0) {
    const actionRows = meeting.newActions.map((act: any) => [
      act.id,
      meeting.id,
      meeting.teacherId,
      meeting.teacherName,
      meeting.subjectId,
      meeting.subjectName,
      meeting.classGroupId,
      meeting.classGroupName,
      act.description,
      act.category,
      act.createdDate || meeting.meetingDate,
      act.targetMeetingPeriod,
      act.status || 'PENDENTE'
    ]);

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

  return { success: true };
}

/**
 * Updates an action's status directly in the Encaminhamentos sheet
 */
export async function updateActionStatusInSheet(actionId: string, newStatus: string, config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Encaminhamentos!A2:M1000'
  }).catch(() => ({ data: { values: [] } }));

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r: any[]) => r[0] === actionId);

  if (rowIndex !== -1) {
    const sheetRowNumber = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Encaminhamentos!M${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newStatus]]
      }
    });
    return { success: true, updatedRow: sheetRowNumber };
  }

  return { success: false, error: 'Ação não localizada na planilha' };
}

/**
 * Appends multiple meetings and actions to the Google Sheet
 */
export async function appendMeetingsToSheet(meetings: any[], config?: GoogleSheetsConfig) {
  const { sheets, spreadsheetId } = getSheetsClient(config);
  await ensureSheetHeaders(sheets, spreadsheetId);

  const meetingRows = meetings.map(m => [
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
    (m.newActions || []).length,
    JSON.stringify(m.topicProgress || []),
    JSON.stringify(m.previousActionsVerification || []),
    m.coordinatorName || ''
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

  const actionRows: any[] = [];
  meetings.forEach(m => {
    (m.newActions || []).forEach((act: any) => {
      actionRows.push([
        act.id,
        m.id,
        m.teacherId,
        m.teacherName,
        m.subjectId,
        m.subjectName,
        m.classGroupId,
        m.classGroupName,
        act.description,
        act.category,
        act.createdDate || m.meetingDate,
        act.targetMeetingPeriod,
        act.status || 'PENDENTE'
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
    getTabValues('Professores', 'A2:F1000'),
    getTabValues('Turmas', 'A2:D1000'),
    getTabValues('Disciplinas', 'A2:E1000'),
    getTabValues('Planejamento', 'A2:M3000'),
    getTabValues('Reuniões', 'A2:R2000'),
    getTabValues('Encaminhamentos', 'A2:M2000')
  ]);

  const clean = (val: any) => (val === undefined || val === null ? '' : String(val).trim());
  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);

  // Parse Teachers
  const teachers = rawTeachers.map((row: any[], index: number) => {
    const name = clean(row[1]);
    const id = clean(row[0]) || (name ? `prof-${slugify(name)}` : `prof-${index + 1}`);
    const email = clean(row[2]) || '';
    const avatarUrl = clean(row[3]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
    const subjects = clean(row[4]).split(',').map(s => s.trim()).filter(Boolean);
    const classes = clean(row[5]).split(',').map(c => c.trim()).filter(Boolean);

    return { id, name, email, avatarUrl, subjects, classes };
  }).filter(t => t.name);

  // Parse Classes
  const classGroups = rawClasses.map((row: any[], index: number) => {
    const name = clean(row[1]);
    const id = clean(row[0]) || (name ? `turma-${slugify(name)}` : `turma-${index + 1}`);
    const shift = clean(row[2]) || 'Matutino';
    const totalStudents = parseInt(clean(row[3]) || '30', 10) || 30;

    return { id, name, shift, totalStudents };
  }).filter(c => c.name);

  // Parse Subjects
  const subjects = rawSubjects.map((row: any[], index: number) => {
    const name = clean(row[1]);
    const id = clean(row[0]) || (name ? `disc-${slugify(name)}` : `disc-${index + 1}`);
    const code = clean(row[2]) || id.toUpperCase();
    const color = clean(row[3]) || '#2563eb';
    const totalWorkloadHours = parseInt(clean(row[4]) || '80', 10) || 80;

    return { id, name, code, color, totalWorkloadHours };
  }).filter(s => s.name);

  // Parse Bimonthly Plans
  const plansMap = new Map<string, any>();
  rawPlans.forEach((row: any[], index: number) => {
    const planId = clean(row[0]) || `plan-${index + 1}`;
    const teacherId = clean(row[1]);
    const subjectId = clean(row[2]);
    const classGroupId = clean(row[3]);
    const bimester = parseInt(clean(row[4]) || '1', 10) || 1;
    const year = parseInt(clean(row[5]) || '2026', 10) || 2026;

    if (!plansMap.has(planId)) {
      plansMap.set(planId, {
        id: planId,
        teacherId,
        subjectId,
        classGroupId,
        bimester,
        year,
        periodsMap: new Map<number, any>()
      });
    }

    const plan = plansMap.get(planId);
    const fortnightNum = parseInt(clean(row[6]) || '1', 10) || 1;
    const periodTitle = clean(row[7]) || `${fortnightNum}ª Quinzena`;

    if (!plan.periodsMap.has(fortnightNum)) {
      plan.periodsMap.set(fortnightNum, {
        fortnightNumber: fortnightNum,
        periodTitle,
        topics: []
      });
    }

    const period = plan.periodsMap.get(fortnightNum);
    const topicId = clean(row[8]);
    const topicTitle = clean(row[9]);

    if (topicTitle || topicId) {
      period.topics.push({
        id: topicId || `top-${slugify(topicTitle)}`,
        title: topicTitle,
        bnccCode: clean(row[10]),
        estimatedHours: parseInt(clean(row[11]) || '6', 10) || 6,
        unitTitle: clean(row[12])
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
  const actions = rawActions.map((row: any[], index: number) => {
    const description = clean(row[8]);
    const id = clean(row[0]) || (description ? `act-${slugify(description).slice(0, 10)}-${index + 1}` : `act-${index + 1}`);

    return {
      id,
      meetingId: clean(row[1]),
      teacherId: clean(row[2]),
      teacherName: clean(row[3]),
      subjectId: clean(row[4]),
      subjectName: clean(row[5]),
      classGroupId: clean(row[6]),
      classGroupName: clean(row[7]),
      description,
      category: clean(row[9]) || 'OUTROS',
      createdDate: clean(row[10]) || new Date().toISOString().split('T')[0],
      targetMeetingPeriod: clean(row[11]) || 'Próxima Quinzena',
      status: clean(row[12]) || 'PENDENTE'
    };
  }).filter(a => a.description);

  // Parse Meetings
  const meetings = rawMeetings.map((row: any[], index: number) => {
    const meetingDate = clean(row[1]);
    const teacherName = clean(row[3]);
    const id = clean(row[0]) || `meet-${index + 1}`;

    let topicProgress: any[] = [];
    try {
      if (row[15]) {
        topicProgress = JSON.parse(row[15]);
      }
    } catch {}

    let previousActionsVerification: any[] = [];
    try {
      if (row[16]) {
        previousActionsVerification = JSON.parse(row[16]);
      }
    } catch {}

    const coordinatorName = clean(row[17]) || 'Coordenação Pedagógica';
    const primaryReason = clean(row[11]) || 'RITMO_ADEQUADO';
    const hasDeviation = primaryReason !== 'RITMO_ADEQUADO';

    return {
      id,
      meetingDate: meetingDate || new Date().toISOString().split('T')[0],
      teacherId: clean(row[2]),
      teacherName,
      subjectId: clean(row[4]),
      subjectName: clean(row[5]),
      classGroupId: clean(row[6]),
      classGroupName: clean(row[7]),
      bimester: parseInt(clean(row[8]) || '1', 10) || 1,
      periodicity: clean(row[9]) || 'QUINZENAL',
      fortnightPeriod: clean(row[10]),
      hasDeviation,
      primaryReason,
      pedagogicalContextNotes: clean(row[12]),
      coordinatorName,
      topicProgress,
      previousActionsVerification,
      newActions: actions.filter(a => a.meetingId === id)
    };
  }).filter(m => m.teacherName || m.meetingDate);

  return {
    success: true,
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

