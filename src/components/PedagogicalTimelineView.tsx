import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { 
  BiweeklyMeeting, 
  ClassGroup, 
  Subject, 
  PEDAGOGICAL_REASON_OPTIONS,
  MEETING_PERIODICITY_OPTIONS
} from '../types';

interface PedagogicalTimelineViewProps {
  meetings: BiweeklyMeeting[];
  classGroups: ClassGroup[];
  subjects: Subject[];
  onSelectMeetingDetail: (meeting: BiweeklyMeeting) => void;
  hideHeaderBanner?: boolean;
}

export const PedagogicalTimelineView: React.FC<PedagogicalTimelineViewProps> = ({
  meetings,
  classGroups,
  subjects,
  onSelectMeetingDetail,
  hideHeaderBanner = false
}) => {
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>(classGroups[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');

  const activeClass = classGroups.find(c => c.id === selectedClassGroupId);
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);

  // Filter meetings for this specific class and subject in chronological order
  const timelineMeetings = meetings
    .filter(m => m.classGroupId === selectedClassGroupId && m.subjectId === selectedSubjectId)
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      {!hideHeaderBanner && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> Memória da Aprendizagem
              </span>
              <span className="text-xs text-slate-400">Linha Histórica da Turma</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-100">
              Linha do Tempo Pedagógica
            </h2>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-slate-200 font-bold">Registro de Trajetória</div>
              <div className="text-slate-400 text-[11px]">Memória contínua da escola</div>
            </div>
          </div>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Selecione a Turma:</label>
          <select
            value={selectedClassGroupId}
            onChange={(e) => setSelectedClassGroupId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:bg-white"
          >
            {classGroups.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.shift})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Selecione a Disciplina:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:bg-white"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Display */}
      {timelineMeetings.length > 0 ? (
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 sm:before:left-8 before:w-0.5 before:bg-slate-200 before:z-0">
          
          {timelineMeetings.map((meeting, index) => {
            const reasonObj = PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === meeting.primaryReason);
            const periodicityObj = MEETING_PERIODICITY_OPTIONS.find(o => o.id === meeting.periodicity) ||
              MEETING_PERIODICITY_OPTIONS.find(o => o.id === 'REGULAR');

            return (
              <div key={meeting.id} className="relative z-10 pl-12 sm:pl-16 space-y-3">
                
                {/* Timeline Dot Icon */}
                <div className="absolute left-3 sm:left-5 top-1.5 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-xs">
                  {index + 1}
                </div>

                {/* Main Timeline Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
                  
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
                          {meeting.fortnightPeriod}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{meeting.meetingDate}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">
                        Professor(a): {meeting.teacherName}
                      </h3>
                    </div>

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
                  </div>

                  {/* Previous Action Verifications (if any) */}
                  {meeting.previousActionsVerification.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-amber-700" /> Verificação da Reunião Anterior:
                      </span>
                      {meeting.previousActionsVerification.map(v => (
                        <div key={v.actionId} className="bg-white p-2.5 rounded-lg border border-amber-200/80 text-amber-950">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">"{v.actionDescription}"</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              v.verificationResult === 'SUPERADA' ? 'bg-emerald-100 text-emerald-800' :
                              v.verificationResult === 'PARCIALMENTE_SUPERADA' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {v.verificationResult === 'SUPERADA' ? 'Dificuldade Superada' :
                               v.verificationResult === 'PARCIALMENTE_SUPERADA' ? 'Parcialmente Superada' : 'Continua Presente'}
                            </span>
                          </div>
                          {v.notes && <p className="text-[11px] text-slate-600 mt-1 italic">{v.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Context Notes */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px]">Contexto Pedagógico Relatado:</span>
                    <p className="text-slate-800 leading-relaxed italic">
                      "{meeting.pedagogicalContextNotes}"
                    </p>
                  </div>

                  {/* New Actions Created */}
                  {meeting.newActions.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block text-[11px]">Encaminhamentos Combinados neste Encontro:</span>
                      <div className="space-y-1.5">
                        {meeting.newActions.map(act => (
                          <div key={act.id} className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200/80 text-indigo-950 flex items-center justify-between">
                            <span className="font-semibold">"{act.description}"</span>
                            <span className="text-[10px] font-bold bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                              Retomada: {act.targetMeetingPeriod}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => onSelectMeetingDetail(meeting)}
                      className="font-bold text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1"
                    >
                      <span>Detalhes da Reunião</span>
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
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhum registro na linha do tempo</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ainda não há registros de reuniões cadastrados para a turma <strong>{activeClass?.name}</strong> na disciplina de <strong>{activeSubject?.name}</strong>.
          </p>
        </div>
      )}

    </div>
  );
};
