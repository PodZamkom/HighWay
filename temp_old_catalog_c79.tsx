import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Car, Zap, AlertTriangle, Check, Tag } from 'lucide-react';
import { carDatabase, CarFamily, CarVariant, getPriceRange } from '../data/cars';

// Tag color mapping
const tagColors: Record<string, string> = {
    'Bestseller': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Value': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Tech Choice': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'New': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    'Budget King': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Power': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Fresh': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Long Range': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(price);
}

interface VariantCardProps {
    variant: CarVariant;
    isSelected: boolean;
    onSelect: () => void;
}

function VariantCard({ variant, isSelected, onSelect }: VariantCardProps) {
    return (
        <motion.button
            onClick={onSelect}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${isSelected
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center"
                            >
                                <Check className="w-3 h-3 text-black" />
                            </motion.div>
                        )}
                        <h4 className="font-semibold text-white">{variant.name}</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{variant.specs}</p>
                    <p className="text-xs text-gray-500">{variant.condition}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {variant.tags.map((tag) => (
                            <span
                                key={tag}
                                className={`px-2 py-0.5 text-xs rounded-full border ${tagColors[tag] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xl font-bold text-white">
                        {formatPrice(variant.price_usd)}
                    </span>
                </div>
            </div>
        </motion.button>
    );
}

interface ConfigModalProps {
    family: CarFamily;
    onClose: () => void;
}

function ConfigModal({ family, onClose }: ConfigModalProps) {
    const [selectedVariant, setSelectedVariant] = useState<CarVariant>(family.variants[0]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative h-64 overflow-hidden">
                    <img
                        src={family.image}
                        alt={`${family.brand} ${family.model}`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="absolute bottom-4 left-6">
                        <p className="text-cyan-400 text-sm font-medium mb-1">{family.brand}</p>
                        <h2 className="text-3xl font-bold text-white">{family.model}</h2>
                        <p className="text-gray-400 mt-1">{family.description}</p>
                    </div>
                </div>

                {/* Tax Warning Banner */}
                <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-400 font-medium text-sm">╨ж╨╡╨╜╤Л ╨▓╨║╨╗╤О╤З╨░╤О╤В ╨╜╨░╨╗╨╛╨│╨╕ 2025 (╨Э╨Ф╨б)</p>
                        <p className="text-amber-400/70 text-xs mt-0.5">
                            ╨б╤В╨╛╨╕╨╝╨╛╤Б╤В╤М ╨│╨╕╨▒╤А╨╕╨┤╨╛╨▓ (EREV) ╨▓╤Л╤А╨╛╤Б╨╗╨░ ╨╜╨░ 25-30% ╨╕╨╖-╨╖╨░ ╨╜╨╛╨▓╤Л╤Е ╨░╨║╤Ж╨╕╨╖╨╛╨▓
                        </p>
                    </div>
                </div>

                {/* Variants */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-cyan-400" />
                        ╨Т╤Л╨▒╨╡╤А╨╕╤В╨╡ ╨║╨╛╨╝╨┐╨╗╨╡╨║╤В╨░╤Ж╨╕╤О
                    </h3>

                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {family.variants.map((variant) => (
                            <VariantCard
                                key={variant.id}
                                variant={variant}
                                isSelected={selectedVariant.id === variant.id}
                                onSelect={() => setSelectedVariant(variant)}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer with Selected Price */}
                <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400">╨Т╤Л╨▒╤А╨░╨╜╨╛:</p>
                        <p className="text-white font-medium">{selectedVariant.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-400">╨Ш╤В╨╛╨│╨╛╨▓╨░╤П ╤Ж╨╡╨╜╨░</p>
                            <p className="text-2xl font-bold text-cyan-400">
                                {formatPrice(selectedVariant.price_usd)}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors flex items-center gap-2"
                        >
                            ╨Ю╤Б╤В╨░╨▓╨╕╤В╤М ╨╖╨░╤П╨▓╨║╤Г
                            <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface FamilyCardProps {
    family: CarFamily;
    onConfigure: () => void;
}

function FamilyCard({ family, onConfigure }: FamilyCardProps) {
    const priceRange = getPriceRange(family);
    const variantCount = family.variants.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all duration-300"
        >
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={family.image}
                    alt={`${family.brand} ${family.model}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                {/* Brand Badge */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
                    <span className="text-sm font-medium text-white">{family.brand}</span>
                </div>

                {/* Variants Count */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30">
                    <span className="text-sm font-medium text-cyan-400">{variantCount} ╨▓╨╡╤А╤Б╨╕╨╣</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
                <h3 className="text-2xl font-bold text-white mb-2">{family.model}</h3>
                <p className="text-gray-400 text-sm mb-4">{family.description}</p>

                {/* Price Range */}
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-400 text-sm">╨╛╤В</span>
                    <span className="text-xl font-bold text-white">{formatPrice(priceRange.min)}</span>
                    <span className="text-gray-400 text-sm">╨┤╨╛</span>
                    <span className="text-xl font-bold text-white">{formatPrice(priceRange.max)}</span>
                </div>

                {/* Quick Tags Preview */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {family.variants.slice(0, 3).flatMap(v => v.tags.slice(0, 1)).map((tag, i) => (
                        <span
                            key={`${tag}-${i}`}
                            className={`px-2 py-0.5 text-xs rounded-full border ${tagColors[tag] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Configure Button */}
                <motion.button
                    onClick={onConfigure}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <Car className="w-5 h-5" />
                    ╨Т╤Л╨▒╤А╨░╤В╤М ╨║╨╛╨╝╨┐╨╗╨╡╨║╤В╨░╤Ж╨╕╤О
                </motion.button>
            </div>
        </motion.div>
    );
}

export default function CarCatalog() {
    const [selectedFamily, setSelectedFamily] = useState<CarFamily | null>(null);

    return (
        <section id="catalog" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-cyan-400 font-medium mb-2"
                    >
                        ╨Ъ╨Р╨в╨Р╨Ы╨Ю╨У
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                        ╨Ь╨╛╨┤╨╡╨╗╤М╨╜╤Л╨╣ ╤А╤П╨┤
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 max-w-2xl mx-auto"
                    >
                        ╨Т╤Л╨▒╨╡╤А╨╕╤В╨╡ ╨╝╨╛╨┤╨╡╨╗╤М ╨╕ ╨╜╨░╤Б╤В╤А╨╛╨╣╤В╨╡ ╨║╨╛╨╝╨┐╨╗╨╡╨║╤В╨░╤Ж╨╕╤О ╨┐╨╛╨┤ ╨▓╨░╤И╨╕ ╨┐╨╛╤В╤А╨╡╨▒╨╜╨╛╤Б╤В╨╕.
                        ╨Т╤Б╨╡ ╤Ж╨╡╨╜╤Л ╨░╨║╤В╤Г╨░╨╗╤М╨╜╤Л ╤Б ╤Г╤З╤С╤В╨╛╨╝ ╨╜╨░╨╗╨╛╨│╨╛╨▓ 2025 ╨│╨╛╨┤╨░.
                    </motion.p>
                </div>

                {/* Tax Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <p className="text-amber-400 text-sm">
                        <strong>╨Т╨╜╨╕╨╝╨░╨╜╨╕╨╡:</strong> ╨ж╨╡╨╜╤Л ╨▓╨║╨╗╤О╤З╨░╤О╤В ╨╜╨╛╨▓╤Л╨╡ ╨╜╨░╨╗╨╛╨│╨╕ 2025 (╨Э╨Ф╨б).
                        ╨б╤В╨╛╨╕╨╝╨╛╤Б╤В╤М ╨│╨╕╨▒╤А╨╕╨┤╨╛╨▓ EREV ╨▓╤Л╤А╨╛╤Б╨╗╨░ ╨╜╨░ 25-30% ╨╛╤В╨╜╨╛╤Б╨╕╤В╨╡╨╗╤М╨╜╨╛ 2024 ╨│╨╛╨┤╨░.
                    </p>
                </motion.div>

                {/* Model Family Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {carDatabase.map((family) => (
                        <FamilyCard
                            key={family.id}
                            family={family}
                            onConfigure={() => setSelectedFamily(family)}
                        />
                    ))}
                </div>
            </div>

            {/* Configuration Modal */}
            <AnimatePresence>
                {selectedFamily && (
                    <ConfigModal
                        family={selectedFamily}
                        onClose={() => setSelectedFamily(null)}
                    />
                )}
            </AnimatePresence>

            {/* Custom Scrollbar Styles */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
        </section>
    );
}
