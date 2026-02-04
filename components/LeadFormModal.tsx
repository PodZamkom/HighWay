"use client";

import React, { useState } from 'react';
import { Send, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
    isOpen,
    onClose,
    title = "ОБРАТНЫЙ ЗВОНОК",
    subtitle = "Оставьте заявку. Менеджер свяжется в течение 15 минут."
}) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        preferredMessenger: 'telegram'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Спасибо! Ваша заявка принята. (Демо-режим)');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 relative z-10 overflow-hidden shadow-2xl"
                    >
                        {/* Gloss Effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                            <p className="text-sm text-zinc-400">{subtitle}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Ваше имя"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="tel"
                                    placeholder="+375 (XX) XXX-XX-XX"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, preferredMessenger: 'telegram' })}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.preferredMessenger === 'telegram'
                                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                                            : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/30'
                                        }`}
                                >
                                    <Send size={16} /> Telegram
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, preferredMessenger: 'whatsapp' })}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.preferredMessenger === 'whatsapp'
                                            ? 'bg-green-500/10 border-green-500/50 text-green-400'
                                            : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/30'
                                        }`}
                                >
                                    <Smartphone size={16} /> WhatsApp
                                </button>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-500 transition-colors mt-4 shadow-lg shadow-red-600/20"
                            >
                                ОТПРАВИТЬ
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
