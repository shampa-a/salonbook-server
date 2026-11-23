import { MongoClient } from "mongodb";

import { env } from "./env.js";

export const authMongoClient = new MongoClient(env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});

export const authDatabase = authMongoClient.db("salonbook-server");

export const connectAuthDB = async (): Promise<void> => {
  await authMongoClient.connect();

  console.log(
    "Better Auth connected to salonbook-server database",
  );
};

export const disconnectAuthDB = async (): Promise<void> => {
  await authMongoClient.close();

  console.log(
    "Better Auth MongoDB connection closed",
  );
};