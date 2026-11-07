import React, { useState } from 'react';
import { MenuItem, Station, CafeteriaSettings } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  Flame,
  Coffee,
  Utensils,
  ChefHat,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { playClickSound } from '../services/audio';

interface MenuManagerProps {
  menuItems: MenuItem[];
  stations: Station[];
  settings: CafeteriaSettings;
  onSaveMenuItems: (items: MenuItem[]) => void;
}

const PRESET_IMAGES = [
  { label: 'نێرگەلە', url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=300&auto=format&fit=crop&q=80' },
  { label: 'مۆهیتۆ', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80' },
  { label: 'شەربەت', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=80' },
  { label: 'لاتێ', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&auto=format&fit=crop&q=80' },
  { label: 'قاوە', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80' },
  { label: 'چا', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80' },
  { label: 'کێک', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=80' },
  { label: 'بەرگەر', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80' },
  { label: 'پیتزا', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80' },
  { label: 'فینگەر', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&auto=format&fit=crop&q=80' },
];

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  stations,
  settings,
  onSaveMenuItems,
}) => {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    price: 5000,
    category: 'ساردی و شەربەت',
    stationId: 'cold',
    image: '',
    isAvailable: true,
  });

  const categories = Array.from(new Set(items.map((i) => i.category)));

  const handleOpenAdd = () => {
    playClickSound();
    setFormData({
      name: '',
      price: 5000,
      category: categories[0] || 'ساردی و شەربەت',
      stationId: stations[0]?.id || 'cold',
      image: PRESET_IMAGES[0].url,
      isAvailable: true,
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    playClickSound();
    setEditingItem(item);
    setFormData({ ...item });
    setIsAddModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setFormData((prev) => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingItem) {
      // Edit
      const updated = items.map((i) =>
        i.id === editingItem.id ? ({ ...i, ...formData } as MenuItem) : i
      );
      setItems(updated);
      onSaveMenuItems(updated);
    } else {
      // Add
      const newItem: MenuItem = {
        id: `m_${Date.now()}`,
        name: formData.name.trim(),
        price: Number(formData.price) || 0,
        category: formData.category || 'گشتی',
        stationId: formData.stationId || stations[0]?.id || 'cold',
        image: formData.image || '',
        isAvailable: formData.isAvailable ?? true,
      };
      const updated = [newItem, ...items];
      setItems(updated);
      onSaveMenuItems(updated);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`ئایا دڵنیایت لە سڕینەوەی بەرهەمی "${name}"؟`)) {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      onSaveMenuItems(updated);
    }
  };

  const handleToggleAvailability = (id: string) => {
    playClickSound();
    const updated = items.map((i) =>
      i.id === id ? { ...i, isAvailable: !i.isAvailable } : i
    );
    setItems(updated);
    onSaveMenuItems(updated);
  };

  const filteredItems = items.filter((i) => {
    const matchStation = selectedStation === 'all' || i.stationId === selectedStation;
    const matchSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStation && matchSearch;
  });

  const getStationBadge = (stId: string) => {
    const st = stations.find((s) => s.id === stId);
    if (!st) return <span className="text-slate-400">گشتی</span>;
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700">
        {st.id === 'nargile' && <Flame className="w-3 h-3 text-amber-400" />}
        {st.id === 'cold' && <Coffee className="w-3 h-3 text-cyan-400" />}
        {st.id === 'kitchen' && <Utensils className="w-3 h-3 text-emerald-400" />}
        <span>{st.name}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            بەڕێوەبردنی مێنوی خواردن و وێنەی نرخەکان
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            دەستکاری نرخەکان، زیادکردنی وێنە بە فایل یان مۆبایل و دیاریکردنی بەشی پەیوەندیدار.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          زیادکردنی بەرهەمی نوێ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedStation('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedStation === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}
          >
            هەموو بەشەکان ({items.length})
          </button>
          {stations.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStation(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedStation === st.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان لە مینو..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">وێنە</th>
              <th className="p-3.5">ناوی بەرهەم</th>
              <th className="p-3.5">نرخ</th>
              <th className="p-3.5">جۆر / بەش</th>
              <th className="p-3.5">بەشی چێشتخانە (Station)</th>
              <th className="p-3.5">حاڵەت</th>
              <th className="p-3.5 text-center">کردارەکان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-800 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </td>
                <td className="p-3.5 font-bold text-white">
                  <span>{item.name}</span>
                </td>
                <td className="p-3.5 font-mono font-bold text-amber-400">
                  {item.price.toLocaleString()} {settings.currency}
                </td>
                <td className="p-3.5 text-slate-300">{item.category}</td>
                <td className="p-3.5">{getStationBadge(item.stationId)}</td>
                <td className="p-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                      item.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {item.isAvailable ? 'بەردەستە' : 'تەواوبووە'}
                  </button>
                </td>
                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      title="دەستکاری"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-lg transition"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveForm}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm flex items-center justify-between sticky top-0 z-10">
              <span>{editingItem ? 'دەستکاریکردنی بەرهەم و وێنەکەی' : 'زیادکردنی بەرهەمی نوێ'}</span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="hover:bg-black/20 p-1 rounded text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Image Preview & Upload Section */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  وێنەی بەرهەم (بۆ تابلێت و کاشێر):
                </label>

                <div className="flex items-center gap-4">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-amber-500 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-[10px]">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      بێ وێنە
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>دیاریکردنی وێنە لە لاپتۆپ یان مۆبایل</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={formData.image || ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="یان لینکی وێنە (URL) دابنێ..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-amber-500 text-left"
                    />
                  </div>
                </div>

                {/* Preset quick image choices */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1.5">
                    یان یەکێک لەم وێنە ئامادەکراوانە هەڵبژێرە بە یەک کلیک:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, image: preset.url })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border flex items-center gap-1 transition ${
                          formData.image === preset.url
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  ناوی بەرهەم:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="نموونە: شەربەتی هەناری سروشتی"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    نرخ ({settings.currency}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="250"
                    required
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    جۆر (Category):
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="نموونە: شەربەت، نێرگەلە، خواردن"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  بەشی پەیوەندیدار بۆ ئامادەکردن (Kitchen Station):
                </label>
                <select
                  value={formData.stationId || stations[0]?.id}
                  onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  کاتێک گارسۆن داوای دەکات، تیکێت تەنها بۆ پرینتەری ئەم بەشە دەڕوات.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formData.isAvailable ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="availCheck" className="text-xs text-slate-300">
                  ئەم بەرهەمە لە مینو بەردەستە بۆ داواکاری
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs shadow transition"
                >
                  پاشەکەوتکردنی بەرهەم
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
