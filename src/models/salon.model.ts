import mongoose, { Document, Model, Schema } from "mongoose";

// Weekly business hours
export interface IDaySchedule {
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}

export interface IOpeningHours {
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
}

// Salon address
export interface ISalonAddress {
  country: string;
  city: string;
  state: string;
  area: string;
  street: string;
  postalCode: string;
}

// Salon status
export type SalonStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

// Main Salon interface
export interface ISalon extends Document {
  ownerId: string;

  name: string;
  slug: string;
  description: string;

  logo: string;
  coverImage: string;

  email: string;
  phone: string;
  website: string;

  address: ISalonAddress;

  openingHours: IOpeningHours;

  timezone: string;
  currency: string;

  status: SalonStatus;
  isPublished: boolean;

  rejectionReason: string;

  approvedAt: Date | null;
  approvedBy: string | null;

  createdAt: Date;
  updatedAt: Date;
}

// Reusable daily schedule schema
const dayScheduleSchema = new Schema<IDaySchedule>(
  {
    isClosed: {
      type: Boolean,
      default: false,
    },

    openTime: {
      type: String,
      default: "09:00",
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid opening time"],
    },

    closeTime: {
      type: String,
      default: "18:00",
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid closing time"],
    },
  },
  {
    _id: false,
  },
);

// Opening hours schema
const openingHoursSchema = new Schema<IOpeningHours>(
  {
    monday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    tuesday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    wednesday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    thursday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    friday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    saturday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    sunday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  },
);

// Address schema
const salonAddressSchema = new Schema<ISalonAddress>(
  {
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "Bangladesh",
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
    },

    street: {
      type: String,
      default: "",
      trim: true,
    },

    postalCode: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

// Main Salon schema
const salonSchema = new Schema<ISalon>(
  {
    ownerId: {
      type: String,
      required: [true, "Salon owner is required"],
      index: true,
    },

    name: {
      type: String,
      required: [true, "Salon name is required"],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: [true, "Salon slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Please provide a valid salon slug",
      ],
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    logo: {
      type: String,
      default: "",
      trim: true,
    },

    coverImage: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Salon email is required"],
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      required: [true, "Salon phone number is required"],
      trim: true,
      maxlength: 30,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: salonAddressSchema,
      required: true,
    },

    openingHours: {
      type: openingHoursSchema,
      default: () => ({}),
    },

    timezone: {
      type: String,
      default: "Asia/Dhaka",
      trim: true,
    },

    currency: {
      type: String,
      default: "BDT",
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
salonSchema.index({
  ownerId: 1,
  status: 1,
});

salonSchema.index({
  status: 1,
  isPublished: 1,
});

salonSchema.index({
  "address.city": 1,
  status: 1,
  isPublished: 1,
});

// Prevent model recompilation
const Salon: Model<ISalon> =
  mongoose.models.Salon ||
  mongoose.model<ISalon>("Salon", salonSchema);

export default Salon;