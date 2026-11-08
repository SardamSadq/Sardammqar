import React, { useState, useEffect } from 'react';
import {
  TableItem,
  MenuItem,
  Station,
  Order,
  OrderItem,
  Staff,
  CafeteriaSettings,
} from '../types';
import {
  Layers,
  ShoppingBag,
  Send,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Flame,
  Coffee,
  Utensils,
  Search,
  User,
  RotateCcw,
  Receipt,
  FileText,
  LogOut,
  Bell,
} from 'lucide-react';
import { syncBus } from '../services/sync';
import { playClickSound, playAlertSound } from '../services/audio';
import { PinLoginModal } from './PinLoginModal';

interface WaiterTabletViewProps {
  tables: TableItem[];
  menuItems: MenuItem[];
  stations: Station[];
  staffList: Staff[];
  settings: CafeteriaSettings;
  activeOrders: Order[];
  onSaveOrder: (order: Order, tableId: number) => void;
  onTableActiveChange?: (tableId: number, device: 'waiter_tablet' | null) => void;
}

export const WaiterTabletView: React.FC<WaiterTabletViewProps> = ({
  tables,
  menuItems,
  stations,
  staffList,
  settings,
  activeOrders,
  onSaveOrder,
  onTableActiveChange,
}) => {
  // Waiter Authentication with PIN
  const [loggedInWaiter, setLoggedInWaiter] = useState<Staff | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('cafeteria_waiter_id');
      if (savedId) {
        const found = staffList.find((s) => s.id === savedId && s.active);
        if (found) return found;
      }
    }
    return null;
  });

  // Waiter flow state
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [currentCart, setCurrentCart] = useState<OrderItem[]>([]);
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);
  const [selectedHall, setSelectedHall] = useState<string>('all');
  const [lanConnected, setLanConnected] = useState<boolean>(syncBus.isConnected);
  const [billRequestedMessage, setBillRequestedMessage] = useState<string | null>(null);

  useEffect(() => {
    return syncBus.onConnectionChange((connected) => {
      setLanConnected(connected);
    });
  }, []);

  // Load existing order for the selected table if any
  useEffect(() => {
    if (selectedTable) {
      // Notify laptop that waiter is viewing/editing this table
      onTableActiveChange?.(selectedTable.id, 'waiter_tablet');
      syncBus.publish('TABLE_ACTIVE_OPEN', 'waiter_tablet', {
        tableId: selectedTable.id,
        tableName: selectedTable.name,
      });

      const existing = activeOrders.find(
        (o) => o.tableId === selectedTable.id && o.status === 'active'
      );
      if (existing) {
        setCurrentCart([...existing.items]);
      } else {
        setCurrentCart([]);
      }
      setGuestCount(selectedTable.activeGuests || 2);
    } else {
      onTableActiveChange?.(0, null);
    }
  }, [selectedTable?.id]);

  const handleSelectTable = (table: TableItem) => {
    playClickSound();
    setSelectedTable(table);
    setOrderSentSuccess(false);
  };

  const handleBackToTables = () => {
    playClickSound();
    if (selectedTable) {
      onTableActiveChange?.(selectedTable.id, null);
      syncBus.publish('TABLE_ACTIVE_CLOSE', 'waiter_tablet', {
        tableId: selectedTable.id,
      });
    }
    setSelectedTable(null);
  };

  const handleAddItemToCart = (item: MenuItem) => {
    playClickSound();
    const existingIndex = currentCart.findIndex((i) => i.menuItemId === item.id);
    if (existingIndex > -1) {
      const updated = [...currentCart];
      updated[existingIndex].quantity += 1;
      setCurrentCart(updated);
    } else {
      const newItem: OrderItem = {
        id: `orditem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        stationId: item.stationId,
        status: 'pending',
        orderedAt: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      };
      setCurrentCart([...currentCart, newItem]);
    }
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    playClickSound();
    const updated = [...currentCart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCurrentCart(updated);
  };

  const handleUpdateItemNote = (index: number, note: string) => {
    const updated = [...currentCart];
    updated[index].notes = note;
    setCurrentCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    playClickSound();
    const updated = [...currentCart];
    updated.splice(index, 1);
    setCurrentCart(updated);
  };

  // Submit Order from Waiter
  const handleSendOrder = () => {
    if (!selectedTable || currentCart.length === 0 || !loggedInWaiter) return;

    const subtotal = currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal;

    const existingOrder = activeOrders.find(
      (o) => o.tableId === selectedTable.id && o.status === 'active'
    );

    const newOrder: Order = {
      id: existingOrder ? existingOrder.id : `ord_${Date.now()}`,
      orderNumber: existingOrder ? existingOrder.orderNumber : activeOrders.length + 101,
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      hallName: selectedTable.hall,
      waiterName: loggedInWaiter.name,
      waiterId: loggedInWaiter.id,
      items: currentCart,
      subtotal,
      discount: existingOrder?.discount || 0,
      total,
      status: 'active',
      createdAt: existingOrder ? existingOrder.createdAt : new Date().toISOString(),
      paymentMethod: 'cash',
    };

    onSaveOrder(newOrder, selectedTable.id);

    // Notify laptop and stations
    syncBus.publish('ORDER_SUBMITTED', 'waiter_tablet', {
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      waiterName: loggedInWaiter.name,
      waiterId: loggedInWaiter.id,
      order: newOrder,
    });

    setOrderSentSuccess(true);
    playAlertSound();

    setTimeout(() => {
      setSelectedTable(null);
      setOrderSentSuccess(false);
    }, 1800);
  };

  // Request Bill / Receipt from Cashier
  const handleRequestBill = (table: TableItem) => {
    if (!loggedInWaiter) return;
    playClickSound();

    // Broadcast BILL_REQUESTED event to Laptop Cashier
    syncBus.publish('BILL_REQUESTED', 'waiter_tablet', {
      tableId: table.id,
      tableName: table.name,
      waiterName: loggedInWaiter.name,
      waiterId: loggedInWaiter.id,
      activeOrderId: table.activeOrderId,
      timestamp: Date.now(),
    });

    playAlertSound();
    setBillRequestedMessage(`داواکاری وەسڵ بۆ ${table.name} بە سەرکەوتوویی نێردرا بۆ کاشێر 🧾`);
    setTimeout(() => setBillRequestedMessage(null), 4000);
  };

  const handleLogoutWaiter = () => {
    playClickSound();
    try {
      sessionStorage.removeItem('cafeteria_waiter_id');
    } catch {}
    setLoggedInWaiter(null);
  };

  // If not logged in with PIN, show PIN Login Modal
  if (!loggedInWaiter) {
    return (
      <PinLoginModal
        isOpen={true}
        mode="waiter"
        staffList={staffList}
        cafeteriaName={settings.name}
        onLogin={(staff) => {
          setLoggedInWaiter(staff);
          try {
            sessionStorage.setItem('cafeteria_waiter_id', staff.id);
          } catch {}
        }}
      />
    );
  }

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesStation =
      selectedStationFilter === 'all' || item.stationId === selectedStationFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStation && matchesSearch && item.isAvailable;
  });

  const cartTotal = currentCart.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const getStationName = (stId: string) => {
    return stations.find((s) => s.id === stId)?.name || 'بەشی سەرەکی';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Tablet Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            📱
          </div>
          <div>
            <h1 className="font-bold text-base text-white flex items-center gap-2">
              <span>تابلێتی گارسۆن</span>
              {lanConnected ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  سیرڤەری لاپتۆپ: بەستراوە
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  لە پەیوەندیدایە...
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              {settings.name || 'کافتریا'} • بەشی گارسۆنەکان
            </p>
          </div>
        </div>

        {/* Logged in Waiter & Logout Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>گارسۆن: {loggedInWaiter.name}</span>
          </div>

          <button
            type="button"
            onClick={handleLogoutWaiter}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1"
            title="دەرچوون لەم تابلێتە بۆ ئەوەی گارسۆنێکی تر بە پاسۆرد بچێتەژوورەوە"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>دەرچوون</span>
          </button>
        </div>
      </header>

      {/* Bill Request Alert Banner */}
      {billRequestedMessage && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Receipt className="w-4 h-4" />
          <span>{billRequestedMessage}</span>
        </div>
      )}

      {/* Main Content Area: STEP 1: Select Table OR STEP 2: Make Order */}
      {!selectedTable ? (
        /* STEP 1: Choose Table */
        <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Layers className="w-6 h-6" />
                هەنگاوی یەکەم: مێزی داواکاری دیاری بکە
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                کلیک لەسەر ئەو مێزە بکە کە کریار لێی دانیشتووە تا مینو و داواکاری بۆ بنێریت.
              </p>
            </div>

            {/* Hall filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setSelectedHall('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedHall === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                هەموو هۆڵەکان
              </button>
              {settings.halls.map((hall) => (
                <button
                  key={hall}
                  type="button"
                  onClick={() => setSelectedHall(hall)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    selectedHall === hall
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {hall}
                </button>
              ))}
            </div>
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {tables
              .filter((t) => selectedHall === 'all' || t.hall === selectedHall)
              .map((table) => {
                const isOccupied = table.status === 'occupied';
                const isBilling = table.status === 'billing';
                const isLaptopActive = table.currentDeviceActive === 'laptop';

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`relative p-3.5 rounded-2xl border text-right transition-all transform active:scale-95 flex flex-col justify-between h-40 cursor-pointer ${
                      isBilling
                        ? 'bg-rose-950/40 border-rose-500 shadow-rose-950/50 shadow-lg'
                        : isOccupied
                        ? 'bg-amber-950/30 border-amber-500/60 hover:border-amber-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Live Sync Badge if Laptop POS is on this table */}
                    {isLaptopActive && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                        کاشێر
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-amber-400 border border-slate-700">
                        {table.id}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[70px]">
                        {table.hall}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">{table.name}</h4>
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            isBilling
                              ? 'text-rose-400 animate-pulse font-bold'
                              : isOccupied
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isBilling
                            ? '🧾 داوای وەسڵ'
                            : isOccupied
                            ? 'پڕە'
                            : 'بەتاڵە'}
                        </span>
                        {isOccupied && (
                          <span className="text-slate-400 text-[10px]">
                            {table.activeGuests || 2} کەس
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Bill Request button directly on table card if occupied */}
                    {isOccupied && !isBilling && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestBill(table);
                        }}
                        className="w-full py-1 px-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                        title="داواکردنی پسوڵە بۆ ئەم مێزە"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>داوای وەسڵ</span>
                      </button>
                    )}

                    {isBilling && (
                      <div className="text-[10px] text-center font-bold text-rose-300 bg-rose-500/20 py-0.5 rounded-md border border-rose-500/30">
                        چاوەڕوانی کاشێرە...
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* STEP 2: Order Builder & Cart */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Menu Catalog (Left/Center in RTL) */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
            {/* Top Toolbar: Back Button & Station Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={handleBackToTables}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
              >
                <ArrowRight className="w-4 h-4" />
                <span>گەڕانەوە بۆ مێزەکان ({selectedTable.name})</span>
              </button>

              {/* Station Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedStationFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedStationFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  هەموو بەشەکان
                </button>
                {stations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStationFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                      selectedStationFilter === st.id
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{st.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان بەدوای نێرگەلە، ساردی، پیتزا، شەربەت..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Menu Items Grid with Photos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddItemToCart(item)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl overflow-hidden cursor-pointer transition-all transform active:scale-95 shadow-md flex flex-col"
                >
                  {/* Item Image */}
                  <div className="h-28 w-full bg-slate-800 relative overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {item.stationId === 'nargile' ? (
                          <Flame className="w-8 h-8 text-amber-500/40" />
                        ) : item.stationId === 'cold' ? (
                          <Coffee className="w-8 h-8 text-cyan-500/40" />
                        ) : (
                          <Utensils className="w-8 h-8 text-emerald-500/40" />
                        )}
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-medium text-amber-400">
                      {item.category}
                    </span>
                  </div>

                  {/* Item Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {getStationName(item.stationId)}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-400 font-mono">
                        {item.price.toLocaleString()} {settings.currency}
                      </span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col h-auto lg:h-[calc(100vh-65px)]">
            {/* Cart Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>داواکارییەکانی {selectedTable.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  گارسۆن: <span className="text-amber-400 font-bold">{loggedInWaiter.name}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px]">میوان:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-10 bg-transparent text-center font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Request Bill Button in Cart for active occupied table */}
            {selectedTable.status === 'occupied' && (
              <div className="p-3 bg-amber-500/10 border-b border-amber-500/20">
                <button
                  type="button"
                  onClick={() => handleRequestBill(selectedTable)}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Receipt className="w-4 h-4" />
                  <span>داواکردنی وەسڵ لە کاشێر (داوای حساب)</span>
                </button>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-72 lg:max-h-none">
              {currentCart.length === 0 ? (
                <div className="h-48 lg:h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                  <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
                  <p className="text-xs">هیچ داواکارییەک دیاری نەکراوە</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    کلیک لەسەر بەرهەمەکان بکە بۆ زیادکردن
                  </p>
                </div>
              ) : (
                currentCart.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-white">{item.name}</h5>
                        <span className="text-[10px] text-amber-400/80">
                          {getStationName(item.stationId)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        {(item.price * item.quantity).toLocaleString()} {settings.currency}
                      </span>
                    </div>

                    {/* Quantity controls & Notes */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, -1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Note input for customer special requests */}
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateItemNote(idx, e.target.value)}
                      placeholder="تێبینی: نموونە، بێ شەکر، زوو ئامادە بکرێت..."
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">کۆی گشتی داواکاری:</span>
                <span className="text-base font-extrabold text-amber-400">
                  {cartTotal.toLocaleString()} {settings.currency}
                </span>
              </div>

              {orderSentSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span>داواکاریەکە نێردرا و دەنگی ئاگاداری لە لاپتۆپ لێیدا!</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentCart.length === 0}
                  onClick={handleSendOrder}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send className="w-4 h-4" />
                  <span>ناردنی داواکاری بۆ بەشەکان و کاشێر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentCart([])}
                  className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl"
                  title="سڕینەوەی کارت"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
