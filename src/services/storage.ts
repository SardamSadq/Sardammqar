import { CafeteriaSettings, MenuItem, Order, Staff, Station, TableItem, LanPrinterConfig } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'cafeteria_pos_settings',
  TABLES: 'cafeteria_pos_tables',
  MENU: 'cafeteria_pos_menu',
  STATIONS: 'cafeteria_pos_stations',
  ORDERS: 'cafeteria_pos_orders',
  STAFF: 'cafeteria_pos_staff',
  PRINTERS: 'cafeteria_pos_printers',
};

export const DEFAULT_STATIONS: Station[] = [
  {
    id: 'nargile',
    name: 'بەشی نێرگەلە',
    icon: 'Flame',
    color: 'from-amber-600 to-orange-600',
    printerIp: '192.168.1.201',
    printerPort: 9100,
    autoPrint: true,
    description: 'تایبەت بە ئامادەکردنی نێرگەلە و سەری نێرگەلە و خەڵوز بۆ کڕیاران',
  },
  {
    id: 'cold',
    name: 'بەشی ساردی و شەربەت',
    icon: 'Coffee',
    color: 'from-cyan-600 to-blue-600',
    printerIp: '192.168.1.202',
    printerPort: 9100,
    autoPrint: true,
    description: 'تایبەت بە شەربەتی سروشتی، کافێ، کێک، ئایسکرێم و شیرینی',
  },
  {
    id: 'kitchen',
    name: 'بەشی چێشتخانە و خواردن',
    icon: 'Utensils',
    color: 'from-emerald-600 to-green-600',
    printerIp: '192.168.1.203',
    printerPort: 9100,
    autoPrint: true,
    description: 'تایبەت بە ژەمی خواردن، پیتزا، بەرگەر، ساندویچ و خواردنی خێرا',
  },
];

export const INITIAL_SETTINGS: CafeteriaSettings = {
  isConfigured: false, // Starts unconfigured as requested by user
  name: '',
  ownerName: '',
  phone: '',
  address: '',
  currency: 'د.ع', // Iraqi Dinar
  receiptFooter: 'سوپاس بۆ سەردانەکەتان - بە هیوای کاتێکی خۆش',
  serviceChargePercent: 0,
  totalTables: 12,
  halls: ['هۆڵی سەرەکی', 'باخچەی دەرەوە', 'بەشی VIP'],
  telegramBotToken: '9055134076:AAFE3xXoberJrA6aywsUdOOQVIjN_Wkqom8',
  telegramChatId: '8234511712',
  isActivated: false,
  activationCode: '',
};

export const SAMPLE_MENU: MenuItem[] = [
  // نێرگەلە
  {
    id: 'm1',
    name: 'نێرگەلە دووسێو فاخر',
    price: 6000,
    category: 'نێرگەلە',
    stationId: 'nargile',
    image: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm2',
    name: 'نێرگەلە نەعناع و لیمۆ',
    price: 6000,
    category: 'نێرگەلە',
    stationId: 'nargile',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm3',
    name: 'نێرگەلە ترێ و نەعناع',
    price: 6500,
    category: 'نێرگەلە',
    stationId: 'nargile',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm4',
    name: 'گۆڕینی سەری نێرگەلە',
    price: 3000,
    category: 'نێرگەلە',
    stationId: 'nargile',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },

  // بەشی ساردی و خواردنەوەکان
  {
    id: 'm5',
    name: 'شەربەتی پرتەقاڵی سروشتی',
    price: 3500,
    category: 'ساردی و شەربەت',
    stationId: 'cold',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm6',
    name: 'مۆهیتۆ شلیک و نەعناع',
    price: 4000,
    category: 'ساردی و شەربەت',
    stationId: 'cold',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm7',
    name: 'ئایس لاتێ سپێشەڵ',
    price: 4500,
    category: 'ساردی و شەربەت',
    stationId: 'cold',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm8',
    name: 'کێکی شوکولاتە (چیزکێک)',
    price: 4000,
    category: 'شیرینی و کێک',
    stationId: 'cold',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm9',
    name: 'چای کوردی خەست',
    price: 1000,
    category: 'گەرمی',
    stationId: 'cold',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm10',
    name: 'قاوەی تورکی',
    price: 2000,
    category: 'گەرمی',
    stationId: 'cold',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },

  // بەشی چێشتخانە
  {
    id: 'm11',
    name: 'بەرگەری گۆشتی تایبەت',
    price: 7500,
    category: 'خواردن',
    stationId: 'kitchen',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm12',
    name: 'پیتزا پێپەرۆنی قەبارەی گەورە',
    price: 10000,
    category: 'خواردن',
    stationId: 'kitchen',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm13',
    name: 'فینگەر و کریسپی',
    price: 5000,
    category: 'خواردن',
    stationId: 'kitchen',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm14',
    name: 'ساندویچی مریشکی فاخر',
    price: 6000,
    category: 'خواردن',
    stationId: 'kitchen',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
];

export const getSettings = (): CafeteriaSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading settings', err);
  }
  return INITIAL_SETTINGS;
};

export const saveSettings = (settings: CafeteriaSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getStations = (): Station[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATIONS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading stations', err);
  }
  return DEFAULT_STATIONS;
};

export const saveStations = (stations: Station[]) => {
  localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
};

export const getTables = (totalCount = 12, halls: string[] = ['هۆڵی سەرەکی']): TableItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading tables', err);
  }
  
  // Generate initial tables
  const defaultTables: TableItem[] = [];
  const hallList = halls.length > 0 ? halls : ['هۆڵی سەرەکی'];
  for (let i = 1; i <= totalCount; i++) {
    const hallIndex = Math.floor((i - 1) / Math.ceil(totalCount / hallList.length));
    defaultTables.push({
      id: i,
      name: `مێزی ${i}`,
      hall: hallList[hallIndex] || hallList[0],
      capacity: 4,
      status: 'available',
      activeGuests: 0,
      currentDeviceActive: undefined,
    });
  }
  return defaultTables;
};

export const saveTables = (tables: TableItem[]) => {
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
};

export const getMenuItems = (): MenuItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU);
    if (raw) {
      const parsed: MenuItem[] = JSON.parse(raw);
      return parsed.map((item) => {
        if (!item.image) {
          const sample = SAMPLE_MENU.find((s) => s.id === item.id || s.name === item.name);
          if (sample?.image) {
            return { ...item, image: sample.image };
          }
        }
        return item;
      });
    }
  } catch (err) {
    console.error('Error reading menu', err);
  }
  return SAMPLE_MENU;
};

export const saveMenuItems = (menu: MenuItem[]) => {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
};

export const getOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading orders', err);
  }
  return [];
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const getStaffList = (): Staff[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading staff', err);
  }
  return [
    { id: 'st1', name: 'گارسۆن ١ (ئەحمەد)', role: 'waiter', phone: '07500000001', pin: '1111', active: true, ordersCount: 0, totalSales: 0 },
    { id: 'st2', name: 'گارسۆن ٢ (کاروان)', role: 'waiter', phone: '07500000002', pin: '2222', active: true, ordersCount: 0, totalSales: 0 },
    { id: 'st3', name: 'کاشێر سەرەکی', role: 'cashier', phone: '07500000003', pin: '0000', active: true, ordersCount: 0, totalSales: 0 },
  ];
};

export const saveStaffList = (staff: Staff[]) => {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
};

export const getLanPrinters = (): LanPrinterConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRINTERS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading printers', err);
  }
  return [
    { stationId: 'cashier', stationName: 'پرینتەری سەرەکی کاشێر (پسولەی کڕیار)', ip: '192.168.1.200', port: 9100, paperWidth: '80mm', enabled: true },
    { stationId: 'nargile', stationName: 'پرینتەری بەشی نێرگەلە', ip: '192.168.1.201', port: 9100, paperWidth: '80mm', enabled: true },
    { stationId: 'cold', stationName: 'پرینتەری بەشی ساردی و کێک', ip: '192.168.1.202', port: 9100, paperWidth: '80mm', enabled: true },
    { stationId: 'kitchen', stationName: 'پرینتەری بەشی چێشتخانە', ip: '192.168.1.203', port: 9100, paperWidth: '80mm', enabled: true },
  ];
};

export const saveLanPrinters = (printers: LanPrinterConfig[]) => {
  localStorage.setItem(STORAGE_KEYS.PRINTERS, JSON.stringify(printers));
};

export const resetAllData = () => {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
};
