import { createUser, loginUser } from "../controllers/user.controllers";
import { IRouter, Router } from "express";
import { auth_prevention } from "../middlewares/authentication";

const userRouter: IRouter = Router();

userRouter.post("/register", auth_prevention, createUser);
userRouter.post("/login", auth_prevention, loginUser);

export default userRouter;