import React, { useState } from 'react';
import { Staff } from '../types';
import { Lock, UserCheck, ShieldCheck, Delete, ArrowRight, Coffee, Tablet, RotateCcw } from 'lucide-react';
import { playClickSound, playAlertSound } from '../services/audio';

interface PinLoginModalProps {
  isOpen: boolean;
  mode: 'cashier' | 'waiter';
  staffList: Staff[];
  cafeteriaName: string;
  onLogin: (staff: Staff) => void;
  onCancel?: () => void;
  onResetToSetup?: () => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  mode,
  staffList,
  cafeteriaName,
  onLogin,
  onCancel,
  onResetToSetup,
}) => {
  // Filter staff based on mode
  const eligibleStaff = staffList.filter((s) => {
    if (!s.active) return false;
    if (mode === 'cashier') {
      return s.role === 'cashier' || s.role === 'manager';
    } else {
      return s.role === 'waiter' || s.role === 'cashier' || s.role === 'manager';
    }
  });

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(
    eligibleStaff[0] || null
  );
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    playClickSound();
    setErrorMsg(null);
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);

      // Auto-validate if 4 digits entered and matches
      if (selectedStaff && nextPin.length === selectedStaff.pin.length) {
        if (nextPin === selectedStaff.pin) {
          onLogin(selectedStaff);
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    playClickSound();
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    playClickSound();
    setPin('');
    setErrorMsg(null);
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStaff) {
      setErrorMsg('تکایە کارمەندێک هەڵبژێرە');
      playAlertSound();
      return;
    }

    if (pin === selectedStaff.pin) {
      playClickSound();
      onLogin(selectedStaff);
      setPin('');
      setErrorMsg(null);
    } else {
      playAlertSound();
      setErrorMsg('پاسۆردەکە هەڵەیە! تکایە دووبارەی بکەرەوە.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg mb-3">
            {mode === 'cashier' ? <Lock className="w-7 h-7" /> : <Tablet className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-black text-white">
            {mode === 'cashier' ? 'چوونەژوورەوەی کاشێر' : 'چوونەژوورەوەی گارسۆن'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {cafeteriaName || 'سیستەمی کافتریا'} • تکایە پاسۆرد (PIN)ی تایبەتی خۆت داخل بکە
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Staff selection pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block text-right">
              {mode === 'cashier' ? 'کاشێری سەرکار هەڵبژێرە:' : 'ناوی گارسۆنەکەت هەڵبژێرە:'}
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {eligibleStaff.map((staff) => {
                const isSelected = selectedStaff?.id === staff.id;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedStaff(staff);
                      setPin('');
                      setErrorMsg(null);
                    }}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div className="truncate text-xs">
                      <div className="truncate font-semibold">{staff.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {staff.role === 'cashier'
                          ? 'کاشێر'
                          : staff.role === 'manager'
                          ? 'بەڕێوەبەر'
                          : 'گارسۆن'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Display Indicators */}
          <div className="space-y-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-500/50'
                        : 'border-2 border-slate-700 bg-slate-900'
                    }`}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <p className="text-rose-400 text-xs font-bold text-center animate-shake">
                {errorMsg}
              </p>
            )}

            {/* Quick default PIN hint for seamless first-run */}
            <p className="text-[11px] text-slate-500 text-center">
              پاسۆردی پێشوەختە: کاشێر (0000) • گارسۆن ١ (1111) • گارسۆن ٢ (2222)
            </p>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-12 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg rounded-2xl border border-slate-700/60 shadow-sm transition flex items-center justify-center"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-400 font-bold text-xs rounded-2xl border border-slate-800 transition flex items-center justify-center"
            >
              پاککردنەوە
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg rounded-2xl border border-slate-700/60 shadow-sm transition flex items-center justify-center"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-12 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-400 font-bold rounded-2xl border border-slate-800 transition flex items-center justify-center"
              title="سڕینەوە"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Default PIN Hint */}
          <div className="text-[11px] text-slate-500 text-center select-none">
            {mode === 'cashier'
              ? 'پاسۆردی بنەڕەتی کاشێر: 0000'
              : 'پاسۆردی بنەڕەتی گارسۆن: 1111 یان 2222'}
          </div>

          {/* Confirm Button */}
          <div className="pt-1 flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                پاشگەزبوونەوە
              </button>
            )}
            <button
              type="button"
              onClick={() => handleVerify()}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.99] text-slate-950 font-black rounded-xl text-sm shadow-xl transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>چوونەژوورەوە</span>
            </button>
          </div>

          {/* Reset to Setup / Reactivate for Laptop */}
          {onResetToSetup && mode === 'cashier' && (
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'ئایا دڵنیایت دەتەوێت داتاکانی ئەم لاپتۆپە سفر بکەیتەوە و بچیتەوە سەر لاپەڕەی کاراکردن و ئەکتیڤکردنی نوێ؟'
                    )
                  ) {
                    onResetToSetup();
                  }
                }}
                className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center justify-center gap-1.5 mx-auto font-medium transition py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>کاراکردن لەسەر لاپتۆپێکی نوێ یان ریستکردنەوە بۆ لاپەڕەی ئەکتیڤکردن</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
