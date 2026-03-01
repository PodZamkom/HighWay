import type { SeoContent } from "@/types/site";

export type ContentPageSlug =
  | "o-kompanii"
  | "uslugi"
  | "servisy"
  | "poleznoe"
  | "kontakty";

export interface ContentPageSeo {
  title: string;
  description: string;
}

export interface ContentPageLink {
  label: string;
  href: string;
}

export interface ContentPageHero {
  eyebrow: string;
  title: string;
  subtitle?: string;
  description: string;
  tags?: string[];
  primaryCta?: ContentPageLink;
  secondaryCta?: ContentPageLink;
}

export interface MetricCard {
  label: string;
  value: string;
  note?: string;
}

export interface MetricsSection {
  title: string;
  description?: string;
  items: MetricCard[];
}

export interface BulletListSection {
  id: string;
  title: string;
  description?: string;
  items: string[];
}

export interface StepItem {
  title: string;
  description: string;
}

export interface StepsSection {
  id: string;
  title: string;
  description?: string;
  items: StepItem[];
}

export interface CaseItem {
  title: string;
  description: string;
  meta?: string;
}

export interface CasesSection {
  id: string;
  title: string;
  description?: string;
  items: CaseItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  title: string;
  description?: string;
  items: FaqItem[];
}

export interface ContactItem {
  label: string;
  value: string;
  href?: string;
  note?: string;
}

export interface OfficeItem {
  city: string;
  address: string;
}

export interface ContactsSection {
  id: string;
  title: string;
  description?: string;
  methods: ContactItem[];
  links?: ContactItem[];
  offices?: OfficeItem[];
}

export interface CtaSection {
  title: string;
  description: string;
  primary: ContentPageLink;
  secondary?: ContentPageLink;
}

export interface ContentPage {
  slug: ContentPageSlug;
  seo: ContentPageSeo;
  hero: ContentPageHero;
  sourceNote: string;
  metricsSection?: MetricsSection;
  bulletSections?: BulletListSection[];
  stepsSections?: StepsSection[];
  casesSection?: CasesSection;
  faqSection?: FaqSection;
  contactsSection?: ContactsSection;
  cta: CtaSection;
}

export type ContentPagesMap = Record<ContentPageSlug, ContentPage>;

export interface AdminContentPagesResponse {
  pages: ContentPagesMap;
  globalSeo: SeoContent;
}

export interface AdminContentPagesUpdateRequest {
  pages: ContentPagesMap;
  globalSeo: SeoContent;
}
