/**
 * Subjects Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for subjects/disciplines.
 */

import { Subject } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const subjectsService = {
  /**
   * Enqueue a subject operation into the persistent queue
   */
  enqueueSync(subject: Subject): { queued: true; queueItemId: string } {
    return syncQueueService.enqueue('subject', subject.id, 'upsert', subject);
  },

  /**
   * Adds a new subject to local storage and enqueues sync
   */
  add(current: Subject[], newSubject: Subject): { data: Subject[]; sync: { queued: true; queueItemId: string } } {
    const next = [...current, newSubject];
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
    const sync = syncQueueService.enqueue('subject', newSubject.id, 'upsert', newSubject);
    return { data: next, sync };
  },

  /**
   * Updates an existing subject in local storage and enqueues sync
   */
  update(current: Subject[], updatedSubject: Subject): { data: Subject[]; sync: { queued: true; queueItemId: string } } {
    const next = current.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
    const sync = syncQueueService.enqueue('subject', updatedSubject.id, 'upsert', updatedSubject);
    return { data: next, sync };
  },

  /**
   * Removes a subject by ID from local storage and enqueues sync
   */
  delete(current: Subject[], subjectId: string): { data: Subject[]; sync: { queued: true; queueItemId: string } } {
    const next = current.filter(s => s.id !== subjectId);
    saveLocalData(STORAGE_KEYS.SUBJECTS, next);
    const sync = syncQueueService.enqueue('subject', subjectId, 'delete', { id: subjectId });
    return { data: next, sync };
  }
};

