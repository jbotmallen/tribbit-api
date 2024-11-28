import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";
import { getHabitBestStreak, getUserAccomplishedCount, getUserConsistency, getUserStreak } from "../controllers/streaks.controllers";

const analyticsRouter: IRouter = Router();

analyticsRouter.get("/habit-streak/:id", auth_check, getHabitBestStreak);
analyticsRouter.get("/user-streak/:frequency", auth_check, getUserStreak);
analyticsRouter.get("/user-consistency/:frequency", auth_check, getUserConsistency);
analyticsRouter.get("/user-habit-count/:frequency", auth_check, getUserAccomplishedCount);

export default analyticsRouter;