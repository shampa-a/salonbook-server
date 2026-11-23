import mongoose from "mongoose";

import Category from "../models/category.model.js";
import { AppError } from "../utils/app-error.js";

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from "../validators/category.validator.js";

class CategoryService {
  /**
   * Get active categories for customers.
   */
  async getActiveCategories(query: CategoryQueryInput) {
    const {
      search,
      page,
      limit,
      sortBy,
      order,
    } = query;

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      filter.name = {
        $regex: this.escapeRegex(search),
        $options: "i",
      };
    }

    const skip = (page - 1) * limit;

    const sort: Record<string, 1 | -1> = {
      [sortBy]: order === "asc" ? 1 : -1,
    };

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Category.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get a single active category by slug.
   */
  async getCategoryBySlug(slug: string) {
    const category = await Category.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    }).lean();

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    return category;
  }

  /**
   * Get a category by ID.
   * Intended for protected administrative operations.
   */
  async getCategoryById(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, "Invalid category ID");
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    return category;
  }

  /**
   * Create a category.
   * Must only be called by an authorized administrator.
   */
  async createCategory(data: CreateCategoryInput) {
    const existingCategory = await Category.findOne({
      slug: data.slug,
    }).lean();

    if (existingCategory) {
      throw new AppError(
        409,
        "A category with this slug already exists"
      );
    }

    try {
      return await Category.create(data);
    } catch (error) {
      if (
        error instanceof mongoose.mongo.MongoServerError &&
        error.code === 11000
      ) {
        throw new AppError(
          409,
          "A category with this slug already exists"
        );
      }

      throw error;
    }
  }

  /**
   * Update a category.
   * Must only be called by an authorized administrator.
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryInput
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, "Invalid category ID");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        $set: data,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    return category;
  }

  /**
   * Soft-delete a category by deactivating it.
   * Must only be called by an authorized administrator.
   */
  async deactivateCategory(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, "Invalid category ID");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    return category;
  }

  /**
   * Reactivate a category.
   * Must only be called by an authorized administrator.
   */
  async activateCategory(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, "Invalid category ID");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: true,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    return category;
  }

  /**
   * Escape special regex characters in user searches.
   */
  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

export default new CategoryService();