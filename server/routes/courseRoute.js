const express = require("express");
const router = express.Router();
const authAdmin = require("../middlewares/authAdmin");
const authTeacher = require("../middlewares/authTeacher");
const {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");

router.get("/", getAllCourses);

router.post("/add",authAdmin, createCourse);

router.put("/update/:id",authAdmin, updateCourse);

router.delete("/delete/:id",authAdmin, deleteCourse);
module.exports = router;
