import { Router } from "express";
import categoryController from "../controllers/category.controller.js";

const router = Router();

/**
 * PUBLIC CATEGORY ROUTES
 */

// GET /api/v1/categories
// Retrieve all active categories
router.get("/", categoryController.getCategories);

// GET /api/v1/categories/:slug
// Retrieve a category by slug
router.get("/:slug", categoryController.getCategoryBySlug);

export default router;