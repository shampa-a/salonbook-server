import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../utils/app-error.js";

import staffService from "../services/staff.service.js";

import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffScheduleSchema,
  assignStaffServicesSchema,
  updateStaffStatusSchema,
} from "../validators/staff.validator.js";

// ============================================================
// TYPES
// ============================================================

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

// ============================================================
// HELPERS
// ============================================================

const getRouteParam = (
  value: string | string[] | undefined,
  paramName: string,
): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(
      400,
      `Invalid or missing ${paramName}`,
    );
  }

  return value.trim();
};

const getOwnerId = (req: Request): string => {
  const ownerId = req.authUser?.id;

  if (!ownerId) {
    throw new AppError(
      401,
      "Authentication required",
    );
  }

  return ownerId;
};

const getQueryValue = (
  value: unknown,
): string | undefined => {
  if (typeof value === "string") {
    return value.trim();
  }

  return undefined;
};

const parsePositiveInteger = (
  value: string | undefined,
  defaultValue: number,
  fieldName: string,
): number => {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    throw new AppError(
      400,
      `${fieldName} must be a positive integer`,
    );
  }

  return parsed;
};

// ============================================================
// STAFF CONTROLLER
// ============================================================

class StaffController {
  // ==========================================================
  // CREATE STAFF
  // POST /api/v1/staff/:salonId
  // ==========================================================

  createStaff: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const validation = createStaffSchema.safeParse(
        req.body,
      );

      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.issues
            .map((issue) => issue.message)
            .join(", "),
        );
      }

      const staff = await staffService.createStaff(
        ownerId,
        salonId,
        validation.data,
      );

      res.status(201).json({
        success: true,
        message: "Staff member created successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // GET ALL STAFF
  // GET /api/v1/staff/:salonId
  // ==========================================================

  getSalonStaff: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const page = parsePositiveInteger(
        getQueryValue(req.query.page),
        1,
        "Page",
      );

      const limit = parsePositiveInteger(
        getQueryValue(req.query.limit),
        20,
        "Limit",
      );

      if (limit > 100) {
        throw new AppError(
          400,
          "Limit cannot exceed 100",
        );
      }

      const status = getQueryValue(
        req.query.status,
      );

      const allowedStatuses = [
        "active",
        "inactive",
        "terminated",
      ] as const;

      if (
        status &&
        !allowedStatuses.includes(
          status as (typeof allowedStatuses)[number],
        )
      ) {
        throw new AppError(
          400,
          "Invalid staff status filter",
        );
      }

      const search = getQueryValue(
        req.query.search,
      );

      const result = await staffService.getSalonStaff(
        ownerId,
        salonId,
        {
          page,
          limit,
          status: status as
            | "active"
            | "inactive"
            | "terminated"
            | undefined,
          search,
        },
      );

      res.status(200).json({
        success: true,
        message: "Staff members retrieved successfully",
        data: result.staff,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // GET STAFF DETAILS
  // GET /api/v1/staff/:salonId/:staffId
  // ==========================================================

  getStaffById: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const staffId = getRouteParam(
        req.params.staffId,
        "staffId",
      );

      const staff = await staffService.getStaffById(
        ownerId,
        salonId,
        staffId,
      );

      res.status(200).json({
        success: true,
        message: "Staff member retrieved successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // UPDATE STAFF
  // PATCH /api/v1/staff/:salonId/:staffId
  // ==========================================================

  updateStaff: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const staffId = getRouteParam(
        req.params.staffId,
        "staffId",
      );

      const validation = updateStaffSchema.safeParse(
        req.body,
      );

      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.issues
            .map((issue) => issue.message)
            .join(", "),
        );
      }

      const staff = await staffService.updateStaff(
        ownerId,
        salonId,
        staffId,
        validation.data,
      );

      res.status(200).json({
        success: true,
        message: "Staff member updated successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // UPDATE STAFF SCHEDULE
  // PATCH /api/v1/staff/:salonId/:staffId/schedule
  // ==========================================================

  updateStaffSchedule: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const staffId = getRouteParam(
        req.params.staffId,
        "staffId",
      );

      const validation =
        updateStaffScheduleSchema.safeParse(
          req.body,
        );

      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.issues
            .map((issue) => issue.message)
            .join(", "),
        );
      }

      const staff =
        await staffService.updateStaffSchedule(
          ownerId,
          salonId,
          staffId,
          validation.data.schedule,
        );

      res.status(200).json({
        success: true,
        message: "Staff schedule updated successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // ASSIGN SERVICES
  // PUT /api/v1/staff/:salonId/:staffId/services
  // ==========================================================

  assignServices: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const staffId = getRouteParam(
        req.params.staffId,
        "staffId",
      );

      const validation =
        assignStaffServicesSchema.safeParse(
          req.body,
        );

      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.issues
            .map((issue) => issue.message)
            .join(", "),
        );
      }

      const staff = await staffService.assignServices(
        ownerId,
        salonId,
        staffId,
        validation.data.serviceIds,
      );

      res.status(200).json({
        success: true,
        message: "Staff services assigned successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // UPDATE STAFF STATUS
  // PATCH /api/v1/staff/:salonId/:staffId/status
  // ==========================================================

  updateStaffStatus: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const staffId = getRouteParam(
        req.params.staffId,
        "staffId",
      );

      const validation =
        updateStaffStatusSchema.safeParse(
          req.body,
        );

      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.issues
            .map((issue) => issue.message)
            .join(", "),
        );
      }

      const staff = await staffService.updateStaffStatus(
        ownerId,
        salonId,
        staffId,
        validation.data.status,
      );

      res.status(200).json({
        success: true,
        message: "Staff status updated successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // DELETE STAFF
  // DELETE /api/v1/staff/:salonId/:staffId
  // ==========================================================

  deleteStaff: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salonId = getRouteParam(
        req.params.salonId,
        "salonId",
      );

      const staffId = getRouteParam(
        req.params.staffId,
        "staffId",
      );

      const result = await staffService.deleteStaff(
        ownerId,
        salonId,
        staffId,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          id: result.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================
// EXPORT
// ============================================================

const staffController = new StaffController();

export default staffController;