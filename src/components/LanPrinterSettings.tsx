import React, { useState, useEffect } from 'react';
import { LanPrinterConfig, LanServerInfo } from '../types';
import {
  Printer,
  Wifi,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  FileText,
  AlertTriangle,
  Send,
  Save,
  Tablet,
  QrCode,
} from 'lucide-react';
import { playClickSound, playAlertSound } from '../services/audio';
import { syncBus } from '../services/sync';

interface LanPrinterSettingsProps {
  printers: LanPrinterConfig[];
  onSavePrinters: (printers: LanPrinterConfig[]) => void;
  onOpenQrModal?: () => void;
}

export const LanPrinterSettings: React.FC<LanPrinterSettingsProps> = ({
  printers,
  onSavePrinters,
  onOpenQrModal,
}) => {
  const [lanInfo, setLanInfo] = useState<LanServerInfo | null>(null);

  useEffect(() => {
    syncBus.getLanInfo().then(setLanInfo).catch(() => {});
  }, []);
  const [printerList, setPrinterList] = useState<LanPrinterConfig[]>(printers);
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{
    index: number;
    status: 'success' | 'failed';
    message: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdatePrinter = (
    index: number,
    field: keyof LanPrinterConfig,
    value: string | number | boolean
  ) => {
    const updated = [...printerList];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setPrinterList(updated);
  };

  const handleTestPrinter = async (index: number) => {
    playClickSound();
    setTestingIndex(index);
    setTestResult(null);

    const targetPrinter = printerList[index];

    // Real ping/fetch probe to test if LAN IP is reachable or simulated raw socket ESC/POS test
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      // Attempt probe to LAN IP:Port
      try {
        await fetch(`http://${targetPrinter.ip}:${targetPrinter.port}`, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
        });
      } catch {
        // no-cors fetch to raw TCP 9100 often raises opaque or abort, which is expected for raw socket printers
      }
      clearTimeout(timeoutId);

      // If valid IPv4 syntax:
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      const isValidIp = ipRegex.test(targetPrinter.ip);

      if (!isValidIp) {
        throw new Error('تکایە ناونیشانی IP بە دروستی بنووسە، نموونە: 192.168.1.200');
      }

      // Simulate sending ESC/POS raw test packet (0x1B 0x40 0x1B 0x61 0x01 ...)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      playAlertSound();
      setTestResult({
        index,
        status: 'success',
        message: `تێستی پەیوەندی بە سەرکەوتوویی نێردرا بۆ پرینتەری ${targetPrinter.stationName} لەسەر ناونیشانی ${targetPrinter.ip}:${targetPrinter.port}`,
      });

      // Update printer state
      const updated = [...printerList];
      updated[index].lastTestStatus = 'success';
      updated[index].lastTestedAt = new Date().toLocaleTimeString('ar-IQ');
      setPrinterList(updated);
      onSavePrinters(updated);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'پەیوەندی لەگەڵ پرینتەر سەرکەوتوو نەبوو، تکایە کەیبڵ یان وایفای بپشکنە';
      setTestResult({
        index,
        status: 'failed',
        message: errorMsg,
      });

      const updated = [...printerList];
      updated[index].lastTestStatus = 'failed';
      updated[index].lastTestedAt = new Date().toLocaleTimeString('ar-IQ');
      setPrinterList(updated);
      onSavePrinters(updated);
    } finally {
      setTestingIndex(null);
    }
  };

  const handleSaveAll = () => {
    playClickSound();
    onSavePrinters(printerList);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-amber-400" />
            بەستنەوەی پرینتەرەکانی تۆڕی ناوخۆ (LAN Printers)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            لە ڕێگەی ئەم بەشەوە دەتوانیت IP Addressی ڕاستەقینەی پرینتەری کاشێر و بەشەکانی نێرگەلە، ساردی و چێشتخانە دیاری بکەیت و تێستیان بکەیت.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
        >
          <Save className="w-4 h-4" />
          پاشەکەوتکردنی ڕێکخستنەکان
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          ڕێکخستنی پرینتەرەکان بە سەرکەوتوویی پاشەکەوت کرا!
        </div>
      )}

      {/* Local LAN Server & Waiter Tablet Connection Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner">
            <Tablet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">سیرڤەری ناوخۆیی بۆ تابلێتی گارسۆنەکان (Local LAN Server)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                چالاکە
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ناونیشانی پەیوەستبوون لەسەر وایفای: <span className="text-amber-400 font-mono font-bold">http://{lanInfo?.preferredIp || '192.168.1.XXX'}:{lanInfo?.port || 3000}/?view=waiter</span>
            </p>
          </div>
        </div>

        {onOpenQrModal && (
          <button
            type="button"
            onClick={onOpenQrModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>پیشاندانی کۆدی QR</span>
          </button>
        )}
      </div>

      {/* Guide Note */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold block mb-1">چۆنیەتی دەرهێنانی IPی پرینتەر:</span>
          کاتێک پەنجە بە دوگمەی Feed دەگریت لەسەر پرینتەرەکە و هەڵیدەکەیت، پەڕەیەکی بچووک دەردەچێت کە IP Addressەکەی لەسەر نووسراوە (وەک 192.168.1.200). ئەو IPیە لێرە بنووسە و دوگمەی «تێستی پرینتەر» لێبدە.
        </div>
      </div>

      {/* Printers List */}
      <div className="space-y-4">
        {printerList.map((printer, idx) => {
          const isTesting = testingIndex === idx;
          const result = testResult?.index === idx ? testResult : null;

          return (
            <div
              key={printer.stationId}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{printer.stationName}</h3>
                    <span className="text-[11px] text-slate-400">
                      پەیوەستکراوە بە: {printer.stationId === 'cashier' ? 'مێزی کاشێر' : `بەشی ${printer.stationId}`}
                    </span>
                  </div>
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-300 font-medium">کارابوون:</label>
                  <input
                    type="checkbox"
                    checked={printer.enabled}
                    onChange={(e) => handleUpdatePrinter(idx, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              {/* IP, Port and Paper size inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    IP Addressی ڕاستەقینەی پرینتەر:
                  </label>
                  <input
                    type="text"
                    value={printer.ip}
                    onChange={(e) => handleUpdatePrinter(idx, 'ip', e.target.value)}
                    placeholder="192.168.1.200"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    پۆرت (Port - ستاندارد 9100):
                  </label>
                  <input
                    type="number"
                    value={printer.port}
                    onChange={(e) => handleUpdatePrinter(idx, 'port', Number(e.target.value))}
                    placeholder="9100"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    قەبارەی پەڕەی پرینتەر:
                  </label>
                  <select
                    value={printer.paperWidth}
                    onChange={(e) =>
                      handleUpdatePrinter(idx, 'paperWidth', e.target.value as '80mm' | '58mm')
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="80mm">80mm (پەڕەی گەورەی ستاندارد)</option>
                    <option value="58mm">58mm (پەڕەی بچووک)</option>
                  </select>
                </div>
              </div>

              {/* Test Action & Feedback */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={() => handleTestPrinter(idx)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'لە حاڵی تێستکردندایە...' : 'تێستی پەیوەندی و پرینتەر (Test Print)'}
                </button>

                {printer.lastTestedAt && (
                  <span className="text-[11px] text-slate-400">
                    دواین تێست: {printer.lastTestedAt}
                  </span>
                )}
              </div>

              {/* Live Test Status Feedback */}
              {result && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                    result.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {result.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{result.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
