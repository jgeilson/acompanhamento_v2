/**
 * Teachers Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for teachers.
 */

import { Teacher } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';

export const teachersService = {
  /**
   * Save a new teacher to Google Sheets
   */
  async saveToSheets(teacher: Teacher): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/sheets/save-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher })
      });
      return await res.json();
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error' };
    }
  },

  /**
   * Adds a new teacher to the list and updates localStorage
   */
  add(current: Teacher[], newTeacher: Teacher): Teacher[] {
    const next = [...current, newTeacher];
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    return next;
  },

  /**
   * Updates an existing teacher in the list and updates localStorage
   */
  update(current: Teacher[], updatedTeacher: Teacher): Teacher[] {
    const next = current.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    return next;
  },

  /**
   * Removes a teacher by ID and updates localStorage
   */
  delete(current: Teacher[], teacherId: string): Teacher[] {
    const next = current.filter(t => t.id !== teacherId);
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    return next;
  }
};
