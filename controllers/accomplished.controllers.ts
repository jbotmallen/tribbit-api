import { Types } from 'mongoose';
import { Accomplished } from '../models/accomplished.models';
import { connectToDatabase } from '../utils/db';
import { startOfDay, endOfDay } from 'date-fns';

const getHabitAccomplishedStatus = async (id: Types.ObjectId, date: string) => {
    try {
        await connectToDatabase();

        const start = startOfDay(new Date(date));
        const end = endOfDay(new Date(date));

        const accomplished = await Accomplished.findOne({
            habit_id: id,
            date_changed: { $gte: start, $lte: end }
        });

        return accomplished ? accomplished.accomplished : false;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const createAccomplishedStatus = async (id: Types.ObjectId) => {
    try {
        await connectToDatabase();

        const accomplished = await Accomplished.create({ habit_id: id, accomplished: false });

        return accomplished ? accomplished : null;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const updateAccomplishedStatus = async (id: Types.ObjectId) => {
    try {
        await connectToDatabase();

        const accomplished = await Accomplished.findOne({ habit_id: id });

        if (!accomplished) {
            await Accomplished.create({ habit_id: id, accomplished: true });
        } else {
            accomplished.accomplished = !accomplished.accomplished;
            await accomplished.save();
        }

        return accomplished;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export { getHabitAccomplishedStatus, updateAccomplishedStatus, createAccomplishedStatus };