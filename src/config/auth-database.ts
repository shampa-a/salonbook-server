import { MongoClient } from "mongodb";

import { env } from "./env.js";

export const authMongoClient = new MongoClient(env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});

export const authDatabase = authMongoClient.db();

export const connectAuthDB = async (): Promise<void> => {
  await authMongoClient.connect();

  console.log("Better Auth MongoDB connection established");
};

export const disconnectAuthDB = async (): Promise<void> => {
  await authMongoClient.close();

  console.log("Better Auth MongoDB connection closed");
};