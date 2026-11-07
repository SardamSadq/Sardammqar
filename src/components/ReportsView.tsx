import React, { useState } from 'react';
import { Order, Station, CafeteriaSettings } from '../types';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Printer,
  ShoppingBag,
  Flame,
  Coffee,
  Utensils,
  CreditCard,
  Banknote,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  stations: Station[];
  settings: CafeteriaSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  stations,
  settings,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Filter completed orders for the selected date
  const completedOrders = orders.filter((o) => {
    if (o.status !== 'completed') return false;
    const orderDate = new Date(o.completedAt || o.createdAt)
      .toISOString()
      .split('T')[0];
    return orderDate === selectedDate;
  });

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscount = completedOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalOrdersCount = completedOrders.length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Breakdown by station / department
  const stationRevenue: Record<string, number> = {};
  stations.forEach((st) => (stationRevenue[st.id] = 0));

  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      const stId = item.stationId || 'other';
      stationRevenue[stId] = (stationRevenue[stId] || 0) + item.price * item.quantity;
    });
  });

  // Breakdown by payment method
  const cashTotal = completedOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((s, o) => s + o.total, 0);
  const cardTotal = completedOrders
    .filter((o) => o.paymentMethod === 'card')
    .reduce((s, o) => s + o.total, 0);
  const fastpayTotal = completedOrders
    .filter((o) => o.paymentMethod === 'korek_fastpay')
    .reduce((s, o) => s + o.total, 0);

  // Print Daily Z-Report
  const handlePrintDailyReport = () => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ku">
        <head>
          <title>ڕاپۆرتی داهاتی ڕۆژانە - ${selectedDate}</title>
          <style>
            body { font-family: sans-serif; font-size: 13px; margin: 12px; line-height: 1.5; }
            h2, h3 { margin: 4px 0; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            td, th { padding: 4px 0; border-bottom: 1px dashed #444; }
            .total { font-weight: bold; font-size: 15px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>${settings.name || 'کافتریا'}</h2>
          <h3>ڕاپۆرتی دارایی ڕۆژانە (Z-Report)</h3>
          <p style="text-align: center; font-size: 11px;">بەروار: ${selectedDate} | کات: ${new Date().toLocaleTimeString('ar-IQ')}</p>
          <hr />
          <table>
            <tr><td>کۆی گشتی داهاتی ڕۆژ:</td><td class="total" align="left">${totalRevenue.toLocaleString()} ${settings.currency}</td></tr>
            <tr><td>ژمارەی پسولەکان:</td><td align="left">${totalOrdersCount} پسولە</td></tr>
            <tr><td>کۆی داشکاندنەکان:</td><td align="left">${totalDiscount.toLocaleString()} ${settings.currency}</td></tr>
            <tr><td>تێکڕای پسولە:</td><td align="left">${averageOrderValue.toLocaleString()} ${settings.currency}</td></tr>
          </table>
          <br />
          <h4>داهاتی بەشەکان:</h4>
          <table>
            ${stations
              .map(
                (st) =>
                  `<tr><td>${st.name}:</td><td align="left">${(stationRevenue[st.id] || 0).toLocaleString()} ${settings.currency}</td></tr>`
              )
              .join('')}
          </table>
          <br />
          <h4>شێوازی پارەدان:</h4>
          <table>
            <tr><td>کاش (نەقد):</td><td align="left">${cashTotal.toLocaleString()} ${settings.currency}</td></tr>
            <tr><td>کارت / ڤیزا:</td><td align="left">${cardTotal.toLocaleString()} ${settings.currency}</td></tr>
            <tr><td>فاستپەی (FastPay):</td><td align="left">${fastpayTotal.toLocaleString()} ${settings.currency}</td></tr>
          </table>
          <hr />
          <p style="text-align: center; font-size: 10px;">بەڕێوەبەر: ${settings.ownerName} | تەلەفۆن: ${settings.phone}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            ڕاپۆرت و داهاتی ڕۆژانەی کافتریا
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            کۆی گشتی فرۆش، پۆلێنکردنی داهاتی نێرگەلە، ساردی، چێشتخانە و چاپکردنی ڕاپۆرتی Z.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handlePrintDailyReport}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <Printer className="w-4 h-4" />
            پرینت کردنی ڕاپۆرتی ڕۆژ (Z)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">کۆی داهاتی ئەمرۆ</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {totalRevenue.toLocaleString()} {settings.currency}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">ژمارەی پسولەکان</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {totalOrdersCount} پسولە
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">تێکڕای نرخی هەر پسولەیەک</span>
            <span className="text-xl font-black text-sky-400 font-mono">
              {averageOrderValue.toLocaleString()} {settings.currency}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">کۆی داشکاندنەکان</span>
            <span className="text-xl font-black text-rose-400 font-mono">
              {totalDiscount.toLocaleString()} {settings.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown by Stations / Departments */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-white">داهاتی بەشەکان (نێرگەلە، ساردی، چێشتخانە)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stations.map((st) => {
            const rev = stationRevenue[st.id] || 0;
            const percent = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;

            return (
              <div
                key={st.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    {st.id === 'nargile' && <Flame className="w-4 h-4 text-amber-500" />}
                    {st.id === 'cold' && <Coffee className="w-4 h-4 text-cyan-400" />}
                    {st.id === 'kitchen' && <Utensils className="w-4 h-4 text-emerald-400" />}
                    {st.name}
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {percent}%
                  </span>
                </div>

                <div className="text-lg font-black font-mono text-white">
                  {rev.toLocaleString()} {settings.currency}
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs text-white">
            لیستی پسولە تەواوبووەکانی {selectedDate} ({completedOrders.length})
          </h3>
        </div>

        {completedOrders.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            هیچ فرۆشێکی پاشەکەوتکراو لەم بەروارەدا نییە.
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">ژ. پسولە</th>
                <th className="p-3">مێز / هۆڵ</th>
                <th className="p-3">کات</th>
                <th className="p-3">گارسۆن</th>
                <th className="p-3">شێوازی پارەدان</th>
                <th className="p-3">کۆی پسولە</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {completedOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-amber-400">#{o.orderNumber}</td>
                  <td className="p-3 font-bold text-white">
                    {o.tableName} ({o.hallName})
                  </td>
                  <td className="p-3 font-mono text-slate-400">
                    {new Date(o.completedAt || o.createdAt).toLocaleTimeString('ar-IQ', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3 text-slate-300">{o.waiterName || 'گشتی'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                      {o.paymentMethod === 'cash' ? 'نەقد' : o.paymentMethod === 'card' ? 'کارت' : 'فاستپەی'}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    {o.total.toLocaleString()} {settings.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
