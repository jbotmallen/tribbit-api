import { createHabit, deleteHabit, getUserHabits, updateHabit } from "../controllers/habit.controllers";
import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";

const habitRouter: IRouter = Router();

habitRouter.get("/", auth_check, getUserHabits);
habitRouter.post("/new", auth_check, createHabit);
habitRouter.put("/update", auth_check, updateHabit);
habitRouter.delete("/delete", auth_check, deleteHabit);

export default habitRouter;