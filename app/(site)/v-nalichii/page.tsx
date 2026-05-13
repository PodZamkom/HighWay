import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarCatalog } from "@/components/CarCatalog";
import { PageShell } from "@/components/content-pages/PageShell";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";
import { getPublicCatalogCars } from "@/lib/catalog/catalogPublicReadService";
import {
  getPublicContentPage,
  getPublicGlobalSeo,
  getSiteContent,
} from "@/lib/site/siteContentReadService";

const PAGE_SLUG = "v-nalichii" as const;
const PAGE_PATH = "/v-nalichii" as const;

async function loadPage() {
  return getPublicContentPage(PAGE_SLUG);
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, globalSeo] = await Promise.all([loadPage(), getPublicGlobalSeo()]);
  if (!page) return {};
  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: {
      canonical: PAGE_PATH,
    },
    openGraph: {
      title: page.seo.title,
      description: page.seo.description,
      url: toAbsoluteUrl(PAGE_PATH),
      images: globalSeo.ogImage ? [globalSeo.ogImage] : undefined,
      type: "website",
    },
  };
}

type SearchParams = { location?: string };

export default async function InStockPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [page, siteContent, cars, { location }] = await Promise.all([
    loadPage(),
    getSiteContent(),
    getPublicCatalogCars(),
    searchParams,
  ]);

  if (!page) {
    notFound();
  }

  const locationKey = location?.toLowerCase().trim() === "minsk" ? "minsk" : location?.toLowerCase().trim() === "khorgos" ? "khorgos" : null;
  const initialAvailability =
    locationKey === "minsk" ? "InStockMinsk" : locationKey === "khorgos" ? "InStockKhorgos" : undefined;

  const inStockCars = cars.filter((car) => {
    if (car.availability === "InStockMinsk" || car.availability === "InStockKhorgos") {
      if (!locationKey) return true;
      return car.availability === initialAvailability;
    }
    return false;
  });

  const currentLabel = resolveNavigationLabel(siteContent.navbar, PAGE_PATH, page.hero.title);
  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: currentLabel },
  ];
  const breadcrumbSchema = buildBreadcrumbJsonLd(breadcrumbs, PAGE_PATH);

  const catalogLabel = siteContent.catalogSection.title?.trim() || "Каталог автомобилей";

  return (
    <>
      <PageShell page={page} breadcrumbs={breadcrumbs} />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-gray-900">
            {locationKey === "minsk"
              ? "В наличии в Минске"
              : locationKey === "khorgos"
                ? "В наличии в Хоргосе"
                : "Все автомобили в наличии"}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href="/v-nalichii"
              className={`rounded-full border px-3 py-1.5 font-semibold transition ${
                !locationKey
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
              }`}
            >
              Все
            </a>
            <a
              href="/v-nalichii?location=minsk"
              className={`rounded-full border px-3 py-1.5 font-semibold transition ${
                locationKey === "minsk"
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
              }`}
            >
              Минск
            </a>
            <a
              href="/v-nalichii?location=khorgos"
              className={`rounded-full border px-3 py-1.5 font-semibold transition ${
                locationKey === "khorgos"
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
              }`}
            >
              Хоргос
            </a>
          </div>
        </div>

        {inStockCars.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Сейчас в этой категории нет автомобилей. Свяжитесь с нами — подберём под заказ.
          </div>
        ) : (
          <CarCatalog
            initialAvailability={initialAvailability}
            catalogLabel={catalogLabel}
            cars={inStockCars}
          />
        )}
      </section>

      {breadcrumbSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      ) : null}
    </>
  );
}
