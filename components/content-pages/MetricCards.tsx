import type { MetricCard } from "@/types/content-pages";

interface MetricCardsProps {
  metrics: MetricCard[];
}

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <article
          key={`${metric.label}-${metric.value}`}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9f9f9f]">{metric.label}</p>
          <p className="mt-3 text-2xl font-black text-white sm:text-3xl">{metric.value}</p>
          {metric.note ? <p className="mt-2 text-sm text-[#b8b8b8]">{metric.note}</p> : null}
        </article>
      ))}
    </div>
  );
}
