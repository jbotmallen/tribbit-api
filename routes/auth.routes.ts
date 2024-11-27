import { forgotPassword, loginUser, logoutUser, registerUser, resetPassword } from "../controllers/auth.controllers";
import { IRouter, Router } from "express";
import { auth_check, auth_prevention } from "../middlewares/authentication";

const userRouter: IRouter = Router();

userRouter.post("/register", auth_prevention, registerUser);
userRouter.post("/login", auth_prevention, loginUser);
userRouter.post("/logout", auth_check, logoutUser);
userRouter.post("/forgot-password", auth_prevention, forgotPassword);
userRouter.post("/reset-password", auth_prevention, resetPassword);

export default userRouter;