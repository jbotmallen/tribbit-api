import { Request, Response } from 'express';
import { Habit } from '../models/habit.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import dotenv from 'dotenv';
import { sanitize } from '../utils/sanitation';
import { habitSchema } from '../utils/schemas';

dotenv.config();

const getUserHabits = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const decodedToken = req.cookies.token;

        const habits = await Habit.find({ user_id: decodedToken.id, deleted_at: null });

        responseHandler(res, 200, 'Habits retrieved successfully', habits);
    } catch (error) {
        genericError(res, error);
    }
};

const createHabit = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { name, goal } = req.body;
        const decodedToken = req.cookies.token;

        if (!name || !goal) {
            responseHandler(res, 400, 'Please provide all required fields');
        }

        const { error } = sanitize(habitSchema, { name, goal });

        if (error) {
            responseHandler(res, 400, error.details[0].message);
        }

        const habit = await Habit.create({ name, goal, user_id: decodedToken.id });

        responseHandler(res, 201, 'Habit created successfully', habit);
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

        await Habit.findByIdAndUpdate(id, {
            deleted_at: Date.now()
        });

        responseHandler(res, 200, 'Habit deleted successfully');
    } catch (error) {
        genericError(res, error);
    }
};

export { createHabit, getUserHabits, updateHabit, deleteHabit };