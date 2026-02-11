"use client";

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Star, Phone } from 'lucide-react';
import Link from 'next/link';

const ADVANTAGES = [
    { icon: '⭐', label: 'Экономия от', value: '— 10-15% стоимости авто' },
    { icon: '⭐', label: 'Доставка от', value: '— 60 рабочих дней' },
    { icon: '⭐', label: 'Экспертиза', value: '— 14 лет на рынке' },
    { icon: '⭐', label: 'Репутация', value: '— 1500 отзывов' },
];

export function Hero() {
    return (
        <section className="relative bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left — Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
                            АВТО ИЗ-ЗА РУБЕЖА
                        </h1>

                        <p className="text-lg md:text-xl text-gray-600 mb-4 leading-relaxed">
                            Хотите выгодно купить автомобиль из Китая, Европы или США
                            с доставкой в Беларусь?{' '}
                            <span className="text-orange-600 font-bold">HIGHWAY MOTORS</span> поможет!
                        </p>

                        {/* Advantages */}
                        <div className="space-y-3 mb-8">
                            {ADVANTAGES.map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <span className="text-orange-500 text-lg">{item.icon}</span>
                                    <span className="font-bold text-gray-900">{item.label}</span>
                                    <span className="text-gray-600">{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Expert consultation block */}
                        <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Консультация эксперта</h3>
                            <p className="text-gray-600 text-sm mb-0">
                                Перезвоним за 1 минуту и расскажем о выгодных авто.
                                Подберём лучшие варианты под ваш бюджет.
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                            <Link
                                href="#calculator"
                                className="group px-8 py-4 bg-orange-600 text-white rounded-lg font-bold overflow-hidden transition-all hover:bg-orange-500 active:scale-95 shadow-lg shadow-orange-600/20 uppercase tracking-wide"
                            >
                                <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                                    РАССЧИТАТЬ СТОИМОСТЬ <ArrowRight size={20} />
                                </span>
                            </Link>
                            <Link
                                href="/catalog"
                                className="px-8 py-4 bg-transparent border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:border-orange-600 hover:text-orange-600 transition-all flex items-center gap-2"
                            >
                                ВЫБРАТЬ АВТО <ChevronRight className="opacity-50" />
                            </Link>
                        </div>

                        {/* Social icons */}
                        <div className="flex items-center gap-4 mt-6">
                            <span className="text-sm text-gray-500">Пишите нам:</span>
                            <a href="https://wa.me/375447772224" target="_blank" className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                                <Phone size={16} />
                            </a>
                            <a href="https://t.me/highwaymotors" target="_blank" className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                            </a>
                            <a href="https://wa.me/375447772224" target="_blank" className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </a>
                        </div>
                    </motion.div>

                    {/* Right — Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                            <img
                                src="/images/hero-car.jpg"
                                alt="Авто под заказ - подбор и доставка"
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        parent.innerHTML = '<div class="aspect-[16/10] bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center"><div class="text-center text-white"><h2 class="text-4xl font-black mb-2">АВТО ПОД ЗАКАЗ</h2><p class="text-xl font-bold opacity-80">ПОДБОР И ДОСТАВКА</p></div></div>';
                                    }
                                }}
                            />
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}