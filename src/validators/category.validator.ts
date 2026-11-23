import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must contain at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Category slug is required")
    .max(120, "Category slug cannot exceed 120 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens"
    ),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),

  image: z
    .string()
    .trim()
    .max(2048, "Image URL is too long")
    .optional()
    .default(""),

  icon: z
    .string()
    .trim()
    .max(50, "Icon name cannot exceed 50 characters")
    .optional()
    .default("scissors"),

  isActive: z.boolean().optional().default(true),

  sortOrder: z
    .number()
    .int("Sort order must be an integer")
    .min(0, "Sort order cannot be negative")
    .optional()
    .default(0),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );

export const categoryQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  sortBy: z
    .enum(["name", "sortOrder", "createdAt"])
    .default("sortOrder"),

  order: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;

export type UpdateCategoryInput = z.infer<
  typeof updateCategorySchema
>;

export type CategoryQueryInput = z.infer<
  typeof categoryQuerySchema
>;