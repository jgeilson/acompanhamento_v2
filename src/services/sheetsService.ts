/**
 * Sheets Service
 * Centralizes all Google Sheets API communication (status, load-all, sync-all).
 */

import { 
  Teacher, 
  Subject, 
  ClassGroup, 
  BimonthlyPlan, 
  BiweeklyMeeting, 
  PedagogicalAction,
  AppSettings
} from '../types';

export interface ServerSheetsStatus {
  isConfigured: boolean;
  hasEmail?: boolean;
  hasKey?: boolean;
  hasSheetId?: boolean;
  clientEmailMasked?: string;
  spreadsheetIdMasked?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

export interface LoadAllResponse {
  success: boolean;
  teachers?: Teacher[];
  subjects?: Subject[];
  classGroups?: ClassGroup[];
  bimonthlyPlans?: BimonthlyPlan[];
  meetings?: BiweeklyMeeting[];
  actions?: PedagogicalAction[];
  settings?: {
    coordinatorName?: string;
    schoolName?: string;
    academicYear?: string;
    raw?: Record<string, string>;
  };
  rawCounts?: {
    teachers?: number;
    subjects?: number;
    classGroups?: number;
    bimonthlyPlans?: number;
    meetings?: number;
    actions?: number;
  };
  error?: string;
}

export interface AllPedagogicalData {
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  bimonthlyPlans: BimonthlyPlan[];
  meetings: BiweeklyMeeting[];
  actions: PedagogicalAction[];
}

export const sheetsService = {
  /**
   * Check connection status and server configuration
   */
  async getStatus(): Promise<ServerSheetsStatus> {
    const res = await fetch('/api/sheets/status');
    return res.json();
  },

  /**
   * Test connection and ensure tab structure
   */
  async testConnection(): Promise<{ success: boolean; title?: string; error?: string }> {
    const res = await fetch('/api/sheets/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return res.json();
  },

  /**
   * Load all 6 pedagogical sheets from Google Sheets
   */
  async loadAll(): Promise<LoadAllResponse> {
    const res = await fetch('/api/sheets/load-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return res.json();
  },

  /**
   * Push full dataset to Google Sheets
   */
  async syncAll(data: AllPedagogicalData): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/sheets/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    return res.json();
  }
};
