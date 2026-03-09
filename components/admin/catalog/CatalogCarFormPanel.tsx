"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2, Save } from "lucide-react";
import { MediaField } from "@/components/admin/common/MediaField";
import type { CarFormState } from "@/components/admin/catalog/types";

type SelectOption = {
  value: string;
  label: string;
};

const CONDITION_OPTIONS: SelectOption[] = [
  { value: "New", label: "Новый" },
  { value: "Used", label: "С пробегом" },
  { value: "Crashed", label: "После ДТП" },
];

const AVAILABILITY_OPTIONS: SelectOption[] = [
  { value: "InStockKhorgos", label: "В наличии в Хоргосе" },
  { value: "InStockMinsk", label: "В наличии в Минске" },
  { value: "EnRoute", label: "В пути" },
  { value: "OnOrder", label: "Под заказ" },
];

const MARKET_OPTIONS: SelectOption[] = [
  { value: "China", label: "Китай" },
  { value: "USA", label: "США" },
  { value: "Korea", label: "Корея" },
  { value: "Europe", label: "Европа" },
];

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: "USD", label: "Доллар (USD)" },
  { value: "EUR", label: "Евро (EUR)" },
  { value: "BYN", label: "Белорусский рубль (BYN)" },
  { value: "JPY", label: "Йена (JPY)" },
  { value: "CNY", label: "Юань (CNY)" },
  { value: "KRW", label: "Вона (KRW)" },
];

const PRICE_TYPE_OPTIONS: SelectOption[] = [
  { value: "OnRoad", label: "Под ключ" },
  { value: "EXW", label: "Без растаможки" },
  { value: "FOB", label: "Без доставки" },
  { value: "Estimate", label: "Оценка (устар.)" },
];

const ENGINE_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "Не указано" },
  { value: "EV", label: "Электро (EV)" },
  { value: "EREV", label: "Гибрид с генератором (EREV)" },
  { value: "ICE", label: "ДВС (ICE)" },
  { value: "HEV", label: "Гибрид (HEV)" },
];

const BODY_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "Не указано" },
  { value: "Седан", label: "Седан" },
  { value: "Кроссовер", label: "Кроссовер" },
  { value: "Внедорожник", label: "Внедорожник" },
  { value: "Хэтчбек", label: "Хэтчбек" },
  { value: "Универсал", label: "Универсал" },
  { value: "Минивэн", label: "Минивэн" },
  { value: "Купе", label: "Купе" },
];

const TRANSMISSION_OPTIONS: SelectOption[] = [
  { value: "", label: "Не указано" },
  { value: "Механическая", label: "Механическая" },
  { value: "Автоматическая", label: "Автоматическая" },
  { value: "Без коробки", label: "Без коробки (для электромобилей)" },
];

const DRIVE_OPTIONS: SelectOption[] = [
  { value: "", label: "Не указано" },
  { value: "Полный", label: "Полный" },
  { value: "Передний", label: "Передний" },
  { value: "Задний", label: "Задний" },
];

interface CatalogCarFormPanelProps {
  form: CarFormState;
  setForm: Dispatch<SetStateAction<CarFormState>>;
  pendingImage: string;
  onAddUploadedImage: (url: string) => void;
  editingId: string | null;
  saving: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
}

export function CatalogCarFormPanel({
  form,
  setForm,
  pendingImage,
  onAddUploadedImage,
  editingId,
  saving,
  hasUnsavedChanges,
  onSave,
}: CatalogCarFormPanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
          {editingId ? "Редактирование" : "Новый автомобиль"}
        </h2>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">Есть несохраненные изменения</span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Все изменения сохранены</span>
          )}
          {editingId ? <span className="text-[11px] text-zinc-500">id: {editingId}</span> : null}
        </div>
      </div>

      <div className="max-h-[74vh] space-y-3 overflow-y-auto pr-1">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="URL идентификатор (slug)"
            hint="Служебный адрес карточки в ссылке, например: toyota-camry-2025"
            value={form.slug}
            onChange={(value) => setForm((prev) => ({ ...prev, slug: value }))}
          />
          <Input label="Марка" value={form.brand} onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))} />
          <Input label="Модель" value={form.model} onChange={(value) => setForm((prev) => ({ ...prev, model: value }))} />
          <Input label="Комплектация" value={form.generation} onChange={(value) => setForm((prev) => ({ ...prev, generation: value }))} />
          <Input
            label="Приоритет"
            hint="Чем больше число, тем выше в каталоге"
            type="number"
            value={String(form.priority)}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                priority: Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0,
              }))
            }
          />
          <Input
            label="Год"
            type="number"
            value={String(form.year)}
            onChange={(value) => setForm((prev) => ({ ...prev, year: Number(value) || prev.year }))}
          />
          <PriceWithCurrencyField
            value={String(form.priceValue)}
            currency={form.priceCurrency}
            currencyOptions={CURRENCY_OPTIONS}
            onValueChange={(value) => setForm((prev) => ({ ...prev, priceValue: Number(value) || 0 }))}
            onCurrencyChange={(value) => setForm((prev) => ({ ...prev, priceCurrency: value as CarFormState["priceCurrency"] }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Состояние"
            value={form.condition}
            options={CONDITION_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, condition: value as CarFormState["condition"] }))}
          />
          <Select
            label="Наличие"
            value={form.availability}
            options={AVAILABILITY_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, availability: value as CarFormState["availability"] }))}
          />
          <Select
            label="Рынок"
            value={form.market}
            options={MARKET_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, market: value as CarFormState["market"] }))}
          />
          <Select
            label="Тип цены"
            value={form.priceType}
            options={PRICE_TYPE_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, priceType: value as CarFormState["priceType"] }))}
          />
          <Select
            label="Тип двигателя"
            value={form.type || ""}
            options={ENGINE_TYPE_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, type: (value || null) as CarFormState["type"] }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select label="Кузов" value={form.bodyType} options={BODY_TYPE_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, bodyType: value }))} />
          <Select
            label="Коробка передач"
            value={form.transmission}
            options={TRANSMISSION_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, transmission: value }))}
          />
          <Select label="Привод" value={form.drive} options={DRIVE_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, drive: value }))} />
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

        <MediaField label="Добавить изображение" value={pendingImage} onChange={onAddUploadedImage} />

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
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "Сохранение..." : "Сохранить автомобиль"}
      </button>
    </section>
  );
}

function PriceWithCurrencyField({
  value,
  currency,
  currencyOptions,
  onValueChange,
  onCurrencyChange,
}: {
  value: string;
  currency: string;
  currencyOptions: SelectOption[];
  onValueChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">Цена и валюта</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_190px]">
        <input
          type="number"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
        />
        <select
          value={currency}
          onChange={(event) => onCurrencyChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
        >
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
      {hint ? <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span> : null}
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
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const hasCurrentOption = options.some((option) => option.value === value);
  const normalizedOptions = !hasCurrentOption && value
    ? [{ value, label: `${value} (текущее значение)` }, ...options]
    : options;

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      >
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
