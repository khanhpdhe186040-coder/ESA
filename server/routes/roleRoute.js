const express = require("express");
const { getAllRole } = require("../controllers/roleController");

const roleRouter = express.Router();

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of all roles
 */
roleRouter.get("/", getAllRole);

module.exports = roleRouter;
