import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";
import { getUserStreak } from "../controllers/streaks.controllers";

const analyticsRouter: IRouter = Router();

analyticsRouter.get("/user-streak", auth_check, getUserStreak);

export default analyticsRouter;