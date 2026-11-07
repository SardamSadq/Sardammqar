import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Tablet, Copy, Check, X, Wifi } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDirectWaiter?: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [lanIp, setLanIp] = useState('192.168.1.100');
  const [port, setPort] = useState('3000');
  const [copied, setCopied] = useState(false);
  const [useCurrentHost, setUseCurrentHost] = useState(true);

  // Generate target URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = `${currentOrigin}?view=waiter`;
  const lanUrl = `http://${lanIp}:${port}?view=waiter`;
  const targetUrl = useCurrentHost ? currentUrl : lanUrl;

  useEffect(() => {
    if (!isOpen) return;

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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tablet className="w-5 h-5 text-amber-200" />
            <h3 className="font-bold text-base">کۆدی QR بۆ تابلێتی گارسۆن</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/20 text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            کامێرای تابلێت یان مۆبایلی گارسۆنەکە بگرە لەم کۆدە بۆ ئەوەی ڕاستەوخۆ سیستەمی تایبەتی داواکارییەکانی بەردەست بێت.
          </p>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto border-4 border-amber-500/20">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Waiter Tablet QR" className="w-52 h-52 mx-auto" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                لە حاڵی دروستکردنی QR دا...
              </div>
            )}
          </div>

          {/* Toggle between Web/LAN URL */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-right space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-emerald-400" />
                شێوازی بەستنەوە:
              </span>
              <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setUseCurrentHost(true)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    useCurrentHost ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  بەستەری ئێستا
                </button>
                <button
                  type="button"
                  onClick={() => setUseCurrentHost(false)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    !useCurrentHost ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  IPی ناوخۆیی LAN
                </button>
              </div>
            </div>

            {!useCurrentHost && (
              <div className="pt-2 border-t border-slate-700/60 flex gap-2">
                <input
                  type="text"
                  value={lanIp}
                  onChange={(e) => setLanIp(e.target.value)}
                  placeholder="192.168.1.XXX"
                  className="w-2/3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="3000"
                  className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono text-left truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                title="کۆپیکردن"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              داخستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
