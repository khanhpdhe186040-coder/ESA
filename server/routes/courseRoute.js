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

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all courses
 */
router.get("/",authAdmin, getAllCourses);

/**
 * @swagger
 * /courses/add:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: Course created
 */
router.post("/add",authAdmin, createCourse);

/**
 * @swagger
 * /courses/update/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Course updated
 *       404:
 *         description: Course not found
 */
router.put("/update/:id",authAdmin, updateCourse);

/**
 * @swagger
 * /courses/delete/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted
 *       404:
 *         description: Course not found
 */
router.delete("/delete/:id",authAdmin, deleteCourse);
module.exports = router;
