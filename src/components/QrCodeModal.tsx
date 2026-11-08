import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Tablet, Copy, Check, X, Wifi, ExternalLink, RefreshCw } from 'lucide-react';
import { syncBus } from '../services/sync';
import { LanServerInfo } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDirectWaiter?: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const [lanInfo, setLanInfo] = useState<LanServerInfo | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [port, setPort] = useState<string>('3000');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load real LAN info from the local server
  const refreshLanInfo = async () => {
    setLoading(true);
    try {
      const info = await syncBus.getLanInfo();
      setLanInfo(info);
      setSelectedIp(info.preferredIp);
      setPort(String(info.port || 3000));
    } catch (e) {
      console.warn('Failed to get LAN info', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLanInfo();
    }
  }, [isOpen]);

  // Target URL for waiter tablet
  const targetUrl =
    selectedIp && port
      ? `http://${selectedIp}:${port}/?view=waiter`
      : typeof window !== 'undefined'
      ? `${window.location.origin}/?view=waiter`
      : 'http://localhost:3000/?view=waiter';

  useEffect(() => {
    if (!isOpen || !targetUrl) return;

    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code error', err));
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black/20 rounded-lg">
              <Tablet className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">بەستنەوەی تابلێتی گارسۆن (LAN Wi-Fi)</h3>
              <p className="text-[11px] text-amber-100/90">
                سیرڤەری لۆکاڵی لەسەر لاپتۆپ بە تەواوی ئامادەیە
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/20 text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-center space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between bg-slate-950/80 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>سیرڤەری ناوخۆیی چالاکە (پۆرت {port})</span>
            </div>
            <button
              onClick={refreshLanInfo}
              disabled={loading}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              title="نوێکردنەوەی ناونیشانی IP"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>نوێکردنەوە</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed text-right">
            کامێرای تابلێت یان مۆبایلی گارسۆنەکە بگرە لەم کۆدە؛ ڕاستەوخۆ دەبەسترێتەوە بە سیرڤەری ناوخۆیی لاپتۆپەکەت بێ پێویستی بە ئینتەرنێتی دەرەکی.
          </p>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl inline-block shadow-xl mx-auto border-4 border-amber-500/30">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Waiter Tablet QR" className="w-48 h-48 mx-auto" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                لە حاڵی دروستکردنی QR دا...
              </div>
            )}
          </div>

          {/* Network Selection and IP Configuration */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-right space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-amber-400" />
                ناونیشانی IPی وایفای (Wi-Fi) لاپتۆپ:
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                {selectedIp}:{port}
              </span>
            </div>

            {/* If multiple network adapters detected, offer dropdown */}
            {lanInfo && lanInfo.allIps && lanInfo.allIps.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 whitespace-nowrap">هەڵبژاردنی هێڵ:</label>
                <select
                  value={selectedIp}
                  onChange={(e) => setSelectedIp(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  {lanInfo.allIps.map((adapter) => (
                    <option key={adapter.ip} value={adapter.ip}>
                      {adapter.name} ({adapter.ip})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Editable IP / Port fields in case user has custom local network */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  value={selectedIp}
                  onChange={(e) => setSelectedIp(e.target.value)}
                  placeholder="192.168.1.XXX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="3000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            {/* Complete URL and copy */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-amber-300 font-mono text-left truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition"
                title="کۆپیکردنی لینک"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition"
                title="تاقیکردنەوە لە پەنجەرەیەکی نوێ"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
              </a>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-right">
            <p className="text-[11px] text-amber-300 leading-normal">
              💡 <strong>تێبینی گرنگ:</strong> پێویستە تابلێت و لاپتۆپەکە هەردووکیان لەسەر یەک وایفای (Wi-Fi یان ڕۆتەری هۆڵەکە) بەستراو بن تا سیستەمەکە ڕاستەوخۆ پەیوەست بێت.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
            >
              داخستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
