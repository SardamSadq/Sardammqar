import React, { useState } from 'react';
import {
  Laptop,
  Download,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  FileCode,
  HardDrive,
  RefreshCw,
  X,
} from 'lucide-react';
import { playClickSound } from '../services/audio';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
  onResetData,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const electronPackageScript = `
# هەنگاوەکانی دروستکردنی فایلی ئینستالی .exe لەسەر لاپتۆپ یان GitHub:
1. کۆدەکە داببەزێنە لە GitHub
2. فەرمانی دامەزراندنی پاکێجەکان لێبدە:
   npm install
   npm install --save-dev electron electron-builder

3. دروستکردنی فایلی ئینستالی لاپتۆپ (Windows .exe):
   npm run build
   npx electron-builder --win nsis
  `.trim();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(electronPackageScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleExportBackup = () => {
    playClickSound();
    const backupData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cafeteria_pos_')) {
        backupData[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafeteria_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-amber-200" />
            <h3 className="font-bold text-base">دابەزاندن وەکو ئەپ (EXE) و هەناردەکردنی داتا</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/20 text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-right">
          {/* Option 1: Instant PWA Desktop Install */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>ڕێگای خێرا: دامەزراندن ڕاستەوخۆ وەکو بەرنامە لەسەر لاپتۆپ (PWA Desktop App)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              لە وێبگەڕی کۆمپیوتەرەکەت (Chrome یان Edge)، کلیک لەسەر ئایکۆنی کۆمپیوتەر یان «Install App» بکە لە بەشی سەرەوەی ناونیشان (Address Bar)؛ سیستەمەکە ڕاستەوخۆ دەبێتە بەرنامەیەکی سەربەخۆ لەسەر شاشەی کۆمپیوتەر و Taskbar بە بێ پێویستی بە وێبگەڕ.
            </p>
          </div>

          {/* Option 2: Build Windows .EXE via GitHub / Electron */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Terminal className="w-4 h-4" />
                <span>دروستکردنی فایلی ئینستالی EXE بە تەواوی بۆ ویندۆز</span>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>کۆپیکردنی فەرمانەکان</span>
              </button>
            </div>
            <pre className="bg-slate-900 p-3 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto text-left border border-slate-800 whitespace-pre-wrap">
              {electronPackageScript}
            </pre>
          </div>

          {/* Data Backup & Restore */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              هەڵگرتنی داتای کافتریا (Backup) و گواستنەوە بۆ لاپتۆپێکی تر
            </h4>
            <p className="text-xs text-slate-400">
              دەتوانی لەم دوگمەیە فایلێکی باکەپ دەربهێنیت تا زانیاری مێزەکان، مینو و داهاتەکان بە سەلامەتی بمێننەوە.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                داگرتنی باکەپی داتا (JSON Backup)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('ئایا دڵنیایت لە ڕیسێتکردنی سیستەم و کردنەوەی دووبارەی فۆرمی ئینستالکردن؟')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-4 h-4" />
                سڕینەوەی داتا و دەستپێکردنەوە لە سفر
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
