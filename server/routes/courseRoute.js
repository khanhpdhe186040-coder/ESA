const express = require("express");
const router = express.Router();
const authAdmin = require("../middlewares/authAdmin");
const authTeacher = require("../middlewares/authTeacher");
const {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getPublicCourses,
  getCourseReviews,
  addCourseReview,
  upvoteReview,
  downvoteReview,
} = require("../controllers/courseController");

// Public routes - no authentication required
router.get("/public", getPublicCourses);
router.get("/:id/reviews", getCourseReviews);
router.post("/:id/reviews", addCourseReview);
router.post("/:courseId/reviews/:reviewId/upvote", upvoteReview);
router.post("/:courseId/reviews/:reviewId/downvote", downvoteReview);

// Protected routes - admin only
router.get("/",authAdmin, getAllCourses);
router.post("/add",authAdmin, createCourse);
router.put("/update/:id",authAdmin, updateCourse);
router.delete("/delete/:id",authAdmin, deleteCourse);

module.exports = router;
