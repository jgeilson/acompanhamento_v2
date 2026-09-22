/**
 * Pedagogical Actions Service
 * Handles CRUD operations, status updates, local cache persistence, and Google Sheets synchronization for action items.
 */

import { PedagogicalAction } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const actionsService = {
  /**
   * Enqueue a single action operation into the persistent queue
   */
  enqueueSync(action: PedagogicalAction): { queued: true; queueItemId: string } {
    return syncQueueService.enqueue('action', action.id, 'upsert', action);
  },

  /**
   * Enqueue a status update for an action into the persistent queue
   */
  enqueueStatusSync(actionId: string, newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'): { queued: true; queueItemId: string } {
    return syncQueueService.enqueue('action_status', actionId, 'update_status', { actionId, newStatus });
  },

  /**
   * Adds a new action to local storage and enqueues sync
   */
  add(current: PedagogicalAction[], newAction: PedagogicalAction): { data: PedagogicalAction[]; sync: { queued: true; queueItemId: string } } {
    const next = [...current, newAction];
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    const sync = syncQueueService.enqueue('action', newAction.id, 'upsert', newAction);
    return { data: next, sync };
  },

  /**
   * Updates an existing action in local storage and enqueues sync
   */
  update(current: PedagogicalAction[], updatedAction: PedagogicalAction): { data: PedagogicalAction[]; sync: { queued: true; queueItemId: string } } {
    const next = current.map(a => a.id === updatedAction.id ? updatedAction : a);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    const sync = syncQueueService.enqueue('action', updatedAction.id, 'upsert', updatedAction);
    return { data: next, sync };
  },

  /**
   * Updates status of an action in local storage and enqueues sync
   */
  updateStatus(
    current: PedagogicalAction[], 
    actionId: string, 
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'
  ): { data: PedagogicalAction[]; sync: { queued: true; queueItemId: string } } {
    const next = current.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    const sync = syncQueueService.enqueue('action_status', actionId, 'update_status', { actionId, newStatus });
    return { data: next, sync };
  },

  /**
   * Removes an action by ID from local storage and enqueues sync
   */
  delete(current: PedagogicalAction[], actionId: string): { data: PedagogicalAction[]; sync: { queued: true; queueItemId: string } } {
    const next = current.filter(a => a.id !== actionId);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    const sync = syncQueueService.enqueue('action', actionId, 'delete', { id: actionId });
    return { data: next, sync };
  }
};

