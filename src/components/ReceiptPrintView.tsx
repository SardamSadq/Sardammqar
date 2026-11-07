import React from 'react';
import { Order, CafeteriaSettings } from '../types';

interface ReceiptPrintViewProps {
  order: Order | null;
  settings: CafeteriaSettings;
  cashierName?: string;
}

export const ReceiptPrintView: React.FC<ReceiptPrintViewProps> = ({
  order,
  settings,
  cashierName = 'کاشێری سەرەکی',
}) => {
  if (!order) return null;

  return (
    <div id="printable-receipt" className="hidden print:block text-black bg-white p-3 font-mono text-xs w-[80mm] mx-auto">
      {/* Header */}
      <div className="text-center border-b border-black pb-2 mb-2">
        <h2 className="text-base font-bold tracking-tight">{settings.name || 'کافتریا'}</h2>
        {settings.address && <p className="text-[11px]">{settings.address}</p>}
        {settings.phone && <p className="text-[11px]">پەیوەندی: {settings.phone}</p>}
      </div>

      {/* Invoice Meta */}
      <div className="text-[11px] border-b border-black/60 pb-2 mb-2 space-y-0.5">
        <div className="flex justify-between">
          <span>ژمارەی پسولە: #{order.orderNumber}</span>
          <span>{order.tableName}</span>
        </div>
        <div className="flex justify-between">
          <span>هۆڵ: {order.hallName}</span>
          <span>گارسۆن: {order.waiterName || 'گشتی'}</span>
        </div>
        <div className="flex justify-between">
          <span>کاشێر: {cashierName}</span>
          <span>{new Date(order.createdAt).toLocaleDateString('ar-IQ')}</span>
        </div>
        <div className="flex justify-between">
          <span>کات: {new Date(order.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>حاڵەت: {order.status === 'completed' ? 'پارە دراوە' : 'تۆمارکراو'}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-right text-[11px] mb-2 border-b border-black pb-2">
        <thead>
          <tr className="border-b border-black/40">
            <th className="py-1 text-right">بەرهەم</th>
            <th className="py-1 text-center">ژ.</th>
            <th className="py-1 text-left">کۆی گشتی</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/20">
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="py-1">
                <div>{item.name}</div>
                {item.notes && <div className="text-[9px] text-gray-700 italic">({item.notes})</div>}
              </td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-left whitespace-nowrap">
                {(item.price * item.quantity).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="space-y-1 text-right text-[11px] border-b border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>کۆی بەرهەمەکان:</span>
          <span>{order.subtotal.toLocaleString()} {settings.currency}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between font-bold text-gray-800">
            <span>داشکاندن:</span>
            <span>-{order.discount.toLocaleString()} {settings.currency}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-black pt-1 border-t border-black/40">
          <span>کۆی گشتی پارەدان:</span>
          <span>{order.total.toLocaleString()} {settings.currency}</span>
        </div>
        {order.cashReceived !== undefined && (
          <div className="flex justify-between pt-0.5">
            <span>پارەی وەرگیراو:</span>
            <span>{order.cashReceived.toLocaleString()} {settings.currency}</span>
          </div>
        )}
        {order.change !== undefined && (
          <div className="flex justify-between font-bold">
            <span>باقیی پارە:</span>
            <span>{order.change.toLocaleString()} {settings.currency}</span>
          </div>
        )}
      </div>

      {/* Footer & Owner Information */}
      <div className="text-center text-[10px] space-y-1 pt-1">
        <p className="font-semibold">{settings.receiptFooter || 'سوپاس بۆ سەردانەکەتان'}</p>
        
        {/* Creator / Owner info as explicitly requested by user */}
        <div className="pt-2 border-t border-dashed border-black/40 text-[9px] text-gray-700">
          <p>خاوەن / بەڕێوەبەر: {settings.ownerName || 'دیاری نەکراوە'}</p>
          {settings.phone && <p>تەلەفۆن: {settings.phone}</p>}
          <p className="mt-1 text-[8px] text-gray-500">
            *** POS System - تابلێت و کاشێری کافتریا ***
          </p>
        </div>
      </div>
    </div>
  );
};
