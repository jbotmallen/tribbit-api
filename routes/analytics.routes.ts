import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";
import { getHabitDays, getHabitStreaks, getUserAccomplishedCount, getUserConsistency, getUserStreak } from "../controllers/streaks.controllers";

const analyticsRouter: IRouter = Router();

analyticsRouter.get("/habit-streak/:id", getHabitStreaks);
analyticsRouter.get("/user-streak/:frequency", getUserStreak);
analyticsRouter.get("/user-consistency/:frequency", getUserConsistency);
analyticsRouter.get("/user-habit-count/:frequency", getUserAccomplishedCount);
analyticsRouter.get("/habit-days/:week", getHabitDays);

export default analyticsRouter;