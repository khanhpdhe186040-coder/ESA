const express = require("express");
const router = express.Router();
const { 
    getTeachingSchedule, 
    getTeachingSlots, 
    getTeachingClasses,
    getTeachingClassDetails,
    getCourses,
    getCourseDetails,
    getGradesOfAClass,
    getGradesOfAStudent,
    addGradeToAStudent,
    updateGradesOfAStudent
} = require("../controllers/teacherController");
const authTeacher = require("../middlewares/authTeacher");

// Get teaching schedule for a specific teacher
router.get("/:teacherId/schedules", getTeachingSchedule);

// Get teaching slots
router.get("/slots", getTeachingSlots);

// Get teaching classes
router.get("/:teacherId/classes",  getTeachingClasses);

// Get teaching class details
router.get("/:teacherId/classes/:classId",  getTeachingClassDetails);

//Get courses
router.get("/:teacherId/courses", getCourses);

//Get course details
router.get("/:teacherId/courses/:courseId", getCourseDetails);

// Get grades of a specific class
router.get("/:teacherId/classes/:classId/grades", getGradesOfAClass);

// Get grades for a specific student in a class
router.get("/:teacherId/classes/:classId/grades/student/:studentId", getGradesOfAStudent);

// Add grades for a specific student in a class
router.post("/:teacherId/classes/:classId/grades/student/:studentId", addGradeToAStudent);

// Update grades for a specific student in a class
router.patch("/grades/:gradeId", updateGradesOfAStudent);

module.exports = router; 