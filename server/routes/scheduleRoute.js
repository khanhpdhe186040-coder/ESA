const express = require("express");
const {
  getAllSchedule,
  createSchedule,
} = require("../controllers/scheduleController");

const scheduleRouter = express.Router();

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: List of all schedules
 */
scheduleRouter.get("/", getAllSchedule);

/**
 * @swagger
 * /schedules/add:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Schedule created
 */
scheduleRouter.post("/add", createSchedule);

module.exports = scheduleRouter;
