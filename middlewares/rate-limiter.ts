import rateLimit from "express-rate-limit";
import { FIFTEEN_MINUTES, MAX_REQUESTS } from "../utils/constants";

const limiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: MAX_REQUESTS,
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        res.status(429).json({
            error: "Too many requests. Please slow down."
        });
    }
});

export default limiter;