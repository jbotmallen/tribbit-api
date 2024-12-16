import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes";
import cookieParser from "cookie-parser";
import rateLimiter from "./middlewares/rate-limiter";
import { responseHandler } from "./utils/response-handlers";
import cors from "cors";
import requestLogger from "./middlewares/request-logger";

dotenv.config();

const app: Express = express();
const PORT: string | number = process.env.SERVER_DEFAULT_PORT || 3000;
const allowedOrigins = ["http://localhost:5173", "https://tribbit-app.vercel.app", "https://tribbit-app.vercel.app/"];
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.set("trust proxy", 1);

app.use(cors(corsOptions));
app.disable("x-powered-by");
app.use(rateLimiter);

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

process.env.NODE_ENV !== "test" && app.use(requestLogger);
app.use("/api", router);
app.all("*", (req: Request, res: Response) => {
  responseHandler(res, 404, "Route not found");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
