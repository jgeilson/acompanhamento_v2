/**
 * Storage Service
 * Handles localStorage caching and retrieval with type-safety and fallback support.
 */

export const STORAGE_KEYS = {
  TEACHERS: 'local_teachers',
  CLASSES: 'local_classes',
  SUBJECTS: 'local_subjects',
  PLANS: 'local_plans',
  MEETINGS: 'local_meetings',
  ACTIONS: 'local_actions',
  COORDINATOR_NAME: 'default_coordinator_name',
  SCHOOL_NAME: 'school_name',
  ACADEMIC_YEAR: 'academic_year',
} as const;

export function loadLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as unknown as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save data to localStorage key: ${key}`, err);
  }
}

export function purgeLegacyCredentials(): void {
  try {
    localStorage.removeItem('gs_private_key');
    localStorage.removeItem('gs_client_email');
    localStorage.removeItem('gs_spreadsheet_id');
  } catch {}
}
