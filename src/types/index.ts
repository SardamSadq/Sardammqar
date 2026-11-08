export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stationId: string; // 'nargile' | 'cold' | 'kitchen' or custom
  image?: string;
  isAvailable: boolean;
  code?: string;
}

export interface Station {
  id: string;
  name: string;
  icon: string;
  color: string;
  printerIp: string;
  printerPort: number;
  autoPrint: boolean;
  description: string;
}

export interface TableItem {
  id: number;
  name: string;
  hall: string; // 'هۆڵی سەرەکی' | 'باخچە' | 'VIP'
  capacity: number;
  status: 'available' | 'occupied' | 'billing';
  activeOrderId?: string;
  activeGuests?: number;
  currentDeviceActive?: string; // 'laptop' | 'waiter_tablet' | null
  lastUpdated?: string;
  assignedWaiter?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  stationId: string;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  orderedAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId: number;
  tableName: string;
  hallName: string;
  waiterName: string;
  waiterId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  cashReceived?: number;
  change?: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  paymentMethod: 'cash' | 'card' | 'korek_fastpay';
}

export interface Staff {
  id: string;
  name: string;
  role: 'waiter' | 'cashier' | 'manager' | 'hookah_master' | 'chef';
  phone: string;
  pin: string;
  active: boolean;
  ordersCount?: number;
  totalSales?: number;
}

export interface CafeteriaSettings {
  isConfigured: boolean;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  currency: string;
  receiptFooter: string;
  serviceChargePercent: number;
  totalTables: number;
  halls: string[];
  telegramBotToken: string;
  telegramChatId: string;
  isActivated: boolean;
  activationCode: string;
  activatedAt?: string;
}

export interface LanPrinterConfig {
  stationId: string;
  stationName: string;
  ip: string;
  port: number;
  paperWidth: '80mm' | '58mm';
  enabled: boolean;
  lastTestStatus?: 'success' | 'failed' | 'idle';
  lastTestedAt?: string;
}

export interface LanServerInfo {
  preferredIp: string;
  port: number;
  waiterUrl: string;
  cashierUrl: string;
  allIps: Array<{ name: string; ip: string }>;
  connectedTablets: number;
}

declare global {
  interface Window {
    electronPOS?: {
      isElectron: boolean;
      printReceipt: (options?: { silent?: boolean; printerName?: string }) => void;
      getLanServerInfo: () => Promise<LanServerInfo>;
      broadcastSync: (msg: unknown) => void;
      onSyncEvent: (cb: (msg: unknown) => void) => () => void;
    };
  }
}
