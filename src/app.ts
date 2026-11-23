import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";

import apiRoutes from "./routes/index.js";

import { requestLogger } from "./middleware/request-logger.middleware.js";

import { notFoundHandler } from "./middleware/not-found.middleware.js";

import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Disable framework identification
app.disable("x-powered-by");

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Request logging
app.use(requestLogger);

// Request body parsing
app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  })
);

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SalonBook API",
    version: "1.0.0",
  });
});

// API routes
app.use("/api/v1", apiRoutes);

// Handle unknown routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;