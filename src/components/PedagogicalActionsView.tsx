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
  Filter
} from 'lucide-react';
import { 
  PedagogicalAction, 
  Teacher, 
  Subject, 
  ClassGroup 
} from '../types';

interface PedagogicalActionsViewProps {
  actions: PedagogicalAction[];
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  onUpdateActionStatus: (actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA') => void;
}

export const PedagogicalActionsView: React.FC<PedagogicalActionsViewProps> = ({
  actions,
  teachers,
  subjects,
  classGroups,
  onUpdateActionStatus
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');

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
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Encaminhamentos Pedagógicos
          </h2>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-right">
          <div className="text-slate-400 font-medium">Encaminhamentos Pendentes</div>
          <div className="text-xl font-bold text-amber-400">
            {actions.filter(a => a.status !== 'SUPERADA').length} ações
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar encaminhamento por palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white font-bold"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">⏳ Pendentes</option>
            <option value="EM_ANDAMENTO">⚡ Em Andamento</option>
            <option value="SUPERADA">✓ Superadas</option>
          </select>
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

      </div>

      {/* Action Cards List */}
      {filteredActions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map((action) => (
            <div 
              key={action.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {action.category === 'RECOMPOSICAO' ? 'Recomposição de Aprendizagem' :
                     action.category === 'ACOMPANHAMENTO_INDIVIDUAL' ? 'Acompanhamento Individualizado' :
                     action.category === 'AJUSTE_RITMO' ? 'Ajuste no Ritmo de Aulas' :
                     action.category === 'ATIVIDADE_DIFERENCIADA' ? 'Atividade Prática / Diferenciada' : 'Apoio Pedagógico'}
                  </span>

                  <span className="text-[10px] text-slate-400 font-medium">
                    Criado em: {action.createdDate}
                  </span>
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
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
        </div>
      )}

    </div>
  );
};
