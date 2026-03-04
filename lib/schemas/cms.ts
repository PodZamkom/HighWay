import { z } from "zod";

const text = z.string().trim();
const requiredText = text.min(1);
const href = text.min(1);

export const contentPageSlugSchema = z.enum(["o-kompanii", "uslugi", "servisy", "poleznoe", "kontakty"]);

export const homeBlockKeySchema = z.enum(["hero", "promo", "market", "calculator", "team"]);

const navLinkSchema = z.object({
  label: requiredText,
  href,
});

const navbarMenuSchema = z.object({
  label: requiredText,
  items: z.array(navLinkSchema),
});

export const cmsNavigationSchema = z.object({
  brandPrimary: requiredText,
  brandAccent: text,
  links: z.array(navLinkSchema).min(1),
  secondaryMenus: z.array(navbarMenuSchema).optional(),
  secondaryLinks: z.array(navLinkSchema).optional(),
  ctaLabel: requiredText,
  phone: requiredText,
  phoneLink: requiredText,
  instagram: requiredText,
  telegram: text.optional(),
  whatsapp: requiredText,
});

const heroHighlightSchema = z.object({
  label: requiredText,
  value: requiredText,
});

const heroSchema = z.object({
  title: requiredText,
  descriptionBeforeBrand: requiredText,
  brand: requiredText,
  descriptionAfterBrand: requiredText,
  highlights: z.array(heroHighlightSchema).min(1),
  consultationTitle: requiredText,
  consultationDescriptionLine1: requiredText,
  consultationDescriptionLine2: requiredText,
  primaryButtonLabel: requiredText,
  primaryButtonHref: requiredText,
  contactsLabel: requiredText,
  whatsappLink: requiredText,
  telegramLink: requiredText,
  instagramLink: requiredText,
  youtubeSource: requiredText,
  fallbackImage: requiredText,
  videoTitle: requiredText,
});

const promoBannerSchema = z.object({
  id: requiredText,
  title: requiredText,
  buttonLabel: requiredText,
  href: requiredText,
  image: requiredText,
  alt: requiredText,
});

const promoBannerSectionSchema = z.object({
  gapPx: z.number().int().min(0).max(120),
  banners: z.array(promoBannerSchema).min(1),
});

const marketCardSchema = z.object({
  id: requiredText,
  name: requiredText,
  description: requiredText,
  image: requiredText,
  tags: z.array(requiredText),
  bgClass: text.optional().default(""),
});

const marketSectionSchema = z.object({
  title: requiredText,
  markets: z.array(marketCardSchema).min(1),
});

const calculatorSelectOptionSchema = z.object({
  key: requiredText,
  name: requiredText,
});

const calculatorDeliveryOptionSchema = calculatorSelectOptionSchema.extend({
  cityName: requiredText,
  cityNameOld: text.optional(),
});

const calculatorFormSchema = z
  .object({
    labels: z.record(z.string(), z.string()),
    options: z
      .object({
        transports: z.array(calculatorSelectOptionSchema),
        auctions: z.array(calculatorSelectOptionSchema),
        deliveries: z.array(calculatorDeliveryOptionSchema),
        ages: z.array(calculatorSelectOptionSchema),
        platformDefault: calculatorSelectOptionSchema,
      })
      .passthrough(),
    errors: z.record(z.string(), z.string()),
    rowLabels: z.record(z.string(), z.string()),
  })
  .passthrough();

const calculatorSchema = z.object({
  sectionTitle: requiredText,
  sectionHighlight: requiredText,
  sectionDescription: requiredText,
  form: calculatorFormSchema,
});

const teamMemberSchema = z.object({
  name: requiredText,
  role: requiredText,
  bio: requiredText,
  image: requiredText,
  position: requiredText,
});

const teamSectionSchema = z.object({
  eyebrow: requiredText,
  title: requiredText,
  description: requiredText,
  badge: requiredText,
  members: z.array(teamMemberSchema).min(1),
  stats: z.array(requiredText),
});

export const cmsHomeContentSchema = z.object({
  hero: heroSchema,
  promoBanners: promoBannerSectionSchema,
  marketSection: marketSectionSchema,
  calculator: calculatorSchema,
  teamSection: teamSectionSchema,
});

export const cmsHomeLayoutSchema = z.object({
  blocks: z.array(
    z.object({
      key: homeBlockKeySchema,
      enabled: z.boolean(),
    }),
  ),
});

const footerContactsSchema = z.object({
  phone: requiredText,
  phoneLink: requiredText,
  whatsapp: requiredText,
  offices: z.array(
    z.object({
      city: requiredText,
      address: requiredText,
    }),
  ),
});

export const cmsFooterSchema = z.object({
  copyright: requiredText,
  tagline: text.optional().default(""),
  version: text.optional().default(""),
  adminLinkLabel: text.optional().default(""),
  contacts: footerContactsSchema.optional(),
});

export const cmsGlobalSeoSchema = z.object({
  title: requiredText,
  description: requiredText,
  keywords: requiredText,
  ogImage: requiredText,
});

export const cmsCatalogListSeoSchema = z.object({
  title: requiredText,
  description: requiredText,
  canonical: requiredText,
  ogImage: requiredText,
  keywords: requiredText,
  schemaName: requiredText,
  schemaDescription: requiredText,
});

export const cmsCatalogDetailSeoTemplateSchema = z.object({
  titleTemplate: requiredText,
  descriptionTemplate: requiredText,
  canonicalTemplate: requiredText,
  ogImage: requiredText,
  schemaTemplate: requiredText,
  robots: requiredText,
});

const catalogFilterLabelsSchema = z.object({
  all: requiredText,
  china: requiredText,
  europe: requiredText,
  usa: requiredText,
  korea: requiredText,
});

const catalogAvailabilityLabelsSchema = z.object({
  inStock: requiredText,
  enRoute: requiredText,
  onOrder: requiredText,
});

const catalogTypeLabelsSchema = z.object({
  EV: requiredText,
  EREV: requiredText,
  ICE: requiredText,
});

const catalogCardLabelsSchema = z.object({
  price: requiredText,
  details: requiredText,
  acceleration: requiredText,
  range: requiredText,
  drive: requiredText,
});

const catalogSectionSchema = z.object({
  title: requiredText,
  noImageLabel: requiredText,
  filterLabels: catalogFilterLabelsSchema,
  availabilityLabels: catalogAvailabilityLabelsSchema,
  typeLabels: catalogTypeLabelsSchema,
  cardLabels: catalogCardLabelsSchema,
});

const carDetailLabelsSchema = z.object({
  backLabel: requiredText,
  specBadgeSuffix: requiredText,
  noImageLabel: requiredText,
  accelerationLabel: requiredText,
  rangeLabel: requiredText,
  marketPriceLabel: requiredText,
  marketPriceNote: requiredText,
  trimsLabel: requiredText,
  orderButton: requiredText,
  whatsappButton: requiredText,
});

export const cmsCatalogLabelsSchema = z.object({
  catalogSection: catalogSectionSchema,
  carDetail: carDetailLabelsSchema,
});

const contentPageLinkSchema = z.object({
  label: requiredText,
  href: requiredText,
});

const contentPageHeroSchema = z.object({
  eyebrow: requiredText,
  title: requiredText,
  subtitle: text.optional(),
  description: requiredText,
  tags: z.array(requiredText).optional(),
  primaryCta: contentPageLinkSchema.optional(),
  secondaryCta: contentPageLinkSchema.optional(),
});

const metricsSectionSchema = z.object({
  title: requiredText,
  description: text.optional(),
  items: z.array(
    z.object({
      label: requiredText,
      value: requiredText,
      note: text.optional(),
    }),
  ),
});

const bulletSectionsSchema = z.array(
  z.object({
    id: requiredText,
    title: requiredText,
    description: text.optional(),
    items: z.array(requiredText),
  }),
);

const stepsSectionsSchema = z.array(
  z.object({
    id: requiredText,
    title: requiredText,
    description: text.optional(),
    items: z.array(
      z.object({
        title: requiredText,
        description: requiredText,
      }),
    ),
  }),
);

const casesSectionSchema = z.object({
  id: requiredText,
  title: requiredText,
  description: text.optional(),
  items: z.array(
    z.object({
      title: requiredText,
      description: requiredText,
      meta: text.optional(),
    }),
  ),
});

const faqSectionSchema = z.object({
  id: requiredText,
  title: requiredText,
  description: text.optional(),
  items: z.array(
    z.object({
      question: requiredText,
      answer: requiredText,
    }),
  ),
});

const contactsSectionSchema = z.object({
  id: requiredText,
  title: requiredText,
  description: text.optional(),
  methods: z.array(
    z.object({
      label: requiredText,
      value: requiredText,
      href: text.optional(),
      note: text.optional(),
    }),
  ),
  links: z
    .array(
      z.object({
        label: requiredText,
        value: requiredText,
        href: text.optional(),
        note: text.optional(),
      }),
    )
    .optional(),
  offices: z
    .array(
      z.object({
        city: requiredText,
        address: requiredText,
      }),
    )
    .optional(),
});

const ctaSectionSchema = z.object({
  title: requiredText,
  description: requiredText,
  primary: contentPageLinkSchema,
  secondary: contentPageLinkSchema.optional(),
});

export const cmsContentPageSchema = z.object({
  slug: contentPageSlugSchema,
  seo: z.object({
    title: requiredText,
    description: requiredText,
  }),
  hero: contentPageHeroSchema,
  sourceNote: requiredText,
  metricsSection: metricsSectionSchema.optional(),
  bulletSections: bulletSectionsSchema.optional(),
  stepsSections: stepsSectionsSchema.optional(),
  casesSection: casesSectionSchema.optional(),
  faqSection: faqSectionSchema.optional(),
  contactsSection: contactsSectionSchema.optional(),
  cta: ctaSectionSchema,
});

export const cmsSeoBundleSchema = z.object({
  global: cmsGlobalSeoSchema,
  catalogList: cmsCatalogListSeoSchema,
  catalogDetailTemplate: cmsCatalogDetailSeoTemplateSchema,
});

export type CmsHomeLayoutDto = z.infer<typeof cmsHomeLayoutSchema>;
export type CmsHomeContentDto = z.infer<typeof cmsHomeContentSchema>;
export type CmsNavigationDto = z.infer<typeof cmsNavigationSchema>;
export type CmsFooterDto = z.infer<typeof cmsFooterSchema>;
export type CmsSeoBundleDto = z.infer<typeof cmsSeoBundleSchema>;
export type CmsCatalogLabelsDto = z.infer<typeof cmsCatalogLabelsSchema>;
export type CmsContentPageDto = z.infer<typeof cmsContentPageSchema>;
