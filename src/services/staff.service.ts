import mongoose, { Types } from "mongoose";

import Staff, { type StaffStatus } from "../models/staff.model.js";
import Salon from "../models/salon.model.js";
import Service from "../models/service.model.js";
import { AppError } from "../utils/app-error.js";

import type {
  CreateStaffInput,
  UpdateStaffInput,
  StaffScheduleInput,
} from "../validators/staff.validator.js";

// ============================================================
// TYPES
// ============================================================

interface GetStaffOptions {
  page?: number;
  limit?: number;
  status?: StaffStatus;
  search?: string;
}

// ============================================================
// STAFF SERVICE
// ============================================================

class StaffService {
  // ==========================================================
  // PRIVATE: CHECK DUPLICATE KEY ERROR
  // ==========================================================

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    );
  }

  // ==========================================================
  // PRIVATE: VERIFY SALON OWNERSHIP
  // ==========================================================

  private async verifySalonOwnership(
    salonId: string,
    ownerId: string,
  ) {
    if (!mongoose.isValidObjectId(salonId)) {
      throw new AppError(400, "Invalid salon ID");
    }

    const salon = await Salon.findOne({
      _id: new Types.ObjectId(salonId),
      ownerId,
    });

    if (!salon) {
      throw new AppError(
        404,
        "Salon not found or you do not have permission to manage it",
      );
    }

    return salon;
  }

  // ==========================================================
  // PRIVATE: VERIFY SERVICE OWNERSHIP
  // ==========================================================

  private async verifyServicesBelongToSalon(
    salonId: string,
    serviceIds: string[],
  ): Promise<void> {
    if (serviceIds.length === 0) {
      return;
    }

    const uniqueIds = [...new Set(serviceIds)];

    if (uniqueIds.length !== serviceIds.length) {
      throw new AppError(
        400,
        "Duplicate service IDs are not allowed",
      );
    }

    const invalidIds = uniqueIds.filter(
      (id: string) => !mongoose.isValidObjectId(id),
    );

    if (invalidIds.length > 0) {
      throw new AppError(400, "Invalid service ID");
    }

    const services = await Service.find({
      _id: {
        $in: uniqueIds.map(
          (id: string) => new Types.ObjectId(id),
        ),
      },
      salonId: new Types.ObjectId(salonId),
      isActive: true,
    })
      .select("_id")
      .lean();

    if (services.length !== uniqueIds.length) {
      throw new AppError(
        400,
        "One or more services are invalid, inactive, or do not belong to this salon",
      );
    }
  }

  // ==========================================================
  // PRIVATE: FIND STAFF BELONGING TO OWNER'S SALON
  // ==========================================================

  private async findOwnedStaff(
    salonId: string,
    staffId: string,
    ownerId: string,
  ) {
    await this.verifySalonOwnership(salonId, ownerId);

    if (!mongoose.isValidObjectId(staffId)) {
      throw new AppError(400, "Invalid staff ID");
    }

    const staff = await Staff.findOne({
      _id: new Types.ObjectId(staffId),
      salonId: new Types.ObjectId(salonId),
    });

    if (!staff) {
      throw new AppError(
        404,
        "Staff member not found in this salon",
      );
    }

    return staff;
  }

  // ==========================================================
  // CREATE STAFF
  // ==========================================================

  async createStaff(
    ownerId: string,
    salonId: string,
    input: CreateStaffInput,
  ) {
    await this.verifySalonOwnership(salonId, ownerId);

    await this.verifyServicesBelongToSalon(
      salonId,
      input.serviceIds,
    );

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const staff = await Staff.create({
        salonId: new Types.ObjectId(salonId),

        firstName,
        lastName,
        fullName,

        email: input.email,
        phone: input.phone,

        profileImage: input.profileImage,
        bio: input.bio,

        jobTitle: input.jobTitle,
        employmentType: input.employmentType,

        serviceIds: input.serviceIds.map(
          (id: string) => new Types.ObjectId(id),
        ),

        schedule: input.schedule ?? {},

        status: "active",
        isBookable: input.isBookable,

        userId: null,
      });

      return staff;
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new AppError(
          409,
          "A staff member with this email already exists in this salon",
        );
      }

      throw error;
    }
  }

  // ==========================================================
  // GET ALL STAFF
  // ==========================================================

  async getSalonStaff(
    ownerId: string,
    salonId: string,
    options?: GetStaffOptions,
  ) {
    await this.verifySalonOwnership(salonId, ownerId);

    const page = Math.max(
      1,
      Math.floor(options?.page ?? 1),
    );

    const limit = Math.min(
      100,
      Math.max(1, Math.floor(options?.limit ?? 20)),
    );

    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      salonId: new Types.ObjectId(salonId),
    };

    if (options?.status) {
      filter.status = options.status;
    }

    const search = options?.search?.trim();

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

      filter.$or = [
        {
          firstName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          lastName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          fullName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .populate(
          "serviceIds",
          "name price durationMinutes",
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Staff.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      staff,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ==========================================================
  // GET STAFF DETAILS
  // ==========================================================

  async getStaffById(
    ownerId: string,
    salonId: string,
    staffId: string,
  ) {
    const staff = await this.findOwnedStaff(
      salonId,
      staffId,
      ownerId,
    );

    await staff.populate(
      "serviceIds",
      "name price durationMinutes isActive",
    );

    return staff;
  }

  // ==========================================================
  // UPDATE STAFF
  // ==========================================================

  async updateStaff(
    ownerId: string,
    salonId: string,
    staffId: string,
    input: UpdateStaffInput,
  ) {
    const staff = await this.findOwnedStaff(
      salonId,
      staffId,
      ownerId,
    );

    if (staff.status === "terminated") {
      throw new AppError(
        400,
        "Terminated staff members cannot be updated",
      );
    }

    if (input.firstName !== undefined) {
      staff.firstName = input.firstName.trim();
    }

    if (input.lastName !== undefined) {
      staff.lastName = input.lastName.trim();
    }

    if (
      input.firstName !== undefined ||
      input.lastName !== undefined
    ) {
      staff.fullName = [
        staff.firstName,
        staff.lastName,
      ]
        .filter(Boolean)
        .join(" ");
    }

    if (input.email !== undefined) {
      staff.email = input.email;
    }

    if (input.phone !== undefined) {
      staff.phone = input.phone;
    }

    if (input.profileImage !== undefined) {
      staff.profileImage = input.profileImage;
    }

    if (input.bio !== undefined) {
      staff.bio = input.bio;
    }

    if (input.jobTitle !== undefined) {
      staff.jobTitle = input.jobTitle;
    }

    if (input.employmentType !== undefined) {
      staff.employmentType = input.employmentType;
    }

    if (input.isBookable !== undefined) {
      if (
        staff.status !== "active" &&
        input.isBookable
      ) {
        throw new AppError(
          400,
          "Only active staff members can be bookable",
        );
      }

      staff.isBookable = input.isBookable;
    }

    try {
      await staff.save();
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new AppError(
          409,
          "A staff member with this email already exists in this salon",
        );
      }

      throw error;
    }

    return staff;
  }

  // ==========================================================
  // UPDATE STAFF SCHEDULE
  // ==========================================================

  async updateStaffSchedule(
    ownerId: string,
    salonId: string,
    staffId: string,
    schedule: StaffScheduleInput,
  ) {
    const staff = await this.findOwnedStaff(
      salonId,
      staffId,
      ownerId,
    );

    if (staff.status === "terminated") {
      throw new AppError(
        400,
        "Cannot update schedule of terminated staff",
      );
    }

    const scheduleEntries = Object.entries(schedule);

    if (scheduleEntries.length === 0) {
      throw new AppError(
        400,
        "At least one day schedule must be provided",
      );
    }

    // Update only the supplied days.
    // Existing schedules for other days remain unchanged.
    for (const [day, daySchedule] of scheduleEntries) {
      if (daySchedule !== undefined) {
        staff.set(
          `schedule.${day}`,
          daySchedule,
        );
      }
    }

    staff.markModified("schedule");

    await staff.save();

    return staff;
  }

  // ==========================================================
  // ASSIGN SERVICES
  // ==========================================================

  async assignServices(
    ownerId: string,
    salonId: string,
    staffId: string,
    serviceIds: string[],
  ) {
    const staff = await this.findOwnedStaff(
      salonId,
      staffId,
      ownerId,
    );

    if (staff.status === "terminated") {
      throw new AppError(
        400,
        "Cannot assign services to terminated staff",
      );
    }

    await this.verifyServicesBelongToSalon(
      salonId,
      serviceIds,
    );

    staff.serviceIds = serviceIds.map(
      (id: string) => new Types.ObjectId(id),
    );

    await staff.save();

    return staff;
  }

  // ==========================================================
  // UPDATE STAFF STATUS
  // ==========================================================

  async updateStaffStatus(
    ownerId: string,
    salonId: string,
    staffId: string,
    status: StaffStatus,
  ) {
    const staff = await this.findOwnedStaff(
      salonId,
      staffId,
      ownerId,
    );

    if (staff.status === "terminated") {
      throw new AppError(
        400,
        "Terminated staff status cannot be changed",
      );
    }

    if (status === "terminated") {
      staff.status = "terminated";
      staff.isBookable = false;
      staff.terminatedAt = new Date();
    } else if (status === "inactive") {
      staff.status = "inactive";
      staff.isBookable = false;
      staff.terminatedAt = null;
    } else {
      staff.status = "active";
      staff.isBookable = true;
      staff.terminatedAt = null;
    }

    await staff.save();

    return staff;
  }

  // ==========================================================
  // DELETE STAFF (SOFT DELETE)
  // ==========================================================

  async deleteStaff(
    ownerId: string,
    salonId: string,
    staffId: string,
  ) {
    const staff = await this.findOwnedStaff(
      salonId,
      staffId,
      ownerId,
    );

    if (staff.status === "terminated") {
      throw new AppError(
        400,
        "Staff member is already terminated",
      );
    }

    // Preserve historical appointments.
    // Never permanently delete staff records.
    staff.status = "terminated";
    staff.isBookable = false;
    staff.terminatedAt = new Date();

    await staff.save();

    return {
      id: staff.id,
      message: "Staff member has been terminated successfully",
    };
  }
}

// ============================================================
// EXPORT
// ============================================================

const staffService = new StaffService();

export default staffService;