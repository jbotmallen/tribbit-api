import { Types } from "mongoose";
import { Token } from "../models/token.models";
import { connectToDatabase } from "../utils/db";
import crypto from "crypto";
import { hash } from "bcryptjs";

const checkToken = async (token: string) => {
    try {
        await connectToDatabase();

        const tokenDoc = await Token.findOne({ token });

        return tokenDoc;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const getTokenByUserId = async (userId: Types.ObjectId) => {
    try {
        await connectToDatabase();

        const token = await Token.findOne({ user: userId });

        return token;
    } catch (error) {
        console.error(error);
        return null;
    }
}

const deleteUserTokens = async (userId: Types.ObjectId) => {
    try {
        await connectToDatabase();

        await Token.deleteMany({ user: userId });

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const generateResetPasswordToken = async (userId: Types.ObjectId) => {
    try {
        await connectToDatabase();

        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = await hash(token, Number(process.env.SALT_ROUNDS));

        await new Token({
            user_id: userId,
            token: hashedToken,
        }).save();

        return token;
    } catch (error) {
        console.error(error);
        return '';
    }
}

export { deleteUserTokens, generateResetPasswordToken, getTokenByUserId, checkToken };