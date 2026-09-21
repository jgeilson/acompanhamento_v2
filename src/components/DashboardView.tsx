import React from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  PlusCircle, 
  HelpCircle,
  FileText,
  Sparkles,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  BiweeklyMeeting, 
  PedagogicalAction, 
  Teacher, 
  ClassGroup, 
  ActiveTab,
  PEDAGOGICAL_REASON_OPTIONS,
  MEETING_PERIODICITY_OPTIONS
} from '../types';

interface DashboardViewProps {
  meetings: BiweeklyMeeting[];
  actions: PedagogicalAction[];
  teachers: Teacher[];
  classGroups: ClassGroup[];
  onOpenNewMeeting: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectMeetingDetail: (meeting: BiweeklyMeeting) => void;
  onOpenSheetsSync?: () => void;
  isSheetsConfigured?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  meetings,
  actions,
  teachers,
  classGroups,
  onOpenNewMeeting,
  onNavigateTab,
  onSelectMeetingDetail,
  onOpenSheetsSync,
  isSheetsConfigured = false
}) => {
  // Metric Calculations
  const totalMeetings = meetings.length;
  const pendingActions = actions.filter(a => a.status === 'PENDENTE' || a.status === 'EM_ANDAMENTO');
  const superatedActions = actions.filter(a => a.status === 'SUPERADA');

  // Reason Distribution for Chart
  const reasonCounts: Record<string, number> = {};
  meetings.forEach(m => {
    const reason = m.primaryReason || 'RITMO_ADEQUADO';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const reasonChartData = PEDAGOGICAL_REASON_OPTIONS.map(opt => {
    return {
      name: opt.badgeText,
      value: reasonCounts[opt.id] || 0,
      color: opt.id === 'DIFICULDADE_APRENDIZAGEM_RETOMADA' ? '#f59e0b' :
             opt.id === 'ATIVIDADE_PRATICA_PROJETO' ? '#3b82f6' :
             opt.id === 'AVALIACAO_RECUPERACAO' ? '#8b5cf6' :
             opt.id === 'AJUSTE_CALENDARIO_EVENTO' ? '#64748b' :
             opt.id === 'RITMO_ADEQUADO' ? '#10b981' : '#6366f1'
    };
  }).filter(d => d.value > 0);

  // Status Actions Chart Data
  const actionsStatusData = [
    { name: 'Pendentes', total: actions.filter(a => a.status === 'PENDENTE').length, fill: '#f59e0b' },
    { name: 'Em Andamento', total: actions.filter(a => a.status === 'EM_ANDAMENTO').length, fill: '#3b82f6' },
    { name: 'Superadas', total: superatedActions.length, fill: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-100">
              Dados Geral
            </h2>
          </div>
        </div>
      </div>

      {/* Sheets Integration Notice when empty */}
      {totalMeetings === 0 && teachers.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-emerald-800/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">Integração Direta com Google Sheets</span>
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              Sincronize com sua Planilha Pedagógica
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O aplicativo está pronto e sem dados fictícios. Conecte sua Planilha Google para carregar automaticamente o corpo docente, turmas, disciplinas e planejamentos escolares, ou grave suas reuniões em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onOpenSheetsSync && (
              <button
                onClick={onOpenSheetsSync}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2"
              >
                <span>Conectar / Carregar Planilha</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      

      {/* Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reuniões Realizadas</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-display">{totalMeetings}</div>
            <p className="text-xs text-slate-500 mt-1">Registros de acompanhamento mantidos na memória</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encaminhamentos Ativos</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 font-display">{pendingActions.length}</div>
            <p className="text-xs text-slate-500 mt-1">Combinados para checar na próxima reunião</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações Superadas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 font-display">{superatedActions.length}</div>
            <p className="text-xs text-slate-500 mt-1">Encaminhamentos resolvidos e validados</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Corpo Docente Atendido</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-display">{teachers.length} professores</div>
            <p className="text-xs text-slate-500 mt-1">{classGroups.length} turmas acompanhadas</p>
          </div>
        </div>

      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Contexto Pedagógico dos Desvios */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Contexto Pedagógico do Andamento das Aulas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Motivos apontados para ajustes no ritmo das aulas e conteúdos
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {reasonChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reasonChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {reasonChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#cbd5e1' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum dado registrado até o momento.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Status dos Encaminhamentos Combinados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                Evolução dos Encaminhamentos Pedagógicos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Status das ações e intervenções pactuadas
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('actions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionsStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#cbd5e1' }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
                  {actionsStatusData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
