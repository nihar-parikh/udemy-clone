import mongoose from "mongoose";
const { Schema } = mongoose;
import validator from "validator";
import { kMaxLength } from "buffer";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please Enter Course Title"],
      maxLength: [80, "Title cannot exceed 30 characters"],
      minLength: [4, "Title should have more than 4 characters"],
    },
    description: {
      type: String,
      required: [true, "Please Enter Course Description"],
      minLength: [15, "Description should have more than 20 characters"],
    },
    lectures: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        video: {
          public_id: {
            type: String,
            required: true,
          },
          url: {
            type: String,
            required: true,
          },
        },
      },
    ],
    poster: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    views: {
      type: Number,
      default: 0,
    },
    numberOfVideos: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        ratings: {
          type: Number,
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
      },
    ],
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
