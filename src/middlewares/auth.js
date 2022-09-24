import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  //for response we have cookie while for request we have cookies
  const { token } = req.cookies; //cookies and not cookie
  //   console.log(token);
  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decodedData._id); //we had given _id field while jwt.sign
  next();
});

//roles is an array-> ["admin","subadmin"]
export const authorisedRoles = (roles) => {
  return (req, res, next) => {
    //now our user is in req.user from above authentication
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};

//authorisedSubcribers
export const authorisedSubcribers = (req, res, next) => {
  if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        "Only subscribers are allowed to access the lectures",
        404
      )
    );
  }
  next();
};
