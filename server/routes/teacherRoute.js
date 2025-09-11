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

/**
 * @swagger
 * /teachers/{teacherId}/schedules:
 *   get:
 *     summary: Get teaching schedule for a specific teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teaching schedule
 */
// Get teaching schedule for a specific teacher
router.get("/:teacherId/schedules", getTeachingSchedule);

/**
 * @swagger
 * /teachers/slots:
 *   get:
 *     summary: Get teaching slots
 *     tags: [Teachers]
 *     responses:
 *       200:
 *         description: Teaching slots
 */
// Get teaching slots
router.get("/slots", getTeachingSlots);

/**
 * @swagger
 * /teachers/{teacherId}/classes:
 *   get:
 *     summary: Get teaching classes
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teaching classes
 */
// Get teaching classes
router.get("/:teacherId/classes",  getTeachingClasses);

/**
 * @swagger
 * /teachers/{teacherId}/classes/{classId}:
 *   get:
 *     summary: Get teaching class details
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teaching class details
 */
// Get teaching class details
router.get("/:teacherId/classes/:classId",  getTeachingClassDetails);

/**
 * @swagger
 * /teachers/{teacherId}/courses:
 *   get:
 *     summary: Get courses for a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Courses for teacher
 */
//Get courses
router.get("/:teacherId/courses", getCourses);

/**
 * @swagger
 * /teachers/{teacherId}/courses/{courseId}:
 *   get:
 *     summary: Get course details for a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 */
//Get course details
router.get("/:teacherId/courses/:courseId", getCourseDetails);

/**
 * @swagger
 * /teachers/{teacherId}/classes/{classId}/grades:
 *   get:
 *     summary: Get grades of a specific class
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grades of class
 */
// Get grades of a specific class
router.get("/:teacherId/classes/:classId/grades", getGradesOfAClass);

/**
 * @swagger
 * /teachers/{teacherId}/classes/{classId}/grades/student/{studentId}:
 *   get:
 *     summary: Get grades for a specific student in a class
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grades for student
 */
// Get grades for a specific student in a class
router.get("/:teacherId/classes/:classId/grades/student/:studentId", getGradesOfAStudent);

/**
 * @swagger
 * /teachers/{teacherId}/classes/{classId}/grades/student/{studentId}:
 *   post:
 *     summary: Add grades for a specific student in a class
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       201:
 *         description: Grade added
 */
// Add grades for a specific student in a class
router.post("/:teacherId/classes/:classId/grades/student/:studentId", addGradeToAStudent);

/**
 * @swagger
 * /teachers/grades/{gradeId}:
 *   patch:
 *     summary: Update grades for a specific student in a class
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: gradeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       200:
 *         description: Grade updated
 */
// Update grades for a specific student in a class
router.patch("/grades/:gradeId", updateGradesOfAStudent);

module.exports = router; 