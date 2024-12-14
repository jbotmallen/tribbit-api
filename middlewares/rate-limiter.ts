import rateLimit from "express-rate-limit";
import { FIVE_MINUTES, MAX_REQUESTS } from "../utils/constants";
import { Request } from "express";

const limiter = rateLimit({
    windowMs: FIVE_MINUTES,
    max: MAX_REQUESTS,
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return req.ip || "unknown";
    },
    handler: function (req, res) {
        res.status(429).json({
            error: "Too many requests. Please slow down."
        });
    }
});

export default limiter;