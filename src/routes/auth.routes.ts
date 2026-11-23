import { Router } from "express";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

// Get authenticated user
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.authUser,
  });
});

// Customer dashboard access test
router.get(
  "/customer-access",
  requireAuth,
  requireRole("customer"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Customer access granted",
    });
  },
);

// Salon owner access test
router.get(
  "/salon-access",
  requireAuth,
  requireRole("salonOwner"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Salon owner access granted",
    });
  },
);

// Admin access test
router.get(
  "/admin-access",
  requireAuth,
  requireRole("admin"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  },
);

export default router;