"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Loader2, Plus, RefreshCw, Save, Upload } from "lucide-react";
import { MediaField } from "@/components/admin/common/MediaField";
import type { CatalogCarEntity, CatalogImportRow } from "@/types/catalog";

type CarFormState = {
  id?: string;
  slug: string;
  brand: string;
  model: string;
  generation: string;
  year: number;
  condition: "New" | "Used" | "Crashed";
  mileageKm: number | null;
  priceValue: number;
  priceCurrency: "USD" | "CNY" | "EUR" | "KRW";
  priceType: "FOB" | "EXW" | "OnRoad" | "Estimate";
  availability: "InStock" | "EnRoute" | "OnOrder";
  market: "China" | "USA" | "Korea" | "Europe";
  type: "EV" | "EREV" | "ICE" | "HEV" | null;
  bodyType: string;
  transmission: string;
  drive: string;
  description: string;
  images: Array<{
    id?: number;
    mediaAssetId?: string | null;
    url: string;
    alt: string;
    sortOrder: number;
    isCover: boolean;
  }>;
};

function defaultFormState(): CarFormState {
  return {
    slug: "",
    brand: "",
    model: "",
    generation: "",
    year: new Date().getFullYear(),
    condition: "Used",
    mileageKm: null,
    priceValue: 0,
    priceCurrency: "USD",
    priceType: "FOB",
    availability: "OnOrder",
    market: "China",
    type: null,
    bodyType: "",
    transmission: "",
    drive: "",
    description: "",
    images: [],
  };
}

function mapCarToForm(car: CatalogCarEntity): CarFormState {
  return {
    id: car.id,
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    generation: car.generation,
    year: car.year,
    condition: car.condition,
    mileageKm: car.mileageKm,
    priceValue: car.priceValue,
    priceCurrency: car.priceCurrency,
    priceType: car.priceType,
    availability: car.availability,
    market: car.market,
    type: car.type,
    bodyType: car.bodyType,
    transmission: car.transmission,
    drive: car.drive,
    description: car.description,
    images: [...car.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image, index) => ({
        id: image.id,
        mediaAssetId: image.mediaAssetId,
        url: image.url,
        alt: image.alt,
        sortOrder: index,
        isCover: image.isCover,
      })),
  };
}

export function AdminCatalogManager() {
  const [cars, setCars] = useState<CatalogCarEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [form, setForm] = useState<CarFormState>(defaultFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState("");

  const [importing, setImporting] = useState(false);
  const [importApplyLoading, setImportApplyLoading] = useState(false);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importRowsPreview, setImportRowsPreview] = useState<CatalogImportRow[]>([]);
  const [importSummary, setImportSummary] = useState<{ totalRows: number; validRows: number; invalidRows: number } | null>(null);

  const loadCars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/catalog/cars?page=1&pageSize=200&includeArchived=${showArchived ? "1" : "0"}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось загрузить каталог");
      setCars(payload.items || []);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки каталога");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCars();
  }, [showArchived]);

  const startCreate = () => {
    setEditingId(null);
    setForm(defaultFormState());
    setPendingImage("");
    setMessage(null);
    setError(null);
  };

  const startEdit = (car: CatalogCarEntity) => {
    setEditingId(car.id);
    setForm(mapCarToForm(car));
    setPendingImage("");
    setMessage(null);
    setError(null);
  };

  const addUploadedImage = (url: string) => {
    setPendingImage("");
    setForm((prev) => {
      const nextImages = [
        ...prev.images,
        {
          url,
          alt: `${prev.brand} ${prev.model}`.trim(),
          sortOrder: prev.images.length,
          isCover: prev.images.length === 0,
          mediaAssetId: null,
        },
      ];
      return {
        ...prev,
        images: nextImages,
      };
    });
  };

  const saveCar = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...form,
        images: form.images.map((image, index) => ({
          ...image,
          sortOrder: index,
        })),
      };

      const response = await fetch(editingId ? `/api/admin/catalog/cars/${editingId}` : "/api/admin/catalog/cars", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Не удалось сохранить автомобиль");

      setMessage(editingId ? "Автомобиль обновлен" : "Автомобиль создан");
      await loadCars();

      if (!editingId && data?.car) {
        setEditingId(data.car.id);
        setForm(mapCarToForm(data.car));
      }
    } catch (cause: any) {
      setError(cause?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (car: CatalogCarEntity, archived: boolean) => {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/catalog/cars/${car.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось изменить статус архива");

      setMessage(archived ? "Автомобиль архивирован" : "Автомобиль восстановлен");
      await loadCars();
      if (editingId === car.id) {
        setEditingId(null);
        setForm(defaultFormState());
      }
    } catch (cause: any) {
      setError(cause?.message || "Ошибка изменения архива");
    }
  };

  const uploadImportFile = async (file: File | null) => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/catalog/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось создать задачу импорта");

      setImportJobId(payload.jobId);
      setImportSummary(payload.summary || null);
      setImportRowsPreview((payload.preview || []).map((row: any, index: number) => ({
        id: index + 1,
        jobId: payload.jobId,
        rowIndex: row.rowIndex,
        rawData: row.rawData || {},
        normalizedData: row.normalizedData || null,
        errors: row.errors || [],
        status: row.status,
      })));
      setMessage(`Файл ${file.name} загружен, проверьте предварительный результат.`);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка импорта");
    } finally {
      setImporting(false);
    }
  };

  const applyImport = async () => {
    if (!importJobId) return;

    setImportApplyLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/catalog/import/${importJobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось применить импорт");

      if (payload?.success) {
        setMessage(`Импорт применён: ${payload.applied} строк.`);
      } else {
        setError(`Импорт завершён с ошибками: ${payload.errors?.[0] || "проверьте журнал"}`);
      }

      await loadCars();
    } catch (cause: any) {
      setError(cause?.message || "Ошибка применения импорта");
    } finally {
      setImportApplyLoading(false);
    }
  };

  const activeCar = useMemo(() => cars.find((car) => car.id === editingId) || null, [cars, editingId]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white">Каталог автомобилей</h1>
            <p className="text-sm text-zinc-400">Создание, редактирование, архив и массовый импорт.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-orange-500"
            >
              <Plus size={14} />
              Новый автомобиль
            </button>
            <button
              type="button"
              onClick={() => void loadCars()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-100 hover:border-orange-400"
            >
              <RefreshCw size={14} />
              Обновить
            </button>
            <label className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              Показать архив
            </label>
          </div>
        </div>

        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">Список автомобилей</h2>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-zinc-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
              {cars.map((car) => (
                <div key={car.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(car)}
                      className="text-left"
                    >
                      <div className="text-sm font-bold text-white">
                        {car.brand} {car.model}
                      </div>
                      <div className="text-xs text-zinc-400">{car.year} · {car.market} · {car.priceValue.toLocaleString("ru-RU")} {car.priceCurrency}</div>
                      <div className="mt-1 text-[11px] text-zinc-500">{car.slug}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void toggleArchive(car, !Boolean(car.archivedAt))}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                        car.archivedAt ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      <Archive size={12} />
                      {car.archivedAt ? "Восстановить" : "В архив"}
                    </button>
                  </div>
                </div>
              ))}
              {cars.length === 0 ? <p className="text-sm text-zinc-500">Список пуст.</p> : null}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
              {editingId ? "Редактирование" : "Новый автомобиль"}
            </h2>
            {activeCar ? <span className="text-[11px] text-zinc-500">id: {activeCar.id}</span> : null}
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Slug" value={form.slug} onChange={(value) => setForm((prev) => ({ ...prev, slug: value }))} />
              <Input label="Марка" value={form.brand} onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))} />
              <Input label="Модель" value={form.model} onChange={(value) => setForm((prev) => ({ ...prev, model: value }))} />
              <Input label="Поколение" value={form.generation} onChange={(value) => setForm((prev) => ({ ...prev, generation: value }))} />
              <Input label="Год" value={String(form.year)} onChange={(value) => setForm((prev) => ({ ...prev, year: Number(value) || form.year }))} />
              <Input label="Цена" value={String(form.priceValue)} onChange={(value) => setForm((prev) => ({ ...prev, priceValue: Number(value) || 0 }))} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Select
                label="Состояние"
                value={form.condition}
                options={["New", "Used", "Crashed"]}
                onChange={(value) => setForm((prev) => ({ ...prev, condition: value as CarFormState["condition"] }))}
              />
              <Select
                label="Наличие"
                value={form.availability}
                options={["InStock", "EnRoute", "OnOrder"]}
                onChange={(value) => setForm((prev) => ({ ...prev, availability: value as CarFormState["availability"] }))}
              />
              <Select
                label="Рынок"
                value={form.market}
                options={["China", "USA", "Korea", "Europe"]}
                onChange={(value) => setForm((prev) => ({ ...prev, market: value as CarFormState["market"] }))}
              />
              <Select
                label="Валюта"
                value={form.priceCurrency}
                options={["USD", "CNY", "EUR", "KRW"]}
                onChange={(value) => setForm((prev) => ({ ...prev, priceCurrency: value as CarFormState["priceCurrency"] }))}
              />
              <Select
                label="Тип цены"
                value={form.priceType}
                options={["FOB", "EXW", "OnRoad", "Estimate"]}
                onChange={(value) => setForm((prev) => ({ ...prev, priceType: value as CarFormState["priceType"] }))}
              />
              <Select
                label="Тип"
                value={form.type || ""}
                options={["", "EV", "EREV", "ICE", "HEV"]}
                onChange={(value) => setForm((prev) => ({ ...prev, type: (value || null) as CarFormState["type"] }))}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Кузов" value={form.bodyType} onChange={(value) => setForm((prev) => ({ ...prev, bodyType: value }))} />
              <Input label="Коробка" value={form.transmission} onChange={(value) => setForm((prev) => ({ ...prev, transmission: value }))} />
              <Input label="Привод" value={form.drive} onChange={(value) => setForm((prev) => ({ ...prev, drive: value }))} />
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">Описание</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
              />
            </label>

            <MediaField
              label="Добавить изображение"
              value={pendingImage}
              onChange={addUploadedImage}
            />

            <div className="space-y-2">
              {form.images.map((image, index) => (
                <div key={`${image.url}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-2">
                  <div className="flex items-start gap-2">
                    <img src={image.url} alt={image.alt || "preview"} className="h-14 w-20 rounded object-cover" />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={image.alt}
                        onChange={(event) => {
                          const value = event.target.value;
                          setForm((prev) => {
                            const images = [...prev.images];
                            images[index] = { ...images[index], alt: value };
                            return { ...prev, images };
                          });
                        }}
                        placeholder="Подпись изображения"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-orange-500"
                      />
                      <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={image.isCover}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setForm((prev) => {
                              const images = prev.images.map((item, itemIndex) => ({
                                ...item,
                                isCover: checked ? itemIndex === index : item.isCover,
                              }));
                              return { ...prev, images };
                            });
                          }}
                          className="h-4 w-4 accent-orange-500"
                        />
                        Обложка
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          const images = prev.images.filter((_, imageIndex) => imageIndex !== index);
                          const normalized = images.map((item, itemIndex) => ({
                            ...item,
                            sortOrder: itemIndex,
                          }));
                          if (normalized.length > 0 && !normalized.some((item) => item.isCover)) {
                            normalized[0].isCover = true;
                          }
                          return {
                            ...prev,
                            images: normalized,
                          };
                        });
                      }}
                      className="rounded-md border border-rose-500/30 bg-rose-500/10 p-1 text-rose-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void saveCar()}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Сохранение..." : "Сохранить автомобиль"}
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">Массовый импорт CSV/XLSX</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
            <Upload size={14} />
            {importing ? "Загрузка..." : "Выбрать файл"}
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              disabled={importing}
              onChange={(event) => {
                void uploadImportFile(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>

          <button
            type="button"
            disabled={!importJobId || importApplyLoading}
            onClick={() => void applyImport()}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            {importApplyLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Применить валидные строки
          </button>
        </div>

        {importSummary ? (
          <p className="mt-3 text-sm text-zinc-300">
            Всего строк: {importSummary.totalRows}, валидных: {importSummary.validRows}, с ошибками: {importSummary.invalidRows}
          </p>
        ) : null}

        {importRowsPreview.length > 0 ? (
          <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-white/10">
            <table className="min-w-full text-xs">
              <thead className="bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-2 py-2 text-left">Строка</th>
                  <th className="px-2 py-2 text-left">Статус</th>
                  <th className="px-2 py-2 text-left">Ошибки</th>
                </tr>
              </thead>
              <tbody>
                {importRowsPreview.map((row) => (
                  <tr key={row.rowIndex} className="border-t border-white/5">
                    <td className="px-2 py-2 text-zinc-200">{row.rowIndex}</td>
                    <td className={`px-2 py-2 ${row.status === "valid" ? "text-emerald-300" : "text-rose-300"}`}>{row.status}</td>
                    <td className="px-2 py-2 text-zinc-400">{row.errors.join('; ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option || '—'}
          </option>
        ))}
      </select>
    </label>
  );
}
