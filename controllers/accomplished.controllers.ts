import { Types } from 'mongoose';
import { Accomplished } from '../models/accomplished.models';
import { connectToDatabase } from '../utils/db';
import { startOfDay, endOfDay, isToday } from 'date-fns';
import { ONE_DAY } from '../utils/constants';

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

const getHabitStreak = async (id: Types.ObjectId) => {
    try {
        await connectToDatabase();

        const accomplished = await Accomplished.find({ habit_id: id, accomplished: true }).sort({ date_changed: -1 });

        if (accomplished.length === 0) {
            console.log('No streak');
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

export { getHabitAccomplishedStatus, getHabitStreak, updateAccomplishedStatus, createAccomplishedStatus };