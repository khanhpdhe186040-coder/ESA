const express = require("express");
const { getAllRole } = require("../controllers/roleController");

const roleRouter = express.Router();

roleRouter.get("/", getAllRole);

module.exports = roleRouter;
