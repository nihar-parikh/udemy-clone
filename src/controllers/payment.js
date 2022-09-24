import { instance } from "../index.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import User from "../models/user.js";
import ErrorHandler from "../utils/errorhandler.js";
import crypto from "crypto";
import Payment from "../models/payment.js";

export const buySubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return next(new ErrorHandler("Admin cannot buy subscription"));
  }

  const subscription = await instance.subscriptions.create({
    plan_id: process.env.PLAN_ID,
    customer_notify: 1,
    total_count: 12,
  });


  //subscription status will be "created"
  user.subscription = {
    id: subscription.id,
    status: subscription.status,
  };

  await user.save();

  // console.log(subscription);

  res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
  });
});

export const paymentVerification = catchAsyncErrors(async (req, res, next) => {
  //callback_url will provide these parameters in the request body
  //Once the authorization transaction is successful, Razorpay returns the following data in the response:
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    req.body;

  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;

  //read docs -- same crypto algo used
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = generated_signature === razorpay_signature;

  if (!isAuthentic) {
    //url must be same as frontend url
    return res.redirect(`${process.env.FRONTEND_URL}/paymentFailed`);
  }

  //database comes here
  await Payment.create({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });

  //after payment verification only the status will be "active"
  user.subscription.status = "active";

  await user.save();

  //from frontend we will pass query and from that we can access razor_payment_id
  res.redirect(
    `${process.env.FRONTEND_URL}/paymentSuccess?reference=${razorpay_payment_id}`
  );
});

//get razorpay key
export const getRazorPayKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    razorPayKey: process.env.RAZORPAY_API_KEY,
  });
});

//cancel subscription
export const cancelSubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const subscriptionId = user.subscription.id;

  let refund = false;

  await instance.subscriptions.cancel(subscriptionId);

  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  const gap = Date.now() - payment.createdAt; //in milisecond

  const refundTime = process.env.REFUND_DAYS * 24 * 3600 * 1000; //in milisecond

  if (refundTime > gap) {
    await instance.payments.refund(payment.razorpay_payment_id);
  }

  await payment.remove();

  //or  user.subscription = null
  user.subscription.id = undefined;
  user.subscription.status = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: refund
      ? "Subscription cancelled, You'll received refund within 7 days."
      : "Subscription cancelled, No refund initiated as subsccription was cancelled after 7 days",
  });
});
