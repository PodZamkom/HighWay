import { z } from "zod";

const imageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
] as const;

const videoMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

const allowedMimeTypes = [...imageMimeTypes, ...videoMimeTypes] as const;

const IMAGE_MAX_SIZE = 20 * 1024 * 1024;
const VIDEO_MAX_SIZE = 200 * 1024 * 1024;

export const mediaPresignRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mime: z.enum(allowedMimeTypes),
  size: z.number().int().positive(),
}).superRefine((value, ctx) => {
  const maxSize = value.mime.startsWith("video/") ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
  if (value.size > maxSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["size"],
      message: value.mime.startsWith("video/")
        ? "Видео должно быть не больше 200MB"
        : "Изображение должно быть не больше 20MB",
    });
  }
});

export const mediaCompleteRequestSchema = z.object({
  key: z.string().trim().min(1),
  mime: z.enum(allowedMimeTypes),
  size: z.number().int().positive(),
  originalName: z.string().trim().min(1).max(255),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
}).superRefine((value, ctx) => {
  const maxSize = value.mime.startsWith("video/") ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
  if (value.size > maxSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["size"],
      message: value.mime.startsWith("video/")
        ? "Видео должно быть не больше 200MB"
        : "Изображение должно быть не больше 20MB",
    });
  }
});

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export type MediaPresignRequestDto = z.infer<typeof mediaPresignRequestSchema>;
export type MediaCompleteRequestDto = z.infer<typeof mediaCompleteRequestSchema>;
