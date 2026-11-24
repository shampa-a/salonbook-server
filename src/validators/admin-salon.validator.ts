import { z } from "zod";

export const applicationListQuerySchema = z.object({
  status: z
    .enum(["pending", "approved", "rejected", "suspended", "all"])
    .default("pending"),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const rejectApplicationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Rejection reason must be at least 10 characters")
    .max(1000, "Rejection reason cannot exceed 1000 characters"),
});

export const applicationIdSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid application ID"),
});

export type ApplicationListQuery = z.infer<
  typeof applicationListQuerySchema
>;

export type RejectApplicationInput = z.infer<
  typeof rejectApplicationSchema
>;