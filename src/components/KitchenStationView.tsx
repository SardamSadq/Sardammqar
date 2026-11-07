import React, { useState } from 'react';
import { Station, Order, OrderItem, MenuItem, CafeteriaSettings } from '../types';
import {
  Flame,
  Coffee,
  Utensils,
  Clock,
  Printer,
  Plus,
  Trash2,
  AlertCircle,
  Layers,
  ChefHat,
  Image as ImageIcon,
} from 'lucide-react';
import { playAlertSound } from '../services/audio';

interface KitchenStationViewProps {
  stations: Station[];
  orders: Order[];
  settings: CafeteriaSettings;
  menuItems?: MenuItem[];
  onUpdateItemStatus?: (orderId: string, itemId: string, newStatus: OrderItem['status']) => void;
  onAddStation: (name: string, description: string, ip: string) => void;
  onDeleteStation: (stationId: string) => void;
}

export const KitchenStationView: React.FC<KitchenStationViewProps> = ({
  stations,
  orders,
  settings,
  menuItems = [],
  onAddStation,
  onDeleteStation,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    stations[0]?.id || 'nargile'
  );
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationDesc, setNewStationDesc] = useState('');
  const [newStationIp, setNewStationIp] = useState('192.168.1.205');

  const currentStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  // Active orders that contain items belonging to this specific station
  const stationOrders = orders
    .filter((order) => order.status === 'active')
    .map((order) => {
      const stationItems = order.items.filter(
        (item) => item.stationId === currentStation?.id
      );
      return {
        ...order,
        items: stationItems,
      };
    })
    .filter((order) => order.items.length > 0);

  const handlePrintStationChit = (tableOrder: Order) => {
    // Printable chit for this specific station
    const printWindow = window.open('', '_blank', 'width=350,height=500');
    if (!printWindow) return;

    const itemsHtml = tableOrder.items
      .map(
        (i) => `
      <div style="display:flex; justify-content:space-between; margin-bottom: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
        <span style="font-weight: bold;">${i.quantity} × ${i.name}</span>
        <span style="color: #666;">${i.notes ? `(${i.notes})` : ''}</span>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ku">
        <head>
          <title>پسولەی ئامادەکردن - ${currentStation.name}</title>
          <style>
            body { font-family: sans-serif; font-size: 14px; margin: 10px; }
            h2, h3 { margin: 4px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px;">
            <h2>${currentStation.name}</h2>
            <div style="font-size: 16px; font-weight: bold; margin: 4px 0;">${tableOrder.tableName} (${tableOrder.hallName})</div>
            <div>گارسۆن: ${tableOrder.waiterName || 'گشتی'} | کات: ${new Date(tableOrder.createdAt).toLocaleTimeString('ar-IQ')}</div>
          </div>
          <div>${itemsHtml}</div>
          <div style="text-align: center; margin-top: 15px; font-size: 12px; border-top: 1px solid #000; padding-top: 5px;">
            تیکێتی ئامادەکردن (گارسۆن دێت خواردنەکە دەبات)
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;
    onAddStation(newStationName.trim(), newStationDesc.trim(), newStationIp.trim());
    setNewStationName('');
    setNewStationDesc('');
    setIsAddStationModalOpen(false);
  };

  const getStationIcon = (id: string) => {
    if (id === 'nargile') return <Flame className="w-4 h-4 text-amber-500" />;
    if (id === 'cold') return <Coffee className="w-4 h-4 text-cyan-400" />;
    if (id === 'kitchen') return <Utensils className="w-4 h-4 text-emerald-400" />;
    return <ChefHat className="w-4 h-4 text-purple-400" />;
  };

  return (
    <div className="space-y-5">
      {/* Station Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {stations.map((st) => {
            const isSelected = st.id === selectedStationId;
            // Count active orders for this station
            const stationActiveCount = orders
              .filter((o) => o.status === 'active')
              .filter((o) => o.items.some((i) => i.stationId === st.id)).length;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStationId(st.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {getStationIcon(st.id)}
                <span>{st.name}</span>
                {stationActiveCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {stationActiveCount} مێز
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsAddStationModalOpen(true)}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          زیادکردنی بەشی نوێ (Station)
        </button>
      </div>

      {/* Station Header Notice */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            {getStationIcon(currentStation.id)}
            <span>داواکارییەکانی {currentStation.name}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{currentStation.description}</p>
        </div>

        <div className="text-left">
          <span className="text-[11px] text-slate-400 block font-mono">پرینتەری LAN:</span>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {currentStation.printerIp}:{currentStation.printerPort}
          </span>
        </div>
      </div>

      {/* Station Orders Cards (Kitchen Display System - KDS) */}
      {stationOrders.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <ChefHat className="w-12 h-12 stroke-1 mx-auto text-slate-600" />
          <h4 className="text-sm font-bold text-slate-400">
            هیچ داواکارییەکی چاوەڕوانکراو نییە بۆ {currentStation.name}
          </h4>
          <p className="text-xs text-slate-500">
            کاتێک گارسۆن داواکاری نوێ تۆمار دەکات، تەنها شتەکانی تایبەت بەم بەشە لێرە دەردەکەون.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stationOrders.map((order) => {
            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all"
              >
                {/* Order Card Top */}
                <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30">
                      {order.tableId}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">{order.tableName}</h4>
                      <span className="text-[10px] text-slate-400">
                        {order.hallName} • گارسۆن: {order.waiterName || 'گشتی'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left flex items-center gap-2">
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString('ar-IQ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePrintStationChit(order)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                      title="پرینت کردنی پسولەی ئەم بەشە"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-3 space-y-2 flex-1">
                  {order.items.map((item) => {
                    const menuItem = menuItems.find(
                      (m) => m.id === item.menuItemId || m.name === item.name
                    );

                    return (
                      <div
                        key={item.id}
                        className="p-2 rounded-xl border bg-slate-950 border-slate-800/80 text-white flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          {menuItem?.image ? (
                            <img
                              src={menuItem.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                              <ChefHat className="w-5 h-5 text-amber-500/60" />
                            </span>
                          )}

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-slate-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                                {item.quantity}×
                              </span>
                              <span className="font-bold text-xs">{item.name}</span>
                            </div>
                            {item.notes && (
                              <span className="text-[10px] text-amber-300/90 block">
                                تێبینی: {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer */}
                <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>گارسۆن دێت دەیبات: <strong className="text-slate-200">{order.waiterName}</strong></span>
                  <span className="font-bold text-amber-400 font-mono">
                    #{order.orderNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Station Modal */}
      {isAddStationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateStation}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm flex items-center justify-between">
              <span>زیادکردنی بەشی نوێ لە کافتریا / چێشتخانە</span>
              <button
                type="button"
                onClick={() => setIsAddStationModalOpen(false)}
                className="hover:bg-black/20 p-1 rounded text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  ناوی بەشەکە (Station Name):
                </label>
                <input
                  type="text"
                  required
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="نموونە: بەشی قاوەخانە و شیرینی"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  ڕوونکردنەوەی کارەکانی ئەم بەشە:
                </label>
                <input
                  type="text"
                  value={newStationDesc}
                  onChange={(e) => setNewStationDesc(e.target.value)}
                  placeholder="نموونە: دروستکردنی کێک و کافێی تایبەت"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  IPی پرینتەری تایبەت بەم بەشە لەسەر تۆڕی LAN:
                </label>
                <input
                  type="text"
                  value={newStationIp}
                  onChange={(e) => setNewStationIp(e.target.value)}
                  placeholder="192.168.1.205"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs shadow transition"
                >
                  زیادکردنی بەش
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStationModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  داخستن
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
