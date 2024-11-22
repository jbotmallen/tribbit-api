import { Request, Response } from 'express';
import { User } from '../models/user.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import { hash, genSalt, compare } from 'bcryptjs';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';
import { ONE_DAY } from '../utils/constants';
import { getUserByEmailOrUsername } from './user.controllers';

dotenv.config();

const registerUser = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            responseHandler(res, 400, 'Please provide all required fields');
            return;
        }

        const [existingEmail, existingUsername] = await Promise.all
            ([getUserByEmailOrUsername(email), getUserByEmailOrUsername(username)]);

        if (existingEmail || existingUsername) {
            responseHandler(res, 400, 'User with that email or username already exists');
            return;
        }

        const salt = await genSalt(Number(process.env.SALT_ROUNDS));
        const hashedPassword = await hash(password, salt);

        const user = await User.create({ email, password: hashedPassword, username });

        responseHandler(res, 201, 'User created successfully', {
            id: user._id, email: user.email, username: user.username
        });
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
            return;
        }

        const existingUser = await getUserByEmailOrUsername(identifier);

        if (!existingUser || !existingUser.password) {
            responseHandler(res, 404, 'User not found');
            return;
        }

        const isMatch = await compare(password, existingUser.password);

        if (!isMatch) {
            responseHandler(res, 400, 'Invalid credentials');
            return;
        }

        const token = sign({
            id: existingUser._id, email: existingUser.email, username: existingUser.username
        },
            process.env.JWT_SECRET!, {
            expiresIn: '1d'
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: ONE_DAY,
            sameSite: 'strict'
        });

        responseHandler(res, 200, 'User logged in successfully', {
            token,
            user: {
                id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email
            }
        });
    } catch (error) {
        genericError(res, error);
    }
};

const logoutUser = async (req: Request, res: Response) => {
    try {
        res.clearCookie('token');
        res.setHeader('Authorization', '');

        responseHandler(res, 200, 'User logged out successfully');
    } catch (error) {
        genericError(res, error);
    }
};

export { registerUser, loginUser, logoutUser };