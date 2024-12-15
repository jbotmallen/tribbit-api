import { Request, Response } from 'express';
import { User } from '../models/user.models';
import { connectToDatabase } from '../utils/db';
import { genericError, responseHandler } from '../utils/response-handlers';
import { hash, genSalt, compare } from 'bcryptjs';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';
import { MAX_LOGIN_ATTEMPTS, ONE_DAY } from '../utils/constants';
import { getUserByEmailOrUsername, getUserById } from './user.controllers';
import { Token } from '../models/token.models';
import { sendMail } from '../utils/mail';
import { otpEmailTemplate, resetPasswordEmailTemplate, verifyEmailTemplate } from '../utils/templates';
import { deleteUserTokens, generateResetPasswordToken } from './token.controllers';
import { generateOtp, getOtpByEmail, saveOtp } from './otp.controllers';

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

        const verification = await generateResetPasswordToken(user._id);

        if (!verification) {
            Promise.all([user.deleteOne(), deleteUserTokens(user._id)]);

            responseHandler(res, 500, 'Token generation failed. Registration failed.');
            return;
        }

        const link = `${process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173/'}verify-email/?token=${verification}&email=${user.email}`;
        await sendMail(user.email, 'Email Verification', verifyEmailTemplate(link));

        responseHandler(res, 201, 'Check email for verification.', {
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

        if (existingUser.loginAttempts > 5) {
            responseHandler(res, 403, 'Account locked. Please reset your password.');
            return;
        }

        const isMatch = await compare(password, existingUser.password);

        if (!isMatch && existingUser.loginAttempts <= MAX_LOGIN_ATTEMPTS) {
            existingUser.loginAttempts += 1;
            await existingUser.save();
            responseHandler(res, 400, 'Invalid credentials');
            return;
        }

        if (!existingUser.verified) {
            responseHandler(res, 403, 'Email not verified. Check your email.');
            return;
        }

        const existingOtp = await getOtpByEmail(existingUser.email);

        if (existingOtp) {
            responseHandler(res, 200, 'OTP already sent. Check your email.', { email: existingUser.email });
            return;
        }

        const otp = generateOtp();
        const newOtp = await saveOtp(existingUser.email, otp);

        if (!otp || !newOtp) {
            responseHandler(res, 500, 'OTP generation failed');
            return;
        }

        const otpSent = await sendMail(existingUser.email, 'Login OTP', otpEmailTemplate(otp));

        if (!otpSent) {
            responseHandler(res, 500, 'OTP not sent');
            return;
        }

        responseHandler(res, 200, 'OTP sent to email', { email: existingUser.email });
    } catch (error) {
        genericError(res, error);
    }
};

const verifyOtp = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { email, otp } = req.body;

        if (!email || !otp) {
            responseHandler(res, 400, 'Email and OTP are required');
            return;
        }

        const existingOtp = await getOtpByEmail(email);

        if (!existingOtp) {
            responseHandler(res, 404, 'OTP not found or expired');
            return;
        }

        if (existingOtp.otp !== otp) {
            responseHandler(res, 400, 'Invalid OTP');
            return;
        }

        await existingOtp.deleteOne();

        const user = await getUserByEmailOrUsername(email as string);

        if (!user) {
            responseHandler(res, 404, 'User not found');
            return;
        }

        user.loginAttempts = 0;
        await user.save();

        const token = sign({
            id: user._id, email: user.email, username: user.username
        },
            process.env.JWT_SECRET!, {
            expiresIn: '1d'
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: ONE_DAY,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        responseHandler(res, 200, 'Logged in successfully', {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        genericError(res, error);
    }
};

const verifyToken = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { token, email } = req.query;

        if (!token || !email) {
            responseHandler(res, 400, 'Token and email are required');
            return;
        }

        const user = await getUserByEmailOrUsername(email as string);

        if (!user) {
            responseHandler(res, 404, 'User not found');
            return;
        }

        const existingToken = await Token.findOne({ user_id: user._id });

        if (!existingToken) {
            responseHandler(res, 404, 'Token does not exist!');
            return;
        }

        const isValid = await compare(token as string, existingToken.token);

        if (!isValid) {
            responseHandler(res, 498, 'Invalid token');
            return;
        }

        responseHandler(res, 200, 'Token verified successfully');
    } catch (error) {
        genericError(res, error);
    }
}

const verifyEmail = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();

        const { token, email } = req.body;

        if (!token || !email) {
            responseHandler(res, 400, 'Token and email are required');
            return;
        }

        const user = await getUserByEmailOrUsername(email);

        if (!user) {
            responseHandler(res, 404, 'User not found');
            return;
        }

        const existingToken = await Token.findOne({ user_id: user._id });

        if (!existingToken) {
            responseHandler(res, 404, 'Token does not exist!');
            return;
        }

        const isValid = await compare(token, existingToken.token);

        if (!isValid) {
            responseHandler(res, 498, 'Invalid token');
            return;
        }

        user.verified = true;

        await user.save();
        await existingToken.deleteOne();

        responseHandler(res, 200, 'Email verified successfully');
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

        await deleteUserTokens(user._id);

        const resetToken = await generateResetPasswordToken(user._id);

        if (!resetToken) {
            responseHandler(res, 500, 'Token generation failed');
            return;
        }

        const link = `${process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173/'}reset-password/?token=${resetToken}&email=${user.email}`;
        const sendEmail = await sendMail(user.email, 'Password Reset', resetPasswordEmailTemplate(link));

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

        if (!existingUser || !existingUser.verified) {
            responseHandler(res, 404, "User does not exist");
            return;
        }

        const existingToken = await Token.findOne({ user_id: existingUser._id });

        if (!existingToken) {
            responseHandler(res, 404, 'Token does not exist!');
            return;
        }

        const isValid = await compare(token, existingToken.token);

        if (!isValid) {
            responseHandler(res, 498, 'Invalid token');
            return;
        }

        const salt = await genSalt(Number(process.env.SALT_ROUNDS));

        existingUser.password = await hash(new_password, salt);
        existingUser.loginAttempts = 0;
        Promise.all([existingUser.save(), existingToken.deleteOne()]);

        responseHandler(res, 200, "Password successfully reset");
    } catch (error) {
        console.error(error)
        genericError(res, error);
    }
}

const logoutUser = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            responseHandler(res, 401, 'No token found, unauthorized access');
            return;
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        res.destroy();

        responseHandler(res, 200, 'User logged out successfully');
    } catch (error) {
        genericError(res, error);
    }
};

export { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, verifyEmail, verifyOtp, verifyToken };