import { forgotPassword, loginUser, registerUser, resetPassword, verifyEmail, verifyOtp, verifyToken } from "../controllers/auth.controllers";
import { IRouter, Router } from "express";

const userRouter: IRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/verify-email", verifyToken);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/verify-otp", verifyOtp);

export default userRouter;