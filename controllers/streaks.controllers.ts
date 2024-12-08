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

        const { bestStreak, bestStreakDates } = getHabitBestStreak(accomplished);
        const { currentStreak, currentStreakDates } = getHabitCurrentStreak(accomplished); // Destructure to match return values

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
            bestStreakDates,
            currentStreak,
            currentStreakDates,
            accomplishedDatesPerHabit: accomplishedDates
        });
    } catch (error) {
        genericError(res, error);
    }
};
const getHabitBestStreak = (accomplished: AccomplishedDocument[]) => {
    try {
        if (accomplished.length === 0) {
            return { bestStreak: 0, bestStreakDates: [] };
        }

        let bestStreak = 0;
        let tempStreak = 1;
        let bestStreakDates: Date[] = [];
        let tempStreakDates: Date[] = [new Date(accomplished[0].date_changed)];
        let previousDate = new Date(accomplished[0].date_changed);

        for (let i = 1; i < accomplished.length; i++) {
            const currentDate = new Date(accomplished[i].date_changed);

            const differenceInDays = Math.round(
                (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (differenceInDays === 1) {
                tempStreak++;
                tempStreakDates.push(currentDate);
            } else {
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                    bestStreakDates = [...tempStreakDates];
                }
                tempStreak = 1;
                tempStreakDates = [currentDate];
            }

            previousDate = currentDate;
        }

        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
            bestStreakDates = [...tempStreakDates];
        }

        const bestStreakDatesFormatted = bestStreakDates.length > 0
            ? [bestStreakDates[bestStreakDates.length - 1], bestStreakDates[0]]
            : [];

        return {
            bestStreak,
            bestStreakDates: bestStreakDatesFormatted,
        };
    } catch (error) {
        console.error(error);
        return { bestStreak: 0, bestStreakDates: [] };
    }
};
const getHabitCurrentStreak = (accomplished: AccomplishedDocument[]) => {
    try {
        if (accomplished.length === 0) {
            return { currentStreak: 0, streakDates: [] };
        }

        let currentStreak = 0;
        let currentStreakDates: Date[] = [];
        let previousDate = new Date(accomplished[0].date_changed);

        if (isToday(previousDate)) {
            currentStreak++;
            currentStreakDates = [previousDate, previousDate]; // Store both min and max date as the same initially
        } else {
            return { currentStreak: 0, currentStreakDates: [] };
        }

        for (let i = 1; i < accomplished.length; i++) {
            const currentDate = new Date(accomplished[i].date_changed);
            const differenceInDays = (previousDate.getDay() - currentDate.getDay());

            if (differenceInDays === 1) {
                currentStreak++;
                // Update streak dates
                currentStreakDates[0] = currentStreakDates[0] ? (currentDate < currentStreakDates[0] ? currentDate : currentStreakDates[0]) : currentDate; // Min date
                currentStreakDates[1] = currentStreakDates[1] ? (currentDate > currentStreakDates[1] ? currentDate : currentStreakDates[1]) : currentDate; // Max date
            } else {
                break;
            }

            previousDate = currentDate;
        }

        return { currentStreak, currentStreakDates };
    } catch (error) {
        console.error("Error in getHabitCurrentStreak:", error);
        return { currentStreak: 0, streakDates: [] };
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
            currentStreakInterval: currentStreakEnd && currentStreakStart
                ? `${format(currentStreakEnd, 'MMM dd')} - ${format(currentStreakStart, 'MMM dd')}`
                : null,
            bestStreak,
            bestStreakInterval: bestStreakEnd && bestStreakStart
                ? `${format(bestStreakEnd, 'MMM dd')} - ${format(bestStreakStart, 'MMM dd')}`
                : currentStreakStart && currentStreakStart ? `${format(currentStreakStart, 'MMM dd')} - ${format(currentStreakStart, 'MMM dd')}` : null
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

        const { year, month } = req.params;
        let start: Date;
        let end: Date;

        const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
        const parsedMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();

        if ((year && isNaN(parsedYear)) || (month && (isNaN(parsedMonth) || parsedMonth < 0 || parsedMonth > 11))) {
            return responseHandler(res, 400, 'Invalid year or month');
        }
        const timezoneOffset = new Date().getTimezoneOffset() * 60000; // in milliseconds
        start = new Date(parsedYear, parsedMonth, 1, 0, 0, 0, 0);
        start = new Date(start.getTime() - timezoneOffset); // Adjust to local time
        
        end = new Date(parsedYear, parsedMonth + 1, 0, 23, 59, 59, 999);
        end = new Date(end.getTime() - timezoneOffset); // Adjust to local time
        
        
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

        const dateRange = generateDateRange(start, end, "monthly");
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
const getUserAccomplishedWeeklyCount = async (req: Request, res: Response) => {
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

        const [start, end] = week.split('_');
        console.log("start: ", start, "end: ", end)
        if (!start || !end) {
            return responseHandler(res, 400, 'Invalid week range');
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return responseHandler(res, 400, 'Invalid date format');
        }

        const habits = await Habit.find({ user_id: id, deleted_at: null });
        if (habits.length === 0) {
            return responseHandler(res, 404, 'No habits found');
        }

        const accomplished = await Accomplished.find({
            habit_id: { $in: habits.map((habit) => habit._id) },
            accomplished: true,
            created_at: { $gte: startDate, $lte: endDate },
        });

        const weeklyAccomplishments: Record<string, { count: number; habits: string[] }> = {};

        accomplished.forEach((item) => {
            const date = new Date(item.created_at).toISOString().split('T')[0];
            if (!weeklyAccomplishments[date]) {
                weeklyAccomplishments[date] = { count: 0, habits: [] };
            }

            weeklyAccomplishments[date].count += 1;

            const habit = habits.find((habit) => habit._id.toString() === item.habit_id.toString());
            if (habit && !weeklyAccomplishments[date].habits.includes(habit.name)) {
                weeklyAccomplishments[date].habits.push(habit.name);
            }
        });

        const dateRange = generateDateRange(startDate, endDate, "weekly");
        const result = dateRange.map((date) => ({
            date,
            count: weeklyAccomplishments[date]?.count || 0,
            habits: weeklyAccomplishments[date]?.habits || [],
        }));

        return responseHandler(res, 200, 'Weekly accomplishments retrieved successfully', result);
    } catch (error) {
        console.error('Error in getUserAccomplishedWeeklyCount:', error);
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

const getUserCurrentStreakByHabitId = (
  accomplished: AccomplishedDocument[],
  habitId: string
) => {
  try {
    const habitAccomplishments = accomplished.filter(
      (record) => record.habit_id === habitId
    );

    if (habitAccomplishments.length === 0) {
      return {
        currentStreak: 0,
        currentStreakStart: null,
        currentStreakEnd: null,
      };
    }

    let currentStreak = 0;
    let currentStreakStart: Date | null = new Date(habitAccomplishments[0].date_changed);
    let currentStreakEnd: Date | null = new Date(habitAccomplishments[0].date_changed);

    if (isToday(currentStreakStart)) {
      currentStreak++;
    } else {
      return { currentStreak, currentStreakStart, currentStreakEnd };
    }

    for (let i = 1; i < habitAccomplishments.length; i++) {
      const previousDate = new Date(habitAccomplishments[i - 1].date_changed);
      const currentDate = new Date(habitAccomplishments[i].date_changed);

      const differenceInDays =
        (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

      if (differenceInDays === 1) {
        currentStreak++;
      } else {
        break;
      }

      currentStreakEnd = currentDate;
    }

    return { currentStreak, currentStreakStart, currentStreakEnd };
  } catch (error) {
    console.error("Error in getUserCurrentStreakByHabitId:", error);
    return {
      currentStreak: 0,
      currentStreakStart: null,
      currentStreakEnd: null,
    };
  }
};

export { getHabitBestStreak, getHabitCurrentStreak, getUserStreak, getUserConsistency, getUserAccomplishedCount, getHabitStreaks, getHabitDays, getUserCurrentStreakByHabitId, getUserAccomplishedWeeklyCount}