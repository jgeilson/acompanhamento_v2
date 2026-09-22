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
  ShieldCheck,
  ShieldAlert,
  Server,
  Lock,
  Database,
  Info
} from 'lucide-react';
import { 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction 
} from '../types';
import { sheetsService, ServerSheetsStatus } from '../services/sheetsService';

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
  const [serverStatus, setServerStatus] = useState<ServerSheetsStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [showConfigGuide, setShowConfigGuide] = useState<boolean>(false);

  // Fetch server status on mount / open
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await sheetsService.getStatus();
      setServerStatus(data);
      if (data.isConfigured) {
        setConnectionStatus('success');
        setStatusMessage('Credenciais do Google Sheets ativas e protegidas no servidor.');
      } else {
        setConnectionStatus('idle');
      }
    } catch (err: any) {
      setServerStatus({ isConfigured: false, error: 'Não foi possível consultar o status do servidor.' });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setStatusMessage('Verificando conexão segura com a API do Google Sheets...');
    setSyncResult(null);

    try {
      const data = await sheetsService.testConnection();

      if (data?.success) {
        setConnectionStatus('success');
        setSpreadsheetTitle(data.title || 'Planilha Google Conectada');
        setStatusMessage('Conexão autenticada pelo servidor com sucesso! Estrutura de abas verificada.');
        fetchStatus();
      } else {
        setConnectionStatus('error');
        setStatusMessage(data?.error || 'Falha ao autenticar no servidor.');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setStatusMessage(`Falha na comunicação com o servidor: ${err.message}`);
    }
  };

  const handleLoadAllFromSheets = async () => {
    setIsFetching(true);
    setSyncResult(null);

    try {
      const data = await sheetsService.loadAll();

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
        const encs = data.rawCounts?.actions ?? (data.actions?.length || 0);

        setSyncResult(`Dados carregados da nuvem: ${profs} prof(s), ${turmas} turma(s), ${planos} plano(s), ${reunioes} reunião(ões) e ${encs} encaminhamento(s).`);
      } else {
        alert(`Erro ao carregar dados da planilha: ${data?.error || 'Formato inválido'}`);
      }
    } catch (err: any) {
      alert(`Erro de comunicação com o servidor: ${err.message || 'Verifique a conexão.'}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSyncAllData = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const data = await sheetsService.syncAll({
        teachers,
        subjects,
        classGroups,
        bimonthlyPlans,
        meetings,
        actions
      });

      if (data.success) {
        setSyncResult(`Sincronização total concluída! Todos os dados (${teachers.length} docentes, ${classGroups.length} turmas, ${bimonthlyPlans.length} planos, ${meetings.length} reuniões, ${actions.length} encaminhamentos) foram gravados nas abas da Planilha.`);
      } else {
        alert(`Erro na sincronização: ${data.error}`);
      }
    } catch (err) {
      alert('Falha de conexão ao sincronizar com a Planilha Google.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">
                  Integração com Google Sheets
                </h3>
                <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" /> Servidor Seguro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincronização bidirecional em nuvem para todas as abas pedagógicas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Security Notice Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-emerald-900">
                Credenciais Protegidas no Servidor (Zero-Exposure)
              </h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                As chaves de acesso da Conta de Serviço e tokens de autenticação ficam isoladas exclusivamente nas variáveis de ambiente do backend. O navegador não armazena nem transmite chaves privadas, garantindo a integridade dos dados escolares.
              </p>
            </div>
          </div>

          {/* Server Configuration Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Status do Servidor Backend
              </h4>

              {serverStatus?.spreadsheetUrl && (
                <a
                  href={serverStatus.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <span>Abrir Planilha Google</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {isLoadingStatus ? (
              <div className="p-3 flex items-center gap-2 text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                <span>Consultando status das credenciais no servidor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-500 font-medium">Conta de Serviço</div>
                  <div className="font-mono text-[11px] font-semibold text-slate-800 truncate mt-0.5" title={serverStatus?.clientEmailMasked || 'Não configurado'}>
                    {serverStatus?.hasEmail ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {serverStatus.clientEmailMasked}
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-500 font-medium">Chave Privada RSA</div>
                  <div className="text-[11px] font-semibold text-slate-800 truncate mt-0.5">
                    {serverStatus?.hasKey ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Carregada no Servidor
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Não Detectada
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-500 font-medium">ID da Planilha</div>
                  <div className="font-mono text-[11px] font-semibold text-slate-800 truncate mt-0.5">
                    {serverStatus?.hasSheetId ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {serverStatus.spreadsheetIdMasked || 'Definido'}
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Test Connection Button */}
            <div className="pt-1">
              <button
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors w-full justify-center shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>{connectionStatus === 'testing' ? 'Testando Conexão...' : 'Testar Conexão com a Planilha'}</span>
              </button>
            </div>

            {/* Connection Feedback Banner */}
            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                connectionStatus === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                connectionStatus === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' :
                'bg-blue-50 border-blue-300 text-blue-900'
              }`}>
                {connectionStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                {connectionStatus === 'error' && <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                {connectionStatus === 'testing' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0 mt-0.5" />}
                <div className="space-y-0.5">
                  {spreadsheetTitle && <div className="font-bold text-xs">{spreadsheetTitle}</div>}
                  <p className="text-[11px] leading-relaxed">{statusMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Synchronize Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Download / Read Card */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-950 text-xs">
                  <DownloadCloud className="w-4 h-4 text-indigo-700" />
                  <span>Carregar da Planilha (Download)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Lê todas as 6 abas (Professores, Turmas, Disciplinas, Planejamento, Reuniões, Encaminhamentos) da Planilha Google e preenche o aplicativo em tempo real.
                </p>
              </div>

              <button
                onClick={handleLoadAllFromSheets}
                disabled={isFetching}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 transition-all w-full"
              >
                <DownloadCloud className={`w-4 h-4 ${isFetching ? 'animate-bounce' : ''}`} />
                <span>{isFetching ? 'Carregando dados...' : 'Carregar Tudo da Planilha'}</span>
              </button>
            </div>

            {/* Upload / Sync All Card */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  <span>Gravar Base na Planilha (Upload)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Exporta e atualiza a base completa atual ({teachers.length} docentes, {classGroups.length} turmas, {meetings.length} reuniões) para as abas da Planilha Google.
                </p>
              </div>

              <button
                onClick={handleSyncAllData}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 transition-all w-full"
              >
                <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
                <span>{isSyncing ? 'Gravando dados...' : 'Gravar Tudo na Planilha'}</span>
              </button>
            </div>

          </div>

          {/* Sync Result Feedback */}
          {syncResult && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs">{syncResult}</span>
            </div>
          )}

          {/* Server Configuration Reference (Collapsible) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <button
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              className="w-full p-3 text-left font-semibold text-slate-700 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                Como configurar as credenciais no Servidor (.env)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {showConfigGuide ? 'Ocultar' : 'Exibir guia'}
              </span>
            </button>

            {showConfigGuide && (
              <div className="p-4 border-t border-slate-200 bg-white space-y-2 text-[11px] text-slate-600">
                <p>
                  No ambiente de hospedagem / servidor, configure as seguintes variáveis no arquivo <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">.env</code>:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-servico@projeto.iam.gserviceaccount.com</div>
                  <div>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----"</div>
                  <div>GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</div>
                </div>
                <p className="text-[10px] text-slate-500 pt-1">
                  Certifique-se de que a planilha no Google Drive está compartilhada com o <code className="font-mono text-slate-700">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> com permissão de <strong>Editor</strong>.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
