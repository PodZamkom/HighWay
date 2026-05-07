export interface SiteContent {
  seo: SeoContent;
  navbar: NavbarContent;
  hero: HeroContent;
  promoBanners: PromoBannerSection;
  calculator: CalculatorContent;
  marketSection: MarketSection;
  teamSection: TeamSectionContent;
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
  secondaryMenus?: NavbarMenu[];
  secondaryLinks?: NavLink[];
  ctaLabel: string;
  phone: string;
  phoneLink: string;
  instagram: string;
  telegram?: string;
  whatsapp: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarMenu {
  label: string;
  items: NavLink[];
}

export interface HeroContent {
  title: string;
  descriptionBeforeBrand: string;
  brand: string;
  descriptionAfterBrand: string;
  highlights: HeroHighlight[];
  consultationTitle: string;
  consultationDescriptionLine1: string;
  consultationDescriptionLine2: string;
  primaryButtonLabel: string;
  contactsLabel: string;
  whatsappLink: string;
  telegramLink: string;
  instagramLink: string;
  youtubeSource: string;
  fallbackImage: string;
  videoTitle: string;
}

export interface HeroHighlight {
  label: string;
  value: string;
}

export interface PromoBannerSection {
  gapPx: number;
  banners: PromoBanner[];
}

export interface PromoBanner {
  id: string;
  title: string;
  buttonLabel: string;
  href: string;
  image: string;
  alt: string;
}

export interface CtaLink {
  label: string;
  href: string;
}

export interface CalculatorContent {
  sectionTitle: string;
  sectionHighlight: string;
  sectionDescription: string;
  form: CalculatorFormContent;
}

export interface CalculatorSelectOption {
  key: string;
  name: string;
}

export interface CalculatorDeliveryOption extends CalculatorSelectOption {
  cityName: string;
  cityNameOld?: string;
}

export interface CalculatorFormContent {
  labels: Record<string, string>;
  options: {
    transports: CalculatorSelectOption[];
    auctions: CalculatorSelectOption[];
    deliveries: CalculatorDeliveryOption[];
    ages: CalculatorSelectOption[];
    platformDefault: CalculatorSelectOption;
    [key: string]: unknown;
  };
  errors: Record<string, string>;
  rowLabels: Record<string, string>;
  [key: string]: unknown;
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

export interface TeamSectionContent {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  groups: TeamGroup[];
  stats: string[];
}

export interface TeamGroup {
  title: string;
  members: TeamMember[];
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  position: string;
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
  contacts?: {
    phone: string;
    phoneLink: string;
    whatsapp: string;
    offices: { city: string; address: string }[];
  };
}
