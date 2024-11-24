import { Types } from "mongoose";
import { connectToDatabase } from "../utils/db";
import { Accomplished } from "../models/accomplished.models";
import { differenceInCalendarDays, format, isToday } from "date-fns";
import { ONE_DAY } from "../utils/constants";
import { Habit } from "../models/habit.models";
import { Request, Response } from "express";
import { responseHandler } from "../utils/response-handlers";
import { JwtPayload, verify } from "jsonwebtoken";

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

        const token = req.cookies.token;
        if (!token) {
            return responseHandler(res, 401, 'Unauthorized');
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const id = decoded.id;

        if (!id) {
            return responseHandler(res, 401, 'Unauthorized');
        }

        const habits = await Habit.find({ user_id: id, deleted_at: null });

        if (habits.length === 0) {
            return responseHandler(res, 404, 'No habits found');
        }

        const { frequency } = req.params;
        let start: Date | null, end: Date | null;

        switch (frequency) {
            case 'weekly':
                start = new Date();
                start.setDate(start.getDate() - 7);
                end = new Date();
                break;
            case 'monthly':
                start = new Date();
                start.setMonth(start.getMonth() - 1);
                end = new Date();
                break;
            case 'all time':
                start = null;
                end = null;
                break;
            default:
                return responseHandler(res, 400, 'Invalid frequency');
        }

        const accomplishedQuery: { created_at?: { $gte: Date, $lte: Date } } = {};

        if (start && end) {
            accomplishedQuery.created_at = { $gte: start, $lte: end };
        }
        
        const accomplished = await Accomplished.find({
            habit_id: { $in: habits.map(habit => habit._id) },
            accomplished: true,
            ...accomplishedQuery
        }).sort({ date_changed: 1 });

        if (accomplished.length === 0) {
            return responseHandler(res, 404, 'No accomplishments found');
        }

        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 1;

        let currentStreakStart: Date | null = null;
        let currentStreakEnd: Date | null = null;
        let bestStreakStart: Date | null = null;
        let bestStreakEnd: Date | null = null;

        const today = new Date();
        const mostRecentDate = new Date(accomplished[accomplished.length - 1].date_changed);

        if (differenceInCalendarDays(today, mostRecentDate) === 0) {
            currentStreak = 1;
            currentStreakStart = today;
            currentStreakEnd = today;
        }

        for (let i = accomplished.length - 1; i > 0; i--) {
            const currentDate = new Date(accomplished[i].date_changed);
            const previousDate = new Date(accomplished[i - 1].date_changed);

            const differenceInDays = differenceInCalendarDays(currentDate, previousDate);

            if (differenceInDays === 1) {
                tempStreak++;

                if (currentStreakStart && differenceInCalendarDays(today, currentDate) < tempStreak) {
                    currentStreak = tempStreak;
                    currentStreakStart = previousDate;
                    currentStreakEnd = today;
                }
            } else {
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                    bestStreakStart = new Date(accomplished[i + tempStreak - 1].date_changed);
                    bestStreakEnd = currentDate;
                }
                tempStreak = 1;
            }
        }

        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
            bestStreakStart = new Date(accomplished[accomplished.length - tempStreak].date_changed);
            bestStreakEnd = new Date(accomplished[accomplished.length - 1].date_changed);
        }

        if (!currentStreakStart || !currentStreakEnd) {
            currentStreak = 0;
            currentStreakStart = null;
            currentStreakEnd = null;
        }

        if (bestStreak === 0) {
            bestStreak = currentStreak;
            bestStreakStart = currentStreakStart;
            bestStreakEnd = currentStreakEnd;
        }

        const response = {
            currentStreak,
            currentStreakInterval: currentStreakStart && currentStreakEnd
                ? `${format(currentStreakStart, 'MMM dd')} - ${format(currentStreakEnd, 'MMM dd')}`
                : null,
            bestStreak,
            bestStreakInterval: bestStreakStart && bestStreakEnd
                ? `${format(bestStreakStart, 'MMM dd')} - ${format(bestStreakEnd, 'MMM dd')}`
                : currentStreakStart && currentStreakEnd ? `${format(currentStreakStart, 'MMM dd')} - ${format(currentStreakEnd, 'MMM dd')}` : null
        };

        return responseHandler(res, 200, 'Streaks retrieved successfully', response);
    } catch (error) {
        console.error("Error in getUserStreak:", error);
        return responseHandler(res, 500, 'An error occurred');
    }
};

export { getHabitStreak, getUserStreak };