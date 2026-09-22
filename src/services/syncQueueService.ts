/**
 * Sync Queue Service
 * Provides an offline-first, resilient, idempotent synchronization queue
 * with persistent localStorage storage, automatic retries with exponential backoff,
 * network event listeners, error classification, and real-time subscriber notifications.
 */

import { sheetsService } from './sheetsService';

export type SyncEntityType = 'teacher' | 'class' | 'subject' | 'plan' | 'meeting' | 'action' | 'action_status';

export type SyncItemStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface SyncQueueItem {
  id: string; // queue item id
  entityType: SyncEntityType;
  entityId: string;
  operation: 'upsert' | 'update_status';
  payload: any;
  status: SyncItemStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: number; // unix timestamp ms
  lastAttemptAt?: string;
  lastError?: string;
  isPermanentError?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncAuditLog {
  id: string;
  timestamp: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: string;
  status: 'success' | 'error';
  details?: string;
}

const QUEUE_STORAGE_KEY = 'sync_queue_v2';
const LOGS_STORAGE_KEY = 'sync_audit_logs_v2';
const MAX_LOGS_ENTRIES = 50;

type QueueListener = (items: SyncQueueItem[], logs: SyncAuditLog[]) => void;

class SyncQueueManager {
  private queue: SyncQueueItem[] = [];
  private logs: SyncAuditLog[] = [];
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;
  private timer: any = null;

  constructor() {
    this.loadFromStorage();
    this.setupNetworkListeners();
    this.startPeriodicTick();
  }

  private loadFromStorage(): void {
    try {
      const rawQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (rawQueue) {
        this.queue = JSON.parse(rawQueue);
        // Reset any items that were left in 'syncing' during a sudden browser close
        this.queue.forEach(item => {
          if (item.status === 'syncing') {
            item.status = 'pending';
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse sync queue from storage', e);
      this.queue = [];
    }

    try {
      const rawLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      if (rawLogs) {
        this.logs = JSON.parse(rawLogs);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(this.logs.slice(0, MAX_LOGS_ENTRIES)));
    } catch (e) {
      console.error('Failed to save sync queue to storage', e);
    }
    this.notifyListeners();
  }

  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncQueue] Internet connection restored. Processing queue...');
        this.processQueue();
      });
    }
  }

  private startPeriodicTick(): void {
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => {
        const hasPendingDue = this.queue.some(
          item => (item.status === 'pending' || (item.status === 'error' && !item.isPermanentError && item.attempts < item.maxAttempts)) &&
                  item.nextAttemptAt <= Date.now()
        );
        if (hasPendingDue && !this.isProcessing) {
          this.processQueue();
        }
      }, 5000);
    }
  }

  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getItems(), this.getLogs());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const items = this.getItems();
    const logs = this.getLogs();
    this.listeners.forEach(l => {
      try {
        l(items, logs);
      } catch (err) {
        console.error('Error in sync queue subscriber', err);
      }
    });
  }

  public getItems(): SyncQueueItem[] {
    return [...this.queue];
  }

  public getLogs(): SyncAuditLog[] {
    return [...this.logs];
  }

  public getSummary(): {
    total: number;
    pending: number;
    syncing: number;
    synced: number;
    errors: number;
    isOnline: boolean;
    lastSyncedAt?: string;
  } {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pending = this.queue.filter(i => i.status === 'pending').length;
    const syncing = this.queue.filter(i => i.status === 'syncing').length;
    const synced = this.queue.filter(i => i.status === 'synced').length;
    const errors = this.queue.filter(i => i.status === 'error').length;
    const lastSuccessLog = this.logs.find(l => l.status === 'success');

    return {
      total: this.queue.length,
      pending,
      syncing,
      synced,
      errors,
      isOnline,
      lastSyncedAt: lastSuccessLog?.timestamp
    };
  }

  /**
   * Enqueues or updates an operation in the persistent queue
   */
  public enqueue(
    entityType: SyncEntityType,
    entityId: string,
    operation: 'upsert' | 'update_status',
    payload: any
  ): string {
    const now = new Date().toISOString();
    const existingIndex = this.queue.findIndex(
      item => item.entityType === entityType && item.entityId === entityId && item.status !== 'synced'
    );

    let queueItemId: string;

    if (existingIndex >= 0) {
      // Coalesce / update existing pending item to avoid redundant remote requests
      const existing = this.queue[existingIndex];
      existing.payload = payload;
      existing.operation = operation;
      existing.status = 'pending';
      existing.updatedAt = now;
      existing.nextAttemptAt = Date.now();
      existing.lastError = undefined;
      existing.isPermanentError = false;
      queueItemId = existing.id;
    } else {
      queueItemId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newItem: SyncQueueItem = {
        id: queueItemId,
        entityType,
        entityId,
        operation,
        payload,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: Date.now(),
        createdAt: now,
        updatedAt: now
      };
      this.queue.push(newItem);
    }

    this.saveToStorage();
    // Trigger immediate background sync
    this.processQueue();
    return queueItemId;
  }

  /**
   * Exponential backoff calculation: 2s -> 5s -> 10s -> 20s -> 30s
   */
  private calculateBackoffDelay(attempts: number): number {
    switch (attempts) {
      case 1: return 2000;
      case 2: return 5000;
      case 3: return 10000;
      case 4: return 20000;
      default: return 30000;
    }
  }

  /**
   * Processes all ready pending items sequentially with safety & isolation
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = Date.now();
      const readyItems = this.queue.filter(
        item => (item.status === 'pending' || (item.status === 'error' && !item.isPermanentError && item.attempts < item.maxAttempts)) &&
                item.nextAttemptAt <= now
      );

      for (const item of readyItems) {
        item.status = 'syncing';
        item.attempts += 1;
        item.lastAttemptAt = new Date().toISOString();
        this.saveToStorage();

        try {
          const result = await this.executeRemoteSync(item);
          if (result.success) {
            item.status = 'synced';
            item.lastError = undefined;
            item.isPermanentError = false;
            this.addLog(item.entityType, item.entityId, item.operation, 'success', result.operation ? `Operação: ${result.operation}` : undefined);
          } else {
            const isFatal = result.retryable === false;
            item.status = 'error';
            item.lastError = result.error || 'Erro desconhecido na sincronização remota';
            item.isPermanentError = isFatal;
            item.nextAttemptAt = Date.now() + this.calculateBackoffDelay(item.attempts);
            this.addLog(item.entityType, item.entityId, item.operation, 'error', item.lastError);
          }
        } catch (err: any) {
          item.status = 'error';
          item.lastError = err?.message || 'Falha de conexão com o servidor';
          item.nextAttemptAt = Date.now() + this.calculateBackoffDelay(item.attempts);
          this.addLog(item.entityType, item.entityId, item.operation, 'error', item.lastError);
        }

        this.saveToStorage();
      }

      // Cleanup old synced items (keep only last 10 synced items to prevent clutter)
      const syncedItems = this.queue.filter(i => i.status === 'synced');
      if (syncedItems.length > 10) {
        const toRemove = syncedItems.slice(0, syncedItems.length - 10).map(i => i.id);
        this.queue = this.queue.filter(i => !toRemove.includes(i.id));
        this.saveToStorage();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Executes the appropriate endpoint based on entityType and operation
   */
  private async executeRemoteSync(item: SyncQueueItem): Promise<{ success: boolean; operation?: string; error?: string; retryable?: boolean }> {
    const { entityType, payload, operation } = item;

    if (operation === 'update_status' && entityType === 'action_status') {
      const res = await fetch('/api/sheets/update-action-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    }

    let endpoint = '';
    let body: any = {};

    switch (entityType) {
      case 'meeting':
        endpoint = '/api/sheets/save-meeting';
        body = { meeting: payload };
        break;
      case 'plan':
        endpoint = '/api/sheets/save-plan';
        body = { plan: payload };
        break;
      case 'teacher':
        endpoint = '/api/sheets/save-teacher';
        body = { teacher: payload };
        break;
      case 'class':
        endpoint = '/api/sheets/save-class';
        body = { classGroup: payload };
        break;
      case 'subject':
        endpoint = '/api/sheets/save-subject';
        body = { subject: payload };
        break;
      case 'action':
        endpoint = '/api/sheets/save-action';
        body = { action: payload };
        break;
      default:
        return { success: false, error: `Tipo de entidade não suportado: ${entityType}`, retryable: false };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `HTTP ${res.status}: ${res.statusText}`,
        retryable: errData.retryable !== undefined ? errData.retryable : res.status >= 500
      };
    }

    return await res.json();
  }

  private addLog(entityType: SyncEntityType, entityId: string, operation: string, status: 'success' | 'error', details?: string): void {
    const log: SyncAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      entityType,
      entityId,
      operation,
      status,
      details
    };
    this.logs.unshift(log);
    if (this.logs.length > MAX_LOGS_ENTRIES) {
      this.logs = this.logs.slice(0, MAX_LOGS_ENTRIES);
    }
  }

  /**
   * Resets error state and triggers immediate retry on all failed items
   */
  public retryAllErrors(): void {
    this.queue.forEach(item => {
      if (item.status === 'error') {
        item.status = 'pending';
        item.attempts = 0;
        item.nextAttemptAt = Date.now();
        item.isPermanentError = false;
      }
    });
    this.saveToStorage();
    this.processQueue();
  }

  /**
   * Clear all synced items
   */
  public clearSynced(): void {
    this.queue = this.queue.filter(i => i.status !== 'synced');
    this.saveToStorage();
  }
}

export const syncQueueService = new SyncQueueManager();
