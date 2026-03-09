import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/content-pages/PageShell";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";
import { getPublicContentPage, getPublicGlobalSeo, getSiteContent } from "@/lib/site/siteContentReadService";

const PAGE_SLUG = "kontakty" as const;
const PAGE_PATH = "/kontakty" as const;

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
      type: "article",
    },
  };
}

export default async function ContactsPage() {
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
