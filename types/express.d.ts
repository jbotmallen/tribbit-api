import { Request } from "express";

declare global {
    namespace Express {
        interface Request {
            id?: string | object;
            email?: string;
            username?: string;
        }
    }
}
