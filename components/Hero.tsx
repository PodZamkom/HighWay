"use client";

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const MARQUEE_TEXT_1 = "ДАННЫЕ АУКЦИОНОВ США В РЕАЛЬНОМ ВРЕМЕНИ • ПРЯМОЙ ДОСТУП К ENCAR КОРЕЯ • ЭКСПОРТ ЭЛЕКТРОКАРОВ ИЗ КИТАЯ • ";

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-100 pt-20 dark:bg-zinc-950">

            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-900/20" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-red-400/10 blur-[120px] dark:bg-red-900/10" />

            {/* Marquee Background */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden opacity-20 dark:opacity-10">
                <div className="mb-24 w-[120%] scale-110 -rotate-6 transform border-y border-black/5 bg-white/50 py-8 backdrop-blur-sm dark:border-white/5 dark:bg-zinc-900/30">
                    <motion.div
                        className="flex whitespace-nowrap gap-8 bg-gradient-to-r from-zinc-500 to-zinc-400 bg-clip-text text-5xl font-black uppercase text-transparent dark:from-zinc-800 dark:to-zinc-700"
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
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-2 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                            СИСТЕМА АКТИВНА • LIVE DATA
                        </span>
                    </div>

                    <h1 className="mb-6 text-5xl font-black tracking-tighter text-zinc-900 dark:text-white md:text-8xl">
                        HIGHWAY<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-600">MOTORS</span>
                    </h1>

                    <p className="mx-auto mb-10 max-w-2xl text-xl font-light leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-2xl">
                        Хватит переплачивать посредникам.<br />
                        <span className="font-medium text-zinc-900 dark:text-white">Честный импорт авто</span> из Китая, Европы и США.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/catalog" className="group relative overflow-hidden rounded-lg bg-zinc-900 px-8 py-4 font-bold text-white transition-transform active:scale-95 dark:bg-white dark:text-black">
                            <span className="relative flex items-center gap-2 group-hover:gap-4 transition-all">
                                ВЫБРАТЬ АВТО <ArrowRight size={20} />
                            </span>
                        </Link>
                        <Link href="#calculator" className="flex items-center gap-2 rounded-lg border border-black/20 bg-transparent px-8 py-4 font-bold text-zinc-900 transition-all hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5">
                            РАССЧИТАТЬ ЦЕНУ <ChevronRight className="opacity-50" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
