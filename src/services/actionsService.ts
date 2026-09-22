/**
 * Pedagogical Actions Service
 * Handles CRUD operations, status updates, local cache persistence, and Google Sheets synchronization for action items.
 */

import { PedagogicalAction } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const actionsService = {
  /**
   * Save/Upsert a single action to Google Sheets via persistent queue
   */
  async saveToSheets(action: PedagogicalAction): Promise<{ success: boolean; error?: string }> {
    try {
      syncQueueService.enqueue('action', action.id, 'upsert', action);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Enqueue error' };
    }
  },

  /**
   * Update status of an action in Google Sheets via persistent queue
   */
  async updateStatusInSheets(
    actionId: string, 
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      syncQueueService.enqueue('action_status', actionId, 'update_status', { actionId, newStatus });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Enqueue error' };
    }
  },

  /**
   * Adds a new action to the list, updates localStorage and sync queue
   */
  add(current: PedagogicalAction[], newAction: PedagogicalAction): PedagogicalAction[] {
    const next = [...current, newAction];
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    syncQueueService.enqueue('action', newAction.id, 'upsert', newAction);
    return next;
  },

  /**
   * Updates an existing action in the list, updates localStorage and sync queue
   */
  update(current: PedagogicalAction[], updatedAction: PedagogicalAction): PedagogicalAction[] {
    const next = current.map(a => a.id === updatedAction.id ? updatedAction : a);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    syncQueueService.enqueue('action', updatedAction.id, 'upsert', updatedAction);
    return next;
  },

  /**
   * Updates status of an action in local list, localStorage and sync queue
   */
  updateStatus(
    current: PedagogicalAction[], 
    actionId: string, 
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'
  ): PedagogicalAction[] {
    const next = current.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    syncQueueService.enqueue('action_status', actionId, 'update_status', { actionId, newStatus });
    return next;
  },

  /**
   * Removes an action by ID and updates localStorage
   */
  delete(current: PedagogicalAction[], actionId: string): PedagogicalAction[] {
    const next = current.filter(a => a.id !== actionId);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    return next;
  }
};

