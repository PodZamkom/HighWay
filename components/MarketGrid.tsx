import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { MARKETS } from '../constants';

export const MarketGrid: React.FC = () => {
  return (
    <section id="catalog" className="py-24 bg-matteBlack">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white">
                    ГЛОБАЛЬНЫЙ РЫНОК
                </h2>
                <p className="text-zinc-400 max-w-md">
                    Прямой доступ к лучшим аукционам и дилерским площадкам мира. 
                    Никаких посредников.
                </p>
            </div>
            <div className="text-right hidden md:block">
               <div className="text-4xl font-mono text-zinc-700">2026</div>
               <div className="text-xs text-zinc-500 uppercase tracking-widest">Глобальная логистическая сеть</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto md:h-[600px]">
          {MARKETS.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 h-80 md:h-full"
            >
              {/* Image Background */}
              <div className="absolute inset-0">
                <img 
                    src={market.imageUrl} 
                    alt={market.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/10 text-white">
                        {`0${index + 1}`}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                        <ArrowUpRight className="text-white w-5 h-5" />
                    </div>
                </div>

                <div>
                    <h3 className="text-3xl font-bold text-white mb-2">{market.name}</h3>
                    <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-300">
                        <p className="text-sm text-zinc-300 mb-4 opacity-0 group-hover:opacity-100 transition-opacity delay-100 duration-300">
                            {market.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {market.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase border border-white/20 px-2 py-1 rounded text-zinc-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};