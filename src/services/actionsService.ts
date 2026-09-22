/**
 * Pedagogical Actions Service
 * Handles CRUD operations, status updates, local cache persistence, and Google Sheets synchronization for action items.
 */

import { PedagogicalAction } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';

export const actionsService = {
  /**
   * Save a single action to Google Sheets (append to 'Encaminhamentos')
   */
  async saveToSheets(action: PedagogicalAction): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/sheets/save-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      return await res.json();
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error' };
    }
  },

  /**
   * Update status of an action in Google Sheets
   */
  async updateStatusInSheets(
    actionId: string, 
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/sheets/update-action-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, newStatus })
      });
      return await res.json();
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error' };
    }
  },

  /**
   * Adds a new action to the list and updates localStorage
   */
  add(current: PedagogicalAction[], newAction: PedagogicalAction): PedagogicalAction[] {
    const next = [...current, newAction];
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    return next;
  },

  /**
   * Updates an existing action in the list and updates localStorage
   */
  update(current: PedagogicalAction[], updatedAction: PedagogicalAction): PedagogicalAction[] {
    const next = current.map(a => a.id === updatedAction.id ? updatedAction : a);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
    return next;
  },

  /**
   * Updates status of an action in local list and localStorage
   */
  updateStatus(
    current: PedagogicalAction[], 
    actionId: string, 
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'SUPERADA'
  ): PedagogicalAction[] {
    const next = current.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
    saveLocalData(STORAGE_KEYS.ACTIONS, next);
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
