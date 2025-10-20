const express = require("express");
const router = express.Router();
const { jwtAuth } = require("../middlewares/auth");
const { getStudentSchedule } = require("../controllers/scheduleController");
const {
  getAllGradesOfAStudentInAllClasses,
  getGradesOfAStudent,
} = require("../controllers/gradeController");
const {
  getAllClassesByUserId,
  getClassesByUserId,
  getRegisterableClasses,
  enrollInClass,
  unenrollFromClass,
} = require("../controllers/classController");

router.get("/:studentId/schedule",  getStudentSchedule);

router.get("/:studentId/grades",  getAllGradesOfAStudentInAllClasses);

router.get("/:studentId/grades/class/:classId",  getGradesOfAStudent);

router.get("/:studentId/my-classes",  getAllClassesByUserId);

router.get("/my-classes/:classId",  getClassesByUserId);

router.get("/:studentId/registerable-classes",  getRegisterableClasses);

// Using :id to match the controller's expectation
router.post("/register-class/:id", jwtAuth, enrollInClass);

router.delete("/register-class/:classid",  unenrollFromClass);


module.exports = router;
