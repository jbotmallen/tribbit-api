import { Request, Response } from 'express';
import { Habit } from '../models/habit.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import dotenv from 'dotenv';
import { sanitize } from '../utils/sanitation';
import { habitSchema } from '../utils/schemas';
import { JwtPayload, verify } from 'jsonwebtoken';
import { createAccomplishedStatus, getHabitAllAccomplishedStatuses, getHabitCountPerFrequency, updateAccomplishedStatus } from './accomplished.controllers';
import { Accomplished } from '../models/accomplished.models';
import { getUserByEmailOrUsername } from './user.controllers';
import { getHabitCurrentStreak } from './streaks.controllers';
import { endOfWeek, startOfWeek } from 'date-fns';
import { Types } from 'mongoose';

dotenv.config();

const getHabitAccomplishedDates = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { id } = req.params;

        if (!id) {
            responseHandler(res, 400, 'Please provide all required fields');
            return;
        }

        const habit = await Habit.findById(id);

        if (!habit) {
            responseHandler(res, 204, 'Habit not found');
            return;
        }

        const [accomplished, streak] = await Promise.all([
            getHabitAllAccomplishedStatuses(habit._id),
            getHabitCurrentStreak(habit._id)
        ]);

        if (!accomplished || accomplished.length === 0) {
            responseHandler(res, 204, 'No accomplished dates found', { habit, accomplished: [], streak });
            return;
        }

        responseHandler(res, 200, 'Accomplished dates retrieved successfully', { habit, accomplished, streak });
    } catch (error) {
        genericError(res, error);
    }
};

const getHabitGoalProgress = async (id: Types.ObjectId) => {
    try {
        await connectToDatabase();

        const startDate = startOfWeek(new Date());
        const endDate = endOfWeek(new Date());

        const accomplished = await Accomplished.find({
            habit_id: id,
            date_changed: { $gte: startDate, $lte: endDate },
            accomplished: true
        });

        return accomplished.length;
    } catch (error) {
        console.log(error);
        return 0;
    }
};

const getUserHabits = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const token = req.cookies.token;

        if (!token) {
            responseHandler(res, 401, 'Unauthorized');
            return;
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const existingUser = await getUserByEmailOrUsername(decoded.email);

        if (!existingUser) {
            responseHandler(res, 404, 'User not found');
            return;
        }

        const habits = await Habit.find({ user_id: decoded.id, deleted_at: null });

        if (habits.length === 0) {
            responseHandler(res, 204, 'No habits found');
            return;
        }

        const results = await Promise.all(habits.map(async habit => {
            const accomplishedStatus = await createAccomplishedStatus(habit._id);
            const goalProgress = (await getHabitGoalProgress(habit._id) / habit.goal) * 100;
            const weeklyCount = await getHabitCountPerFrequency(habit._id, 'weekly');
            return { habit, accomplished: accomplishedStatus, goalProgress, weeklyCount };
        }));

        responseHandler(res, 200, 'Habits retrieved successfully', results);
    } catch (error) {
        genericError(res, error);
    }
};

const createHabit = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { name, goal, color } = req.body;
        const token = req.cookies.token;

        if (!token) {
            responseHandler(res, 401, 'Unauthorized');
            return;
        }

        if (!name || !goal) {
            responseHandler(res, 400, 'Please provide all required fields');
            return;
        }

        const { error } = sanitize(habitSchema, { name, goal });

        if (error) {
            responseHandler(res, 400, error.details[0].message);
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const existingHabit = await Habit.findOne({ name, user_id: decoded.id });

        if (existingHabit) {
            responseHandler(res, 400, 'Habit already exists');
            return;
        }

        const habit = await Habit.create({ name, goal, color, user_id: decoded.id, });
        const status = await createAccomplishedStatus(habit._id);

        responseHandler(res, 201, 'Habit created successfully', { habit, status });
    } catch (error) {
        genericError(res, error);
    }
};

const updateHabitAccomplishedStatus = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { id } = req.params;

        if (!id) {
            responseHandler(res, 400, 'Please provide all required fields');
            return;
        }

        const existingHabit = await Habit.findById(id);

        if (!existingHabit) {
            responseHandler(res, 204, 'Habit not found');
            return;
        }

        const accomplished = await updateAccomplishedStatus(existingHabit._id);

        if (!accomplished) {
            responseHandler(res, 204, 'Accomplished status not found');
            return;
        }

        responseHandler(res, 200, 'Accomplished status updated successfully', accomplished);
    } catch (error) {
        genericError(res, error);
    }
}

const updateHabit = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { id, name, goal, color } = req.body;

        if (!id || !name || !goal || !color) {
            responseHandler(res, 400, 'Please provide all required fields');
            return;
        }
        const updatedAt = new Date().toISOString();

        const habit = await Habit.findByIdAndUpdate(id, { name, goal, color, updated_at: updatedAt }, { new: true });

        responseHandler(res, 200, 'Habit updated successfully', habit);
    } catch (error) {
        genericError(res, error);
    }
};

const deleteHabit = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { id } = req.body;

        if (!id) {
            responseHandler(res, 400, 'Please provide all required fields');
            return;
        }

        await Promise.all([Habit.findByIdAndDelete(id), Accomplished.deleteMany({ habit_id: id })]);

        responseHandler(res, 200, 'Habit deleted successfully');
    } catch (error) {
        genericError(res, error);
    }
};

export { createHabit, getUserHabits, getHabitAccomplishedDates, updateHabit, updateHabitAccomplishedStatus, deleteHabit };