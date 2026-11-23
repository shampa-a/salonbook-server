import type { Request, Response, NextFunction } from "express";

import categoryService from "../services/category.service.js";

import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from "../validators/category.validator.js";

import { AppError } from "../utils/app-error.js";

/**
 * Safely extracts a single string route parameter.
 */
const getRouteParam = (
  value: string | string[] | undefined,
  paramName: string
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(400, `Invalid ${paramName}`);
  }

  return value.trim();
};

class CategoryController {
  /**
   * GET /api/v1/categories
   * Retrieve active categories with pagination and search.
   */
  getCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validation = categoryQuerySchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, "Invalid category query parameters");
      }

      const result = await categoryService.getActiveCategories(
        validation.data
      );

      res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        data: result.categories,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/categories/:slug
   * Retrieve a category by slug.
   */
  getCategoryBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const slug = getRouteParam(req.params.slug, "category slug");

      if (slug.length > 120) {
        throw new AppError(400, "Category slug is too long");
      }

      const category = await categoryService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/categories/admin/:id
   * Retrieve a category by MongoDB ID.
   *
   * Administrator authorization required.
   */
  getCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "category ID");

      const category = await categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/categories
   * Create a new category.
   *
   * Administrator authorization required.
   */
  createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validation = createCategorySchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, "Invalid category information");
      }

      const category = await categoryService.createCategory(
        validation.data
      );

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/categories/:id
   * Update category information.
   *
   * Administrator authorization required.
   */
  updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "category ID");

      const validation = updateCategorySchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, "Invalid category update information");
      }

      const category = await categoryService.updateCategory(
        id,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/categories/:id/deactivate
   * Deactivate a category.
   *
   * Administrator authorization required.
   */
  deactivateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "category ID");

      const category = await categoryService.deactivateCategory(id);

      res.status(200).json({
        success: true,
        message: "Category deactivated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/categories/:id/activate
   * Reactivate a category.
   *
   * Administrator authorization required.
   */
  activateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "category ID");

      const category = await categoryService.activateCategory(id);

      res.status(200).json({
        success: true,
        message: "Category activated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new CategoryController();