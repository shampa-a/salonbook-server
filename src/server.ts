import { createServer } from "node:http";
import mongoose from "mongoose";

import app from "./app.js";

import { connectDB } from "./config/database.js";

import { env } from "./config/env.js";

const startServer = async (): Promise<void> => {
  try {
    // Connect MongoDB before accepting requests
    await connectDB();

    // Create HTTP server
    const server = createServer(app);

    server.listen(env.PORT, () => {
      console.info("----------------------------------");
      console.info("       SALONBOOK API SERVER       ");
      console.info("----------------------------------");
      console.info(`Environment: ${env.NODE_ENV}`);
      console.info(`Port: ${env.PORT}`);
      console.info(`API: http://localhost:${env.PORT}/api/v1`);
      console.info(`Health: http://localhost:${env.PORT}/api/v1/health`);
      console.info("----------------------------------");
    });

    // Graceful shutdown
    const shutdown = (signal: NodeJS.Signals): void => {
      console.info(`${signal} received. Shutting down...`);

      const forceExitTimer = setTimeout(() => {
        console.error("Forced shutdown due to timeout");
        process.exit(1);
      }, 10000);

      forceExitTimer.unref();

      server.close((error) => {
        clearTimeout(forceExitTimer);

        if (error) {
          console.error("HTTP server shutdown failed:", error);
          process.exitCode = 1;
        }

        void mongoose.disconnect().finally(() => {
          console.info("MongoDB disconnected");
          console.info("SalonBook server stopped");
        });
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));

    process.once("SIGTERM", () => shutdown("SIGTERM"));

  } catch (error) {
    console.error("Failed to start SalonBook:", error);

    await mongoose.disconnect();

    process.exitCode = 1;
  }
};

void startServer();