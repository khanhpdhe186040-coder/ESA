const express = require("express");
const {
  getAllSchedule,
  createSchedule,
} = require("../controllers/scheduleController");

const scheduleRouter = express.Router();

scheduleRouter.get("/", getAllSchedule);

scheduleRouter.post("/add", createSchedule);

module.exports = scheduleRouter;
