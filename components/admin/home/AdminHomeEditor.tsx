"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Save } from "lucide-react";
import type {
  CmsCatalogLabelsDocument,
  CmsFooterDocument,
  CmsHomeContentDocument,
  CmsHomeLayoutDocument,
  CmsNavigationDocument,
  CmsSeoDocument,
} from "@/types/cms";
import { MediaField } from "@/components/admin/common/MediaField";

type StatusKind = "idle" | "saving" | "success" | "error";

type HomePayload = {
  layout: CmsHomeLayoutDocument;
  content: CmsHomeContentDocument;
};

interface EditorState {
  home: HomePayload;
  navigation: CmsNavigationDocument;
  footer: CmsFooterDocument;
  seo: CmsSeoDocument;
  labels: CmsCatalogLabelsDocument;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function SectionCard({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500"
      />
    </label>
  );
}

function SaveButton({ status, onClick, disabled }: { status: StatusKind; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === "saving"}
      className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-orange-500 disabled:opacity-50"
    >
      {status === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {status === "saving" ? "Сохранение..." : "Сохранить"}
    </button>
  );
}

function statusMessage(status: StatusKind): string | null {
  if (status === "success") return "Сохранено";
  if (status === "error") return "Ошибка сохранения";
  return null;
}

export function AdminHomeEditor() {
  const [state, setState] = useState<EditorState | null>(null);
  const [serverState, setServerState] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [homeStatus, setHomeStatus] = useState<StatusKind>("idle");
  const [navStatus, setNavStatus] = useState<StatusKind>("idle");
  const [footerStatus, setFooterStatus] = useState<StatusKind>("idle");
  const [seoStatus, setSeoStatus] = useState<StatusKind>("idle");
  const [labelsStatus, setLabelsStatus] = useState<StatusKind>("idle");

  const loadAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [homeRes, navigationRes, footerRes, seoRes, labelsRes] = await Promise.all([
        fetch("/api/admin/cms/home", { cache: "no-store" }),
        fetch("/api/admin/cms/navigation", { cache: "no-store" }),
        fetch("/api/admin/cms/footer", { cache: "no-store" }),
        fetch("/api/admin/cms/seo", { cache: "no-store" }),
        fetch("/api/admin/cms/catalog-labels", { cache: "no-store" }),
      ]);

      const [homeData, navigationData, footerData, seoData, labelsData] = await Promise.all([
        homeRes.json(),
        navigationRes.json(),
        footerRes.json(),
        seoRes.json(),
        labelsRes.json(),
      ]);

      if (!homeRes.ok || !navigationRes.ok || !footerRes.ok || !seoRes.ok || !labelsRes.ok) {
        const firstError = homeData?.error || navigationData?.error || footerData?.error || seoData?.error || labelsData?.error;
        throw new Error(firstError || "Не удалось загрузить данные CMS");
      }

      const snapshot: EditorState = {
        home: {
          layout: homeData.layout,
          content: homeData.content,
        },
        navigation: navigationData.navigation,
        footer: footerData.footer,
        seo: seoData.seo,
        labels: labelsData.labels,
      };

      setState(deepClone(snapshot));
      setServerState(deepClone(snapshot));
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки CMS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (!state || !serverState) return false;
    return !jsonEqual(state, serverState);
  }, [state, serverState]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const updateState = (updater: (prev: EditorState) => EditorState) => {
    setState((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  };

  const saveHome = async () => {
    if (!state) return;
    setHomeStatus("saving");
    try {
      const response = await fetch("/api/admin/cms/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.home),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось сохранить главную страницу");
      }

      setServerState((prev) => (prev ? { ...prev, home: deepClone(state.home) } : prev));
      setHomeStatus("success");
      setTimeout(() => setHomeStatus("idle"), 1800);
    } catch (cause) {
      setHomeStatus("error");
    }
  };

  const saveNavigation = async () => {
    if (!state) return;
    setNavStatus("saving");
    try {
      const response = await fetch("/api/admin/cms/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navigation: state.navigation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось сохранить навигацию");

      setServerState((prev) => (prev ? { ...prev, navigation: deepClone(state.navigation) } : prev));
      setNavStatus("success");
      setTimeout(() => setNavStatus("idle"), 1800);
    } catch {
      setNavStatus("error");
    }
  };

  const saveFooter = async () => {
    if (!state) return;
    setFooterStatus("saving");
    try {
      const response = await fetch("/api/admin/cms/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ footer: state.footer }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось сохранить футер");

      setServerState((prev) => (prev ? { ...prev, footer: deepClone(state.footer) } : prev));
      setFooterStatus("success");
      setTimeout(() => setFooterStatus("idle"), 1800);
    } catch {
      setFooterStatus("error");
    }
  };

  const saveSeo = async () => {
    if (!state) return;
    setSeoStatus("saving");
    try {
      const response = await fetch("/api/admin/cms/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo: state.seo }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось сохранить SEO");

      setServerState((prev) => (prev ? { ...prev, seo: deepClone(state.seo) } : prev));
      setSeoStatus("success");
      setTimeout(() => setSeoStatus("idle"), 1800);
    } catch {
      setSeoStatus("error");
    }
  };

  const saveLabels = async () => {
    if (!state) return;
    setLabelsStatus("saving");
    try {
      const response = await fetch("/api/admin/cms/catalog-labels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: state.labels }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Не удалось сохранить подписи");

      setServerState((prev) => (prev ? { ...prev, labels: deepClone(state.labels) } : prev));
      setLabelsStatus("success");
      setTimeout(() => setLabelsStatus("idle"), 1800);
    } catch {
      setLabelsStatus("error");
    }
  };

  if (loading || !state) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="sticky top-[68px] z-30 rounded-2xl border border-white/10 bg-zinc-900/95 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-white">Редактор главной страницы и CMS</h1>
            <p className="text-xs text-zinc-400">Изменения публикуются сразу после сохранения.</p>
          </div>
          <div className={`rounded-lg px-3 py-1 text-xs font-bold ${hasUnsavedChanges ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
            {hasUnsavedChanges ? "Есть несохранённые изменения" : "Все изменения сохранены"}
          </div>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}

      <SectionCard
        title="Порядок блоков главной"
        subtitle="Перетащите карточку мышкой или используйте кнопки вверх/вниз"
        actions={<SaveButton status={homeStatus} onClick={saveHome} />}
      >
        <div className="grid gap-2">
          {state.home.layout.blocks.map((block, index) => (
            <div
              key={block.key}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                if (!Number.isFinite(fromIndex) || fromIndex === index) return;
                updateState((prev) => {
                  const next = deepClone(prev);
                  const [moved] = next.home.layout.blocks.splice(fromIndex, 1);
                  next.home.layout.blocks.splice(index, 0, moved);
                  return next;
                });
              }}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
            >
              <GripVertical size={16} className="text-zinc-500" />
              <div className="flex-1 text-sm font-semibold text-zinc-200">{block.key}</div>
              <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={(event) => {
                    updateState((prev) => {
                      const next = deepClone(prev);
                      next.home.layout.blocks[index].enabled = event.target.checked;
                      return next;
                    });
                  }}
                  className="h-4 w-4 accent-orange-500"
                />
                Видим
              </label>
              <button
                type="button"
                onClick={() => {
                  if (index === 0) return;
                  updateState((prev) => {
                    const next = deepClone(prev);
                    const [moved] = next.home.layout.blocks.splice(index, 1);
                    next.home.layout.blocks.splice(index - 1, 0, moved);
                    return next;
                  });
                }}
                className="rounded-lg border border-white/10 p-1 text-zinc-200 hover:border-orange-400"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (index >= state.home.layout.blocks.length - 1) return;
                  updateState((prev) => {
                    const next = deepClone(prev);
                    const [moved] = next.home.layout.blocks.splice(index, 1);
                    next.home.layout.blocks.splice(index + 1, 0, moved);
                    return next;
                  });
                }}
                className="rounded-lg border border-white/10 p-1 text-zinc-200 hover:border-orange-400"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          ))}
        </div>
        {statusMessage(homeStatus) ? <p className="text-xs text-zinc-300">{statusMessage(homeStatus)}</p> : null}
      </SectionCard>

      <SectionCard
        title="Hero и баннеры"
        subtitle="Основной экран, CTA и промо-блоки"
        actions={<SaveButton status={homeStatus} onClick={saveHome} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Заголовок Hero" value={state.home.content.hero.title} onChange={(value) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, title: value } } } }))} />
          <TextField label="Бренд в подзаголовке" value={state.home.content.hero.brand} onChange={(value) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, brand: value } } } }))} />
          <TextAreaField label="Текст до бренда" value={state.home.content.hero.descriptionBeforeBrand} onChange={(value) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, descriptionBeforeBrand: value } } } }))} />
          <TextAreaField label="Текст после бренда" value={state.home.content.hero.descriptionAfterBrand} onChange={(value) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, descriptionAfterBrand: value } } } }))} />
          <TextField label="Кнопка Hero" value={state.home.content.hero.primaryButtonLabel} onChange={(value) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, primaryButtonLabel: value } } } }))} />
          <TextField label="WhatsApp" value={state.home.content.hero.whatsappLink} onChange={(value) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, whatsappLink: value } } } }))} />
          <TextField label="Telegram" value={state.home.content.hero.telegramLink} onChange={(value) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, telegramLink: value } } } }))} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {state.home.content.hero.highlights.map((item, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <TextField
                label={`Преимущество ${index + 1}: заголовок`}
                value={item.label}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.hero.highlights[index].label = value;
                    return next;
                  });
                }}
              />
              <TextField
                label="Значение"
                value={item.value}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.hero.highlights[index].value = value;
                    return next;
                  });
                }}
              />
            </div>
          ))}
        </div>

        <MediaField
          label="Изображение fallback для Hero"
          value={state.home.content.hero.fallbackImage}
          onChange={(url) => updateState((prev) => ({ ...prev, home: { ...prev.home, content: { ...prev.home.content, hero: { ...prev.home.content.hero, fallbackImage: url } } } }))}
        />

        <div className="grid gap-3 md:grid-cols-3">
          {state.home.content.promoBanners.banners.map((banner, index) => (
            <div key={banner.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <TextField
                label={`Баннер ${index + 1}: заголовок`}
                value={banner.title}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.promoBanners.banners[index].title = value;
                    return next;
                  });
                }}
              />
              <TextField
                label="Текст кнопки"
                value={banner.buttonLabel}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.promoBanners.banners[index].buttonLabel = value;
                    return next;
                  });
                }}
              />
              <TextField
                label="Ссылка"
                value={banner.href}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.promoBanners.banners[index].href = value;
                    return next;
                  });
                }}
              />
              <MediaField
                label="Изображение"
                value={banner.image}
                onChange={(url) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.promoBanners.banners[index].image = url;
                    return next;
                  });
                }}
              />
              <div className="overflow-hidden rounded-xl border border-white/10">
                <img src={banner.image} alt={banner.alt} className="h-32 w-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Рынки и калькулятор" subtitle="Контент остальных блоков главной" actions={<SaveButton status={homeStatus} onClick={saveHome} />}>
        <TextField
          label="Заголовок блока рынков"
          value={state.home.content.marketSection.title}
          onChange={(value) =>
            updateState((prev) => ({
              ...prev,
              home: {
                ...prev.home,
                content: {
                  ...prev.home.content,
                  marketSection: {
                    ...prev.home.content.marketSection,
                    title: value,
                  },
                },
              },
            }))
          }
        />

        <div className="grid gap-3 md:grid-cols-2">
          {state.home.content.marketSection.markets.map((market, index) => (
            <div key={market.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <TextField
                label={`Рынок ${index + 1}: название`}
                value={market.name}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.marketSection.markets[index].name = value;
                    return next;
                  });
                }}
              />
              <TextAreaField
                label="Описание"
                value={market.description}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.marketSection.markets[index].description = value;
                    return next;
                  });
                }}
              />
              <MediaField
                label="Изображение"
                value={market.image}
                onChange={(url) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.marketSection.markets[index].image = url;
                    return next;
                  });
                }}
              />
              <div className="overflow-hidden rounded-xl border border-white/10">
                <img src={market.image} alt={market.name} className="h-28 w-full object-cover" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextField
            label="Калькулятор: заголовок"
            value={state.home.content.calculator.sectionTitle}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                home: {
                  ...prev.home,
                  content: {
                    ...prev.home.content,
                    calculator: {
                      ...prev.home.content.calculator,
                      sectionTitle: value,
                    },
                  },
                },
              }))
            }
          />
          <TextField
            label="Калькулятор: акцент"
            value={state.home.content.calculator.sectionHighlight}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                home: {
                  ...prev.home,
                  content: {
                    ...prev.home.content,
                    calculator: {
                      ...prev.home.content.calculator,
                      sectionHighlight: value,
                    },
                  },
                },
              }))
            }
          />
          <TextAreaField
            label="Калькулятор: описание"
            value={state.home.content.calculator.sectionDescription}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                home: {
                  ...prev.home,
                  content: {
                    ...prev.home.content,
                    calculator: {
                      ...prev.home.content.calculator,
                      sectionDescription: value,
                    },
                  },
                },
              }))
            }
          />
        </div>

      </SectionCard>

      <SectionCard title="Команда" subtitle="Редактирование блока команды на главной" actions={<SaveButton status={homeStatus} onClick={saveHome} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="Команда: заголовок"
            value={state.home.content.teamSection.title}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                home: {
                  ...prev.home,
                  content: {
                    ...prev.home.content,
                    teamSection: {
                      ...prev.home.content.teamSection,
                      title: value,
                    },
                  },
                },
              }))
            }
          />
          <TextField
            label="Команда: бейдж"
            value={state.home.content.teamSection.badge}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                home: {
                  ...prev.home,
                  content: {
                    ...prev.home.content,
                    teamSection: {
                      ...prev.home.content.teamSection,
                      badge: value,
                    },
                  },
                },
              }))
            }
          />
        </div>

        <TextAreaField
          label="Команда: описание"
          value={state.home.content.teamSection.description}
          onChange={(value) =>
            updateState((prev) => ({
              ...prev,
              home: {
                ...prev.home,
                content: {
                  ...prev.home.content,
                  teamSection: {
                    ...prev.home.content.teamSection,
                    description: value,
                  },
                },
              },
            }))
          }
        />

        <div className="grid gap-2 md:grid-cols-3">
          {state.home.content.teamSection.stats.map((stat, index) => (
            <TextField
              key={index}
              label={`Статистика ${index + 1}`}
              value={stat}
              onChange={(value) => {
                updateState((prev) => {
                  const next = deepClone(prev);
                  next.home.content.teamSection.stats[index] = value;
                  return next;
                });
              }}
            />
          ))}
        </div>

        <div className="space-y-4">
          {state.home.content.teamSection.groups.map((group, groupIndex) => (
            <div key={`${group.title}-${groupIndex}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <TextField
                label={`Раздел команды ${groupIndex + 1}`}
                value={group.title}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.home.content.teamSection.groups[groupIndex].title = value;
                    return next;
                  });
                }}
              />

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {group.members.map((member, memberIndex) => (
                  <div key={`${member.name}-${memberIndex}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <TextField
                      label="Имя"
                      value={member.name}
                      onChange={(value) => {
                        updateState((prev) => {
                          const next = deepClone(prev);
                          next.home.content.teamSection.groups[groupIndex].members[memberIndex].name = value;
                          return next;
                        });
                      }}
                    />
                    <TextField
                      label="Роль"
                      value={member.role}
                      onChange={(value) => {
                        updateState((prev) => {
                          const next = deepClone(prev);
                          next.home.content.teamSection.groups[groupIndex].members[memberIndex].role = value;
                          return next;
                        });
                      }}
                    />
                    <TextAreaField
                      label="Описание"
                      value={member.bio}
                      onChange={(value) => {
                        updateState((prev) => {
                          const next = deepClone(prev);
                          next.home.content.teamSection.groups[groupIndex].members[memberIndex].bio = value;
                          return next;
                        });
                      }}
                    />
                    <MediaField
                      label="Фото"
                      value={member.image}
                      onChange={(url) => {
                        updateState((prev) => {
                          const next = deepClone(prev);
                          next.home.content.teamSection.groups[groupIndex].members[memberIndex].image = url;
                          return next;
                        });
                      }}
                    />
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <img src={member.image} alt={member.name} className="h-28 w-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Навигация" subtitle="Структура фиксирована: редактируются существующие пункты" actions={<SaveButton status={navStatus} onClick={saveNavigation} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Название бренда" value={state.navigation.brandPrimary} onChange={(value) => updateState((prev) => ({ ...prev, navigation: { ...prev.navigation, brandPrimary: value } }))} />
          <TextField label="Телефон" value={state.navigation.phone} onChange={(value) => updateState((prev) => ({ ...prev, navigation: { ...prev.navigation, phone: value } }))} />
          <TextField label="Ссылка телефона" value={state.navigation.phoneLink} onChange={(value) => updateState((prev) => ({ ...prev, navigation: { ...prev.navigation, phoneLink: value } }))} />
          <TextField label="Кнопка CTA" value={state.navigation.ctaLabel} onChange={(value) => updateState((prev) => ({ ...prev, navigation: { ...prev.navigation, ctaLabel: value } }))} />
          <TextField label="Instagram" value={state.navigation.instagram} onChange={(value) => updateState((prev) => ({ ...prev, navigation: { ...prev.navigation, instagram: value } }))} />
          <TextField label="Telegram" value={state.navigation.telegram || ""} onChange={(value) => updateState((prev) => ({ ...prev, navigation: { ...prev.navigation, telegram: value } }))} />
          <TextField label="WhatsApp" value={state.navigation.whatsapp} onChange={(value) => updateState((prev) => ({ ...prev, navigation: { ...prev.navigation, whatsapp: value } }))} />
        </div>

        <div className="grid gap-2">
          {state.navigation.links.map((link, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-2">
              <TextField
                label={`Пункт ${index + 1}: название`}
                value={link.label}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.navigation.links[index].label = value;
                    return next;
                  });
                }}
              />
              <TextField
                label="Ссылка"
                value={link.href}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    next.navigation.links[index].href = value;
                    return next;
                  });
                }}
              />
            </div>
          ))}
        </div>

        {(state.navigation.secondaryMenus || []).length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Подменю</p>
            {(state.navigation.secondaryMenus || []).map((menu, menuIndex) => (
              <div key={menuIndex} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <TextField
                  label={`Раздел ${menuIndex + 1}: название`}
                  value={menu.label}
                  onChange={(value) => {
                    updateState((prev) => {
                      const next = deepClone(prev);
                      if (!next.navigation.secondaryMenus) return next;
                      next.navigation.secondaryMenus[menuIndex].label = value;
                      return next;
                    });
                  }}
                />
                <div className="mt-2 grid gap-2">
                  {menu.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid gap-2 md:grid-cols-2">
                      <TextField
                        label={`Пункт ${itemIndex + 1}: название`}
                        value={item.label}
                        onChange={(value) => {
                          updateState((prev) => {
                            const next = deepClone(prev);
                            if (!next.navigation.secondaryMenus) return next;
                            next.navigation.secondaryMenus[menuIndex].items[itemIndex].label = value;
                            return next;
                          });
                        }}
                      />
                      <TextField
                        label="Ссылка"
                        value={item.href}
                        onChange={(value) => {
                          updateState((prev) => {
                            const next = deepClone(prev);
                            if (!next.navigation.secondaryMenus) return next;
                            next.navigation.secondaryMenus[menuIndex].items[itemIndex].href = value;
                            return next;
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {(state.navigation.secondaryLinks || []).length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Дополнительные ссылки</p>
            {(state.navigation.secondaryLinks || []).map((link, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-2">
                <TextField
                  label={`Ссылка ${index + 1}: название`}
                  value={link.label}
                  onChange={(value) => {
                    updateState((prev) => {
                      const next = deepClone(prev);
                      if (!next.navigation.secondaryLinks) return next;
                      next.navigation.secondaryLinks[index].label = value;
                      return next;
                    });
                  }}
                />
                <TextField
                  label="URL"
                  value={link.href}
                  onChange={(value) => {
                    updateState((prev) => {
                      const next = deepClone(prev);
                      if (!next.navigation.secondaryLinks) return next;
                      next.navigation.secondaryLinks[index].href = value;
                      return next;
                    });
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}

        {statusMessage(navStatus) ? <p className="text-xs text-zinc-300">{statusMessage(navStatus)}</p> : null}
      </SectionCard>

      <SectionCard title="Футер" actions={<SaveButton status={footerStatus} onClick={saveFooter} />}>
        <TextField
          label="Копирайт"
          value={state.footer.copyright}
          onChange={(value) => updateState((prev) => ({ ...prev, footer: { ...prev.footer, copyright: value } }))}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <TextField
            label="Телефон"
            value={state.footer.contacts?.phone || ""}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                footer: {
                  ...prev.footer,
                  contacts: {
                    phone: value,
                    phoneLink: prev.footer.contacts?.phoneLink || "",
                    whatsapp: prev.footer.contacts?.whatsapp || "",
                    offices: prev.footer.contacts?.offices || [],
                  },
                },
              }))
            }
          />
          <TextField
            label="Ссылка телефона"
            value={state.footer.contacts?.phoneLink || ""}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                footer: {
                  ...prev.footer,
                  contacts: {
                    phone: prev.footer.contacts?.phone || "",
                    phoneLink: value,
                    whatsapp: prev.footer.contacts?.whatsapp || "",
                    offices: prev.footer.contacts?.offices || [],
                  },
                },
              }))
            }
          />
          <TextField
            label="WhatsApp"
            value={state.footer.contacts?.whatsapp || ""}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                footer: {
                  ...prev.footer,
                  contacts: {
                    phone: prev.footer.contacts?.phone || "",
                    phoneLink: prev.footer.contacts?.phoneLink || "",
                    whatsapp: value,
                    offices: prev.footer.contacts?.offices || [],
                  },
                },
              }))
            }
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(state.footer.contacts?.offices || []).map((office, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <TextField
                label={`Офис ${index + 1}: город`}
                value={office.city}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    if (!next.footer.contacts) return next;
                    next.footer.contacts.offices[index].city = value;
                    return next;
                  });
                }}
              />
              <TextAreaField
                label="Адрес"
                value={office.address}
                onChange={(value) => {
                  updateState((prev) => {
                    const next = deepClone(prev);
                    if (!next.footer.contacts) return next;
                    next.footer.contacts.offices[index].address = value;
                    return next;
                  });
                }}
              />
            </div>
          ))}
        </div>

        {statusMessage(footerStatus) ? <p className="text-xs text-zinc-300">{statusMessage(footerStatus)}</p> : null}
      </SectionCard>

      <SectionCard title="SEO" subtitle="Глобальный, каталог листинг и шаблон карточки" actions={<SaveButton status={seoStatus} onClick={saveSeo} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Global: title" value={state.seo.global.title} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, global: { ...prev.seo.global, title: value } } }))} />
          <TextField label="Global: description" value={state.seo.global.description} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, global: { ...prev.seo.global, description: value } } }))} />
          <TextField label="Global: keywords" value={state.seo.global.keywords} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, global: { ...prev.seo.global, keywords: value } } }))} />
          <MediaField label="Global: OG изображение" value={state.seo.global.ogImage} onChange={(url) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, global: { ...prev.seo.global, ogImage: url } } }))} />

          <TextField label="Каталог: title" value={state.seo.catalogList.title} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogList: { ...prev.seo.catalogList, title: value } } }))} />
          <TextField label="Каталог: description" value={state.seo.catalogList.description} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogList: { ...prev.seo.catalogList, description: value } } }))} />
          <TextField label="Каталог: canonical" value={state.seo.catalogList.canonical} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogList: { ...prev.seo.catalogList, canonical: value } } }))} />
          <MediaField label="Каталог: OG изображение" value={state.seo.catalogList.ogImage} onChange={(url) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogList: { ...prev.seo.catalogList, ogImage: url } } }))} />

          <TextField label="Карточка: title template" value={state.seo.catalogDetailTemplate.titleTemplate} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogDetailTemplate: { ...prev.seo.catalogDetailTemplate, titleTemplate: value } } }))} />
          <TextField label="Карточка: description template" value={state.seo.catalogDetailTemplate.descriptionTemplate} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogDetailTemplate: { ...prev.seo.catalogDetailTemplate, descriptionTemplate: value } } }))} />
          <TextField label="Карточка: canonical template" value={state.seo.catalogDetailTemplate.canonicalTemplate} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogDetailTemplate: { ...prev.seo.catalogDetailTemplate, canonicalTemplate: value } } }))} />
          <TextField label="Карточка: robots" value={state.seo.catalogDetailTemplate.robots} onChange={(value) => updateState((prev) => ({ ...prev, seo: { ...prev.seo, catalogDetailTemplate: { ...prev.seo.catalogDetailTemplate, robots: value } } }))} />
        </div>
        {statusMessage(seoStatus) ? <p className="text-xs text-zinc-300">{statusMessage(seoStatus)}</p> : null}
      </SectionCard>

      <SectionCard title="Подписи каталога" actions={<SaveButton status={labelsStatus} onClick={saveLabels} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="Заголовок каталога"
            value={state.labels.catalogSection.title}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                labels: {
                  ...prev.labels,
                  catalogSection: {
                    ...prev.labels.catalogSection,
                    title: value,
                  },
                },
              }))
            }
          />
          <TextField
            label="Без фото"
            value={state.labels.catalogSection.noImageLabel}
            onChange={(value) =>
              updateState((prev) => ({
                ...prev,
                labels: {
                  ...prev.labels,
                  catalogSection: {
                    ...prev.labels.catalogSection,
                    noImageLabel: value,
                  },
                },
              }))
            }
          />

          <TextField label="Кнопка карточки" value={state.labels.catalogSection.cardLabels.details} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, catalogSection: { ...prev.labels.catalogSection, cardLabels: { ...prev.labels.catalogSection.cardLabels, details: value } } } }))} />
          <TextField label="Цена карточки" value={state.labels.catalogSection.cardLabels.price} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, catalogSection: { ...prev.labels.catalogSection, cardLabels: { ...prev.labels.catalogSection.cardLabels, price: value } } } }))} />

          <TextField label="Карточка авто: кнопка заказа" value={state.labels.carDetail.orderButton} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, carDetail: { ...prev.labels.carDetail, orderButton: value } } }))} />
          <TextField label="Карточка авто: кнопка WhatsApp" value={state.labels.carDetail.whatsappButton} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, carDetail: { ...prev.labels.carDetail, whatsappButton: value } } }))} />
          <TextField label="Фильтр: Все" value={state.labels.catalogSection.filterLabels.all} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, catalogSection: { ...prev.labels.catalogSection, filterLabels: { ...prev.labels.catalogSection.filterLabels, all: value } } } }))} />
          <TextField label="Фильтр: Китай" value={state.labels.catalogSection.filterLabels.china} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, catalogSection: { ...prev.labels.catalogSection, filterLabels: { ...prev.labels.catalogSection.filterLabels, china: value } } } }))} />
          <TextField label="Фильтр: Европа" value={state.labels.catalogSection.filterLabels.europe} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, catalogSection: { ...prev.labels.catalogSection, filterLabels: { ...prev.labels.catalogSection.filterLabels, europe: value } } } }))} />
          <TextField label="Фильтр: США" value={state.labels.catalogSection.filterLabels.usa} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, catalogSection: { ...prev.labels.catalogSection, filterLabels: { ...prev.labels.catalogSection.filterLabels, usa: value } } } }))} />
          <TextField label="Фильтр: Корея" value={state.labels.catalogSection.filterLabels.korea} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, catalogSection: { ...prev.labels.catalogSection, filterLabels: { ...prev.labels.catalogSection.filterLabels, korea: value } } } }))} />
          <TextField label="Карточка авто: назад" value={state.labels.carDetail.backLabel} onChange={(value) => updateState((prev) => ({ ...prev, labels: { ...prev.labels, carDetail: { ...prev.labels.carDetail, backLabel: value } } }))} />
        </div>
        {statusMessage(labelsStatus) ? <p className="text-xs text-zinc-300">{statusMessage(labelsStatus)}</p> : null}
      </SectionCard>
    </div>
  );
}
