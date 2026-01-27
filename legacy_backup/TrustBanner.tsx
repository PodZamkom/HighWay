import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileCheck, Lock } from 'lucide-react';

export const TrustBanner: React.FC = () => {
  return (
    <section id="trust" className="py-20 bg-zinc-950 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 md:p-16 text-center shadow-2xl shadow-blue-900/10"
            >
                <div className="inline-flex items-center gap-2 mb-6 text-electricBlue">
                    <Lock size={20} />
                    <span className="text-sm font-bold tracking-widest uppercase">Ironclad Guarantee</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase leading-tight mb-8">
                    Фиксированная цена.<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                        Никаких скрытых комиссий.
                    </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                        <FileCheck className="text-electricBlue w-8 h-8 mb-4" />
                        <h4 className="text-lg font-bold text-white mb-2">Официальный договор</h4>
                        <p className="text-sm text-zinc-400">Юридическая фиксация итоговой стоимости автомобиля в белорусских рублях или валюте.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                        <CheckCircle2 className="text-electricBlue w-8 h-8 mb-4" />
                        <h4 className="text-lg font-bold text-white mb-2">Честная история</h4>
                        <p className="text-sm text-zinc-400">Проверка CarFax, осмотр инспектором в порту отправления, фотоотчет на каждом этапе.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                        <Lock className="text-electricBlue w-8 h-8 mb-4" />
                        <h4 className="text-lg font-bold text-white mb-2">Без доплат</h4>
                        <p className="text-sm text-zinc-400">Таможенные платежи и доставка рассчитываются заранее. Риски берем на себя.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
  );
};