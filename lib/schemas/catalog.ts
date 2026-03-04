import { z } from "zod";

const idSchema = z.string().trim().min(1).max(200);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9-]*$/i, "Некорректный slug");
const text = z.string().trim();
const requiredText = text.min(1);

const marketSchema = z.enum(["China", "USA", "Korea", "Europe"]);
const conditionSchema = z.enum(["New", "Used", "Crashed"]);
const availabilitySchema = z.enum(["InStock", "EnRoute", "OnOrder"]);
const priceTypeSchema = z.enum(["FOB", "EXW", "OnRoad", "Estimate"]);
const carTypeSchema = z.enum(["EV", "EREV", "ICE", "HEV"]);

export const catalogCarImageInputSchema = z.object({
  id: z.number().int().positive().optional(),
  mediaAssetId: z.string().uuid().nullable().optional(),
  url: requiredText,
  alt: text.default(""),
  sortOrder: z.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

export const catalogCarInputSchema = z.object({
  id: idSchema.optional(),
  slug: slugSchema,
  brand: requiredText,
  model: requiredText,
  generation: text.default(""),
  year: z.number().int().min(1900).max(2100),
  condition: conditionSchema,
  mileageKm: z.number().int().min(0).nullable().optional(),
  priceValue: z.number().nonnegative(),
  priceCurrency: z.enum(["USD", "CNY", "EUR", "KRW"]),
  priceType: priceTypeSchema,
  availability: availabilitySchema,
  market: marketSchema,
  type: carTypeSchema.nullable().optional(),
  bodyType: text.default(""),
  transmission: text.default(""),
  drive: text.default(""),
  description: text.default(""),
  images: z.array(catalogCarImageInputSchema).default([]),
});

export const catalogCarPatchSchema = catalogCarInputSchema.partial().extend({
  id: idSchema.optional(),
  slug: slugSchema.optional(),
  images: z.array(catalogCarImageInputSchema).optional(),
});

export const catalogCarListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  search: text.optional(),
  market: marketSchema.optional(),
  availability: availabilitySchema.optional(),
  includeArchived: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export const catalogArchiveRequestSchema = z.object({
  archived: z.boolean(),
});

export const catalogImportApplySchema = z.object({
  apply: z.boolean().default(true),
});

export type CatalogCarInputDto = z.infer<typeof catalogCarInputSchema>;
export type CatalogCarPatchDto = z.infer<typeof catalogCarPatchSchema>;
export type CatalogCarImageInputDto = z.infer<typeof catalogCarImageInputSchema>;
