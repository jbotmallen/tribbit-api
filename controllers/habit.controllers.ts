import { Request, Response } from 'express';
import { Habit } from '../models/habit.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import dotenv from 'dotenv';
import { sanitize } from '../utils/sanitation';
import { habitSchema } from '../utils/schemas';
import { JwtPayload, verify } from 'jsonwebtoken';
import { createAccomplishedStatus, getHabitAccomplishedStatus, getHabitStreak } from './accomplished.controllers';
import { Accomplished } from '../models/accomplished.models';

dotenv.config();

const getUserHabits = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const token = req.cookies.token;

        if (!token) {
            return responseHandler(res, 401, 'Unauthorized');
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const habits = await Habit.find({ user_id: decoded.id, deleted_at: null });

        const results = await Promise.all(habits.map(async habit => {
            const accomplishedStatus = await getHabitAccomplishedStatus(habit._id, new Date().toISOString().split('T')[0]);
            const streak = await getHabitStreak(habit._id);
            return { habit, accomplished: accomplishedStatus, streak };
        }));

        responseHandler(res, 200, 'Habits retrieved successfully', results);
    } catch (error) {
        genericError(res, error);
    }
};

const createHabit = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { name, goal } = req.body;
        const token = req.cookies.token;

        if (!token) {
            return responseHandler(res, 401, 'Unauthorized');
        }

        if (!name || !goal) {
            responseHandler(res, 400, 'Please provide all required fields');
        }

        const { error } = sanitize(habitSchema, { name, goal });

        if (error) {
            responseHandler(res, 400, error.details[0].message);
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const habit = await Habit.create({ name, goal, user_id: decoded.id });
        const status = await createAccomplishedStatus(habit._id);

        responseHandler(res, 201, 'Habit created successfully', { habit, status });
    } catch (error) {
        genericError(res, error);
    }
};

const updateHabit = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { id, name, goal } = req.body;

        if (!id || !name || !goal) {
            responseHandler(res, 400, 'Please provide all required fields');
        }

        const habit = await Habit.findByIdAndUpdate(id, { name, goal }, { new: true });

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
        }

        await Promise.all([Habit.findByIdAndDelete(id), Accomplished.deleteMany({ habit_id: id })]);

        responseHandler(res, 200, 'Habit deleted successfully');
    } catch (error) {
        genericError(res, error);
    }
};

export { createHabit, getUserHabits, updateHabit, deleteHabit };