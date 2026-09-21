import { 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction 
} from '../types';

// Coleções iniciais vazias - alimentadas dinamicamente via Planilha Google
export const INITIAL_TEACHERS: Teacher[] = [];
export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_CLASS_GROUPS: ClassGroup[] = [];
export const INITIAL_BIMONTHLY_PLANS: BimonthlyPlan[] = [];
export const INITIAL_BIWEEKLY_MEETINGS: BiweeklyMeeting[] = [];
export const INITIAL_PEDAGOGICAL_ACTIONS: PedagogicalAction[] = [];

// Nome padrão da Coordenação Pedagógica
export const DEFAULT_COORDINATOR_NAME = 'Coordenação Pedagógica';

