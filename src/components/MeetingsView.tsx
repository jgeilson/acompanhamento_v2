import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  PlusCircle, 
  ArrowRight, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  BookOpen,
  History
} from 'lucide-react';
import { 
  BiweeklyMeeting, 
  Teacher, 
  Subject, 
  ClassGroup, 
  PEDAGOGICAL_REASON_OPTIONS,
  MEETING_PERIODICITY_OPTIONS,
  MeetingPeriodicity 
} from '../types';
import { PedagogicalTimelineView } from './PedagogicalTimelineView';

interface MeetingsViewProps {
  meetings: BiweeklyMeeting[];
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  onOpenNewMeeting: () => void;
  onSelectMeetingDetail: (meeting: BiweeklyMeeting) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  teachers,
  subjects,
  classGroups,
  onOpenNewMeeting,
  onSelectMeetingDetail
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedPeriodicityFilter, setSelectedPeriodicityFilter] = useState<string>('');

  const filteredMeetings = meetings.filter(m => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTeacher = m.teacherName.toLowerCase().includes(q);
      const matchSubject = m.subjectName.toLowerCase().includes(q);
      const matchClass = m.classGroupName.toLowerCase().includes(q);
      const matchNotes = m.pedagogicalContextNotes.toLowerCase().includes(q);
      if (!matchTeacher && !matchSubject && !matchClass && !matchNotes) return false;
    }

    if (selectedTeacherFilter && m.teacherId !== selectedTeacherFilter) return false;
    if (selectedSubjectFilter && m.subjectId !== selectedSubjectFilter) return false;
    if (selectedClassFilter && m.classGroupId !== selectedClassFilter) return false;
    if (selectedPeriodicityFilter && (m.periodicity || 'QUINZENAL') !== selectedPeriodicityFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Reuniões de Acompanhamento
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Visão Geral</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Linha do Tempo</span>
            </button>
          </div>

          <button
            onClick={onOpenNewMeeting}
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-indigo-200" />
            <span>Iniciar Nova Reunião</span>
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <PedagogicalTimelineView
          meetings={meetings}
          classGroups={classGroups}
          subjects={subjects}
          onSelectMeetingDetail={onSelectMeetingDetail}
          hideHeaderBanner={true}
        />
      ) : (
        <>
          {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por professor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Teacher Filter */}
        <div>
          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white"
          >
            <option value="">Todos os Professores</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white"
          >
            <option value="">Todas as Disciplinas</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Class Filter */}
        <div>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white"
          >
            <option value="">Todas as Turmas</option>
            {classGroups.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Periodicity Filter */}
        <div>
          <select
            value={selectedPeriodicityFilter}
            onChange={(e) => setSelectedPeriodicityFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white font-semibold"
          >
            <option value="">Todas as Frequências</option>
            {MEETING_PERIODICITY_OPTIONS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Meetings Grid */}
      {filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => {
            const reasonObj = PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === meeting.primaryReason);
            const periodicityObj = MEETING_PERIODICITY_OPTIONS.find(o => o.id === (meeting.periodicity || 'QUINZENAL'));
            const completedCount = meeting.topicProgress.filter(t => t.status === 'CONCLUIDO').length;
            const totalTopics = meeting.topicProgress.length;

            return (
              <div 
                key={meeting.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {periodicityObj && meeting.periodicity && meeting.periodicity !== 'QUINZENAL' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${periodicityObj.badgeBg}`}>
                          {periodicityObj.label}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {meeting.fortnightPeriod}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium ml-auto">
                      {meeting.meetingDate}
                    </span>
                  </div>

                  {/* Teacher & Subject Info */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{meeting.teacherName}</h3>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      {meeting.subjectName} • <span className="text-slate-700 font-bold">{meeting.classGroupName}</span>
                    </p>
                  </div>

                  {/* Pedagogical Reasons Badges */}
                  {(() => {
                    const reasonIds = meeting.pedagogicalReasons && meeting.pedagogicalReasons.length > 0
                      ? meeting.pedagogicalReasons
                      : [meeting.primaryReason];
                    const reasonObjs = reasonIds
                      .map(id => PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === id))
                      .filter((o): o is NonNullable<typeof o> => Boolean(o));

                    return reasonObjs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {reasonObjs.map(r => (
                          <span key={r.id} className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${r.badgeBg}`}>
                            {r.badgeText}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* Context snippet */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contexto Pedagógico:</span>
                    <p className="italic line-clamp-3">"{meeting.pedagogicalContextNotes}"</p>
                  </div>

                  {/* Topic stats */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                    <span>Conteúdos Concluídos:</span>
                    <span className="font-bold text-slate-800">{completedCount} de {totalTopics} tópicos</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-semibold">
                    {meeting.newActions.length} encaminhamento(s)
                  </span>

                  <button
                    onClick={() => onSelectMeetingDetail(meeting)}
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Ver Registro Completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhuma reunião encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não há registros correspondentes aos filtros selecionados. Tente ajustar os parâmetros de busca ou inicie uma nova reunião.
          </p>
        </div>
      )}
        </>
      )}

    </div>
  );
};
