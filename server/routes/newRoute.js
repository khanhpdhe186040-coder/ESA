const express = require("express");
const router = express.Router();
const { getAllNews, getNewsPaginated, addNews, getNewsById } = require("../controllers/newController");

// Get all news
router.get("/", getAllNews);

// Get news paginated
router.get("/paginated", getNewsPaginated);

// Add a news item
router.post("/add", addNews);

// Get a single news item
router.get("/:id", getNewsById);

module.exports = router;


