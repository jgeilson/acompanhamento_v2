/**
 * Teachers Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for teachers.
 */

import { Teacher } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const teachersService = {
  /**
   * Enqueue a teacher operation into the persistent queue
   */
  enqueueSync(teacher: Teacher): { queued: true; queueItemId: string } {
    return syncQueueService.enqueue('teacher', teacher.id, 'upsert', teacher);
  },

  /**
   * Adds a new teacher to local storage and enqueues sync
   */
  add(current: Teacher[], newTeacher: Teacher): { data: Teacher[]; sync: { queued: true; queueItemId: string } } {
    const next = [...current, newTeacher];
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    const sync = syncQueueService.enqueue('teacher', newTeacher.id, 'upsert', newTeacher);
    return { data: next, sync };
  },

  /**
   * Updates an existing teacher in local storage and enqueues sync
   */
  update(current: Teacher[], updatedTeacher: Teacher): { data: Teacher[]; sync: { queued: true; queueItemId: string } } {
    const next = current.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    const sync = syncQueueService.enqueue('teacher', updatedTeacher.id, 'upsert', updatedTeacher);
    return { data: next, sync };
  },

  /**
   * Removes a teacher by ID from local storage and enqueues sync
   */
  delete(current: Teacher[], teacherId: string): { data: Teacher[]; sync: { queued: true; queueItemId: string } } {
    const next = current.filter(t => t.id !== teacherId);
    saveLocalData(STORAGE_KEYS.TEACHERS, next);
    const sync = syncQueueService.enqueue('teacher', teacherId, 'delete', { id: teacherId });
    return { data: next, sync };
  }
};

