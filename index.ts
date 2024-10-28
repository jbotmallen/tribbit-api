import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes";
import cookieParser from "cookie-parser";
import rateLimiter from "./middlewares/rate-limiter";
import { responseHandler } from "./utils/response-handlers";

dotenv.config();

const app: Express = express();
const PORT: string | number = process.env.SERVER_DEFAULT_PORT || 3000;

app.use(rateLimiter);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.all("*", (req: Request, res: Response) => {
  responseHandler(res, 404, "Route not found");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});