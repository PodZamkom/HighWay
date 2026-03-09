import type {
  CmsCatalogLabelsDto,
  CmsFooterDto,
  CmsHomeContentDto,
  CmsNavigationDto,
} from "@/lib/schemas/cms";
import type {
  SeoContent,
} from "@/types/site";
import type { ContentPage, ContentPageSlug } from "@/types/content-pages";
import type { NewsSettings } from "@/types/news";

export type HomeBlockKey = "hero" | "promo" | "market" | "calculator" | "team";

export interface HomeLayoutBlock {
  key: HomeBlockKey;
  enabled: boolean;
}

export interface CmsHomeLayoutDocument {
  blocks: HomeLayoutBlock[];
}

export type CmsHomeContentDocument = CmsHomeContentDto;
export type CmsNavigationDocument = CmsNavigationDto;
export type CmsFooterDocument = CmsFooterDto;
export type CmsGlobalSeoDocument = SeoContent;

export interface CmsCatalogListSeoDocument {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  keywords: string;
  schemaName: string;
  schemaDescription: string;
}

export interface CmsCatalogDetailSeoTemplateDocument {
  titleTemplate: string;
  descriptionTemplate: string;
  canonicalTemplate: string;
  ogImage: string;
  schemaTemplate: string;
  robots: string;
}

export interface CmsSeoDocument {
  global: CmsGlobalSeoDocument;
  catalogList: CmsCatalogListSeoDocument;
  catalogDetailTemplate: CmsCatalogDetailSeoTemplateDocument;
}

export type CmsCatalogLabelsDocument = CmsCatalogLabelsDto;
export type CmsNewsSettingsDocument = NewsSettings;

export type CmsDocumentKey =
  | "home_layout"
  | "home_content"
  | "navigation"
  | "footer"
  | "news:settings"
  | "seo:global"
  | "seo:catalog-list"
  | "seo:catalog-detail-template"
  | "catalog:labels"
  | `page:${ContentPageSlug}`;

export interface CmsRevisionRecord {
  id: number;
  key: CmsDocumentKey;
  content: unknown;
  createdAt: string;
  createdBy: string | null;
}

export interface CmsSnapshot {
  homeLayout: CmsHomeLayoutDocument;
  homeContent: CmsHomeContentDocument;
  navigation: CmsNavigationDocument;
  footer: CmsFooterDocument;
  newsSettings: CmsNewsSettingsDocument;
  globalSeo: CmsGlobalSeoDocument;
  catalogListSeo: CmsCatalogListSeoDocument;
  catalogDetailSeoTemplate: CmsCatalogDetailSeoTemplateDocument;
  catalogLabels: CmsCatalogLabelsDocument;
  pages: Record<ContentPageSlug, ContentPage>;
}
