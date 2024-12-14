import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes";
import cookieParser from "cookie-parser";
import rateLimiter from "./middlewares/rate-limiter";
import { responseHandler } from "./utils/response-handlers";
import cors from "cors";

dotenv.config();

const app: Express = express();
const PORT: string | number = process.env.SERVER_DEFAULT_PORT || 3000;
const allowedOrigins = ["http://localhost:5173", process.env.CLIENT_URL];
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
app.use(rateLimiter);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.all("*", (req: Request, res: Response) => {
  responseHandler(res, 404, "Route not found");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});