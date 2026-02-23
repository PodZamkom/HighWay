"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight, Globe } from 'lucide-react';
import Link from 'next/link';
import type { MarketSection } from '@/types/site';

interface MarketGridProps {
  content: MarketSection;
}

const MARKET_COLORS: Record<string, string> = {
  china: 'border-t-red-500',
  usa: 'border-t-blue-500',
  korea: 'border-t-indigo-500',
  europe: 'border-t-emerald-500',
};

export function MarketGrid({ content }: MarketGridProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 tracking-tight text-gray-900 flex items-center gap-4">
          <Globe className="text-orange-600" size={36} /> {content.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.markets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <Link
                href={`/catalog?market=${market.id}`}
                className={`group block bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(255,102,0,0.15)] hover:border-orange-200 transition-all duration-300 hover:-translate-y-1.5`}
              >
                {/* Image */}
                <div className="aspect-[16/10] relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    style={{ backgroundImage: `url(${market.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-xs font-bold px-2 py-1 bg-white/90 rounded text-gray-800">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <ArrowUpRight className="text-white/70 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-black text-gray-900 mb-2 uppercase">{market.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                    {market.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {market.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase border border-gray-300 px-2 py-1 rounded text-gray-500 group-hover:text-orange-600 group-hover:border-orange-300 transition-colors">
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
