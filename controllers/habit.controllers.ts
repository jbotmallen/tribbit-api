import { Request, Response } from 'express';
import { Habit } from '../models/habit.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import dotenv from 'dotenv';
import { sanitize } from '../utils/sanitation';
import { habitSchema } from '../utils/schemas';
import { JwtPayload, verify } from 'jsonwebtoken';
import { createAccomplishedStatus, getHabitAccomplishedStatus, getHabitAllAccomplishedStatuses, getHabitStreak } from './accomplished.controllers';
import { Accomplished } from '../models/accomplished.models';

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
            getHabitStreak(habit._id)
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

const getUserHabits = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const token = req.cookies.token;

        if (!token) {
            responseHandler(res, 401, 'Unauthorized');
            return;
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const habits = await Habit.find({ user_id: decoded.id, deleted_at: null });

        if (habits.length === 0) {
            responseHandler(res, 204, 'No habits found');
            return;
        }

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
            return;
        }
        const updatedAt = new Date().toISOString();

        const habit = await Habit.findByIdAndUpdate(id, { name, goal, updated_at: updatedAt }, { new: true });

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

export { createHabit, getUserHabits, getHabitAccomplishedDates, updateHabit, deleteHabit };