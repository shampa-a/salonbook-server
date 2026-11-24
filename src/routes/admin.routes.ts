import { Router } from "express";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware.js";

import {
  getApplicationsController,
  getApplicationDetailsController,
  approveApplicationController,
  rejectApplicationController,
} from "../controllers/admin-salon.controller.js";

const router = Router();

// All admin routes require authentication and admin role.

router.use(requireAuth);
router.use(requireRole("admin"));

// Salon application management

router.get(
  "/salons/applications",
  getApplicationsController
);

router.get(
  "/salons/applications/:id",
  getApplicationDetailsController
);

router.patch(
  "/salons/applications/:id/approve",
  approveApplicationController
);

router.patch(
  "/salons/applications/:id/reject",
  rejectApplicationController
);

export default router;