/**
 * Teachers Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for teachers.
 */

import { Teacher } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const teachersService = {
  /**
   * Save/Upsert a teacher to Google Sheets via persistent queue
   */
  async saveToSheets(teacher: Teacher): Promise<{ success: boolean; error?: string }> {
    try {
      syncQueueService.enqueue('teacher', teacher.id, 'upsert', teacher);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Enqueue error' };
    }
  },

  /**
   * Adds a new teacher to the list, updates localStorage and sync queue
   */
  add(current: Teacher[], newTeacher: Teacher): Teacher[] {
    const next = [...current, newTeacher];
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    syncQueueService.enqueue('teacher', newTeacher.id, 'upsert', newTeacher);
    return next;
  },

  /**
   * Updates an existing teacher in the list, updates localStorage and sync queue
   */
  update(current: Teacher[], updatedTeacher: Teacher): Teacher[] {
    const next = current.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    syncQueueService.enqueue('teacher', updatedTeacher.id, 'upsert', updatedTeacher);
    return next;
  },

  /**
   * Removes a teacher by ID and updates localStorage
   */
  delete(current: Teacher[], teacherId: string): Teacher[] {
    const next = current.filter(t => t.id !== teacherId);
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    syncQueueService.enqueue('teacher', teacherId, 'delete', { id: teacherId });
    return next;
  }
};

