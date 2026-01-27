"use client";

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';

const MARQUEE_TEXT_1 = "ДАННЫЕ АУКЦИОНОВ США В РЕАЛЬНОМ ВРЕМЕНИ • ПРЯМОЙ ДОСТУП К ENCAR КОРЕЯ • ЭКСПОРТ ЭЛЕКТРОКАРОВ ИЗ КИТАЯ • ";
const MARQUEE_TEXT_2 = "ФИКСИРОВАННАЯ ЦЕНА В ДОГОВОРЕ • БЕЗ СКРЫТЫХ ПЛАТЕЖЕЙ • ПОЛНАЯ СТРАХОВКА ГРУЗА • ";

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-950 pt-20">

            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-[120px]" />

            {/* Marquee Background */}
            <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden flex flex-col justify-center items-center">
                <div className="transform -rotate-6 scale-110 w-[120%] bg-zinc-900/30 border-y border-white/5 py-8 backdrop-blur-sm mb-24">
                    <motion.div
                        className="whitespace-nowrap flex gap-8 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-700 uppercase"
                        animate={{ x: [0, -1000] }}
                        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    >
                        {Array(4).fill(MARQUEE_TEXT_1).map((text, i) => (
                            <span key={i}>{text}</span>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase flex items-center gap-2">
                            СИСТЕМА АКТИВНА • LIVE DATA
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 text-white">
                        HIGHWAY<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-600">MOTORS</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
                        Хватит переплачивать посредникам.<br />
                        <span className="text-white font-medium">Честный импорт авто</span> из Китая, Европы и США.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/catalog" className="group relative px-8 py-4 bg-white text-black rounded-lg font-bold overflow-hidden transition-transform active:scale-95">
                            <span className="relative flex items-center gap-2 group-hover:gap-4 transition-all">
                                ВЫБРАТЬ АВТО <ArrowRight size={20} />
                            </span>
                        </Link>
                        <Link href="#calculator" className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-lg font-bold hover:bg-white/5 transition-all flex items-center gap-2">
                            РАССЧИТАТЬ ЦЕНУ <ChevronRight className="opacity-50" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}