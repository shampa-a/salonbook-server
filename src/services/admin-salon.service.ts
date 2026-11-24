import mongoose from "mongoose";

import Salon from "../models/salon.model.js";
import { AppError } from "../utils/app-error.js";

import type {
  ApplicationListQuery,
} from "../validators/admin-salon.validator.js";

// ======================================================
// TYPES
// ======================================================

type UserUUID = InstanceType<typeof mongoose.mongo.UUID>;

interface BetterAuthUser extends Record<string, unknown> {
  _id: UserUUID;
  name: string;
  email: string;
  emailVerified?: boolean;
  role: string;
  blocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SafeOwner {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  blocked: boolean;
  createdAt?: Date;
}

// ======================================================
// DATABASE HELPERS
// ======================================================

/**
 * Returns Better Auth's user collection.
 *
 * Important:
 * We use Mongoose's own MongoDB driver.
 * This ensures that the collection and transaction
 * session belong to the same MongoDB client.
 */
const getUserCollection = () => {
  const database = mongoose.connection.db;

  if (!database) {
    throw new AppError(
      500,
      "MongoDB database connection is unavailable"
    );
  }

  return database.collection<BetterAuthUser>("user");
};

/**
 * Converts Better Auth user document into
 * a safe object for admin dashboard responses.
 */
const formatOwner = (
  owner: BetterAuthUser | null
): SafeOwner | null => {
  if (!owner) {
    return null;
  }

  return {
    id: owner._id.toString(),
    name: owner.name,
    email: owner.email,
    emailVerified: owner.emailVerified ?? false,
    role: owner.role,
    blocked: owner.blocked,
    createdAt: owner.createdAt,
  };
};

/**
 * Converts owner ID string into BSON UUID.
 */
const toUserUUID = (ownerId: string): UserUUID => {
  try {
    return new mongoose.mongo.UUID(ownerId);
  } catch {
    throw new AppError(
      400,
      "Invalid salon owner ID"
    );
  }
};

/**
 * Validates MongoDB salon application ID.
 */
const validateApplicationId = (
  applicationId: string
): void => {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new AppError(
      400,
      "Invalid salon application ID"
    );
  }
};

// ======================================================
// GET APPLICATIONS
// ======================================================

/**
 * Retrieves salon applications with pagination
 * and optional status filtering.
 */
export const getApplications = async (
  query: ApplicationListQuery
) => {
  const {
    status,
    page,
    limit,
  } = query;

  const filter =
    status === "all"
      ? {}
      : { status };

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Salon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Salon.countDocuments(filter),
  ]);

  const userCollection = getUserCollection();

  // Collect unique owner IDs.
  const ownerIds = [
    ...new Set(
      applications.map(
        (application) => application.ownerId
      )
    ),
  ].map(toUserUUID);

  // Fetch owners in one database query.
  const owners =
    ownerIds.length > 0
      ? await userCollection
          .find({
            _id: {
              $in: ownerIds,
            },
          })
          .project({
            name: 1,
            email: 1,
            emailVerified: 1,
            role: 1,
            blocked: 1,
            createdAt: 1,
          })
          .toArray()
      : [];

  // Create owner lookup map.
 const ownerMap = new Map(
  owners.map((owner) => [
    owner._id.toString(),
    formatOwner(owner as unknown as BetterAuthUser),
  ])
);

  // Attach safe owner information.
  const results = applications.map((application) => ({
    ...application,

    owner:
      ownerMap.get(application.ownerId) ?? null,
  }));

  return {
    applications: results,

    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

// ======================================================
// GET APPLICATION DETAILS
// ======================================================

/**
 * Retrieves one salon application with owner details.
 */
export const getApplicationById = async (
  applicationId: string
) => {
  validateApplicationId(applicationId);

  const application = await Salon.findById(
    applicationId
  ).lean();

  if (!application) {
    throw new AppError(
      404,
      "Salon application not found"
    );
  }

  const userCollection = getUserCollection();

  const owner = await userCollection.findOne({
  _id: toUserUUID(application.ownerId),
}) as BetterAuthUser | null;

return {
  application,
  owner: formatOwner(owner),
};
};

// ======================================================
// APPROVE APPLICATION
// ======================================================

/**
 * Approves a pending salon application.
 *
 * Atomic transaction:
 *
 * 1. Update salon application.
 * 2. Publish salon.
 * 3. Promote owner to salonOwner.
 *
 * If any operation fails, the transaction rolls back.
 */
export const approveApplication = async (
  applicationId: string,
  adminId: string
) => {
  validateApplicationId(applicationId);

  if (!adminId) {
    throw new AppError(
      401,
      "Admin authentication required"
    );
  }

  const session = await mongoose.startSession();

  let approvedApplication: unknown = null;

  try {
    await session.withTransaction(async () => {
      // Step 1: Approve only pending applications.
      const application = await Salon.findOneAndUpdate(
        {
          _id: applicationId,
          status: "pending",
        },
        {
          $set: {
            status: "approved",
            isPublished: true,
            approvedAt: new Date(),
            approvedBy: adminId,
            rejectionReason: "",
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!application) {
        const existingApplication = await Salon.findById(
          applicationId
        )
          .session(session)
          .lean();

        if (!existingApplication) {
          throw new AppError(
            404,
            "Salon application not found"
          );
        }

        throw new AppError(
          409,
          `Application cannot be approved. Current status: ${existingApplication.status}`
        );
      }

      // Step 2: Promote salon owner.
      const userCollection = getUserCollection();

      const userUpdate = await userCollection.updateOne(
        {
          _id: toUserUUID(application.ownerId),
          blocked: { $ne: true },
          role: {
            $in: ["customer", "salonOwner"],
          },
        },
        {
          $set: {
            role: "salonOwner",
            updatedAt: new Date(),
          },
        },
        {
          session,
        }
      );

      // Roll back if owner cannot be promoted.
      if (userUpdate.matchedCount !== 1) {
        throw new AppError(
          409,
          "Owner account not found, blocked, or has an invalid role"
        );
      }

      approvedApplication = application.toObject();
    });
  } finally {
    await session.endSession();
  }

  if (!approvedApplication) {
    throw new AppError(
      500,
      "Salon approval transaction could not be completed"
    );
  }

  return approvedApplication;
};

// ======================================================
// REJECT APPLICATION
// ======================================================

/**
 * Rejects a pending salon application.
 *
 * Rejection reason is mandatory.
 */
export const rejectApplication = async (
  applicationId: string,
  reason: string
) => {
  validateApplicationId(applicationId);

  const normalizedReason = reason.trim();

  if (
    normalizedReason.length < 10 ||
    normalizedReason.length > 1000
  ) {
    throw new AppError(
      400,
      "Rejection reason must contain 10 to 1000 characters"
    );
  }

  // Atomic conditional update.
  const application = await Salon.findOneAndUpdate(
    {
      _id: applicationId,
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        isPublished: false,
        rejectionReason: normalizedReason,
        approvedAt: null,
        approvedBy: null,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!application) {
    const existingApplication = await Salon.findById(
      applicationId
    ).lean();

    if (!existingApplication) {
      throw new AppError(
        404,
        "Salon application not found"
      );
    }

    throw new AppError(
      409,
      `Application cannot be rejected. Current status: ${existingApplication.status}`
    );
  }

  return application;
};