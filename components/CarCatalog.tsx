"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cars_db } from "@/data/cars_db";

type MarketFilter = "All" | "USA" | "Korea" | "China" | "Europe";
type SortMode = "price_asc" | "popular" | "newest";
type EngineFilter = "All" | "EV" | "EREV" | "HEV" | "ICE";

interface CarCatalogProps {
  initialMarket?: string;
}

function normalizeMarket(value?: string): MarketFilter {
  const v = value?.toLowerCase();
  if (v === "usa") return "USA";
  if (v === "korea") return "Korea";
  if (v === "china") return "China";
  if (v === "europe") return "Europe";
  return "All";
}

function toNumber(input: string): number | null {
  if (!input.trim()) return null;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function marketBadge(market: string) {
  if (market === "USA") return "bg-red-500/20 text-red-300 border-red-500/30";
  if (market === "Korea") return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
  if (market === "China") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  if (market === "Europe") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  return "bg-zinc-600/20 text-zinc-300 border-zinc-500/30";
}

function formatPrice(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toLocaleString("ru-RU");
}

function engineLabel(value: EngineFilter) {
  if (value === "EV") return "Электро";
  if (value === "EREV") return "EREV";
  if (value === "HEV") return "HEV/PHEV";
  if (value === "ICE") return "ДВС";
  return "Любой";
}

export function CarCatalog({ initialMarket }: CarCatalogProps) {
  const [market, setMarket] = useState<MarketFilter>(normalizeMarket(initialMarket));
  const [brand, setBrand] = useState("All");
  const [bodyType, setBodyType] = useState("All");
  const [engineType, setEngineType] = useState<EngineFilter>("All");
  const [transmission, setTransmission] = useState("All");
  const [drive, setDrive] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [mileageFrom, setMileageFrom] = useState("");
  const [mileageTo, setMileageTo] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("price_asc");

  const marketFiltered = useMemo(() => {
    if (market === "All") return cars_db;
    return cars_db.filter((car) => car.market === market);
  }, [market]);

  const brands = useMemo(() => {
    return ["All", ...new Set(marketFiltered.map((car) => car.brand))].sort((a, b) => a.localeCompare(b));
  }, [marketFiltered]);

  const bodyTypes = useMemo(() => {
    return ["All", ...new Set(marketFiltered.map((car) => car.body_type).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [marketFiltered]);

  const transmissions = useMemo(() => {
    return ["All", ...new Set(marketFiltered.map((car) => car.transmission).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [marketFiltered]);

  const drives = useMemo(() => {
    return ["All", ...new Set(marketFiltered.map((car) => car.drive).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [marketFiltered]);

  const engines = useMemo(() => {
    const order: EngineFilter[] = ["All", "EV", "EREV", "HEV", "ICE"];
    return order.filter((engine) => engine === "All" || marketFiltered.some((car) => car.type === engine));
  }, [marketFiltered]);

  const filteredCars = useMemo(() => {
    const yFrom = toNumber(yearFrom);
    const yTo = toNumber(yearTo);
    const pFrom = toNumber(priceFrom);
    const pTo = toNumber(priceTo);
    const mFrom = toNumber(mileageFrom);
    const mTo = toNumber(mileageTo);

    const cars = marketFiltered.filter((car) => {
      if (brand !== "All" && car.brand !== brand) return false;
      if (bodyType !== "All" && car.body_type !== bodyType) return false;
      if (engineType !== "All" && car.type !== engineType) return false;
      if (transmission !== "All" && car.transmission !== transmission) return false;
      if (drive !== "All" && car.drive !== drive) return false;
      if (yFrom !== null && car.year < yFrom) return false;
      if (yTo !== null && car.year > yTo) return false;
      if (pFrom !== null && car.price_value < pFrom) return false;
      if (pTo !== null && car.price_value > pTo) return false;

      const mileageValue = typeof car.mileage_km === "number" ? car.mileage_km : 0;
      if (mFrom !== null) {
        if (mileageValue < mFrom) return false;
      }
      if (mTo !== null) {
        if (mileageValue > mTo) return false;
      }

      return true;
    });

    if (sortMode === "price_asc") {
      cars.sort((a, b) => a.price_value - b.price_value);
    } else if (sortMode === "newest") {
      cars.sort((a, b) => b.year - a.year);
    } else {
      cars.sort((a, b) => {
        const aStock = a.availability === "InStock" ? 1 : 0;
        const bStock = b.availability === "InStock" ? 1 : 0;
        return bStock - aStock || b.year - a.year;
      });
    }

    return cars;
  }, [bodyType, brand, drive, engineType, marketFiltered, mileageFrom, mileageTo, priceFrom, priceTo, sortMode, transmission, yearFrom, yearTo]);

  const resetFilters = () => {
    setBrand("All");
    setBodyType("All");
    setEngineType("All");
    setTransmission("All");
    setDrive("All");
    setYearFrom("");
    setYearTo("");
    setPriceFrom("");
    setPriceTo("");
    setMileageFrom("");
    setMileageTo("");
    setSortMode("price_asc");
  };

  const marketTabs: Array<{ id: MarketFilter; label: string; dot: string }> = [
    { id: "All", label: "Все", dot: "bg-blue-500" },
    { id: "USA", label: "США", dot: "bg-red-500" },
    { id: "Korea", label: "Корея", dot: "bg-cyan-500" },
    { id: "China", label: "Китай", dot: "bg-amber-500" },
    { id: "Europe", label: "Европа", dot: "bg-emerald-500" },
  ];

  return (
    <section
      id="catalog"
      className="min-h-screen bg-[radial-gradient(circle_at_top,#0e1422_0%,#060910_45%,#04060c_100%)] py-8 text-white"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {marketTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setMarket(tab.id);
                  setBrand("All");
                  setBodyType("All");
                  setEngineType("All");
                  setTransmission("All");
                  setDrive("All");
                }}
                className={`flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                  market === tab.id
                    ? "border-[#3a445d] bg-[linear-gradient(180deg,#202838_0%,#191f2d_100%)] text-white"
                    : "border-[#242c3f] bg-[linear-gradient(180deg,#151b29_0%,#111725_100%)] text-[#8f97ab] hover:text-white"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${tab.dot}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[#1b2232] bg-[linear-gradient(180deg,#0d1220_0%,#0a101c_100%)] p-3">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[#8f97ab]">
              <div className="flex items-center gap-2">
                <Search size={13} />
                Марки
              </div>
              <span className="tracking-normal text-[#6f778c]">Все марки</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map((item) => (
                <button
                  key={item}
                  onClick={() => setBrand(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase transition ${
                    brand === item
                      ? "border-[#404b67] bg-[#2b3448] text-white"
                      : "border-[#2a3244] bg-[#151c2b] text-[#b5bccd] hover:text-white"
                  }`}
                >
                  {item === "All" ? "Все" : item}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#1b2232] bg-[linear-gradient(180deg,#0d1220_0%,#0a101c_100%)] p-3 md:p-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#8f97ab]">
              <SlidersHorizontal size={13} />
              Фильтры
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[#7f889f]">Тип кузова</label>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  className="w-full rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white outline-none"
                >
                  {bodyTypes.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "Любой" : item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[#7f889f]">Двигатель</label>
                <select
                  value={engineType}
                  onChange={(e) => setEngineType(e.target.value as EngineFilter)}
                  className="w-full rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white outline-none"
                >
                  {engines.map((item) => (
                    <option key={item} value={item}>
                      {engineLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[#7f889f]">Коробка</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white outline-none"
                >
                  {transmissions.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "Любой" : item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[#7f889f]">Привод</label>
                <select
                  value={drive}
                  onChange={(e) => setDrive(e.target.value)}
                  className="w-full rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white outline-none"
                >
                  {drives.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "Любой" : item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[#7f889f]">Год от</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="от"
                    className="rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white placeholder:text-[#7f889f] outline-none"
                  />
                  <input
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="до"
                    className="rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white placeholder:text-[#7f889f] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[#7f889f]">Цена от</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    placeholder="-"
                    className="rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white placeholder:text-[#7f889f] outline-none"
                  />
                  <input
                    value={priceTo}
                    onChange={(e) => setPriceTo(e.target.value)}
                    placeholder="-"
                    className="rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white placeholder:text-[#7f889f] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[#7f889f]">Пробег от</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={mileageFrom}
                    onChange={(e) => setMileageFrom(e.target.value)}
                    placeholder="пробег от"
                    className="rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white placeholder:text-[#7f889f] outline-none"
                  />
                  <input
                    value={mileageTo}
                    onChange={(e) => setMileageTo(e.target.value)}
                    placeholder="до"
                    className="rounded-xl border border-[#242d3f] bg-[#121929] px-3 py-2 text-sm text-white placeholder:text-[#7f889f] outline-none"
                  />
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="mt-6 inline-flex items-center justify-center gap-1 px-2 py-2 text-sm font-semibold uppercase tracking-wide text-[#cfd5e4] transition hover:text-white"
              >
                <X size={14} />
                Сбросить
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#8f97ab]">
              <ArrowUpDown size={13} />
              Сортировка
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortMode("price_asc")}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase transition ${
                  sortMode === "price_asc"
                    ? "border-[#404b67] bg-[#2b3448] text-white"
                    : "border-[#2a3244] bg-[#151c2c] text-[#b5bccd] hover:text-white"
                }`}
              >
                По цене ↑
              </button>
              <button
                onClick={() => setSortMode("popular")}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase transition ${
                  sortMode === "popular"
                    ? "border-[#404b67] bg-[#2b3448] text-white"
                    : "border-[#2a3244] bg-[#151c2c] text-[#b5bccd] hover:text-white"
                }`}
              >
                Популярности
              </button>
              <button
                onClick={() => setSortMode("newest")}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase transition ${
                  sortMode === "newest"
                    ? "border-[#404b67] bg-[#2b3448] text-white"
                    : "border-[#2a3244] bg-[#151c2c] text-[#b5bccd] hover:text-white"
                }`}
              >
                Новизне
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCars.map((car) => (
            <Link
              key={car.id}
              href={`/catalog/${car.id}`}
              className="group overflow-hidden rounded-2xl border border-[#1f2634] bg-[#0b111d] transition hover:border-[#39445c]"
            >
              <div className="relative aspect-[16/10] bg-[#121927]">
                {car.images[0] ? (
                  <img
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-[#8891a7]">Нет фото</div>
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${marketBadge(car.market)}`}>
                    {car.market}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-sm text-[#9ba3b8]">
                      {car.year} • {car.condition === "Used" ? "Б/У" : car.condition === "New" ? "Новый" : "Битый"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#ff6f1d]">${formatPrice(car.price_value)}</div>
                    <div className="text-[10px] uppercase text-[#788198]">{car.price_type}</div>
                  </div>
                </div>

                <button className="w-full rounded-xl border border-[#2a3244] bg-[#151c2c] py-2 text-sm font-semibold text-[#d4d9e4] transition group-hover:border-white/25 group-hover:text-white">
                  Подробнее
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
