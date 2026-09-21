import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MeetingsView } from './components/MeetingsView';
import { BimonthlyPlanningView } from './components/BimonthlyPlanningView';
import { PedagogicalTimelineView } from './components/PedagogicalTimelineView';
import { PedagogicalActionsView } from './components/PedagogicalActionsView';
import { NewMeetingModal } from './components/NewMeetingModal';
import { MeetingDetailModal } from './components/MeetingDetailModal';

import { 
  ActiveTab, 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction 
} from './types';

import { 
  INITIAL_TEACHERS, 
  INITIAL_SUBJECTS, 
  INITIAL_CLASS_GROUPS, 
  INITIAL_BIMONTHLY_PLANS, 
  INITIAL_BIWEEKLY_MEETINGS, 
  INITIAL_PEDAGOGICAL_ACTIONS 
} from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Master State
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>(INITIAL_CLASS_GROUPS);
  const [bimonthlyPlans, setBimonthlyPlans] = useState<BimonthlyPlan[]>(INITIAL_BIMONTHLY_PLANS);
  
  const [meetings, setMeetings] = useState<BiweeklyMeeting[]>(INITIAL_BIWEEKLY_MEETINGS);
  const [actions, setActions] = useState<PedagogicalAction[]>(INITIAL_PEDAGOGICAL_ACTIONS);

  // Sheets Sync State
  const [isSheetsConfigured, setIsSheetsConfigured] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState<boolean>(false);
  const [selectedDetailMeeting, setSelectedDetailMeeting] = useState<BiweeklyMeeting | null>(null);
  const [initialTeacherForModal, setInitialTeacherForModal] = useState<string | undefined>(undefined);

  const getSheetsConfig = () => ({
    clientEmail: localStorage.getItem('gs_client_email') || undefined,
    privateKey: localStorage.getItem('gs_private_key') || undefined,
    spreadsheetId: localStorage.getItem('gs_spreadsheet_id') || undefined
  });

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSyncFeedback({ message, type });
    setTimeout(() => {
      setSyncFeedback(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Function to load all data from Google Sheets
  const loadDataFromSheets = async (silent = false) => {
    const config = getSheetsConfig();
    if (!silent) setIsSyncing(true);

    try {
      const res = await fetch('/api/sheets/load-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
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

        showFeedback(`Planilha conectada! ${loadedTeachers.length} docente(s), ${loadedClasses.length} turma(s) e ${loadedMeetings.length} reunião(ões) carregados.`);
      } else if (!silent && data.error) {
        showFeedback(`Erro ao carregar dados: ${data.error}`, 'error');
      }
    } catch (err: any) {
      if (!silent) showFeedback('Não foi possível conectar à Planilha Google.', 'error');
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
    const config = getSheetsConfig();

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
        },
        config
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          showFeedback('Dados sincronizados com a Planilha Google!');
        }
      })
      .catch(() => {});
  };

  // Check connection status and auto-load on initial mount
  React.useEffect(() => {
    fetch('/api/sheets/status')
      .then(res => res.json())
      .then(status => {
        const hasLocalConfig = Boolean(localStorage.getItem('gs_spreadsheet_id'));
        const configured = status.isConfigured || hasLocalConfig;
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
    const updatedMeetings = [newMeeting, ...meetings];
    const updatedActions = newMeeting.newActions.length > 0 ? [...newMeeting.newActions, ...actions] : actions;

    setMeetings(updatedMeetings);
    setActions(updatedActions);

    const config = getSheetsConfig();

    // Try granular append first
    try {
      const res = await fetch('/api/sheets/save-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting: newMeeting, config })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Reunião gravada na Planilha Google com sucesso!');
        return;
      }
    } catch {
      // Fallback to full sync
    }

    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, updatedMeetings, updatedActions);
  };

  const handleUpdateActionStatus = async (actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA') => {
    const updatedActions = actions.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
    setActions(updatedActions);

    const config = getSheetsConfig();

    try {
      const res = await fetch('/api/sheets/update-action-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, newStatus, config })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Encaminhamento atualizado para "${newStatus}" na planilha!`);
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
    showFeedback('Todos os dados foram carregados da Planilha Google!');
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
          />
        )}

        {activeTab === 'actions' && (
          <PedagogicalActionsView
            actions={actions}
            teachers={teachers}
            subjects={subjects}
            classGroups={classGroups}
            onUpdateActionStatus={handleUpdateActionStatus}
          />
        )}

        {activeTab === 'planning' && (
          <BimonthlyPlanningView
            bimonthlyPlans={bimonthlyPlans}
            teachers={teachers}
            subjects={subjects}
            classGroups={classGroups}
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
        />
      )}

      {selectedDetailMeeting && (
        <MeetingDetailModal
          meeting={selectedDetailMeeting}
          onClose={() => setSelectedDetailMeeting(null)}
        />
      )}

    </div>
  );
}
