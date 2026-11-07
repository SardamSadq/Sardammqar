import React, { useState } from 'react';
import { TableItem, Order, CafeteriaSettings } from '../types';
import {
  Layers,
  Plus,
  Trash2,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  Tablet,
  Laptop,
} from 'lucide-react';
import { playClickSound } from '../services/audio';

interface TablesViewProps {
  tables: TableItem[];
  activeOrders: Order[];
  settings: CafeteriaSettings;
  onSelectTable: (table: TableItem) => void;
  onAddTable: (name: string, hall: string, capacity: number) => void;
  onDeleteTable: (tableId: number) => void;
}

export const TablesView: React.FC<TablesViewProps> = ({
  tables,
  activeOrders,
  settings,
  onSelectTable,
  onAddTable,
  onDeleteTable,
}) => {
  const [selectedHall, setSelectedHall] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableHall, setNewTableHall] = useState(settings.halls[0] || 'هۆڵی سەرەکی');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    onAddTable(newTableName.trim(), newTableHall, newTableCapacity);
    setNewTableName('');
    setIsAddModalOpen(false);
  };

  const getTableOrder = (tableId: number): Order | undefined => {
    return activeOrders.find((o) => o.tableId === tableId && o.status === 'active');
  };

  const filteredTables = tables.filter(
    (t) => selectedHall === 'all' || t.hall === selectedHall
  );

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        {/* Hall Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedHall('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedHall === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            هەموو مێزەکان ({tables.length})
          </button>
          {settings.halls.map((hall) => {
            const count = tables.filter((t) => t.hall === hall).length;
            return (
              <button
                key={hall}
                type="button"
                onClick={() => setSelectedHall(hall)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedHall === hall
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {hall} ({count})
              </button>
            );
          })}
        </div>

        {/* Quick Stats & Add Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              مێزی بەتاڵ: {availableCount}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              مێزی پڕ: {occupiedCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewTableName(`مێزی ${tables.length + 1}`);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            زیادکردنی مێز
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredTables.map((table) => {
          const order = getTableOrder(table.id);
          const isOccupied = table.status === 'occupied' || !!order;
          const isBilling = table.status === 'billing';
          const isTabletActive = table.currentDeviceActive === 'waiter_tablet';
          const isLaptopActive = table.currentDeviceActive === 'laptop';

          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table)}
              className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 shadow-md flex flex-col justify-between h-44 ${
                isBilling
                  ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                  : isOccupied
                  ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Number & Delete */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border ${
                    isOccupied
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {table.id}
                </div>

                <div className="flex items-center gap-1">
                  {/* Real-time sync badge if Waiter Tablet or Laptop is editing */}
                  {isTabletActive && (
                    <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] flex items-center gap-1 animate-pulse" title="تابلێتی گارسۆن خەریکی ئەم مێزەیە">
                      <Tablet className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {isLaptopActive && (
                    <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] flex items-center gap-1" title="کاشێر ئەم مێزەی کردۆتەوە">
                      <Laptop className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`ئایا دڵنیایت لە سڕینەوەی ${table.name}؟`)) {
                        onDeleteTable(table.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                    title="سڕینەوەی مێز"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Middle Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">{table.name}</h4>
                  <span className="text-[10px] text-slate-400">{table.hall}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    {table.activeGuests || table.capacity} کەس
                  </span>
                  {order && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString('ar-IQ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: Price / Status */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                {order ? (
                  <>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      {order.total.toLocaleString()} {settings.currency}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      پڕە
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      بەتاڵە
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition">
                      کردنەوە ←
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm flex items-center justify-between">
              <span>زیادکردنی مێزی نوێ</span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="hover:bg-black/20 p-1 rounded text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">ناوی مێز:</label>
                <input
                  type="text"
                  required
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="مێزی ١٣"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">هۆڵ / بەش:</label>
                <select
                  value={newTableHall}
                  onChange={(e) => setNewTableHall(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {settings.halls.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  توانای دانیشتن (ژمارەی کەس):
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs shadow transition"
                >
                  زیادکردنی مێز
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  پەشیمانبوونەوە
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
