import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorhandler.js";
import User from "../models/user.js";
import cloudinary from "cloudinary";
import crypto from "crypto";
import { sendJWTToken } from "../utils/sendJWTToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import Course from "../models/course.js";
import { getDataUri } from "../utils/dataUri.js";
import Stats from "../models/stats.js";
import jwt from "jsonwebtoken";

//Register user
export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const file = req.file;

  if (!name || !email || !password || !file)
    return next(new ErrorHandler("Please enter all field", 400));

  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorHandler("User Already Exist", 409));
  }

  //image upload should be after verifying the existance of user
  const fileUri = getDataUri(file);

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    role,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendJWTToken(user, 200, "Registered Successfully", res);
  // const token = user.getJWTToken();

  // res.status(201).json({
  //   success: true,
  //   token,
  // });
});

//login user
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //checking if user has given email and password both

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password"), 401);
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password"), 401); //don't give exact information.
  }

  sendJWTToken(user, 201, `Welcome back, ${user.name}`, res);
  // const token = user.getJWTToken();

  // res.status(201).json({
  //   success: true,
  //   token,
  // });
});

//logout user
export const logoutUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies; //cookies and not cookie
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decodedData._id); //we had given _id field while jwt.sign

  //options must be same when sending JWT token
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true, //don't add in localhost
    sameSite: "none",
  });
  res.status(200).json({
    success: true,
    message: `Hey ${user.name}, You are logged out successfully`,
  });
});

//forgot password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please Enter Email", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //get reset password token
  const resetToken = user.getResetPasswordToken();
  //its necessary to save bcoz user was already created but after passing resetPasswordToken to userSchema we have to save it.
  await user.save();

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Click on the given link to reset password :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Udemy Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return next(new ErrorHandler(error.message, 500));
  }
});

//reset password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  //getting token from the link sent to user's mailId
  const resetToken = req.params.resetToken;

  //creating hashed value of resetToken
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: new Date(Date.now()),
    },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has beeen expired",
        400
      )
    );
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not matched", 400));
  }
  user.password = req.body.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendJWTToken(user, 200, "Password Changed Successfully", res);
});

// Get My Profile
export const getMyProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

// update User password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please enter all field", 400));
  }
  const user = await User.findById(req.user._id).select("+password");

  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }

  user.password = newPassword;

  await user.save();

  sendJWTToken(user, 200, "Password has been updated", res);
});

// update User Profile
export const updateUser = catchAsyncErrors(async (req, res, next) => {
  //no change of password here as updating password route is already created above

  const { name, email } = req.body;

  const file = req.file;
  if (!name || !email) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }
  const newUserData = {
    name,
    email,
  };

  if (file) {
    const user = await User.findById(req.user._id);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    const fileUri = getDataUri(file);

    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    // const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    //   folder: "avatars",
    //   width: 150,
    //   crop: "scale",
    // });

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
    user,
  });
});

// Delete my profile
export const deleteMyProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.userId}`, 400)
    );
  }

  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  //removing token from cookie immediately when user is deleted
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User Deleted Successfully",
    });
});

// Get all users(admin)
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// // Get a single user(admin)
// export const getASingleUser = catchAsyncErrors(async (req, res, next) => {
//   const user = await User.findById(req.params.userId);

//   if (!user) {
//     return next(
//       new ErrorHandler(`User doesn't exist with id : ${req.params.userId}`, 400)
//     );
//   }

//   res.status(200).json({
//     success: true,
//     user,
//   });
// });

// update User Role -- Admin
export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newRole = {
    role: req.body.role,
  };

  let user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with id : ${req.params.userId}`, 400)
    );
  }
  user = await User.findByIdAndUpdate(req.params.userId, newRole, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

// Delete User --Admin
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.userId}`, 400)
    );
  }

  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});

//Add to Playlist
export const addToPlayLists = catchAsyncErrors(async (req, res, next) => {
  let user = await User.findById(req.user._id);

  const course = await Course.findById(req.body.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  //some returns boolean
  const courseExist = user.playLists.some((playList) => {
    return playList.course.toString() === course._id.toString();
  });
  if (courseExist) {
    return next(new ErrorHandler(`Course ${course.title} already exists`, 409));
  }
  await User.updateOne(
    { _id: req.user._id },
    {
      $push: {
        playLists: {
          course: course._id,
          poster: course.poster.url,
        },
      },
    }
  );
  user = await User.findById(req.user._id);

  res.status(201).json({
    success: true,
    message: `Course ${course.title} has been added to playlists`,
    userPlaylists: user.playLists,
  });
});

//Remove from Playlist
export const removeFromPlayLists = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.query.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  await User.updateOne(
    { _id: req.user._id },
    {
      $pull: {
        playLists: {
          course: course._id,
          poster: course.poster.url,
        },
      },
    }
  );
  const user = await User.findById(req.user._id);

  res.status(201).json({
    success: true,
    message: `Course ${course.title} has been removed from playlists`,
    userPlaylists: user.playLists,
  });
});

//get total users per month in a year
export const getTotalUsers = catchAsyncErrors(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const totalUsers = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(fromDate),
          $lt: new Date(toDate),
        },
      },
    },
    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },
          month: {
            $month: "$createdAt",
          },
        },
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  res.status(201).json({
    success: true,
    totalUsers,
  });
});

//get total active and inactive subscription
export const getTotalSubscriptions = catchAsyncErrors(
  async (req, res, next) => {
    const { fromDate, toDate } = req.query;

    const totalSubscriptions = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fromDate),
            $lt: new Date(toDate),
          },
        },
      },
      {
        $project: {
          "subscription.status": 1,
        },
      },
      {
        $group: {
          _id: {
            subscription: "$subscription.status",
          },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    res.status(201).json({
      success: true,
      totalSubscriptions,
    });
  }
);

//creating mongodb watcher for real time data updating
//this function will exceute when new user is registered
User.watch().on("change", async () => {
  const stats = await Stats.find().sort({ createdAt: -1 }).limit(1);

  const subscriptions = await User.find({
    "subscription.status": "active",
  });
  stats[0].users = await User.countDocuments();
  stats[0].subscriptions = subscriptions.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
