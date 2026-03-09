import { z } from "zod";

const text = z.string().trim();
const requiredText = text.min(1);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9-]*$/i, "Некорректный slug");

const newsStatusSchema = z.enum(["draft", "scheduled", "published", "archived"]);

const linkSchema = z.object({
  label: requiredText,
  href: requiredText,
});

const mediaRefSchema = z.object({
  mediaAssetId: z.string().uuid().nullable().default(null),
  url: requiredText,
  alt: text.default(""),
});

const newsTextBlockSchema = z.object({
  id: requiredText,
  type: z.literal("text"),
  heading: text.optional(),
  body: requiredText,
});

const newsImageBlockSchema = z.object({
  id: requiredText,
  type: z.literal("image"),
  image: mediaRefSchema,
  caption: text.optional(),
});

const newsVideoBlockSchema = z
  .object({
    id: requiredText,
    type: z.literal("video"),
    videoFile: mediaRefSchema.nullable().optional(),
    embedUrl: text.optional(),
    caption: text.optional(),
  })
  .superRefine((value, ctx) => {
    const hasFile = Boolean(value.videoFile?.url);
    const hasEmbed = Boolean(value.embedUrl);

    if (!hasFile && !hasEmbed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoFile"],
        message: "Укажите videoFile или embedUrl",
      });
      return;
    }

    if (value.embedUrl && !/^https?:\/\//i.test(value.embedUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["embedUrl"],
        message: "embedUrl должен начинаться с http:// или https://",
      });
    }
  });

const newsQuoteBlockSchema = z.object({
  id: requiredText,
  type: z.literal("quote"),
  quote: requiredText,
  author: text.optional(),
});

export const newsBlockSchema = z.discriminatedUnion("type", [
  newsTextBlockSchema,
  newsImageBlockSchema,
  newsVideoBlockSchema,
  newsQuoteBlockSchema,
]);

export const newsFaqItemSchema = z.object({
  question: requiredText,
  answer: requiredText,
});

export const newsCtaSchema = z.object({
  title: requiredText,
  description: text.optional(),
  primary: linkSchema,
  secondary: linkSchema.optional(),
});

export const newsSeoOverrideSchema = z.object({
  title: text.optional(),
  description: text.optional(),
  keywords: text.optional(),
  canonical: text.optional(),
  ogImage: text.optional(),
});

const newsCoreSchema = z.object({
  slug: slugSchema,
  title: requiredText,
  lead: requiredText,
  excerpt: requiredText,
  status: newsStatusSchema,
  publishedAt: z.string().datetime().nullable().optional(),
  isPinned: z.boolean().default(false),
  category: text.default(""),
  tags: z.array(requiredText).default([]),
  cover: mediaRefSchema.nullable().optional(),
  blocks: z.array(newsBlockSchema).default([]),
  faq: z.array(newsFaqItemSchema).default([]),
  cta: newsCtaSchema.nullable().optional(),
  seoOverride: newsSeoOverrideSchema.default({}),
});

export const newsCreateSchema = newsCoreSchema;

export const newsUpdateSchema = newsCoreSchema.partial();

export const newsStatusPatchSchema = z
  .object({
    status: newsStatusSchema,
    publishedAt: z.string().datetime().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled" && !value.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "Для scheduled обязательно publishedAt",
      });
    }
  });

export const newsAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: text.optional(),
  status: newsStatusSchema.optional(),
  category: text.optional(),
  tag: text.optional(),
  includeArchived: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export const newsPublicListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  search: text.optional(),
  category: text.optional(),
  tag: text.optional(),
});

export const newsIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const newsSlugParamSchema = z.object({
  slug: slugSchema,
});

export const newsSettingsSchema = z.object({
  pageEyebrow: requiredText,
  pageTitle: requiredText,
  pageDescription: requiredText,
  seo: z.object({
    title: requiredText,
    description: requiredText,
    keywords: requiredText,
    ogImage: requiredText,
    canonical: requiredText,
    schemaName: requiredText,
    schemaDescription: requiredText,
  }),
  list: z.object({
    pageSize: z.number().int().min(1).max(100).default(12),
    enableSearch: z.boolean().default(true),
    enableFilters: z.boolean().default(true),
  }),
});

export type NewsCreateDto = z.infer<typeof newsCreateSchema>;
export type NewsUpdateDto = z.infer<typeof newsUpdateSchema>;
export type NewsStatusPatchDto = z.infer<typeof newsStatusPatchSchema>;
export type NewsAdminListQueryDto = z.infer<typeof newsAdminListQuerySchema>;
export type NewsPublicListQueryDto = z.infer<typeof newsPublicListQuerySchema>;
export type NewsSettingsDto = z.infer<typeof newsSettingsSchema>;
