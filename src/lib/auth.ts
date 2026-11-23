import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

import { authDatabase } from "../config/auth-database.js";

import { env } from "../config/env.js";

const googleEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
  appName: "SalonBook",

  baseURL: env.BETTER_AUTH_URL,

  secret: env.BETTER_AUTH_SECRET,

  trustedOrigins: [env.CLIENT_URL],

  database: mongodbAdapter(authDatabase),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },

  socialProviders: googleEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  user: {
    additionalFields: {
      role: {
        type: ["customer", "salonOwner", "admin"],
        required: true,
        defaultValue: "customer",
        input: false,
      },

      blocked: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
    },
  },

  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});