import { defineBackend } from "@aws-amplify/backend";
import { defineFunction } from "@aws-amplify/backend-function";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backendFunction = defineFunction({
  name: "novelog-api",
  entry: "../backend/src/index.js",
  runtime: 18,
  memoryMB: 512,
  timeoutSeconds: 30,
  environment: {
    DB_HOST: process.env.DB_HOST || "",
    DB_USER: process.env.DB_USER || "",
    DB_PASSWORD: process.env.DB_PASSWORD || "",
    DB_NAME: process.env.DB_NAME || "",
  },
});

export const backend = defineBackend({
  auth,
  data,
  function: backendFunction,
});
