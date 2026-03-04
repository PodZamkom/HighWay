"use client";

import React, { useEffect, useState } from 'react';
import { Send, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type MessengerType = 'telegram' | 'whatsapp';

const DEFAULT_FORM_STATE: {
    name: string;
    phone: string;
    preferredMessenger: MessengerType;
} = {
    name: '',
    phone: '',
    preferredMessenger: 'telegram'
};

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    source?: string;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
    isOpen,
    onClose,
    title = "ОБРАТНЫЙ ЗВОНОК",
    subtitle = "Оставьте заявку. Менеджер свяжется в течение 15 минут.",
    source = 'site_form'
}) => {
    const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSubmitError('');
            setSubmitSuccess('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) {
            return;
        }

        setSubmitError('');
        setSubmitSuccess('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    source,
                    pageUrl: window.location.href
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || 'Не удалось отправить заявку');
            }

            setSubmitSuccess('Спасибо! Заявка отправлена.');
            setFormData(DEFAULT_FORM_STATE);

            window.setTimeout(() => {
                setSubmitSuccess('');
                onClose();
            }, 700);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось отправить заявку';
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
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
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 relative z-10 overflow-hidden shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Ваше имя"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors placeholder:text-gray-400"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="tel"
                                    placeholder="+375 (XX) XXX-XX-XX"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors placeholder:text-gray-400"
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
                                        ? 'bg-blue-50 border-blue-400 text-blue-600'
                                        : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'
                                        }`}
                                >
                                    <Send size={16} /> Telegram
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, preferredMessenger: 'whatsapp' })}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.preferredMessenger === 'whatsapp'
                                        ? 'bg-green-50 border-green-400 text-green-600'
                                        : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'
                                        }`}
                                >
                                    <Smartphone size={16} /> WhatsApp
                                </button>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-500 transition-colors mt-4 shadow-lg shadow-orange-600/20 uppercase"
                            >
                                {isSubmitting ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
                            </motion.button>

                            {submitError ? (
                                <p className="text-sm text-red-600 text-center">{submitError}</p>
                            ) : null}

                            {submitSuccess ? (
                                <p className="text-sm text-green-600 text-center">{submitSuccess}</p>
                            ) : null}
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
