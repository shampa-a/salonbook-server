import { Router } from "express";

import healthRoutes from "./health.routes.js";
import categoryRoutes from "./category.routes.js";

const router = Router();

// Health check
router.use("/health", healthRoutes);

// Category routes
router.use("/categories", categoryRoutes);

export default router;