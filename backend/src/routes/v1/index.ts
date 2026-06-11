import { Router } from "express";
import { statusRouter } from "./status.routes.js";

export const v1Router = Router();

v1Router.use(statusRouter);
