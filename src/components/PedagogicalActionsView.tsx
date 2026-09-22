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
  AlertTriangle
} from 'lucide-react';
import { 
  PedagogicalAction, 
  Teacher, 
  Subject, 
  ClassGroup,
  ActionCategory
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<PedagogicalAction | null>(null);
  const [actionToDelete, setActionToDelete] = useState<PedagogicalAction | null>(null);

  // Form Fields
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formClassGroupId, setFormClassGroupId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ActionCategory>('RECOMPOSICAO');
  const [formTargetPeriod, setFormTargetPeriod] = useState<string>('Encontro Regular #2');
  const [formStatus, setFormStatus] = useState<'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'>('PENDENTE');

  const openCreateModal = () => {
    setEditingAction(null);
    const defaultTeacher = teachers[0]?.id || '';
    setFormTeacherId(defaultTeacher);
    setFormSubjectId(subjects[0]?.id || '');
    setFormClassGroupId(classGroups[0]?.id || '');
    setFormDescription('');
    setFormCategory('RECOMPOSICAO');
    setFormTargetPeriod('Encontro Regular #2');
    setFormStatus('PENDENTE');
    setIsModalOpen(true);
  };

  const openEditModal = (act: PedagogicalAction) => {
    setEditingAction(act);
    setFormTeacherId(act.teacherId);
    setFormSubjectId(act.subjectId);
    setFormClassGroupId(act.classGroupId);
    setFormDescription(act.description);
    setFormCategory(act.category);
    setFormTargetPeriod(act.targetMeetingPeriod);
    setFormStatus(act.status);
    setIsModalOpen(true);
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
      description: formDescription.trim(),
      category: formCategory,
      createdDate: editingAction ? editingAction.createdDate : new Date().toISOString().split('T')[0],
      targetMeetingPeriod: formTargetPeriod.trim() || 'Próximo Encontro',
      status: formStatus
    };

    if (editingAction && onUpdateAction) {
      onUpdateAction(actionData);
    } else if (onAddAction) {
      onAddAction(actionData);
    }

    setIsModalOpen(false);
  };

  const filteredActions = actions.filter(a => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchTeacher = a.teacherName.toLowerCase().includes(q);
      const matchClass = a.classGroupName.toLowerCase().includes(q);
      if (!matchDesc && !matchTeacher && !matchClass) return false;
    }

    if (selectedStatus !== 'TODOS' && a.status !== selectedStatus) return false;
    if (selectedTeacherFilter && a.teacherId !== selectedTeacherFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <span>Encaminhamentos Pedagógicos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe, crie e atualize as ações pactuadas nos encontros pedagógicos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs text-right">
            <div className="text-slate-400 font-medium">Ações Pendentes</div>
            <div className="text-lg font-bold text-amber-400">
              {actions.filter(a => a.status !== 'SUPERADA').length} ações
            </div>
          </div>

          {onAddAction && (
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-amber-100" />
              <span>Novo Encaminhamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por descrição, professor ou turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Apenas Pendentes</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="SUPERADA">Superadas (Concluídas)</option>
          </select>
        </div>

        {/* Teacher Filter */}
        <div>
          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          >
            <option value="">Todos os Professores</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Actions Grid */}
      {filteredActions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map(action => (
            <div 
              key={action.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                action.status === 'SUPERADA' 
                  ? 'border-emerald-200/90 bg-emerald-50/10' 
                  : action.status === 'EM_ANDAMENTO'
                  ? 'border-blue-200/90 bg-blue-50/10'
                  : 'border-amber-200/90 bg-amber-50/10'
              }`}
            >
              <div className="space-y-3">
                
                {/* Header Tag and Edit/Delete controls */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {CATEGORY_LABELS[action.category] || action.category}
                  </span>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">
                      {action.createdDate}
                    </span>

                    {onUpdateAction && (
                      <button
                        onClick={() => openEditModal(action)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Editar Encaminhamento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDeleteAction && (
                      <button
                        onClick={() => setActionToDelete(action)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir Encaminhamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  "{action.description}"
                </h3>

                {/* Context Info */}
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div><strong>Professor(a):</strong> {action.teacherName}</div>
                  <div><strong>Disciplina & Turma:</strong> {action.subjectName} — {action.classGroupName}</div>
                  <div><strong>Previsão de Retomada:</strong> <span className="text-indigo-700 font-semibold">{action.targetMeetingPeriod}</span></div>
                </div>

              </div>

              {/* Status Selector Controls */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <span className="font-bold text-slate-500">Status da Ação:</span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateActionStatus(action.id, 'PENDENTE')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      action.status === 'PENDENTE'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Pendente
                  </button>

                  <button
                    onClick={() => onUpdateActionStatus(action.id, 'EM_ANDAMENTO')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      action.status === 'EM_ANDAMENTO'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Em Andamento
                  </button>

                  <button
                    onClick={() => onUpdateActionStatus(action.id, 'SUPERADA')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      action.status === 'SUPERADA'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Superada ✓
                  </button>
                </div>
              </div>

            </div>
          ))}
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
      {/* MODAL: CREATE / EDIT ACTION */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingAction ? 'Editar Encaminhamento Pedagógico' : 'Novo Encaminhamento Pedagógico'}
                </h3>
                <p className="text-xs text-slate-400">Defina o compromisso de intervenção pedagógica</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="p-6 space-y-4 text-xs text-slate-700">
              
              <div>
                <label className="font-bold text-slate-800 block mb-1">Professor(a) Responsável *</label>
                <select
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                >
                  <option value="">Selecione o professor...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Disciplina *</label>
                  <select
                    required
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                  >
                    <option value="">Selecione...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Turma *</label>
                  <select
                    required
                    value={formClassGroupId}
                    onChange={(e) => setFormClassGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                  >
                    <option value="">Selecione...</option>
                    {classGroups.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.shift[0]})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Descrição da Ação / Encaminhamento *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Realizar atividade diagnóstica de recuperação com foco nas habilidades defasadas de trigonometria..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Categoria Pedagógica</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActionCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                  >
                    <option value="RECOMPOSICAO">Recomposição de Aprendizagem</option>
                    <option value="ACOMPANHAMENTO_INDIVIDUAL">Acompanhamento Individual</option>
                    <option value="AJUSTE_RITMO">Ajuste no Ritmo de Aulas</option>
                    <option value="ATIVIDADE_DIFERENCIADA">Atividade Prática / Diferenciada</option>
                    <option value="OUTRO">Apoio Pedagógico Geral</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Previsão de Retomada</label>
                  <input
                    type="text"
                    placeholder="Ex: Encontro Regular #2"
                    value={formTargetPeriod}
                    onChange={(e) => setFormTargetPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Status Inicial</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PENDENTE', 'EM_ANDAMENTO', 'SUPERADA'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        formStatus === st
                          ? st === 'SUPERADA' 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'EM_ANDAMENTO'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'SUPERADA' ? 'Superada' : st === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Pendente'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow"
                >
                  {editingAction ? 'Salvar Alterações' : 'Criar Encaminhamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE ACTION CONFIRMATION */}
      {/* ========================================================================= */}
      {actionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Encaminhamento</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja excluir este encaminhamento: <strong>"{actionToDelete.description}"</strong> de {actionToDelete.teacherName}?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAction && actionToDelete) {
                    onDeleteAction(actionToDelete.id);
                  }
                  setActionToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all shadow"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
