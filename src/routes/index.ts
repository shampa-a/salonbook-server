import { Router } from "express";

import healthRoutes from "./health.routes.js";
import categoryRoutes from "./category.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

// Health check
router.use("/health", healthRoutes);

// Categories
router.use("/categories", categoryRoutes);

// Authentication-related protected APIs
router.use("/auth", authRoutes);

export default router;