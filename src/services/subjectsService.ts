/**
 * Subjects Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for subjects/disciplines.
 */

import { Subject } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const subjectsService = {
  /**
   * Save/Upsert a subject to Google Sheets via persistent queue
   */
  async saveToSheets(subject: Subject): Promise<{ success: boolean; error?: string }> {
    try {
      syncQueueService.enqueue('subject', subject.id, 'upsert', subject);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Enqueue error' };
    }
  },

  /**
   * Adds a new subject to the list, updates localStorage and sync queue
   */
  add(current: Subject[], newSubject: Subject): Subject[] {
    const next = [...current, newSubject];
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
    syncQueueService.enqueue('subject', newSubject.id, 'upsert', newSubject);
    return next;
  },

  /**
   * Updates an existing subject in the list, updates localStorage and sync queue
   */
  update(current: Subject[], updatedSubject: Subject): Subject[] {
    const next = current.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
    syncQueueService.enqueue('subject', updatedSubject.id, 'upsert', updatedSubject);
    return next;
  },

  /**
   * Removes a subject by ID and updates localStorage
   */
  delete(current: Subject[], subjectId: string): Subject[] {
    const next = current.filter(s => s.id !== subjectId);
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
    return next;
  }
};

