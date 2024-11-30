import { Otp } from '../models/otp.models';
import crypto from 'crypto';

const generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const saveOtp = async (email: string, otp: string) => {
    try {
        await Otp.deleteMany({ email });
        const newOtp = await Otp.create({ email, otp });

        if (!newOtp) {
            return null;
        }

        return newOtp;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const getOtpByEmail = async (email: string) => {
    try {
        const otp = await Otp.findOne({ email });

        if (!otp) {
            return null;
        }

        return otp;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export { generateOtp, saveOtp, getOtpByEmail };
