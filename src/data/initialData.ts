import { 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction 
} from '../types';

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'Prof. Carlos Eduardo Mendes',
    email: 'carlos.mendes@escola.edu.br',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    subjects: ['sub-mat', 'sub-fis'],
    classes: ['cg-1a', 'cg-2b']
  },
  {
    id: 't2',
    name: 'Profa. Juliana Vasconcelos',
    email: 'juliana.vasconcelos@escola.edu.br',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    subjects: ['sub-por'],
    classes: ['cg-1a', 'cg-3c']
  },
  {
    id: 't3',
    name: 'Prof. Marcos Aurélio Silva',
    email: 'marcos.silva@escola.edu.br',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    subjects: ['sub-his'],
    classes: ['cg-2b', 'cg-3c']
  },
  {
    id: 't4',
    name: 'Profa. Camila Rocha',
    email: 'camila.rocha@escola.edu.br',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    subjects: ['sub-fis'],
    classes: ['cg-3c']
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-mat',
    name: 'Matemática',
    code: 'MAT-101',
    color: '#2563eb', // Blue
    totalWorkloadHours: 120
  },
  {
    id: 'sub-por',
    name: 'Língua Portuguesa e Literatura',
    code: 'POR-101',
    color: '#059669', // Emerald
    totalWorkloadHours: 120
  },
  {
    id: 'sub-his',
    name: 'História Geral e do Brasil',
    code: 'HIS-101',
    color: '#d97706', // Amber
    totalWorkloadHours: 80
  },
  {
    id: 'sub-fis',
    name: 'Física',
    code: 'FIS-101',
    color: '#7c3aed', // Purple
    totalWorkloadHours: 80
  }
];

export const INITIAL_CLASS_GROUPS: ClassGroup[] = [
  {
    id: 'cg-1a',
    name: '1º Ano A',
    shift: 'Matutino',
    totalStudents: 34
  },
  {
    id: 'cg-2b',
    name: '2º Ano B',
    shift: 'Matutino',
    totalStudents: 31
  },
  {
    id: 'cg-3c',
    name: '3º Ano C',
    shift: 'Vespertino',
    totalStudents: 28
  }
];

// Planejamentos Bimestrais Iniciais
export const INITIAL_BIMONTHLY_PLANS: BimonthlyPlan[] = [
  {
    id: 'plan-fis-3c-b3',
    teacherId: 't4',
    subjectId: 'sub-fis',
    classGroupId: 'cg-3c',
    bimester: 3,
    year: 2026,
    periods: [
      {
        fortnightNumber: 1,
        periodTitle: '1ª Quinzena de Agosto (Semanas 1 e 2)',
        topics: [
          {
            id: 'top-f3-1',
            title: 'Carga Elétrica e Processos de Eletrização',
            bnccCode: '(EM13CNT101)',
            estimatedHours: 6,
            unitTitle: 'Eletrostática'
          },
          {
            id: 'top-f3-2',
            title: 'Lei de Coulomb e Campo Elétrico',
            bnccCode: '(EM13CNT102)',
            estimatedHours: 6,
            unitTitle: 'Eletrostática'
          }
        ]
      },
      {
        fortnightNumber: 2,
        periodTitle: '2ª Quinzena de Agosto (Semanas 3 e 4)',
        topics: [
          {
            id: 'top-f3-3',
            title: 'Potencial Elétrico e Diferença de Potencial (Tensão)',
            bnccCode: '(EM13CNT103)',
            estimatedHours: 6,
            unitTitle: 'Eletrostática'
          },
          {
            id: 'top-f3-4',
            title: 'Corrente Elétrica e Movimento Ordenado de Cargas',
            bnccCode: '(EM13CNT104)',
            estimatedHours: 6,
            unitTitle: 'Eletrodinâmica'
          }
        ]
      },
      {
        fortnightNumber: 3,
        periodTitle: '1ª Quinzena de Setembro (Semanas 5 e 6)',
        topics: [
          {
            id: 'top-f3-5',
            title: 'Resistência Elétrica e 1ª e 2ª Leis de Ohm',
            bnccCode: '(EM13CNT105)',
            estimatedHours: 6,
            unitTitle: 'Eletrodinâmica'
          },
          {
            id: 'top-f3-6',
            title: 'Potência Elétrica e Consumo de Energia Residencial',
            bnccCode: '(EM13CNT106)',
            estimatedHours: 6,
            unitTitle: 'Eletrodinâmica'
          },
          {
            id: 'top-f3-7',
            title: 'Circuitos Elétricos e Associação de Resistores',
            bnccCode: '(EM13CNT107)',
            estimatedHours: 6,
            unitTitle: 'Eletrodinâmica'
          }
        ]
      },
      {
        fortnightNumber: 4,
        periodTitle: '2ª Quinzena de Setembro (Semanas 7 e 8)',
        topics: [
          {
            id: 'top-f3-8',
            title: 'Leis de Kirchhoff (Malhas e Nós)',
            bnccCode: '(EM13CNT108)',
            estimatedHours: 6,
            unitTitle: 'Eletrodinâmica'
          },
          {
            id: 'top-f3-9',
            title: 'Geradores e Receptores Elétricos',
            bnccCode: '(EM13CNT109)',
            estimatedHours: 6,
            unitTitle: 'Eletrodinâmica'
          }
        ]
      }
    ]
  },
  {
    id: 'plan-mat-1a-b3',
    teacherId: 't1',
    subjectId: 'sub-mat',
    classGroupId: 'cg-1a',
    bimester: 3,
    year: 2026,
    periods: [
      {
        fortnightNumber: 1,
        periodTitle: '1ª Quinzena de Agosto (Semanas 1 e 2)',
        topics: [
          {
            id: 'top-m1-1',
            title: 'Conceito de Funções de 1º Grau e Coeficientes',
            bnccCode: '(EM13MAT101)',
            estimatedHours: 8,
            unitTitle: 'Álgebra e Funções'
          }
        ]
      },
      {
        fortnightNumber: 2,
        periodTitle: '2ª Quinzena de Agosto (Semanas 3 e 4)',
        topics: [
          {
            id: 'top-m1-2',
            title: 'Função Quadrática e Construção da Parábola',
            bnccCode: '(EM13MAT302)',
            estimatedHours: 8,
            unitTitle: 'Álgebra e Funções'
          }
        ]
      },
      {
        fortnightNumber: 3,
        periodTitle: '1ª Quinzena de Setembro (Semanas 5 e 6)',
        topics: [
          {
            id: 'top-m1-3',
            title: 'Vértice da Parábola, Valor Máximo e Mínimo',
            bnccCode: '(EM13MAT303)',
            estimatedHours: 8,
            unitTitle: 'Álgebra e Funções'
          },
          {
            id: 'top-m1-4',
            title: 'Modelagem de Problemas Práticos com Função Quadrática',
            bnccCode: '(EM13MAT304)',
            estimatedHours: 8,
            unitTitle: 'Álgebra e Funções'
          }
        ]
      }
    ]
  }
];

// Nome padrão da Coordenadora / Coordenador Pedagógico
export const DEFAULT_COORDINATOR_NAME = 'Isabelle';

// Registros Historicos de Reuniões Quinzenais
export const INITIAL_BIWEEKLY_MEETINGS: BiweeklyMeeting[] = [
  {
    id: 'meet-101',
    teacherId: 't4',
    teacherName: 'Profa. Camila Rocha',
    subjectId: 'sub-fis',
    subjectName: 'Física',
    classGroupId: 'cg-3c',
    classGroupName: '3º Ano C',
    bimester: 3,
    periodicity: 'QUINZENAL',
    fortnightPeriod: '2ª Quinzena de Agosto',
    meetingDate: '2026-08-28',
    coordinatorName: DEFAULT_COORDINATOR_NAME,
    previousActionsVerification: [],
    topicProgress: [
      {
        topicId: 'top-f3-3',
        topicTitle: 'Potencial Elétrico e Diferença de Potencial (Tensão)',
        bnccCode: '(EM13CNT103)',
        status: 'CONCLUIDO',
        observation: 'Aulas teóricas e resolução de problemas concluídas com boa adesão.'
      },
      {
        topicId: 'top-f3-4',
        topicTitle: 'Corrente Elétrica e Movimento Ordenado de Cargas',
        bnccCode: '(EM13CNT104)',
        status: 'CONCLUIDO',
        observation: 'Os alunos compreenderam a analogia do fluxo de elétrons.'
      }
    ],
    hasDeviation: false,
    primaryReason: 'RITMO_ADEQUADO',
    pedagogicalContextNotes: 'A turma do 3º Ano C acompanhou bem os conceitos iniciais de eletrodinâmica. Houve boa participação durante a resolução de listas de exercícios em sala.',
    newActions: [
      {
        id: 'act-201',
        meetingId: 'meet-101',
        teacherId: 't4',
        teacherName: 'Profa. Camila Rocha',
        subjectId: 'sub-fis',
        subjectName: 'Física',
        classGroupId: 'cg-3c',
        classGroupName: '3º Ano C',
        description: 'Organizar uma aula prática com montagem de circuitos no laboratório para consolidar a Lei de Ohm de forma experimental.',
        category: 'ATIVIDADE_DIFERENCIADA',
        createdDate: '2026-08-28',
        targetMeetingPeriod: '1ª Quinzena de Setembro',
        status: 'EM_ANDAMENTO'
      }
    ]
  },
  {
    id: 'meet-102',
    teacherId: 't4',
    teacherName: 'Profa. Camila Rocha',
    subjectId: 'sub-fis',
    subjectName: 'Física',
    classGroupId: 'cg-3c',
    classGroupName: '3º Ano C',
    bimester: 3,
    periodicity: 'QUINZENAL',
    fortnightPeriod: '1ª Quinzena de Setembro',
    meetingDate: '2026-09-12',
    coordinatorName: DEFAULT_COORDINATOR_NAME,
    previousActionsVerification: [
      {
        actionId: 'act-201',
        actionDescription: 'Organizar uma aula prática com montagem de circuitos no laboratório para consolidar a Lei de Ohm de forma experimental.',
        previousStatus: 'EM_ANDAMENTO',
        verificationResult: 'SUPERADA',
        notes: 'A aula prática no laboratório foi realizada na semana passada. Os alunos montaram os circuitos com multímetro e protoboard.'
      }
    ],
    topicProgress: [
      {
        topicId: 'top-f3-5',
        topicTitle: 'Resistência Elétrica e 1ª e 2ª Leis de Ohm',
        bnccCode: '(EM13CNT105)',
        status: 'CONCLUIDO',
        observation: 'Concluído com suporte do experimento prático.'
      },
      {
        topicId: 'top-f3-6',
        topicTitle: 'Potência Elétrica e Consumo de Energia Residencial',
        bnccCode: '(EM13CNT106)',
        status: 'CONCLUIDO',
        observation: 'Realizado cálculo de consumo em contas de energia de casa trazidas pelos alunos.'
      },
      {
        topicId: 'top-f3-7',
        topicTitle: 'Circuitos Elétricos e Associação de Resistores',
        bnccCode: '(EM13CNT107)',
        status: 'NAO_INICIADO',
        observation: 'Não foi possível iniciar nesta quinzena devido ao tempo dedicado à recomposição de unidades elétricas anteriores.'
      }
    ],
    hasDeviation: true,
    primaryReason: 'DIFICULDADE_APRENDIZAGEM_RETOMADA',
    pedagogicalContextNotes: 'A professora relatou que a turma do 3º Ano C trabalhou com afinco os conteúdos de Corrente, Resistência e Potência Elétrica, além da aula prática. No entanto, por causa das dúvidas remanescentes da turma no cálculo de unidades elétricas e conversões, foi necessário gastar 2 aulas em aulas de recomposição e resolução dirigida de exercícios. Com isso, o tópico de Circuitos e Associação de Resistores ficou pendente para a próxima quinzena.',
    newActions: [
      {
        id: 'act-202',
        meetingId: 'meet-102',
        teacherId: 't4',
        teacherName: 'Profa. Camila Rocha',
        subjectId: 'sub-fis',
        subjectName: 'Física',
        classGroupId: 'cg-3c',
        classGroupName: '3º Ano C',
        description: 'Iniciar a próxima quinzena com uma rápida revisão de 15 minutos em associação em série para em seguida introduzir os circuitos em paralelo sem prejuízo ao ritmo.',
        category: 'RECOMPOSICAO',
        createdDate: '2026-09-12',
        targetMeetingPeriod: '2ª Quinzena de Setembro',
        status: 'PENDENTE'
      }
    ]
  },
  {
    id: 'meet-103',
    teacherId: 't1',
    teacherName: 'Prof. Carlos Eduardo Mendes',
    subjectId: 'sub-mat',
    subjectName: 'Matemática',
    classGroupId: 'cg-1a',
    classGroupName: '1º Ano A',
    bimester: 3,
    periodicity: 'QUINZENAL',
    fortnightPeriod: '1ª Quinzena de Setembro',
    meetingDate: '2026-09-14',
    coordinatorName: DEFAULT_COORDINATOR_NAME,
    previousActionsVerification: [],
    topicProgress: [
      {
        topicId: 'top-m1-3',
        topicTitle: 'Vértice da Parábola, Valor Máximo e Mínimo',
        bnccCode: '(EM13MAT303)',
        status: 'CONCLUIDO',
        observation: 'Conceito bem assimilado através de gráficos construídos pelos alunos.'
      },
      {
        topicId: 'top-m1-4',
        topicTitle: 'Modelagem de Problemas Práticos com Função Quadrática',
        bnccCode: '(EM13MAT304)',
        status: 'EM_ANDAMENTO',
        observation: 'Iniciado em sala com problemas de otimização de lucro e trajetórias de projéteis.'
      }
    ],
    hasDeviation: false,
    primaryReason: 'RITMO_ADEQUADO',
    pedagogicalContextNotes: 'A turma do 1º Ano A está acompanhando o planejamento de Matemática em ritmo regular. A participação nas aulas de resolução de problemas de máximos e mínimos foi muito positiva.',
    newActions: [
      {
        id: 'act-203',
        meetingId: 'meet-103',
        teacherId: 't1',
        teacherName: 'Prof. Carlos Eduardo Mendes',
        subjectId: 'sub-mat',
        subjectName: 'Matemática',
        classGroupId: 'cg-1a',
        classGroupName: '1º Ano A',
        description: 'Fornecer gabarito comentado da lista de modelagem prática para apoiar os estudantes com mais dificuldades extraclasse.',
        category: 'ACOMPANHAMENTO_INDIVIDUAL',
        createdDate: '2026-09-14',
        targetMeetingPeriod: '2ª Quinzena de Setembro',
        status: 'EM_ANDAMENTO'
      }
    ]
  }
];

// Lista Consolidada de Encaminhamentos
export const INITIAL_PEDAGOGICAL_ACTIONS: PedagogicalAction[] = [
  {
    id: 'act-202',
    meetingId: 'meet-102',
    teacherId: 't4',
    teacherName: 'Profa. Camila Rocha',
    subjectId: 'sub-fis',
    subjectName: 'Física',
    classGroupId: 'cg-3c',
    classGroupName: '3º Ano C',
    description: 'Iniciar a próxima quinzena com uma rápida revisão de 15 minutos em associação em série para em seguida introduzir os circuitos em paralelo sem prejuízo ao ritmo.',
    category: 'RECOMPOSICAO',
    createdDate: '2026-09-12',
    targetMeetingPeriod: '2ª Quinzena de Setembro',
    status: 'PENDENTE'
  },
  {
    id: 'act-203',
    meetingId: 'meet-103',
    teacherId: 't1',
    teacherName: 'Prof. Carlos Eduardo Mendes',
    subjectId: 'sub-mat',
    subjectName: 'Matemática',
    classGroupId: 'cg-1a',
    classGroupName: '1º Ano A',
    description: 'Fornecer gabarito comentado da lista de modelagem prática para apoiar os estudantes com mais dificuldades extraclasse.',
    category: 'ACOMPANHAMENTO_INDIVIDUAL',
    createdDate: '2026-09-14',
    targetMeetingPeriod: '2ª Quinzena de Setembro',
    status: 'EM_ANDAMENTO'
  }
];
