import React, { useState, useEffect } from 'react';
import { 
  History, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  MessageSquare,
  Users,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  Award,
  Sparkles,
  ArrowUpDown,
  PieChart
} from 'lucide-react';
import { 
  BiweeklyMeeting, 
  ClassGroup, 
  Subject, 
  Teacher,
  BimonthlyPlan,
  PEDAGOGICAL_REASON_OPTIONS,
  MEETING_PERIODICITY_OPTIONS
} from '../types';

interface PedagogicalTimelineViewProps {
  meetings: BiweeklyMeeting[];
  teachers: Teacher[];
  classGroups: ClassGroup[];
  subjects: Subject[];
  plans?: BimonthlyPlan[];
  onSelectMeetingDetail: (meeting: BiweeklyMeeting) => void;
  hideHeaderBanner?: boolean;
  initialTeacherId?: string;
}

export const PedagogicalTimelineView: React.FC<PedagogicalTimelineViewProps> = ({
  meetings,
  teachers,
  classGroups,
  subjects,
  plans = [],
  onSelectMeetingDetail,
  hideHeaderBanner = false,
  initialTeacherId
}) => {
  const [viewBy, setViewBy] = useState<'teacher' | 'class'>('teacher');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    initialTeacherId || teachers[0]?.id || ''
  );

  useEffect(() => {
    if (initialTeacherId) {
      setSelectedTeacherId(initialTeacherId);
      setViewBy('teacher');
    }
  }, [initialTeacherId]);
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>(classGroups[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  
  // Secondary filters for teacher view
  const [filterTeacherClassId, setFilterTeacherClassId] = useState<string>('');
  const [filterBimester, setFilterBimester] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const activeTeacher = teachers.find(t => t.id === selectedTeacherId);
  const activeClass = classGroups.find(c => c.id === selectedClassGroupId);
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);

  // Filter meetings based on view mode
  const filteredMeetings = meetings
    .filter(m => {
      if (viewBy === 'teacher') {
        if (!selectedTeacherId) return true;
        if (m.teacherId !== selectedTeacherId) return false;
        if (filterTeacherClassId && m.classGroupId !== filterTeacherClassId) return false;
        if (filterBimester && String(m.bimester) !== filterBimester) return false;
      } else {
        if (m.classGroupId !== selectedClassGroupId) return false;
        if (m.subjectId !== selectedSubjectId) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNotes = m.pedagogicalContextNotes?.toLowerCase().includes(q);
        const matchClass = m.classGroupName?.toLowerCase().includes(q);
        const matchSubject = m.subjectName?.toLowerCase().includes(q);
        const matchTopics = m.topicProgress?.some(t => t.topicTitle?.toLowerCase().includes(q));
        const matchActions = m.newActions?.some(a => a.description?.toLowerCase().includes(q));
        if (!matchNotes && !matchClass && !matchSubject && !matchTopics && !matchActions) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = a.meetingDate || '';
      const dateB = b.meetingDate || '';
      return sortOrder === 'desc' 
        ? dateB.localeCompare(dateA) 
        : dateA.localeCompare(dateB);
    });

  // Calculate teacher metrics
  const teacherMeetings = meetings.filter(m => m.teacherId === selectedTeacherId);
  const teacherVerifications = teacherMeetings.flatMap(m => m.previousActionsVerification || []);
  const totalVerifications = teacherVerifications.length;
  const superatedCount = teacherVerifications.filter(v => v.verificationResult === 'SUPERADA').length;
  const partiallyCount = teacherVerifications.filter(v => v.verificationResult === 'PARCIALMENTE_SUPERADA').length;
  const superationRate = totalVerifications > 0 ? Math.round(((superatedCount + partiallyCount * 0.5) / totalVerifications) * 100) : null;

  // Most frequent pedagogical reasons for active teacher
  const reasonFrequency: Record<string, number> = {};
  teacherMeetings.forEach(m => {
    const reasons = m.pedagogicalReasons && m.pedagogicalReasons.length > 0
      ? m.pedagogicalReasons
      : [m.primaryReason];
    reasons.forEach(r => {
      if (r) reasonFrequency[r] = (reasonFrequency[r] || 0) + 1;
    });
  });

  const teacherClasses = activeTeacher 
    ? classGroups.filter(c => activeTeacher.classes?.includes(c.id))
    : [];

  // --- Calculations for Class View Summary ---
  const classMeetingsAll = meetings.filter(m => m.classGroupId === selectedClassGroupId);

  const classPlansAll = (plans || []).filter(p => 
    p.classGroupId === selectedClassGroupId || p.classGroupIds?.includes(selectedClassGroupId)
  );

  const totalPlannedTopicsCount = classPlansAll.reduce((acc, plan) => {
    const periodTopics = plan.periods?.reduce((pAcc, period) => pAcc + (period.topics?.length || 0), 0) || 0;
    return acc + periodTopics;
  }, 0);

  const executedTopicsSet = new Set<string>();
  classMeetingsAll.forEach(m => {
    m.topicProgress?.forEach(tp => {
      if (tp.status === 'CONCLUIDO' || tp.status === 'EM_ANDAMENTO' || tp.status === 'RETOMADA') {
        executedTopicsSet.add(tp.topicTitle);
      }
    });
  });

  const planningFollowedPct = totalPlannedTopicsCount > 0
    ? Math.min(100, Math.round((executedTopicsSet.size / totalPlannedTopicsCount) * 100))
    : classMeetingsAll.length > 0 ? Math.min(100, Math.min(100, classMeetingsAll.length * 12 + 20)) : 0;

  const classSubjectSummaries = subjects.map(subject => {
    const subjectMeetings = classMeetingsAll.filter(m => m.subjectId === subject.id);
    const meetingCount = subjectMeetings.length;
    
    const sortedSubjectMeetings = [...subjectMeetings].sort((a, b) => (b.meetingDate || '').localeCompare(a.meetingDate || ''));
    const lastMeetingDate = sortedSubjectMeetings[0]?.meetingDate || null;
    
    const assignedTeacher = teachers.find(t => t.subjects?.includes(subject.id) && t.classes?.includes(selectedClassGroupId));
    const teacherName = sortedSubjectMeetings[0]?.teacherName || assignedTeacher?.name || 'Não atribuído';

    const hasRetomadaReason = subjectMeetings.some(m => 
      m.primaryReason === 'DIFICULDADE_APRENDIZAGEM_RETOMADA' || 
      m.pedagogicalReasons?.includes('DIFICULDADE_APRENDIZAGEM_RETOMADA')
    );

    const hasUnresolvedAction = subjectMeetings.some(m => 
      m.previousActionsVerification?.some(v => v.verificationResult === 'CONTINUA_PRESENTE' || v.verificationResult === 'PARCIALMENTE_SUPERADA')
    );

    let status: 'REGULAR' | 'ATENCAO' | 'SEM_REGISTRO' = 'REGULAR';
    let statusLabel = 'Regular';
    let statusBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let statusIcon = '🟢';

    if (meetingCount === 0) {
      status = 'SEM_REGISTRO';
      statusLabel = 'Pendente';
      statusBadgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
      statusIcon = '⚪';
    } else if (hasRetomadaReason || hasUnresolvedAction) {
      status = 'ATENCAO';
      statusLabel = 'Atenção';
      statusBadgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
      statusIcon = '🟡';
    } else {
      status = 'REGULAR';
      statusLabel = 'Regular';
      statusBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      statusIcon = '🟢';
    }

    return {
      subject,
      teacherName,
      meetingCount,
      lastMeetingDate,
      status,
      statusLabel,
      statusBadgeBg,
      statusIcon,
      hasRetomadaReason,
      hasUnresolvedAction
    };
  });

  const totalRegular = classSubjectSummaries.filter(s => s.status === 'REGULAR').length;
  const totalAtencao = classSubjectSummaries.filter(s => s.status === 'ATENCAO').length;
  const totalSemRegistro = classSubjectSummaries.filter(s => s.status === 'SEM_REGISTRO').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      {!hideHeaderBanner && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-100">
              Acompanhamento Pedagógico Contínuo
            </h2>
          </div>

          {/* Switch View Mode: Teacher vs Class */}
          <div className="flex items-center bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewBy('teacher')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewBy === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Por Professor</span>
            </button>
            <button
              onClick={() => setViewBy('class')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewBy === 'class'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Por Turma</span>
            </button>
          </div>
        </div>
      )}

      {/* Trajectory Profile Card (When viewing by Teacher) */}
      {viewBy === 'teacher' && activeTeacher && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            
            {/* Teacher Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {activeTeacher.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    {activeTeacher.name}
                  </h3>
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    Docente
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>{activeTeacher.email || 'Sem e-mail cadastrado'}</span>
                  <span>•</span>
                  <span>{teacherMeetings.length} reunião(ões) registrada(s)</span>
                </div>
              </div>
            </div>

            {/* Trajectory Highlights & Superation KPI */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center min-w-[100px]">
                <div className="text-xs text-slate-500 font-medium">Reuniões</div>
                <div className="text-base font-bold text-slate-900">{teacherMeetings.length}</div>
              </div>

              {superationRate !== null && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-center min-w-[110px]">
                  <div className="text-xs text-emerald-700 font-medium flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Superação</span>
                  </div>
                  <div className="text-base font-bold text-emerald-900">{superationRate}%</div>
                </div>
              )}

              {/* Recurring Pedagogical Reasons */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-3.5 py-2 max-w-sm hidden sm:block">
                <div className="text-[11px] text-indigo-900 font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" /> Fatores mais recorrentes:
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(reasonFrequency).slice(0, 2).map(([reasonId, count]) => {
                    const opt = PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === reasonId);
                    if (!opt) return null;
                    return (
                      <span key={reasonId} className="text-[10px] bg-white border border-indigo-200 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                        {opt.badgeText} ({count})
                      </span>
                    );
                  })}
                  {Object.keys(reasonFrequency).length === 0 && (
                    <span className="text-[10px] text-slate-400 italic">Nenhum registro ainda</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Teacher Selector & Sub-Filters */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-2xl border border-indigo-900/80 shadow-md space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>Painel de Seleção & Filtros de Acompanhamento</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Selecione para atualizar os dados abaixo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              
              {/* Choose Teacher */}
              <div className="lg:col-span-2">
                <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Selecionar Professor:</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    setFilterTeacherClassId('');
                  }}
                  className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold focus:bg-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer shadow-inner"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Teacher's Class */}
              <div>
                <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Turma:</label>
                <select
                  value={filterTeacherClassId}
                  onChange={(e) => setFilterTeacherClassId(e.target.value)}
                  className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold focus:bg-slate-800 focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
                >
                  <option value="" className="bg-slate-900 text-white">Todas as Turmas</option>
                  {teacherClasses.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Bimester */}
              <div>
                <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Bimestre:</label>
                <select
                  value={filterBimester}
                  onChange={(e) => setFilterBimester(e.target.value)}
                  className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold focus:bg-slate-800 focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
                >
                  <option value="" className="bg-slate-900 text-white">Todos os Bimestres</option>
                  <option value="1" className="bg-slate-900 text-white">1º Bimestre</option>
                  <option value="2" className="bg-slate-900 text-white">2º Bimestre</option>
                  <option value="3" className="bg-slate-900 text-white">3º Bimestre</option>
                  <option value="4" className="bg-slate-900 text-white">4º Bimestre</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Ordem:</label>
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="w-full bg-slate-800/90 border border-slate-700 hover:bg-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white font-bold flex items-center justify-between transition-colors cursor-pointer shadow-inner"
                >
                  <span>{sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-300" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Selectors Bar & Class Summary Card */}
      {viewBy === 'class' && (
        <div className="space-y-4">
          
          {/* Selectors Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-2xl border border-indigo-900/80 shadow-md space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>Painel de Seleção por Turma e Disciplina</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Escolha a turma e a disciplina em foco</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Selecione a Turma:</label>
                <select
                  value={selectedClassGroupId}
                  onChange={(e) => setSelectedClassGroupId(e.target.value)}
                  className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer shadow-inner"
                >
                  {classGroups.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name} ({c.shift})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Selecione a Disciplina em Foco:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer shadow-inner"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Class Executive Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            
            {/* Header & Main KPIs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span>Resumo do Acompanhamento: {activeClass?.name || 'Turma'}</span>
                  </h3>
                  <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                    {activeClass?.shift} • {activeClass?.totalStudents || 0} alunos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visão consolidada da evolução do planejamento e status pedagógico por disciplina.
                </p>
              </div>

              {/* KPI Pills */}
              <div className="flex items-center gap-3 flex-wrap">
                
                {/* Acompanhamentos Realizados */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-[120px]">
                  <div className="text-[11px] text-slate-500 font-medium">Acompanhamentos</div>
                  <div className="text-base font-bold text-slate-900 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>{classMeetingsAll.length}</span>
                  </div>
                </div>

                {/* Planejamento Acompanhado */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-4 py-2 min-w-[160px]">
                  <div className="text-[11px] text-indigo-900 font-medium flex items-center justify-between">
                    <span>Planejamento Acompanhado</span>
                    <span className="font-bold text-indigo-700">{planningFollowedPct}%</span>
                  </div>
                  <div className="w-full bg-indigo-200/60 h-2 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${planningFollowedPct}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[11px] space-y-0.5">
                  <div className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">Situação Geral</div>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="text-emerald-700 flex items-center gap-0.5">🟢 {totalRegular} Regular</span>
                    {totalAtencao > 0 && <span className="text-amber-700 flex items-center gap-0.5">🟡 {totalAtencao} Atenção</span>}
                    {totalSemRegistro > 0 && <span className="text-slate-500 flex items-center gap-0.5">⚪ {totalSemRegistro} Pendente</span>}
                  </div>
                </div>

              </div>
            </div>

            {/* Disciplina Status Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span className="flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  <span>Raio-X de Acompanhamento por Disciplina</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Clique na disciplina para filtrar a linha do tempo abaixo
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50/50">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200/80 text-[11px]">
                      <th className="py-2.5 px-3">Disciplina</th>
                      <th className="py-2.5 px-3">Professor(a)</th>
                      <th className="py-2.5 px-3 text-center">Encontros</th>
                      <th className="py-2.5 px-3 text-center">Último Acompanhamento</th>
                      <th className="py-2.5 px-3 text-center">Situação</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 bg-white">
                    {classSubjectSummaries.map(item => {
                      const isSelected = item.subject.id === selectedSubjectId;

                      return (
                        <tr 
                          key={item.subject.id}
                          onClick={() => setSelectedSubjectId(item.subject.id)}
                          className={`cursor-pointer transition-colors hover:bg-indigo-50/50 ${
                            isSelected ? 'bg-indigo-50/80 font-medium' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                style={{ backgroundColor: item.subject.color || '#6366f1' }}
                              />
                              <span className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {item.subject.name}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                                  Em foco
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-slate-600">
                            {item.teacherName}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                              item.meetingCount > 0 ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {item.meetingCount}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center text-slate-600 text-[11px]">
                            {item.lastMeetingDate ? item.lastMeetingDate : <span className="text-slate-400 italic">Sem registros</span>}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${item.statusBadgeBg}`}>
                              <span>{item.statusIcon}</span>
                              <span>{item.statusLabel}</span>
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubjectId(item.subject.id);
                              }}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-indigo-600'
                              }`}
                            >
                              {isSelected ? 'Em Foco' : 'Ver Linha do Tempo'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Search Filter for Timeline */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Pesquisar nos registros desta trajetória (tópicos, combinados, notas de contexto)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
        />
      </div>

      {/* Timeline Display */}
      {filteredMeetings.length > 0 ? (
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 sm:before:left-8 before:w-0.5 before:bg-indigo-100 before:z-0">
          
          {filteredMeetings.map((meeting, index) => {
            const reasonIds = meeting.pedagogicalReasons && meeting.pedagogicalReasons.length > 0
              ? meeting.pedagogicalReasons
              : [meeting.primaryReason];
            const reasonObjs = reasonIds
              .map(id => PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === id))
              .filter((o): o is NonNullable<typeof o> => Boolean(o));

            const periodicityObj = MEETING_PERIODICITY_OPTIONS.find(o => o.id === meeting.periodicity) ||
              MEETING_PERIODICITY_OPTIONS.find(o => o.id === 'REGULAR');

            const hasSuperated = meeting.previousActionsVerification?.some(v => v.verificationResult === 'SUPERADA');

            return (
              <div key={meeting.id} className="relative z-10 pl-12 sm:pl-16 space-y-3">
                
                {/* Timeline Dot Icon */}
                <div className={`absolute left-3 sm:left-5 top-1.5 w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-xs ${
                  hasSuperated 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 text-white'
                }`}>
                  {sortOrder === 'desc' ? filteredMeetings.length - index : index + 1}
                </div>

                {/* Main Timeline Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4 hover:border-indigo-200 transition-colors">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {periodicityObj && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${periodicityObj.badgeBg}`}>
                            {periodicityObj.label}
                          </span>
                        )}
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                          {meeting.fortnightPeriod || `${meeting.bimester}º Bimestre`}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {meeting.classGroupName} • {meeting.subjectName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{meeting.meetingDate}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1 flex items-center gap-1.5">
                        <span>Professor(a): {meeting.teacherName}</span>
                        {meeting.coordinatorName && (
                          <span className="text-slate-400 text-xs font-normal">
                            (Coord: {meeting.coordinatorName})
                          </span>
                        )}
                      </h3>
                    </div>

                    {reasonObjs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reasonObjs.map(r => (
                          <span key={r.id} className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${r.badgeBg}`}>
                            {r.badgeText}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 1. Previous Action Verifications (Evolução de Combinados Anteriores) */}
                  {meeting.previousActionsVerification && meeting.previousActionsVerification.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 text-xs space-y-2">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-amber-700" /> Acompanhamento de Combinados da Reunião Anterior:
                      </span>
                      <div className="space-y-2">
                        {meeting.previousActionsVerification.map(v => (
                          <div key={v.actionId} className="bg-white p-2.5 rounded-lg border border-amber-200/80 text-amber-950 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800">"{v.actionDescription}"</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                v.verificationResult === 'SUPERADA' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                v.verificationResult === 'PARCIALMENTE_SUPERADA' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {v.verificationResult === 'SUPERADA' ? '✓ Dificuldade Superada' :
                                 v.verificationResult === 'PARCIALMENTE_SUPERADA' ? '⏳ Parcialmente Superada' : '⚠️ Continua Presente'}
                              </span>
                            </div>
                            {v.notes && <p className="text-[11px] text-slate-600 mt-1 italic pl-1 border-l-2 border-amber-300">{v.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Topic Progression (Tópicos do Planejamento Trabalhados) */}
                  {meeting.topicProgress && meeting.topicProgress.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Tópicos Abordados no Período:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.topicProgress.map((tp, i) => (
                          <span 
                            key={i} 
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 ${
                              tp.status === 'CONCLUIDO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              tp.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              tp.status === 'RETOMADA' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{tp.topicTitle}</span>
                            <span className="text-[9px] font-bold opacity-75">
                              ({tp.status === 'CONCLUIDO' ? 'Concluído' : tp.status === 'EM_ANDAMENTO' ? 'Em andamento' : tp.status === 'RETOMADA' ? 'Retomada' : 'Não iniciado'})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Pedagogical Context & Teacher Reflection */}
                  {meeting.pedagogicalContextNotes && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Contexto & Reflexão Pedagógica Registrada:
                      </span>
                      <p className="text-slate-800 leading-relaxed italic">
                        "{meeting.pedagogicalContextNotes}"
                      </p>
                    </div>
                  )}

                  {/* 4. New Actions Created */}
                  {meeting.newActions && meeting.newActions.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Novos Encaminhamentos Pactuados:
                      </span>
                      <div className="space-y-1.5">
                        {meeting.newActions.map(act => (
                          <div key={act.id} className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200/80 text-indigo-950 flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">"{act.description}"</span>
                            <span className="text-[10px] font-bold bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                              Retomar em: {act.targetMeetingPeriod || 'Próximo Encontro'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      ID: {meeting.id.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => onSelectMeetingDetail(meeting)}
                      className="font-bold text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Ver Ata Completa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}

        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 shadow-xs">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhum registro encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {viewBy === 'teacher'
              ? `Ainda não há registros de reuniões pedagógicas para o(a) professor(a) ${activeTeacher?.name || ''} com os filtros selecionados.`
              : `Ainda não há registros de reuniões cadastrados para a turma ${activeClass?.name} na disciplina de ${activeSubject?.name}.`}
          </p>
        </div>
      )}

    </div>
  );
};

