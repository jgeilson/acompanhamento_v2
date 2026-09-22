import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Users, 
  BookOpen, 
  ArrowRight, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle,
  History,
  Target,
  Calendar,
  UserCheck,
  FileText,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  PedagogicalAction, 
  Teacher, 
  Subject, 
  ClassGroup,
  ActionCategory,
  ActionCycleEntry
} from '../types';

interface PedagogicalActionsViewProps {
  actions: PedagogicalAction[];
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  onUpdateActionStatus: (actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA') => void;
  onAddAction?: (action: PedagogicalAction) => void;
  onUpdateAction?: (action: PedagogicalAction) => void;
  onDeleteAction?: (actionId: string) => void;
}

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  RECOMPOSICAO: 'Recomposição de Aprendizagem',
  ACOMPANHAMENTO_INDIVIDUAL: 'Acompanhamento Individualizado',
  AJUSTE_RITMO: 'Ajuste no Ritmo de Aulas',
  ATIVIDADE_DIFERENCIADA: 'Atividade Prática / Diferenciada',
  OUTRO: 'Apoio Pedagógico'
};

export const PedagogicalActionsView: React.FC<PedagogicalActionsViewProps> = ({
  actions,
  teachers,
  subjects,
  classGroups,
  onUpdateActionStatus,
  onAddAction,
  onUpdateAction,
  onDeleteAction
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});

  const toggleHistoryExpand = (actionId: string) => {
    setExpandedHistoryIds(prev => ({ ...prev, [actionId]: !prev[actionId] }));
  };

  // Derived teacher subjects and classes for top filter bar
  const teacherForFilter = teachers.find(t => t.id === selectedTeacherFilter);

  const availableSubjectsForFilter = React.useMemo(() => {
    if (!teacherForFilter) return subjects;
    const filtered = subjects.filter(s => {
      if (teacherForFilter.subjects && teacherForFilter.subjects.length > 0) {
        return teacherForFilter.subjects.some(
          ref => ref === s.id || ref.toLowerCase() === s.name.toLowerCase() || (s.code && ref.toLowerCase() === s.code.toLowerCase())
        );
      }
      return false;
    });
    return filtered.length > 0 ? filtered : subjects;
  }, [teacherForFilter, subjects]);

  const availableClassesForFilter = React.useMemo(() => {
    if (!teacherForFilter) return classGroups;
    const filtered = classGroups.filter(c => {
      if (teacherForFilter.classes && teacherForFilter.classes.length > 0) {
        return teacherForFilter.classes.some(
          ref => ref === c.id || ref.toLowerCase() === c.name.toLowerCase()
        );
      }
      return false;
    });
    return filtered.length > 0 ? filtered : classGroups;
  }, [teacherForFilter, classGroups]);

  const handleTeacherFilterChange = (teacherId: string) => {
    setSelectedTeacherFilter(teacherId);
    setSelectedSubjectFilter('');
    setSelectedClassFilter('');
  };

  // Modal States
  const [isMainModalOpen, setIsMainModalOpen] = useState<boolean>(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<PedagogicalAction | null>(null);
  const [actionForCycle, setActionForCycle] = useState<PedagogicalAction | null>(null);
  const [actionToDelete, setActionToDelete] = useState<PedagogicalAction | null>(null);

  // Form Fields for Main Action Modal
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formClassGroupId, setFormClassGroupId] = useState<string>('');
  const [formProblemContext, setFormProblemContext] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ActionCategory>('RECOMPOSICAO');
  const [formResponsible, setFormResponsible] = useState<string>('Professor');
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formTargetPeriod, setFormTargetPeriod] = useState<string>('Encontro Regular #2');
  const [formStatus, setFormStatus] = useState<'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'>('PENDENTE');
  const [formResultNotes, setFormResultNotes] = useState<string>('');

  // Form Fields for Cycle Result Verification Modal
  const [cycleDate, setCycleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cycleStatus, setCycleStatus] = useState<'SUPERADA' | 'EM_ANDAMENTO' | 'PENDENTE'>('SUPERADA');
  const [cycleResultNotes, setCycleResultNotes] = useState<string>('');

  // Derived available subjects and classes for modal form based on selected teacher
  const selectedFormTeacher = teachers.find(t => t.id === formTeacherId);

  const formAvailableSubjects = React.useMemo(() => {
    if (!selectedFormTeacher) return subjects;
    const filtered = subjects.filter(s => {
      if (selectedFormTeacher.subjects && selectedFormTeacher.subjects.length > 0) {
        return selectedFormTeacher.subjects.some(
          ref => ref === s.id || ref.toLowerCase() === s.name.toLowerCase() || (s.code && ref.toLowerCase() === s.code.toLowerCase())
        );
      }
      return false;
    });
    return filtered.length > 0 ? filtered : subjects;
  }, [selectedFormTeacher, subjects]);

  const formAvailableClassGroups = React.useMemo(() => {
    if (!selectedFormTeacher) return classGroups;
    const filtered = classGroups.filter(c => {
      if (selectedFormTeacher.classes && selectedFormTeacher.classes.length > 0) {
        return selectedFormTeacher.classes.some(
          ref => ref === c.id || ref.toLowerCase() === c.name.toLowerCase()
        );
      }
      return false;
    });
    return filtered.length > 0 ? filtered : classGroups;
  }, [selectedFormTeacher, classGroups]);

  const handleTeacherChangeInForm = (newTeacherId: string) => {
    setFormTeacherId(newTeacherId);
    const teacher = teachers.find(t => t.id === newTeacherId);
    if (teacher) {
      const availSubjs = subjects.filter(s => {
        if (teacher.subjects && teacher.subjects.length > 0) {
          return teacher.subjects.some(
            ref => ref === s.id || ref.toLowerCase() === s.name.toLowerCase() || (s.code && ref.toLowerCase() === s.code.toLowerCase())
          );
        }
        return false;
      });
      const validSubjs = availSubjs.length > 0 ? availSubjs : subjects;

      const availClasses = classGroups.filter(c => {
        if (teacher.classes && teacher.classes.length > 0) {
          return teacher.classes.some(
            ref => ref === c.id || ref.toLowerCase() === c.name.toLowerCase()
          );
        }
        return false;
      });
      const validClasses = availClasses.length > 0 ? availClasses : classGroups;

      setFormSubjectId(validSubjs[0]?.id || '');
      setFormClassGroupId(validClasses[0]?.id || '');
    }
  };

  const openCreateModal = () => {
    setEditingAction(null);
    const defaultTeacher = teachers[0];
    const defaultTeacherId = defaultTeacher?.id || '';
    setFormTeacherId(defaultTeacherId);

    if (defaultTeacher) {
      const availSubjs = subjects.filter(s => {
        if (defaultTeacher.subjects && defaultTeacher.subjects.length > 0) {
          return defaultTeacher.subjects.some(
            ref => ref === s.id || ref.toLowerCase() === s.name.toLowerCase() || (s.code && ref.toLowerCase() === s.code.toLowerCase())
          );
        }
        return false;
      });
      const validSubjs = availSubjs.length > 0 ? availSubjs : subjects;

      const availClasses = classGroups.filter(c => {
        if (defaultTeacher.classes && defaultTeacher.classes.length > 0) {
          return defaultTeacher.classes.some(
            ref => ref === c.id || ref.toLowerCase() === c.name.toLowerCase()
          );
        }
        return false;
      });
      const validClasses = availClasses.length > 0 ? availClasses : classGroups;

      setFormSubjectId(validSubjs[0]?.id || '');
      setFormClassGroupId(validClasses[0]?.id || '');
    } else {
      setFormSubjectId(subjects[0]?.id || '');
      setFormClassGroupId(classGroups[0]?.id || '');
    }

    setFormProblemContext('');
    setFormDescription('');
    setFormCategory('RECOMPOSICAO');
    setFormResponsible('Professor');
    
    // Default due date to 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setFormDueDate(nextWeek.toISOString().split('T')[0]);

    setFormTargetPeriod('Encontro Regular #2');
    setFormStatus('PENDENTE');
    setFormResultNotes('');
    setIsMainModalOpen(true);
  };

  const openEditModal = (act: PedagogicalAction) => {
    setEditingAction(act);
    setFormTeacherId(act.teacherId);
    setFormSubjectId(act.subjectId);
    setFormClassGroupId(act.classGroupId);
    setFormProblemContext(act.problemContext || '');
    setFormDescription(act.description);
    setFormCategory(act.category);
    setFormResponsible(act.responsible || 'Professor');
    setFormDueDate(act.dueDate || '');
    setFormTargetPeriod(act.targetMeetingPeriod);
    setFormStatus(act.status);
    setFormResultNotes(act.resultNotes || '');
    setIsMainModalOpen(true);
  };

  const openCycleModal = (act: PedagogicalAction) => {
    setActionForCycle(act);
    setCycleDate(new Date().toISOString().split('T')[0]);
    setCycleStatus(act.status === 'SUPERADA' ? 'SUPERADA' : 'SUPERADA');
    setCycleResultNotes(act.resultNotes || '');
    setIsCycleModalOpen(true);
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) return;

    const teacher = teachers.find(t => t.id === formTeacherId);
    const subject = subjects.find(s => s.id === formSubjectId);
    const classGroup = classGroups.find(c => c.id === formClassGroupId);

    const actionData: PedagogicalAction = {
      id: editingAction ? editingAction.id : `act-${Date.now()}`,
      meetingId: editingAction ? editingAction.meetingId : `manual-${Date.now()}`,
      teacherId: formTeacherId,
      teacherName: teacher?.name || 'Professor',
      subjectId: formSubjectId,
      subjectName: subject?.name || 'Disciplina',
      classGroupId: formClassGroupId,
      classGroupName: classGroup?.name || 'Turma',
      problemContext: formProblemContext.trim() || undefined,
      description: formDescription.trim(),
      category: formCategory,
      responsible: formResponsible.trim() || 'Professor',
      createdDate: editingAction ? editingAction.createdDate : new Date().toISOString().split('T')[0],
      dueDate: formDueDate || undefined,
      targetMeetingPeriod: formTargetPeriod.trim() || 'Próximo Encontro',
      status: formStatus,
      resultNotes: formResultNotes.trim() || undefined,
      history: editingAction?.history || []
    };

    if (editingAction && onUpdateAction) {
      onUpdateAction(actionData);
    } else if (onAddAction) {
      onAddAction(actionData);
    }

    setIsMainModalOpen(false);
  };

  const handleSaveCycleResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionForCycle || !onUpdateAction) return;

    const newHistoryEntry: ActionCycleEntry = {
      id: `cycle-${Date.now()}`,
      date: cycleDate,
      status: cycleStatus === 'SUPERADA' ? 'SUPERADA' : cycleStatus === 'EM_ANDAMENTO' ? 'EM_ANDAMENTO' : 'PENDENTE',
      resultNotes: cycleResultNotes.trim() || 'Acompanhamento registrado sem observações adicionais.'
    };

    const existingHistory = actionForCycle.history || [];

    const updatedAction: PedagogicalAction = {
      ...actionForCycle,
      status: cycleStatus,
      resultNotes: cycleResultNotes.trim() || actionForCycle.resultNotes,
      history: [newHistoryEntry, ...existingHistory]
    };

    onUpdateAction(updatedAction);
    setIsCycleModalOpen(false);
    setActionForCycle(null);
  };

  const filteredActions = actions.filter(a => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchTeacher = a.teacherName.toLowerCase().includes(q);
      const matchClass = a.classGroupName.toLowerCase().includes(q);
      const matchSubject = a.subjectName.toLowerCase().includes(q);
      const matchProblem = (a.problemContext || '').toLowerCase().includes(q);
      const matchResult = (a.resultNotes || '').toLowerCase().includes(q);
      if (!matchDesc && !matchTeacher && !matchClass && !matchSubject && !matchProblem && !matchResult) return false;
    }

    if (selectedStatus !== 'TODOS' && a.status !== selectedStatus) return false;
    if (selectedTeacherFilter && a.teacherId !== selectedTeacherFilter) return false;
    if (selectedSubjectFilter && a.subjectId !== selectedSubjectFilter) return false;
    if (selectedClassFilter && a.classGroupId !== selectedClassFilter) return false;

    return true;
  });

  const totalActions = actions.length;
  const pendingCount = actions.filter(a => a.status === 'PENDENTE').length;
  const inProgressCount = actions.filter(a => a.status === 'EM_ANDAMENTO').length;
  const completedCount = actions.filter(a => a.status === 'SUPERADA').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner - Ciclos Pedagógicos */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin-slow" />
              Ciclo Contínuo de Acompanhamento
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <span>Encaminhamentos Pedagógicos</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs">
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total</div>
              <div className="text-base font-bold text-white">{totalActions}</div>
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="text-center px-2">
              <div className="text-[10px] text-amber-400 uppercase font-bold">Pendentes</div>
              <div className="text-base font-bold text-amber-400">{pendingCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="text-center px-2">
              <div className="text-[10px] text-blue-400 uppercase font-bold">Em Andamento</div>
              <div className="text-base font-bold text-blue-400">{inProgressCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="text-center px-2">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Superadas</div>
              <div className="text-base font-bold text-emerald-400">{completedCount}</div>
            </div>
          </div>

          {onAddAction && (
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-100" />
              <span>Novo Encaminhamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-2xl border border-indigo-900/80 shadow-md space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filtros de Busca e Seleção de Encaminhamentos</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Filtre por qualquer combinação abaixo</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar problema, ação, professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none shadow-inner"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="TODOS" className="bg-slate-900 text-white">Todos os Status do Ciclo</option>
              <option value="PENDENTE" className="bg-slate-900 text-white">🔴 Apenas Pendentes</option>
              <option value="EM_ANDAMENTO" className="bg-slate-900 text-white">🔵 Em Andamento</option>
              <option value="SUPERADA" className="bg-slate-900 text-white">🟢 Superadas / Realizadas</option>
            </select>
          </div>

          {/* Teacher Filter */}
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => handleTeacherFilterChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">Todos os Professores</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter (Filtered by Teacher) */}
          <div>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">
                {teacherForFilter ? 'Disciplinas do Professor' : 'Todas as Disciplinas'}
              </option>
              {availableSubjectsForFilter.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
              ))}
            </select>
          </div>

          {/* Class Filter (Filtered by Teacher) */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/90 text-white border border-slate-700/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">
                {teacherForFilter ? 'Turmas do Professor' : 'Todas as Turmas'}
              </option>
              {availableClassesForFilter.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name} ({c.shift[0]})</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Cycle Action Cards Grid */}
      {filteredActions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredActions.map(action => {
            const isCompleted = action.status === 'SUPERADA';
            const isInProgress = action.status === 'EM_ANDAMENTO';

            return (
              <div 
                key={action.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-xs hover:shadow-md overflow-hidden ${
                  isCompleted 
                    ? 'border-emerald-200/90' 
                    : isInProgress
                    ? 'border-blue-200/90'
                    : 'border-amber-200/90'
                }`}
              >
                {/* Top Colored Bar */}
                <div className={`h-1.5 w-full ${
                  isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500' : 'bg-amber-500'
                }`} />

                <div className="p-5 space-y-4 flex-1">
                  
                  {/* Card Header Tag, Status & Controls */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/70">
                        {CATEGORY_LABELS[action.category] || action.category}
                      </span>

                      {/* Cycle Status Badge */}
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                        isCompleted 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : isInProgress
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {isCompleted && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {isInProgress && <Clock className="w-3 h-3 text-blue-600" />}
                        {!isCompleted && !isInProgress && <AlertCircle className="w-3 h-3 text-amber-600" />}
                        <span>{isCompleted ? '✓ Realizado / Superado' : isInProgress ? 'Em Andamento' : 'Pendente'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onUpdateAction && (
                        <button
                          onClick={() => openEditModal(action)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar Encaminhamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onDeleteAction && (
                        <button
                          onClick={() => setActionToDelete(action)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Encaminhamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Header Info: Teacher, Subject & Class */}
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-200/70">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{action.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-600">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>{action.subjectName} — <strong className="text-slate-800">{action.classGroupName}</strong></span>
                    </div>
                  </div>

                  {/* FASE 1: O ENCAMINHAMENTO (Pactuação Inicial) */}
                  <div className="space-y-2.5 pt-1">
                    
                    {/* Problem / Context (if present) */}
                    {action.problemContext && (
                      <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-xs space-y-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Problema / Diagnóstico de Origem:</span>
                        </div>
                        <p className="text-slate-700 italic">
                          "{action.problemContext}"
                        </p>
                      </div>
                    )}

                    {/* Main Action Description */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                        <Target className="w-3 h-3 text-indigo-600" />
                        <span>Ação Pactuada:</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug pl-1 border-l-2 border-indigo-500 py-0.5">
                        "{action.description}"
                      </h3>
                    </div>

                    {/* Meta Info: Responsible, Date, Target Period / Due Date */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Responsável</span>
                        <span className="font-bold text-slate-800">{action.responsible || 'Professor'}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Pactuação</span>
                        <span className="font-semibold text-slate-800">{action.createdDate}</span>
                      </div>

                      <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-200/60 col-span-2 sm:col-span-1">
                        <span className="text-[9px] font-bold text-indigo-500 block uppercase">Prazo de Verificação</span>
                        <span className="font-bold text-indigo-950">
                          {action.dueDate ? action.dueDate : action.targetMeetingPeriod}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* DIVISOR DO CICLO PEDAGÓGICO */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1 border border-slate-200 rounded-full py-0.5 shadow-2xs">
                        <RefreshCw className="w-2.5 h-2.5 text-indigo-500" />
                        <span>Verificação & Resultado do Ciclo</span>
                      </span>
                    </div>
                  </div>

                  {/* FASE 2: VERIFICAÇÃO & RESULTADO / EVIDÊNCIAS */}
                  <div className="space-y-2">
                    {action.resultNotes || (action.history && action.history.length > 0) ? (
                      <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        isCompleted
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : isInProgress
                          ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                          : 'bg-amber-50/60 border-amber-200 text-amber-950'
                      }`}>
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 text-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Último Resultado / Evidências:</span>
                          </span>
                          {action.history && action.history.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                              {action.history[0].date}
                            </span>
                          )}
                        </div>

                        <p className="font-medium leading-relaxed text-slate-800">
                          "{action.resultNotes || action.history?.[0]?.resultNotes}"
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                        <p className="text-[11px]">
                          Aguardando ciclo de verificação (Previsão: <strong className="text-slate-700">{action.dueDate || action.targetMeetingPeriod}</strong>).
                        </p>
                      </div>
                    )}

                    {/* Timeline de Histórico Completo de Acompanhamentos */}
                    {action.history && action.history.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleHistoryExpand(action.id)}
                          className="w-full py-1.5 px-3 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-between transition-colors cursor-pointer border border-slate-200/80"
                        >
                          <span className="flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Histórico de Acompanhamentos ({action.history.length})</span>
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {expandedHistoryIds[action.id] ? '▲ Ocultar' : '▼ Expandir Linha do Tempo'}
                          </span>
                        </button>

                        {expandedHistoryIds[action.id] && (
                          <div className="mt-2 space-y-2 pl-2 border-l-2 border-indigo-300 ml-2 pt-1 animate-in fade-in duration-150">
                            {action.history.map((entry, idx) => (
                              <div key={entry.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-[11px] border-b border-slate-100 pb-1">
                                  <span className="text-slate-800 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>{entry.date}</span>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                    entry.status === 'SUPERADA'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : entry.status === 'EM_ANDAMENTO'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {entry.status === 'SUPERADA' ? '✓ Superado' : entry.status === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Pendente'}
                                  </span>
                                </div>
                                <p className="text-slate-700 text-[11px] italic font-medium leading-relaxed">
                                  "{entry.resultNotes}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Footer Actions - Open Cycle Verification Modal */}
                <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>{action.history?.length || 0} registro(s) de ciclo</span>
                  </div>

                  <button
                    onClick={() => openCycleModal(action)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Registrar Acompanhamento / Resultado</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhum encaminhamento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não há providências cadastradas com os filtros selecionados.
          </p>
          {onAddAction && (
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-100" />
              <span>Cadastrar Primeiro Encaminhamento</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTRAR RESULTADO DO CICLO (Verificação) */}
      {/* ========================================================================= */}
      {isCycleModalOpen && actionForCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-amber-400/30">
                  Acompanhamento Pedagógico
                </span>
                <h3 className="font-bold text-base font-display mt-1">
                  Registrar Resultado do Ciclo
                </h3>
              </div>
              <button 
                onClick={() => setIsCycleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCycleResult} className="p-6 space-y-4">
              
              {/* Action Context Brief */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">
                  Professor(a): {actionForCycle.teacherName} — {actionForCycle.subjectName} ({actionForCycle.classGroupName})
                </div>
                <div className="text-slate-700 italic">
                  Ação: "{actionForCycle.description}"
                </div>
              </div>

              {/* Date of Verification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data da Verificação / Acompanhamento *
                </label>
                <input
                  type="date"
                  required
                  value={cycleDate}
                  onChange={(e) => setCycleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                />
              </div>

              {/* Status of the Cycle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Atual da Ação *
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCycleStatus('SUPERADA')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      cycleStatus === 'SUPERADA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ Realizado / Superado
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycleStatus('EM_ANDAMENTO')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      cycleStatus === 'EM_ANDAMENTO'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⏳ Em Andamento
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycleStatus('PENDENTE')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      cycleStatus === 'PENDENTE'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠️ Pendente
                  </button>
                </div>
              </div>

              {/* Observed Results & Evidence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resultado Observado / Evidências Pedagógicas *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ex: Conteúdo retomado em 2 aulas e nova avaliação aplicada. 80% dos estudantes superaram a defasagem."
                  value={cycleResultNotes}
                  onChange={(e) => setCycleResultNotes(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                />
              </div>

              {/* History Timeline of Previous Entries */}
              {actionForCycle.history && actionForCycle.history.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Histórico de Acompanhamentos Anteriores ({actionForCycle.history.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {actionForCycle.history.map((h, i) => (
                      <div key={h.id || i} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px]">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>Data: {h.date}</span>
                          <span className={
                            h.status === 'SUPERADA' ? 'text-emerald-700' : h.status === 'EM_ANDAMENTO' ? 'text-blue-700' : 'text-amber-700'
                          }>
                            {h.status === 'SUPERADA' ? '✓ Superada' : h.status === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[10px] mt-0.5">"{h.resultNotes}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Salvar e Registrar Resultado</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT FULL ACTION */}
      {/* ========================================================================= */}
      {isMainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingAction ? 'Editar Encaminhamento Pedagógico' : 'Novo Encaminhamento Pedagógico'}
                </h3>
                <p className="text-xs text-slate-400">Defina o ciclo de intervenção pedagógica</p>
              </div>
              <button 
                onClick={() => setIsMainModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="p-6 space-y-4">
              
              {/* Professor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professor(a) Responsável *
                </label>
                <select
                  required
                  value={formTeacherId}
                  onChange={(e) => handleTeacherChangeInForm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 font-medium"
                >
                  <option value="">Selecione o professor...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Disciplina & Turma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disciplina *
                  </label>
                  <select
                    required
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 font-medium"
                  >
                    <option value="">Selecione...</option>
                    {formAvailableSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Turma *
                  </label>
                  <select
                    required
                    value={formClassGroupId}
                    onChange={(e) => setFormClassGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 font-medium"
                  >
                    <option value="">Selecione...</option>
                    {formAvailableClassGroups.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.shift[0]})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Problem / Context */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Problema / Diagnóstico de Origem (Opcional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Origem da demanda</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Retomar conceitos de função devido à defasagem no 1º bimestre"
                  value={formProblemContext}
                  onChange={(e) => setFormProblemContext(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                />
              </div>

              {/* Action Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ação Pactuada / Encaminhamento *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Retomar conceitos de função em sala e reavaliar alunos em defasagem"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 font-medium"
                />
              </div>

              {/* Responsible & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Professor, Coordenação"
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActionCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 font-medium"
                  >
                    <option value="RECOMPOSICAO">Recomposição de Aprendizagem</option>
                    <option value="ACOMPANHAMENTO_INDIVIDUAL">Acompanhamento Individualizado</option>
                    <option value="AJUSTE_RITMO">Ajuste no Ritmo de Aulas</option>
                    <option value="ATIVIDADE_DIFERENCIADA">Atividade Prática / Diferenciada</option>
                    <option value="OUTRO">Apoio Pedagógico</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Target Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prazo / Data Limite
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Período de Referência
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Encontro Regular #2"
                    value={formTargetPeriod}
                    onChange={(e) => setFormTargetPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                  />
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Inicial
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFormStatus('PENDENTE')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      formStatus === 'PENDENTE'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Pendente
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('EM_ANDAMENTO')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      formStatus === 'EM_ANDAMENTO'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Em Andamento
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('SUPERADA')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      formStatus === 'SUPERADA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Superada ✓
                  </button>
                </div>
              </div>

              {/* Result / Observations (Optional at creation) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resultado / Evidências Observadas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Conteúdo retomado e nova avaliação aplicada."
                  value={formResultNotes}
                  onChange={(e) => setFormResultNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMainModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingAction ? 'Atualizar Encaminhamento' : 'Salvar Encaminhamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE MODAL */}
      {/* ========================================================================= */}
      {actionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Excluir Encaminhamento</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              "{actionToDelete.description}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionToDelete(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onDeleteAction && actionToDelete) {
                    onDeleteAction(actionToDelete.id);
                  }
                  setActionToDelete(null);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
