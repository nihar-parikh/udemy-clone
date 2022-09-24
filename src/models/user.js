import mongoose from "mongoose";
const { Schema } = mongoose;
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { kMaxLength } from "buffer";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
      maxLength: [30, "Name cannot exceed 30 characters"],
      minLength: [4, "Name should have more than"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid Email"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [3, "Password should be greater than 3 characters"],
      select: false, //means this field will not be populated in response data
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    role: {
      type: String,
      enum: ["admin", "sub-admin", "user"],
      default: "user",
    },
    //id and status of subcription will get from razorpay
    subscription: {
      id: String,
      status: String,
    },
    playLists: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "course",
          required: true,
        },
        poster: {
          type: String,
        },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

//Hashing password
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

//compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  const user = this;
  return await bcrypt.compare(enteredPassword, user.password);
};

//JWT TOKEN
userSchema.methods.getJWTToken = function () {
  const user = this;
  return jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Generating password reset token
userSchema.methods.getResetPasswordToken = function () {
  const user = this;
  const resetToken = crypto.randomBytes(20).toString("hex");
  //hashing the resetToken and saving in user model
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //expires in 15 mins. from the instant that token is created
  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
