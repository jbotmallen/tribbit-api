import { Request, Response, NextFunction } from "express";
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { genericError, responseHandler } from "../utils/response-handlers";
import { isJwtError } from "../utils/error-handler";
import { ONE_DAY } from "../utils/constants";

const isValidJwtFormat = (token: string) => {
    const jwtRegex = /^[A-Za-z0-9-._~]+\.([A-Za-z0-9-._~]+)\.([A-Za-z0-9-._~]+)$/;
    return jwtRegex.test(token);
};
import { getUserById } from "../controllers/user.controllers";

const auth_check = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    console.log('Cookies:', req.cookies);
    console.log('Authorization Header:', req.headers.authorization);

    if (!token) {
        console.log('No token found in the middleware');
        responseHandler(res, 401, 'Unauthorized Access');
        return;
    }

    if (!isValidJwtFormat(token)) {
        return responseHandler(res, 400, 'Invalid token format');
    }

    try {
        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        if (decoded.exp! * 1000 < Date.now()) { // Multiply 1000 to convert seconds to milliseconds
            return responseHandler(res, 401, 'Session expired. Please log in again.');
        }

        const { id, email, username } = decoded;
        const existingUser = await getUserById(id);

        if (!existingUser) {
            return responseHandler(res, 404, 'User not found');
        }

        const newToken = sign({ id, email, username }, process.env.JWT_SECRET!, { expiresIn: '1d' });

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: ONE_DAY,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        next();
    } catch (error) {
        if (isJwtError(error) && error.name === 'TokenExpiredError') {
            return responseHandler(res, 401, 'Session expired. Please log in again.');
        }
        genericError(res, error);
    }
};

const auth_prevention = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (token) {
        try {
            verify(token, process.env.JWT_SECRET!);

            responseHandler(res, 400, 'You are already logged in');
        } catch (error) {
            genericError(res, error);
        }
    } else {
        next();
    }
}

export { auth_check, auth_prevention };
