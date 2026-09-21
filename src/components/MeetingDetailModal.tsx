import React from 'react';
import { 
  X, 
  Printer, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  CheckSquare, 
  FileText 
} from 'lucide-react';
import { 
  BiweeklyMeeting, 
  PEDAGOGICAL_REASON_OPTIONS,
  MEETING_PERIODICITY_OPTIONS
} from '../types';

interface MeetingDetailModalProps {
  meeting: BiweeklyMeeting | null;
  onClose: () => void;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  meeting,
  onClose
}) => {
  if (!meeting) return null;

  const reasonObj = PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === meeting.primaryReason);
  const periodicityObj = MEETING_PERIODICITY_OPTIONS.find(o => o.id === (meeting.periodicity || 'QUINZENAL'));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Registro Oficial de Reunião
              </span>
              {periodicityObj && meeting.periodicity && meeting.periodicity !== 'QUINZENAL' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${periodicityObj.badgeBg}`}>
                  {periodicityObj.label}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold font-display text-slate-100 mt-1">
              Acompanhamento Pedagógico: {meeting.subjectName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Meeting Document */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-900 font-sans" id="printable-meeting">
          
          {/* Header Image Banner */}
          <div className="w-full flex justify-center border-b border-slate-200 pb-3 mb-2">
            <img 
              src="src/data/cabecalho.png" 
              alt="Secretaria de Estado da Educação - Governo da Paraíba - Escola Cidadã Integral" 
              className="w-full max-h-20 sm:max-h-24 object-contain print:max-h-28"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">
                ACOMPANHAMENTO PEDAGÓGICO
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Registro das Reuniões de Acompanhamento da Coordenação com o Corpo Docente
              </p>
            </div>

            <div className="text-right text-xs">
              <span className="font-bold text-slate-900 block">{meeting.meetingDate}</span>
              <span className="text-slate-500">{meeting.bimester}º Bimestre</span>
            </div>
          </div>

          {/* Teacher and Class Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Docente:</span>
              <span className="font-bold text-slate-900">{meeting.teacherName}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Disciplina:</span>
              <span className="font-bold text-slate-900">{meeting.subjectName}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Turma / Série:</span>
              <span className="font-bold text-slate-900">{meeting.classGroupName}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Coordenador(a):</span>
              <span className="font-bold text-slate-900">{meeting.coordinatorName}</span>
            </div>
          </div>

          {/* Section 1: Previous Actions Verification */}
          {meeting.previousActionsVerification.length > 0 && (
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                1. Checagem dos Encaminhamentos da Reunião Anterior
              </h4>

              <div className="space-y-2 pt-1">
                {meeting.previousActionsVerification.map(item => (
                  <div key={item.actionId} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">"{item.actionDescription}"</span>
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded border bg-white">
                        {item.verificationResult === 'SUPERADA' ? 'Dificuldade Superada ✓' :
                         item.verificationResult === 'PARCIALMENTE_SUPERADA' ? 'Parcialmente Superada ⚠' : 'Continua Presente ✖'}
                      </span>
                    </div>
                    {item.notes && <p className="text-slate-600 italic text-[11px]">{item.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Content Progression */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              2. Acompanhamento dos Conteúdos do Período
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Conteúdo / Tópico</th>
                    <th className="p-2.5">Código BNCC</th>
                    <th className="p-2.5">Situação</th>
                    <th className="p-2.5">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meeting.topicProgress.map(t => (
                    <tr key={t.topicId} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{t.topicTitle}</td>
                      <td className="p-2.5 text-indigo-700 font-semibold text-[11px]">{t.bnccCode || '-'}</td>
                      <td className="p-2.5">
                        <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                          t.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'RETOMADA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.status === 'CONCLUIDO' ? 'Concluído' :
                           t.status === 'EM_ANDAMENTO' ? 'Em Andamento' :
                           t.status === 'RETOMADA' ? 'Retomada' : 'Não Iniciado'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 text-[11px]">{t.observation || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Pedagogical Context & Reasons */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3. Contexto Pedagógico & Fatores Relatados
            </h4>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              {(() => {
                const reasonIds = meeting.pedagogicalReasons && meeting.pedagogicalReasons.length > 0
                  ? meeting.pedagogicalReasons
                  : [meeting.primaryReason];
                const reasonObjs = reasonIds
                  .map(id => PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === id))
                  .filter((o): o is NonNullable<typeof o> => Boolean(o));

                return reasonObjs.length > 0 ? (
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      {reasonObjs.length > 1 ? 'Fatores Pedagógicos Relatados:' : 'Fator Dominante Relatado:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {reasonObjs.map(r => (
                        <span key={r.id} className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded-full border ${r.badgeBg}`}>
                          {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Síntese Qualitativa da Conversa:</span>
                <p className="text-slate-800 italic leading-relaxed pt-1">
                  "{meeting.pedagogicalContextNotes}"
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: New Action Items */}
          {meeting.newActions.length > 0 && (
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                4. Novos Encaminhamentos Combinados para a Próxima Reunião
              </h4>

              <div className="space-y-2 pt-1">
                {meeting.newActions.map((act, idx) => (
                  <div key={act.id} className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-200 text-indigo-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">#{idx + 1}. "{act.description}"</span>
                      <span className="text-[10px] font-bold bg-white text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                        Previsão: {act.targetMeetingPeriod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures for Print */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs mt-8 border-t border-slate-200">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-48 mx-auto h-8" />
              <p className="font-bold text-slate-900">{meeting.teacherName}</p>
              <p className="text-slate-500 text-[10px]">Docente Responsável</p>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 w-48 mx-auto h-8" />
              <p className="font-bold text-slate-900">{meeting.coordinatorName}</p>
              <p className="text-slate-500 text-[10px]">Coordenação Pedagógica</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
