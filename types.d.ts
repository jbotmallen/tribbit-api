import { Request } from "express";

// Extend the Request interface to include the custom `id` property
declare module "express-serve-static-core" {
    namespace Express {
        interface Request {
            id?: string | object;
            email?: string;
            username?: string;
        }
    }
}
