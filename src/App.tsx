import React, { useState, useEffect } from 'react';
import {
  CafeteriaSettings,
  TableItem,
  MenuItem,
  Station,
  Order,
  Staff,
  LanPrinterConfig,
} from './types';
import {
  getSettings,
  saveSettings,
  getTables,
  saveTables,
  getMenuItems,
  saveMenuItems,
  getStations,
  saveStations,
  getOrders,
  saveOrders,
  getStaffList,
  saveStaffList,
  getLanPrinters,
  saveLanPrinters,
  resetAllData,
  INITIAL_SETTINGS,
} from './services/storage';
import { playCashSound, playOrderSound, playAlertSound, playClickSound, playBillBellSound } from './services/audio';
import { syncBus, SyncMessage } from './services/sync';

// Components
import { SetupWizard } from './components/SetupWizard';
import { Navbar, ActiveTab } from './components/Navbar';
import { TablesView } from './components/TablesView';
import { CashierView } from './components/CashierView';
import { WaiterTabletView } from './components/WaiterTabletView';
import { KitchenStationView } from './components/KitchenStationView';
import { MenuManager } from './components/MenuManager';
import { StaffManager } from './components/StaffManager';
import { ReportsView } from './components/ReportsView';
import { LanPrinterSettings } from './components/LanPrinterSettings';
import { QrCodeModal } from './components/QrCodeModal';
import { ReceiptPrintView } from './components/ReceiptPrintView';
import { PinLoginModal } from './components/PinLoginModal';
import { Laptop, Bell, Receipt, Printer, X } from 'lucide-react';

export default function App() {
  // Application Data States
  const [settings, setSettings] = useState<CafeteriaSettings>(() => getSettings());
  const [tables, setTables] = useState<TableItem[]>(() =>
    getTables(settings.totalTables, settings.halls)
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getMenuItems());
  const [stations, setStations] = useState<Station[]>(() => getStations());
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [staffList, setStaffList] = useState<Staff[]>(() => getStaffList());
  const [printers, setPrinters] = useState<LanPrinterConfig[]>(() => getLanPrinters());

  // UI Modes & Views
  // Determine if device opened with ?view=waiter from QR code
  const [currentMode, setCurrentMode] = useState<'laptop' | 'waiter'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'waiter') {
        return 'waiter';
      }
    }
    return 'laptop';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('tables');
  const [selectedTableForCashier, setSelectedTableForCashier] = useState<TableItem | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<Order | null>(null);

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  // Active Cashier on Laptop
  const [activeCashier, setActiveCashier] = useState<Staff | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('cafeteria_cashier_id');
      if (savedId) {
        const list = getStaffList();
        const found = list.find((s) => s.id === savedId && s.active);
        if (found) return found;
      }
    }
    return null;
  });

  // Table Bill Request Banner on Laptop
  const [billRequestedBanner, setBillRequestedBanner] = useState<{
    tableId: number;
    tableName: string;
    waiterName: string;
  } | null>(null);

  const handleQuickPrintReceipt = (table: TableItem) => {
    const order = orders.find((o) => o.tableId === table.id && o.status === 'active');
    if (order) {
      setReceiptToPrint(order);
      if (soundEnabled) playCashSound();
      syncBus.publish('BILL_PRINTED', 'laptop', {
        tableId: table.id,
        tableName: table.name,
      });
      setBillRequestedBanner((prev) => (prev?.tableId === table.id ? null : prev));
    } else {
      setSelectedTableForCashier(table);
    }
  };

  // Initial load: Fetch existing state from local LAN server (vital for waiter tablet)
  useEffect(() => {
    syncBus.fetchStateFromServer().then((serverState) => {
      if (serverState) {
        if (serverState.settings?.name) {
          setSettings(serverState.settings);
          saveSettings(serverState.settings);
        }
        if (Array.isArray(serverState.tables) && serverState.tables.length > 0) {
          setTables(serverState.tables);
          saveTables(serverState.tables);
        }
        if (Array.isArray(serverState.menu) && serverState.menu.length > 0) {
          setMenuItems(serverState.menu);
          saveMenuItems(serverState.menu);
        }
        if (Array.isArray(serverState.stations) && serverState.stations.length > 0) {
          setStations(serverState.stations);
          saveStations(serverState.stations);
        }
        if (Array.isArray(serverState.staff) && serverState.staff.length > 0) {
          setStaffList(serverState.staff);
          saveStaffList(serverState.staff);
        }
        if (Array.isArray(serverState.orders) && serverState.orders.length > 0) {
          setOrders(serverState.orders);
          saveOrders(serverState.orders);
        }
      }
    });
  }, []);

  // Laptop pushes state updates to local server so any connected tablet receives it
  useEffect(() => {
    if (currentMode === 'laptop' && settings.name) {
      syncBus.pushStateToServer({
        settings,
        tables,
        menu: menuItems,
        stations,
        orders,
        staff: staffList,
        printers,
      });
    }
  }, [settings, tables, menuItems, stations, orders, staffList, printers, currentMode]);

  // Listen to cross-device / cross-tab real-time sync events
  useEffect(() => {
    const unsubscribe = syncBus.subscribe((msg: SyncMessage) => {
      if (msg.type === 'ORDER_SUBMITTED') {
        // Waiter placed an order -> Trigger alert sound on Laptop POS
        if (soundEnabled) {
          playOrderSound();
        }
        setLastNotification(
          `داواکاری نوێ تۆمارکرا بۆ ${msg.payload.tableName || 'مێز'} لەلایەن ${
            msg.payload.waiterName || 'گارسۆن'
          }!`
        );
        setTimeout(() => setLastNotification(null), 4000);

        // If message has order payload, save it directly
        if (msg.payload.order && msg.payload.tableId) {
          const incomingOrder = msg.payload.order as Order;
          const incomingTableId = Number(msg.payload.tableId);
          handleSaveOrder(incomingOrder, incomingTableId);
        } else {
          setOrders(getOrders());
          setTables(getTables(settings.totalTables, settings.halls));
        }
      } else if (msg.type === 'PAYMENT_COMPLETED') {
        if (soundEnabled && currentMode === 'laptop') {
          playCashSound();
        }
        if (msg.payload.tableId) {
          const paidTableId = Number(msg.payload.tableId);
          setTables((prev) =>
            prev.map((t) =>
              t.id === paidTableId
                ? { ...t, status: 'available', activeOrderId: undefined }
                : t
            )
          );
        }
        setOrders(getOrders());
      } else if (msg.type === 'TABLE_ACTIVE_OPEN') {
        // Update table item's active indicator
        const targetId = Number(msg.payload.tableId);
        setTables((prev) =>
          prev.map((t) =>
            t.id === targetId ? { ...t, currentDeviceActive: msg.sender } : t
          )
        );
      } else if (msg.type === 'TABLE_ACTIVE_CLOSE') {
        const targetId = Number(msg.payload.tableId);
        setTables((prev) =>
          prev.map((t) =>
            t.id === targetId ? { ...t, currentDeviceActive: undefined } : t
          )
        );
      } else if (msg.type === 'BILL_REQUESTED') {
        const tableId = Number(msg.payload.tableId);
        const tableName = (msg.payload.tableName as string) || `مێزی ${tableId}`;
        const waiterName = (msg.payload.waiterName as string) || 'گارسۆن';

        if (soundEnabled && currentMode === 'laptop') {
          playBillBellSound();
        }

        // Set table to billing status
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  status: 'billing',
                  billRequestedByWaiter: waiterName,
                  billRequestedAt: new Date().toISOString(),
                }
              : t
          )
        );

        setBillRequestedBanner({
          tableId,
          tableName,
          waiterName,
        });

        setLastNotification(`🔔 ${tableName} داوای وەسڵی کردووە لەلایەن ${waiterName}!`);
      } else if (msg.type === 'BILL_PRINTED') {
        const tableId = Number(msg.payload.tableId);
        setBillRequestedBanner((prev) => (prev?.tableId === tableId ? null : prev));
      } else if (msg.type === 'DATA_RELOAD') {
        syncBus.fetchStateFromServer().then((serverState) => {
          if (serverState) {
            if (serverState.tables) setTables(serverState.tables);
            if (serverState.menu) setMenuItems(serverState.menu);
            if (serverState.orders) setOrders(serverState.orders);
          } else {
            setOrders(getOrders());
            setTables(getTables(settings.totalTables, settings.halls));
          }
        });
      }
    });

    return () => unsubscribe();
  }, [soundEnabled, currentMode, settings.totalTables, settings.halls, tables, orders]);

  // Handle first-time setup completion
  const handleSetupComplete = (newSettings: CafeteriaSettings) => {
    setSettings(newSettings);
    const initialTables = getTables(newSettings.totalTables, newSettings.halls);
    setTables(initialTables);
  };

  // Orders handlers
  const handleSaveOrder = (order: Order, tableId: number) => {
    // Upsert order in orders list
    const existingIndex = orders.findIndex((o) => o.id === order.id);
    let updatedOrders: Order[];
    if (existingIndex > -1) {
      updatedOrders = [...orders];
      updatedOrders[existingIndex] = order;
    } else {
      updatedOrders = [order, ...orders];
    }
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    // Update table status to occupied
    const updatedTables = tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            status: 'occupied' as const,
            activeOrderId: order.id,
            activeGuests: t.activeGuests || 2,
          }
        : t
    );
    setTables(updatedTables);
    saveTables(updatedTables);
    setReceiptToPrint(order);
  };

  const handleCompletePayment = (
    finalOrder: Order,
    tableId: number,
    cashReceived: number,
    change: number
  ) => {
    // 1. Mark order as completed
    const existingIndex = orders.findIndex((o) => o.id === finalOrder.id);
    let updatedOrders: Order[];
    if (existingIndex > -1) {
      updatedOrders = [...orders];
      updatedOrders[existingIndex] = finalOrder;
    } else {
      updatedOrders = [finalOrder, ...orders];
    }
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    // 2. Clear table and reset to available
    const updatedTables = tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            status: 'available' as const,
            activeOrderId: undefined,
            activeGuests: 0,
            currentDeviceActive: undefined,
          }
        : t
    );
    setTables(updatedTables);
    saveTables(updatedTables);

    // 3. Set receipt for printing
    setReceiptToPrint(finalOrder);
  };

  // Table add/delete
  const handleAddTable = (name: string, hall: string, capacity: number) => {
    const newId = tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1;
    const newTable: TableItem = {
      id: newId,
      name,
      hall,
      capacity,
      status: 'available',
    };
    const updated = [...tables, newTable];
    setTables(updated);
    saveTables(updated);
  };

  const handleDeleteTable = (tableId: number) => {
    const updated = tables.filter((t) => t.id !== tableId);
    setTables(updated);
    saveTables(updated);
  };

  // Kitchen item status update
  const handleUpdateItemStatus = (
    orderId: string,
    itemId: string,
    newStatus: 'pending' | 'preparing' | 'ready' | 'served'
  ) => {
    const updated = orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        items: o.items.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i)),
      };
    });
    setOrders(updated);
    saveOrders(updated);
  };

  // Stations add/delete
  const handleAddStation = (name: string, description: string, ip: string) => {
    const id = `st_${Date.now()}`;
    const newStation: Station = {
      id,
      name,
      icon: 'ChefHat',
      color: 'from-purple-600 to-indigo-600',
      printerIp: ip || '192.168.1.205',
      printerPort: 9100,
      autoPrint: true,
      description,
    };
    const updated = [...stations, newStation];
    setStations(updated);
    saveStations(updated);
  };

  const handleDeleteStation = (stationId: string) => {
    const updated = stations.filter((s) => s.id !== stationId);
    setStations(updated);
    saveStations(updated);
  };

  // Reset entire system to blank slate & prompt activation
  const handleResetData = async () => {
    resetAllData();
    try {
      sessionStorage.clear();
    } catch {}
    if ((window as any).electronPOS?.clearAppData) {
      try {
        await (window as any).electronPOS.clearAppData();
      } catch (err) {
        console.error('Failed to clear electron app data', err);
      }
    }
    setActiveCashier(null);
    setSettings(INITIAL_SETTINGS);
    setTables([]);
    setOrders([]);
  };

  // IF SYSTEM IS NOT YET CONFIGURED / ACTIVATED -> Show Installation Wizard
  if (!settings.isConfigured || !settings.isActivated) {
    return (
      <SetupWizard
        initialSettings={settings}
        onComplete={handleSetupComplete}
      />
    );
  }

  // Count pending items across all stations
  const pendingKitchenCount = orders
    .filter((o) => o.status === 'active')
    .flatMap((o) => o.items)
    .filter((i) => i.status !== 'ready').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Real-time Order Alert Toast */}
      {lastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs border border-amber-300 animate-in slide-in-from-top-4 duration-200">
          <Bell className="w-4 h-4 animate-bounce" />
          <span>{lastNotification}</span>
        </div>
      )}

      {/* Main Switch: WAITER TABLET MODE vs LAPTOP POS MODE */}
      {currentMode === 'waiter' ? (
        <div className="relative min-h-screen">
          <WaiterTabletView
            tables={tables}
            menuItems={menuItems}
            stations={stations}
            staffList={staffList}
            settings={settings}
            activeOrders={orders}
            onSaveOrder={handleSaveOrder}
            onTableActiveChange={(tableId, device) => {
              setTables((prev) =>
                prev.map((t) => (t.id === tableId ? { ...t, currentDeviceActive: device || undefined } : t))
              );
            }}
          />
        </div>
      ) : (
        /* LAPTOP POS INTERFACE */
        <div className="flex-1 flex flex-col">
          {/* If Cashier is not logged in with PIN, show Cashier Login Modal */}
          {!activeCashier && (
            <PinLoginModal
              isOpen={true}
              mode="cashier"
              staffList={staffList}
              cafeteriaName={settings.name}
              onLogin={(cashier) => {
                setActiveCashier(cashier);
                try {
                  sessionStorage.setItem('cafeteria_cashier_id', cashier.id);
                } catch {}
              }}
              onResetToSetup={handleResetData}
            />
          )}

          {/* Navbar */}
          <Navbar
            activeTab={activeTab}
            onTabChange={(tab) => {
              playClickSound();
              setActiveTab(tab);
            }}
            settings={settings}
            activeCashier={activeCashier}
            onLockCashier={() => {
              playClickSound();
              try {
                sessionStorage.removeItem('cafeteria_cashier_id');
              } catch {}
              setActiveCashier(null);
            }}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onResetData={handleResetData}
            pendingKitchenCount={pendingKitchenCount}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playCashSound();
            }}
          />

          {/* High Priority Bill Requested Banner from Waiter Tablet */}
          {billRequestedBanner && (
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white px-4 py-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-amber-300 animate-in slide-in-from-top">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6 text-amber-200 animate-bounce" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm">
                      🔔 {billRequestedBanner.tableName} داوای وەسڵی کردووە!
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-amber-200 font-bold">
                      گارسۆن: {billRequestedBanner.waiterName}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 mt-0.5">
                    کڕیار لەسەر ئەم مێزەیە و داوای حسابی کردووە. تکایە پسوڵەکە چاپ بکە تا گارسۆن بیبات بۆ سەر مێزەکە.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const targetTable = tables.find((t) => t.id === billRequestedBanner.tableId);
                    if (targetTable) handleQuickPrintReceipt(targetTable);
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپکردنی دەستبەجێی وەسڵ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetTable = tables.find((t) => t.id === billRequestedBanner.tableId);
                    if (targetTable) setSelectedTableForCashier(targetTable);
                  }}
                  className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs transition"
                >
                  <span>کردنەوە لە کاشێر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillRequestedBanner(null)}
                  className="p-2 hover:bg-black/20 rounded-xl text-white/80 hover:text-white transition"
                  title="داخستنی ئەم ئاگادارییە"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Main Tab Content */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
            {activeTab === 'tables' && (
              <TablesView
                tables={tables}
                activeOrders={orders}
                settings={settings}
                onSelectTable={(table) => {
                  playClickSound();
                  setSelectedTableForCashier(table);
                  // Notify that laptop is on this table
                  syncBus.publish('TABLE_ACTIVE_OPEN', 'laptop', {
                    tableId: table.id,
                    tableName: table.name,
                  });
                }}
                onAddTable={handleAddTable}
                onDeleteTable={handleDeleteTable}
                onQuickPrintReceipt={handleQuickPrintReceipt}
              />
            )}

            {activeTab === 'kitchen' && (
              <KitchenStationView
                stations={stations}
                orders={orders}
                settings={settings}
                menuItems={menuItems}
                onAddStation={handleAddStation}
                onDeleteStation={handleDeleteStation}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                orders={orders}
                stations={stations}
                settings={settings}
              />
            )}

            {activeTab === 'menu' && (
              <MenuManager
                menuItems={menuItems}
                stations={stations}
                settings={settings}
                onSaveMenuItems={(items) => {
                  setMenuItems(items);
                  saveMenuItems(items);
                }}
              />
            )}

            {activeTab === 'staff' && (
              <StaffManager
                staffList={staffList}
                onSaveStaffList={(list) => {
                  setStaffList(list);
                  saveStaffList(list);
                }}
              />
            )}

            {activeTab === 'printers' && (
              <LanPrinterSettings
                printers={printers}
                onSavePrinters={(prList) => {
                  setPrinters(prList);
                  saveLanPrinters(prList);
                }}
                onOpenQrModal={() => setIsQrModalOpen(true)}
              />
            )}
          </main>
        </div>
      )}

      {/* Cashier Billing Modal */}
      {selectedTableForCashier && (
        <CashierView
          table={selectedTableForCashier}
          order={
            orders.find(
              (o) => o.tableId === selectedTableForCashier.id && o.status === 'active'
            ) || null
          }
          menuItems={menuItems}
          stations={stations}
          staffList={staffList}
          settings={settings}
          activeCashier={activeCashier}
          onClose={() => {
            syncBus.publish('TABLE_ACTIVE_CLOSE', 'laptop', {
              tableId: selectedTableForCashier.id,
            });
            setSelectedTableForCashier(null);
          }}
          onSaveOrder={handleSaveOrder}
          onCompletePayment={handleCompletePayment}
        />
      )}

      {/* QR Code Modal for Waiter Tablet */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Hidden Thermal Receipt Print Container (Prints automatically when window.print() is called) */}
      <ReceiptPrintView
        order={receiptToPrint}
        settings={settings}
        cashierName={staffList.find((s) => s.role === 'cashier')?.name || 'کاشێری سەرەکی'}
      />
    </div>
  );
}
