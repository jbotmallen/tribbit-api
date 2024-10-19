import { Request, Response, NextFunction } from "express";
import { verify } from 'jsonwebtoken';
import { genericError, responseHandler } from "../utils/response-handlers";
import { ONE_DAY } from "../utils/constants";

const auth_check = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return responseHandler(res, 401, 'Unauthorized');
    }

    try {
        const decoded = verify(token, process.env.JWT_SECRET!);
        res.cookie('token', decoded, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: ONE_DAY,
        });

        next();
    } catch (error) {
        genericError(res, error);
    }
};

const auth_prevention = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
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
