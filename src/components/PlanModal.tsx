import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  PlusCircle,
  Trash2, 
  Calendar, 
  BookOpen, 
  Users, 
  Save, 
  Layers, 
  Clock, 
  Hash,
  AlertCircle
} from 'lucide-react';
import { 
  BimonthlyPlan, 
  BimonthlyPeriodPlan, 
  PlannedTopic, 
  Teacher, 
  Subject, 
  ClassGroup 
} from '../types';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: BimonthlyPlan) => void;
  planToEdit?: BimonthlyPlan | null;
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  initialTeacherId?: string;
  initialSubjectId?: string;
  initialClassGroupId?: string;
  initialClassGroupIds?: string[];
  initialBimester?: 1 | 2 | 3 | 4;
}

interface PeriodDraft {
  id: string; // temporary key
  fortnightNumber: number;
  periodTitle: string;
  topics: Array<{
    id: string;
    title: string;
    bnccCode: string;
    estimatedHours: number;
    unitTitle: string;
  }>;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  planToEdit,
  teachers,
  subjects,
  classGroups,
  initialTeacherId,
  initialSubjectId,
  initialClassGroupId,
  initialClassGroupIds,
  initialBimester
}) => {
  const [teacherId, setTeacherId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [selectedClassGroupIds, setSelectedClassGroupIds] = useState<string[]>([]);
  const [bimester, setBimester] = useState<1 | 2 | 3 | 4>(1);
  const [year, setYear] = useState<number>(2026);
  const [periods, setPeriods] = useState<PeriodDraft[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const getSeriesFromClassName = (name: string): string => {
    const match = name.match(/^(\d+[ºª°]?\s*(?:Ano|Série|ano|série))/i) 
      || name.match(/^(\d+[ºª°]?)/)
      || name.match(/^([^\s\-–]+)/);
    return match ? match[0].trim() : name.trim();
  };

  // Group classes by series/grade
  const seriesMap = React.useMemo(() => {
    const map = new Map<string, ClassGroup[]>();
    classGroups.forEach(c => {
      const seriesKey = getSeriesFromClassName(c.name);
      if (!map.has(seriesKey)) {
        map.set(seriesKey, []);
      }
      map.get(seriesKey)!.push(c);
    });
    return map;
  }, [classGroups]);

  const availableSeriesList = React.useMemo(() => {
    return Array.from(seriesMap.keys());
  }, [seriesMap]);

  useEffect(() => {
    if (!isOpen) return;

    if (planToEdit) {
      setTeacherId(planToEdit.teacherId);
      setSubjectId(planToEdit.subjectId);
      const cIds = (planToEdit.classGroupIds && planToEdit.classGroupIds.length > 0)
        ? planToEdit.classGroupIds
        : (planToEdit.classGroupId ? [planToEdit.classGroupId] : []);
      setSelectedClassGroupIds(cIds);
      setBimester(planToEdit.bimester);
      setYear(planToEdit.year || 2026);
      
      // Determine active series
      const firstClass = classGroups.find(c => cIds.includes(c.id));
      if (firstClass) {
        setSelectedSeries(getSeriesFromClassName(firstClass.name));
      } else if (classGroups.length > 0) {
        setSelectedSeries(getSeriesFromClassName(classGroups[0].name));
      }
      
      const loadedPeriods: PeriodDraft[] = (planToEdit.periods || []).map((p, pIdx) => ({
        id: `period-${p.fortnightNumber || pIdx + 1}`,
        fortnightNumber: p.fortnightNumber || pIdx + 1,
        periodTitle: `${planToEdit.bimester}º Bimestre`,
        topics: (p.topics || []).map((t, tIdx) => ({
          id: t.id || `topic-${p.fortnightNumber || pIdx + 1}-${tIdx + 1}`,
          title: t.title || '',
          bnccCode: t.bnccCode || '',
          estimatedHours: t.estimatedHours || 4,
          unitTitle: t.unitTitle || ''
        }))
      }));
      setPeriods(loadedPeriods.length > 0 ? loadedPeriods : [createEmptyPeriod(1, planToEdit.bimester)]);
    } else {
      const bim = initialBimester || 1;
      setTeacherId(initialTeacherId || teachers[0]?.id || '');
      setSubjectId(initialSubjectId || subjects[0]?.id || '');
      
      const defaultClasses = initialClassGroupIds && initialClassGroupIds.length > 0
        ? initialClassGroupIds
        : (initialClassGroupId ? [initialClassGroupId] : (classGroups[0] ? [classGroups[0].id] : []));
      
      const refClass = classGroups.find(c => defaultClasses.includes(c.id)) || classGroups[0];
      const initialSeries = refClass ? getSeriesFromClassName(refClass.name) : (availableSeriesList[0] || '');
      setSelectedSeries(initialSeries);

      // If specific class group IDs were given, use them; otherwise, select all classes in that series by default
      if (initialClassGroupIds && initialClassGroupIds.length > 0) {
        setSelectedClassGroupIds(initialClassGroupIds);
      } else if (initialSeries) {
        const classesOfSeries = seriesMap.get(initialSeries) || [];
        setSelectedClassGroupIds(classesOfSeries.map(c => c.id));
      } else {
        setSelectedClassGroupIds(defaultClasses);
      }

      setBimester(bim);
      setYear(Number(localStorage.getItem('academic_year') || '2026'));
      setPeriods([
        createEmptyPeriod(1, bim)
      ]);
    }
    setErrorMessage('');
  }, [isOpen, planToEdit, initialTeacherId, initialSubjectId, initialClassGroupId, initialClassGroupIds, initialBimester, teachers, subjects, classGroups, seriesMap, availableSeriesList]);

  const handleSelectSeries = (series: string) => {
    setSelectedSeries(series);
    // Automatically select all classes in this newly chosen series
    const classesOfSeries = seriesMap.get(series) || [];
    setSelectedClassGroupIds(classesOfSeries.map(c => c.id));
  };

  function createEmptyPeriod(num: number, bimValue?: 1 | 2 | 3 | 4): PeriodDraft {
    const currentBim = bimValue || bimester;
    return {
      id: `p-draft-${Date.now()}-${num}`,
      fortnightNumber: num,
      periodTitle: `${currentBim}º Bimestre`,
      topics: [
        {
          id: `top-${Date.now()}-${num}-1`,
          title: '',
          bnccCode: '',
          estimatedHours: 4,
          unitTitle: ''
        }
      ]
    };
  }

  if (!isOpen) return null;

  const handleBimesterChange = (newBim: 1 | 2 | 3 | 4) => {
    setBimester(newBim);
    // Update the period title to the new bimester
    setPeriods(periods.map(p => ({
      ...p,
      periodTitle: `${newBim}º Bimestre`
    })));
  };

  const handleAddPeriod = () => {
    const nextNum = periods.length + 1;
    setPeriods([...periods, createEmptyPeriod(nextNum, bimester)]);
  };

  const handleRemovePeriod = (index: number) => {
    if (periods.length <= 1) {
      alert('O planejamento deve conter pelo menos um período.');
      return;
    }
    const updated = periods.filter((_, i) => i !== index).map((p, idx) => ({
      ...p,
      fortnightNumber: idx + 1,
      periodTitle: `${bimester}º Bimestre`
    }));
    setPeriods(updated);
  };

  const handlePeriodTitleChange = (index: number, title: string) => {
    const updated = [...periods];
    updated[index].periodTitle = title;
    setPeriods(updated);
  };

  const handleAddTopic = (periodIndex: number) => {
    const updated = [...periods];
    const p = updated[periodIndex];
    const nextTopNum = p.topics.length + 1;
    p.topics.push({
      id: `top-${Date.now()}-${p.fortnightNumber}-${nextTopNum}`,
      title: '',
      bnccCode: '',
      estimatedHours: 4,
      unitTitle: p.topics[0]?.unitTitle || ''
    });
    setPeriods(updated);
  };

  const handleRemoveTopic = (periodIndex: number, topicIndex: number) => {
    const updated = [...periods];
    const p = updated[periodIndex];
    if (p.topics.length <= 1) {
      alert('Cada período deve ter pelo menos um tópico.');
      return;
    }
    p.topics = p.topics.filter((_, i) => i !== topicIndex);
    setPeriods(updated);
  };

  const handleTopicChange = (
    periodIndex: number, 
    topicIndex: number, 
    field: 'title' | 'bnccCode' | 'unitTitle' | 'estimatedHours', 
    value: any
  ) => {
    const updated = [...periods];
    const topic = updated[periodIndex].topics[topicIndex];
    if (field === 'estimatedHours') {
      topic.estimatedHours = Math.max(1, parseInt(value, 10) || 1);
    } else {
      topic[field] = value;
    }
    setPeriods(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId) {
      setErrorMessage('Selecione o professor responsável.');
      return;
    }
    if (!subjectId) {
      setErrorMessage('Selecione a disciplina.');
      return;
    }
    if (selectedClassGroupIds.length === 0) {
      setErrorMessage('Selecione pelo menos uma turma para este planejamento.');
      return;
    }

    // Check if topics have titles
    for (let pIdx = 0; pIdx < periods.length; pIdx++) {
      const p = periods[pIdx];
      for (let tIdx = 0; tIdx < p.topics.length; tIdx++) {
        const t = p.topics[tIdx];
        if (!t.title.trim()) {
          setErrorMessage(`Preencha o título do tópico no ${p.periodTitle}.`);
          return;
        }
      }
    }

    const compiledPeriods: BimonthlyPeriodPlan[] = periods.map((p, idx) => ({
      fortnightNumber: idx + 1,
      periodTitle: `${bimester}º Bimestre`,
      topics: p.topics.map(t => ({
        id: t.id,
        title: t.title.trim(),
        bnccCode: t.bnccCode.trim() || undefined,
        estimatedHours: t.estimatedHours,
        unitTitle: t.unitTitle.trim() || 'Geral'
      }))
    }));

    const finalPlan: BimonthlyPlan = {
      id: planToEdit ? planToEdit.id : `plan-${Date.now()}`,
      teacherId,
      subjectId,
      classGroupId: selectedClassGroupIds[0],
      classGroupIds: selectedClassGroupIds,
      bimester,
      year: year || 2026,
      periods: compiledPeriods
    };

    onSave(finalPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/30 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/30">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100 font-display">
                {planToEdit ? 'Editar Planejamento Bimestral' : 'Novo Planejamento Bimestral'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Top Controls: Teacher, Subject, Series, Bimester, Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Teacher */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Docente:</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
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
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Series / Grade dropdown list */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Série / Ano:</label>
              <select
                value={selectedSeries}
                onChange={(e) => handleSelectSeries(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                {availableSeriesList.map(seriesKey => {
                  const total = (seriesMap.get(seriesKey) || []).length;
                  return (
                    <option key={seriesKey} value={seriesKey}>
                      {seriesKey} ({total} {total === 1 ? 'turma' : 'turmas'})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Bimester */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bimestre:</label>
              <select
                value={bimester}
                onChange={(e) => handleBimesterChange(parseInt(e.target.value, 10) as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1º Bimestre</option>
                <option value={2}>2º Bimestre</option>
                <option value={3}>3º Bimestre</option>
                <option value={4}>4º Bimestre</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ano Letivo:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10) || 2026)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Concise Indication of Assigned Classes for the chosen Series */}
            {(() => {
              const currentClasses = seriesMap.get(selectedSeries) || [];
              if (currentClasses.length === 0) return null;

              return (
                <div className="col-span-1 sm:col-span-2 lg:col-span-5 pt-2.5 mt-1 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Turmas atribuídas a esta série ({currentClasses.length}):</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentClasses.map(c => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-950 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        <span>{c.name}</span>
                        {c.shift && (
                          <span className="text-[10px] text-slate-400 font-normal">({c.shift})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Periods & Topics Manager */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Conteúdos do Bimestre</h4>
                <p className="text-slate-500 text-[11px]">Tópicos com código BNCC e carga horária.</p>
              </div>
              <button
                type="button"
                onClick={handleAddPeriod}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg font-bold transition-colors text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Bloco de Conteúdo</span>
              </button>
            </div>

            {periods.map((period, pIdx) => (
              <div 
                key={period.id} 
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-3 p-4"
              >
                {/* Period Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="bg-indigo-700 text-white font-extrabold text-xs px-3 py-1 rounded-lg shrink-0 shadow-2xs">
                      {bimester}º Bimestre
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {periods.length > 1 ? `Etapa / Bloco ${pIdx + 1}` : 'Planejamento Bimestral'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleAddTopic(pIdx)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg font-semibold text-[11px] shadow-2xs transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Adicionar Tópico</span>
                    </button>
                    {periods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePeriod(pIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remover este bloco"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Topics of this Period */}
                <div className="space-y-2.5">
                  {period.topics.map((topic, tIdx) => (
                    <div 
                      key={topic.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      {/* Topic Title */}
                      <div className="sm:col-span-5 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 block">Título do Tópico / Habilidade:</label>
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => handleTopicChange(pIdx, tIdx, 'title', e.target.value)}
                          placeholder="Ex: Introdução à Cinemática e MRU"
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                          required
                        />
                      </div>

                      {/* Unit Title */}
                      <div className="sm:col-span-3 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 block">Unidade Temática:</label>
                        <input
                          type="text"
                          value={topic.unitTitle}
                          onChange={(e) => handleTopicChange(pIdx, tIdx, 'unitTitle', e.target.value)}
                          placeholder="Ex: Matéria e Energia"
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      {/* BNCC Code */}
                      <div className="sm:col-span-2 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 block">Cód. BNCC:</label>
                        <input
                          type="text"
                          value={topic.bnccCode}
                          onChange={(e) => handleTopicChange(pIdx, tIdx, 'bnccCode', e.target.value)}
                          placeholder="Ex: EF09CI01"
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>

                      {/* Estimated Hours */}
                      <div className="sm:col-span-1 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 block">Horas:</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={topic.estimatedHours}
                          onChange={(e) => handleTopicChange(pIdx, tIdx, 'estimatedHours', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-900 text-center font-bold"
                        />
                      </div>

                      {/* Remove Topic */}
                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        {period.topics.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveTopic(pIdx, tIdx)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remover tópico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-6" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Planejamento</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
