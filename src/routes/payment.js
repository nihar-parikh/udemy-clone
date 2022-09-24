import express from "express";
import {
  buySubscription,
  cancelSubscription,
  getRazorPayKey,
  paymentVerification,
} from "../controllers/payment.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();

//buy subscription
router.get("/subscribe", isAuthenticatedUser, buySubscription);

// Verify Payment and save reference in database
router.post("/paymentVerification", isAuthenticatedUser, paymentVerification);

// Get Razorpay key
router.get("/razorPayKey", getRazorPayKey);

//cancel subscription
router.delete("/subscribe/cancel", isAuthenticatedUser, cancelSubscription);

export default router;
