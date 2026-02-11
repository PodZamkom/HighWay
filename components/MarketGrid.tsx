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
    <section className="bg-white py-24 dark:bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="mb-12 flex items-center gap-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
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
              className={`group relative h-80 cursor-pointer overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 ${market.bgClass}`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                style={{ backgroundImage: `url(${market.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/80 dark:from-black/10 dark:via-black/40 dark:to-black/80" />
              <Link href={`/catalog?market=${market.id}`} className="absolute inset-0 flex flex-col justify-between p-6 transition-colors hover:bg-black/5 dark:hover:bg-white/5">

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
                      <span key={tag} className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase text-zinc-300 transition-colors group-hover:text-white">
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
