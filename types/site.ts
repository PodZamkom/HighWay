export interface SiteContent {
  seo: SeoContent;
  navbar: NavbarContent;
  hero: HeroContent;
  calculator: CalculatorContent;
  marketSection: MarketSection;
  catalogSection: CatalogSection;
  carDetail: CarDetailLabels;
  footer: FooterContent;
}

export interface SeoContent {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

export interface NavbarContent {
  brandPrimary: string;
  brandAccent: string;
  links: NavLink[];
  ctaLabel: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface HeroContent {
  badge: string;
  titlePrimary: string;
  titleAccent: string;
  subtitleLine1: string;
  subtitleLine2Emphasis: string;
  subtitleLine2Rest: string;
  marqueeLine: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
}

export interface CtaLink {
  label: string;
  href: string;
}

export interface CalculatorContent {
  sectionTitle: string;
  sectionHighlight: string;
  sectionDescription: string;
  engineTypeLabel: string;
  engineTypeOptions: Record<'EV' | 'EREV' | 'HEV' | 'ICE', string>;
  engineTypeHint: Record<'EV' | 'OTHER', string>;
  priceLabel: string;
  engineVolumeLabel: string;
  carAgeLabel: string;
  carAgeOptions: Record<'0-3' | '3-5' | '5+', string>;
  legalEntityLabel: string;
  decreeLabel: string;
  breakdownTitle: string;
  breakdownLabels: {
    price: string;
    duty: string;
    vat: string;
    recycling: string;
    processing: string;
    total: string;
  };
  ctaLabel: string;
  approxLabel: string;
}

export interface MarketSection {
  title: string;
  markets: MarketCard[];
}

export interface MarketCard {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  bgClass: string;
}

export interface CatalogSection {
  title: string;
  noImageLabel: string;
  filterLabels: {
    all: string;
    china: string;
    europe: string;
    usa: string;
    korea: string;
  };
  availabilityLabels: {
    inStock: string;
    enRoute: string;
    onOrder: string;
  };
  typeLabels: {
    EV: string;
    EREV: string;
    ICE: string;
  };
  cardLabels: {
    price: string;
    details: string;
    acceleration: string;
    range: string;
    drive: string;
  };
}

export interface CarDetailLabels {
  backLabel: string;
  specBadgeSuffix: string;
  noImageLabel: string;
  accelerationLabel: string;
  rangeLabel: string;
  marketPriceLabel: string;
  marketPriceNote: string;
  trimsLabel: string;
  orderButton: string;
  whatsappButton: string;
}

export interface FooterContent {
  copyright: string;
  tagline: string;
  version: string;
  adminLinkLabel: string;
}
