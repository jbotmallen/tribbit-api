import { Types } from "mongoose";
import { connectToDatabase } from "../utils/db";
import { Accomplished, AccomplishedDocument } from "../models/accomplished.models";
import { endOfWeek, format, isToday, startOfWeek } from "date-fns";
import { Habit } from "../models/habit.models";
import { Request, Response } from "express";
import { genericError, responseHandler } from "../utils/response-handlers";
import { JwtPayload, verify } from "jsonwebtoken";
import { generateDateRange, getEndOfWeek, getStartOfMonth, getStartOfWeek } from "../utils/helpers";
import { getHabitAllAccomplishedStatuses } from "./accomplished.controllers";

const getHabitStreaks = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { id } = req.params;

        if (!id) {
            return responseHandler(res, 400, 'Please provide all required fields');
        }

        const habit = await Habit.findById(id);

        if (!habit) {
            return responseHandler(res, 204, 'Habit not found');
        }

        const accomplished = await Accomplished.find({ habit_id: id, accomplished: true }).sort({ date_changed: -1 });

        const bestStreak = getHabitBestStreak(accomplished);
        const currentStreak = getHabitCurrentStreak(accomplished);

        const [accomplishedDatesPerHabit] = await Promise.all([
            getHabitAllAccomplishedStatuses(habit._id)
        ]);

        const accomplishedDates = accomplishedDatesPerHabit
            .filter(item => item.accomplished)
            .map(item => {
                const date = new Date(item.date_changed);
                return date.toISOString().split('T')[0];
            });

        return responseHandler(res, 200, 'Streaks retrieved successfully', {
            bestStreak,
            currentStreak,
            accomplishedDatesPerHabit: accomplishedDates
        });
    } catch (error) {
        genericError(res, error);
    }
};

const getHabitBestStreak = (accomplished: AccomplishedDocument[]) => {
    try {
        if (accomplished.length === 0) {
            return 0;
        }

        let bestStreak = 0;
        let tempStreak = 1;
        let previousDate = new Date(accomplished[0].date_changed);

        for (let i = 1; i < accomplished.length; i++) {
            const currentDate = new Date(accomplished[i].date_changed);
            const differenceInDays = (previousDate.getDay() - currentDate.getDay());

            if (differenceInDays === 1) {
                tempStreak++;
            } else {
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                }
                tempStreak = 1;
            }

            previousDate = currentDate;
        }

        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
        }

        return bestStreak;
    } catch (error) {
        console.error(error);
        return 0;
    }
};

const getHabitCurrentStreak = (accomplished: AccomplishedDocument[]) => {
    try {
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
            const differenceInDays = (previousDate.getDay() - currentDate.getDay());

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

const getUserBestStreak = (accomplished: AccomplishedDocument[]) => {
    try {
        if (!accomplished || accomplished.length === 0) {
            return { bestStreak: 0, startDate: null, endDate: null };
        }

        let bestStreak = 0;
        let tempStreak = 1;
        let previousDate = new Date(accomplished[0].date_changed);
        let startDate: Date | null = previousDate;
        let endDate: Date | null = previousDate;

        for (let i = 1; i < accomplished.length; i++) {
            const currentDate = new Date(accomplished[i].date_changed);
            const differenceInDays = (previousDate.getDay() - currentDate.getDay());

            if (differenceInDays === 1) {
                tempStreak++;
            } else {
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                    startDate = new Date(accomplished[i - tempStreak + 1].date_changed);
                    endDate = new Date(accomplished[i - 1].date_changed);
                }
                tempStreak = 0;
            }

            previousDate = currentDate;
        }

        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
            startDate = new Date(accomplished[accomplished.length - tempStreak].date_changed);
            endDate = new Date(accomplished[accomplished.length - 1].date_changed);
        }

        return { bestStreak, startDate, endDate };
    } catch (error) {
        console.error("Error in getUserBestStreak:", error);
        return { bestStreak: 0, startDate: null, endDate: null };
    }
};

const getUserCurrentStreak = (accomplished: AccomplishedDocument[]) => {
    try {
        let currentStreak = 0;
        let currentStreakStart: Date | null = new Date(accomplished[0].date_changed);
        let currentStreakEnd: Date | null = new Date(accomplished[0].date_changed);

        if (isToday(currentStreakStart)) {
            currentStreak++;
        } else {
            return { currentStreak, currentStreakStart, currentStreakEnd };
        }

        for (let i = 1; i < accomplished.length; i++) {
            let previousDate = new Date(accomplished[i - 1].date_changed);
            const currentDate = new Date(accomplished[i].date_changed);
            const differenceInDays = (previousDate.getDay() - currentDate.getDay());

            if (differenceInDays === 1) {
                currentStreak++;
            } else {
                break;
            }

            currentStreakEnd = currentDate;
            previousDate = currentDate;
        }

        return { currentStreak, currentStreakStart, currentStreakEnd };
    } catch (error) {
        console.error("Error in getUserCurrentStreak:", error);
        return { currentStreak: 0, currentStreakStart: null, currentStreakEnd: null };
    }
}

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
            return responseHandler(res, 204, 'No habits found');
        }

        const { frequency } = req.params;
        let start: Date | null = null, end: Date | null = null;

        switch (frequency) {
            case 'weekly':
                start = startOfWeek(new Date(), { weekStartsOn: 0 });
                end = endOfWeek(new Date(), { weekStartsOn: 0 });
                break;
            case 'monthly':
                start = new Date();
                start.setMonth(start.getMonth() - 1);
                end = new Date();
                break;
            default:
                return responseHandler(res, 400, 'Invalid frequency');
        }

        const accomplishedQuery: { created_at?: { $gte: Date, $lte: Date } } = {};

        if (start && end) {
            accomplishedQuery.created_at = { $gte: start, $lte: end };
        }

        const accomplished = await Accomplished.aggregate([
            {
                $match: {
                    habit_id: { $in: habits.map(habit => habit._id) },
                    accomplished: true,
                    ...(start && end ? { created_at: { $gte: start, $lte: end } } : {})
                }
            },
            {
                $addFields: {
                    dateOnly: {
                        $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
                    }
                }
            },
            {
                $group: {
                    _id: { habit_id: "$habit_id", dateOnly: "$dateOnly" },
                    firstAccomplished: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$firstAccomplished" }
            },
            {
                $sort: { "dateOnly": -1 }
            }
        ]);

        if (accomplished.length === 0) {
            return responseHandler(res, 204, 'No accomplishments found');
        }

        const filteredAccomplished = Array.from(
            new Map(
                accomplished.map((item) => [item.dateOnly, item])
            ).values()
        );

        filteredAccomplished.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const { bestStreak, startDate: bestStreakStart, endDate: bestStreakEnd } = getUserBestStreak(filteredAccomplished);
        const { currentStreak, currentStreakStart, currentStreakEnd } = getUserCurrentStreak(filteredAccomplished);

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

const getUserConsistency = async (req: Request, res: Response) => {
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
            return responseHandler(res, 204, 'No habits found');
        }

        const { frequency } = req.params;
        let start: Date | null, end: Date | null;

        let consistency = 0;
        let totalDays = habits.map(habit => habit.goal).reduce((a, b) => a + b, 0);

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
                totalDays *= 4;
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
            return responseHandler(res, 204, 'No accomplishments found');
        }

        accomplished.forEach(acc => {
            if (acc.accomplished) {
                consistency++;
            }
        });

        if (totalDays === 0) {
            return responseHandler(res, 200, 'Consistency retrieved successfully', { consistency, totalDays, percentage: 0 });
        }

        const percentage = (consistency / totalDays) * 100;

        return responseHandler(res, 200, 'Consistency retrieved successfully', { consistency, totalDays, percentage });
    } catch (error) {
        console.error("Error in getUserConsistency:", error);
        return responseHandler(res, 500, 'An error occurred');
    }
};

const getUserAccomplishedCount = async (req: Request, res: Response) => {
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

        const { frequency } = req.params;
        let start: Date | null = null, end: Date | null = null;

        const today = new Date();

        switch (frequency) {
            case 'weekly': {
                start = getStartOfWeek(today);
                end = getEndOfWeek(start);
                break;
            }
            case 'monthly': {
                start = new Date(today.getFullYear(), today.getMonth(), 2, 0, 0, 0, 0);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            }
            default:
                return responseHandler(res, 400, 'Invalid frequency');
        }

        const habits = await Habit.find({ user_id: id, deleted_at: null });
        if (habits.length === 0) {
            return responseHandler(res, 404, 'No habits found');
        }

        const accomplishedQuery: { created_at?: { $gte: Date; $lte: Date } } = {};
        if (start && end) {
            accomplishedQuery.created_at = { $gte: start, $lte: end };
        }

        const accomplished = await Accomplished.find({
            habit_id: { $in: habits.map((habit) => habit._id) },
            accomplished: true,
            ...accomplishedQuery,
        });

        const dailyAccomplishments: Record<string, { count: number; habits: string[] }> = {};

        accomplished.forEach((item) => {
            const date = new Date(item.created_at).toISOString().split('T')[0];
            if (!dailyAccomplishments[date]) {
                dailyAccomplishments[date] = { count: 0, habits: [] };
            }

            dailyAccomplishments[date].count += 1;

            const habit = habits.find((habit) => habit._id.toString() === item.habit_id.toString());
            if (habit && !dailyAccomplishments[date].habits.includes(habit.name)) {
                dailyAccomplishments[date].habits.push(habit.name);
            }
        });

        const dateRange = generateDateRange(start, end, frequency);
        const result = dateRange.map((date) => ({
            date,
            count: dailyAccomplishments[date]?.count || 0,
            habits: dailyAccomplishments[date]?.habits || [],
        }));

        return responseHandler(res, 200, 'Daily accomplishments retrieved successfully', result);
    } catch (error) {
        console.error('Error in getUserAccomplishedDailyCount:', error);
        return responseHandler(res, 500, 'An error occurred');
    }
};

const getHabitDays = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { week } = req.params;
        const token = req.cookies.token;

        if (!week || !token) {
            return responseHandler(res, 400, 'Please provide all required fields');
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const id = decoded.id;

        if (!id) {
            return responseHandler(res, 401, 'Unauthorized');
        }

        const habits = await Habit.find({ user_id: id, deleted_at: null });

        if (habits.length === 0) {
            return responseHandler(res, 204, 'No habits found');
        }

        const [start, end] = week.split('-');

        if (!start || !end) {
            return responseHandler(res, 400, 'Invalid date range');
        }

        const accomplished = await Promise.all(habits.map(async habit => {
            const accomplished = await Accomplished.find({
                habit_id: habit._id,
                accomplished: true,
                created_at: { $gte: start, $lte: end }
            });

            return accomplished;
        }));

        if (accomplished.length === 0) {
            return responseHandler(res, 204, 'No accomplishments found');
        }

        const results = accomplished.map((item, index) => ({
            habit: habits[index].name,
            day: item.map(i => format(i.created_at, 'yyyy-MM-dd'))
        }));

        return responseHandler(res, 200, 'Accomplished dates retrieved successfully', results);
    } catch (error) {
        console.error('Error in getHabitDays:', error);
        return responseHandler(res, 500, 'An error occurred');
    }
}

export { getHabitBestStreak, getHabitCurrentStreak, getUserStreak, getUserConsistency, getUserAccomplishedCount, getHabitStreaks, getHabitDays };