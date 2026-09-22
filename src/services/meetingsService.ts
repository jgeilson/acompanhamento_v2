/**
 * Meetings Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for biweekly meetings.
 */

import { BiweeklyMeeting, PedagogicalAction } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const meetingsService = {
  /**
   * Save/Upsert a meeting to Google Sheets via persistent queue
   */
  async saveToSheets(meeting: BiweeklyMeeting): Promise<{ success: boolean; error?: string }> {
    try {
      syncQueueService.enqueue('meeting', meeting.id, 'upsert', meeting);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Enqueue error' };
    }
  },

  /**
   * Enqueue a meeting operation into the persistent queue
   */
  enqueueSync(meeting: BiweeklyMeeting): { queued: true; queueItemId: string } {
    return syncQueueService.enqueue('meeting', meeting.id, 'upsert', meeting);
  },

  /**
   * Adds a new meeting to the list, updates actions list if any new actions were generated, persists to localStorage and enqueues to sync queue
   */
  add(
    currentMeetings: BiweeklyMeeting[],
    currentActions: PedagogicalAction[],
    newMeeting: BiweeklyMeeting
  ): { data: BiweeklyMeeting[]; nextMeetings: BiweeklyMeeting[]; nextActions: PedagogicalAction[]; sync: { queued: true; queueItemId: string } } {
    const nextMeetings = [...currentMeetings, newMeeting];
    const nextActions = newMeeting.newActions && newMeeting.newActions.length > 0 
      ? [...currentActions, ...newMeeting.newActions] 
      : currentActions;

    saveLocalData(STORAGE_KEYS.MEETINGS, nextMeetings);
    saveLocalData(STORAGE_KEYS.ACTIONS, nextActions);

    // Enqueue meeting (which handles both meeting and its newActions idempotently)
    const sync = syncQueueService.enqueue('meeting', newMeeting.id, 'upsert', newMeeting);

    return { data: nextMeetings, nextMeetings, nextActions, sync };
  },

  /**
   * Updates an existing meeting
   */
  update(currentMeetings: BiweeklyMeeting[], updatedMeeting: BiweeklyMeeting): { data: BiweeklyMeeting[]; nextMeetings: BiweeklyMeeting[]; sync: { queued: true; queueItemId: string } } {
    const next = currentMeetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m);
    saveLocalData(STORAGE_KEYS.MEETINGS, next);
    const sync = syncQueueService.enqueue('meeting', updatedMeeting.id, 'upsert', updatedMeeting);
    return { data: next, nextMeetings: next, sync };
  },

  /**
   * Removes a meeting by ID and updates localStorage
   */
  delete(currentMeetings: BiweeklyMeeting[], meetingId: string): { data: BiweeklyMeeting[]; nextMeetings: BiweeklyMeeting[]; sync: { queued: true; queueItemId: string } } {
    const next = currentMeetings.filter(m => m.id !== meetingId);
    saveLocalData(STORAGE_KEYS.MEETINGS, next);
    const sync = syncQueueService.enqueue('meeting', meetingId, 'delete', { id: meetingId });
    return { data: next, nextMeetings: next, sync };
  }
};

