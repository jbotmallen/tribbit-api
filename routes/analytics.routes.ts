import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";
import { getUserConsistency, getUserStreak } from "../controllers/streaks.controllers";

const analyticsRouter: IRouter = Router();

analyticsRouter.get("/user-streak/:frequency", auth_check, getUserStreak);
analyticsRouter.get("/user-consistency/:frequency", auth_check, getUserConsistency);

export default analyticsRouter;