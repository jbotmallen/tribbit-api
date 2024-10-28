import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";
import { getProfileInformation, softDeleteUser, updateProfileInformation } from "../controllers/user.controllers";

const profileRouter: IRouter = Router();

profileRouter.get("/", auth_check, getProfileInformation);
profileRouter.put("/", auth_check, updateProfileInformation);
profileRouter.delete("/", auth_check, softDeleteUser);

export default profileRouter;