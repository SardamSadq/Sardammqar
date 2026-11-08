/**
 * Real-time LAN synchronization between Laptop POS, Cashier, and Waiter Tablets.
 * Works over local Wi-Fi / LAN via embedded server SSE, BroadcastChannel, and Electron IPC.
 */
import { LanServerInfo } from '../types';

export type SyncEventType =
  | 'TABLE_ACTIVE_OPEN'
  | 'TABLE_ACTIVE_CLOSE'
  | 'ORDER_SUBMITTED'
  | 'PAYMENT_COMPLETED'
  | 'DATA_RELOAD'
  | 'PRINTER_TEST'
  | 'BILL_REQUESTED'
  | 'BILL_PRINTED';

export interface SyncMessage {
  type: SyncEventType;
  sender: 'laptop' | 'waiter_tablet' | 'kitchen';
  timestamp: number;
  payload: Record<string, unknown>;
}

type SyncCallback = (msg: SyncMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class SyncBus {
  private channel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private connectionListeners: Set<ConnectionCallback> = new Set();
  public isConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor() {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel for fast local tab communication
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('cafeteria_pos_sync');
        this.channel.onmessage = (event) => {
          this.notify(event.data, false);
        };
      } catch (e) {
        console.warn('BroadcastChannel error fallback', e);
      }
    }

    // 2. Storage event fallback for same-device tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'cafeteria_pos_event' && e.newValue) {
        try {
          const data: SyncMessage = JSON.parse(e.newValue);
          this.notify(data, false);
        } catch {
          // ignore
        }
      }
    });

    // 3. Electron IPC listener if running in Electron on laptop
    if (window.electronPOS?.onSyncEvent) {
      window.electronPOS.onSyncEvent((data: unknown) => {
        this.notify(data as SyncMessage, false);
      });
      this.setConnected(true);
    }

    // 4. Connect to SSE stream on local server (laptop or tablet)
    this.connectEventSource();
  }

  private connectEventSource() {
    if (typeof window === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/sync/stream');

      this.eventSource.onopen = () => {
        this.setConnected(true);
      };

      this.eventSource.onmessage = (event) => {
        if (!event.data || event.data.startsWith(':')) return;
        try {
          const data: SyncMessage = JSON.parse(event.data);
          this.notify(data, false);
        } catch {
          // ignore comments or pings
        }
      };

      this.eventSource.onerror = () => {
        this.setConnected(false);
        this.eventSource?.close();
        this.eventSource = null;

        // Attempt reconnect after 3 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectEventSource();
          }, 3000);
        }
      };
    } catch (e) {
      console.warn('EventSource connection error:', e);
    }
  }

  private setConnected(status: boolean) {
    if (this.isConnected !== status) {
      this.isConnected = status;
      this.connectionListeners.forEach((cb) => cb(status));
    }
  }

  public onConnectionChange(cb: ConnectionCallback): () => void {
    this.connectionListeners.add(cb);
    cb(this.isConnected);
    return () => {
      this.connectionListeners.delete(cb);
    };
  }

  public subscribe(cb: SyncCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public publish(
    type: SyncEventType,
    sender: 'laptop' | 'waiter_tablet' | 'kitchen',
    payload: Record<string, unknown> = {}
  ) {
    const msg: SyncMessage = {
      type,
      sender,
      timestamp: Date.now(),
      payload,
    };

    // 1. Notify local in-memory listeners
    this.notify(msg, true);

    // 2. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {
        // ignore
      }
    }

    // 3. Storage event fallback
    try {
      localStorage.setItem('cafeteria_pos_event', JSON.stringify(msg));
    } catch {
      // ignore
    }

    // 4. Electron IPC broadcast
    if (window.electronPOS?.broadcastSync) {
      try {
        window.electronPOS.broadcastSync(msg);
      } catch {
        // ignore
      }
    }

    // 5. Send HTTP POST to local server endpoint so tablets/laptop receive it
    try {
      fetch('/api/sync/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(msg),
      }).catch(() => {
        // Network might be offline, storage and BroadcastChannel covered locally
      });
    } catch {
      // ignore
    }
  }

  private notify(msg: SyncMessage, _isLocal: boolean) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }

  /**
   * Fetch detected Wi-Fi LAN IP and waiter tablet URL from local server
   */
  public async getLanInfo(): Promise<LanServerInfo> {
    if (window.electronPOS?.getLanServerInfo) {
      try {
        const info = await window.electronPOS.getLanServerInfo();
        if (info && info.preferredIp) {
          return info;
        }
      } catch (err) {
        console.warn('Error querying electron LAN info:', err);
      }
    }

    try {
      const res = await fetch('/api/lan-info');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const port = typeof window !== 'undefined' ? Number(window.location.port) || 3000 : 3000;
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    return {
      preferredIp: isLocal ? '192.168.1.100' : host,
      port,
      waiterUrl: `${window.location.origin}/?view=waiter`,
      cashierUrl: `${window.location.origin}/`,
      allIps: [{ name: 'Wi-Fi / LAN', ip: isLocal ? '192.168.1.100' : host }],
      connectedTablets: 1,
    };
  }

  /**
   * Push full application state to local server
   */
  public async pushStateToServer(state: Record<string, unknown>) {
    try {
      await fetch('/api/sync/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
    } catch {
      // ignore
    }
  }

  /**
   * Fetch full application state from local server (tables, menu, orders)
   */
  public async fetchStateFromServer(): Promise<Record<string, any> | null> {
    try {
      const res = await fetch('/api/sync/state');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export const syncBus = new SyncBus();
