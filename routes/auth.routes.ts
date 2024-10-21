import { loginUser, logoutUser, registerUser } from "../controllers/auth.controllers";
import { IRouter, Router } from "express";
import { auth_check, auth_prevention } from "../middlewares/authentication";

const userRouter: IRouter = Router();

userRouter.post("/register", auth_prevention, registerUser);
userRouter.post("/login", auth_prevention, loginUser);
userRouter.post("/logout", auth_check, logoutUser);

export default userRouter;