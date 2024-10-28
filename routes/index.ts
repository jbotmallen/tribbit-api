import { IRouter, Router } from "express";
import userRouter from "./auth.routes";
import habitRouter from "./habit.routes";
import profileRouter from "./profile.routes";

const router: IRouter = Router();

router.use("/profile", profileRouter);
router.use("/auth", userRouter);
router.use("/habits", habitRouter);

export default router;
