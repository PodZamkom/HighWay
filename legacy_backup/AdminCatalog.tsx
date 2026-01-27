import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Edit2, Trash2, Camera, Clipboard,
    Save, AlertCircle, CheckCircle2, ChevronRight,
    Tag as TagIcon, LayoutGrid, Copy,
    Image as ImageIcon, X, Box, Search, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---

interface CarVariant {
    id: string;
    name: string;
    specs: string;
    condition: string;
    price_usd: number;
    tags: string[];
}

interface CarFamily {
    id: string;
    brand: string;
    model: string;
    image: string;
    start_price: number;
    description: string;
    variants: CarVariant[];
}

// --- Utility: Generate ID ---
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function AdminCatalog() {
    const [families, setFamilies] = useState<CarFamily[]>([]);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch('/api/cars');
                const data = await res.json();
                setFamilies(data);
                if (data.length > 0) setSelectedFamilyId(data[0].id);
            } catch (err) {
                console.error('Failed to load cars:', err);
            }
        };
        loadData();
    }, []);

    // --- Handlers ---

    const handleSaveAll = async (dataToSave = families) => {
        setIsSaving(true);
        setStatus(null);
        try {
            const res = await fetch('/api/cars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            if (res.ok) {
                setStatus({ type: 'success', message: 'База данных успешно обновлена' });
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Ошибка сохранения на сервере' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const copyApiLink = () => {
        const url = `${window.location.origin}/api/cars`;
        navigator.clipboard.writeText(url);
        setStatus({ type: 'success', message: 'Ссылка скопирована в буфер!' });
        setTimeout(() => setStatus(null), 2000);
    };

    const addFamily = () => {
        const newFamily: CarFamily = {
            id: generateId(),
            brand: "New Brand",
            model: "New Model",
            image: "",
            start_price: 0,
            description: "",
            variants: []
        };
        const updated = [newFamily, ...families];
        setFamilies(updated);
        setSelectedFamilyId(newFamily.id);
    };

    const deleteFamily = (id: string) => {
        if (window.confirm('Удалить эту модель и все её комплектации?')) {
            const updated = families.filter(f => f.id !== id);
            setFamilies(updated);
            if (selectedFamilyId === id) {
                setSelectedFamilyId(updated.length > 0 ? updated[0].id : null);
            }
            handleSaveAll(updated);
        }
    };

    const updateFamily = (updated: CarFamily) => {
        setFamilies(prev => prev.map(f => f.id === updated.id ? updated : f));
    };

    const selectedFamily = families.find(f => f.id === selectedFamilyId);

    // Group by Brand for sidebar
    const brands = Array.from(new Set(families.map(f => f.brand))).sort();

    const filteredFamilies = families.filter(f =>
        f.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.model.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex bg-matteBlack text-zinc-100 h-screen overflow-hidden">

            {/* Sidebar: Tree Structure */}
            <aside className="w-80 border-r border-white/5 bg-zinc-950/50 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-electricBlue rounded-lg flex items-center justify-center">
                            <Box size={18} className="text-white" />
                        </div>
                        <h1 className="font-black text-sm tracking-widest uppercase">Database</h1>
                    </div>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:border-electricBlue outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {brands.map(brand => {
                        const BrandModels = filteredFamilies.filter(f => f.brand === brand);
                        if (BrandModels.length === 0) return null;

                        return (
                            <div key={brand} className="mb-4">
                                <div className="flex items-center gap-2 px-2 mb-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                    <LayoutGrid size={10} />
                                    {brand}
                                </div>
                                <div className="space-y-1">
                                    {BrandModels.map(family => (
                                        <button
                                            key={family.id}
                                            onClick={() => setSelectedFamilyId(family.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${selectedFamilyId === family.id
                                                ? 'bg-electricBlue text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <span>{family.model}</span>
                                            <ChevronRight size={14} className={`transition-transform ${selectedFamilyId === family.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={addFamily}
                        className="w-full flex items-center gap-2 px-3 py-3 mt-4 border border-dashed border-white/10 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                    >
                        <Plus size={14} /> НОВАЯ МОДЕЛЬ
                    </button>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20">
                    <button
                        onClick={copyApiLink}
                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5"
                    >
                        <Copy size={12} /> КОПИРОВАТЬ API JSON
                    </button>
                </div>
            </aside>

            {/* Main Content: Graphical Editor */}
            <main className="flex-1 overflow-y-auto bg-matteBlack flex flex-col relative">

                {/* Top Header */}
                <div className="sticky top-0 z-10 p-6 bg-matteBlack/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {selectedFamily && (
                            <>
                                <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                                    {selectedFamily.brand} <span className="text-electricBlue">{selectedFamily.model}</span>
                                </h2>
                                <div className="h-4 w-px bg-white/10" />
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                    {selectedFamily.variants.length} КОМПЛЕКТАЦИЙ
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSaveAll()}
                            className={`px-8 py-3 bg-white text-black text-xs font-black rounded-xl transition-all flex items-center gap-2 ${isSaving ? 'opacity-50' : 'hover:bg-zinc-200 active:scale-95 shadow-xl'
                                }`}
                        >
                            <Save size={16} /> {isSaving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-10 max-w-5xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        {selectedFamily ? (
                            <motion.div
                                key={selectedFamily.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-12"
                            >
                                {/* Visual Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-2">Превью модели</label>
                                        <ImageUploader
                                            currentImage={selectedFamily.image}
                                            onImageChange={(img) => updateFamily({ ...selectedFamily, image: img })}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-2">Бренд</label>
                                                <input
                                                    value={selectedFamily.brand}
                                                    onChange={e => updateFamily({ ...selectedFamily, brand: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white focus:border-electricBlue transition-all outline-none text-sm font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-2">Модель</label>
                                                <input
                                                    value={selectedFamily.model}
                                                    onChange={e => updateFamily({ ...selectedFamily, model: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white focus:border-electricBlue transition-all outline-none text-sm font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-2">Минимальная цена $ (для поиска)</label>
                                            <input
                                                type="number"
                                                value={selectedFamily.start_price}
                                                onChange={e => updateFamily({ ...selectedFamily, start_price: Number(e.target.value) })}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white focus:border-electricBlue transition-all outline-none text-sm font-bold font-mono"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-2">Описание</label>
                                            <textarea
                                                value={selectedFamily.description}
                                                onChange={e => updateFamily({ ...selectedFamily, description: e.target.value })}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white focus:border-electricBlue transition-all outline-none text-sm leading-relaxed h-32 resize-none"
                                                placeholder="Краткое описание преимуществ модели..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Variants Editor */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-4 px-2">
                                        <h3 className="text-xl font-black uppercase tracking-tighter">Комплектации</h3>
                                        <button
                                            onClick={() => {
                                                const v = { id: generateId(), name: "New Trim", specs: "", condition: "New", price_usd: 0, tags: [] };
                                                updateFamily({ ...selectedFamily, variants: [...selectedFamily.variants, v] });
                                            }}
                                            className="text-xs font-bold text-electricBlue hover:text-white flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={14} /> ДОБАВИТЬ ВЕРСИЮ
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {selectedFamily.variants.map((variant, idx) => (
                                            <VariantRow
                                                key={variant.id}
                                                variant={variant}
                                                idx={idx}
                                                onUpdate={(v) => {
                                                    const updatedVariants = selectedFamily.variants.map(varItem => varItem.id === v.id ? v : varItem);
                                                    updateFamily({ ...selectedFamily, variants: updatedVariants });
                                                }}
                                                onDelete={() => {
                                                    const updatedVariants = selectedFamily.variants.filter(varItem => varItem.id !== variant.id);
                                                    updateFamily({ ...selectedFamily, variants: updatedVariants });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-20 flex justify-center opacity-20 hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => deleteFamily(selectedFamily.id)}
                                        className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} /> УДАЛИТЬ ВСЮ МОДЕЛЬНУЮ ЛИНЕЙКУ
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-40">
                                <Box size={48} className="text-zinc-800 mb-6" />
                                <h2 className="text-xl font-bold text-zinc-500 uppercase tracking-widest mb-2">Выберите модель из списка</h2>
                                <p className="text-zinc-600 text-sm">Или добавьте новую для начала работы</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Global Notifications */}
                <div className="fixed bottom-6 right-6 z-50">
                    <AnimatePresence>
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`p-4 rounded-xl border-l-4 shadow-2xl flex items-center gap-3 min-w-[300px] ${status.type === 'success'
                                    ? 'bg-zinc-900 border-green-500 text-white'
                                    : 'bg-zinc-900 border-red-500 text-white'
                                    }`}
                            >
                                {status.type === 'success' ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
                                <p className="text-xs font-bold uppercase tracking-widest">{status.message}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// --- Internal Components ---

function ImageUploader({ currentImage, onImageChange }: { currentImage: string, onImageChange: (img: string) => void }) {
    const onPaste = useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => onImageChange(event.target?.result as string);
                    reader.readAsDataURL(blob);
                }
            }
        }
    }, [onImageChange]);

    return (
        <div
            onPaste={onPaste}
            tabIndex={0}
            className="w-full aspect-video bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden relative group cursor-pointer focus:border-electricBlue outline-none transition-all shadow-2xl"
        >
            {currentImage ? (
                <img src={currentImage} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                    <ImageIcon size={40} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Paste from clipboard</span>
                </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                <div className="bg-white/10 p-3 rounded-full border border-white/10">
                    <Clipboard size={24} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Ctrl + V to Update</span>
            </div>
        </div>
    );
}

function VariantRow({ variant, idx, onUpdate, onDelete }: {
    variant: CarVariant,
    idx: number,
    onUpdate: (v: CarVariant) => void,
    onDelete: () => void,
    key?: string | number
}) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdate({ ...variant, [name]: name === 'price_usd' ? Number(value) : value });
    };

    const handleTags = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...variant, tags: e.target.value.split(',').map(s => s.trim()).filter(s => s) });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl hover:bg-zinc-900/40 transition-all flex flex-col gap-4 shadow-sm group"
        >
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mb-1.5 block">Название модификации</label>
                    <input
                        name="name" value={variant.name} onChange={handleChange} placeholder="например: L6 Pro (2024)"
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-electricBlue transition-all"
                    />
                </div>
                <div className="w-32">
                    <label className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mb-1.5 block">Цена $</label>
                    <input
                        name="price_usd" type="number" value={variant.price_usd} onChange={handleChange}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-electricBlue transition-all font-mono"
                    />
                </div>
                <div className="pt-6 flex items-center">
                    <button onClick={onDelete} className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mb-1.5 block">Характеристики / Опции</label>
                    <input
                        name="specs" value={variant.specs} onChange={handleChange} placeholder="Lidar, AWD, HUD..."
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-zinc-400 outline-none focus:border-electricBlue transition-all"
                    />
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mb-1.5 block">Теги (выделение ИИ)</label>
                    <div className="relative">
                        <TagIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input
                            value={variant.tags.join(', ')} onChange={handleTags} placeholder="Bestseller, 0% Tax, Hybrid..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pl-9 text-[10px] text-zinc-400 outline-none focus:border-electricBlue transition-all"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
