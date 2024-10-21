import { Request, Response, NextFunction } from "express";
import { JwtPayload, verify } from 'jsonwebtoken';
import { genericError, responseHandler } from "../utils/response-handlers";
import { isJwtError } from "../utils/error-handler";

const auth_check = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return responseHandler(res, 401, 'Unauthorized');
    }

    try {
        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;
        
        if(decoded.exp! * 1000 < Date.now()) { // Multiply 1000 to convert seconds to milliseconds
            return responseHandler(res, 401, 'Session expired. Please log in again.');
        }

        next();
    } catch (error) {
        if (isJwtError(error) && error.name === 'TokenExpiredError') {
            return responseHandler(res, 401, 'Session expired. Please log in again.');
        }
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
