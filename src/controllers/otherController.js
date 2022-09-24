import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import Stats from "../models/stats.js";
import User from "../models/user.js";
import ErrorHandler from "../utils/errorhandler.js";
import { sendEmail } from "../utils/sendEmail.js";

export const contactUs = catchAsyncErrors(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return next(new ErrorHandler("Please enter all fields", 404));
  }

  const to = process.env.MY_MAIL;
  const subject = "Contact from udemy-clone";
  const text = `I am ${name} and my email is ${email}. \n
${message}`;

  await sendEmail({
    email: to,
    subject,
    message: text,
  });

  res.status(200).json({
    success: true,
    message: "Your message has been sent successfully",
  });
});

export const courseRequest = catchAsyncErrors(async (req, res, next) => {
  const { name, email, course } = req.body;

  if (!name || !email || !course) {
    return next(new ErrorHandler("Please enter all fields", 404));
  }

  const to = process.env.MY_MAIL;
  const subject = "Contact from udemy-clone";
  const text = `I am ${name} and my email is ${email}. \n
  ${course}`;

  await sendEmail({
    email: to,
    subject,
    message: text,
  });

  res.status(200).json({
    success: true,
    message: "Your course request has been sent successfully",
  });
});

export const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Stats.find().sort({ createdAt: -1 }).limit(12);

  const statsData = [];

  stats.map((stat) => {
    statsData.unshift(stat);
  });

  const requiredSize = 12 - stats.length;

  for (let i = 0; i < requiredSize; i++) {
    statsData.unshift({
      users: 0,
      subscriptions: 0,
      views: 0,
    });
  }

  const usersCount = statsData[11].users;
  const subscriptionsCount = statsData[11].subscriptions;
  const viewsCount = statsData[11].views;

  let usersPercentage = 0,
    subscriptionsPercentage = 0,
    viewsPercentage = 0;

  let usersProfit = true,
    subscriptionsProfit = true,
    viewsProfit = true;

  if (statsData[10].users === 0) usersPercentage = usersCount * 100;
  if (statsData[10].views === 0) viewsPercentage = viewsCount * 100;
  if (statsData[10].subscriptions === 0)
    subscriptionsPercentage = subscriptionsCount * 100;
  else {
    const difference = {
      users: statsData[11].users - statsData[10].users,
      views: statsData[11].views - statsData[10].views,
      subscriptions: statsData[11].subscriptions - statsData[10].subscriptions,
    };
    usersPercentage = (difference.users / statsData[10].users) * 100;
    viewsPercentage = (difference.views / statsData[10].views) * 100;
    subscriptionsPercentage =
      (difference.subscriptions / statsData[10].subscriptions) * 100;
    if (usersPercentage < 0) usersProfit = false;
    if (viewsPercentage < 0) viewsProfit = false;
    if (subscriptionsPercentage < 0) subscriptionsProfit = false;
  }

  res.status(200).json({
    success: true,
    stats: statsData,
    usersCount,
    subscriptionsCount,
    viewsCount,
    subscriptionsPercentage,
    viewsPercentage,
    usersPercentage,
    subscriptionsProfit,
    viewsProfit,
    usersProfit,
  });
});


