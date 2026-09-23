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
   * Adds a new meeting to the list, updates actions list if any new actions were generated,
   * updates status & history of previously verified actions, persists to localStorage and enqueues to sync queue
   */
  add(
    currentMeetings: BiweeklyMeeting[],
    currentActions: PedagogicalAction[],
    newMeeting: BiweeklyMeeting
  ): { data: BiweeklyMeeting[]; nextMeetings: BiweeklyMeeting[]; nextActions: PedagogicalAction[]; sync: { queued: true; queueItemId: string } } {
    const nextMeetings = [...currentMeetings, newMeeting];

    // Map previous verifications to updated action status & history
    let updatedActions = [...currentActions];
    if (newMeeting.previousActionsVerification && newMeeting.previousActionsVerification.length > 0) {
      newMeeting.previousActionsVerification.forEach(ver => {
        const actionIndex = updatedActions.findIndex(a => a.id === ver.actionId);
        if (actionIndex >= 0) {
          const action = updatedActions[actionIndex];
          
          let newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA' = 'PENDENTE';
          if (ver.verificationResult === 'SUPERADA') {
            newStatus = 'SUPERADA';
          } else if (ver.verificationResult === 'PARCIALMENTE_SUPERADA') {
            newStatus = 'EM_ANDAMENTO';
          } else {
            newStatus = 'PENDENTE';
          }

          const updatedAction: PedagogicalAction = {
            ...action,
            status: newStatus,
            resultNotes: ver.notes || action.resultNotes,
            history: action.history ? [
              ...action.history,
              {
                id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                date: newMeeting.meetingDate,
                status: newStatus,
                resultNotes: ver.notes || `Avaliação em reunião pedagógica: ${ver.verificationResult}`,
                verifiedBy: newMeeting.coordinatorName
              }
            ] : [
              {
                id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                date: newMeeting.meetingDate,
                status: newStatus,
                resultNotes: ver.notes || `Avaliação em reunião pedagógica: ${ver.verificationResult}`,
                verifiedBy: newMeeting.coordinatorName
              }
            ]
          };
          updatedActions[actionIndex] = updatedAction;

          // Enqueue status sync for this action so Google Sheets updates its status too!
          syncQueueService.enqueue('action_status', action.id, 'update_status', {
            actionId: action.id,
            newStatus: newStatus
          });
        }
      });
    }

    const nextActions = newMeeting.newActions && newMeeting.newActions.length > 0 
      ? [...updatedActions, ...newMeeting.newActions] 
      : updatedActions;

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

