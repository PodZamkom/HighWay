"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight, Globe } from 'lucide-react';
import Link from 'next/link';

const MARKETS = [
  {
    id: 'china',
    name: 'КИТАЙ',
    description: 'Li Auto, Zeekr, BYD. Прямые поставки с заводов. 0% пошлина на электро.',
    bg: 'bg-red-900/20',
    tags: ['Li Auto', 'Zeekr', 'BYD']
  },
  {
    id: 'usa',
    name: 'США',
    description: 'Страховые аукционы Copart и Manheim. Максимальная выгода для бюджетных авто.',
    bg: 'bg-blue-900/20',
    tags: ['Copart', 'Tesla', 'Ford']
  },
  {
    id: 'korea',
    name: 'КОРЕЯ',
    description: 'Дизельные кроссоверы и седаны (Kia, Hyundai, BMW) в идеальном состоянии.',
    bg: 'bg-indigo-900/20',
    tags: ['Encar', 'Mohave', 'Palisade']
  },
  {
    id: 'europe',
    name: 'ЕВРОПА',
    description: 'Премиум сегмент (BMW, Mercedes, Porsche) и возврат НДС.',
    bg: 'bg-emerald-900/20',
    tags: ['Mobile.de', 'Audi', 'Porsche']
  }
];

export function MarketGrid() {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold mb-12 tracking-tight text-white flex items-center gap-4">
          <Globe className="text-red-500" size={40} /> ГЛОБАЛЬНЫЙ РЫНОК
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MARKETS.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer border border-white/10 h-80 ${market.bg}`}
            >
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