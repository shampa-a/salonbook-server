import { z } from "zod";

// ============================================================
// COMMON VALIDATORS
// ============================================================

const emailSchema = z
  .string()
  .trim()
  .email("Please provide a valid email address")
  .max(254)
  .transform((value) => value.toLowerCase());

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Phone number is too short")
  .max(30, "Phone number is too long");

// ============================================================
// WEBSITE VALIDATOR
// ============================================================

const websiteSchema = z
  .string()
  .trim()
  .max(2048)
  .default("")
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);

      return (
        url.protocol === "https:" ||
        url.protocol === "http:"
      );
    } catch {
      return false;
    }
  }, "Please provide a valid website URL");

// ============================================================
// SALON APPLICATION VALIDATOR
// ============================================================

export const createSalonApplicationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Salon name must contain at least 2 characters")
      .max(150),

    description: z
      .string()
      .trim()
      .max(2000)
      .default(""),

    email: emailSchema,

    phone: phoneSchema,

    website: websiteSchema,

    address: z
      .object({
        country: z
          .string()
          .trim()
          .min(2)
          .max(100)
          .default("Bangladesh"),

        city: z
          .string()
          .trim()
          .min(2, "City is required")
          .max(100),

        state: z
          .string()
          .trim()
          .max(100)
          .default(""),

        area: z
          .string()
          .trim()
          .min(2, "Area is required")
          .max(150),

        street: z
          .string()
          .trim()
          .max(250)
          .default(""),

        postalCode: z
          .string()
          .trim()
          .max(20)
          .default(""),
      })
      .strict(),
  })
  .strict();

// ============================================================
// TYPES
// ============================================================

export type CreateSalonApplicationInput = z.infer<
  typeof createSalonApplicationSchema
>;