const express = require("express");
const classRouter = express.Router();
const authAdmin = require("../middlewares/authAdmin");
const {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     responses:
 *       200:
 *         description: List of all classes
 */
classRouter.get("/", authAdmin, getAllClasses);

/**
 * @swagger
 * /classes/add:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       201:
 *         description: Class created
 */
classRouter.post("/add",authAdmin, createClass);

/**
 * @swagger
 * /classes/update/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
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
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       200:
 *         description: Class updated
 *       404:
 *         description: Class not found
 */
classRouter.put("/update/:id",authAdmin, updateClass);

/**
 * @swagger
 * /classes/delete/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class deleted
 *       404:
 *         description: Class not found
 */
classRouter.delete("/delete/:id",authAdmin, deleteClass);

module.exports = classRouter;
