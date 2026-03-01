import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/content-pages/PageShell";
import { readContentPages } from "@/lib/contentPagesStore";

const PAGE_SLUG = "poleznoe" as const;

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

export default async function UsefulPage() {
  const page = await loadPage();
  if (!page) {
    notFound();
  }
  return <PageShell page={page} />;
}
