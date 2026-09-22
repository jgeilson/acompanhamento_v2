/**
 * Classes Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for class groups.
 */

import { ClassGroup } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const classesService = {
  /**
   * Enqueue a class group operation into the persistent queue
   */
  enqueueSync(classGroup: ClassGroup): { queued: true; queueItemId: string } {
    return syncQueueService.enqueue('class', classGroup.id, 'upsert', classGroup);
  },

  /**
   * Adds a new class to local storage and enqueues sync
   */
  add(current: ClassGroup[], newClass: ClassGroup): { data: ClassGroup[]; sync: { queued: true; queueItemId: string } } {
    const next = [...current, newClass];
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    const sync = syncQueueService.enqueue('class', newClass.id, 'upsert', newClass);
    return { data: next, sync };
  },

  /**
   * Updates an existing class in local storage and enqueues sync
   */
  update(current: ClassGroup[], updatedClass: ClassGroup): { data: ClassGroup[]; sync: { queued: true; queueItemId: string } } {
    const next = current.map(c => c.id === updatedClass.id ? updatedClass : c);
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    const sync = syncQueueService.enqueue('class', updatedClass.id, 'upsert', updatedClass);
    return { data: next, sync };
  },

  /**
   * Removes a class by ID from local storage and enqueues sync
   */
  delete(current: ClassGroup[], classId: string): { data: ClassGroup[]; sync: { queued: true; queueItemId: string } } {
    const next = current.filter(c => c.id !== classId);
    saveLocalData(STORAGE_KEYS.CLASSES, next);
    const sync = syncQueueService.enqueue('class', classId, 'delete', { id: classId });
    return { data: next, sync };
  }
};

