import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";
import { getProfileInformation, softDeleteUser, updateProfileInformation } from "../controllers/user.controllers";
import { logoutUser } from "../controllers/auth.controllers";

const profileRouter: IRouter = Router();

profileRouter.post("/logout", logoutUser);
profileRouter.get("/", getProfileInformation);
profileRouter.put("/", updateProfileInformation);
profileRouter.delete("/", softDeleteUser);

export default profileRouter;