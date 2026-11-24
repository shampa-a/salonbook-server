import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../utils/app-error.js";

import salonService from "../services/salon.service.js";

import {
  createSalonApplicationSchema,
} from "../validators/salon.validator.js";

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

// ============================================================
// SALON CONTROLLER
// ============================================================

class SalonController {
  // ==========================================================
  // SUBMIT SALON APPLICATION
  // POST /api/v1/salons/applications
  // ==========================================================

  createApplication: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const validation =
        createSalonApplicationSchema.safeParse(
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

      const salon =
        await salonService.createApplication(
          ownerId,
          validation.data,
        );

      res.status(201).json({
        success: true,
        message:
          "Your salon application has been submitted successfully. It is awaiting admin approval.",
        data: salon,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================
  // GET MY SALON APPLICATIONS
  // GET /api/v1/salons/my-applications
  // ==========================================================

  getMyApplications: AsyncHandler = async (
    req,
    res,
    next,
  ) => {
    try {
      const ownerId = getOwnerId(req);

      const salons =
        await salonService.getMyApplications(
          ownerId,
        );

      res.status(200).json({
        success: true,
        message:
          "Your salon applications were retrieved successfully",
        data: salons,
      });
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================
// EXPORT
// ============================================================

const salonController = new SalonController();

export default salonController;