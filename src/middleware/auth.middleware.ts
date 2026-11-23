import type { Request, Response, NextFunction } from "express";

import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "salonOwner" | "admin";
  blocked: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const user = session.user;

    if (user.blocked) {
      res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });

      return;
    }

    req.authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      blocked: user.blocked,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (
  ...allowedRoles: AuthenticatedUser["role"][]
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.authUser) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource",
      });

      return;
    }

    next();
  };
};