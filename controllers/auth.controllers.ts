import { Request, Response } from 'express';
import { User } from '../models/user.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import { hash, genSalt, compare } from 'bcryptjs';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';
import { ONE_DAY } from '../utils/constants';
import { getUserByEmailOrUsername, getUserById } from './user.controllers';
import { Token } from '../models/token.models';
import crypto from 'crypto';
import { sendMail } from '../utils/mail';
import { resetPasswordEmailTemplate } from '../utils/templates';

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

        if (!existingUser || !existingUser.password || existingUser.deleted_at !== null) {
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

const forgotPassword = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { email } = req.body;

        if (!email) {
            responseHandler(res, 400, 'Please provide your email address');
            return;
        }

        const user = await getUserByEmailOrUsername(email);

        if (!user) {
            responseHandler(res, 400, 'User not found');
            return;
        }

        await Token.deleteMany({ user_id: user._id })

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await hash(resetToken, Number(process.env.SALT_ROUNDS));

        await new Token({
            user_id: user._id,
            token: hashedToken,
        }).save();

        const link = `${process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173/'}reset-password/?token=${resetToken}&email=${user.email}`;
        const sendEmail = sendMail(user.email, 'Password Reset', resetPasswordEmailTemplate(link));

        if (!sendEmail) {
            responseHandler(res, 550, 'Email was not sent.')
        }

        responseHandler(res, 200, 'Password reset link sent to your email');
    } catch (error) {
        genericError(res, error);
    }
};

const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, email, new_password, confirm_password } = req.body;

        if (!token) {
            responseHandler(res, 400, "Token is required.");
            return;
        }

        if (new_password !== confirm_password) {
            responseHandler(res, 400, "Passwords do not match");
            return;
        }

        const existingUser = await getUserByEmailOrUsername(email);

        if (!existingUser) {
            responseHandler(res, 404, "User does not exist");
            return;
        }

        const existingToken = await Token.findOne({ user_id: existingUser._id });

        if (!existingToken) {
            responseHandler(res, 404, 'Token does not exist!');
            return;
        }

        if (new Date() > existingToken.valid) {
            responseHandler(res, 498, 'Token has expired');
            return;
        }

        const isValid = await compare(token, existingToken.token);

        if (!isValid) {
            responseHandler(res, 498, 'Invalid token');
            return;
        }

        const salt = await genSalt(Number(process.env.SALT_ROUNDS));

        existingUser.password = await hash(new_password, salt);
        Promise.all([existingUser.save(), existingToken.deleteOne()]);

        responseHandler(res, 200, "Password successfully reset");
    } catch (error) {
        console.error(error)
        genericError(res, error);
    }
}

const logoutUser = async (req: Request, res: Response) => {
    try {
        res.clearCookie('token');
        res.setHeader('Authorization', '');

        responseHandler(res, 200, 'User logged out successfully');
    } catch (error) {
        genericError(res, error);
    }
};

export { registerUser, loginUser, logoutUser, forgotPassword, resetPassword };