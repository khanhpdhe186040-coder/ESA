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

/**
 * @swagger
 * /students/{studentId}/schedule:
 *   get:
 *     summary: Get student schedule
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student schedule
 */
router.get("/:studentId/schedule",  getStudentSchedule);

/**
 * @swagger
 * /students/{studentId}/grades:
 *   get:
 *     summary: Get all grades of a student in all classes
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All grades of student
 */
router.get("/:studentId/grades",  getAllGradesOfAStudentInAllClasses);

/**
 * @swagger
 * /students/{studentId}/grades/class/{classId}:
 *   get:
 *     summary: Get grades of a student in a class
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
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
 *         description: Grades of student in class
 */
router.get("/:studentId/grades/class/:classId",  getGradesOfAStudent);

/**
 * @swagger
 * /students/{studentId}/my-classes:
 *   get:
 *     summary: Get all classes by user ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All classes by user ID
 */
router.get("/:studentId/my-classes",  getAllClassesByUserId);

/**
 * @swagger
 * /students/my-classes/:
 *   get:
 *     summary: Get class detail by class ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Classes by user ID
 */
router.get("/my-classes/:classId",  getClassesByUserId);

/**
 * @swagger
 * /students/{studentId}/registerable-classes:
 *   get:
 *     summary: Get registerable classes for a student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registerable classes
 */
router.get("/:studentId/registerable-classes",  getRegisterableClasses);

/**
 * @swagger
 * /students/register-class/{classid}:
 *   post:
 *     summary: Enroll in a class
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: classid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Enrolled in class
 */
router.post("/register-class/:classid",  enrollInClass);

/**
 * @swagger
 * /students/register-class/{classid}:
 *   delete:
 *     summary: Unenroll from a class
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: classid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unenrolled from class
 */
router.delete("/register-class/:classid",  unenrollFromClass);
module.exports = router;
