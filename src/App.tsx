import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MeetingsView } from './components/MeetingsView';
import { BimonthlyPlanningView } from './components/BimonthlyPlanningView';
import { PedagogicalTimelineView } from './components/PedagogicalTimelineView';
import { PedagogicalActionsView } from './components/PedagogicalActionsView';
import { NewMeetingModal } from './components/NewMeetingModal';
import { MeetingDetailModal } from './components/MeetingDetailModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';

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

  // Modals state
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState<boolean>(false);
  const [selectedDetailMeeting, setSelectedDetailMeeting] = useState<BiweeklyMeeting | null>(null);
  const [initialTeacherForModal, setInitialTeacherForModal] = useState<string | undefined>(undefined);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);

  // Auto-sync helper to push changes to Google Sheets if connected
  const autoSyncToSheets = (
    currentTeachers: Teacher[],
    currentSubjects: Subject[],
    currentClasses: ClassGroup[],
    currentPlans: BimonthlyPlan[],
    currentMeetings: BiweeklyMeeting[],
    currentActions: PedagogicalAction[]
  ) => {
    const config = {
      clientEmail: localStorage.getItem('gs_client_email') || undefined,
      privateKey: localStorage.getItem('gs_private_key') || undefined,
      spreadsheetId: localStorage.getItem('gs_spreadsheet_id') || undefined
    };

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
    }).catch(() => {});
  };

  // On initial mount: attempt to load existing data from Google Sheets
  React.useEffect(() => {
    const config = {
      clientEmail: localStorage.getItem('gs_client_email') || undefined,
      privateKey: localStorage.getItem('gs_private_key') || undefined,
      spreadsheetId: localStorage.getItem('gs_spreadsheet_id') || undefined
    };

    if (!config.spreadsheetId || !config.clientEmail || !config.privateKey) {
      return;
    }

    fetch('/api/sheets/load-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeachers(data.teachers || []);
          setClassGroups(data.classGroups || []);
          setSubjects(data.subjects || []);
          setBimonthlyPlans(data.bimonthlyPlans || []);
          setMeetings(data.meetings || []);
          setActions(data.actions || []);
        }
      })
      .catch(() => {});
  }, []);

  // Calculations
  const pendingActionsCount = actions.filter(a => a.status !== 'SUPERADA').length;

  // Handlers
  const handleSaveMeeting = (newMeeting: BiweeklyMeeting) => {
    const updatedMeetings = [newMeeting, ...meetings];
    const updatedActions = newMeeting.newActions.length > 0 ? [...newMeeting.newActions, ...actions] : actions;

    setMeetings(updatedMeetings);
    setActions(updatedActions);

    autoSyncToSheets(teachers, subjects, classGroups, bimonthlyPlans, updatedMeetings, updatedActions);
  };

  const handleUpdateActionStatus = (actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA') => {
    const updatedActions = actions.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
    setActions(updatedActions);

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
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingActionsCount={pendingActionsCount}
        onOpenNewMeeting={() => {
          setInitialTeacherForModal(undefined);
          setIsNewMeetingModalOpen(true);
        }}
        onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
      />

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
