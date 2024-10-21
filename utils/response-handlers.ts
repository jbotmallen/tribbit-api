import { Response } from "express";

const responseHandler = (res: Response, status: number, message: string, data?: any) => {
    if (!res.headersSent) {
        res.status(status).json({
            status,
            message,
            data,
        });
    }
};

const genericError = (res: Response, error: any) => {
    console.error(error);
    if (!res.headersSent) {
        const status = 500;

        res.status(status).json({
            status: status,
            message: "Internal Server Error",
        });
    }
};

export { responseHandler, genericError };