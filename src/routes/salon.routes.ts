import { Router } from "express";

import salonController from "../controllers/salon.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

// ============================================================
// SALON ROUTER
// ============================================================

const router = Router();

// Every salon application endpoint requires authentication.
router.use(requireAuth);

// ============================================================
// SALON APPLICATION ROUTES
// ============================================================

// Submit a new salon application.
router.post(
  "/applications",
  salonController.createApplication,
);

// Retrieve the authenticated user's applications.
router.get(
  "/my-applications",
  salonController.getMyApplications,
);

export default router;