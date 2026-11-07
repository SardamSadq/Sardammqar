import React, { useState } from 'react';
import { Staff } from '../types';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Phone,
  KeyRound,
  CheckCircle,
} from 'lucide-react';
import { playClickSound } from '../services/audio';

interface StaffManagerProps {
  staffList: Staff[];
  onSaveStaffList: (staff: Staff[]) => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  staffList,
  onSaveStaffList,
}) => {
  const [list, setList] = useState<Staff[]>(staffList);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<Staff['role']>('waiter');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('1234');

  const handleOpenAdd = () => {
    playClickSound();
    setName('');
    setRole('waiter');
    setPhone('');
    setPin('1234');
    setEditingStaff(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (st: Staff) => {
    playClickSound();
    setEditingStaff(st);
    setName(st.name);
    setRole(st.role);
    setPhone(st.phone);
    setPin(st.pin);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStaff) {
      const updated = list.map((s) =>
        s.id === editingStaff.id
          ? { ...s, name: name.trim(), role, phone: phone.trim(), pin: pin.trim() }
          : s
      );
      setList(updated);
      onSaveStaffList(updated);
    } else {
      const newStaff: Staff = {
        id: `st_${Date.now()}`,
        name: name.trim(),
        role,
        phone: phone.trim(),
        pin: pin.trim() || '0000',
        active: true,
        ordersCount: 0,
        totalSales: 0,
      };
      const updated = [...list, newStaff];
      setList(updated);
      onSaveStaffList(updated);
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, staffName: string) => {
    if (confirm(`ئایا دڵنیایت لە سڕینەوەی کارمەند "${staffName}"؟`)) {
      const updated = list.filter((s) => s.id !== id);
      setList(updated);
      onSaveStaffList(updated);
    }
  };

  const getRoleBadge = (r: Staff['role']) => {
    switch (r) {
      case 'waiter':
        return <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] font-bold">گارسۆن</span>;
      case 'cashier':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">کاشێر</span>;
      case 'manager':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold">بەڕێوەبەر</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">چێشتخانە</span>;
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            بەڕێوەبردنی گارسۆنەکان و کارمەندان
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ناوی گارسۆنەکان دیاری بکە، زیادیان بکە یان کەمیان بکە تا لەسەر تابلێت و لاپتۆپ بەردەست بن.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          زیادکردنی کارمەندی نوێ
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {list.map((st) => (
          <div
            key={st.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-sm border border-slate-700">
                  {st.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{st.name}</h4>
                  <div className="mt-1">{getRoleBadge(st.role)}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(st)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(st.id, st.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              {st.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{st.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 font-mono">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>کۆدی PIN: {st.pin}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm flex items-center justify-between">
              <span>{editingStaff ? 'دەستکاری کارمەند' : 'زیادکردنی گارسۆن / کارمەند'}</span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="hover:bg-black/20 p-1 rounded text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  ناوی گارسۆن یان کارمەند:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نموونە: ئارام ئەحمەد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  ڕۆڵ / پلە:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Staff['role'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="waiter">گارسۆن (تۆمارکردنی داواکاری لە تابلێت)</option>
                  <option value="cashier">کاشێر (وەرگرتنی پارە و پرینت)</option>
                  <option value="hookah_master">مامۆستای نێرگەلە</option>
                  <option value="chef">چێشتلێنەر / ستافی خواردن</option>
                  <option value="manager">بەڕێوەبەر</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  ژمارەی مۆبایل:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0750XXXXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  کۆدی PIN بۆ چوونەژوورەوە:
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs shadow transition"
                >
                  پاشەکەوتکردن
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
