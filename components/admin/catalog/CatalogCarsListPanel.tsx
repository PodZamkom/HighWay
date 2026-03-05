"use client";

import { Archive, Plus } from "lucide-react";
import type { CatalogCarEntity } from "@/types/catalog";

interface CatalogCarsListPanelProps {
  cars: CatalogCarEntity[];
  loading: boolean;
  selectedCarId: string | null;
  selectedPathLabel: string;
  onSelectCar: (car: CatalogCarEntity) => void;
  onToggleArchive: (car: CatalogCarEntity, archived: boolean) => void;
  onCreateNew: () => void;
}

export function CatalogCarsListPanel({
  cars,
  loading,
  selectedCarId,
  selectedPathLabel,
  onSelectCar,
  onToggleArchive,
  onCreateNew,
}: CatalogCarsListPanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Автомобили</h2>
          <p className="mt-1 text-xs text-zinc-500">{selectedPathLabel}</p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-500"
        >
          <Plus size={12} />
          Новый
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-500">Загрузка списка...</div>
      ) : cars.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-500">В выбранном разделе пока нет автомобилей.</div>
      ) : (
        <div className="max-h-[64vh] space-y-2 overflow-y-auto pr-1">
          {cars.map((car) => {
            const isActive = car.id === selectedCarId;
            return (
              <article
                key={car.id}
                className={`rounded-xl border p-3 transition ${
                  isActive
                    ? "border-orange-500/45 bg-orange-500/10"
                    : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => onSelectCar(car)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-bold text-white">
                      {car.brand} {car.model}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-400">
                      {car.generation || "Без комплектации"} · {car.year}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {car.market} · {car.priceValue.toLocaleString("ru-RU")} {car.priceCurrency}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-zinc-500">{car.slug}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleArchive(car, !Boolean(car.archivedAt))}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                      car.archivedAt ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    <Archive size={12} />
                    {car.archivedAt ? "Восстановить" : "В архив"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
