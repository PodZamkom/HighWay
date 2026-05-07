"use client";

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Phone, X } from 'lucide-react';
import { TelegramIcon, WhatsAppIcon } from '@/components/icons/SocialIcons';
import { motion, AnimatePresence } from 'framer-motion';

type ContactMethod = 'telegram' | 'whatsapp' | 'phone';

const DEFAULT_FORM_STATE: {
    name: string;
    phone: string;
    preferredMessenger: ContactMethod;
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
    const closeTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isOpen && closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        if (!isOpen) {
            setSubmitError('');
            setSubmitSuccess('');
            setIsSubmitting(false);
            setFormData(DEFAULT_FORM_STATE);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

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

            setSubmitSuccess('Спасибо, что оставили заявку');
            setFormData(DEFAULT_FORM_STATE);

            closeTimeoutRef.current = window.setTimeout(() => {
                setSubmitSuccess('');
                closeTimeoutRef.current = null;
                onClose();
            }, 1800);
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

                        <AnimatePresence mode="wait">
                            {submitSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    className="py-10 text-center"
                                >
                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600 shadow-lg shadow-orange-500/10">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h2 className="mb-3 text-3xl font-bold uppercase tracking-[0.08em] text-gray-900">
                                        Спасибо
                                    </h2>
                                    <p className="mx-auto max-w-sm text-base leading-6 text-gray-600">
                                        {submitSuccess}. Менеджер свяжется с вами в ближайшее время.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                >
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

                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600">Выберите предпочитаемый способ связи</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, preferredMessenger: 'telegram' })}
                                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.preferredMessenger === 'telegram'
                                                    ? 'bg-blue-50 border-blue-400 text-blue-600'
                                                    : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'
                                                    }`}
                                            >
                                                <TelegramIcon size={16} /> Telegram
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, preferredMessenger: 'whatsapp' })}
                                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.preferredMessenger === 'whatsapp'
                                                    ? 'bg-green-50 border-green-400 text-green-600'
                                                    : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'
                                                    }`}
                                            >
                                                <WhatsAppIcon size={16} /> WhatsApp
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, preferredMessenger: 'phone' })}
                                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.preferredMessenger === 'phone'
                                                    ? 'bg-zinc-100 border-zinc-500 text-zinc-700'
                                                    : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'
                                                    }`}
                                            >
                                                <Phone size={16} /> Телефон
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
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
