import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (
  req,
  res,
  next
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    console.info(
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
};