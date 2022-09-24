import express from "express";
import {
  contactUs,
  courseRequest,
  getDashboardStats,
} from "../controllers/otherController.js";
import { authorisedRoles, isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/contactUs", contactUs);

router.post("/courseRequest", courseRequest);

router.get(
  "/admin/dashboardStats",
  isAuthenticatedUser,
  authorisedRoles(["admin"]),
  getDashboardStats
);

export default router;
