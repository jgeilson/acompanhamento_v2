/**
 * Classes Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for class groups.
 */

import { ClassGroup } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';

export const classesService = {
  /**
   * Save a new class to Google Sheets
   */
  async saveToSheets(classGroup: ClassGroup): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/sheets/save-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classGroup })
      });
      return await res.json();
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error' };
    }
  },

  /**
   * Adds a new class to the list and updates localStorage
   */
  add(current: ClassGroup[], newClass: ClassGroup): ClassGroup[] {
    const next = [...current, newClass];
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    return next;
  },

  /**
   * Updates an existing class in the list and updates localStorage
   */
  update(current: ClassGroup[], updatedClass: ClassGroup): ClassGroup[] {
    const next = current.map(c => c.id === updatedClass.id ? updatedClass : c);
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    return next;
  },

  /**
   * Removes a class by ID and updates localStorage
   */
  delete(current: ClassGroup[], classId: string): ClassGroup[] {
    const next = current.filter(c => c.id !== classId);
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    return next;
  }
};
