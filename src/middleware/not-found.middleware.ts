import type { RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const notFoundHandler: RequestHandler = (
  req,
  _res,
  next
) => {
  next(
    new AppError(
      404,
      `Route ${req.method} ${req.path} not found`
    )
  );
};