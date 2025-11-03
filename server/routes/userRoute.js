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
const { uploadImage } = require("../middlewares/upload");
const authAdmin = require("../middlewares/authAdmin");

userRouter.post("/register", register);

userRouter.post("/login", login);

userRouter.get("/by-role", GetUserByRoleId);

userRouter.put("/:id", uploadImage.single("image"), updateUserById);

userRouter.get("/:id", getUserById);

userRouter.get("/",authAdmin, getAllUser);

module.exports = userRouter;
