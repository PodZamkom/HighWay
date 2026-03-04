import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/content-pages/PageShell";
import { readContentPages } from "@/lib/contentPagesStore";
import { getSiteContent } from "@/lib/data";
import { buildBreadcrumbJsonLd, resolveNavigationLabel } from "@/lib/breadcrumbs";

const PAGE_SLUG = "uslugi" as const;
const PAGE_PATH = "/uslugi" as const;

async function loadPage() {
  noStore();
  const pages = await readContentPages();
  return pages[PAGE_SLUG];
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPage();
  if (!page) return {};
  return {
    title: page.seo.title,
    description: page.seo.description,
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
