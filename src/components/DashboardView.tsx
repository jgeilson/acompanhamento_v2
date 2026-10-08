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
  Sparkles,
  CheckSquare,
  Activity,
  Layers,
  AlertTriangle,
  Check
} from 'lucide-react';
import { 
  BiweeklyMeeting, 
  PedagogicalAction, 
  Teacher, 
  ClassGroup, 
  ActiveTab,
  PEDAGOGICAL_REASON_OPTIONS
} from '../types';

interface DashboardViewProps {
  meetings: BiweeklyMeeting[];
  actions: PedagogicalAction[];
  teachers: Teacher[];
  classGroups: ClassGroup[];
  onOpenNewMeeting: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectMeetingDetail: (meeting: BiweeklyMeeting) => void;
  isSheetsConfigured?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  meetings,
  actions,
  teachers,
  classGroups,
  onOpenNewMeeting,
  onNavigateTab,
  onSelectMeetingDetail
}) => {
  // 1. Level 1: Quick Overview Metrics
  const totalMeetings = meetings.length;
  const pendingActions = actions.filter(a => a.status === 'PENDENTE' || a.status === 'EM_ANDAMENTO');
  
  // Teachers who had at least one meeting
  const activeTeacherIds = new Set(meetings.map(m => m.teacherId));
  const teachersMetCount = activeTeacherIds.size;
  const totalTeachersCount = teachers.length || 1;

  // Class groups that had at least one meeting
  const activeClassGroupIds = new Set(meetings.map(m => m.classGroupId));
  const classesMetCount = activeClassGroupIds.size;
  const totalClassesCount = classGroups.length || 1;

  // 2. Class Status Evaluation (Situação por Turma)
  // For each class group, analyze recent meetings
  const classStatuses = classGroups.map(cls => {
    const classMeetings = meetings.filter(m => m.classGroupId === cls.id);
    if (classMeetings.length === 0) {
      return {
        classGroup: cls,
        status: 'REGULAR' as 'REGULAR' | 'ATENCAO' | 'PRIORIDADE',
        badge: '🟢 Regular',
        note: 'Aguardando primeiro acompanhamento'
      };
    }

    // Check for consecutive recoveries or pending persistent actions
    const hasRecentRecovery = classMeetings.some(m => 
      m.primaryReason === 'DIFICULDADE_APRENDIZAGEM_RETOMADA' ||
      (m.topicProgress && m.topicProgress.some(tp => tp.status === 'RETOMADA'))
    );
    const classPendingActions = actions.filter(a => a.classGroupId === cls.id && a.status !== 'SUPERADA');

    if (classPendingActions.length >= 2 || (hasRecentRecovery && classMeetings.length >= 2)) {
      return {
        classGroup: cls,
        status: 'ATENCAO' as const,
        badge: '🟡 Atenção',
        note: classPendingActions.length >= 2 ? `${classPendingActions.length} encaminhamentos pendentes` : 'Retomadas recorrentes de conteúdos'
      };
    }

    return {
      classGroup: cls,
      status: 'REGULAR' as const,
      badge: '🟢 Regular',
      note: 'Acompanhamento dentro do esperado'
    };
  });

  // Count attention situations
  const attentionCount = classStatuses.filter(s => s.status === 'ATENCAO' || s.status === 'PRIORIDADE').length +
    pendingActions.filter(a => a.status === 'PENDENTE').length;

  // 3. Attention Items (Atenção da Coordenação)
  const recurrentRecoveryMeetings = meetings.filter(m => m.primaryReason === 'DIFICULDADE_APRENDIZAGEM_RETOMADA');
  const persistentActions = actions.filter(a => a.status === 'PENDENTE');

  // 4. Planning Adherence Estimation
  const adequateRhythmCount = meetings.filter(m => m.primaryReason === 'RITMO_ADEQUADO' || !m.primaryReason).length;
  const adherenceRate = totalMeetings > 0 ? Math.round((adequateRhythmCount / totalMeetings) * 100) : 100;

  // 5. Pedagogical Reasons Distribution
  const reasonCounts: Record<string, number> = {};
  meetings.forEach(m => {
    const reason = m.primaryReason || 'RITMO_ADEQUADO';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const sortedReasons = Object.entries(reasonCounts)
    .map(([id, count]) => {
      const opt = PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === id);
      return {
        name: opt ? opt.badgeText : id,
        count,
        percentage: totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0
      };
    })
    .sort((a, b) => b.count - a.count);

  // 6. Recent Positive Evolutions (Derived from Superated actions or concluded topics)
  const recentSuperatedActions = actions.filter(a => a.status === 'SUPERADA').slice(0, 3);
  
  // 7. Recent Movements (Last 4 meetings)
  const recentMeetingsList = [...meetings]
    .sort((a, b) => new Date(b.meetingDate || '').getTime() - new Date(a.meetingDate || '').getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-100">
              Painel Geral de Acompanhamento
            </h2>
          </div>
        </div>
      </div>

      {/* Level 1: Visão Geral do Acompanhamento (Top KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Professores Acompanhados</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-display">{teachersMetCount}</span>
            <span className="text-xs font-semibold text-slate-400">/ {totalTeachersCount} ativos</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Turmas Acompanhadas</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-display">{classesMetCount}</span>
            <span className="text-xs font-semibold text-slate-400">/ {totalClassesCount} total</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reuniões Registradas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-display">{totalMeetings}</span>
            <span className="text-xs font-semibold text-emerald-600">atas salvas</span>
          </div>
        </div>

        {/* KPI 4: Situações de Atenção (Crucial KPI) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Exigem Atenção</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 font-display">{attentionCount}</span>
            <span className="text-xs font-semibold text-amber-500">casos pendentes</span>
          </div>
        </div>

      </div>

      {/* Main Element: Atenção da Coordenação */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">🔎 Alertas da Coordenação</h3>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
            {recurrentRecoveryMeetings.length + persistentActions.length} alertas ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <span>🟡</span>
                <span>Disciplinas com retomada recorrente de conteúdo</span>
              </div>
              <p className="text-[11px] text-amber-700">
                {recurrentRecoveryMeetings.length} encontros apontaram necessidade de recomposição de aprendizagem.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                <span>🔴</span>
                <span>Encaminhamentos pendentes há mais de um ciclo</span>
              </div>
              <p className="text-[11px] text-rose-700">
                {persistentActions.length} combinados aguardando reavaliação ou conclusão.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('actions')}
              className="text-xs font-bold text-rose-800 hover:text-rose-950 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Grid for Class Status & Planning Adherence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Situação por Turma (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Visão Resumida por Turma
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2.5 font-bold">Turma</th>
                  <th className="pb-2.5 font-bold">Situação</th>
                  <th className="pb-2.5 font-bold">Observação Pedagógica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classStatuses.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{item.classGroup.name}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${
                        item.status === 'ATENCAO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        item.status === 'PRIORIDADE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {item.badge}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aderência ao Planejamento & Evoluções (1 col) */}
        <div className="space-y-6">
          
          {/* Adherence Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Ritmo previsto vs. executado
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-bold text-slate-700">Índice de Ritmo Adequado</span>
                <span className="font-extrabold text-emerald-600 text-sm">{adherenceRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${adherenceRate}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {adequateRhythmCount} de {totalMeetings} encontros mantiveram o planejamento dentro do cronograma bimestral.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('timeline')}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ver Linha do Tempo Detalhada</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Evoluções Recentes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              🟢 Evoluções Recentes
            </h3>

            <div className="space-y-2.5 pt-1">
              {recentSuperatedActions.length > 0 ? (
                recentSuperatedActions.map((action, idx) => (
                  <div key={idx} className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-1">
                    <div className="font-bold text-emerald-900">Encaminhamento Concluído</div>
                    <p className="text-[11px] text-emerald-700 line-clamp-2">&ldquo;{action.description}&rdquo;</p>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
                  Nenhuma evolução recente registrada. Os encontros continuam em monitoramento.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Secondary Section: Reasons Breakdown & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Why rhythm changes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Por que o ritmo está mudando?
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {sortedReasons.length > 0 ? (
              sortedReasons.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{item.name}</span>
                    <span className="font-semibold text-slate-500">{item.count} encontro(s) ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-4">Nenhum motivo registrado.</div>
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Últimos Movimentos
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('meetings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {recentMeetingsList.length > 0 ? (
              recentMeetingsList.map((m, idx) => (
                <div 
                  key={idx}
                  onClick={() => onSelectMeetingDetail(m)}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span>{m.subjectName || 'Disciplina'}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-indigo-600">{m.classGroupName || 'Turma'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {m.meetingDate ? new Date(m.meetingDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data não informada'} • {m.fortnightPeriod}
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                    m.primaryReason === 'RITMO_ADEQUADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {m.primaryReason === 'RITMO_ADEQUADO' ? '🟢 Adequado' : '🟡 Ajuste'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">
                Nenhum acompanhamento registrado ainda.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
