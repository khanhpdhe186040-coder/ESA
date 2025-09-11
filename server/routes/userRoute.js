const express = require("express");
const {
  register,
  login,
  getAllUser,
  getUserById,
  updateUserById,
  GetUserByRoleId,
} = require("../controllers/userController");
const userRouter = express.Router();

const authAdmin = require("../middlewares/authAdmin");

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered
 */
userRouter.post("/register", register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: User logged in
 */
userRouter.post("/login", login);

/**
 * @swagger
 * /users/by-role:
 *   get:
 *     summary: Get users by role
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users by role
 */
userRouter.get("/by-role", GetUserByRoleId);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
userRouter.put("/:id", updateUserById);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
userRouter.get("/:id", getUserById);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 */
userRouter.get("/",authAdmin, getAllUser);

module.exports = userRouter;
