import { Router } from "express";

import staffController from "../controllers/staff.controller.js";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware.js";

// ============================================================
// STAFF ROUTER
// ============================================================

const router = Router();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// All staff management routes require authentication
// and salonOwner role.

router.use(requireAuth);
router.use(requireRole("salonOwner"));

// ============================================================
// STAFF CRUD ROUTES
// ============================================================

// Create a new staff member
// POST /api/v1/staff/:salonId

router.post(
  "/:salonId",
  staffController.createStaff,
);

// Get all staff members of a salon
// GET /api/v1/staff/:salonId

router.get(
  "/:salonId",
  staffController.getSalonStaff,
);

// Get a specific staff member
// GET /api/v1/staff/:salonId/:staffId

router.get(
  "/:salonId/:staffId",
  staffController.getStaffById,
);

// Update staff information
// PATCH /api/v1/staff/:salonId/:staffId

router.patch(
  "/:salonId/:staffId",
  staffController.updateStaff,
);

// ============================================================
// STAFF SCHEDULE ROUTE
// ============================================================

// Update staff weekly schedule
// PATCH /api/v1/staff/:salonId/:staffId/schedule

router.patch(
  "/:salonId/:staffId/schedule",
  staffController.updateStaffSchedule,
);

// ============================================================
// STAFF SERVICE ASSIGNMENT
// ============================================================

// Assign services to a staff member
// PUT /api/v1/staff/:salonId/:staffId/services

router.put(
  "/:salonId/:staffId/services",
  staffController.assignServices,
);

// ============================================================
// STAFF STATUS ROUTE
// ============================================================

// Update staff status
// PATCH /api/v1/staff/:salonId/:staffId/status

router.patch(
  "/:salonId/:staffId/status",
  staffController.updateStaffStatus,
);

// ============================================================
// DELETE STAFF ROUTE
// ============================================================

// Soft delete a staff member
// DELETE /api/v1/staff/:salonId/:staffId

router.delete(
  "/:salonId/:staffId",
  staffController.deleteStaff,
);

// ============================================================
// EXPORT
// ============================================================

export default router;