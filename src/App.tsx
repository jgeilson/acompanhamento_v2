import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MeetingsView } from './components/MeetingsView';
import { BimonthlyPlanningView } from './components/BimonthlyPlanningView';
import { PedagogicalTimelineView } from './components/PedagogicalTimelineView';
import { PedagogicalActionsView } from './components/PedagogicalActionsView';
import { NewMeetingModal } from './components/NewMeetingModal';
import { MeetingDetailModal } from './components/MeetingDetailModal';
import { CadastrosView } from './components/CadastrosView';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';

import { 
  ActiveTab, 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction,
  AppSettings
} from './types';

import { 
  INITIAL_TEACHERS, 
  INITIAL_SUBJECTS, 
  INITIAL_CLASS_GROUPS, 
  INITIAL_BIMONTHLY_PLANS, 
  INITIAL_BIWEEKLY_MEETINGS, 
  INITIAL_PEDAGOGICAL_ACTIONS 
} from './data/initialData';

import { 
  STORAGE_KEYS, 
  loadLocalData, 
  saveLocalData, 
  purgeLegacyCredentials,
  sheetsService,
  teachersService,
  classesService,
  subjectsService,
  meetingsService,
  plansService,
  actionsService
} from './services';
import { syncQueueService, SyncQueueItem, SyncEvent } from './services/syncQueueService';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Master State (with localStorage cache for offline/direct CRUD persistence)
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadLocalData(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS));
  const [subjects, setSubjects] = useState<Subject[]>(() => loadLocalData(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS));
  const [classGroups, setClassGroups] = useState<ClassGroup[]>(() => loadLocalData(STORAGE_KEYS.CLASSES, INITIAL_CLASS_GROUPS));
  const [bimonthlyPlans, setBimonthlyPlans] = useState<BimonthlyPlan[]>(() => loadLocalData(STORAGE_KEYS.PLANS, INITIAL_BIMONTHLY_PLANS));
  const [meetings, setMeetings] = useState<BiweeklyMeeting[]>(() => loadLocalData(STORAGE_KEYS.MEETINGS, INITIAL_BIWEEKLY_MEETINGS));
  const [actions, setActions] = useState<PedagogicalAction[]>(() => loadLocalData(STORAGE_KEYS.ACTIONS, INITIAL_PEDAGOGICAL_ACTIONS));

  // App Settings from Sheet (Aba Configurações)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => ({
    coordinatorName: localStorage.getItem(STORAGE_KEYS.COORDINATOR_NAME) || 'Coordenação Pedagógica',
    schoolName: localStorage.getItem(STORAGE_KEYS.SCHOOL_NAME) || '',
    academicYear: localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR) || '2026'
  }));

  // Sheets Sync State
  const [isSheetsConfigured, setIsSheetsConfigured] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [selectedDetailMeeting, setSelectedDetailMeeting] = useState<BiweeklyMeeting | null>(null);
  const [initialTeacherForModal, setInitialTeacherForModal] = useState<string | undefined>(undefined);
  const [selectedTimelineTeacherId, setSelectedTimelineTeacherId] = useState<string | undefined>(undefined);

  const showFeedback = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSyncFeedback({ message, type });
    setTimeout(() => {
      setSyncFeedback(prev => prev?.message === message ? null : prev);
    }, 4000);
  }, []);

  // Function to load all data from Google Sheets
  const loadDataFromSheets = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);

    try {
      const data = await sheetsService.loadAll();

      if (data.success || Array.isArray(data.teachers)) {
        // Reconcile remote data with latest state via functional updaters to prevent stale closures
        setTeachers(prev => {
          const rec = syncQueueService.reconcileWithRemote('teacher', data.teachers || [], prev);
          saveLocalData(STORAGE_KEYS.TEACHERS, rec);
          return rec;
        });
        setClassGroups(prev => {
          const rec = syncQueueService.reconcileWithRemote('class', data.classGroups || [], prev);
          saveLocalData(STORAGE_KEYS.CLASSES, rec);
          return rec;
        });
        setSubjects(prev => {
          const rec = syncQueueService.reconcileWithRemote('subject', data.subjects || [], prev);
          saveLocalData(STORAGE_KEYS.SUBJECTS, rec);
          return rec;
        });
        setBimonthlyPlans(prev => {
          const rec = syncQueueService.reconcileWithRemote('plan', data.bimonthlyPlans || [], prev);
          saveLocalData(STORAGE_KEYS.PLANS, rec);
          return rec;
        });
        setMeetings(prev => {
          const rec = syncQueueService.reconcileWithRemote('meeting', data.meetings || [], prev);
          saveLocalData(STORAGE_KEYS.MEETINGS, rec);
          return rec;
        });
        setActions(prev => {
          const rec = syncQueueService.reconcileWithRemote('action', data.actions || [], prev);
          saveLocalData(STORAGE_KEYS.ACTIONS, rec);
          return rec;
        });

        // Continue syncing pending items in queue
        syncQueueService.processQueue();

        if (data.settings) {
          const loadedSettings: AppSettings = {
            coordinatorName: data.settings.coordinatorName || 'Coordenação Pedagógica',
            schoolName: data.settings.schoolName || '',
            academicYear: String(data.settings.academicYear || '2026'),
            raw: data.settings.raw || {}
          };
          if (loadedSettings.coordinatorName) {
            localStorage.setItem(STORAGE_KEYS.COORDINATOR_NAME, loadedSettings.coordinatorName);
          }
          if (loadedSettings.schoolName) {
            localStorage.setItem(STORAGE_KEYS.SCHOOL_NAME, loadedSettings.schoolName);
          }
          if (loadedSettings.academicYear) {
            localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEAR, loadedSettings.academicYear);
          }
          setAppSettings(loadedSettings);
        }

        if (!silent) {
          showFeedback('Dados atualizados e sincronizados com a planilha do Google Sheets com sucesso!', 'success');
        }
      } else if (!silent && data.error) {
        showFeedback(`Erro ao carregar dados: ${data.error}`, 'error');
      }
    } catch {
      if (!silent) showFeedback('Não foi possível conectar à Planilha.', 'error');
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [showFeedback]);

  // Check connection status and auto-load on initial mount, purging any legacy browser credentials
  useEffect(() => {
    purgeLegacyCredentials();

    sheetsService.getStatus()
      .then(status => {
        const configured = Boolean(status.isConfigured);
        setIsSheetsConfigured(configured);

        if (configured) {
          loadDataFromSheets(true);
        }
      })
      .catch(() => {});
  }, [loadDataFromSheets]);

  // Calculations
  const pendingActionsCount = actions.filter(a => a.status !== 'SUPERADA').length;

  // Listen to syncQueueService events to separate queued from synced status
  useEffect(() => {
    const unsubscribeEvents = syncQueueService.subscribeEvents((event: SyncEvent) => {
      if (event.type === 'synced') {
        const entityNames: Record<string, string> = {
          teacher: 'Professor(a)',
          class: 'Turma',
          subject: 'Disciplina',
          meeting: 'Reunião',
          plan: 'Planejamento Bimestral',
          action: 'Encaminhamento Pedagógico',
          action_status: 'Status do Encaminhamento'
        };
        const label = entityNames[event.item.entityType] || 'Registro';
        showFeedback(`${label} sincronizado(a) na Planilha Google com sucesso!`, 'success');
      } else if (event.type === 'error') {
        showFeedback(`Erro ao sincronizar na Planilha: ${event.error}. O sistema tentará novamente em instantes.`, 'error');
      }
    });

    return unsubscribeEvents;
  }, [showFeedback]);

  // Handlers: Meetings
  const handleSaveMeeting = async (newMeeting: BiweeklyMeeting) => {
    const { nextMeetings, nextActions, sync } = meetingsService.add(meetings, actions, newMeeting);
    setMeetings(nextMeetings);
    setActions(nextActions);
    showFeedback(`Reunião salva no computador (local). Adicionada à fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleDeleteMeeting = (meetingId: string) => {
    const { data, sync } = meetingsService.delete(meetings, meetingId);
    setMeetings(data);
    showFeedback(`Reunião excluída localmente. Exclusão adicionada à fila [ID: ${sync.queueItemId}]`, 'info');
  };

  // Handlers: Teachers
  const handleAddTeacher = async (newTeacher: Teacher) => {
    const { data, sync } = teachersService.add(teachers, newTeacher);
    setTeachers(data);
    showFeedback(`Professor(a) "${newTeacher.name}" salvo(a) localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const { data, sync } = teachersService.update(teachers, updatedTeacher);
    setTeachers(data);
    showFeedback(`Professor(a) "${updatedTeacher.name}" atualizado(a) localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const deleted = teachers.find(t => t.id === teacherId);
    const { data, sync } = teachersService.delete(teachers, teacherId);
    setTeachers(data);
    showFeedback(`Professor(a) "${deleted?.name || ''}" removido(a) localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  // Handlers: Classes
  const handleAddClassGroup = async (newClass: ClassGroup) => {
    const { data, sync } = classesService.add(classGroups, newClass);
    setClassGroups(data);
    showFeedback(`Turma "${newClass.name}" salva localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleUpdateClassGroup = (updatedClass: ClassGroup) => {
    const { data, sync } = classesService.update(classGroups, updatedClass);
    setClassGroups(data);
    showFeedback(`Turma "${updatedClass.name}" atualizada localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleDeleteClassGroup = (classId: string) => {
    const deleted = classGroups.find(c => c.id === classId);
    const { data, sync } = classesService.delete(classGroups, classId);
    setClassGroups(data);
    showFeedback(`Turma "${deleted?.name || ''}" removida localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  // Handlers: Subjects
  const handleAddSubject = async (newSubject: Subject) => {
    const { data, sync } = subjectsService.add(subjects, newSubject);
    setSubjects(data);
    showFeedback(`Disciplina "${newSubject.name}" salva localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    const { data, sync } = subjectsService.update(subjects, updatedSubject);
    setSubjects(data);
    showFeedback(`Disciplina "${updatedSubject.name}" atualizada localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleDeleteSubject = (subjectId: string) => {
    const deleted = subjects.find(s => s.id === subjectId);
    const { data, sync } = subjectsService.delete(subjects, subjectId);
    setSubjects(data);
    showFeedback(`Disciplina "${deleted?.name || ''}" removida localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  // Handlers: Pedagogical Actions
  const handleAddAction = async (newAction: PedagogicalAction) => {
    const { data, sync } = actionsService.add(actions, newAction);
    setActions(data);
    showFeedback(`Encaminhamento salvo localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleUpdateAction = (updatedAction: PedagogicalAction) => {
    const { data, sync } = actionsService.update(actions, updatedAction);
    setActions(data);
    showFeedback(`Encaminhamento atualizado localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleDeleteAction = (actionId: string) => {
    const { data, sync } = actionsService.delete(actions, actionId);
    setActions(data);
    showFeedback(`Encaminhamento excluído localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleUpdateActionStatus = async (actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA') => {
    const { data, sync } = actionsService.updateStatus(actions, actionId, newStatus);
    setActions(data);
    showFeedback(`Status atualizado localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  // Handlers: Bimonthly Plans
  const handleAddPlan = async (newPlan: BimonthlyPlan) => {
    const { nextPlans, sync } = plansService.addOrUpdate(bimonthlyPlans, newPlan);
    setBimonthlyPlans(nextPlans);
    showFeedback(`Planejamento salvo localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleUpdatePlan = (updatedPlan: BimonthlyPlan) => {
    const { data, sync } = plansService.update(bimonthlyPlans, updatedPlan);
    setBimonthlyPlans(data);
    showFeedback(`Planejamento atualizado localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleDeletePlan = (planId: string) => {
    const { data, sync } = plansService.delete(bimonthlyPlans, planId);
    setBimonthlyPlans(data);
    showFeedback(`Planejamento removido localmente. Fila de sincronização [ID: ${sync.queueItemId}]`, 'info');
  };

  const handleDataLoadedFromSheets = (loaded: {
    teachers?: Teacher[];
    subjects?: Subject[];
    classGroups?: ClassGroup[];
    bimonthlyPlans?: BimonthlyPlan[];
    meetings?: BiweeklyMeeting[];
    actions?: PedagogicalAction[];
  }) => {
    // Reconcile remote loaded data with current latest state via functional updaters
    setTeachers(prev => {
      const rec = syncQueueService.reconcileWithRemote('teacher', loaded.teachers || [], prev);
      saveLocalData(STORAGE_KEYS.TEACHERS, rec);
      return rec;
    });
    setSubjects(prev => {
      const rec = syncQueueService.reconcileWithRemote('subject', loaded.subjects || [], prev);
      saveLocalData(STORAGE_KEYS.SUBJECTS, rec);
      return rec;
    });
    setClassGroups(prev => {
      const rec = syncQueueService.reconcileWithRemote('class', loaded.classGroups || [], prev);
      saveLocalData(STORAGE_KEYS.CLASSES, rec);
      return rec;
    });
    setBimonthlyPlans(prev => {
      const rec = syncQueueService.reconcileWithRemote('plan', loaded.bimonthlyPlans || [], prev);
      saveLocalData(STORAGE_KEYS.PLANS, rec);
      return rec;
    });
    setMeetings(prev => {
      const rec = syncQueueService.reconcileWithRemote('meeting', loaded.meetings || [], prev);
      saveLocalData(STORAGE_KEYS.MEETINGS, rec);
      return rec;
    });
    setActions(prev => {
      const rec = syncQueueService.reconcileWithRemote('action', loaded.actions || [], prev);
      saveLocalData(STORAGE_KEYS.ACTIONS, rec);
      return rec;
    });

    setIsSheetsConfigured(true);

    // Continue queue processing
    syncQueueService.processQueue();

    const pendingCount = syncQueueService.getQueue().filter(i => i.status === 'pending' || i.status === 'syncing').length;
    if (pendingCount > 0) {
      showFeedback(`Carregado do Google Sheets. Preservadas ${pendingCount} alteração(ões) local(is) pendente(s). Sincronizando...`, 'info');
    } else {
      showFeedback('Todos os dados foram carregados da Planilha Google com sucesso!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingActionsCount={pendingActionsCount}
        onOpenNewMeeting={() => {
          setInitialTeacherForModal(undefined);
          setIsNewMeetingModalOpen(true);
        }}
        isSheetsConfigured={isSheetsConfigured}
        isSyncing={isSyncing}
        onQuickReload={() => loadDataFromSheets(false)}
        onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
        appSettings={appSettings}
      />

      {/* Floating Sync Feedback Toast */}
      {syncFeedback && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <div className={`p-4 rounded-2xl shadow-lg border text-xs font-semibold flex items-center gap-3 transition-all ${
            syncFeedback.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
            syncFeedback.type === 'error' ? 'bg-rose-900 text-rose-100 border-rose-700' :
            'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              syncFeedback.type === 'success' ? 'bg-emerald-400' :
              syncFeedback.type === 'error' ? 'bg-rose-400' :
              'bg-indigo-400'
            }`} />
            <span>{syncFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            meetings={meetings}
            actions={actions}
            teachers={teachers}
            classGroups={classGroups}
            onOpenNewMeeting={() => {
              setInitialTeacherForModal(undefined);
              setIsNewMeetingModalOpen(true);
            }}
            onNavigateTab={setActiveTab}
            onSelectMeetingDetail={setSelectedDetailMeeting}
            isSheetsConfigured={isSheetsConfigured}
          />
        )}

        {activeTab === 'meetings' && (
          <MeetingsView
            meetings={meetings}
            teachers={teachers}
            subjects={subjects}
            classGroups={classGroups}
            onOpenNewMeeting={() => {
              setInitialTeacherForModal(undefined);
              setIsNewMeetingModalOpen(true);
            }}
            onSelectMeetingDetail={setSelectedDetailMeeting}
            onDeleteMeeting={handleDeleteMeeting}
          />
        )}

        {activeTab === 'timeline' && (
          <PedagogicalTimelineView
            meetings={meetings}
            teachers={teachers}
            subjects={subjects}
            classGroups={classGroups}
            plans={bimonthlyPlans}
            onSelectMeetingDetail={setSelectedDetailMeeting}
            initialTeacherId={selectedTimelineTeacherId}
          />
        )}

        {activeTab === 'actions' && (
          <PedagogicalActionsView
            actions={actions}
            teachers={teachers}
            subjects={subjects}
            classGroups={classGroups}
            onUpdateActionStatus={handleUpdateActionStatus}
            onAddAction={handleAddAction}
            onUpdateAction={handleUpdateAction}
            onDeleteAction={handleDeleteAction}
            coordinatorName={appSettings.coordinatorName}
          />
        )}

        {activeTab === 'planning' && (
          <BimonthlyPlanningView
            bimonthlyPlans={bimonthlyPlans}
            teachers={teachers}
            subjects={subjects}
            classGroups={classGroups}
            onAddPlan={handleAddPlan}
            onUpdatePlan={handleUpdatePlan}
            onDeletePlan={handleDeletePlan}
            academicYear={Number(appSettings.academicYear || 2026)}
          />
        )}

        {activeTab === 'cadastros' && (
          <CadastrosView
            teachers={teachers}
            subjects={subjects}
            classGroups={classGroups}
            bimonthlyPlans={bimonthlyPlans}
            meetings={meetings}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onAddClassGroup={handleAddClassGroup}
            onUpdateClassGroup={handleUpdateClassGroup}
            onDeleteClassGroup={handleDeleteClassGroup}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onViewTeacherTimeline={(tId) => {
              setSelectedTimelineTeacherId(tId);
              setActiveTab('timeline');
            }}
          />
        )}

      </main>

      

      {/* Modals */}
      {isNewMeetingModalOpen && (
        <NewMeetingModal
          isOpen={isNewMeetingModalOpen}
          onClose={() => setIsNewMeetingModalOpen(false)}
          teachers={teachers}
          subjects={subjects}
          classGroups={classGroups}
          bimonthlyPlans={bimonthlyPlans}
          existingActions={actions}
          onSaveMeeting={handleSaveMeeting}
          initialTeacherId={initialTeacherForModal}
          defaultCoordinator={appSettings.coordinatorName}
        />
      )}

      {selectedDetailMeeting && (
        <MeetingDetailModal
          meeting={selectedDetailMeeting}
          onClose={() => setSelectedDetailMeeting(null)}
          onDeleteMeeting={handleDeleteMeeting}
        />
      )}

      {isSheetsModalOpen && (
        <GoogleSheetsSyncModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
          teachers={teachers}
          subjects={subjects}
          classGroups={classGroups}
          bimonthlyPlans={bimonthlyPlans}
          meetings={meetings}
          actions={actions}
          onDataLoaded={handleDataLoadedFromSheets}
        />
      )}

    </div>
  );
}
