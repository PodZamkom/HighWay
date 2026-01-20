import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Edit2, Trash2, Camera, Clipboard,
    Save, AlertCircle, CheckCircle2, ChevronDown,
    ChevronUp, Tag as TagIcon, LayoutGrid, List,
    Image as ImageIcon, X
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
    description: string;
    variants: CarVariant[];
}

// --- Mock Initial Data (will be replaced by API) ---

const INITIAL_DATA: CarFamily[] = [
    {
        id: "li-l6-family",
        brand: "Li Auto",
        model: "L6",
        image: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Li_Auto_L6_001.jpg",
        description: "Ideal family SUV. EREV (Hybrid).",
        variants: [
            {
                id: "l6-pro-2024",
                name: "L6 Pro (2024)",
                specs: "No Lidar, CDC Suspension",
                condition: "Used (<10k km)",
                price_usd: 38500,
                tags: ["Bestseller"]
            }
        ]
    }
];

// --- Utility: Generate ID ---
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function AdminCatalog() {
    const [families, setFamilies] = useState<CarFamily[]>([]);
    const [editingFamily, setEditingFamily] = useState<CarFamily | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

    // Initialize data
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch('/api/cars');
                const data = await res.json();
                setFamilies(data);
            } catch (err) {
                console.error('Failed to load cars:', err);
                setFamilies(INITIAL_DATA); // Fallback
            }
        };
        loadData();
    }, []);

    // --- Handlers ---

    const handleSaveAll = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            const res = await fetch('/api/cars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(families)
            });
            if (res.ok) {
                setStatus({ type: 'success', message: 'Данные успешно сохранены!' });
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Ошибка при сохранении данных.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const addFamily = () => {
        const newFamily: CarFamily = {
            id: generateId(),
            brand: "New Brand",
            model: "New Model",
            image: "",
            description: "",
            variants: []
        };
        setFamilies([newFamily, ...families]);
        setEditingFamily(newFamily);
    };

    const deleteFamily = (id: string) => {
        if (window.confirm('Удалить всю модельную линейку?')) {
            setFamilies(families.filter(f => f.id !== id));
        }
    };

    const updateFamily = (updated: CarFamily) => {
        setFamilies(families.map(f => f.id === updated.id ? updated : f));
    };

    // --- Image Handling ---

    const handlePasteImage = async (e: React.ClipboardEvent, id: string, type: 'family' | 'variant', variantId?: string) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        // Update UI immediately (in real app, upload to server)
                        if (type === 'family') {
                            const family = families.find(f => f.id === id);
                            if (family) updateFamily({ ...family, image: base64 });
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-matteBlack text-zinc-100 p-6 pt-24">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white">УПРАВЛЕНИЕ КАТАЛОГОМ</h1>
                        <p className="text-zinc-500 mt-2">Внутренняя панель добавления и редактирования машин</p>
                    </div>
                    <div className="flex gap-4">
                        <a
                            href="/api/cars"
                            target="_blank"
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg border border-white/5 flex items-center gap-2 transition-all"
                        >
                            <LayoutGrid size={14} className="text-electricBlue" />
                            JSON ДЛЯ ИИ
                        </a>
                        <button
                            onClick={addFamily}
                            className="px-6 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} />
                            ДОБАВИТЬ МОДЕЛЬ
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className={`px-6 py-2 bg-electricBlue text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 shadow-[0_0_20px_rgba(0,163,255,0.3)]'
                                }`}
                        >
                            <Save size={16} />
                            {isSaving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ВСЁ'}
                        </button>
                    </div>
                </div>

                {/* Status Notification */}
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}
                        >
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-medium">{status.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Catalog List */}
                <div className="space-y-6">
                    {families.map((family) => (
                        <FamilyItem
                            key={family.id}
                            family={family}
                            isExpanded={expandedFamily === family.id}
                            onToggle={() => setExpandedFamily(expandedFamily === family.id ? null : family.id)}
                            onUpdate={updateFamily}
                            onDelete={() => deleteFamily(family.id)}
                            onPaste={(e) => handlePasteImage(e, family.id, 'family')}
                        />
                    ))}
                    {families.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                            <ImageIcon size={48} className="mx-auto text-zinc-800 mb-4" />
                            <p className="text-zinc-500">Каталог пуст. Добавьте первую модель.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Sub-Components ---

function FamilyItem({ family, isExpanded, onToggle, onUpdate, onDelete, onPaste }: {
    family: CarFamily,
    isExpanded: boolean,
    onToggle: () => void,
    onUpdate: (f: CarFamily) => void,
    onDelete: () => void,
    onPaste: (e: React.ClipboardEvent) => void,
    key?: string | number
}) {
    const [localFamily, setLocalFamily] = useState(family);

    useEffect(() => { setLocalFamily(family); }, [family]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updated = { ...localFamily, [name]: value };
        setLocalFamily(updated);
        onUpdate(updated);
    };

    const addVariant = () => {
        const newVariant: CarVariant = {
            id: generateId(),
            name: "New Trim",
            specs: "",
            condition: "New",
            price_usd: 0,
            tags: []
        };
        const updated = { ...localFamily, variants: [newVariant, ...localFamily.variants] };
        setLocalFamily(updated);
        onUpdate(updated);
    };

    const updateVariant = (v: CarVariant) => {
        const updated = {
            ...localFamily,
            variants: localFamily.variants.map(varItem => varItem.id === v.id ? v : varItem)
        };
        onUpdate(updated);
    };

    const deleteVariant = (vId: string) => {
        const updated = { ...localFamily, variants: localFamily.variants.filter(v => v.id !== vId) };
        onUpdate(updated);
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all hover:bg-zinc-900/80">
            {/* Family Header */}
            <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Image Preview / Paste Target */}
                <div
                    className="w-full md:w-56 h-40 bg-black rounded-2xl flex-shrink-0 relative group cursor-pointer border border-white/5 overflow-hidden"
                    onPaste={onPaste}
                    tabIndex={0}
                >
                    {localFamily.image ? (
                        <img src={localFamily.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                            <Camera size={32} className="mb-2" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-center px-4">Вставьте фото из буфера</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Clipboard size={16} className="text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">Ctrl+V</span>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Бренд</label>
                            <input
                                name="brand" value={localFamily.brand} onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-electricBlue outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Модель</label>
                            <input
                                name="model" value={localFamily.model} onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-electricBlue outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-4 flex flex-col">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Описание</label>
                            <textarea
                                name="description" value={localFamily.description} onChange={handleChange}
                                className="w-full h-[98px] bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-electricBlue outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 justify-end">
                    <button
                        onClick={onToggle}
                        className={`p-3 rounded-xl border transition-all ${isExpanded ? 'bg-electricBlue border-electricBlue text-white' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                            }`}
                    >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Variants Section (CRUD) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Комплектации / Модификации ({localFamily.variants.length})</h4>
                                <button
                                    onClick={addVariant}
                                    className="flex items-center gap-2 text-[10px] font-bold text-electricBlue hover:text-white transition-colors"
                                >
                                    <Plus size={14} /> ДОБАВИТЬ МОДИФИКАЦИЮ
                                </button>
                            </div>

                            <div className="space-y-4">
                                {localFamily.variants.map((variant) => (
                                    <VariantItem
                                        key={variant.id}
                                        variant={variant}
                                        onUpdate={updateVariant}
                                        onDelete={() => deleteVariant(variant.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function VariantItem({ variant, onUpdate, onDelete }: {
    variant: CarVariant,
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr,1fr,0.8fr,1.2fr,40px] gap-3 items-center bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all">
            <input
                name="name" value={variant.name} onChange={handleChange} placeholder="Название (Pro, Max...)"
                className="bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-white outline-none focus:border-electricBlue"
            />
            <input
                name="specs" value={variant.specs} onChange={handleChange} placeholder="Характеристики (Lidar, AWD...)"
                className="bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-white outline-none focus:border-electricBlue"
            />
            <input
                name="condition" value={variant.condition} onChange={handleChange} placeholder="Состояние (New, Used...)"
                className="bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-white outline-none focus:border-electricBlue"
            />
            <input
                name="price_usd" type="number" value={variant.price_usd} onChange={handleChange} placeholder="Цена $"
                className="bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-white outline-none focus:border-electricBlue"
            />
            <div className="relative">
                <TagIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                    value={variant.tags.join(', ')} onChange={handleTags} placeholder="Теги (через запятую)"
                    className="w-full bg-black/40 border border-white/5 rounded-lg p-2 pl-8 text-xs text-white outline-none focus:border-electricBlue"
                />
            </div>
            <button onClick={onDelete} className="text-zinc-700 hover:text-red-400 transition-colors p-1">
                <X size={18} />
            </button>
        </div>
    );
}
