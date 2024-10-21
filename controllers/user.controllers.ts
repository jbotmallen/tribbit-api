import { User } from '../models/user.models';
import { connectToDatabase } from '../utils/db';
import dotenv from 'dotenv';

dotenv.config();

const getUserByEmailOrUsername = async (identifier: string) => {
    try {
        await connectToDatabase();

        const existingUser = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!existingUser) {
            return null;
        }

        return existingUser;
    } catch (error) {
        return null;
    }
};

export { getUserByEmailOrUsername };