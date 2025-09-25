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

// GET /api/news/paginated?page=1&limit=15
const getNewsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const limit = parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 15;
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      New.find()
        .sort({ postDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "userId", select: "userName" })
        .lean(),
      New.countDocuments(),
    ]);

    const data = news.map((item) => ({
      ...item,
      userName: item.userId && item.userId.userName ? item.userId.userName : null,
      userId: item.userId && item.userId._id ? item.userId._id : item.userId,
    }));

    res.status(200).json({
      success: true,
      message: "News retrieved successfully",
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting paginated news:", error);
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

// GET /api/news/:id
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await New.findById(id)
      .populate({ path: "userId", select: "userName" })
      .lean();
    if (!news) {
      return res.status(404).json({ success: false, message: "News not found" });
    }
    const data = {
      ...news,
      userName: news.userId && news.userId.userName ? news.userId.userName : null,
      userId: news.userId && news.userId._id ? news.userId._id : news.userId,
    };
    return res.status(200).json({ success: true, message: "News fetched successfully", data });
  } catch (error) {
    console.error("Error getting news by id:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

module.exports = { getAllNews, getNewsPaginated, addNews, getNewsById };


