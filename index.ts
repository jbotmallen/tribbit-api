import express, { Express } from "express";
import dotenv from "dotenv";
import router from "./routes";
import cookieParser from "cookie-parser";
import rateLimiter from "./middlewares/rate-limiter";

dotenv.config();

const app: Express = express();
const PORT: string | number = process.env.SERVER_DEFAULT_PORT || 3000;

app.use(rateLimiter);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});