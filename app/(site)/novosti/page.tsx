import type { Metadata } from "next";
import Link from "next/link";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";
import {
  getPublicNewsFacets,
  getPublicNewsList,
  getPublicNewsSettings,
  getSiteContent,
} from "@/lib/publicSiteService";

function toPage(value: string | undefined) {
  const parsed = Number(value || "1");
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.trunc(parsed));
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicNewsSettings();

  return {
    title: settings.seo.title,
    description: settings.seo.description,
    keywords: settings.seo.keywords,
    alternates: {
      canonical: settings.seo.canonical || "/novosti",
    },
    openGraph: {
      title: settings.seo.title,
      description: settings.seo.description,
      url: toAbsoluteUrl(settings.seo.canonical || "/novosti"),
      images: settings.seo.ogImage ? [settings.seo.ogImage] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seo.title,
      description: settings.seo.description,
      images: settings.seo.ogImage ? [settings.seo.ogImage] : undefined,
    },
  };
}

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = toPage(params.page);

  const [settings, siteContent] = await Promise.all([getPublicNewsSettings(), getSiteContent()]);

  const result = await getPublicNewsList(
    page,
    settings.list.pageSize,
    params.q || undefined,
    params.category || undefined,
    params.tag || undefined,
  );

  const facets = settings.list.enableFilters ? await getPublicNewsFacets() : { categories: [], tags: [] };
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const currentLabel = resolveNavigationLabel(siteContent.navbar, "/novosti", settings.pageTitle);
  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: currentLabel },
  ];
  const breadcrumbSchema = buildBreadcrumbJsonLd(breadcrumbs, "/novosti");

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: settings.seo.schemaName,
    description: settings.seo.schemaDescription,
    url: toAbsoluteUrl("/novosti"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: result.items.map((item, index) => ({
        "@type": "ListItem",
        position: (result.page - 1) * result.pageSize + index + 1,
        url: toAbsoluteUrl(`/novosti/${item.slug}`),
        name: item.title,
      })),
    },
  };

  return (
    <div className="bg-[#0f0f10] pb-16 text-[#e8e8e8]">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_12%_18%,rgba(255,90,0,0.22),transparent_40%),radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.08),transparent_36%),#111112]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff8f55]">{settings.pageEyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">{settings.pageTitle}</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#c8c8c8] sm:text-lg">{settings.pageDescription}</p>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {settings.list.enableSearch || settings.list.enableFilters ? (
          <form className="rounded-2xl border border-white/10 bg-[#171717] p-4">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
              {settings.list.enableSearch ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Поиск</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q || ""}
                    placeholder="Поиск по заголовку и описанию"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  />
                </label>
              ) : null}

              {settings.list.enableFilters ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Категория</span>
                  <select
                    name="category"
                    defaultValue={params.category || ""}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Все категории</option>
                    {facets.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {settings.list.enableFilters ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Тег</span>
                  <select
                    name="tag"
                    defaultValue={params.tag || ""}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Все теги</option>
                    {facets.tags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#ff5a00] px-4 py-2 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-[#ff7429]"
                >
                  Найти
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {result.items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#171717] px-6 py-12 text-center text-zinc-400">
            По текущим фильтрам новости не найдены.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((item) => (
              <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#171717]">
                {item.cover?.url ? (
                  <img src={item.cover.url} alt={item.cover.alt || item.title} className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-black/30 text-sm text-zinc-500">Без обложки</div>
                )}

                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#ff985d]">
                    {item.category ? <span>{item.category}</span> : null}
                    {item.publishedAt ? <span>{new Date(item.publishedAt).toLocaleDateString("ru-RU")}</span> : null}
                    {item.isPinned ? <span>PIN</span> : null}
                  </div>

                  <h2 className="text-xl font-black text-white transition-colors group-hover:text-[#ff995e]">{item.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#c7c7c7]">{item.excerpt}</p>

                  {item.tags.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span key={`${item.id}-${tag}`} className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-zinc-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <Link
                    href={`/novosti/${item.slug}`}
                    className="mt-5 inline-flex rounded-lg bg-[#ff5a00] px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-[#ff7429]"
                  >
                    Читать новость
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-sm">
            <span className="text-zinc-400">
              Страница {result.page} из {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                aria-disabled={result.page <= 1}
                href={
                  result.page > 1
                    ? buildQuery({
                        page: result.page - 1,
                        q: params.q,
                        category: params.category,
                        tag: params.tag,
                      })
                    : "#"
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  result.page <= 1
                    ? "pointer-events-none bg-zinc-800 text-zinc-500"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
              >
                Назад
              </Link>
              <Link
                aria-disabled={result.page >= totalPages}
                href={
                  result.page < totalPages
                    ? buildQuery({
                        page: result.page + 1,
                        q: params.q,
                        category: params.category,
                        tag: params.tag,
                      })
                    : "#"
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  result.page >= totalPages
                    ? "pointer-events-none bg-zinc-800 text-zinc-500"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
              >
                Вперёд
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {breadcrumbSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
    </div>
  );
}
