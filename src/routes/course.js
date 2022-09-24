import express from "express";
import {
  addCourseLectures,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllCourses,
  getCourseLectures,
  getTotalViews,
} from "../controllers/course.js";
// import {
//   createProduct,
//   createProductReview,
//   deleteProduct,
//   deleteProductReviews,
//   getAllProducts,
//   getProductReviews,
//   getSingleProduct,
//   updateProduct,
// } from "../controllers/product.js";
import {
  authorisedRoles,
  authorisedSubcribers,
  isAuthenticatedUser,
} from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.post(
  "/courses/new",
  isAuthenticatedUser,
  authorisedRoles(["admin", "sub-admin"]),
  singleUpload,
  createCourse
);

//get all courses without lectures
router.get("/courses", getAllCourses);
router.get("/courses/totalViews", getTotalViews);

//get course lectures
router.get(
  "/courses/:courseId",
  isAuthenticatedUser,
  authorisedSubcribers,
  getCourseLectures
);

router.post(
  "/courses/:courseId",
  isAuthenticatedUser,
  authorisedRoles(["admin"]),
  singleUpload,
  addCourseLectures
);

// router.put(
//   "/products/:productId",
//   isAuthenticatedUser,
//   authorisedRoles(["admin"]),
//   updateProduct
// );
// router.get("/products/:productId", getSingleProduct);
// router.delete(
//   "/products/:productId",
//   isAuthenticatedUser,
//   authorisedRoles(["admin"]),
//   deleteProduct
// );
// router.put(
//   "/products/reviews/:productId",
//   isAuthenticatedUser,
//   createProductReview
// );
// router.get("/product/reviews/:productId", getProductReviews);
router.delete(
  "/courses/:courseId",
  isAuthenticatedUser,
  authorisedRoles(["admin"]),
  deleteCourse
);
router.delete(
  "/course/lecture",
  isAuthenticatedUser,
  authorisedRoles(["admin"]),
  deleteLecture
);
export default router;
