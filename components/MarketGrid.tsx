"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight, Globe } from 'lucide-react';
import Link from 'next/link';
import type { MarketSection } from '@/types/site';

interface MarketGridProps {
  content: MarketSection;
}

export function MarketGrid({ content }: MarketGridProps) {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold mb-12 tracking-tight text-white flex items-center gap-4">
          <Globe className="text-red-500" size={40} /> {content.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.markets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer border border-white/10 h-80 ${market.bgClass}`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                style={{ backgroundImage: `url(${market.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80" />
              <Link href={`/catalog?market=${market.id}`} className="absolute inset-0 p-6 flex flex-col justify-between hover:bg-white/5 transition-colors">

                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-white/70">
                    0{index + 1}
                  </span>
                  <ArrowUpRight className="text-white/50 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase">{market.name}</h3>
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-3">
                    {market.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {market.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase border border-white/10 px-2 py-1 rounded text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
