import { Request, Response } from 'express';
import { User } from '../models/user.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import { hash, genSalt, compare } from 'bcryptjs';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';

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

const createUser = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            responseHandler(res, 400, 'Please provide all required fields');
        }

        const [existingEmail, existingUsername] = await Promise.all
            ([getUserByEmailOrUsername(email), getUserByEmailOrUsername(username)]);

        if (existingEmail || existingUsername) {
            responseHandler(res, 400, 'User with that email or username already exists');
        }

        const salt = await genSalt(Number(process.env.SALT_ROUNDS));
        const hashedPassword = await hash(password, salt);

        const user = await User.create({ email, password: hashedPassword, username });

        responseHandler(res, 201, 'User created successfully', user);
    } catch (error) {
        genericError(res, error);
    }
};

const loginUser = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { identifier, password } = req.body;

        if (!identifier || !password) {
            responseHandler(res, 400, 'Please provide all required fields');
        }

        const existingUser = await getUserByEmailOrUsername(identifier);

        if (!existingUser) {
            return responseHandler(res, 404, 'User not found');
        }

        const isMatch = await compare(password, existingUser.password);

        if (!isMatch) {
            responseHandler(res, 400, 'Invalid credentials');
        }

        const token = sign({
            id: existingUser._id, email: existingUser.email, username: existingUser.username
        },
            process.env.JWT_SECRET!, {
                expiresIn: '1d'
        });

        responseHandler(res, 200, 'User logged in successfully', token);
    } catch (error) {
        genericError(res, error);
    }
};

export { createUser, loginUser };