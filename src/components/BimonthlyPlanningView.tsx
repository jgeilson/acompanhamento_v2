import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Calendar, 
  Plus, 
  PlusCircle,
  Sparkles, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Users, 
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { 
  BimonthlyPlan, 
  Teacher, 
  Subject, 
  ClassGroup 
} from '../types';
import { PlanModal } from './PlanModal';

interface BimonthlyPlanningViewProps {
  bimonthlyPlans: BimonthlyPlan[];
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  onAddPlan: (plan: BimonthlyPlan) => void;
  onUpdatePlan: (plan: BimonthlyPlan) => void;
  onDeletePlan: (planId: string) => void;
  academicYear?: number;
}

export const BimonthlyPlanningView: React.FC<BimonthlyPlanningViewProps> = ({
  bimonthlyPlans,
  teachers,
  subjects,
  classGroups,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  academicYear
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('');
  const [selectedBimester, setSelectedBimester] = useState<1 | 2 | 3 | 4>(1);

  // Modal CRUD State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [planToEdit, setPlanToEdit] = useState<BimonthlyPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<BimonthlyPlan | null>(null);

  const activeTeacher = teachers.find(t => t.id === selectedTeacherId);
  const activeYear = academicYear || Number(localStorage.getItem('academic_year') || '2026');

  // Compute available subjects for the selected teacher and active year
  const availableSubjects = React.useMemo(() => {
    if (!activeTeacher) return subjects;

    const filtered = subjects.filter(s => {
      if (activeTeacher.subjects && activeTeacher.subjects.length > 0) {
        const match = activeTeacher.subjects.some(
          ref => ref === s.id || ref.toLowerCase() === s.name.toLowerCase() || (s.code && ref.toLowerCase() === s.code.toLowerCase())
        );
        if (match) return true;
      }
      const hasPlan = bimonthlyPlans.some(p => p.teacherId === activeTeacher.id && p.subjectId === s.id && Number(p.year || 2026) === activeYear);
      if (hasPlan) return true;

      return false;
    });

    return filtered.length > 0 ? filtered : subjects;
  }, [activeTeacher, subjects, bimonthlyPlans, activeYear]);

  // Compute available class groups for the selected teacher and active year
  const availableClassGroups = React.useMemo(() => {
    if (!activeTeacher) return classGroups;

    const filtered = classGroups.filter(c => {
      if (activeTeacher.classes && activeTeacher.classes.length > 0) {
        const match = activeTeacher.classes.some(
          ref => ref === c.id || ref.toLowerCase() === c.name.toLowerCase()
        );
        if (match) return true;
      }
      const hasPlan = bimonthlyPlans.some(p => {
        const matchTeacher = p.teacherId === activeTeacher.id;
        const pClasses = (p.classGroupIds && p.classGroupIds.length > 0) ? p.classGroupIds : [p.classGroupId];
        const matchYear = Number(p.year || 2026) === activeYear;
        return matchTeacher && pClasses.some(cId => cId === c.id || cId.toLowerCase() === c.name.toLowerCase()) && matchYear;
      });
      if (hasPlan) return true;

      return false;
    });

    return filtered.length > 0 ? filtered : classGroups;
  }, [activeTeacher, classGroups, bimonthlyPlans, activeYear]);

  // Keep selectedSubjectId valid for selected teacher
  React.useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects, selectedSubjectId]);

  // Keep selectedClassGroupId valid for selected teacher
  React.useEffect(() => {
    if (availableClassGroups.length > 0 && !availableClassGroups.some(c => c.id === selectedClassGroupId)) {
      setSelectedClassGroupId(availableClassGroups[0].id);
    }
  }, [availableClassGroups, selectedClassGroupId]);

  // Find active plan
  const activePlan = bimonthlyPlans.find(p => {
    const matchTeacher = (p.teacherId === selectedTeacherId || (activeTeacher && p.teacherId === activeTeacher.name));
    const matchSubject = (p.subjectId === selectedSubjectId || (subjects.find(s => s.id === selectedSubjectId) && p.subjectId === subjects.find(s => s.id === selectedSubjectId)?.name));
    const pClasses = (p.classGroupIds && p.classGroupIds.length > 0) ? p.classGroupIds : [p.classGroupId];
    const targetClass = classGroups.find(c => c.id === selectedClassGroupId);
    const matchClass = pClasses.some(cRef => 
      cRef === selectedClassGroupId || 
      (targetClass && cRef.toLowerCase() === targetClass.name.toLowerCase())
    );
    const matchYear = Number(p.year || 2026) === activeYear;
    return matchTeacher && matchSubject && matchClass && Number(p.bimester) === Number(selectedBimester) && matchYear;
  });

  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const activeClass = classGroups.find(c => c.id === selectedClassGroupId);

  const handleOpenNewPlan = () => {
    setPlanToEdit(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: BimonthlyPlan) => {
    setPlanToEdit(plan);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (plan: BimonthlyPlan) => {
    if (planToEdit) {
      onUpdatePlan(plan);
    } else {
      onAddPlan(plan);
    }
  };

  const handleConfirmDelete = () => {
    if (planToDelete) {
      onDeletePlan(planToDelete.id);
      setPlanToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Matriz do Planejamento Bimestral
          </h2>
        </div>

        <button
          onClick={handleOpenNewPlan}
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-indigo-200" />
          <span>Novo Planejamento</span>
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-2xl border border-indigo-900/80 shadow-md space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Painel de Seleção da Matriz de Planejamento</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Selecione para visualizar a matriz do bimestre</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Teacher */}
          <div>
            <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Professor(a):</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Disciplina:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
            >
              {availableSubjects.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
              ))}
            </select>
          </div>

          {/* Class Group */}
          <div>
            <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Turma:</label>
            <select
              value={selectedClassGroupId}
              onChange={(e) => setSelectedClassGroupId(e.target.value)}
              className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
            >
              {availableClassGroups.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Bimester */}
          <div>
            <label className="font-extrabold text-indigo-200 block mb-1 text-[11px]">Bimestre:</label>
            <select
              value={selectedBimester}
              onChange={(e) => setSelectedBimester(parseInt(e.target.value, 10) as any)}
              className="w-full bg-slate-800/90 text-white border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
            >
              <option value={1} className="bg-slate-900 text-white">1º Bimestre</option>
              <option value={2} className="bg-slate-900 text-white">2º Bimestre</option>
              <option value={3} className="bg-slate-900 text-white">3º Bimestre</option>
              <option value={4} className="bg-slate-900 text-white">4º Bimestre</option>
            </select>
          </div>

        </div>
      </div>

      {/* Plan Details Display */}
      {activePlan ? (
        <div className="space-y-6">
          
          {/* Plan Header Card with Edit / Delete actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {selectedBimester}º Bimestre • Cronograma por Período
              </span>
              <h3 className="font-bold text-slate-900 text-lg mt-1">
                {activeSubject?.name || activePlan.subjectId}
              </h3>

              {/* Linked Class Groups Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs text-slate-500 font-medium">Turmas Atendidas:</span>
                {(() => {
                  const pClasses = (activePlan.classGroupIds && activePlan.classGroupIds.length > 0)
                    ? activePlan.classGroupIds
                    : [activePlan.classGroupId];
                  return pClasses.map(cId => {
                    const cObj = classGroups.find(c => c.id === cId || c.name.toLowerCase() === cId.toLowerCase());
                    const isCurrent = cId === selectedClassGroupId || (cObj && cObj.id === selectedClassGroupId);
                    return (
                      <span
                        key={cId}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-colors ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cObj?.name || cId}
                      </span>
                    );
                  });
                })()}
                {activePlan.classGroupIds && activePlan.classGroupIds.length > 1 && (
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    ✓ Planejamento unificado ({activePlan.classGroupIds.length} turmas)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1.5">
                Docente Responsável: <strong className="text-slate-800">{activeTeacher?.name || activePlan.teacherId}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right">
                <span className="block text-[10px] font-bold text-slate-400">Total de Períodos:</span>
                <span className="font-bold text-slate-900 text-sm">{activePlan.periods.length} período(s)</span>
              </div>

              {/* CRUD Actions */}
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <button
                  onClick={() => handleOpenEditPlan(activePlan)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors"
                  title="Editar este planejamento"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPlanToDelete(activePlan)}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                  title="Excluir este planejamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Fortnights / Periods Grid */}
          <div className="space-y-4">
            {activePlan.periods.map((period) => (
              <div 
                key={period.fortnightNumber}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Period Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white font-extrabold text-xs px-3 py-1 rounded-lg">
                      {period.periodTitle || `${selectedBimester}º Bimestre`}
                    </span>
                    {activePlan.periods.length > 1 && (
                      <span className="text-xs text-slate-300 font-medium">
                        (Etapa {period.fortnightNumber})
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    {period.topics.length} tópico(s) previsto(s)
                  </span>
                </div>

                {/* Topics List */}
                <div className="p-4 divide-y divide-slate-100 space-y-3">
                  {period.topics.map((topic) => (
                    <div key={topic.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{topic.title}</span>
                          {topic.bnccCode && (
                            <span className="bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded border border-indigo-200">
                              {topic.bnccCode}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px]">Unidade Temática: <span className="font-medium text-slate-700">{topic.unitTitle}</span></p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          Previsão: {topic.estimatedHours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-4">
          <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">Sem planejamento cadastrado para os parâmetros</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não foi encontrado um cronograma bimestral para a combinação selecionada de docente, disciplina, turma e bimestre.
            </p>
          </div>
          <button
            onClick={handleOpenNewPlan}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4 text-indigo-200" />
            <span>Criar Planejamento Agora</span>
          </button>
        </div>
      )}

      {/* Plan Modal (Create / Edit) */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSave={handleSavePlan}
        planToEdit={planToEdit}
        teachers={teachers}
        subjects={subjects}
        classGroups={classGroups}
        initialTeacherId={selectedTeacherId}
        initialSubjectId={selectedSubjectId}
        initialClassGroupId={selectedClassGroupId}
        initialBimester={selectedBimester}
      />

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Excluir Planejamento Bimestral?</h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Você tem certeza que deseja remover o planejamento do <strong>{planToDelete.bimester}º Bimestre</strong>? 
              Todos os {planToDelete.periods?.length || 0} períodos e seus tópicos associados serão excluídos.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
