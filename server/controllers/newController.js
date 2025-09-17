const New = require("../models/New");

// GET /api/news
const getAllNews = async (req, res) => {
  try {
    const news = await New.find()
      .sort({ postDate: -1 })
      .populate({ path: "userId", select: "userName" })
      .lean();

    const data = news.map((item) => ({
      ...item,
      userName: item.userId && item.userId.userName ? item.userId.userName : null,
      userId: item.userId && item.userId._id ? item.userId._id : item.userId,
    }));

    res.status(200).json({
      success: true,
      message: "News retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error getting all news:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// POST /api/news/add
const addNews = async (req, res) => {
  try {
    const { userId, title, content, postDate } = req.body;

    const created = await New.create({
      userId,
      title,
      content,
      postDate,
    });

    res.status(201).json({
      success: true,
      message: "News created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error creating news:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { getAllNews, addNews };


