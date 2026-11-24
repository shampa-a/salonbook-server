import { randomBytes } from "node:crypto";

import Salon from "../models/salon.model.js";

import { AppError } from "../utils/app-error.js";

import type {
  CreateSalonApplicationInput,
} from "../validators/salon.validator.js";

// ============================================================
// SALON SERVICE
// ============================================================

class SalonService {
  // ==========================================================
  // GENERATE UNIQUE SLUG
  // ==========================================================

  private async generateUniqueSlug(
    salonName: string,
  ): Promise<string> {
    const baseSlug = salonName
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 140);

    const safeBase = baseSlug || "salon";

    // A random suffix avoids predictable slug collisions.
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = randomBytes(4).toString("hex");

      const slug = `${safeBase}-${suffix}`;

      const existing = await Salon.exists({ slug });

      if (!existing) {
        return slug;
      }
    }

    throw new AppError(
      500,
      "Unable to generate a unique salon URL",
    );
  }

  // ==========================================================
  // CREATE SALON APPLICATION
  // ==========================================================

  async createApplication(
    ownerId: string,
    input: CreateSalonApplicationInput,
  ) {
    const normalizedName = input.name.trim();

    // Prevent accidental duplicate pending applications.
    const existingApplication = await Salon.findOne({
      ownerId,
      name: {
        $regex: `^${normalizedName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}$`,
        $options: "i",
      },
      status: "pending",
    }).select("_id");

    if (existingApplication) {
      throw new AppError(
        409,
        "You already have a pending application for this salon",
      );
    }

    const slug = await this.generateUniqueSlug(
      normalizedName,
    );

    try {
      const salon = await Salon.create({
        ownerId,

        name: normalizedName,
        slug,

        description: input.description,

        email: input.email,
        phone: input.phone,
        website: input.website,

        address: input.address,

        // These values are controlled by the backend.
        status: "pending",
        isPublished: false,

        approvedAt: null,
        approvedBy: null,
        rejectionReason: "",
      });

      return salon;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new AppError(
          409,
          "A salon with a conflicting URL already exists. Please try again.",
        );
      }

      throw error;
    }
  }

  // ==========================================================
  // GET MY SALON APPLICATIONS
  // ==========================================================

  async getMyApplications(ownerId: string) {
    const salons = await Salon.find({ ownerId })
      .select(
        [
          "_id",
          "name",
          "slug",
          "description",
          "email",
          "phone",
          "website",
          "address",
          "status",
          "isPublished",
          "rejectionReason",
          "approvedAt",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .lean();

    return salons;
  }
}

// ============================================================
// EXPORT
// ============================================================

const salonService = new SalonService();

export default salonService;