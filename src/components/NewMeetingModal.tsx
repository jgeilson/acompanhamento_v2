import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  PlusCircle,
  Trash2, 
  Calendar, 
  BookOpen, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  CheckSquare,
  FileText,
  Check
} from 'lucide-react';
import { 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction, 
  PedagogicalReasonType, 
  PEDAGOGICAL_REASON_OPTIONS,
  TopicProgressItem,
  PreviousActionVerification,
  ActionVerificationStatus,
  ActionCategory,
  MeetingPeriodicity,
  MEETING_PERIODICITY_OPTIONS
} from '../types';
import { DEFAULT_COORDINATOR_NAME } from '../data/initialData';

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  bimonthlyPlans: BimonthlyPlan[];
  existingActions: PedagogicalAction[];
  onSaveMeeting: (meeting: BiweeklyMeeting) => void;
  initialTeacherId?: string;
  defaultCoordinator?: string;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  isOpen,
  onClose,
  teachers,
  subjects,
  classGroups,
  bimonthlyPlans,
  existingActions,
  onSaveMeeting,
  initialTeacherId,
  defaultCoordinator
}) => {
  // Step Control (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId || teachers[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('');
  const [bimester, setBimester] = useState<1 | 2 | 3 | 4>(3);
  const [periodicity, setPeriodicity] = useState<MeetingPeriodicity>('REGULAR');
  const [fortnightPeriod, setFortnightPeriod] = useState<string>('Encontro Regular #1');
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [coordinatorName, setCoordinatorName] = useState<string>(() => {
    return defaultCoordinator || localStorage.getItem('default_coordinator_name') || DEFAULT_COORDINATOR_NAME;
  });

  // Derived teacher subjects and classes
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  const availableSubjects = React.useMemo(() => {
    if (!selectedTeacher) return subjects;
    const filtered = subjects.filter(s => {
      if (selectedTeacher.subjects && selectedTeacher.subjects.length > 0) {
        const match = selectedTeacher.subjects.some(
          ref => ref === s.id || ref.toLowerCase() === s.name.toLowerCase() || (s.code && ref.toLowerCase() === s.code.toLowerCase())
        );
        if (match) return true;
      }
      const hasPlan = bimonthlyPlans.some(p => p.teacherId === selectedTeacher.id && p.subjectId === s.id);
      if (hasPlan) return true;
      return false;
    });
    return filtered.length > 0 ? filtered : subjects;
  }, [selectedTeacher, subjects, bimonthlyPlans]);

  const availableClassGroups = React.useMemo(() => {
    if (!selectedTeacher) return classGroups;
    const filtered = classGroups.filter(c => {
      if (selectedTeacher.classes && selectedTeacher.classes.length > 0) {
        const match = selectedTeacher.classes.some(
          ref => ref === c.id || ref.toLowerCase() === c.name.toLowerCase()
        );
        if (match) return true;
      }
      const hasPlan = bimonthlyPlans.some(p => {
        const matchTeacher = p.teacherId === selectedTeacher.id;
        const pClasses = (p.classGroupIds && p.classGroupIds.length > 0) ? p.classGroupIds : [p.classGroupId];
        return matchTeacher && pClasses.includes(c.id);
      });
      if (hasPlan) return true;
      return false;
    });
    return filtered.length > 0 ? filtered : classGroups;
  }, [selectedTeacher, classGroups, bimonthlyPlans]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects, selectedSubjectId]);

  useEffect(() => {
    if (availableClassGroups.length > 0 && !availableClassGroups.some(c => c.id === selectedClassGroupId)) {
      setSelectedClassGroupId(availableClassGroups[0].id);
    }
  }, [availableClassGroups, selectedClassGroupId]);

  // Step 2 State: Previous Actions Verification
  const [previousVerifications, setPreviousVerifications] = useState<PreviousActionVerification[]>([]);

  useEffect(() => {
    if (selectedTeacherId && selectedSubjectId && selectedClassGroupId) {
      const pending = existingActions.filter(a => 
        a.teacherId === selectedTeacherId && 
        a.subjectId === selectedSubjectId && 
        a.classGroupId === selectedClassGroupId &&
        a.status !== 'SUPERADA'
      );

      setPreviousVerifications(pending.map(p => ({
        actionId: p.id,
        actionDescription: p.description,
        previousStatus: p.status,
        verificationResult: 'PENDENTE_AVALIACAO' as ActionVerificationStatus,
        notes: ''
      })));
    }
  }, [selectedTeacherId, selectedSubjectId, selectedClassGroupId, existingActions]);

  // Step 3 State: Planned Topics Progress
  const [topicProgressList, setTopicProgressList] = useState<TopicProgressItem[]>([]);

  useEffect(() => {
    // Find plan for this teacher + subject + class
    const plan = bimonthlyPlans.find(p => {
      const matchTeacher = p.teacherId === selectedTeacherId;
      const matchSubject = p.subjectId === selectedSubjectId;
      const pClasses = (p.classGroupIds && p.classGroupIds.length > 0) ? p.classGroupIds : [p.classGroupId];
      const matchClass = pClasses.includes(selectedClassGroupId);
      return matchTeacher && matchSubject && matchClass && Number(p.bimester) === Number(bimester);
    });

    if (plan && plan.periods.length > 0) {
      // Load topics from all periods or current fortnight
      const allTopics: TopicProgressItem[] = [];
      plan.periods.forEach(p => {
        p.topics.forEach(t => {
          allTopics.push({
            topicId: t.id,
            topicTitle: t.title,
            bnccCode: t.bnccCode,
            status: 'EM_ANDAMENTO',
            observation: ''
          });
        });
      });
      setTopicProgressList(allTopics);
    } else {
      // Default fallback sample topics if no plan is found
      setTopicProgressList([
        {
          topicId: 'top-custom-1',
          topicTitle: 'Conteúdo Previsto para este Período',
          bnccCode: '(EM13CNT101)',
          status: 'EM_ANDAMENTO',
          observation: ''
        }
      ]);
    }
  }, [selectedTeacherId, selectedSubjectId, selectedClassGroupId, bimester, bimonthlyPlans]);

  // Step 4 State: Pedagogical Context & Reasons (multiple allowed)
  const [selectedReasons, setSelectedReasons] = useState<PedagogicalReasonType[]>(['DIFICULDADE_APRENDIZAGEM_RETOMADA']);
  const [pedagogicalContextNotes, setPedagogicalContextNotes] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedTeacherId || !selectedSubjectId || !selectedClassGroupId) {
        alert('Por favor, selecione o docente, a disciplina e a turma antes de prosseguir.');
        return;
      }
    }
    if (currentStep === 2) {
      const unverifiedCount = previousVerifications.filter(v => v.verificationResult === 'PENDENTE_AVALIACAO').length;
      if (unverifiedCount > 0) {
        alert(`Atenção: Existe(m) ${unverifiedCount} encaminhamento(s) anterior(es) pendente(s) de avaliação. Selecione para cada item se foi "Dificuldade Superada", "Parcialmente Superada" ou "Continua Presente" antes de avançar.`);
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const primaryReason = selectedReasons[0] || 'RITMO_ADEQUADO';

  const handleToggleReason = (reasonId: PedagogicalReasonType) => {
    setSelectedReasons(prev => {
      if (reasonId === 'RITMO_ADEQUADO') {
        return ['RITMO_ADEQUADO'];
      }
      const withoutAdequado = prev.filter(r => r !== 'RITMO_ADEQUADO');
      if (withoutAdequado.includes(reasonId)) {
        const remaining = withoutAdequado.filter(r => r !== reasonId);
        return remaining.length > 0 ? remaining : ['RITMO_ADEQUADO'];
      } else {
        return [...withoutAdequado, reasonId];
      }
    });
  };

  // Step 5 State: New Pedagogical Action Items
  const [newActionsList, setNewActionsList] = useState<{
    description: string;
    category: ActionCategory;
    targetMeetingPeriod: string;
  }[]>([
    {
      description: '',
      category: 'RECOMPOSICAO',
      targetMeetingPeriod: 'Próxima Reunião'
    }
  ]);

  // Add new action row
  const handleAddActionRow = () => {
    setNewActionsList(prev => [
      ...prev,
      {
        description: '',
        category: 'RECOMPOSICAO',
        targetMeetingPeriod: 'Próxima Reunião'
      }
    ]);
  };

  // Remove action row
  const handleRemoveActionRow = (index: number) => {
    setNewActionsList(prev => prev.filter((_, i) => i !== index));
  };

  // AI Assistant Suggestion
  const handleAiSuggestEncaminhamento = async () => {
    if (!pedagogicalContextNotes) {
      alert('Por favor, descreva brevemente o contexto da reunião primeiro para que a IA possa analisar e sugerir.');
      return;
    }

    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/gemini/assist-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Gere uma sugestão de encaminhamento pedagógico construtivo para a coordenação apoiar um professor baseando-se no seguinte contexto: "${pedagogicalContextNotes}". Motivo do desvio: "${primaryReason}". Seja direto, empático e prático (máximo 2 frases).`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          // Append to first new action description
          setNewActionsList(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[0].description = data.text;
            } else {
              updated.push({
                description: data.text,
                category: 'RECOMPOSICAO',
                targetMeetingPeriod: 'Próxima Reunião'
              });
            }
            return updated;
          });
        }
      } else {
        // Fallback simulation if server API not active
        const reasonObj = PEDAGOGICAL_REASON_OPTIONS.find(o => o.id === primaryReason);
        const fallbackText = `Realizar aula de recomposição de conceitos fundamentais no início das próximas aulas e fornecer lista de exercícios direcionados com gabarito para suporte aos estudantes.`;
        setNewActionsList(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[0].description = fallbackText;
          }
          return updated;
        });
      }
    } catch (err) {
      const fallbackText = `Agendar momentos curtos de revisão contínua antes de introduzir o próximo assunto e acompanhar os resultados na próxima reunião.`;
      setNewActionsList(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0].description = fallbackText;
        }
        return updated;
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle Submit
  const handleSubmitMeeting = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSub = subjects.find(s => s.id === selectedSubjectId);
    const selectedClass = classGroups.find(c => c.id === selectedClassGroupId);

    const createdActions: PedagogicalAction[] = newActionsList
      .filter(a => a.description.trim() !== '')
      .map((a, idx) => ({
        id: `act-${Date.now()}-${idx}`,
        meetingId: `meet-${Date.now()}`,
        teacherId: selectedTeacherId,
        teacherName: selectedTeacher?.name || 'Professor',
        subjectId: selectedSubjectId,
        subjectName: selectedSub?.name || 'Disciplina',
        classGroupId: selectedClassGroupId,
        classGroupName: selectedClass?.name || 'Turma',
        problemContext: pedagogicalContextNotes || undefined,
        description: a.description,
        category: a.category,
        responsible: 'Professor',
        createdDate: meetingDate,
        targetMeetingPeriod: a.targetMeetingPeriod,
        status: 'PENDENTE'
      }));

    const newMeeting: BiweeklyMeeting = {
      id: `meet-${Date.now()}`,
      teacherId: selectedTeacherId,
      teacherName: selectedTeacher?.name || 'Professor',
      subjectId: selectedSubjectId,
      subjectName: selectedSub?.name || 'Disciplina',
      classGroupId: selectedClassGroupId,
      classGroupName: selectedClass?.name || 'Turma',
      bimester,
      periodicity,
      fortnightPeriod,
      meetingDate,
      coordinatorName: coordinatorName.trim() || DEFAULT_COORDINATOR_NAME,
      previousActionsVerification: previousVerifications,
      topicProgress: topicProgressList,
      hasDeviation: selectedReasons.some(r => r !== 'RITMO_ADEQUADO'),
      primaryReason: selectedReasons[0] || 'RITMO_ADEQUADO',
      pedagogicalReasons: selectedReasons,
      pedagogicalContextNotes: pedagogicalContextNotes || 'Acompanhamento realizado em ritmo normal.',
      newActions: createdActions
    };

    onSaveMeeting(newMeeting);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
                Sessão de Acompanhamento Pedagógico
              </span>
              <span className="text-xs text-slate-400">Passo {currentStep} de 5</span>
            </div>
            <h3 className="text-lg font-bold font-display text-slate-100 mt-1">
              {currentStep === 1 && '1. Identificação do Docente'}
              {currentStep === 2 && '2. Checagem dos Encaminhamentos Anteriores'}
              {currentStep === 3 && '3. Acompanhamento dos Conteúdos'}
              {currentStep === 4 && '4. Contexto Pedagógico & Motivos do Desvio'}
              {currentStep === 5 && '5. Novos Encaminhamentos'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-100 h-1.5 w-full shrink-0">
          <div 
            className="bg-indigo-600 h-1.5 transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Modal Form Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* STEP 1: Identification */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Teacher */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-800">Professor(a):</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Disciplina:</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white"
                  >
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Class */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Turma / Série:</label>
                  <select
                    value={selectedClassGroupId}
                    onChange={(e) => setSelectedClassGroupId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white"
                  >
                    {availableClassGroups.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.shift})</option>
                    ))}
                  </select>
                </div>

                {/* Bimester */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Bimestre Letivo:</label>
                  <select
                    value={bimester}
                    onChange={(e) => setBimester(Number(e.target.value) as 1|2|3|4)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white font-semibold"
                  >
                    <option value={1}>1º Bimestre</option>
                    <option value={2}>2º Bimestre</option>
                    <option value={3}>3º Bimestre</option>
                    <option value={4}>4º Bimestre</option>
                  </select>
                </div>

                {/* Periodicity / Frequency */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Periodicidade / Frequência:</label>
                  <select
                    value={periodicity}
                    onChange={(e) => {
                      const newP = e.target.value as MeetingPeriodicity;
                      setPeriodicity(newP);
                      if (newP === 'SEMANAL') {
                        setFortnightPeriod('Semana 38');
                      } else if (newP === 'MENSAL') {
                        setFortnightPeriod('Mês de Outubro');
                      } else if (newP === 'QUINZENAL') {
                        setFortnightPeriod('2ª Quinzena');
                      } else if (newP === 'EXTRAORDINARIA') {
                        setFortnightPeriod('Reunião Extraordinária #1');
                      } else if (newP === 'REGULAR') {
                        setFortnightPeriod('Encontro Regular #1');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white font-semibold"
                  >
                    {MEETING_PERIODICITY_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Fortnight / Period Reference */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-800">Período / Referência de Acompanhamento:</label>
                  <input
                    type="text"
                    value={fortnightPeriod}
                    onChange={(e) => setFortnightPeriod(e.target.value)}
                    placeholder="Ex: Encontro #1, Semana 38, Mês de Outubro, Quinzena 2..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-500 italic">
                    Referência do período analisado.
                  </p>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Data Real do Encontro:</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                {/* Coordinator Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Coordenador(a) Pedagógico(a):</label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCoordinatorName(val);
                      localStorage.setItem('default_coordinator_name', val);
                    }}
                    placeholder="Ex: Profa. Maria Helena"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

              </div>
            </div>
          )}

          {/* STEP 2: Previous Actions Check */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {previousVerifications.length > 0 ? (
                <div className="space-y-3">
                  {previousVerifications.map((item, index) => (
                    <div 
                      key={item.actionId} 
                      className={`p-4 rounded-xl border space-y-3 text-xs transition-all ${
                        item.verificationResult === 'PENDENTE_AVALIACAO'
                          ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            item.verificationResult === 'PENDENTE_AVALIACAO'
                              ? 'bg-amber-500 animate-ping'
                              : 'bg-indigo-500'
                          }`} />
                          <span className="text-slate-800 font-bold">"{item.actionDescription}"</span>
                        </div>
                        {item.verificationResult === 'PENDENTE_AVALIACAO' && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-200/80 border border-amber-400/60 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                            ⚠️ Avaliação Pendente
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...previousVerifications];
                            updated[index].verificationResult = 'SUPERADA';
                            setPreviousVerifications(updated);
                          }}
                          className={`p-2 rounded-lg border text-center font-bold transition-all ${
                            item.verificationResult === 'SUPERADA'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ✓ Dificuldade Superada
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...previousVerifications];
                            updated[index].verificationResult = 'PARCIALMENTE_SUPERADA';
                            setPreviousVerifications(updated);
                          }}
                          className={`p-2 rounded-lg border text-center font-bold transition-all ${
                            item.verificationResult === 'PARCIALMENTE_SUPERADA'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ⚠ Parcialmente Superada
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...previousVerifications];
                            updated[index].verificationResult = 'CONTINUA_PRESENTE';
                            setPreviousVerifications(updated);
                          }}
                          className={`p-2 rounded-lg border text-center font-bold transition-all ${
                            item.verificationResult === 'CONTINUA_PRESENTE'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ✖ Continua Presente
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Observação da coordenação sobre a evolução desta pendência..."
                        value={item.notes || ''}
                        onChange={(e) => {
                          const updated = [...previousVerifications];
                          updated[index].notes = e.target.value;
                          setPreviousVerifications(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800">Sem encaminhamentos pendentes anteriores</p>
                  <p>Não foram encontrados registros de pendências para esta disciplina e turma do encontro passado.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Content Progress */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {topicProgressList.map((topic, index) => (
                  <div key={topic.topicId} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{topic.topicTitle}</span>
                        {topic.bnccCode && (
                          <span className="text-[10px] text-indigo-600 font-semibold">{topic.bnccCode}</span>
                        )}
                      </div>

                      {/* Status selector */}
                      <select
                        value={topic.status}
                        onChange={(e) => {
                          const updated = [...topicProgressList];
                          updated[index].status = e.target.value as any;
                          setTopicProgressList(updated);
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                          topic.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          topic.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          topic.status === 'RETOMADA' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="CONCLUIDO">✓ Concluído</option>
                        <option value="EM_ANDAMENTO">⚡ Em Andamento</option>
                        <option value="RETOMADA">🔄 Em Retomada / Recomposição</option>
                        <option value="NAO_INICIADO">⏳ Não Iniciado / Pendente</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Comentário sobre o avanço nesta aula/conteúdo..."
                      value={topic.observation || ''}
                      onChange={(e) => {
                        const updated = [...topicProgressList];
                        updated[index].observation = e.target.value;
                        setTopicProgressList(updated);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Context & Reasons */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Reasons Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs block">
                    Selecione os Fatores / Motivos Pedagógicos (pode escolher mais de um):
                  </label>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {selectedReasons.length} {selectedReasons.length === 1 ? 'fator selecionado' : 'fatores selecionados'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {PEDAGOGICAL_REASON_OPTIONS.map(option => {
                    const isSelected = selectedReasons.includes(option.id);
                    return (
                      <div
                        key={option.id}
                        onClick={() => handleToggleReason(option.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                          isSelected 
                            ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`font-bold text-xs ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                              {option.label}
                            </span>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${option.badgeBg}`}>
                            {option.badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 pl-6 line-clamp-2">
                          {option.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qualitative Explanation Textarea */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-800 block">
                  Descrição Qualitativa da Conversa com o Professor:
                </label>
                <textarea
                  rows={4}
                  value={pedagogicalContextNotes}
                  onChange={(e) => setPedagogicalContextNotes(e.target.value)}
                  placeholder="Exemplo: Na reunião, a professora relatou que trabalhou corrente e resistência elétrica, mas a turma do 3º ano C apresentou dificuldades em cálculos de Ohm, exigindo 2 aulas de resolução de exercícios em vez de entrar em circuitos..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

            </div>
          )}

          {/* STEP 5: New Action Items */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleAiSuggestEncaminhamento}
                  disabled={isAiGenerating}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiGenerating ? 'Analisando...' : 'IA Sugerir Encaminhamento'}</span>
                </button>
              </div>

              {/* Action List */}
              <div className="space-y-3">
                {newActionsList.map((actionItem, index) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Encaminhamento #{index + 1}</span>
                      
                      {newActionsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActionRow(index)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Descreva a ação combinada (Ex: Realizar aula de recomposição sobre cálculo de potência antes de entrar em Leis de Kirchhoff)..."
                      value={actionItem.description}
                      onChange={(e) => {
                        const updated = [...newActionsList];
                        updated[index].description = e.target.value;
                        setNewActionsList(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-600 block text-[11px]">Categoria:</label>
                        <select
                          value={actionItem.category}
                          onChange={(e) => {
                            const updated = [...newActionsList];
                            updated[index].category = e.target.value as ActionCategory;
                            setNewActionsList(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                        >
                          <option value="RECOMPOSICAO">Recomposição de Aprendizagem</option>
                          <option value="ACOMPANHAMENTO_INDIVIDUAL">Acompanhamento Individualizado</option>
                          <option value="AJUSTE_RITMO">Ajuste no Ritmo de Aulas</option>
                          <option value="ATIVIDADE_DIFERENCIADA">Atividade Prática / Diferenciada</option>
                          <option value="OUTRO">Outro Apoio Pedagógico</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-600 block text-[11px]">Previsão de Retomada:</label>
                        <input
                          type="text"
                          value={actionItem.targetMeetingPeriod}
                          onChange={(e) => {
                            const updated = [...newActionsList];
                            updated[index].targetMeetingPeriod = e.target.value;
                            setNewActionsList(updated);
                          }}
                          placeholder="Ex: Próxima Reunião (15 dias)"
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddActionRow}
                className="w-full bg-white hover:bg-slate-50 border border-dashed border-slate-300 text-slate-700 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Adicionar Mais Um Encaminhamento</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : <div />}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Próximo Passo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitMeeting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar e Salvar na Memória Pedagógica</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
