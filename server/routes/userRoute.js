const express = require("express");
const {
  register,
  login,
  getAllUser,
  getUserById,
  updateUserById,
  GetUserByRoleId,
  registerForCourse,
  enrollExistingUser,
} = require("../controllers/userController");
const userRouter = express.Router();

const authAdmin = require("../middlewares/authAdmin");

userRouter.post("/register", register);
userRouter.post("/register-for-course", registerForCourse);

userRouter.post("/login", login);

userRouter.get("/by-role", GetUserByRoleId);

userRouter.put("/:id", updateUserById);

userRouter.get("/:id", getUserById);

userRouter.get("/",authAdmin, getAllUser);

userRouter.post("/enroll-existing-user", enrollExistingUser);
module.exports = userRouter;
