import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Calendar, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Users,
  Search
} from 'lucide-react';
import { 
  BimonthlyPlan, 
  Teacher, 
  Subject, 
  ClassGroup 
} from '../types';

interface BimonthlyPlanningViewProps {
  bimonthlyPlans: BimonthlyPlan[];
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
}

export const BimonthlyPlanningView: React.FC<BimonthlyPlanningViewProps> = ({
  bimonthlyPlans,
  teachers,
  subjects,
  classGroups
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('');
  const [selectedBimester, setSelectedBimester] = useState<1 | 2 | 3 | 4>(3);

  const activeTeacher = teachers.find(t => t.id === selectedTeacherId);

  // Compute available subjects for the selected teacher
  const availableSubjects = React.useMemo(() => {
    if (!activeTeacher) return subjects;

    const filtered = subjects.filter(s => {
      if (activeTeacher.subjects && activeTeacher.subjects.length > 0) {
        const match = activeTeacher.subjects.some(
          ref => ref === s.id || ref.toLowerCase() === s.name.toLowerCase() || (s.code && ref.toLowerCase() === s.code.toLowerCase())
        );
        if (match) return true;
      }
      const hasPlan = bimonthlyPlans.some(p => p.teacherId === activeTeacher.id && p.subjectId === s.id);
      if (hasPlan) return true;

      return false;
    });

    return filtered.length > 0 ? filtered : subjects;
  }, [activeTeacher, subjects, bimonthlyPlans]);

  // Compute available class groups for the selected teacher
  const availableClassGroups = React.useMemo(() => {
    if (!activeTeacher) return classGroups;

    const filtered = classGroups.filter(c => {
      if (activeTeacher.classes && activeTeacher.classes.length > 0) {
        const match = activeTeacher.classes.some(
          ref => ref === c.id || ref.toLowerCase() === c.name.toLowerCase()
        );
        if (match) return true;
      }
      const hasPlan = bimonthlyPlans.some(p => p.teacherId === activeTeacher.id && p.classGroupId === c.id);
      if (hasPlan) return true;

      return false;
    });

    return filtered.length > 0 ? filtered : classGroups;
  }, [activeTeacher, classGroups, bimonthlyPlans]);

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
  const activePlan = bimonthlyPlans.find(p => 
    p.teacherId === selectedTeacherId && 
    p.subjectId === selectedSubjectId && 
    p.classGroupId === selectedClassGroupId &&
    p.bimester === selectedBimester
  );

  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const activeClass = classGroups.find(c => c.id === selectedClassGroupId);

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Matriz do Planejamento Bimestral
          </h2>
        </div>

        
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* Teacher */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Professor(a):</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:bg-white"
          >
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Disciplina:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white"
          >
            {availableSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Turma:</label>
          <select
            value={selectedClassGroupId}
            onChange={(e) => setSelectedClassGroupId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white"
          >
            {availableClassGroups.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Bimester */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Bimestre:</label>
          <select
            value={selectedBimester}
            onChange={(e) => setSelectedBimester(Number(e.target.value) as 1|2|3|4)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:bg-white"
          >
            <option value={1}>1º Bimestre</option>
            <option value={2}>2º Bimestre</option>
            <option value={3}>3º Bimestre</option>
            <option value={4}>4º Bimestre</option>
          </select>
        </div>

      </div>

      {/* Plan Details Display */}
      {activePlan ? (
        <div className="space-y-6">
          
          {/* Plan Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {selectedBimester}º Bimestre • Cronograma por Período
              </span>
              <h3 className="font-bold text-slate-900 text-lg mt-1">
                {activeSubject?.name} — {activeClass?.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Docente Responsável: <strong className="text-slate-800">{activeTeacher?.name}</strong>
              </p>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
              <span className="block text-[10px] font-bold text-slate-400">Total de Períodos:</span>
              <span className="font-bold text-slate-900 text-sm">{activePlan.periods.length} período(s) previsto(s)</span>
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
                    <span className="bg-amber-500 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                      Período #{period.fortnightNumber}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100">{period.periodTitle}</h4>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <BookOpenCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Sem planejamento cadastrado para os parâmetros</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não foi encontrado um plano de curso bimestral inicial para a combinação selecionada.
          </p>
        </div>
      )}

    </div>
  );
};
