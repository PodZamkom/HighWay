import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/content-pages/PageShell";
import { readContentPage, readGlobalSeo } from "@/lib/cmsRepository";
import { getSiteContent } from "@/lib/data";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";

const PAGE_SLUG = "uslugi" as const;
const PAGE_PATH = "/uslugi" as const;

async function loadPage() {
  noStore();
  const page = await readContentPage(PAGE_SLUG);
  return page;
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, globalSeo] = await Promise.all([loadPage(), readGlobalSeo()]);
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
      type: "article",
    },
  };
}

export default async function ServicesPage() {
  const [page, siteContent] = await Promise.all([loadPage(), getSiteContent()]);
  if (!page) {
    notFound();
  }

  const currentLabel = resolveNavigationLabel(siteContent.navbar, PAGE_PATH, page.hero.title);
  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: currentLabel },
  ];
  const breadcrumbSchema = buildBreadcrumbJsonLd(breadcrumbs, PAGE_PATH);

  return (
    <>
      <PageShell page={page} breadcrumbs={breadcrumbs} />
      {breadcrumbSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      ) : null}
    </>
  );
}
