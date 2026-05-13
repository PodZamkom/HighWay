"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import type { NewsBlock, NewsCreateRequest, NewsPost, NewsSettings, NewsStatus } from "@/types/news";
import { MediaField } from "@/components/admin/common/MediaField";
import {
  SectionCard,
  SmallButton,
  TextAreaField,
  TextField,
} from "@/components/admin/pages/EditorPrimitives";

const STATUS_OPTIONS: Array<{ value: NewsStatus; label: string }> = [
  { value: "draft", label: "Черновик" },
  { value: "scheduled", label: "Запланирована" },
  { value: "published", label: "Опубликована" },
  { value: "archived", label: "Архив" },
];

function makeBlockId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function emptyDraft(): NewsCreateRequest {
  return {
    slug: "",
    title: "",
    lead: "",
    excerpt: "",
    status: "draft",
    publishedAt: null,
    isPinned: false,
    category: "",
    tags: [],
    cover: null,
    blocks: [],
    faq: [],
    cta: null,
    seoOverride: {},
  };
}

function defaultSettings(): NewsSettings {
  return {
    pageEyebrow: "Новости",
    pageTitle: "Новости",
    pageDescription: "",
    seo: {
      title: "Новости",
      description: "",
      keywords: "",
      ogImage: "",
      canonical: "/novosti",
      schemaName: "Новости",
      schemaDescription: "",
    },
    list: {
      pageSize: 12,
      enableSearch: true,
      enableFilters: true,
    },
  };
}

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function csvToTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function tagsToCsv(tags: string[] | undefined) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function slugifyFromTitle(value: string): string {
  const transliterated = value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function AdminNewsManager() {
  const [items, setItems] = useState<NewsPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsCreateRequest>(emptyDraft());
  const [isSlugAuto, setIsSlugAuto] = useState(true);

  const [settings, setSettings] = useState<NewsSettings>(defaultSettings());
  const [settingsDraft, setSettingsDraft] = useState<NewsSettings>(defaultSettings());

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const settingsDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(settingsDraft), [settings, settingsDraft]);

  const fetchSettings = async (): Promise<NewsSettings | null> => {
    try {
      const response = await fetch("/api/admin/news/settings", { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.error || "Не удалось загрузить настройки");
      const next = data.settings as NewsSettings;
      setSettings(next);
      setSettingsDraft(next);
      setPageSize(next.list.pageSize || 20);
      return next;
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки настроек");
      return null;
    }
  };

  const fetchList = async (targetPage = page, forcedPageSize?: number) => {
    setLoadingList(true);
    setError(null);
    try {
      const effectivePageSize = forcedPageSize ?? pageSize;
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("pageSize", String(effectivePageSize));
      params.set("includeArchived", "1");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter.trim()) params.set("category", categoryFilter.trim());
      if (tagFilter.trim()) params.set("tag", tagFilter.trim());

      const response = await fetch(`/api/admin/news?${params.toString()}`, { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.error || "Не удалось загрузить список новостей");

      setItems(data.items || []);
      setTotal(Number(data.total || 0));
      setPage(Number(data.page || targetPage));
      setPageSize(Number(data.pageSize || effectivePageSize));
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки новостей");
      setItems([]);
      setTotal(0);
    } finally {
      setLoadingList(false);
    }
  };

  const selectPost = async (id: string) => {
    setLoadingEditor(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/news/${id}`, { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.error || "Не удалось загрузить новость");
      const post = data.post as NewsPost;

      setSelectedId(post.id);
      setIsSlugAuto(false);
      setDraft({
        slug: post.slug,
        title: post.title,
        lead: post.lead,
        excerpt: post.excerpt,
        status: post.status,
        publishedAt: post.publishedAt,
        isPinned: post.isPinned,
        category: post.category,
        tags: post.tags,
        cover: post.cover,
        blocks: post.blocks,
        faq: post.faq,
        cta: post.cta,
        seoOverride: post.seoOverride,
      });
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки новости");
    } finally {
      setLoadingEditor(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const loadedSettings = await fetchSettings();
      await fetchList(1, loadedSettings?.list.pageSize);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setSelectedId(null);
    setIsSlugAuto(true);
    setDraft(emptyDraft());
    setMessage(null);
    setError(null);
  };

  const savePost = async () => {
    setSavingPost(true);
    setError(null);
    setMessage(null);

    try {
      const method = selectedId ? "PUT" : "POST";
      const url = selectedId ? `/api/admin/news/${selectedId}` : "/api/admin/news";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: draft }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.error || "Не удалось сохранить новость");

      const post = data.post as NewsPost;
      setSelectedId(post.id);
      setDraft({
        slug: post.slug,
        title: post.title,
        lead: post.lead,
        excerpt: post.excerpt,
        status: post.status,
        publishedAt: post.publishedAt,
        isPinned: post.isPinned,
        category: post.category,
        tags: post.tags,
        cover: post.cover,
        blocks: post.blocks,
        faq: post.faq,
        cta: post.cta,
        seoOverride: post.seoOverride,
      });

      setMessage(selectedId ? "Новость обновлена" : "Новость создана");
      await fetchList(page);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка сохранения новости");
    } finally {
      setSavingPost(false);
    }
  };

  const removePost = async () => {
    if (!selectedId) return;
    const confirmed = window.confirm("Удалить новость без возможности восстановления?");
    if (!confirmed) return;

    setSavingPost(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/news/${selectedId}`, { method: "DELETE" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.error || "Не удалось удалить новость");

      setMessage("Новость удалена");
      startCreate();
      await fetchList(page);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка удаления новости");
    } finally {
      setSavingPost(false);
    }
  };

  const patchStatus = async (
    status: NewsStatus,
    targetId: string | null = selectedId,
    publishedAt: string | null | undefined = draft.publishedAt,
  ) => {
    if (!targetId) return;

    setSavingPost(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/news/${targetId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          publishedAt: publishedAt ?? null,
        }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.error || "Не удалось изменить статус");

      const post = data.post as NewsPost;
      if (selectedId === targetId) {
        setDraft((prev) => ({ ...prev, status: post.status, publishedAt: post.publishedAt }));
      }
      setMessage(`Статус изменен: ${post.status}`);
      await fetchList(page);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка смены статуса");
    } finally {
      setSavingPost(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/news/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsDraft }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.error || "Не удалось сохранить настройки новостей");

      setSettings(settingsDraft);
      setPageSize(settingsDraft.list.pageSize);
      setMessage("Настройки новостей сохранены");
      await fetchList(1, settingsDraft.list.pageSize);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка сохранения настроек");
    } finally {
      setSavingSettings(false);
    }
  };

  const updateBlock = (index: number, updater: (value: NewsBlock) => NewsBlock) => {
    setDraft((prev) => {
      const blocks = [...(prev.blocks || [])];
      const current = blocks[index];
      if (!current) return prev;
      blocks[index] = updater(current);
      return { ...prev, blocks };
    });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const blocks = [...(prev.blocks || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= blocks.length) return prev;
      const [current] = blocks.splice(index, 1);
      blocks.splice(targetIndex, 0, current);
      return { ...prev, blocks };
    });
  };

  const addBlock = (type: NewsBlock["type"]) => {
    const id = makeBlockId();
    const block: NewsBlock =
      type === "text"
        ? { id, type: "text", heading: "", body: "" }
        : type === "image"
          ? { id, type: "image", image: { mediaAssetId: null, url: "", alt: "" }, caption: "" }
          : type === "video"
            ? { id, type: "video", videoFile: { mediaAssetId: null, url: "", alt: "" }, embedUrl: "", caption: "" }
            : { id, type: "quote", quote: "", author: "" };

    setDraft((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), block],
    }));
  };

  const categoryOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.category).filter(Boolean))),
    [items],
  );

  const tagOptions = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tags || []).filter(Boolean))),
    [items],
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="Настройки страницы новостей"
        description="SEO по умолчанию, заголовки витрины и поведение листинга"
        actions={
          <SmallButton onClick={saveSettings} disabled={!settingsDirty || savingSettings} tone="success">
            <span className="inline-flex items-center gap-1">
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Сохранить настройки
            </span>
          </SmallButton>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={settingsDraft.pageEyebrow}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, pageEyebrow: value }))}
          />
          <TextField
            label="Заголовок страницы"
            value={settingsDraft.pageTitle}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, pageTitle: value }))}
          />
        </div>
        <TextAreaField
          label="Описание страницы"
          value={settingsDraft.pageDescription}
          onChange={(value) => setSettingsDraft((prev) => ({ ...prev, pageDescription: value }))}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="SEO title"
            value={settingsDraft.seo.title}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, seo: { ...prev.seo, title: value } }))}
          />
          <TextField
            label="SEO description"
            value={settingsDraft.seo.description}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, seo: { ...prev.seo, description: value } }))}
          />
          <TextField
            label="SEO keywords"
            value={settingsDraft.seo.keywords}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, seo: { ...prev.seo, keywords: value } }))}
          />
          <TextField
            label="Canonical"
            value={settingsDraft.seo.canonical}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, seo: { ...prev.seo, canonical: value } }))}
          />
          <TextField
            label="Schema name"
            value={settingsDraft.seo.schemaName}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, seo: { ...prev.seo, schemaName: value } }))}
          />
          <TextField
            label="Schema description"
            value={settingsDraft.seo.schemaDescription}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, seo: { ...prev.seo, schemaDescription: value } }))}
          />
        </div>

        <MediaField
          label="OG изображение"
          value={settingsDraft.seo.ogImage}
          onChange={(url) => setSettingsDraft((prev) => ({ ...prev, seo: { ...prev.seo, ogImage: url } }))}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="mb-1 text-sm font-semibold text-zinc-200">Новостей на страницу</div>
            <input
              type="number"
              min={1}
              max={100}
              value={settingsDraft.list.pageSize}
              onChange={(event) =>
                setSettingsDraft((prev) => ({
                  ...prev,
                  list: {
                    ...prev.list,
                    pageSize: Math.max(1, Math.min(100, Number(event.target.value) || 1)),
                  },
                }))
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={settingsDraft.list.enableSearch}
              onChange={(event) =>
                setSettingsDraft((prev) => ({
                  ...prev,
                  list: { ...prev.list, enableSearch: event.target.checked },
                }))
              }
            />
            Включить поиск
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={settingsDraft.list.enableFilters}
              onChange={(event) =>
                setSettingsDraft((prev) => ({
                  ...prev,
                  list: { ...prev.list, enableFilters: event.target.checked },
                }))
              }
            />
            Включить фильтры
          </label>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard
          title="Список новостей"
          actions={
            <div className="flex items-center gap-2">
              <SmallButton onClick={() => fetchList(page)}>
                <span className="inline-flex items-center gap-1">
                  <RefreshCw size={14} />
                  Обновить
                </span>
              </SmallButton>
              <SmallButton onClick={startCreate} tone="success">
                <span className="inline-flex items-center gap-1">
                  <Plus size={14} />
                  Новая
                </span>
              </SmallButton>
            </div>
          }
        >
          <div className="grid gap-2">
            <TextField label="Поиск" value={search} onChange={setSearch} placeholder="title / lead / excerpt" />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-semibold text-zinc-200">Статус</div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                >
                  <option value="">Все</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-semibold text-zinc-200">Категория</div>
                <input
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  list="news-categories"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                />
                <datalist id="news-categories">
                  {categoryOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
            </div>

            <label className="block">
              <div className="mb-1 text-sm font-semibold text-zinc-200">Тег</div>
              <input
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                list="news-tags"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
              />
              <datalist id="news-tags">
                {tagOptions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>

            <SmallButton onClick={() => fetchList(1)}>Применить фильтры</SmallButton>
          </div>

          {loadingList ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
              <Loader2 className="mx-auto animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
                  Новости не найдены
                </div>
              ) : (
                items.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-3 ${
                      selectedId === item.id
                        ? "border-orange-500/50 bg-orange-500/10"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <button type="button" className="w-full text-left" onClick={() => void selectPost(item.id)}>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">/{item.slug}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.status} · {item.category || "Без категории"}
                        {item.isPinned ? " · PIN" : ""}
                      </p>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void patchStatus("published", item.id, item.publishedAt)}
                        className="rounded bg-emerald-700/70 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600"
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => void patchStatus("archived", item.id, item.publishedAt)}
                        className="rounded bg-zinc-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-zinc-600"
                      >
                        Archive
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Страница {page} из {totalPages}, всего {total}
            </p>
            <div className="flex gap-2">
              <SmallButton onClick={() => fetchList(Math.max(1, page - 1))} disabled={page <= 1}>
                Назад
              </SmallButton>
              <SmallButton onClick={() => fetchList(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                Вперед
              </SmallButton>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={selectedId ? "Редактор новости" : "Новая новость"}
          actions={
            <div className="flex flex-wrap gap-2">
              {selectedId ? (
                <SmallButton onClick={removePost} tone="danger" disabled={savingPost}>
                  <span className="inline-flex items-center gap-1">
                    <Trash2 size={14} />
                    Удалить
                  </span>
                </SmallButton>
              ) : null}
              <SmallButton onClick={savePost} tone="success" disabled={savingPost}>
                <span className="inline-flex items-center gap-1">
                  {savingPost ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Сохранить
                </span>
              </SmallButton>
            </div>
          }
        >
          {loadingEditor ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
              <Loader2 className="mx-auto animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <TextField
                    label="Slug"
                    required
                    value={draft.slug}
                    onChange={(value) => {
                      setIsSlugAuto(false);
                      setDraft((prev) => ({ ...prev, slug: value }));
                    }}
                  />
                  <SmallButton
                    onClick={() => {
                      setIsSlugAuto(true);
                      setDraft((prev) => ({ ...prev, slug: slugifyFromTitle(prev.title) }));
                    }}
                    disabled={!draft.title.trim()}
                  >
                    {isSlugAuto ? "Авто из title включен" : "Вернуть авто из title"}
                  </SmallButton>
                </div>
                <TextField
                  label="Title"
                  required
                  value={draft.title}
                  onChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      title: value,
                      slug: isSlugAuto ? slugifyFromTitle(value) : prev.slug,
                    }))
                  }
                />
              </div>

              <TextAreaField label="Lead" required value={draft.lead} onChange={(value) => setDraft((prev) => ({ ...prev, lead: value }))} />
              <TextAreaField
                label="Excerpt"
                required
                value={draft.excerpt}
                onChange={(value) => setDraft((prev) => ({ ...prev, excerpt: value }))}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm font-semibold text-zinc-200">Статус</div>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        status: event.target.value as NewsStatus,
                      }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-semibold text-zinc-200">Дата/время публикации</div>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(draft.publishedAt)}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        publishedAt: fromDatetimeLocal(event.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="Категория"
                  value={draft.category || ""}
                  onChange={(value) => setDraft((prev) => ({ ...prev, category: value }))}
                />
                <TextField
                  label="Теги (через запятую)"
                  value={tagsToCsv(draft.tags)}
                  onChange={(value) => setDraft((prev) => ({ ...prev, tags: csvToTags(value) }))}
                />
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={Boolean(draft.isPinned)}
                  onChange={(event) => setDraft((prev) => ({ ...prev, isPinned: event.target.checked }))}
                />
                Закрепить новость вверху
              </label>

              <SectionCard title="Обложка">
                <MediaField
                  label="Обложка (файл изображения)"
                  value={draft.cover?.url || ""}
                  onChange={(url) =>
                    setDraft((prev) => ({
                      ...prev,
                      cover: {
                        mediaAssetId: prev.cover?.mediaAssetId || null,
                        url,
                        alt: prev.cover?.alt || "",
                      },
                    }))
                  }
                  onAsset={(asset) =>
                    setDraft((prev) => ({
                      ...prev,
                      cover: {
                        mediaAssetId: asset.id,
                        url: asset.url,
                        alt: prev.cover?.alt || "",
                      },
                    }))
                  }
                />
                <TextField
                  label="ALT"
                  value={draft.cover?.alt || ""}
                  onChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      cover: {
                        mediaAssetId: prev.cover?.mediaAssetId || null,
                        url: prev.cover?.url || "",
                        alt: value,
                      },
                    }))
                  }
                />
              </SectionCard>

              <SectionCard
                title="Контент-блоки"
                actions={
                  <div className="flex flex-wrap gap-2">
                    <SmallButton onClick={() => addBlock("text")}>+ Text</SmallButton>
                    <SmallButton onClick={() => addBlock("image")}>+ Image</SmallButton>
                    <SmallButton onClick={() => addBlock("video")}>+ Video</SmallButton>
                    <SmallButton onClick={() => addBlock("quote")}>+ Quote</SmallButton>
                  </div>
                }
              >
                {(draft.blocks || []).length === 0 ? (
                  <p className="text-sm text-zinc-500">Блоков пока нет.</p>
                ) : (
                  <div className="space-y-4">
                    {(draft.blocks || []).map((block, index) => (
                      <article key={block.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-zinc-400">#{index + 1}</span>
                            <select
                              value={block.type}
                              onChange={(event) => {
                                const nextType = event.target.value as NewsBlock["type"];
                                const nextBlock: NewsBlock =
                                  nextType === "text"
                                    ? { id: block.id, type: "text", heading: "", body: "" }
                                    : nextType === "image"
                                      ? {
                                          id: block.id,
                                          type: "image",
                                          image: { mediaAssetId: null, url: "", alt: "" },
                                          caption: "",
                                        }
                                      : nextType === "video"
                                        ? {
                                            id: block.id,
                                            type: "video",
                                            videoFile: { mediaAssetId: null, url: "", alt: "" },
                                            embedUrl: "",
                                            caption: "",
                                          }
                                        : { id: block.id, type: "quote", quote: "", author: "" };
                                updateBlock(index, () => nextBlock);
                              }}
                              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                            >
                              <option value="text">text</option>
                              <option value="image">image</option>
                              <option value="video">video</option>
                              <option value="quote">quote</option>
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <SmallButton onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                              ↑
                            </SmallButton>
                            <SmallButton onClick={() => moveBlock(index, 1)} disabled={index === (draft.blocks || []).length - 1}>
                              ↓
                            </SmallButton>
                            <SmallButton
                              tone="danger"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  blocks: (prev.blocks || []).filter((_, blockIndex) => blockIndex !== index),
                                }))
                              }
                            >
                              Удалить
                            </SmallButton>
                          </div>
                        </div>

                        {block.type === "text" ? (
                          <>
                            <TextField
                              label="Heading"
                              value={block.heading || ""}
                              onChange={(value) => updateBlock(index, (current) => ({ ...(current as any), heading: value }))}
                            />
                            <TextAreaField
                              label="Body"
                              value={block.body}
                              onChange={(value) => updateBlock(index, (current) => ({ ...(current as any), body: value }))}
                            />
                          </>
                        ) : null}

                        {block.type === "image" ? (
                          <>
                            <MediaField
                              label="Изображение (файл)"
                              value={block.image.url}
                              onChange={(url) =>
                                updateBlock(index, (current) => ({
                                  ...(current as any),
                                  image: {
                                    ...((current as any).image || { mediaAssetId: null, alt: "" }),
                                    url,
                                  },
                                }))
                              }
                              onAsset={(asset) =>
                                updateBlock(index, (current) => ({
                                  ...(current as any),
                                  image: {
                                    ...((current as any).image || { alt: "" }),
                                    mediaAssetId: asset.id,
                                    url: asset.url,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="ALT"
                              value={block.image.alt || ""}
                              onChange={(value) =>
                                updateBlock(index, (current) => ({
                                  ...(current as any),
                                  image: {
                                    ...((current as any).image || { mediaAssetId: null, url: "" }),
                                    alt: value,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="Caption"
                              value={block.caption || ""}
                              onChange={(value) => updateBlock(index, (current) => ({ ...(current as any), caption: value }))}
                            />
                          </>
                        ) : null}

                        {block.type === "video" ? (
                          <>
                            <MediaField
                              label="Видео файл"
                              value={block.videoFile?.url || ""}
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={(url) =>
                                updateBlock(index, (current) => ({
                                  ...(current as any),
                                  videoFile: {
                                    ...((current as any).videoFile || { mediaAssetId: null, alt: "" }),
                                    url,
                                  },
                                }))
                              }
                              onAsset={(asset) =>
                                updateBlock(index, (current) => ({
                                  ...(current as any),
                                  videoFile: {
                                    ...((current as any).videoFile || { alt: "" }),
                                    mediaAssetId: asset.id,
                                    url: asset.url,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="Embed URL"
                              value={block.embedUrl || ""}
                              onChange={(value) => updateBlock(index, (current) => ({ ...(current as any), embedUrl: value }))}
                            />
                            <TextField
                              label="Caption"
                              value={block.caption || ""}
                              onChange={(value) => updateBlock(index, (current) => ({ ...(current as any), caption: value }))}
                            />
                          </>
                        ) : null}

                        {block.type === "quote" ? (
                          <>
                            <TextAreaField
                              label="Quote"
                              value={block.quote}
                              onChange={(value) => updateBlock(index, (current) => ({ ...(current as any), quote: value }))}
                            />
                            <TextField
                              label="Author"
                              value={block.author || ""}
                              onChange={(value) => updateBlock(index, (current) => ({ ...(current as any), author: value }))}
                            />
                          </>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="FAQ">
                <div className="space-y-3">
                  {(draft.faq || []).map((item, index) => (
                    <article key={`faq-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <TextField
                        label={`Вопрос ${index + 1}`}
                        value={item.question}
                        onChange={(value) =>
                          setDraft((prev) => {
                            const faq = [...(prev.faq || [])];
                            faq[index] = { ...faq[index], question: value };
                            return { ...prev, faq };
                          })
                        }
                      />
                      <TextAreaField
                        label="Ответ"
                        value={item.answer}
                        onChange={(value) =>
                          setDraft((prev) => {
                            const faq = [...(prev.faq || [])];
                            faq[index] = { ...faq[index], answer: value };
                            return { ...prev, faq };
                          })
                        }
                      />
                      <SmallButton
                        tone="danger"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            faq: (prev.faq || []).filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        Удалить
                      </SmallButton>
                    </article>
                  ))}
                </div>

                <SmallButton
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      faq: [...(prev.faq || []), { question: "", answer: "" }],
                    }))
                  }
                >
                  Добавить FAQ
                </SmallButton>
              </SectionCard>

              <SectionCard
                title="CTA"
                actions={
                  draft.cta ? (
                    <SmallButton tone="danger" onClick={() => setDraft((prev) => ({ ...prev, cta: null }))}>
                      Удалить CTA
                    </SmallButton>
                  ) : (
                    <SmallButton
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          cta: {
                            title: "",
                            description: "",
                            primary: { label: "", href: "" },
                          },
                        }))
                      }
                    >
                      Добавить CTA
                    </SmallButton>
                  )
                }
              >
                {draft.cta ? (
                  <>
                    <TextField
                      label="CTA title"
                      value={draft.cta.title}
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          cta: { ...(prev.cta as any), title: value },
                        }))
                      }
                    />
                    <TextAreaField
                      label="CTA description"
                      value={draft.cta.description || ""}
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          cta: { ...(prev.cta as any), description: value },
                        }))
                      }
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField
                        label="Primary label"
                        value={draft.cta.primary.label}
                        onChange={(value) =>
                          setDraft((prev) => ({
                            ...prev,
                            cta: {
                              ...(prev.cta as any),
                              primary: { ...(prev.cta as any).primary, label: value },
                            },
                          }))
                        }
                      />
                      <TextField
                        label="Primary href"
                        value={draft.cta.primary.href}
                        onChange={(value) =>
                          setDraft((prev) => ({
                            ...prev,
                            cta: {
                              ...(prev.cta as any),
                              primary: { ...(prev.cta as any).primary, href: value },
                            },
                          }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">CTA блок не задан.</p>
                )}
              </SectionCard>

              <SectionCard title="SEO override">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField
                    label="Title"
                    value={draft.seoOverride?.title || ""}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        seoOverride: { ...(prev.seoOverride || {}), title: value },
                      }))
                    }
                  />
                  <TextField
                    label="Description"
                    value={draft.seoOverride?.description || ""}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        seoOverride: { ...(prev.seoOverride || {}), description: value },
                      }))
                    }
                  />
                  <TextField
                    label="Keywords"
                    value={draft.seoOverride?.keywords || ""}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        seoOverride: { ...(prev.seoOverride || {}), keywords: value },
                      }))
                    }
                  />
                  <TextField
                    label="Canonical"
                    value={draft.seoOverride?.canonical || ""}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        seoOverride: { ...(prev.seoOverride || {}), canonical: value },
                      }))
                    }
                  />
                </div>

                <MediaField
                  label="OG image"
                  value={draft.seoOverride?.ogImage || ""}
                  onChange={(url) =>
                    setDraft((prev) => ({
                      ...prev,
                      seoOverride: { ...(prev.seoOverride || {}), ogImage: url },
                    }))
                  }
                />
              </SectionCard>

              {selectedId ? (
                <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
                  <SmallButton onClick={() => patchStatus("draft")}>В черновик</SmallButton>
                  <SmallButton onClick={() => patchStatus("scheduled")}>Запланировать</SmallButton>
                  <SmallButton tone="success" onClick={() => patchStatus("published")}>Опубликовать</SmallButton>
                  <SmallButton onClick={() => patchStatus("archived")} tone="danger">
                    В архив
                  </SmallButton>
                </div>
              ) : null}
            </>
          )}
        </SectionCard>
      </div>

      {message ? <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
