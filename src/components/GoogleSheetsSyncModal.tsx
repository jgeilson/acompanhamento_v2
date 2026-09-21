import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink,
  KeyRound,
  Mail,
  Table,
  Layers,
  Database
} from 'lucide-react';
import { 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction 
} from '../types';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  bimonthlyPlans: BimonthlyPlan[];
  meetings: BiweeklyMeeting[];
  actions: PedagogicalAction[];
  onDataLoaded: (data: {
    teachers?: Teacher[];
    subjects?: Subject[];
    classGroups?: ClassGroup[];
    bimonthlyPlans?: BimonthlyPlan[];
    meetings?: BiweeklyMeeting[];
    actions?: PedagogicalAction[];
  }) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  teachers,
  subjects,
  classGroups,
  bimonthlyPlans,
  meetings,
  actions,
  onDataLoaded
}) => {
  const [clientEmail, setClientEmail] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchedData, setFetchedData] = useState<{ rawMeetings: any[]; rawActions: any[] } | null>(null);

  useEffect(() => {
    // Load existing env status or saved credentials from localStorage
    fetch('/api/sheets/status')
      .then(async res => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || contentType.includes('text/html')) {
          throw new Error('Endpoint de API não ativo no servidor (retornou HTML ou 404).');
        }
        return res.json();
      })
      .then(data => {
        if (data.isConfigured) {
          setClientEmail(data.clientEmail || '');
          setSpreadsheetId(data.spreadsheetId || '');
          setConnectionStatus('success');
          setStatusMessage('Conectado à Planilha Google via variáveis do servidor.');
        } else {
          // Fallback to localStorage
          const savedEmail = localStorage.getItem('gs_client_email') || '';
          const savedKey = localStorage.getItem('gs_private_key') || '';
          const savedSheetId = localStorage.getItem('gs_spreadsheet_id') || '';

          if (savedEmail) setClientEmail(savedEmail);
          if (savedKey) setPrivateKey(savedKey);
          if (savedSheetId) setSpreadsheetId(savedSheetId);
        }
      })
      .catch((err: any) => {
        // Fallback to localStorage
        const savedEmail = localStorage.getItem('gs_client_email') || '';
        const savedKey = localStorage.getItem('gs_private_key') || '';
        const savedSheetId = localStorage.getItem('gs_spreadsheet_id') || '';

        if (savedEmail) setClientEmail(savedEmail);
        if (savedKey) setPrivateKey(savedKey);
        if (savedSheetId) setSpreadsheetId(savedSheetId);

        if (err?.message?.includes('HTML')) {
          setStatusMessage('Aviso: As rotas de API do Vercel ainda não estão ativas neste deploy.');
        }
      });
  }, []);

  const handleSpreadsheetIdChange = (val: string) => {
    let cleanVal = val.trim();
    if (cleanVal.includes('/spreadsheets/d/')) {
      const match = cleanVal.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanVal = match[1];
      }
    }
    setSpreadsheetId(cleanVal);
  };

  const handlePrivateKeyChange = (val: string) => {
    setPrivateKey(val);
    try {
      const trimmed = val.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.client_email) setClientEmail(parsed.client_email);
        if (parsed.private_key) setPrivateKey(parsed.private_key);
        if (parsed.spreadsheet_id) setSpreadsheetId(parsed.spreadsheet_id);
      }
    } catch {}
  };

  const handleClientEmailChange = (val: string) => {
    setClientEmail(val);
    try {
      const trimmed = val.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.client_email) setClientEmail(parsed.client_email);
        if (parsed.private_key) setPrivateKey(parsed.private_key);
        if (parsed.spreadsheet_id) setSpreadsheetId(parsed.spreadsheet_id);
      }
    } catch {}
  };

  const saveCredentialsToLocalStorage = () => {
    if (clientEmail) localStorage.setItem('gs_client_email', clientEmail);
    if (privateKey) localStorage.setItem('gs_private_key', privateKey);
    if (spreadsheetId) localStorage.setItem('gs_spreadsheet_id', spreadsheetId);
  };

  const getConfigPayload = () => {
    return {
      clientEmail: clientEmail.trim() || undefined,
      privateKey: privateKey.trim() || undefined,
      spreadsheetId: spreadsheetId.trim() || undefined
    };
  };

  const executeLoadData = async () => {
    setIsFetching(true);
    setSyncResult(null);

    saveCredentialsToLocalStorage();

    try {
      const res = await fetch('/api/sheets/load-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: getConfigPayload() })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        alert(`Erro de comunicação com o servidor (Status ${res.status}).`);
        return;
      }

      if (data?.success || Array.isArray(data?.teachers)) {
        onDataLoaded({
          teachers: data.teachers,
          subjects: data.subjects,
          classGroups: data.classGroups,
          bimonthlyPlans: data.bimonthlyPlans,
          meetings: data.meetings,
          actions: data.actions
        });

        const profs = data.rawCounts?.teachers ?? (data.teachers?.length || 0);
        const turmas = data.rawCounts?.classGroups ?? (data.classGroups?.length || 0);
        const planos = data.rawCounts?.bimonthlyPlans ?? (data.bimonthlyPlans?.length || 0);
        const reunioes = data.rawCounts?.meetings ?? (data.meetings?.length || 0);

        setSyncResult(`Dados carregados da Planilha Google! ${profs} prof(s), ${turmas} turma(s), ${planos} plano(s) e ${reunioes} reunião(ões) sincronizados com o app.`);
        setStatusMessage(`Dados importados com sucesso! Abas ativas no app.`);
      } else {
        alert(`Erro ao carregar dados da planilha: ${data?.error || 'Formato inválido'}`);
      }
    } catch (err: any) {
      alert(`Erro de comunicação com o servidor: ${err.message || 'Verifique a conexão.'}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setStatusMessage('Verificando acesso à Planilha e estruturando abas...');
    setSyncResult(null);

    saveCredentialsToLocalStorage();

    try {
      const res = await fetch('/api/sheets/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getConfigPayload())
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setConnectionStatus('error');
        setStatusMessage(`Servidor retornou resposta inesperada (Status ${res.status}).`);
        return;
      }

      if (res.ok && data?.success) {
        setConnectionStatus('success');
        setSpreadsheetTitle(data.title || 'Planilha Conectada');
        setStatusMessage(`Conexão confirmada! Carregando dados das abas...`);
        // Automatically load the data immediately
        await executeLoadData();
      } else {
        setConnectionStatus('error');
        setStatusMessage(data?.error || `Não foi possível acessar a planilha (Status ${res.status}).`);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setStatusMessage(`Falha ao comunicar com o servidor: ${err.message}`);
    }
  };

  const handleSyncAllData = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    saveCredentialsToLocalStorage();

    try {
      const res = await fetch('/api/sheets/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            teachers,
            subjects,
            classGroups,
            bimonthlyPlans,
            meetings,
            actions
          },
          config: getConfigPayload()
        })
      });

      const data = await res.json();

      if (data.success) {
        setSyncResult(`Sincronização total concluída! Todos os professores, turmas, disciplinas, planejamentos, reuniões e encaminhamentos foram atualizados na Planilha Google.`);
      } else {
        alert(`Erro na sincronização: ${data.error}`);
      }
    } catch (err) {
      alert('Falha de conexão ao sincronizar tudo com a Planilha Google.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadAllFromSheets = async () => {
    await executeLoadData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/30 p-2 rounded-xl border border-emerald-400/30">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-100">
                Integração com Planilha Google (Google Sheets)
              </h3>
              <p className="text-xs text-emerald-200">
                Carregar e gravar professores, turmas, planejamentos, reuniões e ações
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Credentials Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              Credenciais da Conta de Serviço (Google Cloud Service Account)
            </h4>

            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ID da Planilha Google (Spreadsheet ID):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
                    placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms ou URL da planilha"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800"
                  />
                  {spreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> E-mail da Conta de Serviço (client_email):
                </label>
                <input
                  type="text"
                  value={clientEmail}
                  onChange={(e) => handleClientEmailChange(e.target.value)}
                  placeholder="Ex: meu-servico@meu-projeto.iam.gserviceaccount.com (ou cole o JSON completo)"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Chave Privada (private_key):
                </label>
                <textarea
                  rows={3}
                  value={privateKey}
                  onChange={(e) => handlePrivateKeyChange(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n(Você pode colar a chave ou o JSON de credenciais inteiro aqui)"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-[11px] font-mono text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 <strong>Dica:</strong> Se colar o arquivo JSON de credenciais baixado do Google Cloud em qualquer um dos campos, o sistema preencherá automaticamente o e-mail e a chave privada. Lembre-se de compartilhar a planilha no Google Drive com permissão de <strong>Editor</strong> para o e-mail da Conta de Serviço.
                </p>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors w-full justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
              <span>{connectionStatus === 'testing' ? 'Testando Conexão...' : 'Testar Conexão e Criar Abas da Planilha'}</span>
            </button>

            {/* Connection Feedback */}
            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                connectionStatus === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                connectionStatus === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' :
                'bg-blue-50 border-blue-300 text-blue-900'
              }`}>
                {connectionStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {connectionStatus === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                {connectionStatus === 'testing' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />}
                <div>
                  {spreadsheetTitle && <div className="font-bold text-xs">{spreadsheetTitle}</div>}
                  <p className="text-[11px]">{statusMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions Block: Export / Import */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Export Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-emerald-950 mb-1">
                  <UploadCloud className="w-5 h-5 text-emerald-700" />
                  <span>Gravar Tudo na Planilha</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Envia e atualiza todos os professores ({teachers.length}), turmas ({classGroups.length}), disciplinas ({subjects.length}), planejamentos ({bimonthlyPlans.length}), reuniões ({meetings.length}) e encaminhamentos ({actions.length}) para as 6 abas da Planilha Google.
                </p>
              </div>

              <button
                onClick={handleSyncAllData}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 transition-all w-full"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isSyncing ? 'Gravando dados...' : 'Gravar Todos os Dados na Planilha'}</span>
              </button>
            </div>

            {/* Import / Load Card */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-indigo-950 mb-1">
                  <DownloadCloud className="w-5 h-5 text-indigo-700" />
                  <span>Carregar Tudo da Planilha</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Lê todas as 6 abas da Planilha Google e preenche o aplicativo diretamente com os dados salvos na nuvem.
                </p>
              </div>

              <button
                onClick={handleLoadAllFromSheets}
                disabled={isFetching}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 transition-all w-full"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{isFetching ? 'Carregando dados...' : 'Carregar Tudo da Planilha'}</span>
              </button>
            </div>

          </div>

          {/* Sync Result Feedback */}
          {syncResult && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{syncResult}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

