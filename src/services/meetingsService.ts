/**
 * Meetings Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for biweekly meetings.
 */

import { BiweeklyMeeting, PedagogicalAction } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';

export const meetingsService = {
  /**
   * Save a new meeting to Google Sheets (append to 'Reuniões' and new actions to 'Encaminhamentos')
   */
  async saveToSheets(meeting: BiweeklyMeeting): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/sheets/save-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting })
      });
      return await res.json();
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error' };
    }
  },

  /**
   * Adds a new meeting to the list, updates actions list if any new actions were generated, and persists to localStorage
   */
  add(
    currentMeetings: BiweeklyMeeting[],
    currentActions: PedagogicalAction[],
    newMeeting: BiweeklyMeeting
  ): { nextMeetings: BiweeklyMeeting[]; nextActions: PedagogicalAction[] } {
    const nextMeetings = [...currentMeetings, newMeeting];
    const nextActions = newMeeting.newActions && newMeeting.newActions.length > 0 
      ? [...currentActions, ...newMeeting.newActions] 
      : currentActions;

    saveLocalData(STORAGE_KEYS.MEETINGS, nextMeetings);
    saveLocalData(STORAGE_KEYS.ACTIONS, nextActions);

    return { nextMeetings, nextActions };
  },

  /**
   * Removes a meeting by ID and updates localStorage
   */
  delete(currentMeetings: BiweeklyMeeting[], meetingId: string): BiweeklyMeeting[] {
    const next = currentMeetings.filter(m => m.id !== meetingId);
    saveLocalData(STORAGE_KEYS.MEETINGS, next);
    return next;
  }
};
