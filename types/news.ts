export type NewsStatus = "draft" | "scheduled" | "published" | "archived";

export interface NewsMediaRef {
  mediaAssetId: string | null;
  url: string;
  alt: string;
}

export interface NewsTextBlock {
  id: string;
  type: "text";
  heading?: string;
  body: string;
}

export interface NewsImageBlock {
  id: string;
  type: "image";
  image: NewsMediaRef;
  caption?: string;
}

export interface NewsVideoBlock {
  id: string;
  type: "video";
  videoFile?: NewsMediaRef | null;
  embedUrl?: string;
  caption?: string;
}

export interface NewsQuoteBlock {
  id: string;
  type: "quote";
  quote: string;
  author?: string;
}

export type NewsBlock = NewsTextBlock | NewsImageBlock | NewsVideoBlock | NewsQuoteBlock;

export interface NewsFaqItem {
  question: string;
  answer: string;
}

export interface NewsLink {
  label: string;
  href: string;
}

export interface NewsCta {
  title: string;
  description?: string;
  primary: NewsLink;
  secondary?: NewsLink;
}

export interface NewsSeoOverride {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  lead: string;
  excerpt: string;
  status: NewsStatus;
  publishedAt: string | null;
  isPinned: boolean;
  category: string;
  tags: string[];
  cover: NewsMediaRef | null;
  blocks: NewsBlock[];
  faq: NewsFaqItem[];
  cta: NewsCta | null;
  seoOverride: NewsSeoOverride;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface NewsListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: NewsStatus;
  category?: string;
  tag?: string;
  includeArchived?: boolean;
  onlyPublished?: boolean;
}

export interface NewsListResult {
  items: NewsPost[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NewsSettings {
  pageEyebrow: string;
  pageTitle: string;
  pageDescription: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
    canonical: string;
    schemaName: string;
    schemaDescription: string;
  };
  list: {
    pageSize: number;
    enableSearch: boolean;
    enableFilters: boolean;
  };
}

export interface NewsCreateRequest {
  slug: string;
  title: string;
  lead: string;
  excerpt: string;
  status: NewsStatus;
  publishedAt?: string | null;
  isPinned?: boolean;
  category?: string;
  tags?: string[];
  cover?: NewsMediaRef | null;
  blocks?: NewsBlock[];
  faq?: NewsFaqItem[];
  cta?: NewsCta | null;
  seoOverride?: NewsSeoOverride;
}

export type NewsUpdateRequest = Partial<NewsCreateRequest>;

export interface NewsStatusPatchRequest {
  status: NewsStatus;
  publishedAt?: string | null;
}

export interface NewsSettingsRequest {
  settings: NewsSettings;
}

export interface NewsFacets {
  categories: string[];
  tags: string[];
}
