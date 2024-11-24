import { createHabit, deleteHabit, getHabitAccomplishedDates, getUserHabits, updateHabit, updateHabitAccomplishedStatus } from "../controllers/habit.controllers";
import { IRouter, Router } from "express";
import { auth_check } from "../middlewares/authentication";

const habitRouter: IRouter = Router();

habitRouter.get("/", auth_check, getUserHabits);
habitRouter.get("/:id", auth_check, getHabitAccomplishedDates);
habitRouter.post("/", auth_check, createHabit);
habitRouter.put("/", auth_check, updateHabit);
habitRouter.put("/acc/:id", auth_check, updateHabitAccomplishedStatus);
habitRouter.delete("/", auth_check, deleteHabit);

export default habitRouter;