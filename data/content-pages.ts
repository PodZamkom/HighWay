import rawContentPages from "@/data/content-pages.json";
import type { ContentPage, ContentPageSlug, ContentPagesMap } from "@/types/content-pages";

export const contentPages = rawContentPages as ContentPagesMap;

export function getContentPage(slug: ContentPageSlug): ContentPage {
  return contentPages[slug];
}
