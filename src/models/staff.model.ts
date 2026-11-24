import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

// ============================================================
// CONSTANTS
// ============================================================

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ============================================================
// TYPES
// ============================================================

export type StaffStatus =
  | "active"
  | "inactive"
  | "terminated";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance";

// Break time
export interface IStaffBreak {
  startTime: string;
  endTime: string;
}

// Working shift
export interface IStaffShift {
  startTime: string;
  endTime: string;
  breaks: IStaffBreak[];
}

// Daily schedule
export interface IStaffDaySchedule {
  isDayOff: boolean;
  shifts: IStaffShift[];
}

// Weekly schedule
export interface IStaffSchedule {
  monday: IStaffDaySchedule;
  tuesday: IStaffDaySchedule;
  wednesday: IStaffDaySchedule;
  thursday: IStaffDaySchedule;
  friday: IStaffDaySchedule;
  saturday: IStaffDaySchedule;
  sunday: IStaffDaySchedule;
}

// Main Staff interface
export interface IStaff extends Document {
  salonId: Types.ObjectId;

  // Optional Better Auth account
  userId: string | null;

  firstName: string;
  lastName: string;
  fullName: string;

  email: string;
  phone: string;

  profileImage: string;
  bio: string;

  jobTitle: string;
  employmentType: EmploymentType;

  // Services assigned to this staff member
  serviceIds: Types.ObjectId[];

  // Weekly working schedule
  schedule: IStaffSchedule;

  status: StaffStatus;

  isBookable: boolean;

  joinedAt: Date;
  terminatedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// BREAK SCHEMA
// ============================================================

const staffBreakSchema = new Schema<IStaffBreak>(
  {
    startTime: {
      type: String,
      required: [true, "Break start time is required"],
      match: [
        TIME_REGEX,
        "Invalid break start time. Use HH:mm format",
      ],
    },

    endTime: {
      type: String,
      required: [true, "Break end time is required"],
      match: [
        TIME_REGEX,
        "Invalid break end time. Use HH:mm format",
      ],
    },
  },
  {
    _id: false,
  },
);

// ============================================================
// SHIFT SCHEMA
// ============================================================

const staffShiftSchema = new Schema<IStaffShift>(
  {
    startTime: {
      type: String,
      required: [true, "Shift start time is required"],
      match: [
        TIME_REGEX,
        "Invalid shift start time. Use HH:mm format",
      ],
    },

    endTime: {
      type: String,
      required: [true, "Shift end time is required"],
      match: [
        TIME_REGEX,
        "Invalid shift end time. Use HH:mm format",
      ],
    },

    breaks: {
      type: [staffBreakSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

// ============================================================
// DAILY SCHEDULE SCHEMA
// ============================================================

const staffDayScheduleSchema =
  new Schema<IStaffDaySchedule>(
    {
      isDayOff: {
        type: Boolean,
        default: false,
      },

      shifts: {
        type: [staffShiftSchema],
        default: [],
      },
    },
    {
      _id: false,
    },
  );

// ============================================================
// WEEKLY SCHEDULE SCHEMA
// ============================================================

const staffScheduleSchema = new Schema<IStaffSchedule>(
  {
    monday: {
      type: staffDayScheduleSchema,
      default: () => ({}),
    },

    tuesday: {
      type: staffDayScheduleSchema,
      default: () => ({}),
    },

    wednesday: {
      type: staffDayScheduleSchema,
      default: () => ({}),
    },

    thursday: {
      type: staffDayScheduleSchema,
      default: () => ({}),
    },

    friday: {
      type: staffDayScheduleSchema,
      default: () => ({}),
    },

    saturday: {
      type: staffDayScheduleSchema,
      default: () => ({}),
    },

    sunday: {
      type: staffDayScheduleSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  },
);

// ============================================================
// MAIN STAFF SCHEMA
// ============================================================

const staffSchema = new Schema<IStaff>(
  {
    // Salon relationship
    salonId: {
      type: Schema.Types.ObjectId,
      ref: "Salon",
      required: [true, "Salon ID is required"],
      index: true,
    },

    // Optional Better Auth user ID
    userId: {
      type: String,
      default: null,
      trim: true,
    },

    // Personal information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must contain at least 2 characters"],
      maxlength: [80, "First name cannot exceed 80 characters"],
    },

    lastName: {
      type: String,
      default: "",
      trim: true,
      maxlength: [80, "Last name cannot exceed 80 characters"],
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [160, "Full name cannot exceed 160 characters"],
    },

    email: {
      type: String,
      required: [true, "Staff email is required"],
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
    },

    phone: {
      type: String,
      required: [true, "Staff phone number is required"],
      trim: true,
      maxlength: [30, "Phone number cannot exceed 30 characters"],
    },

    // Profile information
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },

    // Professional information
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },

    employmentType: {
      type: String,
      enum: {
        values: [
          "full_time",
          "part_time",
          "contract",
          "freelance",
        ],
        message: "Invalid employment type",
      },
      default: "full_time",
    },

    // Assigned services
    serviceIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Service",
        },
      ],
      default: [],
    },

    // Working schedule
    schedule: {
      type: staffScheduleSchema,
      default: () => ({}),
    },

    // Staff account status
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "terminated"],
        message: "Invalid staff status",
      },
      default: "active",
      index: true,
    },

    // Booking availability
    isBookable: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Employment dates
    joinedAt: {
      type: Date,
      default: Date.now,
    },

    terminatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================================
// DATABASE INDEXES
// ============================================================

// Find staff belonging to a salon
staffSchema.index({
  salonId: 1,
  status: 1,
});

// Find available staff for booking
staffSchema.index({
  salonId: 1,
  isBookable: 1,
  status: 1,
});

// Find staff eligible for a specific service
staffSchema.index({
  salonId: 1,
  serviceIds: 1,
  status: 1,
});

// Prevent duplicate email within the same salon
staffSchema.index(
  {
    salonId: 1,
    email: 1,
  },
  {
    unique: true,
  },
);

// Prevent one Better Auth account from being assigned
// to multiple staff records.
staffSchema.index(
  {
    userId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      userId: {
        $type: "string",
      },
    },
  },
);

// ============================================================
// MODEL
// ============================================================

const Staff: Model<IStaff> =
  mongoose.models.Staff ||
  mongoose.model<IStaff>("Staff", staffSchema);

export default Staff;