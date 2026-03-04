import { z } from "zod";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
] as const;

export const mediaPresignRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mime: z.enum(allowedMimeTypes),
  size: z.number().int().positive().max(20 * 1024 * 1024),
});

export const mediaCompleteRequestSchema = z.object({
  key: z.string().trim().min(1),
  mime: z.enum(allowedMimeTypes),
  size: z.number().int().positive().max(20 * 1024 * 1024),
  originalName: z.string().trim().min(1).max(255),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export type MediaPresignRequestDto = z.infer<typeof mediaPresignRequestSchema>;
export type MediaCompleteRequestDto = z.infer<typeof mediaCompleteRequestSchema>;
