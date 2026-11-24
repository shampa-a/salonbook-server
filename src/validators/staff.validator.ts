import { z } from "zod";

// ============================================================
// CONSTANTS
// ============================================================

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ============================================================
// COMMON VALIDATORS
// ============================================================

const objectIdSchema = z
  .string()
  .regex(OBJECT_ID_REGEX, "Invalid MongoDB ObjectId");

const timeSchema = z
  .string()
  .regex(TIME_REGEX, "Time must be in HH:mm format");

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(254)
  .transform((value) => value.toLowerCase());

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Phone number is too short")
  .max(20, "Phone number is too long");

const staffStatusSchema = z.enum([
  "active",
  "inactive",
  "terminated",
]);

const employmentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "freelance",
]);

// ============================================================
// BREAK VALIDATOR
// ============================================================

const breakSchema = z
  .object({
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .strict()
  .refine(
    (value) => value.endTime > value.startTime,
    {
      message: "Break end time must be after start time",
      path: ["endTime"],
    },
  );

// ============================================================
// SHIFT VALIDATOR
// ============================================================

const shiftSchema = z
  .object({
    startTime: timeSchema,
    endTime: timeSchema,
    breaks: z.array(breakSchema).default([]),
  })
  .strict()
  .superRefine((shift, ctx) => {
    if (shift.endTime <= shift.startTime) {
      ctx.addIssue({
        code: "custom",
        message: "Shift end time must be after start time",
        path: ["endTime"],
      });
    }

    const sortedBreaks = [...shift.breaks].sort(
      (a, b) => a.startTime.localeCompare(b.startTime),
    );

    for (let index = 0; index < sortedBreaks.length; index++) {
      const current = sortedBreaks[index];

      if (
        current.startTime < shift.startTime ||
        current.endTime > shift.endTime
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Break must be within the shift",
          path: ["breaks"],
        });
      }

      if (
        index > 0 &&
        current.startTime < sortedBreaks[index - 1].endTime
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Breaks cannot overlap",
          path: ["breaks"],
        });
      }
    }
  });

// ============================================================
// DAY SCHEDULE VALIDATOR
// ============================================================

const dayScheduleSchema = z
  .object({
    isDayOff: z.boolean().default(false),
    shifts: z.array(shiftSchema).default([]),
  })
  .strict()
  .superRefine((day, ctx) => {
    if (day.isDayOff && day.shifts.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "A day off cannot contain shifts",
        path: ["shifts"],
      });
    }

    const sortedShifts = [...day.shifts].sort(
      (a, b) => a.startTime.localeCompare(b.startTime),
    );

    for (let index = 1; index < sortedShifts.length; index++) {
      if (
        sortedShifts[index].startTime <
        sortedShifts[index - 1].endTime
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Shifts cannot overlap",
          path: ["shifts"],
        });
      }
    }
  });

// ============================================================
// WEEKLY SCHEDULE VALIDATOR
// ============================================================

const weeklyScheduleSchema = z
  .object({
    monday: dayScheduleSchema.optional(),
    tuesday: dayScheduleSchema.optional(),
    wednesday: dayScheduleSchema.optional(),
    thursday: dayScheduleSchema.optional(),
    friday: dayScheduleSchema.optional(),
    saturday: dayScheduleSchema.optional(),
    sunday: dayScheduleSchema.optional(),
  })
  .strict();

// ============================================================
// CREATE STAFF VALIDATOR
// ============================================================

const createStaffSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60),

    lastName: z.string().trim().min(1).max(60),

    email: emailSchema,

    phone: phoneSchema,

    profileImage: z.string().trim().max(2048).default(""),

    bio: z.string().trim().max(1000).default(""),

    jobTitle: z.string().trim().max(100).default(""),

    employmentType: employmentTypeSchema.default("full_time"),

    serviceIds: z
      .array(objectIdSchema)
      .max(100)
      .default([])
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Duplicate service IDs are not allowed",
      ),

    schedule: weeklyScheduleSchema.optional(),

    isBookable: z.boolean().default(true),
  })
  .strict();

// ============================================================
// UPDATE STAFF VALIDATOR
// ============================================================

const updateStaffSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),

    lastName: z.string().trim().min(1).max(60).optional(),

    email: emailSchema.optional(),

    phone: phoneSchema.optional(),

    profileImage: z.string().trim().max(2048).optional(),

    bio: z.string().trim().max(1000).optional(),

    jobTitle: z.string().trim().max(100).optional(),

    employmentType: employmentTypeSchema.optional(),

    isBookable: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  );

// ============================================================
// UPDATE SCHEDULE VALIDATOR
// ============================================================

const updateStaffScheduleSchema = z
  .object({
    schedule: weeklyScheduleSchema,
  })
  .strict()
  .refine(
    (value) => Object.keys(value.schedule).length > 0,
    "At least one day schedule must be provided",
  );

// ============================================================
// ASSIGN SERVICES VALIDATOR
// ============================================================

const assignStaffServicesSchema = z
  .object({
    serviceIds: z
      .array(objectIdSchema)
      .max(100)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Duplicate service IDs are not allowed",
      ),
  })
  .strict();

// ============================================================
// UPDATE STAFF STATUS VALIDATOR
// ============================================================

const updateStaffStatusSchema = z
  .object({
    status: staffStatusSchema,
  })
  .strict();

// ============================================================
// PARAMS VALIDATORS
// ============================================================

const staffIdParamsSchema = z
  .object({
    staffId: objectIdSchema,
  })
  .strict();

const salonIdParamsSchema = z
  .object({
    salonId: objectIdSchema,
  })
  .strict();

// ============================================================
// EXPORT SCHEMAS
// ============================================================

export {
  createStaffSchema,
  updateStaffSchema,
  updateStaffScheduleSchema,
  assignStaffServicesSchema,
  updateStaffStatusSchema,
  staffIdParamsSchema,
  salonIdParamsSchema,
};

// ============================================================
// EXPORT TYPES
// ============================================================

export type CreateStaffInput = z.infer<
  typeof createStaffSchema
>;

export type UpdateStaffInput = z.infer<
  typeof updateStaffSchema
>;

export type UpdateStaffScheduleInput = z.infer<
  typeof updateStaffScheduleSchema
>;

export type AssignStaffServicesInput = z.infer<
  typeof assignStaffServicesSchema
>;

export type UpdateStaffStatusInput = z.infer<
  typeof updateStaffStatusSchema
>;

export type StaffScheduleInput = z.infer<
  typeof weeklyScheduleSchema
>;