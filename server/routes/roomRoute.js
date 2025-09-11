const express = require("express");
const router = express.Router();
const { getAllRooms } = require("../controllers/roomController");

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of all rooms
 */
router.get("/", getAllRooms);

module.exports = router;
