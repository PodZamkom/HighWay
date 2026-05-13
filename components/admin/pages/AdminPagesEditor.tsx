"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Save, Undo2 } from "lucide-react";
import type {
  AdminContentPagesResponse,
  AdminContentPagesUpdateRequest,
  ContentPage,
  ContentPageLink,
  ContentPageSlug,
  ContactItem,
  OfficeItem,
} from "@/types/content-pages";
import type { SeoContent } from "@/types/site";
import {
  SectionCard,
  SmallButton,
  TabButton,
  TextAreaField,
  TextField,
} from "@/components/admin/pages/EditorPrimitives";

const PAGE_TABS: Array<{ slug: ContentPageSlug; label: string }> = [
  { slug: "o-kompanii", label: "О компании" },
  { slug: "uslugi", label: "Услуги" },
  { slug: "servisy", label: "Сервисы" },
  { slug: "poleznoe", label: "Полезное" },
  { slug: "kontakty", label: "Контакты" },
  { slug: "v-nalichii", label: "В наличии" },
];

type EditorTab = ContentPageSlug | "global-seo";

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeLink(): ContentPageLink {
  return { label: "", href: "" };
}

function makeContactItem(): ContactItem {
  return { label: "", value: "", href: "", note: "" };
}

function makeOfficeItem(): OfficeItem {
  return { city: "", address: "" };
}

function makeEmptyMetricsSection() {
  return {
    title: "",
    description: "",
    items: [{ label: "", value: "", note: "" }],
  };
}

function makeEmptyBulletSection() {
  return { id: "", title: "", description: "", items: [""] };
}

function makeEmptyStepsSection() {
  return {
    id: "",
    title: "",
    description: "",
    items: [{ title: "", description: "" }],
  };
}

function makeEmptyCasesSection() {
  return {
    id: "",
    title: "",
    description: "",
    items: [{ title: "", description: "", meta: "" }],
  };
}

function makeEmptyFaqSection() {
  return {
    id: "",
    title: "",
    description: "",
    items: [{ question: "", answer: "" }],
  };
}

function makeEmptyContactsSection() {
  return {
    id: "",
    title: "",
    description: "",
    methods: [makeContactItem()],
    links: [makeContactItem()],
    offices: [makeOfficeItem()],
  };
}

function makeEmptySecondarySeo(): SeoContent {
  return {
    title: "",
    description: "",
    keywords: "",
    ogImage: "",
  };
}

function ensureLink(link?: ContentPageLink): ContentPageLink {
  return link ?? makeLink();
}

function isBlank(value: string | undefined) {
  return !value || value.trim().length === 0;
}

function collectBlockingErrors(payload: AdminContentPagesUpdateRequest): string[] {
  const errors: string[] = [];

  PAGE_TABS.forEach(({ slug, label }) => {
    const page = payload.pages[slug];
    if (isBlank(page.slug) || page.slug !== slug) errors.push(`${label}: slug`);
    if (isBlank(page.seo.title)) errors.push(`${label}: SEO title`);
    if (isBlank(page.seo.description)) errors.push(`${label}: SEO description`);
    if (isBlank(page.hero.eyebrow)) errors.push(`${label}: Hero eyebrow`);
    if (isBlank(page.hero.title)) errors.push(`${label}: Hero title`);
    if (isBlank(page.hero.description)) errors.push(`${label}: Hero description`);
    if (!page.hero.primaryCta || isBlank(page.hero.primaryCta.label) || isBlank(page.hero.primaryCta.href)) {
      errors.push(`${label}: Hero primary CTA`);
    }
    if (isBlank(page.sourceNote)) errors.push(`${label}: Source note`);
    if (isBlank(page.cta.title)) errors.push(`${label}: Bottom CTA title`);
    if (isBlank(page.cta.description)) errors.push(`${label}: Bottom CTA description`);
    if (isBlank(page.cta.primary.label) || isBlank(page.cta.primary.href)) {
      errors.push(`${label}: Bottom CTA primary`);
    }
  });

  if (isBlank(payload.globalSeo.title)) errors.push("Глобальное SEO: title");
  if (isBlank(payload.globalSeo.description)) errors.push("Глобальное SEO: description");
  if (isBlank(payload.globalSeo.keywords)) errors.push("Глобальное SEO: keywords");
  if (isBlank(payload.globalSeo.ogImage)) errors.push("Глобальное SEO: ogImage");

  return errors;
}

function collectWarnings(payload: AdminContentPagesUpdateRequest): string[] {
  const warnings: string[] = [];

  PAGE_TABS.forEach(({ slug, label }) => {
    const page = payload.pages[slug];
    if (!page.metricsSection) warnings.push(`${label}: metricsSection не заполнен`);
    if (!page.casesSection) warnings.push(`${label}: casesSection не заполнен`);
    if (!page.faqSection) warnings.push(`${label}: faqSection не заполнен`);
    if (!page.contactsSection) warnings.push(`${label}: contactsSection не заполнен`);
  });

  return warnings;
}

export function AdminPagesEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("o-kompanii");
  const [serverPayload, setServerPayload] = useState<AdminContentPagesResponse | null>(null);
  const [draft, setDraft] = useState<AdminContentPagesUpdateRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPayload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/content-pages", { cache: "no-store" });
      const data = (await response.json()) as AdminContentPagesResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data?.error || "Не удалось загрузить страницы");
      }

      const nextServer: AdminContentPagesResponse = {
        pages: data.pages,
        globalSeo: data.globalSeo ?? makeEmptySecondarySeo(),
      };

      setServerPayload(nextServer);
      setDraft(cloneDeep(nextServer));
    } catch (requestError: any) {
      setError(requestError?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayload();
  }, []);

  const hasChanges = useMemo(() => {
    if (!serverPayload || !draft) return false;
    return JSON.stringify(serverPayload) !== JSON.stringify(draft);
  }, [serverPayload, draft]);

  const warnings = useMemo(() => {
    if (!draft) return [];
    return collectWarnings(draft);
  }, [draft]);

  const isTabDirty = (tab: EditorTab) => {
    if (!serverPayload || !draft) return false;
    if (tab === "global-seo") {
      return JSON.stringify(serverPayload.globalSeo) !== JSON.stringify(draft.globalSeo);
    }
    return JSON.stringify(serverPayload.pages[tab]) !== JSON.stringify(draft.pages[tab]);
  };

  const resetDraft = () => {
    if (!serverPayload) return;
    setDraft(cloneDeep(serverPayload));
    setMessage(null);
    setError(null);
  };

  const saveDraft = async () => {
    if (!draft) return;
    const blockingErrors = collectBlockingErrors(draft);
    if (blockingErrors.length > 0) {
      setError(`Заполните обязательные поля перед сохранением:\n- ${blockingErrors.join("\n- ")}`);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/content-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) {
        const details = Array.isArray(data?.issues) ? `\n${data.issues.join("\n")}` : "";
        throw new Error((data?.error || "Не удалось сохранить изменения") + details);
      }

      const snapshot = cloneDeep(draft);
      setServerPayload(snapshot);
      setDraft(snapshot);
      setMessage("Изменения сохранены.");
    } catch (saveError: any) {
      setError(saveError?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const updateGlobalSeo = (nextSeo: SeoContent) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        globalSeo: nextSeo,
      };
    });
  };

  const updatePage = (slug: ContentPageSlug, updater: (page: ContentPage) => ContentPage) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [slug]: updater(prev.pages[slug]),
        },
      };
    });
  };

  if (loading || !draft) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-white/10 bg-zinc-900">
        <Loader2 className="animate-spin text-white" />
      </div>
    );
  }

  const activePageSlug: ContentPageSlug | null = activeTab === "global-seo" ? null : activeTab;
  const currentPage = activePageSlug ? draft.pages[activePageSlug] : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Страницы и SEO</h1>
          <div className="flex flex-wrap items-center gap-2">
            <SmallButton onClick={fetchPayload}>
              <span className="inline-flex items-center gap-1">
                <RefreshCw size={14} />
                Обновить из сервера
              </span>
            </SmallButton>
            <SmallButton onClick={resetDraft} disabled={!hasChanges}>
              <span className="inline-flex items-center gap-1">
                <Undo2 size={14} />
                Сбросить изменения
              </span>
            </SmallButton>
            <SmallButton onClick={saveDraft} disabled={!hasChanges || saving} tone="success">
              <span className="inline-flex items-center gap-1">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Сохранение..." : "Сохранить"}
              </span>
            </SmallButton>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Полное редактирование контента и SEO для страниц меню, плюс глобальное SEO главной страницы.
        </p>
        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 whitespace-pre-wrap text-sm text-rose-400">{error}</p> : null}
        {!error && warnings.length > 0 ? (
          <p className="mt-3 text-sm text-amber-300">
            Предупреждения (optional): {warnings.slice(0, 3).join("; ")}
            {warnings.length > 3 ? `; +${warnings.length - 3} еще` : ""}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {PAGE_TABS.map((tab) => (
          <TabButton
            key={tab.slug}
            active={activeTab === tab.slug}
            dirty={isTabDirty(tab.slug)}
            onClick={() => setActiveTab(tab.slug)}
          >
            {tab.label}
          </TabButton>
        ))}
        <TabButton active={activeTab === "global-seo"} dirty={isTabDirty("global-seo")} onClick={() => setActiveTab("global-seo")}>
          Глобальное SEO
        </TabButton>
      </div>

      {activeTab === "global-seo" ? (
        <SectionCard title="Глобальное SEO (главная)">
          <TextField
            label="Title"
            required
            value={draft.globalSeo.title}
            onChange={(value) => updateGlobalSeo({ ...draft.globalSeo, title: value })}
          />
          <TextAreaField
            label="Description"
            required
            value={draft.globalSeo.description}
            onChange={(value) => updateGlobalSeo({ ...draft.globalSeo, description: value })}
          />
          <TextAreaField
            label="Keywords"
            required
            value={draft.globalSeo.keywords}
            onChange={(value) => updateGlobalSeo({ ...draft.globalSeo, keywords: value })}
          />
          <TextField
            label="OG Image"
            value={draft.globalSeo.ogImage}
            onChange={(value) => updateGlobalSeo({ ...draft.globalSeo, ogImage: value })}
          />
        </SectionCard>
      ) : null}

      {currentPage && activePageSlug ? (
        <div className="space-y-6">
          <SectionCard title="SEO">
            <TextField
              label="Title"
              required
              value={currentPage.seo.title}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, seo: { ...page.seo, title: value } }))}
            />
            <TextAreaField
              label="Description"
              required
              value={currentPage.seo.description}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, seo: { ...page.seo, description: value } }))}
            />
          </SectionCard>

          <SectionCard title="Hero">
            <TextField
              label="Eyebrow"
              required
              value={currentPage.hero.eyebrow}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, hero: { ...page.hero, eyebrow: value } }))}
            />
            <TextField
              label="Title"
              required
              value={currentPage.hero.title}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, hero: { ...page.hero, title: value } }))}
            />
            <TextField
              label="Subtitle"
              value={currentPage.hero.subtitle || ""}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, hero: { ...page.hero, subtitle: value } }))}
            />
            <TextAreaField
              label="Description"
              required
              value={currentPage.hero.description}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, hero: { ...page.hero, description: value } }))}
            />

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">Tags</h3>
                <SmallButton
                  onClick={() =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      hero: { ...page.hero, tags: [...(page.hero.tags || []), ""] },
                    }))
                  }
                >
                  Добавить tag
                </SmallButton>
              </div>
              <div className="space-y-2">
                {(currentPage.hero.tags || []).map((tag, index) => (
                  <div key={`hero-tag-${index}`} className="flex items-center gap-2">
                    <input
                      value={tag}
                      onChange={(event) =>
                        updatePage(activePageSlug, (page) => {
                          const nextTags = [...(page.hero.tags || [])];
                          nextTags[index] = event.target.value;
                          return {
                            ...page,
                            hero: { ...page.hero, tags: nextTags },
                          };
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    />
                    <SmallButton
                      tone="danger"
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          hero: { ...page.hero, tags: (page.hero.tags || []).filter((_, itemIndex) => itemIndex !== index) },
                        }))
                      }
                    >
                      Удалить
                    </SmallButton>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-200">Primary CTA</h3>
                <TextField
                  label="Label"
                  required
                  value={ensureLink(currentPage.hero.primaryCta).label}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      hero: {
                        ...page.hero,
                        primaryCta: { ...ensureLink(page.hero.primaryCta), label: value },
                      },
                    }))
                  }
                />
                <TextField
                  label="Href"
                  required
                  value={ensureLink(currentPage.hero.primaryCta).href}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      hero: {
                        ...page.hero,
                        primaryCta: { ...ensureLink(page.hero.primaryCta), href: value },
                      },
                    }))
                  }
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200">Secondary CTA</h3>
                  {currentPage.hero.secondaryCta ? (
                    <SmallButton
                      tone="danger"
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          hero: {
                            ...page.hero,
                            secondaryCta: undefined,
                          },
                        }))
                      }
                    >
                      Удалить
                    </SmallButton>
                  ) : (
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          hero: {
                            ...page.hero,
                            secondaryCta: makeLink(),
                          },
                        }))
                      }
                    >
                      Добавить
                    </SmallButton>
                  )}
                </div>
                {currentPage.hero.secondaryCta ? (
                  <div className="space-y-3">
                    <TextField
                      label="Label"
                      value={currentPage.hero.secondaryCta.label}
                      onChange={(value) =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          hero: {
                            ...page.hero,
                            secondaryCta: { ...ensureLink(page.hero.secondaryCta), label: value },
                          },
                        }))
                      }
                    />
                    <TextField
                      label="Href"
                      value={currentPage.hero.secondaryCta.href}
                      onChange={(value) =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          hero: {
                            ...page.hero,
                            secondaryCta: { ...ensureLink(page.hero.secondaryCta), href: value },
                          },
                        }))
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">Вторичная CTA не задана.</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Source Note">
            <TextAreaField
              label="Source note"
              required
              value={currentPage.sourceNote}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, sourceNote: value }))}
            />
          </SectionCard>

          <SectionCard
            title="Metrics Section"
            actions={
              currentPage.metricsSection ? (
                <SmallButton tone="danger" onClick={() => updatePage(activePageSlug, (page) => ({ ...page, metricsSection: undefined }))}>
                  Удалить секцию
                </SmallButton>
              ) : (
                <SmallButton onClick={() => updatePage(activePageSlug, (page) => ({ ...page, metricsSection: makeEmptyMetricsSection() }))}>
                  Добавить секцию
                </SmallButton>
              )
            }
          >
            {currentPage.metricsSection ? (
              <>
                <TextField
                  label="Title"
                  required
                  value={currentPage.metricsSection.title}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      metricsSection: { ...page.metricsSection!, title: value },
                    }))
                  }
                />
                <TextAreaField
                  label="Description"
                  value={currentPage.metricsSection.description || ""}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      metricsSection: { ...page.metricsSection!, description: value },
                    }))
                  }
                />
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200">Items</h3>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          metricsSection: {
                            ...page.metricsSection!,
                            items: [...page.metricsSection!.items, { label: "", value: "", note: "" }],
                          },
                        }))
                      }
                    >
                      Добавить item
                    </SmallButton>
                  </div>
                  {currentPage.metricsSection.items.map((item, index) => (
                    <div key={`metric-${index}`} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex justify-end">
                        <SmallButton
                          tone="danger"
                          onClick={() =>
                            updatePage(activePageSlug, (page) => ({
                              ...page,
                              metricsSection: {
                                ...page.metricsSection!,
                                items: page.metricsSection!.items.filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          Удалить
                        </SmallButton>
                      </div>
                      <TextField
                        label="Label"
                        required
                        value={item.label}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.metricsSection!.items];
                            nextItems[index] = { ...nextItems[index], label: value };
                            return {
                              ...page,
                              metricsSection: { ...page.metricsSection!, items: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Value"
                        required
                        value={item.value}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.metricsSection!.items];
                            nextItems[index] = { ...nextItems[index], value };
                            return {
                              ...page,
                              metricsSection: { ...page.metricsSection!, items: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Note"
                        value={item.note || ""}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.metricsSection!.items];
                            nextItems[index] = { ...nextItems[index], note: value };
                            return {
                              ...page,
                              metricsSection: { ...page.metricsSection!, items: nextItems },
                            };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500">Секция не используется на странице.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Bullet Sections"
            actions={
              <SmallButton
                onClick={() =>
                  updatePage(activePageSlug, (page) => ({
                    ...page,
                    bulletSections: [...(page.bulletSections || []), makeEmptyBulletSection()],
                  }))
                }
              >
                Добавить секцию
              </SmallButton>
            }
          >
            {(currentPage.bulletSections || []).length === 0 ? (
              <p className="text-sm text-zinc-500">Секции не добавлены.</p>
            ) : null}
            {(currentPage.bulletSections || []).map((section, sectionIndex) => (
              <div key={`bullet-section-${sectionIndex}`} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex justify-end">
                  <SmallButton
                    tone="danger"
                    onClick={() =>
                      updatePage(activePageSlug, (page) => ({
                        ...page,
                        bulletSections: (page.bulletSections || []).filter((_, index) => index !== sectionIndex),
                      }))
                    }
                  >
                    Удалить секцию
                  </SmallButton>
                </div>
                <TextField
                  label="ID"
                  required
                  value={section.id}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => {
                      const next = [...(page.bulletSections || [])];
                      next[sectionIndex] = { ...next[sectionIndex], id: value };
                      return { ...page, bulletSections: next };
                    })
                  }
                />
                <TextField
                  label="Title"
                  required
                  value={section.title}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => {
                      const next = [...(page.bulletSections || [])];
                      next[sectionIndex] = { ...next[sectionIndex], title: value };
                      return { ...page, bulletSections: next };
                    })
                  }
                />
                <TextAreaField
                  label="Description"
                  value={section.description || ""}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => {
                      const next = [...(page.bulletSections || [])];
                      next[sectionIndex] = { ...next[sectionIndex], description: value };
                      return { ...page, bulletSections: next };
                    })
                  }
                />
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">Items</h4>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => {
                          const next = [...(page.bulletSections || [])];
                          next[sectionIndex] = {
                            ...next[sectionIndex],
                            items: [...next[sectionIndex].items, ""],
                          };
                          return { ...page, bulletSections: next };
                        })
                      }
                    >
                      Добавить item
                    </SmallButton>
                  </div>
                  {section.items.map((item, itemIndex) => (
                    <div key={`bullet-item-${sectionIndex}-${itemIndex}`} className="flex items-center gap-2">
                      <input
                        value={item}
                        onChange={(event) =>
                          updatePage(activePageSlug, (page) => {
                            const next = [...(page.bulletSections || [])];
                            const nextItems = [...next[sectionIndex].items];
                            nextItems[itemIndex] = event.target.value;
                            next[sectionIndex] = { ...next[sectionIndex], items: nextItems };
                            return { ...page, bulletSections: next };
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                      />
                      <SmallButton
                        tone="danger"
                        onClick={() =>
                          updatePage(activePageSlug, (page) => {
                            const next = [...(page.bulletSections || [])];
                            next[sectionIndex] = {
                              ...next[sectionIndex],
                              items: next[sectionIndex].items.filter((_, idx) => idx !== itemIndex),
                            };
                            return { ...page, bulletSections: next };
                          })
                        }
                      >
                        Удалить
                      </SmallButton>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="Steps Sections"
            actions={
              <SmallButton
                onClick={() =>
                  updatePage(activePageSlug, (page) => ({
                    ...page,
                    stepsSections: [...(page.stepsSections || []), makeEmptyStepsSection()],
                  }))
                }
              >
                Добавить секцию
              </SmallButton>
            }
          >
            {(currentPage.stepsSections || []).length === 0 ? (
              <p className="text-sm text-zinc-500">Секции не добавлены.</p>
            ) : null}
            {(currentPage.stepsSections || []).map((section, sectionIndex) => (
              <div key={`steps-section-${sectionIndex}`} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex justify-end">
                  <SmallButton
                    tone="danger"
                    onClick={() =>
                      updatePage(activePageSlug, (page) => ({
                        ...page,
                        stepsSections: (page.stepsSections || []).filter((_, index) => index !== sectionIndex),
                      }))
                    }
                  >
                    Удалить секцию
                  </SmallButton>
                </div>
                <TextField
                  label="ID"
                  required
                  value={section.id}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => {
                      const next = [...(page.stepsSections || [])];
                      next[sectionIndex] = { ...next[sectionIndex], id: value };
                      return { ...page, stepsSections: next };
                    })
                  }
                />
                <TextField
                  label="Title"
                  required
                  value={section.title}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => {
                      const next = [...(page.stepsSections || [])];
                      next[sectionIndex] = { ...next[sectionIndex], title: value };
                      return { ...page, stepsSections: next };
                    })
                  }
                />
                <TextAreaField
                  label="Description"
                  value={section.description || ""}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => {
                      const next = [...(page.stepsSections || [])];
                      next[sectionIndex] = { ...next[sectionIndex], description: value };
                      return { ...page, stepsSections: next };
                    })
                  }
                />
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">Items</h4>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => {
                          const next = [...(page.stepsSections || [])];
                          next[sectionIndex] = {
                            ...next[sectionIndex],
                            items: [...next[sectionIndex].items, { title: "", description: "" }],
                          };
                          return { ...page, stepsSections: next };
                        })
                      }
                    >
                      Добавить item
                    </SmallButton>
                  </div>
                  {section.items.map((item, itemIndex) => (
                    <div key={`step-item-${sectionIndex}-${itemIndex}`} className="space-y-2 rounded-lg border border-white/10 p-3">
                      <div className="flex justify-end">
                        <SmallButton
                          tone="danger"
                          onClick={() =>
                            updatePage(activePageSlug, (page) => {
                              const next = [...(page.stepsSections || [])];
                              next[sectionIndex] = {
                                ...next[sectionIndex],
                                items: next[sectionIndex].items.filter((_, idx) => idx !== itemIndex),
                              };
                              return { ...page, stepsSections: next };
                            })
                          }
                        >
                          Удалить
                        </SmallButton>
                      </div>
                      <TextField
                        label="Title"
                        required
                        value={item.title}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const next = [...(page.stepsSections || [])];
                            const nextItems = [...next[sectionIndex].items];
                            nextItems[itemIndex] = { ...nextItems[itemIndex], title: value };
                            next[sectionIndex] = { ...next[sectionIndex], items: nextItems };
                            return { ...page, stepsSections: next };
                          })
                        }
                      />
                      <TextAreaField
                        label="Description"
                        required
                        value={item.description}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const next = [...(page.stepsSections || [])];
                            const nextItems = [...next[sectionIndex].items];
                            nextItems[itemIndex] = { ...nextItems[itemIndex], description: value };
                            next[sectionIndex] = { ...next[sectionIndex], items: nextItems };
                            return { ...page, stepsSections: next };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="Cases Section"
            actions={
              currentPage.casesSection ? (
                <SmallButton tone="danger" onClick={() => updatePage(activePageSlug, (page) => ({ ...page, casesSection: undefined }))}>
                  Удалить секцию
                </SmallButton>
              ) : (
                <SmallButton onClick={() => updatePage(activePageSlug, (page) => ({ ...page, casesSection: makeEmptyCasesSection() }))}>
                  Добавить секцию
                </SmallButton>
              )
            }
          >
            {currentPage.casesSection ? (
              <div className="space-y-3">
                <TextField
                  label="ID"
                  required
                  value={currentPage.casesSection.id}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      casesSection: { ...page.casesSection!, id: value },
                    }))
                  }
                />
                <TextField
                  label="Title"
                  required
                  value={currentPage.casesSection.title}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      casesSection: { ...page.casesSection!, title: value },
                    }))
                  }
                />
                <TextAreaField
                  label="Description"
                  value={currentPage.casesSection.description || ""}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      casesSection: { ...page.casesSection!, description: value },
                    }))
                  }
                />
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">Items</h4>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          casesSection: {
                            ...page.casesSection!,
                            items: [...page.casesSection!.items, { title: "", description: "", meta: "" }],
                          },
                        }))
                      }
                    >
                      Добавить item
                    </SmallButton>
                  </div>
                  {currentPage.casesSection.items.map((item, index) => (
                    <div key={`case-item-${index}`} className="space-y-2 rounded-lg border border-white/10 p-3">
                      <div className="flex justify-end">
                        <SmallButton
                          tone="danger"
                          onClick={() =>
                            updatePage(activePageSlug, (page) => ({
                              ...page,
                              casesSection: {
                                ...page.casesSection!,
                                items: page.casesSection!.items.filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          Удалить
                        </SmallButton>
                      </div>
                      <TextField
                        label="Title"
                        required
                        value={item.title}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.casesSection!.items];
                            nextItems[index] = { ...nextItems[index], title: value };
                            return {
                              ...page,
                              casesSection: { ...page.casesSection!, items: nextItems },
                            };
                          })
                        }
                      />
                      <TextAreaField
                        label="Description"
                        required
                        value={item.description}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.casesSection!.items];
                            nextItems[index] = { ...nextItems[index], description: value };
                            return {
                              ...page,
                              casesSection: { ...page.casesSection!, items: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Meta"
                        value={item.meta || ""}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.casesSection!.items];
                            nextItems[index] = { ...nextItems[index], meta: value };
                            return {
                              ...page,
                              casesSection: { ...page.casesSection!, items: nextItems },
                            };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Секция не используется на странице.</p>
            )}
          </SectionCard>

          <SectionCard
            title="FAQ Section"
            actions={
              currentPage.faqSection ? (
                <SmallButton tone="danger" onClick={() => updatePage(activePageSlug, (page) => ({ ...page, faqSection: undefined }))}>
                  Удалить секцию
                </SmallButton>
              ) : (
                <SmallButton onClick={() => updatePage(activePageSlug, (page) => ({ ...page, faqSection: makeEmptyFaqSection() }))}>
                  Добавить секцию
                </SmallButton>
              )
            }
          >
            {currentPage.faqSection ? (
              <div className="space-y-3">
                <TextField
                  label="ID"
                  required
                  value={currentPage.faqSection.id}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      faqSection: { ...page.faqSection!, id: value },
                    }))
                  }
                />
                <TextField
                  label="Title"
                  required
                  value={currentPage.faqSection.title}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      faqSection: { ...page.faqSection!, title: value },
                    }))
                  }
                />
                <TextAreaField
                  label="Description"
                  value={currentPage.faqSection.description || ""}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      faqSection: { ...page.faqSection!, description: value },
                    }))
                  }
                />
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">Items</h4>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          faqSection: {
                            ...page.faqSection!,
                            items: [...page.faqSection!.items, { question: "", answer: "" }],
                          },
                        }))
                      }
                    >
                      Добавить item
                    </SmallButton>
                  </div>
                  {currentPage.faqSection.items.map((item, index) => (
                    <div key={`faq-item-${index}`} className="space-y-2 rounded-lg border border-white/10 p-3">
                      <div className="flex justify-end">
                        <SmallButton
                          tone="danger"
                          onClick={() =>
                            updatePage(activePageSlug, (page) => ({
                              ...page,
                              faqSection: {
                                ...page.faqSection!,
                                items: page.faqSection!.items.filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          Удалить
                        </SmallButton>
                      </div>
                      <TextField
                        label="Question"
                        required
                        value={item.question}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.faqSection!.items];
                            nextItems[index] = { ...nextItems[index], question: value };
                            return {
                              ...page,
                              faqSection: { ...page.faqSection!, items: nextItems },
                            };
                          })
                        }
                      />
                      <TextAreaField
                        label="Answer"
                        required
                        value={item.answer}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.faqSection!.items];
                            nextItems[index] = { ...nextItems[index], answer: value };
                            return {
                              ...page,
                              faqSection: { ...page.faqSection!, items: nextItems },
                            };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Секция не используется на странице.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Contacts Section"
            actions={
              currentPage.contactsSection ? (
                <SmallButton tone="danger" onClick={() => updatePage(activePageSlug, (page) => ({ ...page, contactsSection: undefined }))}>
                  Удалить секцию
                </SmallButton>
              ) : (
                <SmallButton
                  onClick={() =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      contactsSection: makeEmptyContactsSection(),
                    }))
                  }
                >
                  Добавить секцию
                </SmallButton>
              )
            }
          >
            {currentPage.contactsSection ? (
              <div className="space-y-4">
                <TextField
                  label="ID"
                  required
                  value={currentPage.contactsSection.id}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      contactsSection: { ...page.contactsSection!, id: value },
                    }))
                  }
                />
                <TextField
                  label="Title"
                  required
                  value={currentPage.contactsSection.title}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      contactsSection: { ...page.contactsSection!, title: value },
                    }))
                  }
                />
                <TextAreaField
                  label="Description"
                  value={currentPage.contactsSection.description || ""}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      contactsSection: { ...page.contactsSection!, description: value },
                    }))
                  }
                />

                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">Methods</h4>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          contactsSection: {
                            ...page.contactsSection!,
                            methods: [...page.contactsSection!.methods, makeContactItem()],
                          },
                        }))
                      }
                    >
                      Добавить method
                    </SmallButton>
                  </div>
                  {currentPage.contactsSection.methods.map((item, index) => (
                    <div key={`method-${index}`} className="space-y-2 rounded-lg border border-white/10 p-3">
                      <div className="flex justify-end">
                        <SmallButton
                          tone="danger"
                          onClick={() =>
                            updatePage(activePageSlug, (page) => ({
                              ...page,
                              contactsSection: {
                                ...page.contactsSection!,
                                methods: page.contactsSection!.methods.filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          Удалить
                        </SmallButton>
                      </div>
                      <TextField
                        label="Label"
                        required
                        value={item.label}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.contactsSection!.methods];
                            nextItems[index] = { ...nextItems[index], label: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, methods: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Value"
                        required
                        value={item.value}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.contactsSection!.methods];
                            nextItems[index] = { ...nextItems[index], value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, methods: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Href"
                        value={item.href || ""}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.contactsSection!.methods];
                            nextItems[index] = { ...nextItems[index], href: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, methods: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Note"
                        value={item.note || ""}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...page.contactsSection!.methods];
                            nextItems[index] = { ...nextItems[index], note: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, methods: nextItems },
                            };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">Links</h4>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          contactsSection: {
                            ...page.contactsSection!,
                            links: [...(page.contactsSection!.links || []), makeContactItem()],
                          },
                        }))
                      }
                    >
                      Добавить link
                    </SmallButton>
                  </div>
                  {(currentPage.contactsSection.links || []).map((item, index) => (
                    <div key={`link-${index}`} className="space-y-2 rounded-lg border border-white/10 p-3">
                      <div className="flex justify-end">
                        <SmallButton
                          tone="danger"
                          onClick={() =>
                            updatePage(activePageSlug, (page) => ({
                              ...page,
                              contactsSection: {
                                ...page.contactsSection!,
                                links: (page.contactsSection!.links || []).filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          Удалить
                        </SmallButton>
                      </div>
                      <TextField
                        label="Label"
                        required
                        value={item.label}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...(page.contactsSection!.links || [])];
                            nextItems[index] = { ...nextItems[index], label: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, links: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Value"
                        required
                        value={item.value}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...(page.contactsSection!.links || [])];
                            nextItems[index] = { ...nextItems[index], value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, links: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Href"
                        value={item.href || ""}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...(page.contactsSection!.links || [])];
                            nextItems[index] = { ...nextItems[index], href: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, links: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Note"
                        value={item.note || ""}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...(page.contactsSection!.links || [])];
                            nextItems[index] = { ...nextItems[index], note: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, links: nextItems },
                            };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">Offices</h4>
                    <SmallButton
                      onClick={() =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          contactsSection: {
                            ...page.contactsSection!,
                            offices: [...(page.contactsSection!.offices || []), makeOfficeItem()],
                          },
                        }))
                      }
                    >
                      Добавить office
                    </SmallButton>
                  </div>
                  {(currentPage.contactsSection.offices || []).map((item, index) => (
                    <div key={`office-${index}`} className="space-y-2 rounded-lg border border-white/10 p-3">
                      <div className="flex justify-end">
                        <SmallButton
                          tone="danger"
                          onClick={() =>
                            updatePage(activePageSlug, (page) => ({
                              ...page,
                              contactsSection: {
                                ...page.contactsSection!,
                                offices: (page.contactsSection!.offices || []).filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          Удалить
                        </SmallButton>
                      </div>
                      <TextField
                        label="City"
                        required
                        value={item.city}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...(page.contactsSection!.offices || [])];
                            nextItems[index] = { ...nextItems[index], city: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, offices: nextItems },
                            };
                          })
                        }
                      />
                      <TextField
                        label="Address"
                        required
                        value={item.address}
                        onChange={(value) =>
                          updatePage(activePageSlug, (page) => {
                            const nextItems = [...(page.contactsSection!.offices || [])];
                            nextItems[index] = { ...nextItems[index], address: value };
                            return {
                              ...page,
                              contactsSection: { ...page.contactsSection!, offices: nextItems },
                            };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Секция не используется на странице.</p>
            )}
          </SectionCard>

          <SectionCard title="Bottom CTA">
            <TextField
              label="Title"
              required
              value={currentPage.cta.title}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, cta: { ...page.cta, title: value } }))}
            />
            <TextAreaField
              label="Description"
              required
              value={currentPage.cta.description}
              onChange={(value) => updatePage(activePageSlug, (page) => ({ ...page, cta: { ...page.cta, description: value } }))}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-200">Primary</h3>
                <TextField
                  label="Label"
                  required
                  value={currentPage.cta.primary.label}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      cta: { ...page.cta, primary: { ...page.cta.primary, label: value } },
                    }))
                  }
                />
                <TextField
                  label="Href"
                  required
                  value={currentPage.cta.primary.href}
                  onChange={(value) =>
                    updatePage(activePageSlug, (page) => ({
                      ...page,
                      cta: { ...page.cta, primary: { ...page.cta.primary, href: value } },
                    }))
                  }
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200">Secondary</h3>
                  {currentPage.cta.secondary ? (
                    <SmallButton tone="danger" onClick={() => updatePage(activePageSlug, (page) => ({ ...page, cta: { ...page.cta, secondary: undefined } }))}>
                      Удалить
                    </SmallButton>
                  ) : (
                    <SmallButton onClick={() => updatePage(activePageSlug, (page) => ({ ...page, cta: { ...page.cta, secondary: makeLink() } }))}>
                      Добавить
                    </SmallButton>
                  )}
                </div>
                {currentPage.cta.secondary ? (
                  <>
                    <TextField
                      label="Label"
                      value={currentPage.cta.secondary.label}
                      onChange={(value) =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          cta: {
                            ...page.cta,
                            secondary: { ...ensureLink(page.cta.secondary), label: value },
                          },
                        }))
                      }
                    />
                    <TextField
                      label="Href"
                      value={currentPage.cta.secondary.href}
                      onChange={(value) =>
                        updatePage(activePageSlug, (page) => ({
                          ...page,
                          cta: {
                            ...page.cta,
                            secondary: { ...ensureLink(page.cta.secondary), href: value },
                          },
                        }))
                      }
                    />
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">Вторичная CTA не задана.</p>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
