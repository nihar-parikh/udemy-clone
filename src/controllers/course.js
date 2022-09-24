import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import Course from "../models/course.js";
import { getDataUri } from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import Stats from "../models/stats.js";
import ApiFeatures from "../utils/apiFeatures.js";

//create course -- Admin
export const createCourse = catchAsyncErrors(async (req, res, next) => {
  //our user is in req.user, so passing user's id in product's req.body
  req.body.createdBy = {
    userId: req.user._id,
    userName: req.user.name,
    role: req.user.role,
  };

  const { title, description, category, createdBy } = req.body;
  if (!title || !description || !category) {
    return next(new ErrorHandler("Please add all fields", 400));
  }

  const file = req.file;
  const fileUri = getDataUri(file);

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  res.status(201).json({
    success: true,
    course,
  });
});

//get all courses without lectures
export const getAllCourses = catchAsyncErrors(async (req, res, next) => {
  // const courses = await Course.find().select("-lectures"); //lectures are only be shown to subscribers
  const coursesPerPage = 2;
  const apiFeatures = new ApiFeatures(
    Course.find().select("-lectures"),
    req.query
  )
    .search()
    .pagination(coursesPerPage);
  const courses = await apiFeatures.query;

  res.status(200).json({
    success: true,
    courses,
  });
});

//get course lectures
export const getCourseLectures = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  if (course.lectures.length !== 0) {
    await Course.updateOne({ _id: course._id }, { $inc: { views: 1 } });
  }

  res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

//Max video size 100MB bcoz we are using free account on cloudinary
//add course lectures
export const addCourseLectures = catchAsyncErrors(async (req, res, next) => {
  const { title, description } = req.body;

  let course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  const file = req.file;
  const fileUri = getDataUri(file);

  //resource_type: "video", bcoz we are uploading video.
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  await Course.updateOne(
    { _id: course._id },
    {
      $push: {
        lectures: {
          title,
          description,
          video: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
        },
      },
      $inc: { numberOfVideos: 1 },
    }
  );

  course = await Course.findById(req.params.courseId);

  res.status(200).json({
    success: true,
    message: "Lecture added successfully",
    lectures: course.lectures,
  });
});

//delete course -- Admin
export const deleteCourse = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  await cloudinary.v2.uploader.destroy(course.poster.public_id);

  course.lectures.map(async (lecture) => {
    await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
      resource_type: "video",
    });
  });

  await course.remove();
  res.status(201).json({
    success: true,
    message: `Course has been deleted successfully`,
  });
});

//delete a lecture from a course -- Admin
export const deleteLecture = catchAsyncErrors(async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);

  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  const lecture = course.lectures.find(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );

  if (!lecture) {
    return next(new ErrorHandler("Lecture not found", 404));
  }

  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  await Course.updateOne(
    { _id: courseId },
    { $pull: { lectures: { _id: lectureId } }, $inc: { numberOfVideos: -1 } }
  );

  res.status(201).json({
    success: true,
    message: `Lecture has been deleted successfully`,
  });
});

//get total views per month
export const getTotalViews = catchAsyncErrors(async (req, res, next) => {
  const { fromDate, toDate } = req.query;
  const totalViews = await Course.aggregate([
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
        totalViews: {
          $sum: "$views",
        },
      },
    },
  ]);

  res.status(201).json({
    success: true,
    totalViews,
  });
});

//mongodb watcher -- real time data updating
//this function will exceute when new course is added
Course.watch().on("change", async () => {
  const stats = await Stats.find().sort({ createdAt: -1 }).limit(1);
  const courses = await Course.find();

  let totalViews = 0;

  courses.map((course) => {
    totalViews += course.views;
  });

  stats[0].views = totalViews;
  stats[0].createdAt = new Date(Date.now());
  await stats[0].save();
});
