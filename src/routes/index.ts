import { Router } from "express";

import healthRoutes from "./health.routes.js";
import categoryRoutes from "./category.routes.js";
import authRoutes from "./auth.routes.js";
import staffRoutes from "./staff.routes.js";
import salonRoutes from "./salon.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/categories", categoryRoutes);
router.use("/auth", authRoutes);
router.use("/salons", salonRoutes);
router.use("/staff", staffRoutes);
router.use("/admin", adminRoutes);

export default router;