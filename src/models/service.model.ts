import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * Service image interface
 */
export interface IServiceImage {
  url: string;
  altText: string;
}

/**
 * Salon Service interface
 */
export interface IService extends Document {
  salonId: Types.ObjectId;
  categoryId: Types.ObjectId;

  name: string;
  slug: string;
  description: string;

  price: number;
  discountPrice: number | null;

  currency: "BDT";
  durationMinutes: number;

  images: IServiceImage[];

  isActive: boolean;
  isOnlineBookingEnabled: boolean;
  isFeatured: boolean;

  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service image schema
 */
const serviceImageSchema = new Schema<IServiceImage>(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
      maxlength: [2048, "Image URL cannot exceed 2048 characters"],
    },

    altText: {
      type: String,
      trim: true,
      maxlength: [200, "Alt text cannot exceed 200 characters"],
      default: "",
    },
  },
  {
    _id: false,
  }
);

/**
 * Service schema
 */
const serviceSchema = new Schema<IService>(
  {
    /**
     * Salon ownership
     *
     * Every service belongs to a specific salon.
     */
    salonId: {
      type: Schema.Types.ObjectId,
      ref: "Salon",
      required: [true, "Salon ID is required"],
      index: true,
    },

    /**
     * Global service category
     *
     * Example:
     * Haircut & Styling
     * Facial & Skincare
     */
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Service category is required"],
    },

    /**
     * Service information
     */
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      minlength: [2, "Service name must be at least 2 characters"],
      maxlength: [120, "Service name cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      required: [true, "Service slug is required"],
      trim: true,
      lowercase: true,
      maxlength: [150, "Service slug cannot exceed 150 characters"],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers and hyphens",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },

    /**
     * Pricing
     *
     * Prices are stored as whole BDT amounts.
     * Example: 1500 means ৳1,500.
     */
    price: {
      type: Number,
      required: [true, "Service price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Price must be a whole BDT amount",
      },
    },

    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function (this: IService, value: number | null) {
          if (value === null || value === undefined) {
            return true;
          }

          return Number.isInteger(value) && value < this.price;
        },
        message:
          "Discount price must be a whole number and lower than regular price",
      },
    },

    currency: {
      type: String,
      enum: ["BDT"],
      default: "BDT",
      required: true,
    },

    /**
     * Service duration in minutes
     */
    durationMinutes: {
      type: Number,
      required: [true, "Service duration is required"],
      min: [5, "Service duration must be at least 5 minutes"],
      max: [1440, "Service duration cannot exceed 24 hours"],
      validate: {
        validator: Number.isInteger,
        message: "Duration must be a whole number",
      },
    },

    /**
     * Service images
     */
    images: {
      type: [serviceImageSchema],
      default: [],
      validate: {
        validator: (images: IServiceImage[]) => images.length <= 10,
        message: "A service cannot have more than 10 images",
      },
    },

    /**
     * Service status
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * Customers can book this service online.
     */
    isOnlineBookingEnabled: {
      type: Boolean,
      default: true,
    },

    /**
     * Featured services can be highlighted
     * on the salon's public page.
     */
    isFeatured: {
      type: Boolean,
      default: false,
    },

    /**
     * Display ordering
     */
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, "Sort order cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Sort order must be a whole number",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Compound indexes
 *
 * A salon cannot create two services with the same slug.
 * Different salons can use the same slug.
 */
serviceSchema.index(
  { salonId: 1, slug: 1 },
  { unique: true, name: "unique_service_slug_per_salon" }
);

/**
 * Efficient category filtering within a salon.
 */
serviceSchema.index(
  { salonId: 1, categoryId: 1, isActive: 1, sortOrder: 1 },
  { name: "salon_services_by_category" }
);

/**
 * Efficient public service listing.
 */
serviceSchema.index(
  { salonId: 1, isActive: 1, isOnlineBookingEnabled: 1 },
  { name: "salon_active_bookable_services" }
);

/**
 * Prevent model recompilation errors during development.
 */
const Service =
  mongoose.models.Service ||
  mongoose.model<IService>("Service", serviceSchema);

export default Service;