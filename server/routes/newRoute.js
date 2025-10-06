const express = require("express");
const router = express.Router();
const { getAllNews, addNews } = require("../controllers/newController");

// Get all news
router.get("/", getAllNews);

// Add a news item
router.post("/add", addNews);

module.exports = router;


