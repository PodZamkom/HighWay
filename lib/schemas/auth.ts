import { z } from "zod";

export const adminLoginRequestSchema = z.object({
  login: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(500),
});

export type AdminLoginRequestDto = z.infer<typeof adminLoginRequestSchema>;
