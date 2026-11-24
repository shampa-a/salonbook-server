import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../utils/app-error.js";

import {
  applicationIdSchema,
  applicationListQuerySchema,
  rejectApplicationSchema,
} from "../validators/admin-salon.validator.js";

import {
  getApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
} from "../services/admin-salon.service.js";

const getAdminId = (req: Request): string => {
  const adminId = req.authUser?.id;

  if (!adminId) {
    throw new AppError(401, "Authentication required");
  }

  return adminId;
};

// GET /applications

export const getApplicationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = applicationListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(400, "Invalid application query");
    }

    const result = await getApplications(parsed.data);

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// GET /applications/:id

export const getApplicationDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = applicationIdSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError(400, "Invalid application ID");
    }

    const result = await getApplicationById(parsed.data.id);

    res.status(200).json({
      success: true,
      message: "Application details retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /applications/:id/approve

export const approveApplicationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = applicationIdSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError(400, "Invalid application ID");
    }

    const adminId = getAdminId(req);

    const result = await approveApplication(
      parsed.data.id,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Salon application approved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /applications/:id/reject

export const rejectApplicationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedId = applicationIdSchema.safeParse(req.params);

    if (!parsedId.success) {
      throw new AppError(400, "Invalid application ID");
    }

    const parsedBody = rejectApplicationSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        400,
        parsedBody.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }

    const result = await rejectApplication(
      parsedId.data.id,
      parsedBody.data.reason
    );

    res.status(200).json({
      success: true,
      message: "Salon application rejected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};