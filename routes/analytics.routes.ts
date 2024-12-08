import { IRouter, Router } from "express";
import { getHabitDays, getHabitStreaks, getUserAccomplishedCount, getUserConsistency, getUserStreak, getUserAccomplishedWeeklyCount } from "../controllers/streaks.controllers";

const analyticsRouter: IRouter = Router();

analyticsRouter.get("/habit-streak/:id", getHabitStreaks);
analyticsRouter.get("/user-streak/:frequency", getUserStreak);
analyticsRouter.get("/user-consistency/:frequency", getUserConsistency);
analyticsRouter.get("/user-habit-count/:year/:month", getUserAccomplishedCount);//this is working fine
analyticsRouter.get("/habit-days/:week", getHabitDays);
analyticsRouter.get("/user-habit-count/:week", getUserAccomplishedWeeklyCount);

export default analyticsRouter;