"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Menu, Plus, RefreshCw, Save, Upload, X } from "lucide-react";
import type { Market } from "@/types/car";
import type { CatalogCarEntity, CatalogImportRow, CatalogListResult } from "@/types/catalog";
import { CatalogTreePanel } from "@/components/admin/catalog/CatalogTreePanel";
import { CatalogCarsListPanel } from "@/components/admin/catalog/CatalogCarsListPanel";
import { CatalogCarFormPanel } from "@/components/admin/catalog/CatalogCarFormPanel";
import { UnsavedChangesDialog } from "@/components/admin/catalog/UnsavedChangesDialog";
import {
  applyPathToForm,
  defaultFormState,
  mapCarToForm,
  matchPath,
  pathLabel,
  pathToKey,
  serializeFormState,
  type CatalogDirtyState,
  type CatalogTreeNode,
  type CatalogTreePath,
  type PendingNavigationAction,
} from "@/components/admin/catalog/types";

const PAGE_SIZE = 100;
const MARKET_ORDER: Market[] = ["China", "USA", "Korea", "Europe"];

function sortRu(left: string, right: string): number {
  return left.localeCompare(right, "ru", { sensitivity: "base" });
}

function buildCatalogTree(cars: CatalogCarEntity[]): CatalogTreeNode[] {
  const grouped = new Map<string, Map<string, Map<string, Map<string, number>>>>();

  for (const car of cars) {
    const market = car.market;
    const brand = car.brand;
    const model = car.model;
    const generation = car.generation || "";

    const marketMap = grouped.get(market) || new Map<string, Map<string, Map<string, number>>>();
    grouped.set(market, marketMap);

    const brandMap = marketMap.get(brand) || new Map<string, Map<string, number>>();
    marketMap.set(brand, brandMap);

    const modelMap = brandMap.get(model) || new Map<string, number>();
    brandMap.set(model, modelMap);

    modelMap.set(generation, (modelMap.get(generation) || 0) + 1);
  }

  const marketKeys = Array.from(grouped.keys()).sort((a, b) => {
    const leftIndex = MARKET_ORDER.indexOf(a as Market);
    const rightIndex = MARKET_ORDER.indexOf(b as Market);

    if (leftIndex === -1 && rightIndex === -1) return sortRu(a, b);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

  return marketKeys.map((market) => {
    const brandMap = grouped.get(market) || new Map<string, Map<string, Map<string, number>>>();

    const brandNodes = Array.from(brandMap.entries())
      .sort(([left], [right]) => sortRu(left, right))
      .map(([brand, modelMap]) => {
        const modelNodes = Array.from(modelMap.entries())
          .sort(([left], [right]) => sortRu(left, right))
          .map(([model, generationMap]) => {
            const generationNodes = Array.from(generationMap.entries())
              .sort(([left], [right]) => sortRu(left || "Без комплектации", right || "Без комплектации"))
              .map(([generation, count]) => {
                const path: CatalogTreePath = {
                  market: market as Market,
                  brand,
                  model,
                  generation,
                };

                return {
                  id: `generation:${pathToKey(path)}`,
                  level: "generation",
                  label: generation,
                  path,
                  count,
                  children: [],
                } satisfies CatalogTreeNode;
              });

            const path: CatalogTreePath = {
              market: market as Market,
              brand,
              model,
            };

            return {
              id: `model:${pathToKey(path)}`,
              level: "model",
              label: model,
              path,
              count: generationNodes.reduce((sum, node) => sum + node.count, 0),
              children: generationNodes,
            } satisfies CatalogTreeNode;
          });

        const path: CatalogTreePath = {
          market: market as Market,
          brand,
        };

        return {
          id: `brand:${pathToKey(path)}`,
          level: "brand",
          label: brand,
          path,
          count: modelNodes.reduce((sum, node) => sum + node.count, 0),
          children: modelNodes,
        } satisfies CatalogTreeNode;
      });

    const path: CatalogTreePath = {
      market: market as Market,
    };

    return {
      id: `market:${pathToKey(path)}`,
      level: "market",
      label: market,
      path,
      count: brandNodes.reduce((sum, node) => sum + node.count, 0),
      children: brandNodes,
    } satisfies CatalogTreeNode;
  });
}

export function AdminCatalogManager() {
  const [cars, setCars] = useState<CatalogCarEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [treeSearch, setTreeSearch] = useState("");
  const [selectedPath, setSelectedPath] = useState<CatalogTreePath | null>(null);
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);

  const [form, setForm] = useState(defaultFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState("");

  const [initialSnapshot, setInitialSnapshot] = useState(() => serializeFormState(defaultFormState()));
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigationAction | null>(null);

  const [importing, setImporting] = useState(false);
  const [importApplyLoading, setImportApplyLoading] = useState(false);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importRowsPreview, setImportRowsPreview] = useState<CatalogImportRow[]>([]);
  const [importSummary, setImportSummary] = useState<{ totalRows: number; validRows: number; invalidRows: number } | null>(null);

  const dirtyState: CatalogDirtyState = useMemo(() => {
    const currentSnapshot = serializeFormState(form);
    return {
      isDirty: currentSnapshot !== initialSnapshot,
      initialSnapshot,
      currentSnapshot,
    };
  }, [form, initialSnapshot]);

  const fetchCarsPage = useCallback(
    async (page: number): Promise<CatalogListResult> => {
      const response = await fetch(
        `/api/admin/catalog/cars?page=${page}&pageSize=${PAGE_SIZE}&includeArchived=${showArchived ? "1" : "0"}`,
        {
          cache: "no-store",
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось загрузить каталог");
      }
      return payload as CatalogListResult;
    },
    [showArchived],
  );

  const loadCars = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const firstPage = await fetchCarsPage(1);
      const totalPages = Math.max(1, Math.ceil((firstPage.total || 0) / PAGE_SIZE));

      let allItems = [...(firstPage.items || [])];

      if (totalPages > 1) {
        const rest = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => fetchCarsPage(index + 2)));
        allItems = allItems.concat(rest.flatMap((page) => page.items || []));
      }

      const deduped = new Map<string, CatalogCarEntity>();
      for (const car of allItems) {
        deduped.set(car.id, car);
      }

      setCars(Array.from(deduped.values()));
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки каталога");
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [fetchCarsPage]);

  useEffect(() => {
    void loadCars();
  }, [loadCars]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyState.isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyState.isDirty]);

  const runNavigationAction = useCallback(
    (action: PendingNavigationAction) => {
      if (action.type === "select_tree") {
        setSelectedPath(action.path);
        return;
      }

      if (action.type === "start_create") {
        const path = action.path;
        const nextForm = applyPathToForm(defaultFormState(), path);
        setSelectedPath(path);
        setEditingId(null);
        setPendingImage("");
        setForm(nextForm);
        setInitialSnapshot(serializeFormState(nextForm));
        setMessage(null);
        setError(null);
        return;
      }

      if (action.type === "select_car") {
        const car = cars.find((item) => item.id === action.carId);
        if (!car) return;

        const mapped = mapCarToForm(car);
        setSelectedPath({
          market: car.market,
          brand: car.brand,
          model: car.model,
          generation: car.generation,
        });
        setEditingId(car.id);
        setPendingImage("");
        setForm(mapped);
        setInitialSnapshot(serializeFormState(mapped));
        setMessage(null);
        setError(null);
      }
    },
    [cars],
  );

  const requestNavigation = useCallback(
    (action: PendingNavigationAction) => {
      if (!dirtyState.isDirty) {
        runNavigationAction(action);
        return;
      }

      setPendingNavigation(action);
      setUnsavedDialogOpen(true);
    },
    [dirtyState.isDirty, runNavigationAction],
  );

  const addUploadedImage = (url: string) => {
    setPendingImage(url);
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

  const saveCar = useCallback(async (): Promise<boolean> => {
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

      const car = data?.car as CatalogCarEntity | undefined;
      if (car) {
        const mapped = mapCarToForm(car);
        setEditingId(car.id);
        setForm(mapped);
        setInitialSnapshot(serializeFormState(mapped));
        setSelectedPath({
          market: car.market,
          brand: car.brand,
          model: car.model,
          generation: car.generation,
        });
      }

      setMessage(editingId ? "Автомобиль обновлен" : "Автомобиль создан");
      await loadCars();
      return true;
    } catch (cause: any) {
      setError(cause?.message || "Ошибка сохранения");
      return false;
    } finally {
      setSaving(false);
    }
  }, [editingId, form, loadCars]);

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

      if (editingId === car.id && archived && !showArchived) {
        runNavigationAction({ type: "start_create", path: selectedPath });
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
      setImportRowsPreview(
        (payload.preview || []).map((row: any, index: number) => ({
          id: index + 1,
          jobId: payload.jobId,
          rowIndex: row.rowIndex,
          rawData: row.rawData || {},
          normalizedData: row.normalizedData || null,
          errors: row.errors || [],
          status: row.status,
        })),
      );
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

  const handleDialogSaveAndContinue = async () => {
    if (!pendingNavigation) return;

    const success = await saveCar();
    if (!success) return;

    const action = pendingNavigation;
    setUnsavedDialogOpen(false);
    setPendingNavigation(null);
    runNavigationAction(action);
  };

  const handleDialogDiscardAndContinue = () => {
    if (!pendingNavigation) {
      setUnsavedDialogOpen(false);
      return;
    }

    const action = pendingNavigation;
    setUnsavedDialogOpen(false);
    setPendingNavigation(null);
    runNavigationAction(action);
  };

  const treeSourceCars = useMemo(() => {
    const needle = treeSearch.trim().toLowerCase();
    if (!needle) return cars;

    return cars.filter((car) => {
      const haystack = `${car.brand} ${car.model} ${car.generation} ${car.slug}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [cars, treeSearch]);

  const treeNodes = useMemo(() => buildCatalogTree(treeSourceCars), [treeSourceCars]);

  const carsForSelectedPath = useMemo(() => cars.filter((car) => matchPath(car, selectedPath)), [cars, selectedPath]);

  const selectedPathLabel = useMemo(() => pathLabel(selectedPath), [selectedPath]);

  const mobileTreeHandlers = {
    onSelectPath: (path: CatalogTreePath | null) => {
      requestNavigation({ type: "select_tree", path });
      setMobileTreeOpen(false);
    },
    onQuickCreate: (path: CatalogTreePath | null) => {
      requestNavigation({ type: "start_create", path });
      setMobileTreeOpen(false);
    },
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white">Каталог автомобилей</h1>
            <p className="text-sm text-zinc-400">Иерархическая навигация, редактирование карточек, архив и массовый импорт.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileTreeOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-100 hover:border-orange-400 lg:hidden"
            >
              <Menu size={14} />
              Разделы
            </button>
            <button
              type="button"
              onClick={() => requestNavigation({ type: "start_create", path: selectedPath })}
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

      {mobileTreeOpen ? (
        <div className="fixed inset-0 z-40 bg-black/70 p-4 lg:hidden">
          <div className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">Разделы каталога</h3>
              <button
                type="button"
                onClick={() => setMobileTreeOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-zinc-200"
                aria-label="Закрыть разделы"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CatalogTreePanel
                tree={treeNodes}
                selectedPath={selectedPath}
                onSelectPath={mobileTreeHandlers.onSelectPath}
                onQuickCreate={mobileTreeHandlers.onQuickCreate}
                search={treeSearch}
                onSearchChange={setTreeSearch}
                loading={loading}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="hidden lg:block">
          <CatalogTreePanel
            tree={treeNodes}
            selectedPath={selectedPath}
            onSelectPath={(path) => requestNavigation({ type: "select_tree", path })}
            onQuickCreate={(path) => requestNavigation({ type: "start_create", path })}
            search={treeSearch}
            onSearchChange={setTreeSearch}
            loading={loading}
          />
        </div>

        <CatalogCarsListPanel
          cars={carsForSelectedPath}
          loading={loading}
          selectedCarId={editingId}
          selectedPathLabel={selectedPathLabel}
          onSelectCar={(car) => requestNavigation({ type: "select_car", carId: car.id })}
          onToggleArchive={(car, archived) => void toggleArchive(car, archived)}
          onCreateNew={() => requestNavigation({ type: "start_create", path: selectedPath })}
        />

        <CatalogCarFormPanel
          form={form}
          setForm={setForm}
          pendingImage={pendingImage}
          onAddUploadedImage={addUploadedImage}
          editingId={editingId}
          saving={saving}
          hasUnsavedChanges={dirtyState.isDirty}
          onSave={() => {
            void saveCar();
          }}
        />
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
                    <td className="px-2 py-2 text-zinc-400">{row.errors.join("; ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        saving={saving}
        onCancel={() => {
          setUnsavedDialogOpen(false);
          setPendingNavigation(null);
        }}
        onDiscardAndContinue={handleDialogDiscardAndContinue}
        onSaveAndContinue={() => void handleDialogSaveAndContinue()}
      />
    </div>
  );
}
