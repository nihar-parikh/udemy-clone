import app from "./app.js";
import { connectToMongo } from "./config/mongoose.js";
import cloudinary from "cloudinary";
import Razorpay from "razorpay";
import nodeCron from "node-cron";
import Stats from "./models/stats.js";

const port = process.env.PORT || 8000;

connectToMongo(); //always after dotenv.config()

//cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

//creating instance of razorpay and using it in api
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

//The node-cron module is tiny task scheduler in pure JavaScript for node.js
//This module allows you to schedule task in node.js using full crontab syntax.
nodeCron.schedule("0 0 0 1 * *", async () => {
  try {
    await Stats.create({});
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
