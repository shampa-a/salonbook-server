import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (_req, res) => {
  const isDatabaseConnected =
    mongoose.connection.readyState === 1;

  res.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,
    data: {
      application: "SalonBook API",
      status: isDatabaseConnected ? "healthy" : "degraded",
      database: isDatabaseConnected ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;