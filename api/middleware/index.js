// api/middleware/index.js
import helmetMiddleware from "../config/helmet.js";
import corsMiddleware from "../config/cors.js";
import logger from "./logger.js";
import express from "express";
import cookieParser from "cookie-parser";

/**
 * Centralized function to register all middlewares
 * @param {Express} app - The Express application instance
 */
const registerMiddlewares = (app) => {
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(cookieParser());
  app.use(logger);
};

export default registerMiddlewares;