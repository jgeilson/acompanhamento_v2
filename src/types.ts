export interface Teacher {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  subjects: string[]; // subjectIds
  classes: string[];   // classGroupIds
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  totalWorkloadHours: number;
}

export interface ClassGroup {
  id: string;
  name: string; // Ex: "1º Ano A"
  shift: 'Matutino' | 'Vespertino' | 'Noturno';
  totalStudents: number;
}

// Planejamento Bimestral
export interface PlannedTopic {
  id: string;
  title: string;
  bnccCode?: string;
  estimatedHours: number;
  unitTitle: string;
}

export interface BimonthlyPeriodPlan {
  fortnightNumber: number; // 1, 2, 3, 4 no bimestre
  periodTitle: string;     // Ex: "1ª Quinzena de Setembro (Semanas 1 e 2)"
  topics: PlannedTopic[];
}

export interface BimonthlyPlan {
  id: string;
  teacherId: string;
  subjectId: string;
  classGroupId: string;
  bimester: 1 | 2 | 3 | 4;
  year: number;
  periods: BimonthlyPeriodPlan[];
}

// Razões do Contexto Pedagógico para Desvios do Planejamento
export type PedagogicalReasonType = 
  | 'DIFICULDADE_APRENDIZAGEM_RETOMADA'  // Dificuldades de aprendizagem / Recomposição necessária
  | 'ATIVIDADE_PRATICA_PROJETO'          // Práticas/Projetos que exigiram maior tempo
  | 'AVALIACAO_RECUPERACAO'              // Provas / Recuperação / Revisão
  | 'AJUSTE_CALENDARIO_EVENTO'           // Feriados / Eventos / Alterações do calendário
  | 'AJUSTE_PLANEJAMENTO_PROFESSOR'      // Adaptação necessária no ritmo do planejamento
  | 'RITMO_ADEQUADO';                    // Sem desvios significativos

export interface PedagogicalReasonOption {
  id: PedagogicalReasonType;
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
}

export const PEDAGOGICAL_REASON_OPTIONS: PedagogicalReasonOption[] = [
  {
    id: 'DIFICULDADE_APRENDIZAGEM_RETOMADA',
    label: 'Dificuldade de Aprendizagem / Recomposição',
    description: 'Foi necessária retomada de conceitos anteriores para garantir a consolidação da turma.',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeText: 'Retomada de Conceitos'
  },
  {
    id: 'ATIVIDADE_PRATICA_PROJETO',
    label: 'Atividade Prática / Laboratório / Projeto',
    description: 'Aprofundamento prático ou projeto integrador que demandou tempo adicional.',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    badgeText: 'Aprofundamento Prático'
  },
  {
    id: 'AVALIACAO_RECUPERACAO',
    label: 'Avaliação / Recuperação Contínua',
    description: 'Período dedicado à aplicação de avaliações, trabalhos ou recuperação paralela.',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    badgeText: 'Avaliação / Recomposição'
  },
  {
    id: 'AJUSTE_CALENDARIO_EVENTO',
    label: 'Ajuste de Calendário Escolar / Eventos',
    description: 'Feriados, feiras culturais, conselhos ou eventos institucionais da escola.',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeText: 'Calendário / Eventos'
  },
  {
    id: 'AJUSTE_PLANEJAMENTO_PROFESSOR',
    label: 'Readequação de Ritmo pelo Professor',
    description: 'Ajuste consciente da sequência didática para melhor assimilação dos estudantes.',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    badgeText: 'Ajuste Didático'
  },
  {
    id: 'RITMO_ADEQUADO',
    label: 'Dentro do Ritmo Previsto',
    description: 'O andamento das aulas seguiu exatamente a previsão inicial.',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeText: 'No Ritmo'
  }
];

// Status de Tópico na Reunião
export type TopicProgressionStatus = 'CONCLUIDO' | 'EM_ANDAMENTO' | 'RETOMADA' | 'NAO_INICIADO';

export interface TopicProgressItem {
  topicId: string;
  topicTitle: string;
  bnccCode?: string;
  status: TopicProgressionStatus;
  observation?: string;
}

// Verificação de Encaminhamentos Anteriores
export type ActionVerificationStatus = 'SUPERADA' | 'PARCIALMENTE_SUPERADA' | 'CONTINUA_PRESENTE';

export interface PreviousActionVerification {
  actionId: string;
  actionDescription: string;
  previousStatus: string;
  verificationResult: ActionVerificationStatus;
  notes?: string;
}

// Encaminhamento Pedagógico (Combinado da Reunião)
export type ActionCategory = 
  | 'RECOMPOSICAO' 
  | 'ACOMPANHAMENTO_INDIVIDUAL' 
  | 'AJUSTE_RITMO' 
  | 'ATIVIDADE_DIFERENCIADA' 
  | 'OUTRO';

export interface PedagogicalAction {
  id: string;
  meetingId: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classGroupId: string;
  classGroupName: string;
  description: string;
  category: ActionCategory;
  createdDate: string;
  targetMeetingPeriod: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA';
}

// Periodicidade / Frequência da Reunião de Acompanhamento
export type MeetingPeriodicity = 'QUINZENAL' | 'SEMANAL' | 'MENSAL' | 'EXTRAORDINARIA' | 'OUTRA';

export interface MeetingPeriodicityOption {
  id: MeetingPeriodicity;
  label: string;
  badgeBg: string;
}

export const MEETING_PERIODICITY_OPTIONS: MeetingPeriodicityOption[] = [
  { id: 'QUINZENAL', label: 'Acompanhamento Regular', badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'SEMANAL', label: 'Semanal', badgeBg: 'bg-teal-100 text-teal-800 border-teal-300' },
  { id: 'MENSAL', label: 'Mensal', badgeBg: 'bg-sky-100 text-sky-800 border-sky-300' },
  { id: 'EXTRAORDINARIA', label: 'Extraordinária / Eventual', badgeBg: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'OUTRA', label: 'Outro Período', badgeBg: 'bg-slate-100 text-slate-800 border-slate-300' }
];

// Registro Completo de Reunião de Acompanhamento Pedagógico
export interface BiweeklyMeeting {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classGroupId: string;
  classGroupName: string;
  bimester: 1 | 2 | 3 | 4;
  periodicity?: MeetingPeriodicity; // Quinzenal, Semanal, Mensal, Extraordinária, Outra
  fortnightPeriod: string; // Referência do período (Ex: "2ª Quinzena de Setembro", "Semana 38", "Outubro - Encontro 1")
  meetingDate: string;    // YYYY-MM-DD
  coordinatorName: string;
  
  // 1. Acompanhamento de Encaminhamentos Anteriores
  previousActionsVerification: PreviousActionVerification[];

  // 2. Progresso de Conteúdos da Quinzena
  topicProgress: TopicProgressItem[];

  // 3. Contexto Pedagógico do Desvio / Progresso
  hasDeviation: boolean;
  primaryReason: PedagogicalReasonType;
  pedagogicalReasons?: PedagogicalReasonType[]; // Fatores pedagógicos selecionados (suporta múltiplos)
  pedagogicalContextNotes: string; // Explicação qualitativa do professor/coordenador

  // 4. Novos Encaminhamentos
  newActions: PedagogicalAction[];
}

export type ActiveTab = 'dashboard' | 'meetings' | 'planning' | 'timeline' | 'actions';
