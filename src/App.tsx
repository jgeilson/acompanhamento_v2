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

  // Background full sync helper
  const syncFullDatasetToSheets = useCallback(async (
    currentTeachers: Teacher[],
    currentSubjects: Subject[],
    currentClasses: ClassGroup[],
    currentPlans: BimonthlyPlan[],
    currentMeetings: BiweeklyMeeting[],
    currentActions: PedagogicalAction[]
  ) => {
    try {
      const res = await sheetsService.syncAll({
        teachers: currentTeachers,
        subjects: currentSubjects,
        classGroups: currentClasses,
        bimonthlyPlans: currentPlans,
        meetings: currentMeetings,
        actions: currentActions
      });
      if (res.success) {
        showFeedback('Dados sincronizados com a nuvem com sucesso!');
      }
    } catch {
      // Background sync silent fail / offline
    }
  }, [showFeedback]);

  // Function to load all data from Google Sheets
  const loadDataFromSheets = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);

    try {
      const data = await sheetsService.loadAll();

      if (data.success || Array.isArray(data.teachers)) {
        const loadedTeachers = data.teachers || [];
        const loadedClasses = data.classGroups || [];
        const loadedSubjects = data.subjects || [];
        const loadedPlans = data.bimonthlyPlans || [];
        const loadedMeetings = data.meetings || [];
        const loadedActions = data.actions || [];

        setTeachers(loadedTeachers);
        setClassGroups(loadedClasses);
        setSubjects(loadedSubjects);
        setBimonthlyPlans(loadedPlans);
        setMeetings(loadedMeetings);
        setActions(loadedActions);

        // Update local cache
        saveLocalData(STORAGE_KEYS.TEACHERS, loadedTeachers);
        saveLocalData(STORAGE_KEYS.CLASSES, loadedClasses);
        saveLocalData(STORAGE_KEYS.SUBJECTS, loadedSubjects);
        saveLocalData(STORAGE_KEYS.PLANS, loadedPlans);
        saveLocalData(STORAGE_KEYS.MEETINGS, loadedMeetings);
        saveLocalData(STORAGE_KEYS.ACTIONS, loadedActions);

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
          showFeedback(`Dados atualizados! ${loadedTeachers.length} docente(s), ${loadedClasses.length} turma(s) e ${loadedMeetings.length} reunião(ões) carregados.`);
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

  // Handlers: Meetings
  const handleSaveMeeting = async (newMeeting: BiweeklyMeeting) => {
    const { nextMeetings, nextActions } = meetingsService.add(meetings, actions, newMeeting);
    setMeetings(nextMeetings);
    setActions(nextActions);

    const sheetsRes = await meetingsService.saveToSheets(newMeeting);
    if (sheetsRes.success) {
      showFeedback('Reunião gravada com sucesso no final da planilha!');
      return;
    }

    syncFullDatasetToSheets(teachers, subjects, classGroups, bimonthlyPlans, nextMeetings, nextActions);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    const nextMeetings = meetingsService.delete(meetings, meetingId);
    setMeetings(nextMeetings);
    showFeedback('Reunião excluída com sucesso.');
    syncFullDatasetToSheets(teachers, subjects, classGroups, bimonthlyPlans, nextMeetings, actions);
  };

  // Handlers: Teachers
  const handleAddTeacher = async (newTeacher: Teacher) => {
    const next = teachersService.add(teachers, newTeacher);
    setTeachers(next);

    const sheetsRes = await teachersService.saveToSheets(newTeacher);
    if (sheetsRes.success) {
      showFeedback(`Professor(a) "${newTeacher.name}" cadastrado(a) no final da planilha!`);
      return;
    }

    showFeedback(`Professor(a) "${newTeacher.name}" cadastrado(a) com sucesso!`);
    syncFullDatasetToSheets(next, subjects, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const next = teachersService.update(teachers, updatedTeacher);
    setTeachers(next);
    showFeedback(`Professor(a) "${updatedTeacher.name}" atualizado(a)!`);
    syncFullDatasetToSheets(next, subjects, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const deleted = teachers.find(t => t.id === teacherId);
    const next = teachersService.delete(teachers, teacherId);
    setTeachers(next);
    showFeedback(`Professor(a) "${deleted?.name || ''}" removido(a).`);
    syncFullDatasetToSheets(next, subjects, classGroups, bimonthlyPlans, meetings, actions);
  };

  // Handlers: Classes
  const handleAddClassGroup = async (newClass: ClassGroup) => {
    const next = classesService.add(classGroups, newClass);
    setClassGroups(next);

    const sheetsRes = await classesService.saveToSheets(newClass);
    if (sheetsRes.success) {
      showFeedback(`Turma "${newClass.name}" cadastrada no final da planilha!`);
      return;
    }

    showFeedback(`Turma "${newClass.name}" cadastrada com sucesso!`);
    syncFullDatasetToSheets(teachers, subjects, next, bimonthlyPlans, meetings, actions);
  };

  const handleUpdateClassGroup = (updatedClass: ClassGroup) => {
    const next = classesService.update(classGroups, updatedClass);
    setClassGroups(next);
    showFeedback(`Turma "${updatedClass.name}" atualizada!`);
    syncFullDatasetToSheets(teachers, subjects, next, bimonthlyPlans, meetings, actions);
  };

  const handleDeleteClassGroup = (classId: string) => {
    const deleted = classGroups.find(c => c.id === classId);
    const next = classesService.delete(classGroups, classId);
    setClassGroups(next);
    showFeedback(`Turma "${deleted?.name || ''}" removida.`);
    syncFullDatasetToSheets(teachers, subjects, next, bimonthlyPlans, meetings, actions);
  };

  // Handlers: Subjects
  const handleAddSubject = async (newSubject: Subject) => {
    const next = subjectsService.add(subjects, newSubject);
    setSubjects(next);

    const sheetsRes = await subjectsService.saveToSheets(newSubject);
    if (sheetsRes.success) {
      showFeedback(`Disciplina "${newSubject.name}" cadastrada no final da planilha!`);
      return;
    }

    showFeedback(`Disciplina "${newSubject.name}" cadastrada com sucesso!`);
    syncFullDatasetToSheets(teachers, next, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    const next = subjectsService.update(subjects, updatedSubject);
    setSubjects(next);
    showFeedback(`Disciplina "${updatedSubject.name}" atualizada!`);
    syncFullDatasetToSheets(teachers, next, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleDeleteSubject = (subjectId: string) => {
    const deleted = subjects.find(s => s.id === subjectId);
    const next = subjectsService.delete(subjects, subjectId);
    setSubjects(next);
    showFeedback(`Disciplina "${deleted?.name || ''}" removida.`);
    syncFullDatasetToSheets(teachers, next, classGroups, bimonthlyPlans, meetings, actions);
  };

  // Handlers: Pedagogical Actions
  const handleAddAction = async (newAction: PedagogicalAction) => {
    const next = actionsService.add(actions, newAction);
    setActions(next);

    const sheetsRes = await actionsService.saveToSheets(newAction);
    if (sheetsRes.success) {
      showFeedback('Encaminhamento gravado no final da planilha com sucesso!');
      return;
    }

    showFeedback('Encaminhamento cadastrado com sucesso!');
    syncFullDatasetToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, next);
  };

  const handleUpdateAction = (updatedAction: PedagogicalAction) => {
    const next = actionsService.update(actions, updatedAction);
    setActions(next);
    showFeedback('Encaminhamento atualizado com sucesso!');
    syncFullDatasetToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, next);
  };

  const handleDeleteAction = (actionId: string) => {
    const next = actionsService.delete(actions, actionId);
    setActions(next);
    showFeedback('Encaminhamento excluído.');
    syncFullDatasetToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, next);
  };

  const handleUpdateActionStatus = async (actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA') => {
    const updatedActions = actionsService.updateStatus(actions, actionId, newStatus);
    setActions(updatedActions);

    const sheetsRes = await actionsService.updateStatusInSheets(actionId, newStatus);
    if (sheetsRes.success) {
      showFeedback('Status do encaminhamento atualizado com sucesso!');
      return;
    }

    syncFullDatasetToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, updatedActions);
  };

  // Handlers: Bimonthly Plans
  const handleAddPlan = async (newPlan: BimonthlyPlan) => {
    const { nextPlans, isNew } = plansService.addOrUpdate(bimonthlyPlans, newPlan);
    setBimonthlyPlans(nextPlans);

    if (isNew) {
      const sheetsRes = await plansService.saveToSheets(newPlan);
      if (sheetsRes.success) {
        showFeedback('Planejamento gravado no final da planilha com sucesso!');
        return;
      }
    }

    showFeedback('Planejamento bimestral salvo com sucesso!');
    syncFullDatasetToSheets(teachers, subjects, classGroups, nextPlans, meetings, actions);
  };

  const handleUpdatePlan = (updatedPlan: BimonthlyPlan) => {
    const next = plansService.update(bimonthlyPlans, updatedPlan);
    setBimonthlyPlans(next);
    showFeedback('Planejamento atualizado com sucesso!');
    syncFullDatasetToSheets(teachers, subjects, classGroups, next, meetings, actions);
  };

  const handleDeletePlan = (planId: string) => {
    const next = plansService.delete(bimonthlyPlans, planId);
    setBimonthlyPlans(next);
    showFeedback('Planejamento removido com sucesso.');
    syncFullDatasetToSheets(teachers, subjects, classGroups, next, meetings, actions);
  };

  const handleDataLoadedFromSheets = (loaded: {
    teachers?: Teacher[];
    subjects?: Subject[];
    classGroups?: ClassGroup[];
    bimonthlyPlans?: BimonthlyPlan[];
    meetings?: BiweeklyMeeting[];
    actions?: PedagogicalAction[];
  }) => {
    setTeachers(loaded.teachers || []);
    setSubjects(loaded.subjects || []);
    setClassGroups(loaded.classGroups || []);
    setBimonthlyPlans(loaded.bimonthlyPlans || []);
    setMeetings(loaded.meetings || []);
    setActions(loaded.actions || []);
    setIsSheetsConfigured(true);
    showFeedback('Todos os dados foram carregados com sucesso!');
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
