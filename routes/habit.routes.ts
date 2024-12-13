import { createHabit, deleteHabit, getHabitAccomplishedDates, getUserHabits, updateHabit, updateHabitAccomplishedStatus } from "../controllers/habit.controllers";
import { IRouter, Router } from "express";

const habitRouter: IRouter = Router();

habitRouter.get("/", getUserHabits);
habitRouter.get("/:id", getHabitAccomplishedDates);
habitRouter.post("/", createHabit);
habitRouter.put("/", updateHabit);
habitRouter.put("/acc/:id", updateHabitAccomplishedStatus);
habitRouter.delete("/", deleteHabit);

export default habitRouter;