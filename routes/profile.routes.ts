import { IRouter, Router } from "express";
import { getProfileInformation, deleteUser, updateProfileInformation } from "../controllers/user.controllers";
import { logoutUser } from "../controllers/auth.controllers";

const profileRouter: IRouter = Router();

profileRouter.post("/logout", logoutUser);
profileRouter.get("/", getProfileInformation);
profileRouter.put("/", updateProfileInformation);
profileRouter.delete("/", deleteUser);

export default profileRouter;