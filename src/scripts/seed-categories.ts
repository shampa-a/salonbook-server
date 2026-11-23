import mongoose from "mongoose";
import { connectDB } from "../config/database.js";
import Category from "../models/category.model.js";

const defaultCategories = [
  {
    name: "Haircut & Styling",
    slug: "haircut-styling",
    description: "Professional haircuts, blow drying and hairstyling services.",
    icon: "scissors",
    sortOrder: 1,
  },
  {
    name: "Hair Coloring",
    slug: "hair-coloring",
    description: "Professional hair coloring, highlights and balayage services.",
    icon: "palette",
    sortOrder: 2,
  },
  {
    name: "Hair Treatment",
    slug: "hair-treatment",
    description: "Hair spa, keratin and restorative hair treatments.",
    icon: "sparkles",
    sortOrder: 3,
  },
  {
    name: "Facial & Skincare",
    slug: "facial-skincare",
    description: "Facials, skin cleansing and professional skincare treatments.",
    icon: "smile",
    sortOrder: 4,
  },
  {
    name: "Makeup",
    slug: "makeup",
    description: "Bridal, party and professional makeup services.",
    icon: "brush",
    sortOrder: 5,
  },
  {
    name: "Manicure & Pedicure",
    slug: "manicure-pedicure",
    description: "Nail care, manicure, pedicure and nail art services.",
    icon: "hand",
    sortOrder: 6,
  },
  {
    name: "Spa & Massage",
    slug: "spa-massage",
    description: "Relaxing body spa and professional massage services.",
    icon: "heart",
    sortOrder: 7,
  },
];

const seedCategories = async (): Promise<void> => {
  try {
    await connectDB();

    console.log("Starting category seeding...");

    let insertedCount = 0;
    let existingCount = 0;

    for (const category of defaultCategories) {
      const result = await Category.updateOne(
        { slug: category.slug },
        {
          $setOnInsert: {
            ...category,
            isActive: true,
            image: "",
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        insertedCount++;
        console.log(`Created: ${category.name}`);
      } else {
        existingCount++;
        console.log(`Already exists: ${category.name}`);
      }
    }

    console.log("----------------------------------");
    console.log("CATEGORY SEEDING COMPLETED");
    console.log("----------------------------------");
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Already existed: ${existingCount}`);
    console.log(`Total categories: ${defaultCategories.length}`);
  } catch (error) {
    console.error("Category seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void seedCategories();