const express = require("express");
const classRouter = express.Router();
const authAdmin = require("../middlewares/authAdmin");
const {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

classRouter.get("/", authAdmin, getAllClasses);

classRouter.post("/add",authAdmin, createClass);

classRouter.put("/update/:id",authAdmin, updateClass);

classRouter.delete("/delete/:id",authAdmin, deleteClass);

module.exports = classRouter;
