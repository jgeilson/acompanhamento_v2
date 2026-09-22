import React from 'react';
import { 
  Users, 
  Calendar, 
  BookOpenCheck, 
  History, 
  CheckSquare, 
  PlusCircle, 
  GraduationCap,
  Sparkles,
  FileText,
  Clock,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { ActiveTab, AppSettings } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingActionsCount: number;
  onOpenNewMeeting: () => void;
  isSheetsConfigured?: boolean;
  isSyncing?: boolean;
  onQuickReload?: () => void;
  onOpenSheetsSync?: () => void;
  appSettings?: AppSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingActionsCount,
  onOpenNewMeeting,
  isSheetsConfigured = false,
  isSyncing = false,
  onQuickReload,
  onOpenSheetsSync,
  appSettings
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16 border-b border-slate-800/80">
          
          {/* Logo & Application Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-blue-600 p-2.5 rounded-xl shadow-inner flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight font-display">
                  Acompanhamento Pedagógico
                </h1>
              </div>
              {(appSettings?.schoolName) && (
                <div className="text-xs text-slate-400 truncate max-w-md flex items-center gap-1.5 mt-0.5">
                  {appSettings.schoolName && <span className="text-slate-300 font-medium">{appSettings.schoolName}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onQuickReload && (
              <button
                onClick={onQuickReload}
                disabled={isSyncing}
                title="Recarregar dados da nuvem"
                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                <span className="hidden md:inline">{isSyncing ? 'Atualizando...' : 'Recarregar'}</span>
              </button>
            )}

            
          </div>

        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-6 overflow-x-auto py-1 no-scrollbar text-xs sm:text-sm">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>Painel Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex items-center gap-2 px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'meetings'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Reuniões</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'timeline'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Linha do Tempo</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors relative ${
              activeTab === 'actions'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Encaminhamentos</span>
            {pendingActionsCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full ml-0.5">
                {pendingActionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('planning')}
            className={`flex items-center gap-2 px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'planning'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>Planejamento Bimestral</span>
          </button>

          <button
            onClick={() => setActiveTab('cadastros')}
            className={`flex items-center gap-2 px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'cadastros'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Cadastros</span>
          </button>

        </nav>

      </div>
    </header>
  );
};
