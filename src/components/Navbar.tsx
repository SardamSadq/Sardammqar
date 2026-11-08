import React from 'react';
import {
  Layers,
  ChefHat,
  TrendingUp,
  DollarSign,
  Users,
  Wifi,
  QrCode,
  Tablet,
  Laptop,
  Volume2,
  VolumeX,
  Coffee,
} from 'lucide-react';
import { CafeteriaSettings } from '../types';
import { playOrderSound, playCashSound } from '../services/audio';

export type ActiveTab = 'tables' | 'kitchen' | 'reports' | 'menu' | 'staff' | 'printers';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  settings: CafeteriaSettings;
  onOpenQrModal: () => void;
  onSwitchToWaiterTablet?: () => void;
  onOpenDesktopModal?: () => void;
  pendingKitchenCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  settings,
  onOpenQrModal,
  pendingKitchenCount,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Cafeteria Name */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>{settings.name || 'کافتریا و ڕێستۆرانت'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  لاپتۆپ و کاشێر
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                بەڕێوەبەر: {settings.ownerName || 'خاوەن'}
              </p>
            </div>
          </div>

          {/* Quick Buttons for Mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onOpenQrModal}
              className="p-2 bg-slate-800 text-amber-400 rounded-xl text-xs border border-slate-700"
              title="QR کۆدی تابلێتی گارسۆن"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => onTabChange('tables')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مێزەکان و کاشێر</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('kitchen')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'kitchen'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>بەشەکان (نێرگەلە، ساردی، خواردن)</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>داهاتی ڕۆژ</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('menu')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>مێنوی نرخەکان</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('staff')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>گارسۆنەکان</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('printers')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'printers'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>تۆڕی LAN و پرینتەر</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-slate-800 text-amber-400 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'دەنگ کارایە (داواکاری و پارەدان)' : 'دەنگ ناچالاکە'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* QR Code Modal for Waiter Tablet */}
          <button
            type="button"
            onClick={onOpenQrModal}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            title="سیرڤەری LAN چالاکە - کلیک بکە بۆ نیشاندانی کۆدی QR بۆ تابلێتی گارسۆن"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <QrCode className="w-4 h-4" />
            <span>QR تابلێتی گارسۆن</span>
          </button>
        </div>
      </div>
    </header>
  );
};
