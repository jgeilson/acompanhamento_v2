import React, { useState } from 'react';
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

function loadLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as unknown as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Master State (with localStorage cache for offline/direct CRUD persistence)
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadLocalData('local_teachers', INITIAL_TEACHERS));
  const [subjects, setSubjects] = useState<Subject[]>(() => loadLocalData('local_subjects', INITIAL_SUBJECTS));
  const [classGroups, setClassGroups] = useState<ClassGroup[]>(() => loadLocalData('local_classes', INITIAL_CLASS_GROUPS));
  const [bimonthlyPlans, setBimonthlyPlans] = useState<BimonthlyPlan[]>(() => loadLocalData('local_plans', INITIAL_BIMONTHLY_PLANS));
  
  const [meetings, setMeetings] = useState<BiweeklyMeeting[]>(() => loadLocalData('local_meetings', INITIAL_BIWEEKLY_MEETINGS));
  const [actions, setActions] = useState<PedagogicalAction[]>(() => loadLocalData('local_actions', INITIAL_PEDAGOGICAL_ACTIONS));

  // App Settings from Sheet (Aba Configurações)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => ({
    coordinatorName: localStorage.getItem('default_coordinator_name') || 'Coordenação Pedagógica',
    schoolName: localStorage.getItem('school_name') || '',
    academicYear: localStorage.getItem('academic_year') || '2026'
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

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSyncFeedback({ message, type });
    setTimeout(() => {
      setSyncFeedback(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Function to load all data from Google Sheets
  const loadDataFromSheets = async (silent = false) => {
    if (!silent) setIsSyncing(true);

    try {
      const res = await fetch('/api/sheets/load-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();

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
        localStorage.setItem('local_teachers', JSON.stringify(loadedTeachers));
        localStorage.setItem('local_classes', JSON.stringify(loadedClasses));
        localStorage.setItem('local_subjects', JSON.stringify(loadedSubjects));
        localStorage.setItem('local_plans', JSON.stringify(loadedPlans));
        localStorage.setItem('local_meetings', JSON.stringify(loadedMeetings));
        localStorage.setItem('local_actions', JSON.stringify(loadedActions));

        if (data.settings) {
          const loadedSettings: AppSettings = {
            coordinatorName: data.settings.coordinatorName || 'Coordenação Pedagógica',
            schoolName: data.settings.schoolName || '',
            academicYear: String(data.settings.academicYear || '2026'),
            raw: data.settings.raw || {}
          };
          if (loadedSettings.coordinatorName) {
            localStorage.setItem('default_coordinator_name', loadedSettings.coordinatorName);
          }
          if (loadedSettings.schoolName) {
            localStorage.setItem('school_name', loadedSettings.schoolName);
          }
          if (loadedSettings.academicYear) {
            localStorage.setItem('academic_year', loadedSettings.academicYear);
          }
          setAppSettings(loadedSettings);
        }

        if (!silent) {
          showFeedback(`Dados atualizados! ${loadedTeachers.length} docente(s), ${loadedClasses.length} turma(s) e ${loadedMeetings.length} reunião(ões) carregados.`);
        }
      } else if (!silent && data.error) {
        showFeedback(`Erro ao carregar dados: ${data.error}`, 'error');
      }
    } catch (err: any) {
      if (!silent) showFeedback('Não foi possível conectar à Planilha.', 'error');
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Auto-sync helper to push entire state to Google Sheets
  const autoSyncToSheets = (
    currentTeachers: Teacher[],
    currentSubjects: Subject[],
    currentClasses: ClassGroup[],
    currentPlans: BimonthlyPlan[],
    currentMeetings: BiweeklyMeeting[],
    currentActions: PedagogicalAction[]
  ) => {
    fetch('/api/sheets/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          teachers: currentTeachers,
          subjects: currentSubjects,
          classGroups: currentClasses,
          bimonthlyPlans: currentPlans,
          meetings: currentMeetings,
          actions: currentActions
        }
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          showFeedback('Dados sincronizados com sucesso!');
        }
      })
      .catch(() => {});
  };

  // Check connection status and auto-load on initial mount, purging any legacy browser credentials
  React.useEffect(() => {
    // Purge any legacy credentials from client browser localStorage for security
    try {
      localStorage.removeItem('gs_private_key');
      localStorage.removeItem('gs_client_email');
    } catch {}

    fetch('/api/sheets/status')
      .then(res => res.json())
      .then(status => {
        const configured = Boolean(status.isConfigured);
        setIsSheetsConfigured(configured);

        if (configured) {
          loadDataFromSheets(true);
        }
      })
      .catch(() => {});
  }, []);

  // Calculations
  const pendingActionsCount = actions.filter(a => a.status !== 'SUPERADA').length;

  // Handlers
  const handleSaveMeeting = async (newMeeting: BiweeklyMeeting) => {
    const updatedMeetings = [...meetings, newMeeting];
    const updatedActions = newMeeting.newActions.length > 0 ? [...actions, ...newMeeting.newActions] : actions;

    setMeetings(updatedMeetings);
    setActions(updatedActions);
    localStorage.setItem('local_meetings', JSON.stringify(updatedMeetings));
    localStorage.setItem('local_actions', JSON.stringify(updatedActions));

    // Try granular append first
    try {
      const res = await fetch('/api/sheets/save-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting: newMeeting })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Reunião gravada com sucesso no final da planilha!');
        return;
      }
    } catch {
      // Fallback to full sync
    }

    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, updatedMeetings, updatedActions);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    const nextMeetings = meetings.filter(m => m.id !== meetingId);
    setMeetings(nextMeetings);
    localStorage.setItem('local_meetings', JSON.stringify(nextMeetings));
    showFeedback('Reunião excluída com sucesso.');
    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, nextMeetings, actions);
  };

  // CRUD Handlers: Teachers
  const handleAddTeacher = async (newTeacher: Teacher) => {
    const next = [...teachers, newTeacher];
    setTeachers(next);
    localStorage.setItem('local_teachers', JSON.stringify(next));

    try {
      const res = await fetch('/api/sheets/save-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher: newTeacher })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Professor(a) "${newTeacher.name}" cadastrado(a) no final da planilha!`);
        return;
      }
    } catch {
      // Fallback to autoSyncToSheets
    }

    showFeedback(`Professor(a) "${newTeacher.name}" cadastrado(a) com sucesso!`);
    autoSyncToSheets(next, subjects, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const next = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    setTeachers(next);
    localStorage.setItem('local_teachers', JSON.stringify(next));
    showFeedback(`Professor(a) "${updatedTeacher.name}" atualizado(a)!`);
    autoSyncToSheets(next, subjects, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const deleted = teachers.find(t => t.id === teacherId);
    const next = teachers.filter(t => t.id !== teacherId);
    setTeachers(next);
    localStorage.setItem('local_teachers', JSON.stringify(next));
    showFeedback(`Professor(a) "${deleted?.name || ''}" removido(a).`);
    autoSyncToSheets(next, subjects, classGroups, bimonthlyPlans, meetings, actions);
  };

  // CRUD Handlers: Classes
  const handleAddClassGroup = async (newClass: ClassGroup) => {
    const next = [...classGroups, newClass];
    setClassGroups(next);
    localStorage.setItem('local_classes', JSON.stringify(next));

    try {
      const res = await fetch('/api/sheets/save-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classGroup: newClass })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Turma "${newClass.name}" cadastrada no final da planilha!`);
        return;
      }
    } catch {
      // Fallback to autoSyncToSheets
    }

    showFeedback(`Turma "${newClass.name}" cadastrada com sucesso!`);
    autoSyncToSheets(teachers, subjects, next, bimonthlyPlans, meetings, actions);
  };

  const handleUpdateClassGroup = (updatedClass: ClassGroup) => {
    const next = classGroups.map(c => c.id === updatedClass.id ? updatedClass : c);
    setClassGroups(next);
    localStorage.setItem('local_classes', JSON.stringify(next));
    showFeedback(`Turma "${updatedClass.name}" atualizada!`);
    autoSyncToSheets(teachers, subjects, next, bimonthlyPlans, meetings, actions);
  };

  const handleDeleteClassGroup = (classId: string) => {
    const deleted = classGroups.find(c => c.id === classId);
    const next = classGroups.filter(c => c.id !== classId);
    setClassGroups(next);
    localStorage.setItem('local_classes', JSON.stringify(next));
    showFeedback(`Turma "${deleted?.name || ''}" removida.`);
    autoSyncToSheets(teachers, subjects, next, bimonthlyPlans, meetings, actions);
  };

  // CRUD Handlers: Subjects
  const handleAddSubject = async (newSubject: Subject) => {
    const next = [...subjects, newSubject];
    setSubjects(next);
    localStorage.setItem('local_subjects', JSON.stringify(next));

    try {
      const res = await fetch('/api/sheets/save-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Disciplina "${newSubject.name}" cadastrada no final da planilha!`);
        return;
      }
    } catch {
      // Fallback to autoSyncToSheets
    }

    showFeedback(`Disciplina "${newSubject.name}" cadastrada com sucesso!`);
    autoSyncToSheets(teachers, next, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    const next = subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    setSubjects(next);
    localStorage.setItem('local_subjects', JSON.stringify(next));
    showFeedback(`Disciplina "${updatedSubject.name}" atualizada!`);
    autoSyncToSheets(teachers, next, classGroups, bimonthlyPlans, meetings, actions);
  };

  const handleDeleteSubject = (subjectId: string) => {
    const deleted = subjects.find(s => s.id === subjectId);
    const next = subjects.filter(s => s.id !== subjectId);
    setSubjects(next);
    localStorage.setItem('local_subjects', JSON.stringify(next));
    showFeedback(`Disciplina "${deleted?.name || ''}" removida.`);
    autoSyncToSheets(teachers, next, classGroups, bimonthlyPlans, meetings, actions);
  };

  // CRUD Handlers: Pedagogical Actions
  const handleAddAction = async (newAction: PedagogicalAction) => {
    const next = [...actions, newAction];
    setActions(next);
    localStorage.setItem('local_actions', JSON.stringify(next));

    try {
      const res = await fetch('/api/sheets/save-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newAction })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Encaminhamento gravado no final da planilha com sucesso!');
        return;
      }
    } catch {
      // Fallback to autoSyncToSheets
    }

    showFeedback('Encaminhamento cadastrado com sucesso!');
    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, next);
  };

  // CRUD Handlers: Bimonthly Plans
  const handleAddPlan = async (newPlan: BimonthlyPlan) => {
    // Check if plan already exists for same teacher, subject, bimester, and overlapping class
    const newClasses = (newPlan.classGroupIds && newPlan.classGroupIds.length > 0) ? newPlan.classGroupIds : [newPlan.classGroupId];
    const existsIndex = bimonthlyPlans.findIndex(p => {
      if (p.teacherId !== newPlan.teacherId || p.subjectId !== newPlan.subjectId || Number(p.bimester) !== Number(newPlan.bimester)) {
        return false;
      }
      const existingClasses = (p.classGroupIds && p.classGroupIds.length > 0) ? p.classGroupIds : [p.classGroupId];
      return newClasses.some(nc => existingClasses.includes(nc));
    });
    
    const isNew = existsIndex < 0;
    let next: BimonthlyPlan[];
    if (!isNew) {
      next = [...bimonthlyPlans];
      next[existsIndex] = newPlan;
    } else {
      next = [...bimonthlyPlans, newPlan];
    }
    
    setBimonthlyPlans(next);
    localStorage.setItem('local_plans', JSON.stringify(next));

    if (isNew) {
      try {
        const res = await fetch('/api/sheets/save-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: newPlan })
        });
        const data = await res.json();
        if (data.success) {
          showFeedback('Planejamento gravado no final da planilha com sucesso!');
          return;
        }
      } catch {
        // Fallback to autoSyncToSheets
      }
    }

    showFeedback('Planejamento bimestral salvo com sucesso!');
    autoSyncToSheets(teachers, subjects, classGroups, next, meetings, actions);
  };

  const handleUpdatePlan = (updatedPlan: BimonthlyPlan) => {
    const next = bimonthlyPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setBimonthlyPlans(next);
    localStorage.setItem('local_plans', JSON.stringify(next));
    showFeedback('Planejamento atualizado com sucesso!');
    autoSyncToSheets(teachers, subjects, classGroups, next, meetings, actions);
  };

  const handleDeletePlan = (planId: string) => {
    const next = bimonthlyPlans.filter(p => p.id !== planId);
    setBimonthlyPlans(next);
    localStorage.setItem('local_plans', JSON.stringify(next));
    showFeedback('Planejamento removido com sucesso.');
    autoSyncToSheets(teachers, subjects, classGroups, next, meetings, actions);
  };

  const handleUpdateAction = (updatedAction: PedagogicalAction) => {
    const next = actions.map(a => a.id === updatedAction.id ? updatedAction : a);
    setActions(next);
    localStorage.setItem('local_actions', JSON.stringify(next));
    showFeedback('Encaminhamento atualizado com sucesso!');
    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, next);
  };

  const handleDeleteAction = (actionId: string) => {
    const next = actions.filter(a => a.id !== actionId);
    setActions(next);
    localStorage.setItem('local_actions', JSON.stringify(next));
    showFeedback('Encaminhamento excluído.');
    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, next);
  };

  const handleUpdateActionStatus = async (actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA') => {
    const updatedActions = actions.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
    setActions(updatedActions);
    localStorage.setItem('local_actions', JSON.stringify(updatedActions));

    try {
      const res = await fetch('/api/sheets/update-action-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Encaminhamento atualizado com sucesso!`);
        return;
      }
    } catch {
      // Fallback
    }

    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, meetings, updatedActions);
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

        {(activeTab === 'meetings' || activeTab === 'timeline') && (
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
