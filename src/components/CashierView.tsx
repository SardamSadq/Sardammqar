import React, { useState } from 'react';
import {
  TableItem,
  MenuItem,
  Order,
  OrderItem,
  CafeteriaSettings,
  Station,
  Staff,
} from '../types';
import {
  Printer,
  CheckCircle2,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Receipt,
  Search,
  RotateCcw,
  User,
  Coffee,
  Flame,
  Utensils,
  CreditCard,
  Banknote,
  Send,
} from 'lucide-react';
import { playCashSound, playClickSound, playAlertSound } from '../services/audio';
import { syncBus } from '../services/sync';

interface CashierViewProps {
  table: TableItem;
  order: Order | null;
  menuItems: MenuItem[];
  stations: Station[];
  staffList: Staff[];
  settings: CafeteriaSettings;
  onClose: () => void;
  onSaveOrder: (order: Order, tableId: number) => void;
  onCompletePayment: (order: Order, tableId: number, cashReceived: number, change: number) => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  table,
  order,
  menuItems,
  stations,
  staffList,
  settings,
  onClose,
  onSaveOrder,
  onCompletePayment,
}) => {
  // Current order state
  const [items, setItems] = useState<OrderItem[]>(order ? [...order.items] : []);
  const [discount, setDiscount] = useState<number>(order?.discount || 0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [waiterName, setWaiterName] = useState<string>(
    order?.waiterName || staffList[0]?.name || 'گارسۆن ١'
  );

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'korek_fastpay'>('cash');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const cashNum = parseFloat(cashReceivedInput) || 0;
  const change = Math.max(0, cashNum - total);

  const handleAddItem = (menuItem: MenuItem) => {
    playClickSound();
    const existingIndex = items.findIndex((i) => i.menuItemId === menuItem.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      const newItem: OrderItem = {
        id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        stationId: menuItem.stationId,
        status: 'pending',
        orderedAt: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      };
      setItems([...items, newItem]);
    }
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    playClickSound();
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    playClickSound();
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleSaveActiveOrder = () => {
    playClickSound();
    const newOrder: Order = {
      id: order ? order.id : `ord_${Date.now()}`,
      orderNumber: order ? order.orderNumber : Math.floor(100 + Math.random() * 900),
      tableId: table.id,
      tableName: table.name,
      hallName: table.hall,
      waiterName,
      items,
      subtotal,
      discount,
      total,
      status: 'active',
      createdAt: order ? order.createdAt : new Date().toISOString(),
      paymentMethod,
    };
    onSaveOrder(newOrder, table.id);
    syncBus.publish('DATA_RELOAD', 'laptop', { tableId: table.id });
    onClose();
  };

  const handleOpenPayment = () => {
    if (items.length === 0) return;
    setCashReceivedInput(total.toString());
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPaymentAndPrint = (autoPrint = true) => {
    const finalOrder: Order = {
      id: order ? order.id : `ord_${Date.now()}`,
      orderNumber: order ? order.orderNumber : Math.floor(100 + Math.random() * 900),
      tableId: table.id,
      tableName: table.name,
      hallName: table.hall,
      waiterName,
      items,
      subtotal,
      discount,
      total,
      cashReceived: cashNum || total,
      change,
      status: 'completed',
      createdAt: order ? order.createdAt : new Date().toISOString(),
      completedAt: new Date().toISOString(),
      paymentMethod,
    };

    // Play real Cha-Ching cash sound
    playCashSound();

    // Trigger payment callback which updates orders, table status to available, and sets receipt for print
    onCompletePayment(finalOrder, table.id, cashNum || total, change);

    // Notify all devices and waiter tablet
    syncBus.publish('PAYMENT_COMPLETED', 'laptop', {
      tableId: table.id,
      tableName: table.name,
      order: finalOrder,
    });

    setIsPaymentModalOpen(false);

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 350);
    }

    onClose();
  };

  const categories = ['all', ...Array.from(new Set(menuItems.map((m) => m.category)))];

  const filteredItems = menuItems.filter((m) => {
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && m.isAvailable;
  });

  const getStationIcon = (stationId: string) => {
    if (stationId === 'nargile') return <Flame className="w-3.5 h-3.5 text-amber-500" />;
    if (stationId === 'cold') return <Coffee className="w-3.5 h-3.5 text-cyan-500" />;
    return <Utensils className="w-3.5 h-3.5 text-emerald-500" />;
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg border border-amber-500/30">
              {table.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">{table.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {table.hall}
                </span>
                {table.currentDeviceActive === 'waiter_tablet' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    تابلێتی گارسۆن لەسەر ئەم مێزەیە
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                حیسابات و چاودێری مێز • کاتی ئێستا: {new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Waiter assignment */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.name} className="bg-slate-900 text-white">
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
            >
              داخستن ✕
            </button>
          </div>
        </div>

        {/* Cashier Split Body: Catalog (Left) + Current Bill (Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Menu Catalog */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3.5 bg-slate-900/60">
            {/* Search & Categories */}
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="گەڕان لە مینو..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {cat === 'all' ? 'هەموو جۆرەکان' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredItems.map((item) => {
                const count = items.find((i) => i.menuItemId === item.id)?.quantity || 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItem(item)}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-2xl text-right transition flex flex-col justify-between h-24 group relative active:scale-95"
                  >
                    {count > 0 && (
                      <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center justify-center">
                        {count}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {getStationIcon(item.stationId)}
                        </span>
                      )}
                      <div className="overflow-hidden flex-1 text-right">
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-xs text-white group-hover:text-amber-400 truncate">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                      <span className="font-extrabold text-amber-400 font-mono">
                        {item.price.toLocaleString()} {settings.currency}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bill / Invoice Panel */}
          <div className="w-full md:w-96 bg-slate-950 border-t md:border-t-0 md:border-r border-slate-800 flex flex-col">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-400" />
                لیستی داواکارییەکان
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {items.reduce((s, i) => s + i.quantity, 0)} دانە
              </span>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {items.length === 0 ? (
                <div className="h-44 md:h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                  <Receipt className="w-10 h-10 stroke-1 mb-2 text-slate-600" />
                  هیچ بەرهەمێک بۆ ئەم مێزە هەڵنەبژێردراوە.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="font-bold text-amber-400">
                        {(item.price * item.quantity).toLocaleString()} {settings.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400">
                        نرخی تاک: {item.price.toLocaleString()} {settings.currency}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold font-mono text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-500 hover:text-rose-400 mr-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discount */}
            <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>کۆی بەرهەمەکان:</span>
                <span className="font-mono font-bold">
                  {subtotal.toLocaleString()} {settings.currency}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>داشکاندن ({settings.currency}):</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-right text-rose-400 font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm font-black text-white">
                <span>کۆی کۆتایی بۆ دان:</span>
                <span className="text-base text-amber-400 font-mono">
                  {total.toLocaleString()} {settings.currency}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={handleOpenPayment}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>وەرگرتنی پارە و پرینت کردنی پسولە</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveActiveOrder}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    هەڵگرتنی داواکاری
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (items.length > 0) window.print();
                    }}
                    disabled={items.length === 0}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1"
                    title="تەنها پرینت"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT MODAL */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-200" />
                  <h3 className="font-bold text-sm">وەرگرتنی پارە و چاپی پسولە ({table.name})</h3>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-black/20 text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Total Due Banner */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-0.5">بڕی داواکراو:</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {total.toLocaleString()} {settings.currency}
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    نەقد (کاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    کارت / ڤیزا
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('korek_fastpay')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                      paymentMethod === 'korek_fastpay'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    FastPay / فاستپەی
                  </button>
                </div>

                {/* Cash Received Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    پارەی وەرگیراو لە کڕیار:
                  </label>
                  <input
                    type="number"
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-center text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick denomination chips for Iraqi Dinars */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[total, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashReceivedInput(amt.toString())}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-mono border border-slate-700"
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Change Due (باقیی پارە) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">باقیی پارە بۆ کڕیار:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {change.toLocaleString()} {settings.currency}
                  </span>
                </div>

                {/* Confirm Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmPaymentAndPrint(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Printer className="w-4 h-4" />
                    وەرگرتنی پارە و پرینت کردنی پسولە ڕاستەوخۆ
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmPaymentAndPrint(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    وەرگرتنی پارە بە بێ چاپکردنی پسولە
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
