import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config({
  path: "./src/config/config.env",
});

const app = express();

// Using Middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

//Route imports
import userRouters from "./routes/user.js";
import courseRouters from "./routes/course.js";
import paymentRouters from "./routes/payment.js";
import otherRouters from "./routes/otherRoutes.js";

import { errorMiddleware } from "./middlewares/error.js";

app.use("/api/v1", userRouters);
app.use("/api/v1", courseRouters);
app.use("/api/v1", paymentRouters);
app.use("/api/v1", otherRouters);


//this middleware should be at the last of all routes/handlers meaning if every handler is called and if throws error then next is called
//middleware for error
app.use(errorMiddleware); //using errorMiddleware
export default app;
