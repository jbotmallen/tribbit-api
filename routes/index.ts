import { IRouter, Router } from "express";
import userRouter from "./auth.routes";
import habitRouter from "./habit.routes";
import profileRouter from "./profile.routes";
import analyticsRouter from "./analytics.routes";
import { auth_check, auth_prevention } from "../middlewares/authentication";

const router: IRouter = Router();

router.use("/profile", auth_check, profileRouter);
router.use("/auth", auth_prevention, userRouter);
router.use("/habits", auth_check, habitRouter);
router.use("/analytics", auth_check, analyticsRouter);

export default router;
