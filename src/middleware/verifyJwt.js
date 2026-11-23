import { createRemoteJWKSet, jwtVerify } from "jose";
import mongoose from "mongoose";

const JWKS = createRemoteJWKSet(new URL(process.env.AUTH_JWKS_URL));

export const verifyJwt = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.AUTH_ISSUER,
    });

    // Better Auth stores users in the "user" collection
    const user = await mongoose.connection.db
      .collection("user")
      .findOne({ _id: new mongoose.Types.ObjectId(payload.sub) });

    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });

    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "Forbidden" });