import { Request, response, Response } from 'express';
import { User } from '../models/user.models';
import { connectToDatabase } from '../utils/db';
import dotenv from 'dotenv';
import { genericError, responseHandler } from '../utils/response-handlers';
import { JwtPayload, verify } from 'jsonwebtoken';
import { logoutUser } from './auth.controllers';

dotenv.config();

const getUserById = async (id: string) => {
    try {
        await connectToDatabase();

        const existingUser = await User.findOne({ _id: id });

        if (!existingUser) {
            return null;
        }

        return existingUser;
    } catch (error) {
        return null;
    }
};

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

const getProfileInformation = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const token = req.cookies.token;

        if (!token) {
            responseHandler(res, 401, 'Unauthorized');
            return;
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await User.findOne({ _id: decoded.id, deleted_at: null });

        if (!user) {
            responseHandler(res, 404, "User not found!");
            return;
        }

        const data = {
            username: user.username,
            email: user.email,
        }

        responseHandler(res, 200, "User found!", data);
    } catch (error) {
        genericError(res, error);
    }
};

const updateProfileInformation = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const token = req.cookies.token;

        if (!token) {
            responseHandler(res, 401, 'Unauthorized');
            return;
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const existingUser = await User.findOne({ _id: decoded.id, deleted_at: null });

        if (!existingUser) {
            responseHandler(res, 404, "User not found!");
            return;
        }

        const { username } = req.body;

        if (!username) {
            responseHandler(res, 400, "Please provide at least one field to update");
            return;
        }

        const existingUsername = await getUserByEmailOrUsername(username);

        if (existingUsername) {
            responseHandler(res, 400, "Username already exists");
            return;
        }

        if (existingUser.username === username) {
            responseHandler(res, 400, "Username is the same as the current one");
            return;
        }

        existingUser.username = username;

        await existingUser.save();

        responseHandler(res, 200, "User updated successfully");
    } catch (error) {
        genericError(res, error);
    }
};

const softDeleteUser = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const token = req.cookies.token;

        if (!token) {
            responseHandler(res, 401, 'Unauthorized');
            return;
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const existingUser = await User.findOne({ _id: decoded.id, deleted_at: null });

        if (!existingUser) {
            responseHandler(res, 404, "User not found!");
            return;
        }

        existingUser.deleted_at = new Date();

        await existingUser.save();

        logoutUser(req, res);
        responseHandler(res, 200, "User deleted successfully");
    } catch (error) {
        genericError(res, error);
    }
};

export { getUserById, getUserByEmailOrUsername, getProfileInformation, updateProfileInformation, softDeleteUser };