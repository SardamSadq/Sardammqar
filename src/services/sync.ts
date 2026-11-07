/**
 * Real-time event bus and synchronization between Laptop POS, Cashier, and Waiter Tablets.
 * Uses BroadcastChannel and window storage events for instant real-time synchronization.
 */

export type SyncEventType =
  | 'TABLE_ACTIVE_OPEN'
  | 'TABLE_ACTIVE_CLOSE'
  | 'ORDER_SUBMITTED'
  | 'PAYMENT_COMPLETED'
  | 'DATA_RELOAD'
  | 'PRINTER_TEST';

export interface SyncMessage {
  type: SyncEventType;
  sender: 'laptop' | 'waiter_tablet' | 'kitchen';
  timestamp: number;
  payload: Record<string, unknown>;
}

type SyncCallback = (msg: SyncMessage) => void;

class SyncBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('cafeteria_pos_sync');
        this.channel.onmessage = (event) => {
          this.notify(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel error fallback to storage', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'cafeteria_pos_event' && e.newValue) {
          try {
            const data: SyncMessage = JSON.parse(e.newValue);
            this.notify(data);
          } catch (err) {
            console.error('Failed to parse storage sync event', err);
          }
        }
      });
    }
  }

  public subscribe(cb: SyncCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public publish(type: SyncEventType, sender: 'laptop' | 'waiter_tablet' | 'kitchen', payload: Record<string, unknown> = {}) {
    const msg: SyncMessage = {
      type,
      sender,
      timestamp: Date.now(),
      payload,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('Channel post error', err);
      }
    }

    // Also trigger local storage event for older browsers or backup
    try {
      localStorage.setItem('cafeteria_pos_event', JSON.stringify(msg));
    } catch {
      // ignore
    }

    // Notify local listeners in current window too
    this.notify(msg);
  }

  private notify(msg: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }
}

export const syncBus = new SyncBus();
