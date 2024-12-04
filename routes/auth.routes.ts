import { forgotPassword, loginUser, logoutUser, registerUser, resetPassword, verifyEmail, verifyOtp } from "../controllers/auth.controllers";
import { IRouter, Router } from "express";
import { auth_prevention } from "../middlewares/authentication";

const userRouter: IRouter = Router();

userRouter.post("/register", auth_prevention, registerUser);
userRouter.post("/login", auth_prevention, loginUser);
userRouter.post("/forgot-password", auth_prevention, forgotPassword);
userRouter.post("/reset-password", auth_prevention, resetPassword);
userRouter.post("/verify-email", auth_prevention, verifyEmail);
userRouter.post("/verify-otp", auth_prevention, verifyOtp);

export default userRouter;