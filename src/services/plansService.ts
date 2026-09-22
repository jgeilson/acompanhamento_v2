/**
 * Bimonthly Plans Service
 * Handles CRUD operations, local cache persistence, and Google Sheets append for bimonthly planning.
 */

import { BimonthlyPlan } from '../types';
import { STORAGE_KEYS, saveLocalData } from './storageService';
import { syncQueueService } from './syncQueueService';

export const plansService = {
  /**
   * Save/Upsert a bimonthly plan to Google Sheets via persistent queue
   */
  async saveToSheets(plan: BimonthlyPlan): Promise<{ success: boolean; error?: string }> {
    try {
      syncQueueService.enqueue('plan', plan.id, 'upsert', plan);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Enqueue error' };
    }
  },

  /**
   * Adds or updates a plan by teacher, subject, bimester, and class group overlap.
   */
  addOrUpdate(currentPlans: BimonthlyPlan[], newPlan: BimonthlyPlan): { nextPlans: BimonthlyPlan[]; isNew: boolean } {
    const newClasses = (newPlan.classGroupIds && newPlan.classGroupIds.length > 0) ? newPlan.classGroupIds : [newPlan.classGroupId];
    const existsIndex = currentPlans.findIndex(p => {
      if (p.teacherId !== newPlan.teacherId || p.subjectId !== newPlan.subjectId || Number(p.bimester) !== Number(newPlan.bimester)) {
        return false;
      }
      const existingClasses = (p.classGroupIds && p.classGroupIds.length > 0) ? p.classGroupIds : [p.classGroupId];
      return newClasses.some(nc => existingClasses.includes(nc));
    });

    const isNew = existsIndex < 0;
    let nextPlans: BimonthlyPlan[];
    if (!isNew) {
      nextPlans = [...currentPlans];
      nextPlans[existsIndex] = newPlan;
    } else {
      nextPlans = [...currentPlans, newPlan];
    }

    saveLocalData(STORAGE_KEYS.PLANS, nextPlans);
    syncQueueService.enqueue('plan', newPlan.id, 'upsert', newPlan);
    return { nextPlans, isNew };
  },

  /**
   * Updates an existing plan in the list, updates localStorage and sync queue
   */
  update(currentPlans: BimonthlyPlan[], updatedPlan: BimonthlyPlan): BimonthlyPlan[] {
    const next = currentPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    saveLocalData(STORAGE_KEYS.PLANS, next);
    syncQueueService.enqueue('plan', updatedPlan.id, 'upsert', updatedPlan);
    return next;
  },

  /**
   * Removes a plan by ID and updates localStorage
   */
  delete(currentPlans: BimonthlyPlan[], planId: string): BimonthlyPlan[] {
    const next = currentPlans.filter(p => p.id !== planId);
    saveLocalData(STORAGE_KEYS.PLANS, next);
    return next;
  }
};

