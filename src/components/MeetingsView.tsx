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
  Trash2,
  AlertTriangle
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

interface MeetingsViewProps {
  meetings: BiweeklyMeeting[];
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  onOpenNewMeeting: () => void;
  onSelectMeetingDetail: (meeting: BiweeklyMeeting) => void;
  onDeleteMeeting?: (meetingId: string) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  teachers,
  subjects,
  classGroups,
  onOpenNewMeeting,
  onSelectMeetingDetail,
  onDeleteMeeting
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [meetingToDelete, setMeetingToDelete] = useState<BiweeklyMeeting | null>(null);
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
    if (selectedPeriodicityFilter) {
      const p = m.periodicity || 'REGULAR';
      if (p !== selectedPeriodicityFilter && (selectedPeriodicityFilter === 'REGULAR' ? p !== 'QUINZENAL' : true)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => (b.meetingDate || '').localeCompare(a.meetingDate || ''));

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Atas & Encontros
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Reuniões de Acompanhamento
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie e consulte todas as atas registradas com o corpo docente.
          </p>
        </div>

        <button
          onClick={onOpenNewMeeting}
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-indigo-200" />
          <span>Nova Reunião</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-2xl border border-indigo-900/80 shadow-md space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filtros de Busca e Seleção de Reuniões</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Selecione para filtrar os encontros cadastrados</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none shadow-inner"
            />
          </div>

          {/* Teacher Filter */}
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">Todos os Professores</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">Todas as Disciplinas</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">Todas as Turmas</option>
              {classGroups.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Periodicity Filter */}
          <div>
            <select
              value={selectedPeriodicityFilter}
              onChange={(e) => setSelectedPeriodicityFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">Todas as Frequências</option>
              {MEETING_PERIODICITY_OPTIONS.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.label}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Meetings Grid */}
      {filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => {
            const reasonObj = PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === meeting.primaryReason);
            const periodicityObj = MEETING_PERIODICITY_OPTIONS.find(o => o.id === meeting.periodicity) ||
              MEETING_PERIODICITY_OPTIONS.find(o => o.id === 'REGULAR');
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
                      {periodicityObj && (
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

                  <div className="flex items-center gap-2">
                    {onDeleteMeeting && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMeetingToDelete(meeting);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir Reunião"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectMeetingDetail(meeting)}
                      className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Ver Registro Completo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

      {/* Delete Meeting Confirmation Modal */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Reunião</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja realmente excluir a reunião de <strong>{meetingToDelete.teacherName}</strong> ({meetingToDelete.subjectName} - {meetingToDelete.classGroupName}) realizada em {meetingToDelete.meetingDate}?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMeeting && meetingToDelete) {
                    onDeleteMeeting(meetingToDelete.id);
                  }
                  setMeetingToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all shadow"
              >
                Excluir Reunião
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
