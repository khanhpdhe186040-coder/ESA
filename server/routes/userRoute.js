const express = require("express");
const {
  register,
  login,
  getAllUser,
  getUserById,
  updateUserById,
  GetUserByRoleId,
  registerForCourse,
} = require("../controllers/userController");
const userRouter = express.Router();

const authAdmin = require("../middlewares/authAdmin");
const upload = require("../middlewares/upload");
userRouter.post("/register", register);
userRouter.post("/register-for-course", registerForCourse);

userRouter.post("/login", login);

userRouter.get("/by-role", GetUserByRoleId);

// userRouter.put("/:id", updateUserById);
userRouter.put("/:id", upload.single("image"), updateUserById);

userRouter.get("/:id", getUserById);

userRouter.get("/",authAdmin, getAllUser);

module.exports = userRouter;
