import Link from "next/link";
import type { MarketSection } from "@/types/site";
import { ArrowUpRight } from "lucide-react";

interface HomeCatalogBlocksProps {
  content: MarketSection;
}

export function HomeCatalogBlocks({ content }: HomeCatalogBlocksProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Каталог по рынкам
            </p>
            <h2 className="mt-2 text-3xl font-black text-zinc-900 dark:text-white md:text-4xl">
              Выберите направление
            </h2>
          </div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Открыть весь каталог
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {content.markets.map((market) => (
            <Link
              key={market.id}
              href={`/catalog?market=${market.id}`}
              className="group rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/20 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/25"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="rounded-md bg-black/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                  Рынок
                </span>
                <ArrowUpRight className="text-zinc-400 transition group-hover:text-zinc-800 dark:group-hover:text-white" size={16} />
              </div>
              <h3 className="text-xl font-bold uppercase text-zinc-900 dark:text-white">{market.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{market.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
