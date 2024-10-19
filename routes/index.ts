import { IRouter, Router } from "express";
import userRouter from "./auth.routes";
import habitRouter from "./habit.routes";

const router: IRouter = Router();

router.use("/auth", userRouter);
router.use("/habits", habitRouter);

export default router;
