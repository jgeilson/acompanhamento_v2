/**
 * Classes Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for class groups.
 */

import { ClassGroup } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const classesService = {
  /**
   * Save/Upsert a class group to Google Sheets via persistent queue
   */
  async saveToSheets(classGroup: ClassGroup): Promise<{ success: boolean; error?: string }> {
    try {
      syncQueueService.enqueue('class', classGroup.id, 'upsert', classGroup);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Enqueue error' };
    }
  },

  /**
   * Adds a new class to the list, updates localStorage and sync queue
   */
  add(current: ClassGroup[], newClass: ClassGroup): ClassGroup[] {
    const next = [...current, newClass];
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    syncQueueService.enqueue('class', newClass.id, 'upsert', newClass);
    return next;
  },

  /**
   * Updates an existing class in the list, updates localStorage and sync queue
   */
  update(current: ClassGroup[], updatedClass: ClassGroup): ClassGroup[] {
    const next = current.map(c => c.id === updatedClass.id ? updatedClass : c);
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    syncQueueService.enqueue('class', updatedClass.id, 'upsert', updatedClass);
    return next;
  },

  /**
   * Removes a class by ID and updates localStorage
   */
  delete(current: ClassGroup[], classId: string): ClassGroup[] {
    const next = current.filter(c => c.id !== classId);
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    syncQueueService.enqueue('class', classId, 'delete', { id: classId });
    return next;
  }
};

