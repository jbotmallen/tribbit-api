import { Types } from "mongoose";
import { connectToDatabase } from "../utils/db";
import { Accomplished } from "../models/accomplished.models";
import { differenceInCalendarDays, isToday } from "date-fns";
import { ONE_DAY } from "../utils/constants";
import { Habit } from "../models/habit.models";
import { Request, Response } from "express";
import { responseHandler } from "../utils/response-handlers";

const getHabitStreak = async (id: Types.ObjectId) => {
    try {
        await connectToDatabase();

        const accomplished = await Accomplished.find({ habit_id: id, accomplished: true }).sort({ date_changed: -1 });

        if (accomplished.length === 0) {
            return 0;
        }

        let currentStreak = 0;
        let previousDate = new Date(accomplished[0].date_changed);

        if (isToday(previousDate)) {
            currentStreak++;
        } else {
            return 0;
        }

        for (let i = 1; i < accomplished.length; i++) {
            const currentDate = new Date(accomplished[i].date_changed);
            const differenceInDays = (previousDate.getTime() - currentDate.getTime()) / ONE_DAY;

            if (differenceInDays === 1) {
                currentStreak++;
            } else {
                break;
            }
            previousDate = currentDate;
        }

        return currentStreak;
    } catch (error) {
        console.log(error);
        return 0;
    }
};

const getUserStreak = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { id } = req.params;

        const habits = await Habit.find({ user_id: id, deleted_at: null });

        if (habits.length === 0) {
            responseHandler(res, 204, 'No habits found');
            return;
        }

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        const accomplished = await Accomplished.find({
            habit_id: { $in: habits.map(habit => habit._id) },
            accomplished: true,
            date_changed: { $gte: startOfMonth }
        }).sort({ date_changed: -1 });

        if (accomplished.length === 0) {
            responseHandler(res, 204, 'No accomplished dates found');
            return;
        }

        let currentStreak = 0;
        let previousDate = currentDate;

        for (let i = 0; i <= differenceInCalendarDays(currentDate, startOfMonth); i++) {
            const streakDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
            
            const completedOnDate = accomplished.some(accomplish => 
                differenceInCalendarDays(new Date(accomplish.date_changed), streakDate) === 0
            );

            if (completedOnDate) {
                currentStreak++;
            } else {
                break;
            }
        }

        responseHandler(res, 200, 'Streak retrieved successfully', { streak: currentStreak });
    } catch (error) {
        console.log(error);
        responseHandler(res, 500, 'An error occurred');
    }
};

export { getHabitStreak, getUserStreak };