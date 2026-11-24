import { connectAuthDB, disconnectAuthDB } from "../config/auth-database.js";
import { authDatabase } from "../config/auth-database.js";

const ADMIN_EMAIL = process.argv[2]?.trim().toLowerCase();

const bootstrapAdmin = async (): Promise<void> => {
  try {
    if (!ADMIN_EMAIL) {
      throw new Error(
        "Admin email is required. Example: npm run bootstrap:admin -- shampa@example.com",
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
      throw new Error("Invalid email address.");
    }

    await connectAuthDB();

    const users = authDatabase.collection("user");
    const bootstrapLocks = authDatabase.collection<{
  _id: string;
  email: string;
  createdAt: Date;
}>("salonbook_admin_bootstrap");

    console.log("Checking existing Admin accounts...");

    const existingAdmin = await users.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      throw new Error(
        "An Admin account already exists. Bootstrap is not allowed.",
      );
    }

    console.log(`Looking for account: ${ADMIN_EMAIL}`);

    const targetUser = await users.findOne({
      email: ADMIN_EMAIL,
    });

    if (!targetUser) {
      throw new Error(
        "User account not found. Register this account first.",
      );
    }

    if (targetUser.emailVerified !== true) {
      throw new Error(
        "Email must be verified before Admin promotion.",
      );
    }

    if (targetUser.role !== "customer") {
      throw new Error(
        `Expected customer role, found: ${targetUser.role}`,
      );
    }

    // Atomic one-time bootstrap lock.
    await bootstrapLocks.insertOne({
      _id: "first-admin-bootstrap",
      email: ADMIN_EMAIL,
      createdAt: new Date(),
    });

    const result = await users.updateOne(
      {
        _id: targetUser._id,
        email: ADMIN_EMAIL,
        emailVerified: true,
        role: "customer",
      },
      {
        $set: {
          role: "admin",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount !== 1) {
      await bootstrapLocks.deleteOne({
        _id: "first-admin-bootstrap",
      });

      throw new Error(
        "Admin promotion failed. User account may have changed.",
      );
    }

    console.log("-----------------------------------");
    console.log("FIRST ADMIN CREATED SUCCESSFULLY");
    console.log("-----------------------------------");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log("Role: admin");
    console.log("Bootstrap: Permanently locked");
  } catch (error) {
    console.error("Admin bootstrap failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectAuthDB();
  }
};

void bootstrapAdmin();