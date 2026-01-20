import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { MARQUEE_TEXT_1, MARQUEE_TEXT_2 } from '../constants';

export const Hero: React.FC = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-matteBlack pt-20">

            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px]" />

            {/* Diagonal Marquees - Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden flex flex-col justify-center items-center">
                <div className="transform -rotate-6 scale-110 w-[120%] bg-zinc-900/50 border-y border-white/5 py-4 backdrop-blur-sm mb-12">
                    <motion.div
                        className="whitespace-nowrap flex gap-4 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-600 uppercase"
                        animate={{ x: [0, -1000] }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    >
                        {Array(4).fill(MARQUEE_TEXT_1).map((text, i) => (
                            <span key={i}>{text}</span>
                        ))}
                    </motion.div>
                </div>
                <div className="transform -rotate-6 scale-110 w-[120%] bg-zinc-900/50 border-y border-white/5 py-4 backdrop-blur-sm">
                    <motion.div
                        className="whitespace-nowrap flex gap-4 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-600 uppercase"
                        animate={{ x: [-1000, 0] }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    >
                        {Array(4).fill(MARQUEE_TEXT_2).map((text, i) => (
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
                        <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">СИСТЕМА АКТИВНА • LIVE DATA</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-600">
                        ХАЙВЕЙ МОТОРС
                    </h1>

                    <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
                        Безопасный импорт авто. <br />
                        <span className="text-white font-medium">Цена фиксирована в договоре</span> и не меняется в процессе доставки.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="#contact" className="group relative px-8 py-4 bg-white text-black rounded-lg font-bold overflow-hidden">
                            <div className="absolute inset-0 w-full h-full bg-zinc-200 transform translate-y-full transition-transform group-hover:translate-y-0" />
                            <span className="relative flex items-center gap-2 group-hover:gap-4 transition-all">
                                ОБСУДИТЬ ПРОЕКТ <ArrowRight size={20} />
                            </span>
                        </a>
                        <a href="#process" className="group px-8 py-4 bg-transparent border border-white/20 text-white rounded-lg font-bold hover:bg-white/5 transition-all flex items-center gap-2">
                            КАК ЭТО РАБОТАЕТ <ChevronRight className="opacity-50 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-[10px] uppercase tracking-[0.2em]">Листайте</span>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-zinc-500 to-transparent" />
            </motion.div>

        </section>
    );
};