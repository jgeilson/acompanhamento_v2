/**
 * Subjects Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for subjects/disciplines.
 */

import { Subject } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';

export const subjectsService = {
  /**
   * Save a new subject to Google Sheets
   */
  async saveToSheets(subject: Subject): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/sheets/save-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject })
      });
      return await res.json();
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error' };
    }
  },

  /**
   * Adds a new subject to the list and updates localStorage
   */
  add(current: Subject[], newSubject: Subject): Subject[] {
    const next = [...current, newSubject];
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
    return next;
  },

  /**
   * Updates an existing subject in the list and updates localStorage
   */
  update(current: Subject[], updatedSubject: Subject): Subject[] {
    const next = current.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
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
