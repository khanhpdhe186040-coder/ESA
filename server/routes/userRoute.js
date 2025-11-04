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
  forgotPassword,
  resetPassword
} = require("../controllers/userController");
const userRouter = express.Router();

const authAdmin = require("../middlewares/authAdmin");
const upload = require("../middlewares/upload");
// ⚠️ Các route KHÔNG có param (:id) để ở TRƯỚC
userRouter.post("/register", register);
userRouter.post("/register-for-course", registerForCourse);
userRouter.post("/forgot-password", forgotPassword);
userRouter.get("/reset-password", (req, res) => {
  res.status(200).json({ message: "Reset password link valid." });
});
userRouter.post("/reset-password", resetPassword);
userRouter.post("/login", login);
userRouter.get("/by-role", GetUserByRoleId);
userRouter.post("/enroll-existing-user", enrollExistingUser);

// --- Các route có param (:id) ĐỂ SAU CÙNG ---
userRouter.get("/", authAdmin, getAllUser);
userRouter.put("/:id", upload.single("image"), updateUserById);
userRouter.get("/:id", getUserById);

module.exports = userRouter;
