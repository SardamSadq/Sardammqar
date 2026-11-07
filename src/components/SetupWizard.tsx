import React, { useState } from 'react';
import { Coffee, ShieldCheck, Send, CheckCircle2, AlertCircle, Building2, User, Phone, MapPin, Layers } from 'lucide-react';
import { CafeteriaSettings } from '../types';
import { requestActivationViaTelegram, generateActivationCode, generateMachineId } from '../services/telegram';
import { saveSettings, getTables, saveTables } from '../services/storage';

interface SetupWizardProps {
  initialSettings: CafeteriaSettings;
  onComplete: (settings: CafeteriaSettings) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ initialSettings, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [name, setName] = useState(initialSettings.name || '');
  const [ownerName, setOwnerName] = useState(initialSettings.ownerName || '');
  const [phone, setPhone] = useState(initialSettings.phone || '');
  const [address, setAddress] = useState(initialSettings.address || '');
  const [currency, setCurrency] = useState(initialSettings.currency || 'د.ع');
  const [receiptFooter, setReceiptFooter] = useState(
    initialSettings.receiptFooter || 'سوپاس بۆ سەردانەکەتان - بە هیوای کاتێکی خۆش'
  );
  const [totalTables, setTotalTables] = useState(initialSettings.totalTables || 16);
  const [halls, setHalls] = useState<string[]>(initialSettings.halls || ['هۆڵی سەرەکی', 'باخچەی دەرەوە', 'بەشی VIP']);
  const [newHallName, setNewHallName] = useState('');

  // Machine ID & Telegram Licensing
  const [machineId] = useState<string>(() => generateMachineId());
  const [telegramToken] = useState(
    initialSettings.telegramBotToken || '9055134076:AAFE3xXoberJrA6aywsUdOOQVIjN_Wkqom8'
  );
  const [telegramChatId] = useState(
    initialSettings.telegramChatId || '8234511712'
  );
  const [secretCode, setSecretCode] = useState(() => generateActivationCode(machineId));
  const [inputCode, setInputCode] = useState('');
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [validationError, setValidationError] = useState('');

  const handleStep1Next = () => {
    if (!name.trim()) {
      setValidationError('تکایە ناوی کافتریا یان ڕێستۆرانت بنووسە');
      return;
    }
    if (!ownerName.trim()) {
      setValidationError('تکایە ناوی بەڕێوەبەر یان خاوەن بنووسە (بۆ دەرکەوتن لە خوارەوەی پسولە)');
      return;
    }
    if (!phone.trim()) {
      setValidationError('تکایە ژمارەی مۆبایل بنووسە');
      return;
    }
    setValidationError('');
    setStep(2);
  };

  const handleAddHall = () => {
    if (newHallName.trim() && !halls.includes(newHallName.trim())) {
      setHalls([...halls, newHallName.trim()]);
      setNewHallName('');
    }
  };

  const handleRemoveHall = (hallToRemove: string) => {
    if (halls.length > 1) {
      setHalls(halls.filter((h) => h !== hallToRemove));
    }
  };

  const handleStep2Next = () => {
    setValidationError('');
    setStep(3);
  };

  const handleSendTelegramCode = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus(null);
    setValidationError('');
    const code = generateActivationCode(machineId);
    setSecretCode(code);

    const result = await requestActivationViaTelegram(
      telegramToken,
      telegramChatId,
      name,
      ownerName,
      phone,
      machineId,
      code
    );

    setIsSendingTelegram(false);
    if (result.success) {
      setTelegramStatus({
        success: true,
        message: 'داواکاری کاراکردن بە سەرکەوتوویی بۆ تێلەگرامی خاوەنی پڕۆژە نێردرا! کۆدەکەت لەو وەربگرە.',
      });
    } else {
      setTelegramStatus({
        success: false,
        message: result.error || 'نەتوانرا پەیوەندی بە تێلەگرامەوە بکرێت، تکایە ئینتەرنێتەکەت بپشکنە',
      });
    }
  };

  const handleFinalActivation = () => {
    // Only secretCode sent to owner or master override
    if (
      inputCode.trim() !== secretCode &&
      inputCode.trim() !== '823451' &&
      inputCode.trim() !== '905513'
    ) {
      setValidationError('کۆدی کاراکردن هەڵەیە! ئەم لاپتۆپە کارا ناکرێت تا کۆدی دروست لە خاوەنی پڕۆژە وەرنەگریت');
      return;
    }

    const finalSettings: CafeteriaSettings = {
      isConfigured: true,
      name: name.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency,
      receiptFooter: receiptFooter.trim(),
      serviceChargePercent: 0,
      totalTables: Number(totalTables) || 12,
      halls,
      telegramBotToken: telegramToken.trim(),
      telegramChatId: telegramChatId.trim(),
      isActivated: true,
      activationCode: inputCode.trim(),
      activatedAt: new Date().toISOString(),
    };

    saveSettings(finalSettings);
    // Initialize tables
    const tables = getTables(finalSettings.totalTables, finalSettings.halls);
    saveTables(tables);

    onComplete(finalSettings);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/20 backdrop-blur mb-3">
            <Coffee className="w-9 h-9 text-amber-200" />
          </div>
          <h1 className="text-2xl font-bold">دامەزراندنی سیستەمی کافتریا و ڕێستۆرانت</h1>
          <p className="text-sm text-amber-100 mt-1">
            سیستەمی پێشکەوتووی کاشێر، مێزەکان، تابلێتی گارسۆن، و بەشەکانی نێرگەلە و چێشتخانە
          </p>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${step >= 1 ? 'bg-white text-slate-900' : 'bg-black/30 text-white/70'}`}>
              <span>١. زانیاری گشتی</span>
            </div>
            <div className="w-6 h-0.5 bg-white/40" />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${step >= 2 ? 'bg-white text-slate-900' : 'bg-black/30 text-white/70'}`}>
              <span>٢. مێزەکان و هۆڵ</span>
            </div>
            <div className="w-6 h-0.5 bg-white/40" />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${step === 3 ? 'bg-white text-slate-900' : 'bg-black/30 text-white/70'}`}>
              <span>٣. ئەکتیڤکردنی تێلەگرام</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6">
          {validationError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: General Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 text-xs text-slate-300">
                سیستەمەکە بە خاوێنی دامەزراوە. تکایە زانیارییەکانی کافتریاکەت بنووسە. ئەم زانیارییانە ڕاستەوخۆ لەسەر پسولەی پرینت کراو لە خوارەوە دەردەکەون.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  ناوی کافتریا / ڕێستۆرانت *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نموونە: کافێ لاونج ڕۆیاڵ"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    ناوی خاوەن / بەڕێوەبەر *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="نموونە: سەردەم سادق"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-amber-500" />
                    ژمارەی پەیوەندی *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0750XXXXXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    ناونیشان / شوێن
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="نموونە: هەولێر - شەقامی ١٠٠ مەتری"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    دراوی حیسابات
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="د.ع">دیناری عێراقی (د.ع)</option>
                    <option value="$">دۆلار ($ USD)</option>
                    <option value="تۆمەن">تۆمەن (IRR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  تێکستی خوارەوەی پسولە (دەقی سوپاسگوزاری و زانیاری)
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="سوپاس بۆ سەردانەکەتان - بە هیوای کاتێکی خۆش"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition"
              >
                هەنگاوی دووەم: دیاریکردنی مێزەکان ←
              </button>
            </div>
          )}

          {/* STEP 2: Tables & Halls */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  ژمارەی کۆی گشتی مێزەکان لە هۆڵەکەدا
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalTables}
                    onChange={(e) => setTotalTables(Number(e.target.value))}
                    className="w-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                  <span className="text-xs text-slate-400">
                    مێز لە سیستەمەکە دروست دەکرێت (دەتوانی لە لاپتۆپ زیادی بکەیت یان کەمی بکەیت).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  بەشەکان و هۆڵەکان
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {halls.map((hall) => (
                    <span
                      key={hall}
                      className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-amber-300"
                    >
                      {hall}
                      {halls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHall(hall)}
                          className="hover:text-rose-400 text-slate-500 font-bold"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHallName}
                    onChange={(e) => setNewHallName(e.target.value)}
                    placeholder="زیادکردنی هۆڵی نوێ (وەک: بەشی خێزانی، باڵکۆن)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddHall}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700"
                  >
                    زیادکردن
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm"
                >
                  گەڕانەوە
                </button>
                <button
                  type="button"
                  onClick={handleStep2Next}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition"
                >
                  هەنگاوی سێیەم: کاراکردنی بۆتی تێلەگرام ←
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Telegram Activation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200/90 leading-relaxed space-y-2">
                <span className="font-bold block text-sm text-amber-400">
                  🔐 کاراکردنی فەرمی و مۆڵەتی سیستەم (Activation License)
                </span>
                <p>
                  بۆ پاراستنی بەرنامەکە، کۆدی کاراکردن بە هیچ شێوەیەک لەسەر ئەم شاشەیە دەرناکەوێت و تەنها دەنێردرێت بۆ تێلەگرامی خاوەنی پڕۆژە. تکایە دوگمەی خوارەوە دابگرە تا داواکاری بنێرێت، پاشان پەیوەندی بە خاوەنی سیستەم بکە تا کۆدی تایبەتت پێ بدات.
                </p>
                <p className="text-[11px] text-amber-300 font-semibold">
                  * کاتێک کۆدەکە داخڵ کرا، بۆ هەمیشە لەسەر ئەم لاپتۆپە چالاک دەبێت و هەرگیز داوای کۆد ناکاتەوە.
                </p>
              </div>

              {/* Machine ID box */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ئایدی تایبەتی ئەم لاپتۆپە (Machine ID):</span>
                  <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    {machineId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                  <span className="text-slate-500">کافتریا: {name}</span>
                  <span className="text-slate-500">خاوەن: {ownerName} ({phone})</span>
                </div>
              </div>

              {/* Send to Telegram Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isSendingTelegram}
                  onClick={handleSendTelegramCode}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send className="w-4 h-4" />
                  {isSendingTelegram ? 'لە حاڵی ناردنی داواکاریدایە...' : 'ناردنی داواکاری کاراکردن بۆ تێلەگرامی خاوەن'}
                </button>
              </div>

              {telegramStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                    telegramStatus.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {telegramStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                  )}
                  <span>{telegramStatus.message}</span>
                </div>
              )}

              {/* Activation Code Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  کۆدی کاراکردن (Activation Code) داخڵ بکە کە لە خاوەنی پڕۆژەت وەرگرتووە:
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="کۆدی ٦ ژمارەیی لێرە بنووسە"
                  maxLength={12}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-center font-mono text-2xl tracking-widest text-amber-400 focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm"
                >
                  گەڕانەوە
                </button>
                <button
                  type="button"
                  onClick={handleFinalActivation}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  کاراکردن و دەستپێکردنی سیستەم
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
